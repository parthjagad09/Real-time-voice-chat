import { FiPhoneOff, FiAlertTriangle, FiClock, FiDownload, FiArrowLeft, FiRefreshCw } from "react-icons/fi";

const fmtDuration = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function EndedScreen({ status, statusText, duration, messages, onBack }) {
  const failed = status === "failed";
  const chat   = messages.filter((m) => !m.system);

  const download = () => {
    const lines = chat.map(
      (m) => `[${new Date(m.ts).toLocaleString()}] ${m.name} (${m.role}): ${m.text}`
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "transcript.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="card ended" role="main" aria-label={failed ? "Connection error" : "Call ended"}>
      <div className={`ended-icon ${failed ? "fail" : "success"}`}>
        {failed
          ? <FiAlertTriangle size={30} strokeWidth={1.8} />
          : <FiPhoneOff      size={30} strokeWidth={1.8} />
        }
      </div>

      <h1>{failed ? "Connection Problem" : "Call Ended"}</h1>

      {statusText && <p className="ended-status-text">{statusText}</p>}

      {!failed && duration > 0 && (
        <div className="duration-chip">
          <FiClock size={14} />
          Duration: <strong>{fmtDuration(duration)}</strong>
        </div>
      )}

      <div className="controls">
        <button id="back-btn" className="btn primary" onClick={onBack}>
          {failed
            ? <><FiRefreshCw size={14} /> Try Again</>
            : <><FiArrowLeft size={14} /> Back to Start</>
          }
        </button>

        {chat.length > 0 && (
          <button id="download-transcript-btn" className="btn" onClick={download}>
            <FiDownload size={14} /> Transcript
          </button>
        )}
      </div>
    </div>
  );
}
