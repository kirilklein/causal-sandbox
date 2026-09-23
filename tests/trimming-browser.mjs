import {
  launchBrowser,
  getAppUrl,
  collectPageErrors,
  stubGoatCounter,
} from "./browser-setup.mjs";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { trimmingSample, trimmingResult } from "../src/trimming-experiment.js";

const browser = await launchBrowser();
const appUrl = getAppUrl();
const url = `${appUrl}?lesson=trimming`;
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1100 },
    hasTouch: true,
  });
  const errors = [];
  collectPageErrors(page, errors);
  await stubGoatCounter(page);
  await page.goto(`${appUrl}?lesson=clipping`);
  await page
    .getByRole("link", { name: "Next: who remains after trimming? →" })
    .click();
  assert.equal(new URL(page.url()).searchParams.get("lesson"), "trimming");
  await page.locator('#groups [data-group="retained"]').waitFor();
  const contents = page.getByRole("button", { name: "Contents" });
  assert.ok(await contents.isVisible());
  await contents.click();
  assert.ok(await page.locator("#lesson-menu").isVisible());
  assert.equal(
    await page.locator('.optional-menu a[aria-current="step"]').innerText(),
    "Population trimming",
  );
  await contents.click();
  const table = () => page.locator("#groups").innerText();
  const initial = await table();
  const varyingTable = () => page.locator("#varying-groups").innerText();
  const initialVarying = await varyingTable();
  assert.ok(
    await page
      .getByRole("heading", { name: "2. When treatment effects vary" })
      .isVisible(),
  );
  assert.match(
    await page.locator("#varying-note").innerText(),
    /Move the trimming threshold/,
  );
  const histogram = () => page.locator("#histogram-bars").innerHTML();
  const initialHistogram = await histogram();
  const check = async (threshold, selection = 3, seed = 4217) => {
    const { rows, effects } = trimmingSample({ selection, seed });
    const result = trimmingResult(rows, effects, threshold);
    const varying = trimmingSample({ selection, seed, heterogeneous: true });
    const varyingResult = trimmingResult(
      varying.rows,
      varying.effects,
      threshold,
    );
    assert.deepEqual(varyingResult.retained, result.retained);
    assert.deepEqual(varyingResult.excluded, result.excluded);
    for (const [tableId, groups] of [
      ["groups", result.groups],
      ["varying-groups", varyingResult.groups],
    ]) {
      for (const [key, group] of Object.entries(groups)) {
        const row = page.locator(`#${tableId} [data-group="${key}"]`);
        assert.equal(
          await row.locator(".count span").innerText(),
          String(group.n),
        );
        assert.equal(
          await row.locator(".count small").innerText(),
          group.counts.join(" / "),
        );
        assert.equal(
          await row.locator(".ipw").innerText(),
          group.available ? group.ipw.toFixed(2) : "Unavailable",
        );
        assert.equal(
          await row.locator(".group-truth").innerText(),
          group.n ? group.truth.toFixed(2) : "Unavailable",
        );
      }
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
  const everyone = await page
    .locator('#groups [data-group="everyone"]')
    .innerText();
  await page.getByLabel("Trimming threshold", { exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#threshold").inputValue(), "0.001");
  await check(0.001);
  for (const threshold of ["0.015", "0.1", "0.2", "0.499", "0.5", "0"]) {
    await page.locator("#threshold").fill(threshold);
    await check(Number(threshold));
    assert.equal(
      await page.locator('#groups [data-group="everyone"]').innerText(),
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
  assert.notEqual(
    await page
      .locator('#varying-groups [data-group="retained"] .group-truth')
      .innerText(),
    await page
      .locator('#varying-groups [data-group="everyone"] .group-truth')
      .innerText(),
  );
  assert.match(
    await page.locator("#varying-note").innerText(),
    /changes the target population/,
  );
  await page.locator("#selection").focus();
  await page.keyboard.press("ArrowRight");
  await check(0.1, 3.1);
  for (const selection of ["0", "5", "3"]) {
    await page.locator("#selection").fill(selection);
    await check(0.1, Number(selection));
    assert.equal(await page.locator("#threshold").inputValue(), "0.1");
  }
  const unchanged = await table();
  await page.locator("#estimand-details summary").tap();
  assert.equal(await table(), unchanged);
  await page.getByRole("button", { name: "Draw another sample" }).click();
  await check(0.1, 3, 4218);
  assert.notEqual(await table(), unchanged);
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  assert.equal(await table(), initial);
  assert.equal(await varyingTable(), initialVarying);
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
      await check(0.1, 3, 4217);
      assert.ok(
        await page
          .getByRole("columnheader", { name: "Group truth" })
          .nth(1)
          .isVisible(),
      );
      assert.ok(
        await page
          .locator('#varying-groups [data-group="retained"] .count')
          .isVisible(),
      );
      await page.locator("#threshold").scrollIntoViewIfNeeded();
      const slider = await page.locator("#threshold").boundingBox();
      assert.ok(slider.height >= 44);
      await page.touchscreen.tap(
        slider.x + slider.width / 2,
        slider.y + slider.height / 2,
      );
      assert.notEqual(await page.locator("#threshold").inputValue(), "0.1");
      await check(
        Number(await page.locator("#threshold").inputValue()),
        3,
        4217,
      );
      await page.locator("#threshold").fill("0.1");
      await page.screenshot({
        path: `test-results/trimming-lesson-${width}-${theme}.png`,
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
  await page.locator('#groups [data-group="retained"]').waitFor();
  assert.equal(await table(), initial);
  await page.locator("#threshold").fill("0.2");
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  assert.equal(await table(), initial);
  assert.equal(await varyingTable(), initialVarying);
  await page.locator("#threshold").fill("0.2");
  await page.getByRole("link", { name: "← Probability clipping" }).click();
  await page.goBack();
  await page.locator('#groups [data-group="retained"]').waitFor();
  assert.equal(await table(), initial);
  await page.goto(`${appUrl}?lesson=overlap`);
  await page.locator("#lesson-menu-toggle").click();
  await page
    .getByRole("link", {
      name: "Population trimming",
      exact: true,
    })
    .click();
  await page.locator('#groups [data-group="retained"]').waitFor();
  assert.equal(await table(), initial);
  assert.deepEqual(errors, []);
  console.log(
    "Trimming: group arithmetic, histogram accounting, controls, touch/keyboard, redraw/restart, themes, links and desktop/mobile passed.",
  );
} finally {
  await browser.close();
}
