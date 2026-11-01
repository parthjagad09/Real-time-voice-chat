import { useCall } from "./hooks/useCall.js";
import JoinScreen from "./components/JoinScreen.jsx";
import CallScreen from "./components/CallScreen.jsx";
import EndedScreen from "./components/EndedScreen.jsx";

export default function App() {
  const call = useCall();
  const { status } = call;

  const view =
    status === "idle" ? (
      <JoinScreen onJoin={call.join} />
    ) : status === "ended" || status === "failed" ? (
      <EndedScreen
        status={status}
        statusText={call.statusText}
        duration={call.duration}
        messages={call.messages}
        onBack={call.reset}
      />
    ) : (
      <CallScreen call={call} />
    );

  return <main className="app">{view}</main>;
}
