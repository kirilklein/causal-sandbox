import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { fitPropensity } from "../src/simulation.js";
import {
  propensityBaseline,
  propensityCohort,
} from "../src/propensity-experiment.js";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*.goatcounter.com/**", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"count":"0"}' }),
  );
  await page.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );

  await page.goto(`${url}?lesson=ipw`);
  await page.locator("#reveal-ipw").click();
  const estimate = await page.locator("#ipw").textContent();
  const sample = await page.locator("#sample-label").textContent();
  await page.locator(".lesson-explanation > summary").click();
  assert.equal(
    await page.locator("#propensity-preview .ps-patient").count(),
    120,
  );
  assert.match(
    await page.locator(".ps-preview-reading").innerText(),
    /received no treatment/,
  );
  const previewSelect = page.locator("#propensity-preview select");
  await previewSelect.focus();
  await previewSelect.press("ArrowDown");
  await previewSelect.press("Enter");
  assert.match(
    await page.locator(".ps-preview-reading").innerText(),
    new RegExp(`Person ${await previewSelect.inputValue()} `),
  );
  assert.equal(await page.locator("#ipw").textContent(), estimate);
  assert.equal(await page.locator("#sample-label").textContent(), sample);
  await page
    .locator(".lesson-explanation")
    .screenshot({ path: "/tmp/propensity-preview-desktop.png" });
  await page.locator("#propensity-preview a").click();
  await page.locator("#ps-fit").waitFor();
  assert.equal(
    new URL(page.url()).searchParams.get("lesson"),
    "propensity-score",
  );
  assert.equal(await page.locator("#ps-scatter .ps-patient").count(), 400);
  assert.equal(await page.locator("#ps-score-section").isVisible(), false);
  const selected = await page.locator("#ps-person").inputValue();
  await page.locator("#ps-fit").focus();
  await page.locator("#ps-fit").press("Enter");
  assert.equal(await page.locator("#ps-person").inputValue(), selected);
  assert.equal(await page.locator("#ps-score-section").isVisible(), true);
  const data = propensityCohort(propensityBaseline);
  const fit = fitPropensity(data, ["C"]);
  assert.equal(
    await page.locator("#ps-person-prediction strong").textContent(),
    `${(100 * fit.propensities[Number(selected) - 1]).toFixed(1)}%`,
  );
  assert.equal(await page.locator("#ps-scores .ps-patient").count(), 400);
  for (const [selector, arm] of [
    [".ps-treated", 1],
    [".ps-untreated", 0],
  ])
    assert.equal(
      await page.locator(`#ps-scores ${selector}`).count(),
      data.filter((d) => d.A === arm).length,
    );
  await page.locator('#ps-scatter [data-patient="1"]').click();
  assert.equal(await page.locator("#ps-person").inputValue(), "1");
  assert.equal(
    await page.locator('#ps-scores [data-patient="1"] .ps-selection').count(),
    1,
  );
  await page.locator('#ps-scores [data-patient="400"]').click();
  assert.equal(await page.locator("#ps-person").inputValue(), "400");
  await page.locator("#ps-person").selectOption("2");

  const positions = () =>
    page
      .locator("#ps-scatter .ps-patient")
      .evaluateAll((marks) =>
        Object.fromEntries(
          marks.map((m) => [m.dataset.patient, m.getAttribute("transform")]),
        ),
      );
  const initialPositions = await positions();
  const initialPrediction = await page
    .locator("#ps-person-prediction")
    .textContent();
  await page.locator("#ps-age").focus();
  await page.locator("#ps-age").press("ArrowRight");
  assert.equal(await page.locator("#ps-age").inputValue(), "0.9");
  assert.deepEqual(await positions(), initialPositions);
  assert.notEqual(
    await page.locator("#ps-person-prediction").textContent(),
    initialPrediction,
  );
  assert.equal(await page.locator("#ps-person").inputValue(), "2");
  await page.locator("#ps-age").fill("2");
  await page.locator("#ps-severity").fill("-2");
  const changedFit = fitPropensity(
    propensityCohort({ ...propensityBaseline, age: 2, severity: -2 }),
    ["C"],
  );
  assert.equal(
    await page.locator("#ps-person-prediction strong").textContent(),
    `${(100 * changedFit.propensities[1]).toFixed(1)}%`,
  );
  await page.locator("#ps-age").fill("0");
  await page.locator("#ps-severity").fill("0");
  assert.equal(await page.locator("#ps-score-section").isVisible(), true);
  await page.locator("#ps-redraw").click();
  assert.match(await page.locator("#ps-sample").innerText(), /4218/);
  await page.locator("#ps-reset").click();
  assert.equal(await page.locator("#ps-score-section").isVisible(), false);
  assert.match(await page.locator("#ps-sample").innerText(), /4217/);
  await page.locator("#ps-fit").click();
  await page.locator("#ps-age").fill("1.5");
  await page.locator("#ps-severity").fill("1.5");
  await page
    .locator("main")
    .screenshot({ path: "/tmp/propensity-desktop.png" });
  const modelText = await page.locator("#ps-person-prediction").textContent();
  await page.getByLabel("Color theme").selectOption("dark");
  assert.equal(
    await page.locator("#ps-person-prediction").textContent(),
    modelText,
  );
  await page.setViewportSize({ width: 320, height: 850 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page
    .locator("main")
    .screenshot({ path: "/tmp/propensity-mobile-dark.png" });
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  assert.match(
    await page.locator('.optional-menu [aria-current="step"]').textContent(),
    /Propensity scores/,
  );
  await page
    .getByRole("button", { name: "Contents", exact: true })
    .press("Escape");
  await page
    .getByRole("link", { name: "← Return to IPW", exact: true })
    .click();
  await page.locator("#reveal-ipw").waitFor();
  await page.locator(".lesson-explanation > summary").click();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page
    .locator(".lesson-explanation")
    .screenshot({ path: "/tmp/propensity-preview-mobile.png" });
  await page.goBack();
  await page.locator("#ps-fit").waitFor();
  await page.reload();
  assert.equal(await page.locator("#ps-score-section").isVisible(), false);
  assert.deepEqual(errors, []);
  const touch = await browser.newPage({
    viewport: { width: 375, height: 850 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  await touch.route("**/*.goatcounter.com/**", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"count":"0"}' }),
  );
  await touch.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await touch.goto(`${url}?lesson=propensity-score`);
  await touch.locator("#ps-fit").tap();
  await touch.locator("#ps-age").tap({ position: { x: 20, y: 2 } });
  assert.notEqual(await touch.locator("#ps-age").inputValue(), "0.8");
  assert.equal(await touch.locator("#ps-score-section").isVisible(), true);
  assert.ok(
    await touch.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await touch
    .locator("main")
    .screenshot({ path: "/tmp/propensity-mobile-light.png" });
  await touch.close();
  console.log("Propensity lesson browser checks passed.");
} finally {
  await browser.close();
}
