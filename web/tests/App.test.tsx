import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";

// Answers fetch calls from a table of path -> [status, body].
function mockApi(routes: Record<string, [number, unknown]>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const route = routes[String(input)];
    if (!route) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }
    const [status, body] = route;
    return new Response(JSON.stringify(body), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("shows the API health and version", async () => {
    const fetchMock = mockApi({
      "/api/health": [200, { status: "ok" }],
      "/api/version": [200, { version: "v1.2.3" }],
      "/api/time": [200, { time: "2026-10-23T13:20:00Z" }],
    });

    render(<App />);

    expect(screen.getByText("Checking the API…")).toBeTruthy();
    expect((await screen.findByText("v1.2.3")).tagName).toBe("CODE");
    expect(screen.getByText("ok").tagName).toBe("STRONG");
    expect(screen.getByText("Server time: 2026-10-23T13:20:00Z")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("shows an error when the API fails", async () => {
    mockApi({
      "/api/health": [500, { error: "Internal server error" }],
      "/api/version": [200, { version: "v1.2.3" }],
      "/api/time": [200, { time: "2026-10-23T13:20:00Z" }],
    });

    render(<App />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "API unavailable: GET /health failed with 500",
    );
  });

  it("shows an error when the server time fails", async () => {
    mockApi({
      "/api/health": [200, { status: "ok" }],
      "/api/version": [200, { version: "v1.2.3" }],
      "/api/time": [500, { error: "Internal server error" }],
    });

    render(<App />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "API unavailable: GET /time failed with 500",
    );
    expect(screen.queryByText(/Server time:/)).toBeNull();
  });
});
