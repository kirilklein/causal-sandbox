import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { lessonBaseline, simulateLesson } from "../src/lesson-simulation.js";
import {
  fitClippingSample,
  clippingResult,
} from "../src/clipping-experiment.js";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url =
  process.env.CLIPPING_URL ||
  "http://127.0.0.1:5186/causal-sandbox/docs/clipping-preview.html";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1100 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page.locator('[data-method="ipw"]').waitFor();
  const table = () => page.locator("#estimates").innerText();
  const initial = await table();
  const checkValues = async (threshold, selection = 3) => {
    const rows = fitClippingSample(
      simulateLesson({ ...lessonBaseline(10), n: 400, selection }),
    );
    const result = clippingResult(rows, threshold);
    for (const key of ["regression", "ipw", "aipw"])
      assert.equal(
        await page
          .locator(`[data-method="${key}"] .selected strong`)
          .innerText(),
        result[key].toFixed(2),
      );
    for (const A of [0, 1]) {
      const bins = Array(10).fill(0);
      rows
        .filter((row) => row.A === A)
        .forEach(({ p }) => bins[Math.min(9, Math.floor(p * 10))]++);
      assert.deepEqual(
        await page
          .locator(`#histogram-bars [data-arm="${A}"]`)
          .evaluateAll((bars) => bars.map((bar) => Number(bar.dataset.count))),
        bins,
      );
    }
  };
  await checkValues(0);
  const histogram = () => page.locator("#histogram-bars").innerHTML();
  const initialHistogram = await histogram();
  const seed = await page.locator("#sample").innerText();
  const unchanged = await page
    .locator("#estimates td:not(.selected)")
    .allTextContents();
  await page.locator("#threshold").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#threshold").inputValue(), "0.001");
  await checkValues(0.001);
  assert.equal(await page.locator("#sample").innerText(), seed);
  assert.deepEqual(
    await page.locator("#estimates td:not(.selected)").allTextContents(),
    unchanged,
  );
  for (const threshold of ["0", "0.005", "0.01", "0.1", "0"]) {
    await page.locator("#threshold").fill(threshold);
    await checkValues(Number(threshold));
    assert.equal(await histogram(), initialHistogram);
    assert.equal(
      Number(await page.locator("#lower-tail").getAttribute("width")),
      360 * Number(threshold),
    );
    assert.equal(
      Number(await page.locator("#upper-tail").getAttribute("x")),
      400 - 360 * Number(threshold),
    );
  }
  assert.equal(await table(), initial);
  await page.locator("#threshold").fill("0.005");
  await page.locator("#selection").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#selection").inputValue(), "3.1");
  await checkValues(0.005, 3.1);
  for (const selection of ["0", "5", "3"]) {
    await page.locator("#selection").fill(selection);
    await checkValues(0.005, Number(selection));
    assert.equal(await page.locator("#threshold").inputValue(), "0.005");
    assert.equal(await page.locator("#sample").innerText(), seed);
    if (selection !== "3") assert.notEqual(await histogram(), initialHistogram);
  }
  assert.equal(await histogram(), initialHistogram);
  await page.locator("#threshold").fill("0");
  assert.equal(await table(), initial);
  await page.locator("#weights summary").tap();
  assert.equal(await table(), initial);
  await page.getByRole("button", { name: "Draw another sample" }).click();
  assert.match(await page.locator("#sample").innerText(), /4218/);
  assert.notEqual(await table(), initial);
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  assert.equal(await table(), initial);
  assert.equal(await page.locator("#threshold").inputValue(), "0");
  assert.equal(await page.locator("#selection").inputValue(), "3");
  assert.equal(await histogram(), initialHistogram);
  // Capture the modest-clipping comparison, with visible bounds and diagnostics.
  await page.locator("#threshold").fill("0.005");
  const screenshotTable = await table();
  await mkdir("test-results", { recursive: true });
  for (const theme of ["light", "dark"]) {
    await page.getByLabel("Color theme").selectOption(theme);
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 1100 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.equal(await table(), screenshotTable);
      await page.screenshot({
        path: `test-results/clipping-preview-${width}-${theme}.png`,
        fullPage: true,
      });
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "Clipping preview: both sliders, histogram accounting/invariance, arithmetic, keyboard/touch, redraw/restart, themes, and 320px/desktop layout passed.",
  );
} finally {
  await browser.close();
}
