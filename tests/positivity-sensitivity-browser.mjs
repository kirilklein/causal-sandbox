import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { expect } from "@playwright/test";
import {
  launchBrowser,
  getAppUrl,
  collectPageErrors,
  stubGoatCounter,
} from "./browser-setup.mjs";
import {
  positivitySensitivity,
  recoveryPopulation,
  propensityDistribution,
} from "../src/positivity-sensitivity.js";

const browser = await launchBrowser();
const url = getAppUrl();
const title = "Beyond trimming: who is still missing?";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1100 },
  });
  const errors = [];
  collectPageErrors(page, errors);
  await stubGoatCounter(page);
  await page.goto(`${url}?lesson=trimming`);
  await page
    .getByRole("link", { name: "Beyond trimming →", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText(title);
  await expect(page.locator("#ps-exploration")).toBeHidden();
  await expect(page.locator("#ps-arithmetic")).toBeHidden();
  await expect(page.locator("#ps-propensity-chart")).toBeVisible();
  await expect(page.locator("#ps-propensity-chart")).toHaveAttribute(
    "aria-label",
    /Known propensity score distributions/,
  );
  const distribution = propensityDistribution();
  for (const [i, bin] of distribution.bins.entries()) {
    for (const arm of ["control", "treated"]) {
      const bar = page.locator(
        `#ps-propensity-chart [data-bin="${i}"] .ps-${arm}-bar`,
      );
      assert.ok(
        Math.abs(Number(await bar.getAttribute("data-share")) - bin[arm]) <
          1e-12,
      );
      assert.ok(
        Math.abs(
          Number(await bar.getAttribute("height")) / 170 - bin[arm] / 0.4,
        ) < 1e-12,
      );
    }
  }
  await expect(page.locator(".ps-excluded-bar")).toHaveCount(1);
  assert.ok(
    Math.abs(
      Number(
        await page.locator(".ps-excluded-bar").getAttribute("data-share"),
      ) - 0.4,
    ) < 1e-12,
  );
  const observed = await page.locator("#ps-observed").innerHTML();
  await page.locator('[data-prediction="yes"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#ps-feedback-text")).toContainText("Not quite.");
  await expect(page.locator("#ps-feedback-text")).toBeFocused();
  await expect(page.locator("#ps-exploration")).toBeVisible();
  await expect(page.locator("#ps-recoveries-value")).toHaveText("16");
  await expect(page.locator("#ps-untreated-total")).toHaveText("40 recover");
  await expect(page.locator("#ps-result")).toContainText("20 more recoveries");
  const fixedIds = [
    "ps-retained-treated",
    "ps-retained-untreated",
    "ps-excluded-treated",
  ];
  const fixed = await Promise.all(
    fixedIds.map((id) => page.locator(`#${id}`).innerHTML()),
  );
  await expect(page.locator(".ps-people .ps-person")).toHaveCount(200);
  await expect(page.locator("#ps-retained-treated .ps-recovered")).toHaveCount(
    36,
  );
  await expect(
    page.locator("#ps-retained-untreated .ps-recovered"),
  ).toHaveCount(24);
  await expect(page.locator("#ps-excluded-treated .ps-recovered")).toHaveCount(
    24,
  );
  await page.locator("#ps-calculation > summary").click();
  await expect(page.locator("#ps-calculation math msub")).toHaveCount(3);
  await expect(page.locator("#ps-arithmetic")).toHaveAttribute(
    "aria-label",
    "60 percent times +20 pp plus 40 percent times +20 pp equals +20 pp",
  );
  await page.locator("#ps-recoveries").focus();
  await page.keyboard.press("End");
  await expect(page.locator("#ps-result")).toContainText("4 fewer recoveries");
  await expect(page.locator("#ps-result")).toContainText("-4 pp");
  await expect(page.locator("#ps-untreated-total")).toHaveText("64 recover");
  await expect(page.locator("#ps-calculation")).toHaveAttribute("open", "");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#ps-result")).toContainText("2 fewer recoveries");
  await expect(page.locator("#ps-untreated-total")).toHaveText("62 recover");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#ps-result")).toContainText("cancel");
  await expect(page.locator("#ps-recoveries-value")).toHaveText("36");
  await expect(page.locator("#ps-arithmetic")).toHaveAttribute(
    "aria-label",
    "60 percent times +20 pp plus 40 percent times -30 pp equals 0 pp",
  );
  await page.keyboard.press("Home");
  await expect(page.locator("#ps-result")).toContainText("+36 pp");
  await expect(page.locator("#ps-untreated-total")).toHaveText("24 recover");

  // Reconcile every possible count with the causal model and actual filled dots.
  const excludedCount = Math.round(
    100 * (1 - recoveryPopulation.retainedShare),
  );
  const supportedRecoveries = Math.round(
    100 *
      recoveryPopulation.retainedShare *
      recoveryPopulation.retainedUntreated,
  );
  const treatedRecoveries = Math.round(
    100 *
      (recoveryPopulation.retainedShare * recoveryPopulation.retainedTreated +
        (1 - recoveryPopulation.retainedShare) *
          recoveryPopulation.excludedTreated),
  );
  for (let count = 0; count <= excludedCount; count += 2) {
    await page.locator("#ps-recoveries").evaluate((node, value) => {
      node.value = value;
      node.dispatchEvent(new Event("input", { bubbles: true }));
    }, String(count));
    const expected = positivitySensitivity(
      recoveryPopulation.excludedTreated - count / excludedCount,
    );
    await expect(page.locator("#ps-missing-dots .ps-recovered")).toHaveCount(
      count,
    );
    await expect(page.locator("#ps-missing-dots .ps-people")).toHaveAttribute(
      "aria-label",
      `Excluded without treatment, assumed: ${count} of ${excludedCount} recover`,
    );
    await expect(page.locator("#ps-untreated-total")).toHaveText(
      `${supportedRecoveries + count} recover`,
    );
    assert.ok(
      Math.abs(
        treatedRecoveries -
          supportedRecoveries -
          count -
          expected.overallEffect * 100,
      ) < 1e-10,
    );
    const effect = Math.round(expected.overallEffect * 100);
    await expect(page.locator("#ps-result")).toContainText(
      `${effect > 0 ? "+" : ""}${effect} pp`,
    );
    assert.deepEqual(
      await Promise.all(
        fixedIds.map((id) => page.locator(`#${id}`).innerHTML()),
      ),
      fixed,
    );
  }
  assert.equal(await page.locator("#ps-observed").innerHTML(), observed);
  await page.locator("#ps-practice > summary").click();
  await page.locator('[data-practice="all"]').click();
  await expect(page.locator("#ps-practice-feedback")).toContainText(
    "Not quite.",
  );
  await page.locator('[data-practice="retained"]').click();
  await expect(page.locator("#ps-practice-feedback")).toContainText("Correct.");
  await page.locator("#ps-feedback > summary").click();
  await expect(page.locator("#ps-feedback-text")).toBeHidden();
  await expect(page.locator("#ps-recoveries")).toHaveValue("40");
  await page.locator("#ps-calculation > summary").click();
  await page.locator("#ps-practice > summary").click();

  await mkdir("test-results/positivity-sensitivity", { recursive: true });
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const theme of ["light", "dark"]) {
      await page
        .getByRole("combobox", { name: "Color theme" })
        .selectOption(theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.locator("#ps-recoveries").focus();
      await page.keyboard.press("End");
      await page.keyboard.press("ArrowLeft");
      await expect(page.locator("#ps-recoveries-value")).toHaveText("38");
      await page.locator(".ps-propensity").screenshot({
        path: `test-results/positivity-sensitivity/propensity-${width}-${theme}.png`,
      });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}/${theme} page fits`,
      );
      assert.ok(
        await page.locator(".ps-recovery").evaluate((node) =>
          [...node.querySelectorAll(".ps-person, input")].every((mark) => {
            const box = mark.getBoundingClientRect();
            return box.left >= 0 && box.right <= innerWidth;
          }),
        ),
        `${width}/${theme} marks fit`,
      );
      const retainedTreated = await page
        .locator("#ps-retained-treated .ps-people")
        .boundingBox();
      const retainedUntreated = await page
        .locator("#ps-retained-untreated .ps-people")
        .boundingBox();
      assert.ok(
        Math.abs(retainedTreated.y - retainedUntreated.y) < 1,
        `${width}/${theme} compared counts align`,
      );
      await page.locator("#ps-exploration").screenshot({
        path: `test-results/positivity-sensitivity/${width}-${theme}.png`,
      });
      await page.locator("#ps-calculation > summary").click();
      await expect(page.locator("#ps-arithmetic")).toBeVisible();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}/${theme} formula fits`,
      );
      assert.ok(
        await page.locator("#ps-calculation").evaluate((node) => {
          const bounds = node.getBoundingClientRect();
          return [...node.querySelectorAll(".ps-equation math")].every(
            (math) => {
              const box = math.getBoundingClientRect();
              return box.left >= bounds.left && box.right <= bounds.right;
            },
          );
        }),
        `${width}/${theme} equations fit the disclosure`,
      );
      await page.locator("#ps-calculation").screenshot({
        path: `test-results/positivity-sensitivity/formulas-${width}-${theme}.png`,
      });
      await page.locator("#ps-calculation > summary").click();
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#ps-restart").click();
  await expect(page.locator("h1")).toBeFocused();
  await expect(page.locator("#ps-recoveries")).toHaveValue("16");
  await expect(page.locator("#ps-arithmetic")).toBeHidden();
  await expect(page.locator("#ps-exploration")).toBeHidden();
  await expect(page.locator("#ps-prediction")).toBeVisible();
  await expect(page.locator("#ps-practice-feedback")).toBeEmpty();
  await expect(page.locator(".ps-detail[open]")).toHaveCount(0);
  await page.locator('[data-prediction="no"]').click();
  await expect(page.locator("#ps-feedback-text")).toContainText("Correct.");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(page.locator('#lesson-menu a[aria-current="step"]')).toHaveText(
    "Beyond trimming",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "All topics", exact: true }).click();
  await page
    .locator(".learning-topic-group > summary")
    .filter({ hasText: "What if the groups barely overlap?" })
    .click();
  await page.getByRole("link", { name: title, exact: false }).click();
  await expect(page.locator("h1")).toHaveText(title);
  await expect(page.locator("#ps-prediction")).toBeVisible();
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Refresh & go deeper");
  await page.goForward();
  await expect(page.locator("h1")).toHaveText(title);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox").fill("beyond trimming");
  await page
    .getByRole("link", { name: new RegExp(title.replace("?", "\\?")) })
    .click();
  await expect(page.locator("h1")).toHaveText(title);
  assert.deepEqual(errors, []);

  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await stubGoatCounter(touch);
  const phone = await touch.newPage();
  collectPageErrors(phone, errors);
  await phone.goto(`${url}?lesson=positivity-sensitivity`);
  await phone.locator('[data-prediction="no"]').tap();
  await phone.locator("#ps-recoveries").scrollIntoViewIfNeeded();
  const box = await phone.locator("#ps-recoveries").boundingBox();
  await phone.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(phone.locator("#ps-recoveries")).toHaveValue("20");
  await expect(phone.locator("#ps-result")).toContainText("+16 pp");
  await phone.getByRole("link", { name: "← Trimming", exact: true }).tap();
  await expect(phone.locator("h1")).toHaveText("Who remains after trimming?");
  assert.deepEqual(errors, []);
  await touch.close();
  console.log(
    "Advanced positivity: recovery counts, fixed observations, all assumptions, prediction, practice, discovery, reset, history, keyboard/touch and responsive themes passed.",
  );
} finally {
  await browser.close();
}
