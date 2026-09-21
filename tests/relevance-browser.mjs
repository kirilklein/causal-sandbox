import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { expect } from "@playwright/test";
import {
  launchBrowser,
  getAppUrl,
  collectPageErrors,
  stubGoatCounter,
} from "./browser-setup.mjs";
import { relevanceSample } from "../src/relevance-simulation.js";
import { studySummary } from "../src/instrument-simulation.js";

const browser = await launchBrowser();
const url = getAppUrl();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1100 },
  });
  const errors = [];
  collectPageErrors(page, errors);
  await stubGoatCounter(page);
  await page.goto(`${url}?lesson=hidden-confounding`);
  await page
    .getByRole("link", { name: "Does this variable matter? →", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Does this variable matter?");
  await expect(page.locator("#world-truth")).toBeHidden();
  await expect(page.locator("#world-graph")).toBeEmpty();
  await expect(page.locator(".comparison-value")).toHaveCount(0);
  const checkFits = async (world, seed = 4217) => {
    const expected = relevanceSample({ world, seed });
    for (let i = 0; i < 2; i++) {
      await expect(page.locator(`#prediction-${i}`)).toHaveText(
        expected.fits[i].rmse.toFixed(3),
      );
      const estimate = page.locator(`#effect-${i} strong`);
      if (await estimate.count())
        await expect(estimate).toHaveText(expected.fits[i].effect.toFixed(3));
      else
        await expect(page.locator(`#effect-${i}`)).toHaveText(
          expected.fits[i].effect.toFixed(3),
        );
    }
  };
  await checkFits("unrelated");
  await page.locator("#reveal").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#world-title")).toHaveText(
    "An unrelated variable",
  );
  await expect(page.locator("#causal-truth")).toContainText(
    "V’s total effect on Y: 0",
  );
  await checkFits("unrelated");
  await page.locator("#reveal").click();
  await expect(page.locator("#causal-truth")).toBeEmpty();
  await expect(page.locator(".comparison-value")).toHaveCount(0);
  await page.getByRole("radio", { name: "World 1", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("radio", { name: "World 2", exact: true }),
  ).toBeChecked();
  await checkFits("predictor");
  await page.locator("#reveal").click();
  await expect(page.locator("#causal-truth")).toContainText(
    "V’s total effect on Y: 1.5",
  );
  await page.locator("#next").click();
  await checkFits("predictor");
  await expect(page.locator("#world-truth")).toBeHidden();
  await page.getByRole("radio", { name: "World 2", exact: true }).check();
  await checkFits("proxy");
  await page.locator("#reveal").click();
  await expect(page.locator("#world-graph svg")).toHaveAttribute(
    "aria-label",
    /U causes A.*U causes Y.*U causes V.*U unmeasured/,
  );
  await page.locator("#redraw").click();
  await checkFits("proxy", 4218);
  await expect(page.locator("#world-truth")).toBeVisible();
  await page.locator("#next").click();
  await checkFits("proxy", 4218);
  await page.getByRole("radio", { name: "World 2", exact: true }).check();
  await checkFits("collider", 4218);
  await page.locator("#reveal").click();
  await expect(page.locator("#world-title")).toContainText("collider");
  await expect(page.locator("#world-graph svg")).toHaveAttribute(
    "aria-label",
    /P causes V.*R causes V/,
  );
  await page.locator("#studies summary").click();
  await page.locator("#repeat").click();
  await expect(page.locator("#study-status")).toHaveText(
    "60 studies complete.",
  );
  const studies = Array.from({ length: 60 }, (_, i) =>
    relevanceSample({ world: "collider", seed: 100 + i }),
  );
  const batchValues = await page.locator("#study-results td").allTextContents();
  assert.deepEqual(batchValues, [
    ...[0, 1].map((j) =>
      studySummary(studies.map((s) => s.fits[j].effect)).mean.toFixed(3),
    ),
    ...[0, 1].map((j) =>
      studySummary(studies.map((s) => s.fits[j].effect)).sd.toFixed(3),
    ),
    ...[0, 1].map((j) =>
      studySummary(studies.map((s) => s.fits[j].rmse)).mean.toFixed(3),
    ),
  ]);
  await page.locator("#reveal").click();
  await expect(page.locator("#study-results caption")).not.toContainText(
    "true effect of A: 2",
  );
  await page.locator("#reveal").click();
  await page.locator("#redraw").click();
  assert.deepEqual(
    await page.locator("#study-results td").allTextContents(),
    batchValues,
  );
  await page.locator("#repeat").click();
  await page.locator("#previous").click();
  await expect(page.locator("#study-results")).toBeEmpty();
  await page.waitForTimeout(100);
  await expect(page.locator("#study-status")).toBeEmpty();
  await page
    .getByRole("button", { name: "Include it: prediction improved." })
    .click();
  await expect(page.locator("#practice-feedback")).toContainText(
    "baseline collider",
  );
  await page
    .getByRole("button", { name: "Omit it: it is not a proven cause." })
    .click();
  await expect(page.locator("#practice-feedback")).toContainText("proxy");
  await page
    .getByRole("button", { name: "Its adjustment role is still uncertain." })
    .click();
  await expect(page.locator("#practice-feedback")).toContainText("Yes.");
  await page.locator("#reset").click();
  await checkFits("unrelated");
  await expect(page.locator("#practice-feedback")).toBeEmpty();
  await expect(page.locator("#world-truth")).toBeHidden();
  await expect(page.locator("#comparison-title")).toHaveText(
    "Comparison 1 of 3",
  );

  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(page.locator('.optional-menu [aria-current="step"]')).toHaveText(
    "Does this variable matter?",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox").fill("causal relevance");
  await page.locator("#search-results a").first().click();
  await expect(page.locator("h1")).toHaveText("Does this variable matter?");
  await page.getByRole("link", { name: "All topics", exact: true }).click();
  await page
    .locator(".learning-topic-group > summary")
    .filter({ hasText: "What should I adjust for?" })
    .click();
  await page
    .locator(".learning-topic-columns a")
    .filter({ hasText: "Does this variable matter?" })
    .click();
  await expect(page.locator("h1")).toHaveText("Does this variable matter?");
  await page
    .getByRole("link", { name: "← Timing and adjustment", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Does this variable matter? →", exact: true })
    .click();

  await mkdir("test-results", { recursive: true });
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator("#reset").click();
    await page.locator("#next").click();
    await page.locator("#next").click();
    await page.getByRole("radio", { name: "World 2", exact: true }).check();
    await page.locator("#reveal").click();
    for (const mode of ["light", "dark"]) {
      const values = await page.locator(".relevance-metrics").innerText();
      await page.getByLabel("Color theme").selectOption(mode);
      assert.equal(
        await page.locator(".relevance-metrics").innerText(),
        values,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width} ${mode} overflow`,
      );
      await page
        .locator('section[aria-labelledby="comparison-title"]')
        .screenshot({ path: `test-results/relevance-${width}-${mode}.png` });
    }
  }
  const touch = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  await stubGoatCounter(touch);
  collectPageErrors(touch, errors);
  await touch.goto(`${url}?lesson=causal-relevance`);
  await touch.getByRole("radio", { name: "World 2", exact: true }).tap();
  await touch.locator("#reveal").tap();
  await expect(touch.locator("#world-title")).toContainText("outcome cause");
  assert.deepEqual(errors, []);
  console.log("Causal relevance browser checks passed.");
} finally {
  await browser.close();
}
