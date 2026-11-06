import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { expect } from "@playwright/test";
import {
  launchBrowser,
  getAppUrl,
  collectPageErrors,
  stubGoatCounter,
} from "./browser-setup.mjs";

const browser = await launchBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  collectPageErrors(page, errors);
  await stubGoatCounter(page);
  const url = getAppUrl();

  // Discovery from the TMLE lesson's optional exploration.
  await page.goto(`${url}tmle/`);
  await page
    .getByRole("link", {
      name: "Why does causal ML need cross-fitting? →",
      exact: true,
    })
    .click();
  await expect(page.locator("h1")).toHaveText(
    "Why does causal ML need cross-fitting?",
  );
  await expect(page.locator(".lesson-nav-heading")).toContainText(
    "Advanced lesson",
  );

  // Prediction feedback.
  await page.locator('[data-answer="1"]').click();
  await expect(page.locator("#dml-feedback")).toContainText("Yes.");

  // Section 1: plug-in vs orthogonal score under oversmoothing.
  await page.locator("#run-smooth").click();
  await expect(page.locator("#smooth-plot .dml-strip")).toHaveCount(2);
  await expect(page.locator("#smooth-plot .dml-dot")).toHaveCount(400);
  await expect(page.locator("#smooth-takeaway")).toBeVisible();
  await expect(
    page.locator('#smooth-plot [data-estimator="plugIn"] .dml-bias.large'),
  ).toHaveCount(1);
  await expect(page.locator("#smooth-plot .dml-bias.large")).toHaveCount(1);
  await expect(page.locator("#smooth-plot .dml-gap")).toHaveCount(1);

  // Section 2: one fixed person; only the cross-fitting toggle changes the view.
  await expect(page.locator("#fold-schematic .dml-block.predict")).toHaveCount(
    1,
  );
  await expect(page.locator("#fold-schematic .dml-block.train")).toHaveCount(4);
  await expect(page.locator("#fold-note")).toContainText("held out");
  await expect(page.locator("#zoom-plot .dml-residual-label")).not.toHaveText(
    "residual 0.00",
  );
  await expect(page.locator("#residual-plot svg")).not.toHaveAttribute(
    "aria-label",
    /root mean square residual 0\.00/,
  );
  const ring = page.locator("#zoom-plot .dml-selected");
  const position = await ring.getAttribute("cx");
  await page.locator("#dml-crossfit").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#dml-crossfit")).not.toBeChecked();
  await expect(page.locator("#fold-schematic .dml-block.both")).toHaveCount(5);
  await expect(page.locator("#zoom-plot .dml-selected.self")).toHaveCount(1);
  expect(await ring.getAttribute("cx")).toBe(position);
  await expect(page.locator("#zoom-plot .dml-residual-label")).toContainText(
    "residual 0.00",
  );
  await expect(page.locator("#residual-plot svg")).toHaveAttribute(
    "aria-label",
    /root mean square residual 0\.00/,
  );
  await page.locator("#dml-crossfit").check();
  await expect(page.locator("#zoom-plot .dml-selected.self")).toHaveCount(0);
  await expect(page.locator("#dml-person")).toHaveCount(0);

  // Section 3: coverage from repeated studies, read from the rendered marks.
  await page.locator("#run-coverage").click();
  await expect(page.locator("#coverage-plots")).toBeVisible();
  const coverage = async (id) =>
    page
      .locator(`#${id} [data-covered]`)
      .evaluateAll(
        (marks) =>
          marks.filter((m) => m.dataset.covered === "true").length /
          marks.length,
      );
  await expect(page.locator("#coverage-in .coverage-readout.low")).toHaveCount(
    1,
  );
  await expect(
    page.locator("#coverage-cross .coverage-readout.low"),
  ).toHaveCount(0);
  const inSample = await coverage("interval-in");
  const crossFit = await coverage("interval-cross");
  assert.ok(inSample < 0.8, `in-sample coverage ${inSample}`);
  assert.ok(crossFit > 0.88, `cross-fit coverage ${crossFit}`);

  // Section 4: one static chart of coverage against k, no slider.
  await expect(page.locator("#dml-k")).toHaveCount(0);
  await page.locator("#run-explore").click();
  await expect(page.locator("#explore-takeaway")).toBeVisible({
    timeout: 60000,
  });
  for (const series of ["inSample", "crossFit"])
    await expect(
      page.locator(`#explore-plot [data-series="${series}"] circle`),
    ).toHaveCount(7);

  await mkdir("test-results/double-ml", { recursive: true });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const theme of ["light", "dark"]) {
      await page
        .getByRole("switch", { name: "Dark mode" })
        .setChecked(theme === "dark");
      await page.waitForTimeout(200);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}/${theme}: no horizontal overflow`,
      );
      await page.screenshot({
        path: `test-results/double-ml/page-${width}-${theme}.png`,
        fullPage: true,
      });
    }
  }

  assert.deepEqual(errors, []);
  console.log(
    "Double ML lesson: discovery, prediction, folds, coverage, keyboard, themes and narrow layouts passed.",
  );
} finally {
  await browser.close();
}
