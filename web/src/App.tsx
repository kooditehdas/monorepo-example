import { useEffect, useState } from "react";
import { type ApiStatus, fetchStatus } from "./api";

type State =
  | { kind: "loading" }
  | { kind: "ok"; status: ApiStatus }
  | { kind: "error"; message: string };

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
        <p>
          API is <strong>{state.status.health}</strong>, version <code>{state.status.version}</code>
        </p>
      )}
      {state.kind === "error" && <p role="alert">API unavailable: {state.message}</p>}
    </main>
  );
}
