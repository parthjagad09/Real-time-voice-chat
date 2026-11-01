import { useState } from "react";
import {
  FiMic, FiUser, FiHeadphones, FiHash, FiPhone,
  FiInfo, FiAlertCircle,
} from "react-icons/fi";

const saved = () => {
  try { return JSON.parse(sessionStorage.getItem("vc-join")) || {}; } catch { return {}; }
};

export default function JoinScreen({ onJoin, notice }) {
  const s = saved();
  const [name,   setName]   = useState(s.name   || "");
  const [role,   setRole]   = useState(s.role   || "customer");
  const [roomId, setRoomId] = useState(s.roomId || "");
  const [error,  setError]  = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const trimmedName   = name.trim();
    const trimmedRoomId = roomId.trim().toLowerCase();
    if (!trimmedName)   { setError("Please enter your name.");    return; }
    if (!trimmedRoomId) { setError("Please enter a room code."); return; }
    const data = { name: trimmedName, role, roomId: trimmedRoomId };
    sessionStorage.setItem("vc-join", JSON.stringify(data));
    onJoin(data);
  };

  return (
    /* Outer shell: two columns on desktop, single column on mobile */
    <div className="join-shell">

      {/* ── LEFT: Branding panel ── */}
      <div className="join-brand" aria-hidden="true">
        <div className="brand-inner">
          <div className="brand-logo">
            <FiMic size={28} strokeWidth={2} />
          </div>
          <h1 className="brand-title">Voice Chat</h1>
          <p className="brand-sub">
            Crystal-clear, real-time voice calls between customers and agents.
          </p>

          <ul className="brand-features" aria-hidden="true">
            {[
              { icon: <FiMic size={15} />,        text: "Two-way WebRTC audio" },
              { icon: <FiHeadphones size={15} />,  text: "Customer & Agent roles" },
              { icon: <FiHash size={15} />,        text: "Private room codes" },
            ].map(({ icon, text }) => (
              <li key={text}>
                <span className="feat-icon">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── RIGHT: Form card ── */}
      <form className="join-form card" onSubmit={submit} noValidate>

        {/* Mobile-only header (hidden on desktop where brand panel is visible) */}
        <div className="join-form-header mobile-only">
          <div className="logo-icon-sm">
            <FiMic size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="join-form-title">Voice Chat</h2>
            <p className="join-form-sub">Start a call between a Customer and an Agent.</p>
          </div>
        </div>

        <div className="join-form-body">
          <div className="join-form-heading desktop-only">
            <h2>Join a Call</h2>
            <p className="form-sub-text">Enter your details and the shared room code to begin.</p>
          </div>

          {/* External notice banner */}
          {notice && (
            <div className={`banner ${notice.type === "info" ? "info" : "error"}`}>
              <FiInfo size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{notice.text}</span>
            </div>
          )}

          {/* Name */}
          <label htmlFor="join-name">Your name</label>
          <div className="input-wrap">
            <FiUser size={16} className="input-icon" />
            <input
              id="join-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Priya Sharma"
              maxLength={30}
              autoFocus
              autoComplete="name"
              className="has-icon"
            />
          </div>

          {/* Role */}
          <fieldset>
            <legend>I am joining as…</legend>
            <div className="roles">
              {[
                { value: "customer", label: "Customer", Icon: FiUser },
                { value: "agent",    label: "Agent",    Icon: FiHeadphones },
              ].map(({ value, label, Icon }) => (
                <label key={value} className={`role ${role === value ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                  />
                  <Icon size={18} strokeWidth={2} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Room code */}
          <label htmlFor="join-room">Room code</label>
          <div className="input-wrap">
            <FiHash size={16} className="input-icon" />
            <input
              id="join-room"
              type="text"
              value={roomId}
              onChange={(e) => { setRoomId(e.target.value); setError(""); }}
              placeholder="e.g. support-session-42"
              maxLength={30}
              autoComplete="off"
              spellCheck={false}
              className="has-icon"
            />
          </div>

          {/* Inline validation error */}
          {error && (
            <span className="field-error" role="alert">
              <FiAlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </span>
          )}

          {/* CTA */}
          <button className="btn primary btn-full" type="submit" id="start-call-btn">
            <FiPhone size={16} strokeWidth={2.5} />
            Start Call
          </button>

          {/* Tip */}
          <div className="join-footer">
            <FiInfo size={14} className="tip-icon" />
            <p>
              To start a call, open the application in two browser tabs. Join one as a <strong>Customer</strong> & the other as an
              <strong> Agent</strong>, using the same room code in both.  
              The call will connect automatically once both participants have joined.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
