import { test, expect, type Page } from "@playwright/test";
import { mockScryfall } from "./fixtures/mockScryfall";

const TOTAL_PICKS = 45;
const MAIN_TARGET = 15;
const FOREST_TARGET = 5;

// Pick the first available card in the current pack. Picks become disabled
// immediately after a click (pickedThisRound → true), so each loop iteration
// waits for a fresh enabled button — which only appears once the round
// advances and a new pack lands in front of this seat.
async function pickFirstCard(page: Page): Promise<void> {
  const pickable = page
    .locator('button[aria-label^="Pick "]:not([disabled])')
    .first();
  await pickable.waitFor({ state: "visible", timeout: 30_000 });
  await pickable.click();
}

async function allocateAndFinish(page: Page): Promise<void> {
  // Wait for the deck builder
  await expect(page.getByRole("heading", { name: "Build your deck" })).toBeVisible({
    timeout: 30_000,
  });

  // Toggle the first MAIN_TARGET pool cards into the main deck. The DeckBuilder
  // renders every pool card as an aria-pressed toggle button, so the count
  // here always equals 45 once picks are loaded.
  const poolToggles = page.locator("button[aria-pressed]");
  await expect(poolToggles).toHaveCount(TOTAL_PICKS, { timeout: 15_000 });
  for (let i = 0; i < MAIN_TARGET; i++) {
    await poolToggles.nth(i).click();
  }

  // Tap five Forests so basics show up on the canvas too.
  const addForest = page.getByRole("button", { name: "Add one Forest" });
  for (let i = 0; i < FOREST_TARGET; i++) {
    await addForest.click();
  }

  await page
    .getByRole("button", { name: "Finish deck and enter the canvas" })
    .click();
}

test("happy path: 2 players → draft → build → canvas", async ({ browser }) => {
  // Unique room ID so each run starts with empty Liveblocks storage and
  // doesn't collide with the default room used for local dev.
  const roomId = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const url = `/?room=${roomId}`;

  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  await mockScryfall(ctxA);
  await mockScryfall(ctxB);

  const pA = await ctxA.newPage();
  const pB = await ctxB.newPage();

  // Capture console + page errors for easier diagnosis on failure.
  for (const [name, p] of [["A", pA], ["B", pB]] as const) {
    p.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        // eslint-disable-next-line no-console
        console.log(`[${name}:${msg.type()}]`, msg.text());
      }
    });
    p.on("pageerror", (err) => {
      // eslint-disable-next-line no-console
      console.log(`[${name}:pageerror]`, err.message);
    });
  }

  try {
    // 1. Both players land on the lobby.
    await pA.goto(url);
    await pB.goto(url);

    await expect(pA.getByRole("heading", { name: "Mana Table" })).toBeVisible();
    await expect(pB.getByRole("heading", { name: "Mana Table" })).toBeVisible();

    // 2. Player A hosts: New Draft → (SetPicker auto-selects) → Start Draft.
    await pA.getByRole("button", { name: "Start a new draft" }).click();
    // The Start button enables only once the SetPicker auto-selects a set,
    // which happens as soon as the mocked /sets response resolves.
    const startBtn = pA.getByRole("button", { name: "Start the draft" });
    await expect(startBtn).toBeEnabled({ timeout: 15_000 });
    await startBtn.click();

    // 3. Both clients pick 45 cards. We run them in parallel each round so
    //    the coordinator can advance as soon as both have picked.
    for (let i = 0; i < TOTAL_PICKS; i++) {
      await Promise.all([pickFirstCard(pA), pickFirstCard(pB)]);
    }

    // 4. Both reach the deck builder, allocate, and click Done.
    await Promise.all([allocateAndFinish(pA), allocateAndFinish(pB)]);

    // 5. Both land on the canvas. ThemeSwitcher is the simplest canvas-only
    //    UI element: if it's visible, MtgCanvas mounted.
    await expect(
      pA.getByRole("button", { name: /switch to (dark|light) mode/i })
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      pB.getByRole("button", { name: /switch to (dark|light) mode/i })
    ).toBeVisible({ timeout: 30_000 });
  } finally {
    await ctxA.close();
    await ctxB.close();
  }
});
