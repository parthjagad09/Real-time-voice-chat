import { useEffect, useRef, useState } from "react";
import {
  FiMic, FiMicOff, FiPhoneOff, FiMessageSquare,
  FiSend, FiUser, FiClock, FiInfo,
} from "react-icons/fi";

const fmtDuration = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const STATUS_LABEL = {
  waiting:    "Waiting",
  connecting: "Connecting",
  connected:  "Connected",
};

const roleLabel = (r) => (r === "agent" ? "Agent" : "Customer");

export default function CallScreen({ call }) {
  const {
    status, statusText, me, peer, messages, muted, peerMuted,
    duration, audioRef, sendMessage, toggleMute, endCall,
  } = call;

  const [text, setText] = useState("");
  const listRef         = useRef(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  const avatarChar = peer ? peer.name.charAt(0).toUpperCase() : null;

  return (
    <div className="call-shell">
      {/* Hidden audio element for remote stream — must stay mounted */}
      <audio ref={audioRef} autoPlay />

      {/* ── LEFT: Call panel ── */}
      <section className="card call-panel" aria-label="Call information">

        <div className="panel-top">
          {/* Status pill */}
          <div className={`pill ${status}`} role="status" aria-live="polite">
            <span className="dot" />
            {STATUS_LABEL[status] || status}
          </div>
          {statusText && <p className="status-text">{statusText}</p>}
        </div>

        {/* Peer avatar & info */}
        <div className="panel-middle">
          <div className={`avatar ${peer ? "" : "avatar-waiting"}`}>
            {avatarChar ?? <FiUser size={32} strokeWidth={1.5} />}
          </div>

          <p className="peer-name">{peer ? peer.name : "Waiting…"}</p>

          <p className="peer-role">
            {peer ? (
              <>
                {roleLabel(peer.role)}
                {peerMuted && (
                  <span className="muted-badge">
                    <FiMicOff size={10} /> Muted
                  </span>
                )}
              </>
            ) : (
              "No one connected yet"
            )}
          </p>

          {/* Timer */}
          <div className="timer-block">
            <FiClock size={13} className="timer-clock-icon" />
            <div className="timer" aria-label="Call duration">{fmtDuration(duration)}</div>
            <div className="timer-label">Duration</div>
          </div>
        </div>

        {/* Bottom section: my info + controls */}
        <div className="panel-bottom">
          <div className="my-info">
            <FiUser size={12} />
            <strong>{me.name}</strong>
            <span className="dot-sep">·</span>
            {roleLabel(me.role)}
            <span className="dot-sep">·</span>
            <span className="room-code">{me.roomId}</span>
          </div>

          <div className="call-controls">
            <button
              id="mute-btn"
              className={`btn ${muted ? "warn" : ""}`}
              onClick={toggleMute}
              title={muted ? "Unmute microphone" : "Mute microphone"}
              aria-pressed={muted}
            >
              {muted
                ? <><FiMicOff size={15} strokeWidth={2} /> Unmute</>
                : <><FiMic    size={15} strokeWidth={2} /> Mute</>
              }
            </button>

            <button
              id="end-call-btn"
              className="btn danger"
              onClick={endCall}
              title="End this call"
            >
              <FiPhoneOff size={15} strokeWidth={2} /> End Call
            </button>
          </div>
        </div>
      </section>

      {/* ── RIGHT: Chat panel ── */}
      <section className="card chat-panel" aria-label="Live chat">
        <div className="chat-header">
          <div className="chat-header-left">
            <FiMessageSquare size={16} strokeWidth={2} />
            <h3>Live Chat</h3>
          </div>
          <p className="chat-sub">Real-time for both participants</p>
        </div>

        {/* Message list */}
        <div
          className="messages"
          ref={listRef}
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.length === 0 && (
            <div className="empty-chat">
              <FiMessageSquare size={26} strokeWidth={1.5} className="empty-icon" />
              <span>No messages yet.<br />Start the conversation!</span>
            </div>
          )}

          {messages.map((m) =>
            m.system ? (
              <div key={m.id} className="sys" role="note">
                <FiInfo size={11} style={{ flexShrink: 0 }} />
                {m.text} · {fmtTime(m.ts)}
              </div>
            ) : (
              <div
                key={m.id}
                className={`msg ${m.role === me.role ? "mine" : "theirs"}`}
              >
                <div className="meta">
                  <strong>{m.name}</strong> · {roleLabel(m.role)} · {fmtTime(m.ts)}
                </div>
                <div className="bubble">{m.text}</div>
              </div>
            )
          )}
        </div>

        {/* Composer */}
        <form className="composer" onSubmit={submit}>
          <input
            id="chat-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={peer ? "Type a message…" : "Waiting for the other person…"}
            maxLength={1000}
            disabled={!peer}
            autoComplete="off"
            aria-label="Chat message"
          />
          <button
            id="send-btn"
            className="btn primary send-btn"
            type="submit"
            disabled={!peer || !text.trim()}
            aria-label="Send message"
            title="Send message"
          >
            <FiSend size={15} strokeWidth={2.5} />
            <span className="send-label">Send</span>
          </button>
        </form>
      </section>
    </div>
  );
}
