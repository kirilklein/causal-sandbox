import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { lessonBaseline, simulateLesson } from "../src/lesson-simulation.js";
import {
  fitClippingSample,
  clippingResult,
  cappedResult,
} from "../src/clipping-experiment.js";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const appUrl = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
const url = `${appUrl}?lesson=clipping`;
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1100 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*.goatcounter.com/**", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"count":"0"}' }),
  );
  await page.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.goto(`${appUrl}?lesson=overlap`);
  await page
    .getByRole("link", { name: "Explore clipping and extreme weights →" })
    .click();
  assert.equal(
    new URL(page.url()).pathname,
    new URL("propensity-score-clipping-trimming/", appUrl).pathname,
  );
  await page.locator('[data-method="ipw"]').waitFor();
  const table = () => page.locator("#estimates").innerText();
  const initial = await table();
  assert.ok(
    await page
      .getByText("Start a new 400-person study", { exact: false })
      .isVisible(),
  );
  assert.equal(
    await page.locator("h1").evaluate((el) => el === document.activeElement),
    true,
  );
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
  // Weight capping is an alternative operation on the same raw fitted sample.
  await page.locator("#threshold").fill("0.005");
  const clippedTable = await table();
  await page.locator("#cap-options summary").click();
  assert.equal(await table(), clippedTable);
  await page.locator("#cap-enabled").focus();
  await page.keyboard.press("Space");
  assert.equal(await page.locator("#threshold").isDisabled(), true);
  assert.equal(await page.locator("#weight-cap").isEnabled(), true);
  assert.match(
    await page.locator("#active-operation").innerText(),
    /Weight cap: 50/,
  );
  const cappedRows = fitClippingSample(
    simulateLesson({ ...lessonBaseline(10), n: 400, selection: 3 }),
  );
  for (const limit of ["50", "1", "300"]) {
    await page.locator("#weight-cap").fill(limit);
    const expected = cappedResult(cappedRows, Number(limit));
    for (const key of ["regression", "ipw", "aipw"])
      assert.equal(
        await page
          .locator(`[data-method="${key}"] .selected strong`)
          .innerText(),
        expected[key].toFixed(2),
      );
    assert.equal(await histogram(), initialHistogram);
    assert.equal(await page.locator("#sample").innerText(), seed);
    assert.equal(await page.locator("#clip-guides").isVisible(), false);
  }
  await page.locator("#cap-enabled").uncheck();
  assert.equal(await table(), clippedTable);
  assert.equal(await page.locator("#threshold").inputValue(), "0.005");
  await page.locator("#cap-enabled").check();
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  assert.equal(await page.locator("#cap-enabled").isChecked(), false);
  assert.equal(await page.locator("#weight-cap").inputValue(), "50");
  assert.equal(await page.locator("#cap-options").getAttribute("open"), null);
  assert.equal(await table(), initial);
  // Capture the modest-clipping comparison, with visible bounds and diagnostics.
  await page.locator("#threshold").fill("0.005");
  await page.locator("#weights summary").click();
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
        path: `test-results/clipping-lesson-${width}-${theme}.png`,
        fullPage: true,
      });
    }
  }
  // Direct entry and browser history start the chapter at its defined baseline.
  await page.goto(url);
  await page.locator('[data-method="ipw"]').waitFor();
  assert.equal(await table(), initial);
  await page.locator("#threshold").fill("0.1");
  await page.getByRole("link", { name: "← Poor overlap" }).click();
  await page.locator("#lesson-menu-toggle").waitFor();
  await page.goBack();
  await page.locator('[data-method="ipw"]').waitFor();
  assert.equal(await page.locator("#threshold").inputValue(), "0");
  assert.equal(await table(), initial);
  await page.goForward();
  await page.locator("#lesson-menu-toggle").click();
  await page
    .getByRole("link", { name: "Clipping and extreme weights ↗" })
    .click();
  await page.locator('[data-method="ipw"]').waitFor();
  assert.equal(await table(), initial);
  await page.getByRole("link", { name: "Full sandbox ↗", exact: true }).click();
  assert.equal(new URL(page.url()).searchParams.has("sandbox"), true);
  assert.deepEqual(errors, []);
  console.log(
    "Clipping lesson: production routing/navigation, both sliders, histogram accounting/invariance, arithmetic, keyboard/touch, redraw/restart, themes, and 320px/desktop layout passed.",
  );
} finally {
  await browser.close();
}
