/** What the client shows about the Go API. */
export type ApiStatus = {
  health: string;
  version: string;
};

/** GET /api<path> as JSON. The dev server (and production proxy) forwards /api to the Go API. */
async function getJSON<T>(path: string, signal: AbortSignal | null): Promise<T> {
  const res = await fetch(`/api${path}`, { signal });
  if (!res.ok) {
    throw new Error(`GET ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Health and version of the API, fetched in parallel. */
export async function fetchStatus(signal: AbortSignal | null = null): Promise<ApiStatus> {
  const [health, version] = await Promise.all([
    getJSON<{ status: string }>("/health", signal),
    getJSON<{ version: string }>("/version", signal),
  ]);
  return { health: health.status, version: version.version };
}
