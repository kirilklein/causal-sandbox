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
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.locator("#unadjusted").waitFor();
  const result = () => page.locator(".lesson-results").innerText();
  const first = await result();
  assert.equal(await page.locator(".lesson-result:visible").count(), 2);
  assert.deepEqual(
    await page.locator("#lesson-graph svg text").allTextContents(),
    ["Treatment (A)", "Outcome (Y)"],
  );
  assert.equal(await page.locator("input").count(), 1);
  await page.locator(".lesson-explanation summary").focus();
  await page.keyboard.press("Enter");
  assert.equal(await result(), first);
  await page.locator("#effect").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#known-effect").innerText(), "2.10");
  await page.locator("#effect").fill("0");
  assert.match(
    await page.locator("#lesson-graph svg").getAttribute("aria-label"),
    /no effect/,
  );
  assert.equal(await page.locator("#lesson-graph g path").count(), 0);
  await page.locator("#redraw").click();
  assert.match(await page.locator("#sample-label").innerText(), /4218/);
  await page.locator("#restart").click();
  assert.equal(await result(), first);
  assert.equal(
    await page.locator("h1").evaluate((el) => el === document.activeElement),
    true,
  );
  await page.screenshot({
    path: "/tmp/causal-lesson-desktop.png",
    fullPage: true,
  });
  await page.locator("#continue").click();
  const second = await result();
  assert.equal(await page.locator("#selection").isChecked(), false);
  assert.match(
    await page.locator("#lesson-graph svg").getAttribute("aria-label"),
    /health causes outcome\./,
  );
  await page.locator("#selection").check();
  assert.ok(Number(await page.locator("#unadjusted").innerText()) > 3);
  assert.equal(await page.locator("#ipw-result").isVisible(), false);
  await page.locator("#continue").click();
  const third = await result();
  assert.equal(await page.locator("#balance").isVisible(), false);
  await page.locator("#reveal-ipw").click();
  assert.equal(await page.locator("#adjustment").isChecked(), false);
  assert.equal(
    await page.locator("#ipw").innerText(),
    await page.locator("#unadjusted").innerText(),
  );
  await page.keyboard.press("Space");
  assert.equal(await page.locator("#adjustment").isChecked(), true);
  assert.ok(
    Math.abs(Number(await page.locator("#ipw").innerText()) - 2) < 0.15,
  );
  const weighted = await result();
  await page.locator(".lesson-explanation summary").click();
  assert.equal(await result(), weighted);
  await page.locator("#back").click();
  assert.equal(await result(), second);
  await page.goBack();
  assert.equal(await result(), third);
  assert.equal(await page.locator("#balance").isVisible(), false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#reveal-ipw").tap();
  await page.locator("#adjustment").tap();
  assert.equal(await page.locator("#adjustment").isChecked(), true);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/causal-lesson-mobile.png",
    fullPage: true,
  });
  await page.locator(".lesson-nav summary").tap();
  await page
    .getByRole("link", { name: "A randomized experiment", exact: true })
    .tap();
  assert.equal(await result(), first);
  await page.getByRole("link", { name: "Open full sandbox" }).click();
  await page.locator("#world-select").selectOption("both");
  await page.locator('input[value="K"]').check();
  await page.getByRole("link", { name: "Start the lessons" }).click();
  assert.equal(await result(), first);
  assert.equal(await page.locator("input").count(), 1);
  assert.deepEqual(errors, []);
  console.log(
    "Lesson navigation, baseline resets, help, keyboard and mobile checks passed.",
  );
} finally {
  await browser.close();
}
