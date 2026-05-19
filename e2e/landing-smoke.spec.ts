// Smoke test for the new landing page and room-routing behavior added in
// the URL-per-room refactor. Verifies that `/` shows the landing UI and that
// the New Draft and Join paths both route into a room.
import { test, expect } from "@playwright/test";

test("landing page renders New Draft and Join controls", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Create a new draft" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Draft code" })).toBeVisible();
});

test("New Draft generates a room slug and auto-claims host", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create a new draft" }).click();
  await page.waitForURL(/\?room=[a-z0-9-]+/);
  await expect(page.getByRole("heading", { name: "Mana Table" })).toBeVisible();
  // Auto-host means the host-setup UI (Start Draft button) shows directly —
  // no "New Draft" button to tap a second time.
  await expect(page.getByRole("button", { name: "Start the draft" })).toBeVisible();
});

test("Join navigates to the typed room with the join flag", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Draft code" }).fill("quiet-tiger-42");
  await page.getByRole("button", { name: "Join draft" }).click();
  await page.waitForURL(/\?room=quiet-tiger-42.*join=1/);
});

test("Empty code shows an inline error", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Join draft" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("Home button on the lobby returns to the landing page", async ({ page }) => {
  await page.goto("/?room=smoke-test-room");
  await expect(page.getByRole("heading", { name: "Mana Table" })).toBeVisible();
  await page.getByRole("button", { name: "Leave this room and go home" }).click();
  await page.waitForURL((url) => !url.searchParams.has("room"));
  await expect(page.getByRole("button", { name: "Create a new draft" })).toBeVisible();
});
