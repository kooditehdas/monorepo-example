import { useEffect, useState } from "react";
import { type ApiStatus, fetchGreeting, fetchStatus } from "./api";

type State =
  | { kind: "loading" }
  | { kind: "ok"; status: ApiStatus }
  | { kind: "error"; message: string };

function Greeting() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (name === "") return;
    fetchGreeting(name).then(setMessage);
  }, [name]);

  return (
    <section>
      <label>
        Your name <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {message && <p>{message}</p>}
    </section>
  );
}

export function App() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetchStatus(controller.signal)
      .then((status) => setState({ kind: "ok", status }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      });
    return () => controller.abort();
  }, []);

  return (
    <main>
      <h1>monorepo-example</h1>
      {state.kind === "loading" && <p>Checking the API…</p>}
      {state.kind === "ok" && (
        <>
          <p>
            API is <strong>{state.status.health}</strong>, version{" "}
            <code>{state.status.version}</code>
          </p>
          <p>Server time: {state.status.time}</p>
        </>
      )}
      {state.kind === "error" && <p role="alert">API unavailable: {state.message}</p>}
      <Greeting />
    </main>
  );
}
