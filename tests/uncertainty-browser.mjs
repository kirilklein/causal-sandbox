import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import {
  uncertaintyStudy,
  uncertaintyRows,
  bootstrapDifference,
  coverageSummary,
  normalInference,
} from "../src/uncertainty.js";
import { fmt, pLabel } from "../src/uncertainty-view.js";

const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${url}?lesson=confounding`);
  await page.locator("#continue").click();
  await page.locator("#opening-next").waitFor();
  assert.match(await page.locator(".lesson-nav").innerText(), /Level 3 of 14/);
  assert.equal(await page.locator("#single-plot .inference-truth").count(), 0);
  assert.equal(await page.locator("#coverage-section").isVisible(), false);
  assert.equal(await page.locator("#uncertainty-check").isVisible(), false);
  assert.equal(
    await page.locator("#opening-plot .opening-estimate").count(),
    1,
  );
  assert.equal(
    await page.locator("#opening-plot .opening-interval").count(),
    0,
  );
  assert.equal(await page.locator("#single-section").isVisible(), false);
  const openingDot = await page
    .locator("#opening-plot .opening-estimate")
    .getAttribute("cx");
  await page.locator("#opening-next").click();
  assert.equal(
    await page.locator("#opening-plot .opening-estimate").count(),
    2,
  );
  assert.equal(
    await page
      .locator("#opening-plot .opening-estimate")
      .first()
      .getAttribute("cx"),
    openingDot,
  );
  assert.equal(
    await page.locator("#opening-plot .opening-interval").count(),
    0,
  );
  await page.locator("#opening-next").focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page.locator("#opening-plot .opening-interval").count(),
    2,
  );
  assert.equal(
    await page.locator('[data-study="0"]').getAttribute("data-zero"),
    "excluded",
  );
  assert.equal(
    await page.locator('[data-study="1"]').getAttribute("data-zero"),
    "included",
  );
  assert.equal(
    await page
      .locator("#opening-plot .opening-estimate")
      .first()
      .getAttribute("cx"),
    openingDot,
  );
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .locator("#opening-section")
      .screenshot({ path: `/tmp/uncertainty-opening-${width}.png` });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  const baseline = uncertaintyStudy();
  assert.match(
    await page.locator("#single-result").innerText(),
    new RegExp(fmt(baseline.estimate)),
  );
  const first = await page.locator("#single-result").innerText();
  await page.locator("#uncertainty-redraw").click();
  assert.notEqual(await page.locator("#single-result").innerText(), first);
  await page.locator("#restart").click();
  await page.locator("#opening-next").waitFor();
  await page.locator("#opening-next").click();
  await page.locator("#opening-next").click();
  assert.equal(await page.locator("#single-result").innerText(), first);
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .locator('section[aria-labelledby="single-title"]')
      .screenshot({ path: `/tmp/uncertainty-single-visual-${width}.png` });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator("#reveal-coverage").focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page
      .locator("#coverage-title")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  assert.equal(
    await page.locator("#coverage-plot .inference-interval").count(),
    50,
  );
  const batch = Array.from({ length: 50 }, (_, i) =>
    uncertaintyStudy({ seed: 12000 + i }),
  );
  const covered = coverageSummary(batch).covered;
  assert.match(
    await page.locator("#coverage-summary").innerText(),
    new RegExp(`${covered} of 50`),
  );
  assert.equal(
    await page.locator('#coverage-plot [data-covered="false"]').count(),
    50 - covered,
  );
  assert.equal(await page.locator("#single-plot .inference-truth").count(), 1);
  await page.locator("#repeat-coverage").click();
  assert.match(await page.locator("#coverage-summary").innerText(), /of 100/);
  assert.equal(await page.locator(".inference-page table").count(), 0);
  assert.equal(
    await page.locator("#coverage-plot .inference-interval").count(),
    50,
  );
  await page.locator("#show-precision").click();
  const small = await page.locator("#precision-summary").innerText();
  await page.locator("#uncertainty-n").focus();
  await page.keyboard.press("End");
  assert.equal(await page.locator("#uncertainty-n").inputValue(), "3200");
  assert.notEqual(await page.locator("#precision-summary").innerText(), small);
  await page.locator("#uncertainty-confounded").check();
  assert.match(await page.locator("#precision-world").innerText(), /confounds/);
  assert.match(await page.locator("#precision-summary").innerText(), /0 of 50/);
  await page.locator("#bootstrap > summary").focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page.locator("#bootstrap").evaluate((el) => el.open),
    true,
  );
  assert.equal(await page.locator("#run-bootstrap").isDisabled(), true);
  await page.locator("#draw-bootstrap").click();
  assert.equal(await page.locator("#bootstrap-results").isVisible(), false);
  await page.locator("#run-bootstrap").click();
  const boot = bootstrapDifference(uncertaintyRows(), { repetitions: 10 });
  assert.equal(
    await page.locator("#bootstrap-plot svg").getAttribute("data-count"),
    "10",
  );
  assert.ok(
    (await page.locator("#bootstrap-summary").innerText()).includes(
      fmt(boot.se),
    ),
  );
  const trace = await page
    .locator("#bootstrap-trace .resample-person")
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        person: Number(node.dataset.person),
        count: Number(node.dataset.copies),
        tokens: node.querySelectorAll(".resampled-copies .person-token").length,
      })),
    );
  for (const item of trace) {
    assert.equal(item.count, boot.firstCounts[item.person - 1]);
    assert.equal(item.tokens, item.count);
  }
  assert.equal(trace.length, 6);
  const truthPosition = await page
    .locator("#bootstrap-plot .inference-truth")
    .getAttribute("d");
  const firstPosition = await page
    .locator("#bootstrap-plot .bootstrap-first")
    .getAttribute("cx");
  const firstBars = await page
    .locator("#bootstrap-plot .bootstrap-bar")
    .evaluateAll((nodes) => nodes.map((node) => Number(node.dataset.count)));
  await page.locator("#run-bootstrap").click();
  assert.equal(
    await page.locator("#bootstrap-plot svg").getAttribute("data-count"),
    "20",
  );
  const nextBars = await page
    .locator("#bootstrap-plot .bootstrap-bar")
    .evaluateAll((nodes) => nodes.map((node) => Number(node.dataset.count)));
  assert.equal(
    nextBars.reduce((sum, value) => sum + value, 0),
    20,
  );
  nextBars.forEach((count, i) => assert.ok(count >= firstBars[i]));
  assert.equal(
    await page.locator("#bootstrap-plot .inference-truth").getAttribute("d"),
    truthPosition,
  );
  assert.equal(
    await page.locator("#bootstrap-plot .bootstrap-first").getAttribute("cx"),
    firstPosition,
  );
  await page.locator("#run-bootstrap").click();
  assert.equal(
    await page.locator("#bootstrap-plot svg").getAttribute("data-count"),
    "30",
  );
  await page.locator("#finish-bootstrap").click();
  assert.equal(
    await page.locator("#bootstrap-plot svg").getAttribute("data-count"),
    "1000",
  );
  assert.equal(await page.locator("#run-bootstrap").isDisabled(), true);
  assert.equal(
    await page.locator("#bootstrap-plot .inference-truth").getAttribute("d"),
    truthPosition,
  );
  await page.locator("#bootstrap-confounded").check();
  assert.equal(await page.locator("#bootstrap-results").isVisible(), false);
  await page.locator("#draw-bootstrap").click();
  await page.locator("#run-bootstrap").click();
  assert.equal(
    await page.locator("#bootstrap-plot .inference-truth").getAttribute("d"),
    truthPosition,
  );
  await page.locator("#run-bootstrap").click();
  await page.locator("#finish-bootstrap").click();
  assert.match(
    await page.locator("#bootstrap-takeaway").innerText(),
    /reuses the imbalance/,
  );
  assert.equal(await page.locator(".inference-page table").count(), 0);
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page
        .locator("#bootstrap")
        .screenshot({ path: `/tmp/bootstrap-${colorScheme}-${width}.png` });
    }
  }
  await page.locator('[data-answer="0"]').click();
  assert.match(
    await page.locator("#uncertainty-feedback").innerText(),
    /Try again/,
  );
  await page.locator('[data-answer="1"]').click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("causal-sandbox-progress")),
  );
  assert.equal(saved.answers["uncertainty-interpretation"].firstCorrect, false);
  assert.equal(
    saved.answers["uncertainty-interpretation"].eventuallyCorrect,
    true,
  );
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page
      .locator("#precision-section")
      .screenshot({ path: `/tmp/uncertainty-bias-${width}.png` });
    await page
      .locator("#coverage-section")
      .screenshot({ path: `/tmp/uncertainty-coverage-${width}.png` });
  }
  await page.locator("#uncertainty-caveats summary").tap();
  assert.equal(
    await page.locator("#uncertainty-caveats").evaluate((el) => el.open),
    true,
  );
  const stable = await page.locator("#precision-summary").innerText();
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  assert.equal(await page.locator("#precision-summary").innerText(), stable);
  await page
    .locator("#precision-section")
    .screenshot({ path: "/tmp/uncertainty-bias-dark-320.png" });
  await page.locator("#continue").click();
  await page.locator("#reveal-ipw").waitFor();
  await page.locator("#back").click();
  await page.locator("#opening-next").waitFor();
  await page.locator("#opening-next").click();
  await page.locator("#opening-next").click();
  assert.equal(await page.locator("#single-result").innerText(), first);
  assert.equal(await page.locator("#coverage-section").isVisible(), false);
  await page.locator("#p-values-link").click();
  await page.locator("#repeat-null").waitFor();
  assert.equal(await page.locator("#p-interpretation").isVisible(), false);
  await page.locator("#repeat-null").click();
  assert.equal(await page.locator("#null-plot .null-dot").count(), 100);
  await page.locator("#compare-observed").click();
  assert.equal(await page.locator("#null-plot .inference-tail").count(), 2);
  const observed = uncertaintyStudy({ effect: 0.1 });
  assert.ok(
    (await page.locator("#observed-p").innerText()).includes(
      pLabel(observed.p),
    ),
  );
  const referenceSE = observed.se;
  for (const estimate of [-0.35, 0, 0.35]) {
    await page.locator("#p-estimate").fill(String(estimate));
    for (const n of [200, 800, 3200]) {
      await page.locator("#p-n").fill(String(n));
      const result = normalInference(
        estimate,
        referenceSE * Math.sqrt(200 / n),
      );
      const note = await page.locator("#precision-note").innerText();
      assert.ok(note.includes(pLabel(result.p)));
      assert.ok(
        note.includes(
          result.lower <= 0 && result.upper >= 0 ? "includes" : "excludes",
        ),
      );
      assert.ok(
        (await page.locator("#precision-result").innerText()).includes(
          fmt(estimate),
        ),
      );
    }
  }
  await page.locator("#p-estimate").fill("0.35");
  await page.locator("#p-n").fill("200");
  const point = page.locator("#precision-interval .inference-interval circle");
  const intervalLine = page
    .locator("#precision-interval .inference-interval path")
    .first();
  const wideInterval = await intervalLine.getAttribute("d");
  const estimatePosition = await point.getAttribute("cx");
  const oldTail = await page
    .locator("#precision-null-plot .inference-tail")
    .first()
    .getAttribute("d");
  await page.locator("#p-n").fill("3200");
  assert.equal(await point.getAttribute("cx"), estimatePosition);
  assert.notEqual(await intervalLine.getAttribute("d"), wideInterval);
  assert.notEqual(
    await page
      .locator("#precision-null-plot .inference-tail")
      .first()
      .getAttribute("d"),
    oldTail,
  );
  await page.locator("#p-n").fill("450");
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page
      .locator('section[aria-labelledby="precision-title"]')
      .screenshot({ path: `/tmp/p-values-precision-${width}.png` });
    await page
      .locator('section[aria-labelledby="null-title"]')
      .screenshot({ path: `/tmp/p-values-null-${width}.png` });
  }
  await page.locator("#p-caveats summary").focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page.locator("#p-caveats").evaluate((el) => el.open),
    true,
  );
  await page.locator('[data-answer="2"]').click();
  assert.match(await page.locator("#p-feedback").innerText(), /Try again/);
  await page.locator('[data-answer="1"]').click();
  await page.locator("#restart").click();
  await page.locator("#repeat-null").waitFor();
  assert.equal(await page.locator("#p-n").inputValue(), "200");
  assert.equal(await page.locator("#null-plot .null-dot").count(), 0);
  assert.equal(await page.locator("#p-interpretation").isVisible(), false);
  await page.goto(`${url}?level=14`);
  await page.locator("#opening-next").waitFor();
  await page.goto(`${url}?lesson=ipw`);
  await page.locator("#lesson-menu-toggle").click();
  await page.locator('[data-level="14"]').click();
  await page.locator("#opening-next").waitFor();
  // Search -> glossary -> optional disclosure preserves both query and fragment.
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox").fill("bootstrap");
  await page.locator('#search-results a[href$="glossary/#bootstrap"]').click();
  await page.locator("#bootstrap.glossary-entry").waitFor();
  await page.locator("#bootstrap .glossary-related").click();
  await page.locator("#run-bootstrap").waitFor();
  assert.equal(
    await page.locator("#bootstrap").evaluate((el) => el.open),
    true,
  );
  assert.equal(
    await page
      .locator("#bootstrap > summary")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.locator("#draw-bootstrap").click();
  await page.locator("#run-bootstrap").click();
  assert.ok(await page.locator("#bootstrap-results").isVisible());
  await page.locator("#opening-next").click();
  await page.locator("#opening-next").click();
  await page.locator("#uncertainty-redraw").click();
  assert.equal(await page.locator("#bootstrap-results").isVisible(), false);
  assert.ok(
    (await page.locator("#single-result").innerText()).includes(
      fmt(uncertaintyStudy({ seed: 4218 }).estimate),
    ),
  );
  for (const [key, destination] of [
    ["standard-error", "uncertainty"],
    ["confidence-interval", "uncertainty"],
    ["p-value", "p-values"],
    ["uncertainty", "uncertainty"],
  ]) {
    await page.goto(`${url}glossary/#${key}`);
    await page.locator(`#${key} .glossary-related`).click();
    await page
      .locator(destination === "p-values" ? "#repeat-null" : "#opening-next")
      .waitFor();
    assert.equal(new URL(page.url()).searchParams.get("lesson"), destination);
  }
  assert.deepEqual(errors, []);
  console.log("Uncertainty and p-value browser checks passed");
} finally {
  await browser.close();
}
