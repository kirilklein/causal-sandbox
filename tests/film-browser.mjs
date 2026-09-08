import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    reducedMotion: "reduce",
    hasTouch: true,
  });
  const errors = [];
  const requests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    // Vite serves an asset URL as a tiny JS import in development, not video bytes.
    if (request.resourceType() === "media") requests.push(request.url());
  });
  await page.goto(url);
  await page.locator("#unadjusted").waitFor();
  const open = page.getByRole("button", { name: /Two possible futures/ });
  const video = page.locator("#intro-film video");
  const dialog = page.getByRole("dialog");
  assert.equal(await open.count(), 1);
  assert.equal(await video.getAttribute("src"), null);
  assert.equal(await video.getAttribute("preload"), "none");
  assert.deepEqual(requests, []);
  await page.locator("#effect").fill("3.2");
  const results = await page.locator(".lesson-results").textContent();
  await open.focus();
  await page.keyboard.press("Enter");
  await dialog.waitFor({ state: "visible" });
  await page.waitForFunction(
    () => document.querySelector("#intro-film video").currentTime > 0,
  );
  assert.ok(requests.length > 0);
  assert.ok(await video.evaluate((el) => !el.paused));
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.ok(await video.evaluate((el) => el.paused));
  assert.ok(await open.evaluate((el) => el === document.activeElement));
  assert.equal(await page.locator(".lesson-results").textContent(), results);
  assert.equal(await page.locator("#effect").inputValue(), "3.2");
  await page.getByLabel("Color theme").selectOption("dark");
  await page.screenshot({ path: "/tmp/cohort-site-dark.png", fullPage: true });
  await open.click();
  await video.evaluate((el) => {
    el.pause();
    el.currentTime = 31;
  });
  await page.waitForFunction(
    () => !document.querySelector("#intro-film video").seeking,
  );
  await page.screenshot({ path: "/tmp/cohort-site-film.png" });
  await page.getByRole("button", { name: "Close film" }).click();
  assert.ok(await video.evaluate((el) => el.paused));
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await open.tap();
    const bounds = await dialog.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
    await page.getByRole("button", { name: "Close film" }).tap();
    assert.ok(await video.evaluate((el) => el.paused));
    await page.screenshot({
      path: `/tmp/cohort-site-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.getByLabel("Color theme").selectOption("light");
  await page.screenshot({ path: "/tmp/cohort-site-light.png", fullPage: true });
  await page.locator("#continue").click();
  assert.equal(await open.count(), 0);
  await page.locator("#back").click();
  assert.equal(await open.count(), 1);
  assert.equal(await video.getAttribute("src"), null);
  const failure = await browser.newPage();
  failure.on("pageerror", (error) => errors.push(error.message));
  await failure.route("**/*.mp4", (route) => route.abort());
  await failure.goto(url);
  const retry = failure.getByRole("button", { name: /Two possible futures/ });
  await retry.click();
  await failure
    .getByRole("status")
    .filter({ hasText: "could not load" })
    .waitFor();
  await failure.getByRole("button", { name: "Close film" }).click();
  await failure.unroute("**/*.mp4");
  await retry.click();
  await failure.waitForFunction(
    () => document.querySelector("#intro-film video").currentTime > 0,
  );
  await failure.close();
  assert.deepEqual(errors, []);
  console.log(
    "Film checks passed: no initial video request, requested playback, Escape/focus return, close/pause, unchanged lesson state, touch/mobile, reduced motion and navigation.",
  );
} finally {
  await browser.close();
}
