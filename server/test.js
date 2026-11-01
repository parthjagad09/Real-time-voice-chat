import { io } from "socket.io-client";
const URL = process.env.URL || "http://localhost:3001";
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exit(1); } console.log("ok  -", m); };
const wait = (s, ev) => new Promise((r) => s.once(ev, r));

const a = io(URL), b = io(URL), c = io(URL);
await Promise.all([wait(a, "connect"), wait(b, "connect"), wait(c, "connect")]);

const r1 = await new Promise((r) => a.emit("join", { roomId: "T1", role: "customer", name: "Ann" }, r));
assert(r1.ok && r1.peer === null, "customer joins empty room");

const waitingGetsPeer = wait(a, "peer-joined");
const r2 = await new Promise((r) => b.emit("join", { roomId: "t1", role: "agent", name: "Bob" }, r));
const pj = await waitingGetsPeer;
assert(r2.ok && r2.peer.name === "Ann", "agent joins and sees customer");
assert(pj.shouldOffer === true && pj.peer.name === "Bob", "waiting user told to create the offer");

const r3 = await new Promise((r) => c.emit("join", { roomId: "t1", role: "agent", name: "Eve" }, r));
assert(!r3.ok, "duplicate role / third user rejected");

const sig = wait(b, "signal");
a.emit("signal", { description: { type: "offer", sdp: "x" } });
assert((await sig).description.type === "offer", "signal relayed to the other user");

const msg = wait(a, "chat-message");
b.emit("chat-message", { text: "hello" });
const m = await msg;
assert(m.text === "hello" && m.role === "agent" && m.ts, "chat message broadcast with timestamp");

const left = wait(b, "peer-left");
a.disconnect();
assert((await left).role === "customer", "peer-left sent when one user disconnects");

[b, c].forEach((s) => s.disconnect());
console.log("\nAll server tests passed");
process.exit(0);
