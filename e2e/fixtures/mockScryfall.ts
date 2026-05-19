import type { BrowserContext } from "@playwright/test";
import { basics, setCards, sets } from "./scryfallData";

// Intercepts the three Scryfall endpoints the app calls during the draft
// happy path: set list, card search (for pack generation), and named-card
// lookup (basics). Everything else falls through unintercepted — the test
// should not be hitting any other api.scryfall.com paths.
export async function mockScryfall(context: BrowserContext): Promise<void> {
  await context.route("https://api.scryfall.com/sets", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: sets }),
    })
  );

  // `fetchBoosterPack` calls `/cards/search?q=e:<code>` to pull the full set
  // pool, then builds packs client-side. Single page is enough for the
  // fixture (50 cards, under Scryfall's 175/page limit).
  await context.route(/https:\/\/api\.scryfall\.com\/cards\/search/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: setCards, has_more: false }),
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
