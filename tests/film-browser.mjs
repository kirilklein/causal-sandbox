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
  await page.getByRole("heading", { name: /See what.*causes what/ }).waitFor();
  assert.equal(await page.locator(".experiment, .lesson-results").count(), 0);
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  assert.equal(
    await page.locator(".lesson-nav-heading > span").textContent(),
    "Introduction",
  );
  const open = page.getByRole("button", { name: /Watch the introduction/ });
  const video = page.locator("#intro-film video");
  const dialog = page.getByRole("dialog");
  assert.equal(await open.count(), 1);
  assert.equal(await video.getAttribute("src"), null);
  assert.equal(await video.getAttribute("preload"), "none");
  assert.deepEqual(requests, []);
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
  await page.getByRole("link", { name: "Learn" }).click();
  await page.locator("#unadjusted").waitFor();
  assert.equal(
    await page.locator(".lesson-nav-heading > span").textContent(),
    "Level 1 of 13",
  );
  assert.equal(
    await page.locator("h1").evaluate((el) => el === document.activeElement),
    true,
  );
  assert.equal(await open.count(), 0);
  await page.getByRole("link", { name: "← Introduction", exact: true }).click();
  assert.equal(await open.count(), 1);
  assert.equal(await video.getAttribute("src"), null);
  assert.equal(await page.locator(".introduction-arriving").count(), 0);
  await page.goBack();
  await page.locator("#unadjusted").waitFor();
  await page.goForward();
  await open.waitFor();
  assert.equal(await page.locator(".introduction-arriving").count(), 0);
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  assert.equal(
    await page
      .getByRole("link", { name: "Introduction", exact: true })
      .getAttribute("aria-current"),
    "step",
  );
  await page
    .getByRole("link", { name: "A randomized experiment", exact: true })
    .click();
  await page.locator("#continue").click();
  assert.equal(await page.locator("h1").textContent(), "A common cause");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await page.getByRole("link", { name: "Introduction", exact: true }).click();
  await open.waitFor();

  // The initial reveal is brief; navigation back never restarts it.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(url);
  await page.locator(".introduction").waitFor();
  const timings = await page.locator(".introduction").evaluate((el) =>
    [
      ...el.querySelectorAll(
        ".intro-copy, .intro-node, .intro-path, .film-preview",
      ),
    ].map((item) => {
      const style = getComputedStyle(item);
      return (
        parseFloat(style.animationDuration) + parseFloat(style.animationDelay)
      );
    }),
  );
  assert.equal(Math.max(...timings), 1.55);
  // Keyboard interaction cancels the reveal so controls are immediately visible.
  await page.getByRole("link", { name: "Learn" }).focus();
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  await page.keyboard.press("Enter");
  await page.locator("#unadjusted").waitFor();
  await page.goBack();
  await open.waitFor();
  assert.equal(await page.locator(".introduction-arriving").count(), 0);
  const failure = await browser.newPage();
  for (const [entry, destination] of [
    ["Explore", "#effects"],
    ["Build", "#lab-truth"],
  ]) {
    await page.getByRole("link", { name: entry, exact: true }).click();
    await page.locator(destination).waitFor();
    await page.goBack();
    await open.waitFor();
    assert.equal(await page.locator(".introduction-arriving").count(), 0);
  }
  failure.on("pageerror", (error) => errors.push(error.message));
  await failure.route("**/*.mp4", (route) => route.abort());
  await failure.goto(url);
  const retry = failure.getByRole("button", { name: /Watch the introduction/ });
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
    "Introduction and film checks passed: lazy playback, Escape/focus return, close/pause, touch/mobile, reduced motion, brief entrance, lesson entry, Contents and history.",
  );
} finally {
  await browser.close();
}
