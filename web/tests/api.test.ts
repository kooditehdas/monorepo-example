import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGreeting } from "../src/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchGreeting", () => {
  it.each([
    ["Ada", "/api/greet?name=Ada"],
    ["a&b=c", "/api/greet?name=a%26b%3Dc"],
    ["x#y", "/api/greet?name=x%23y"],
    ["1+1 100%", "/api/greet?name=1%2B1+100%25"],
  ])("encodes %j in the query string", async (name, url) => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ message: `Hello, ${name}!` }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchGreeting(name)).toBe(`Hello, ${name}!`);
    expect(fetchMock).toHaveBeenCalledWith(url);
    expect(new URL(url, "http://localhost").searchParams.get("name")).toBe(name);
  });
});
