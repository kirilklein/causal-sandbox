import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";

try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  await page.goto(`${url}?lesson=introduction`);
  await page.evaluate(() => localStorage.removeItem("causal-sandbox-progress"));
  await page.reload();

  assert.match(
    await page.locator(".intro-path").first().innerText(),
    /Choose your starting point/,
  );

  await page.locator(".intro-path").first().click();
  await page.getByRole("link", { name: /Start from scratch/ }).click();
  await page.locator('input[name="prediction"]').first().check();
  await page.locator("#try-prediction").click();
  await page.locator("#continue").click();

  await page.locator("#lesson-menu-toggle").click();
  assert.equal(
    await page.locator(".lesson-progress label").innerText(),
    "1 of 13 guided lessons complete",
  );
  assert.equal(
    await page.locator('[data-level="1"]').getAttribute("aria-describedby"),
    "lesson-complete-description",
  );
  await page.screenshot({ path: "/tmp/learning-progress-desktop.png" });
  await page.setViewportSize({ width: 320, height: 700 });
  assert.ok(await page.locator(".lesson-progress").isVisible());
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({ path: "/tmp/learning-progress-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.locator("a[data-introduction]").first().click();
  assert.match(
    await page.locator(".intro-path").first().innerText(),
    /Continue with A common cause/,
  );
  await page.reload();
  assert.match(
    await page.locator(".intro-path").first().innerText(),
    /Continue with A common cause/,
  );

  const firstAttempt = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("causal-sandbox-progress")),
  );
  assert.deepEqual(firstAttempt.answers["randomization-effect"], {
    lesson: "randomization",
    firstAnswerIndex: 0,
    firstCorrect: false,
    attempts: 1,
    lastAnswerIndex: 0,
    lastCorrect: false,
    eventuallyCorrect: false,
  });

  await page.locator("#lesson-menu-toggle").click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#reset-progress").click();
  await page.waitForLoadState();
  assert.match(
    await page.locator(".intro-path").first().innerText(),
    /Choose your starting point/,
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem("causal-sandbox-progress")),
    null,
  );
} finally {
  await browser.close();
}
