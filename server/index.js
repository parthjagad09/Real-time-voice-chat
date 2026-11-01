import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
// Allowed origins: the built app (same origin) and the Vite dev server
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || ["http://localhost:3001", "http://localhost:5173"];

const clientDir = path.join(__dirname, "../client");
const distPath = path.join(clientDir, "dist");

/** Build the React app if client/dist doesn't exist yet. */
function ensureClientBuilt() {
  if (fs.existsSync(path.join(distPath, "index.html"))) return true;

  console.log("client/dist not found - building the React app (first run only)...");
  try {
    if (!fs.existsSync(path.join(clientDir, "node_modules"))) {
      execSync("npm install", { cwd: clientDir, stdio: "inherit" });
    }
    execSync("npm run build", { cwd: clientDir, stdio: "inherit" });
    return fs.existsSync(path.join(distPath, "index.html"));
  } catch (err) {
    console.error("Could not build the client automatically:", err.message);
    return false;
  }
}

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_ORIGIN } });

/**
 * rooms: Map<roomId, { customer?: Participant, agent?: Participant }>
 * Participant: { socketId, name, role }
 * A room holds at most ONE customer and ONE agent => max 2 people per call.
 */
const rooms = new Map();
const ROLES = ["customer", "agent"];
const otherRole = (r) => (r === "customer" ? "agent" : "customer");

app.get("/health", (_req, res) => res.json({ ok: true, rooms: rooms.size }));

// Serve the React app from the same server (http://localhost:3001)
if (ensureClientBuilt()) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
} else {
  app.get("/", (_req, res) => {
    res
      .status(503)
      .send(
        "Voice Chat server is running, but the client is not built. " +
          "Run `npm run build` in the root folder, or start the client with `npm run client` and open http://localhost:5173"
      );
  });
}

/** Remove a socket from its room and tell the other participant the call ended. */
function leaveRoom(socket, reason = "left") {
  const { roomId, role } = socket.data;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (room && room[role]?.socketId === socket.id) {
    delete room[role];
    // Notify whoever is still in the room -> "Call Ended"
    socket.to(roomId).emit("peer-left", { role, name: socket.data.name, reason });
    if (!room.customer && !room.agent) rooms.delete(roomId);
  }
  socket.leave(roomId);
  socket.data = {};
}

io.on("connection", (socket) => {
  socket.on("join", ({ roomId, role, name } = {}, ack = () => {}) => {
    roomId = String(roomId || "").trim().toLowerCase();
    name = String(name || "").trim().slice(0, 30);

    if (!roomId || !name || !ROLES.includes(role)) {
      return ack({ ok: false, error: "Name, role and room code are required." });
    }
    if (socket.data.roomId) leaveRoom(socket); // safety: one room per socket

    const room = rooms.get(roomId) || {};
    if (room[role]) {
      return ack({
        ok: false,
        error: `This room already has a ${role}. Pick the other role or a different room code.`,
      });
    }

    room[role] = { socketId: socket.id, name, role };
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.data = { roomId, role, name };

    const peer = room[otherRole(role)];
    ack({ ok: true, peer: peer ? { name: peer.name, role: peer.role } : null });

    if (peer) {
      // The user who was already waiting creates the WebRTC offer.
      io.to(peer.socketId).emit("peer-joined", {
        peer: { name, role },
        shouldOffer: true,
      });
      socket.emit("peer-joined", {
        peer: { name: peer.name, role: peer.role },
        shouldOffer: false,
      });
    }
  });

  // WebRTC signaling relay (offer / answer / ICE candidates)
  socket.on("signal", (data) => {
    if (socket.data.roomId) socket.to(socket.data.roomId).emit("signal", data);
  });

  // Chat / transcript: server stamps the time so both clients agree
  socket.on("chat-message", ({ text } = {}) => {
    const { roomId, role, name } = socket.data;
    text = String(text || "").trim().slice(0, 1000);
    if (!roomId || !text) return;
    io.to(roomId).emit("chat-message", {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      name,
      text,
      ts: Date.now(),
    });
  });

  socket.on("mute-state", ({ muted } = {}) => {
    if (socket.data.roomId) socket.to(socket.data.roomId).emit("peer-mute", { muted: !!muted });
  });

  socket.on("leave", () => leaveRoom(socket, "ended"));
  socket.on("disconnect", () => leaveRoom(socket, "disconnected"));
});

server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));