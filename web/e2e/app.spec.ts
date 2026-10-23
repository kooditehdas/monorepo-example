import { expect, type Page, test } from "@playwright/test";

/** Answers /api/<path> with the given JSON bodies; any other API path gets a 404. */
async function stubApi(page: Page, bodies: Record<string, unknown>) {
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, "");
    const body = bodies[path];
    return body === undefined
      ? route.fulfill({ status: 404, json: { error: "not found" } })
      : route.fulfill({ json: body });
  });
}

test("shows the API status", async ({ page }) => {
  await stubApi(page, {
    "/health": { status: "ok" },
    "/version": { version: "1.2.3" },
    "/time": { time: "2026-10-23T12:00:00Z" },
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "monorepo-example" })).toBeVisible();
  await expect(page.getByText("API is ok, version 1.2.3")).toBeVisible();
  await expect(page.getByText("Server time: 2026-10-23T12:00:00Z")).toBeVisible();
});

test("shows an error when the API is down", async ({ page }) => {
  await stubApi(page, {});

  await page.goto("/");

  await expect(page.getByRole("alert")).toHaveText("API unavailable: GET /health failed with 404");
});
