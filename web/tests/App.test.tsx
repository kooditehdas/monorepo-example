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
    });

    render(<App />);

    expect(screen.getByText("Checking the API…")).toBeTruthy();
    expect((await screen.findByText("v1.2.3")).tagName).toBe("CODE");
    expect(screen.getByText("ok").tagName).toBe("STRONG");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows an error when the API fails", async () => {
    mockApi({
      "/api/health": [500, { error: "Internal server error" }],
      "/api/version": [200, { version: "v1.2.3" }],
    });

    render(<App />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "API unavailable: GET /health failed with 500",
    );
  });
});
