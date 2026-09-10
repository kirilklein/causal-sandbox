import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { searchEntries } from "../src/search-index.js";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const open = page.getByRole("button", { name: "Search", exact: true });
  const dialog = page.getByRole("dialog", { name: "Search topics" });
  const input = page.getByRole("searchbox", {
    name: "Find a lesson or concept",
  });
  const links = page.locator("#search-results a");
  await page.goto(url);
  await open.click();
  await expect(input).toBeFocused();
  await expect(links).toHaveCount(0);
  await input.fill("extreme weights");
  await expect(links.first()).toContainText("Clipping and extreme weights");
  await page.keyboard.press("ArrowDown");
  await expect(links.first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(links.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(input).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
  await open.press("Enter");
  await expect(input).toHaveValue("extreme weights");
  await page.getByRole("button", { name: "Close search" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(links.last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close search" }),
  ).toBeFocused();
  await input.fill("<img src=x onerror=alert(1)>");
  await expect(page.locator(".search-status")).toContainText(
    "No matching topics",
  );
  await expect(dialog.locator("img, script")).toHaveCount(0);
  await input.fill("AIPW");
  await input.press("Enter");
  await expect(page).toHaveURL(`${url}glossary/#aipw`);
  await expect(page.locator("#aipw")).toBeInViewport();
  await open.click();
  await input.fill("exchangeability");
  await links.first().click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("#exchangeability")).toBeInViewport();

  // Search survives the guided lesson renderer replacing the header and Contents.
  await page.goto(url);
  await page.getByRole("link", { name: "Learn", exact: true }).click();
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await page.getByRole("link", { name: "A common cause", exact: true }).click();
  await open.click();
  await expect(input).toBeFocused();
  await expect(page.locator("#lesson-menu")).not.toBeVisible();
  await input.fill("extreme weights");
  await links.first().click();
  await expect(page).toHaveURL(`${url}propensity-score-clipping-trimming/`);

  for (const path of [
    "?lesson=assumptions",
    "?sandbox",
    "?sandbox=graph-lab",
    "methodology/",
    "confounding/",
    "glossary/",
  ]) {
    await page.goto(url + path);
    await open.click();
    await expect(input).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(open).toBeFocused();
  }

  // Verify all index destinations, including client-rendered glossary fragments.
  for (const href of new Set(
    searchEntries.map(({ href }) => href.split("#")[0]),
  )) {
    const response = await page.goto(url + href);
    assert.ok(response.ok(), href);
    await expect(page.locator("h1").first()).toBeVisible();
  }
  await page.goto(`${url}glossary/`);
  for (const { href } of searchEntries.filter(
    ({ type }) => type === "Glossary",
  )) {
    await expect(page.locator(`[id="${href.split("#")[1]}"]`)).toHaveCount(1);
  }

  for (const path of [
    "?lesson=introduction",
    "?lesson=randomization",
    "?sandbox",
    "?sandbox=graph-lab",
    "methodology/",
  ]) {
    await page.goto(url + path);
    for (const theme of ["light", "dark"]) {
      await page.getByLabel("Color theme").selectOption(theme);
      for (const width of [1280, 390, 320]) {
        await page.setViewportSize({ width, height: 800 });
        const trigger = await open.boundingBox();
        assert.ok(trigger.x >= 0 && trigger.x + trigger.width <= width);
        const contents = page.getByRole("button", {
          name: "Contents",
          exact: true,
        });
        if (await contents.count()) {
          const box = await contents.boundingBox();
          assert.ok(
            box.x + box.width <= trigger.x ||
              trigger.x + trigger.width <= box.x ||
              box.y + box.height <= trigger.y ||
              trigger.y + trigger.height <= box.y,
            "Search and Contents must not overlap",
          );
        }
        if (path === "?lesson=randomization" && theme === "light") {
          await page.screenshot({
            path: `/tmp/causal-search-trigger-${width}.png`,
          });
        }
        await open.click();
        await input.fill("weights");
        const box = await dialog.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width);
        assert.ok(box.y >= 0 && box.y + box.height <= 800);
        assert.ok(
          await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
        );
        if (path === "?lesson=randomization") {
          await page.screenshot({
            path: `/tmp/causal-search-${theme}-${width}.png`,
          });
        }
        await page.keyboard.press("Escape");
      }
    }
  }
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 700 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(url);
  await mobile.getByRole("button", { name: "Search", exact: true }).tap();
  await expect(mobile.getByRole("dialog")).toBeVisible();
  await mobile.getByRole("button", { name: "Close search" }).tap();
  await expect(mobile.getByRole("dialog")).not.toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    "Search ranking, navigation, anchors, keyboard, focus, themes, mobile and touch checks passed.",
  );
} finally {
  await browser.close();
}
