import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// STUN lets browsers discover their public address. For users behind strict
// NATs/firewalls a TURN server would be needed too (see README).
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

/**
 * status: idle | waiting | connecting | connected | ended | failed
 */
export function useCall() {
  const [status, setStatus] = useState("idle");
  const [statusText, setStatusText] = useState("");
  const [me, setMe] = useState(null);
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [muted, setMuted] = useState(false);
  const [peerMuted, setPeerMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const signalQueue = useRef(Promise.resolve()); // serialises signaling messages
  const endedRef = useRef(false);

  const addSystemMessage = (text) =>
    setMessages((m) => [...m, { id: `sys-${Date.now()}-${m.length}`, system: true, text, ts: Date.now() }]);

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startTimer = () => {
    if (timerRef.current) return;
    const start = Date.now();
    setDuration(0);
    timerRef.current = setInterval(() => setDuration(Math.floor((Date.now() - start) / 1000)), 1000);
  };

  /** Release mic, peer connection and socket. */
  const cleanup = useCallback(() => {
    stopTimer();
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    socketRef.current?.removeAllListeners();
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const finish = useCallback(
    (newStatus, text) => {
      if (endedRef.current) return;
      endedRef.current = true;
      cleanup();
      setStatus(newStatus);
      setStatusText(text);
    },
    [cleanup]
  );

  /** Build the RTCPeerConnection once both users are in the room. */
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    streamRef.current.getTracks().forEach((t) => pc.addTrack(t, streamRef.current));

    pc.onicecandidate = (e) => {
      if (e.candidate) socketRef.current?.emit("signal", { candidate: e.candidate });
    };

    pc.ontrack = (e) => {
      if (audioRef.current) {
        audioRef.current.srcObject = e.streams[0];
        audioRef.current.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (endedRef.current) return;
      switch (pc.connectionState) {
        case "connected":
          setStatus("connected");
          setStatusText("Connected");
          startTimer();
          break;
        case "disconnected":
          setStatusText("Connection unstable… trying to recover");
          break;
        case "failed":
          finish("failed", "Could not establish an audio connection. Check your network and try again.");
          break;
        default:
      }
    };
    return pc;
  }, [finish]);

  const handleSignal = useCallback(async ({ description, candidate }) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      if (description) {
        await pc.setRemoteDescription(description);
        if (description.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.emit("signal", { description: pc.localDescription });
        }
      } else if (candidate) {
        await pc.addIceCandidate(candidate);
      }
    } catch (err) {
      console.error("Signaling error", err);
    }
  }, []);

  const join = useCallback(
    async ({ name, role, roomId }) => {
      endedRef.current = false;
      setMessages([]);
      setPeer(null);
      setMuted(false);
      setPeerMuted(false);
      setDuration(0);
      setMe({ name, role, roomId });
      setStatus("connecting");
      setStatusText("Requesting microphone access…");

      // 1) Microphone
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch (err) {
        const denied = err.name === "NotAllowedError";
        finish(
          "failed",
          denied
            ? "Microphone permission was denied. Allow mic access in your browser and try again."
            : "No microphone found or it could not be opened."
        );
        return;
      }

      // 2) Socket
      setStatusText("Connecting to server…");
      const socket = io({ reconnection: false, timeout: 8000 });
      socketRef.current = socket;

      socket.on("connect_error", () => finish("failed", "Could not reach the server. Is it running?"));
      socket.on("disconnect", (reason) => {
        if (reason !== "io client disconnect") finish("failed", "Lost connection to the server.");
      });

      socket.on("connect", () => {
        socket.emit("join", { name, role, roomId }, (res) => {
          if (!res?.ok) return finish("failed", res?.error || "Could not join the room.");
          setStatus("waiting");
          setStatusText(`Waiting for the ${role === "customer" ? "agent" : "customer"} to join room “${roomId}”…`);
        });
      });

      socket.on("peer-joined", async ({ peer: p, shouldOffer }) => {
        setPeer(p);
        setStatus("connecting");
        setStatusText(`Connecting to ${p.name}…`);
        addSystemMessage(`${p.name} (${p.role}) joined the call`);
        const pc = createPeerConnection();
        if (shouldOffer) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("signal", { description: pc.localDescription });
        }
      });

      // Signals are processed one at a time so candidates never beat the offer
      socket.on("signal", (data) => {
        signalQueue.current = signalQueue.current.then(() => handleSignal(data));
      });

      socket.on("chat-message", (msg) => setMessages((m) => [...m, msg]));
      socket.on("peer-mute", ({ muted: m }) => setPeerMuted(m));

      socket.on("peer-left", ({ name: n }) => finish("ended", `${n || "The other user"} left the call.`));
    },
    [createPeerConnection, finish, handleSignal]
  );

  const sendMessage = useCallback((text) => {
    if (text.trim()) socketRef.current?.emit("chat-message", { text });
  }, []);

  const toggleMute = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
    socketRef.current?.emit("mute-state", { muted: !track.enabled });
  }, []);

  /** User pressed "End call" */
  const endCall = useCallback(() => {
    socketRef.current?.emit("leave");
    finish("ended", "You ended the call.");
  }, [finish]);

  const reset = useCallback(() => {
    endedRef.current = false;
    cleanup();
    setStatus("idle");
    setStatusText("");
    setPeer(null);
    setMessages([]);
  }, [cleanup]);

  // Leave cleanly on unmount (e.g. hot reload)
  useEffect(() => () => cleanup(), [cleanup]);

  return {
    status, statusText, me, peer, messages, muted, peerMuted, duration,
    audioRef, join, sendMessage, toggleMute, endCall, reset,
  };
}
