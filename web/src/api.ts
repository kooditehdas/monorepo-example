/** What the client shows about the Go API. */
export type ApiStatus = {
  health: string;
  version: string;
  /** The server's current time as an RFC 3339 UTC timestamp. */
  time: string;
};

/** GET /api<path> as JSON. The dev server (and production proxy) forwards /api to the Go API. */
async function getJSON<T>(path: string, signal: AbortSignal | null): Promise<T> {
  const res = await fetch(`/api${path}`, { signal });
  if (!res.ok) {
    throw new Error(`GET ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

/** A greeting for name from the API. */
export async function fetchGreeting(name: string): Promise<string> {
  const res = await fetch(`/api/greet?name=${name}`);
  const body = (await res.json()) as { message: string };
  return body.message;
}

/** Health, version and server time of the API, fetched in parallel. */
export async function fetchStatus(signal: AbortSignal | null = null): Promise<ApiStatus> {
  const [health, version, time] = await Promise.all([
    getJSON<{ status: string }>("/health", signal),
    getJSON<{ version: string }>("/version", signal),
    getJSON<{ time: string }>("/time", signal),
  ]);
  return { health: health.status, version: version.version, time: time.time };
}
