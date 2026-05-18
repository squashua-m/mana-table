import type { BrowserContext } from "@playwright/test";
import { basics, booster, sets } from "./scryfallData";

// Intercepts the three Scryfall endpoints the app calls during the draft
// happy path: set list, booster generation, and named-card lookup (basics).
// Everything else falls through unintercepted — the test should not be
// hitting any other api.scryfall.com paths.
export async function mockScryfall(context: BrowserContext): Promise<void> {
  await context.route("https://api.scryfall.com/sets", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: sets }),
    })
  );

  await context.route(/https:\/\/api\.scryfall\.com\/sets\/.+\/booster/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: booster }),
    })
  );

  await context.route(/https:\/\/api\.scryfall\.com\/cards\/named/, (route) => {
    const url = new URL(route.request().url());
    const name = url.searchParams.get("exact") ?? "Forest";
    const card = basics[name] ?? basics.Forest;
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(card),
    });
  });
}
