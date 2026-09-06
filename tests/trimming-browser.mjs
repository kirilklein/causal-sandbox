import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { trimmingSample, trimmingResult } from "../src/trimming-experiment.js";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url =
  process.env.TRIMMING_URL ||
  "http://127.0.0.1:5187/causal-sandbox/docs/trimming-preview.html";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1100 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page.locator('[data-group="retained"]').waitFor();
  const table = () => page.locator("#groups").innerText();
  const initial = await table();
  const histogram = () => page.locator("#histogram-bars").innerHTML();
  const initialHistogram = await histogram();
  const check = async (threshold, selection = 3, seed = 4217) => {
    const { rows, effects } = trimmingSample({ selection, seed });
    const result = trimmingResult(rows, effects, threshold);
    for (const [key, group] of Object.entries(result.groups)) {
      assert.equal(
        await page.locator(`[data-group="${key}"] .count span`).innerText(),
        String(group.n),
      );
      assert.equal(
        await page.locator(`[data-group="${key}"] .count small`).innerText(),
        group.counts.join(" / "),
      );
      assert.equal(
        await page.locator(`[data-group="${key}"] .ipw`).innerText(),
        group.available ? group.ipw.toFixed(2) : "Unavailable",
      );
      assert.equal(
        await page.locator(`[data-group="${key}"] .group-truth`).innerText(),
        group.n ? group.truth.toFixed(2) : "Unavailable",
      );
    }
    assert.equal(
      await page.locator("#retained-ipw").innerText(),
      result.groups.retained.available
        ? result.groups.retained.ipw.toFixed(2)
        : "Unavailable",
    );
    const bins = await page
      .locator("#histogram-bars g")
      .evaluateAll((elements) =>
        elements.map((el) => ({
          A: Number(el.dataset.arm),
          bin: Number(el.dataset.bin),
          retained: Number(el.dataset.retained),
          excluded: Number(el.dataset.excluded),
          total: Number(el.dataset.count),
          height: [...el.querySelectorAll("rect")].reduce(
            (sum, bar) => sum + Number(bar.getAttribute("height")),
            0,
          ),
        })),
      );
    for (const bin of bins) {
      // Independently classify original scores, including cuts through a bin.
      const members = rows.filter(
        (row) =>
          row.A === bin.A && Math.min(9, Math.floor(row.p * 10)) === bin.bin,
      );
      assert.equal(bin.total, members.length);
      assert.equal(
        bin.retained,
        members.filter(({ p }) => p >= threshold && p <= 1 - threshold).length,
      );
      assert.equal(bin.retained + bin.excluded, bin.total);
      assert.ok(
        Math.abs(
          bin.height - (150 * bin.total) / result.histogram[bin.A].count,
        ) < 1e-10,
      );
    }
    assert.equal(
      await page.locator("#lower-guide").getAttribute("d"),
      `M${40 + 360 * threshold} 30V180`,
    );
    assert.equal(
      await page.locator("#upper-guide").getAttribute("d"),
      `M${400 - 360 * threshold} 30V180`,
    );
    assert.match(
      await page.locator("#sample").innerText(),
      new RegExp(String(seed)),
    );
  };
  await check(0);
  const everyone = await page.locator('[data-group="everyone"]').innerText();
  await page.getByLabel("Trimming threshold", { exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#threshold").inputValue(), "0.001");
  await check(0.001);
  for (const threshold of ["0.015", "0.1", "0.2", "0.499", "0.5", "0"]) {
    await page.locator("#threshold").fill(threshold);
    await check(Number(threshold));
    assert.equal(
      await page.locator('[data-group="everyone"]').innerText(),
      everyone,
    );
    if (threshold === "0.5")
      assert.match(
        await page.locator("#retained-status").innerText(),
        /No people/,
      );
  }
  assert.equal(await table(), initial);
  assert.equal(await histogram(), initialHistogram);
  await page.locator("#threshold").fill("0.1");
  await page.locator("#selection").focus();
  await page.keyboard.press("ArrowRight");
  await check(0.1, 3.1);
  for (const selection of ["0", "5", "3"]) {
    await page.locator("#selection").fill(selection);
    await check(0.1, Number(selection));
    assert.equal(await page.locator("#threshold").inputValue(), "0.1");
  }
  const unchanged = await table();
  await page.locator("details summary").tap();
  assert.equal(await table(), unchanged);
  await page.getByRole("button", { name: "Draw another sample" }).click();
  await check(0.1, 3, 4218);
  assert.notEqual(await table(), unchanged);
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  assert.equal(await table(), initial);
  assert.equal(await histogram(), initialHistogram);
  await page.locator("#threshold").fill("0.1");
  await mkdir("test-results", { recursive: true });
  for (const theme of ["light", "dark"]) {
    await page.getByLabel("Color theme").selectOption(theme);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 1100 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}px overflow`,
      );
      await check(0.1);
      await page.locator("#threshold").scrollIntoViewIfNeeded();
      const slider = await page.locator("#threshold").boundingBox();
      assert.ok(slider.height >= 44);
      await page.touchscreen.tap(
        slider.x + slider.width / 2,
        slider.y + slider.height / 2,
      );
      assert.notEqual(await page.locator("#threshold").inputValue(), "0.1");
      await check(Number(await page.locator("#threshold").inputValue()));
      await page.locator("#threshold").fill("0.1");
      await page.screenshot({
        path: `test-results/trimming-preview-${width}-${theme}.png`,
        fullPage: true,
      });
      await page.locator("#threshold").fill("0.5");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}px unavailable overflow`,
      );
      await page.locator("#threshold").fill("0.1");
    }
  }
  await page.getByRole("link", { name: "← Probability clipping" }).click();
  await page
    .getByRole("link", { name: "Next: who remains after trimming? →" })
    .click();
  await page.locator('[data-group="retained"]').waitFor();
  assert.equal(await table(), initial);
  assert.deepEqual(errors, []);
  console.log(
    "Trimming: group arithmetic, histogram accounting, controls, touch/keyboard, redraw/restart, themes, links and desktop/mobile passed.",
  );
} finally {
  await browser.close();
}
