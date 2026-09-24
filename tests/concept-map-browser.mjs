import { expect } from "@playwright/test";
import assert from "node:assert/strict";
import {
  launchBrowser,
  getAppUrl,
  collectPageErrors,
  stubGoatCounter,
} from "./browser-setup.mjs";
import { mapRegions } from "../src/concept-map-data.js";

const browser = await launchBrowser();
const url = getAppUrl();
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  await stubGoatCounter(page);
  collectPageErrors(page, errors);
  await page.goto(url);
  await page.locator(".concept-map-card").click();
  await expect(page).toHaveURL(`${url}?lesson=concept-map`);
  await expect(page.locator("h1")).toHaveText("How the pieces fit together.");
  await expect(page.locator("[data-region]")).toHaveCount(4);
  await expect(page.locator("#map-detail")).toBeHidden();
  const progress = await page.evaluate(() =>
    localStorage.getItem("causal-sandbox-progress"),
  );
  await page.screenshot({
    path: "/tmp/concept-map-desktop.png",
    fullPage: true,
  });

  await page.locator('[data-region="question"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#map-detail-title")).toBeFocused();
  await expect(page.locator("#map-insight")).toContainText(
    "The missing future",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#map-detail")).toBeHidden();
  await expect(page.locator('[data-region="question"]')).toBeFocused();

  // Every concept and its cross-region connection must be usable, including optional lessons.
  for (const region of mapRegions) {
    await page.locator(`[data-region="${region.id}"]`).click();
    for (const concept of region.concepts) {
      await page.locator(`[data-concept="${concept.id}"]`).click();
      await expect(page.locator("#map-insight h3")).toHaveText(concept.name);
      await expect(page.locator(".map-lesson-links a")).toHaveCount(
        concept.lessons.length,
      );
      await expect(
        page.locator(`[data-region="${concept.connection[0]}"]`),
      ).toHaveAttribute("data-connected", "");
    }
    await page.getByRole("button", { name: "Close region" }).click();
  }
  await page.locator('[data-region="evidence"]').click();
  await page.locator('[data-concept="trimming"]').click();
  await expect(page.locator(".map-connection")).toContainText(
    "whose effect we estimate",
  );
  await page.locator("[data-target]").click();
  await expect(page.locator("#map-detail-title")).toHaveText(
    "What would change?",
  );
  await expect(page.locator("#map-detail-title")).toBeFocused();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("causal-sandbox-progress")),
    progress,
  );

  await page.locator('[data-region="methods"]').click();
  await page
    .locator('.map-lesson-links a[href$="inverse-probability-weighting/"]')
    .click();
  await expect(page.locator("h1")).toHaveText("Adjustment with IPW");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await page.getByRole("link", { name: "Concept map", exact: true }).click();
  await expect(page.locator("#map-detail")).toBeHidden();
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox").fill("concept map");
  await expect(
    page.locator('#search-results a[href*="concept-map"]').first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  for (const theme of ["light", "dark"]) {
    await page.getByLabel("Color theme").selectOption(theme);
    await page.screenshot({
      path: `/tmp/concept-map-${theme}.png`,
      fullPage: true,
    });
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.locator('[data-region="evidence"]').click();
      await page.locator('[data-concept="trimming"]').click();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${theme} overflow at ${width}px`,
      );
      await expect(page.locator(".map-connection")).toContainText(
        "Removing people",
      );
      if (width === 390)
        await page.screenshot({
          path: `/tmp/concept-map-phone-${theme}.png`,
          fullPage: true,
        });
      await page.getByRole("button", { name: "Close region" }).click();
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
  }

  await page.getByRole("link", { name: "Start the journey" }).click();
  await expect(page.locator("h1")).toHaveText(
    "Did treatment help this patient?",
  );
  for (const entry of ["introduction", "learn", "topics"]) {
    await page.goto(`${url}?lesson=${entry}`);
    await expect(page.locator(".concept-map-card")).toBeVisible();
  }
  assert.deepEqual(errors, []);
  console.log(
    "Concept map: discovery, concepts, connected regions, keyboard, lessons, themes, and phone layouts passed.",
  );
} finally {
  await browser.close();
}
