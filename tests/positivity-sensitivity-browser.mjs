import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { expect } from "@playwright/test";
import {
  launchBrowser,
  getAppUrl,
  collectPageErrors,
  stubGoatCounter,
} from "./browser-setup.mjs";
import { positivitySensitivity } from "../src/positivity-sensitivity.js";

const browser = await launchBrowser();
const url = getAppUrl();
const title = "Beyond trimming: who is still missing?";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1100 },
  });
  const errors = [];
  collectPageErrors(page, errors);
  await stubGoatCounter(page);
  await page.goto(`${url}?lesson=trimming`);
  await page
    .getByRole("link", { name: "Beyond trimming →", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText(title);
  await expect(page.locator("#ps-exploration")).toBeHidden();
  const observed = await page.locator("#ps-observed").innerHTML();
  await page.locator('[data-prediction="yes"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#ps-feedback-text")).toContainText("Not quite.");
  await expect(page.locator("#ps-feedback-text")).toBeFocused();
  await expect(page.locator("#ps-exploration")).toBeVisible();
  await expect(page.locator("#ps-effect-value")).toHaveText("+20 pp");
  await page.locator("#ps-calculation > summary").click();
  await page.locator("#ps-effect").focus();
  await page.keyboard.press("Home");
  await expect(page.locator("#ps-result")).toContainText("-4 pp");
  await expect(page.locator("#ps-counterfactual")).toContainText("100%");
  await expect(page.locator("#ps-calculation")).toHaveAttribute("open", "");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#ps-result")).toContainText("cancel");
  await expect(page.locator("#ps-effect-value")).toHaveText("-30 pp");
  await page.keyboard.press("End");
  await expect(page.locator("#ps-result")).toContainText("+36 pp");
  await expect(page.locator("#ps-counterfactual")).toContainText("0%");
  assert.equal(await page.locator("#ps-observed").innerHTML(), observed);
  const expected = positivitySensitivity(0.6);
  const overall = page.locator(".ps-effect-row").last();
  assert.ok(
    Math.abs(
      (await overall
        .locator(".ps-dot")
        .evaluate((node) => parseFloat(node.style.left))) -
        (expected.overallEffect + 0.4) * 100,
    ) < 1e-10,
  );
  await page.locator("#ps-practice > summary").click();
  await page.locator('[data-practice="all"]').click();
  await expect(page.locator("#ps-practice-feedback")).toContainText(
    "Not quite.",
  );
  await page.locator('[data-practice="retained"]').click();
  await expect(page.locator("#ps-practice-feedback")).toContainText("Correct.");
  await page.locator("#ps-feedback > summary").click();
  await expect(page.locator("#ps-feedback-text")).toBeHidden();
  await expect(page.locator("#ps-effect")).toHaveValue("60");
  await page.locator("#ps-calculation > summary").click();
  await page.locator("#ps-practice > summary").click();

  await mkdir("test-results/positivity-sensitivity", { recursive: true });
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const theme of ["light", "dark"]) {
      await page
        .getByRole("combobox", { name: "Color theme" })
        .selectOption(theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.locator("#ps-effect").focus();
      await page.keyboard.press("Home");
      await expect(page.locator("#ps-effect-value")).toHaveText("-40 pp");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}/${theme} page fits`,
      );
      assert.ok(
        await page.locator("#ps-chart").evaluate((node) =>
          [...node.querySelectorAll(".ps-dot, .ps-range")].every((mark) => {
            const box = mark.getBoundingClientRect();
            return box.left >= 0 && box.right <= innerWidth;
          }),
        ),
        `${width}/${theme} marks fit`,
      );
      await page.locator(".ps-experiment").screenshot({
        path: `test-results/positivity-sensitivity/${width}-${theme}.png`,
      });
      await page.locator("#ps-calculation > summary").click();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}/${theme} formula fits`,
      );
      await page.locator("#ps-calculation > summary").click();
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#ps-restart").click();
  await expect(page.locator("h1")).toBeFocused();
  await expect(page.locator("#ps-effect")).toHaveValue("20");
  await expect(page.locator("#ps-exploration")).toBeHidden();
  await expect(page.locator("#ps-prediction")).toBeVisible();
  await expect(page.locator("#ps-practice-feedback")).toBeEmpty();
  await expect(page.locator(".ps-detail[open]")).toHaveCount(0);
  await page.locator('[data-prediction="no"]').click();
  await expect(page.locator("#ps-feedback-text")).toContainText("Correct.");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(page.locator('#lesson-menu a[aria-current="step"]')).toHaveText(
    "Beyond trimming",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "All topics", exact: true }).click();
  await page
    .locator(".learning-topic-group > summary")
    .filter({ hasText: "What if the groups barely overlap?" })
    .click();
  await page.getByRole("link", { name: title, exact: false }).click();
  await expect(page.locator("h1")).toHaveText(title);
  await expect(page.locator("#ps-prediction")).toBeVisible();
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Refresh & go deeper");
  await page.goForward();
  await expect(page.locator("h1")).toHaveText(title);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox").fill("beyond trimming");
  await page
    .getByRole("link", { name: new RegExp(title.replace("?", "\\?")) })
    .click();
  await expect(page.locator("h1")).toHaveText(title);
  assert.deepEqual(errors, []);

  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await stubGoatCounter(touch);
  const phone = await touch.newPage();
  collectPageErrors(phone, errors);
  await phone.goto(`${url}?lesson=positivity-sensitivity`);
  await phone.locator('[data-prediction="no"]').tap();
  await phone.locator("#ps-effect").scrollIntoViewIfNeeded();
  const box = await phone.locator("#ps-effect").boundingBox();
  await phone.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(phone.locator("#ps-effect")).toHaveValue("10");
  await expect(phone.locator("#ps-result")).toContainText("+16 pp");
  await phone.getByRole("link", { name: "← Trimming", exact: true }).tap();
  await expect(phone.locator("h1")).toHaveText("Who remains after trimming?");
  assert.deepEqual(errors, []);
  await touch.close();
  console.log(
    "Advanced positivity: fixed observations, assumptions, bounds, prediction, practice, discovery, reset, history, keyboard/touch and responsive themes passed.",
  );
} finally {
  await browser.close();
}
