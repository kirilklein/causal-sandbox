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
  positivityBounds,
  propensityDistribution,
  simulationTruth,
} from "../src/positivity-sensitivity.js";

const browser = await launchBrowser();
const url = getAppUrl();
const title = "Beyond trimming: bounds and sensitivity";
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
  await expect(page.locator("#ps-exploration")).toBeVisible();
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
  await expect(page.locator(".ps-evidence")).toContainText(
    "60% − 40% = +20 pp",
  );
  await expect(page.locator("#ps-show-truth")).not.toBeChecked();
  await expect(page.locator("#ps-truth-explanation")).toBeHidden();
  await expect(page.locator(".ps-effect-truth")).toHaveCount(0);
  const observed = await page.locator("#ps-observed").innerHTML();
  await expect(page.locator("#ps-limit-value")).toHaveText("At most 100%");
  await expect(page.locator("#ps-result")).toHaveText("-4 pp to +36 pp");
  await expect(page.locator("#ps-att-chart")).toBeVisible();
  await expect(page.locator("#ps-interpretation")).toContainText(
    "the ATT can be negative or positive",
  );
  await page.locator("#ps-calculation > summary").click();
  await expect(page.locator("#ps-calculation math msub")).toHaveCount(3);
  await expect(page.locator("#ps-arithmetic")).toHaveAttribute(
    "aria-label",
    "Lower bound: 60 percent times +20 pp plus 40 percent times -40 pp equals -4 pp",
  );
  await page.locator("#ps-limit").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#ps-result")).toHaveText("-2 pp to +36 pp");
  await expect(page.locator("#ps-interpretation")).toContainText(
    "still allows a negative ATT",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#ps-result")).toHaveText("0 pp to +36 pp");
  await expect(page.locator("#ps-interpretation")).toContainText(
    "90% is the tipping point",
  );
  await expect(page.locator("#ps-arithmetic")).toHaveAttribute(
    "aria-label",
    "Lower bound: 60 percent times +20 pp plus 40 percent times -30 pp equals 0 pp",
  );
  await expect(page.locator("#ps-calculation")).toHaveAttribute("open", "");
  await page.keyboard.press("Home");
  await expect(page.locator("#ps-result")).toHaveText("+36 pp to +36 pp");

  const boundsBeforeReveal = await page.locator("#ps-result").textContent();
  await page.locator("#ps-show-truth").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#ps-truth-explanation")).toBeVisible();
  await expect(page.locator("#ps-result")).toHaveText(boundsBeforeReveal);
  await expect(page.locator("#ps-truth-explanation")).toContainText(
    "60% × (+20 pp) + 40% × (-20 pp) = +4 pp",
  );

  // Reconcile plot geometry with the model, including a collapsed interval.
  for (let limit = 0; limit <= 100; limit += 5) {
    await page.locator("#ps-limit").evaluate((node, value) => {
      node.value = value;
      node.dispatchEvent(new Event("input", { bubbles: true }));
    }, String(limit));
    const [lower, upper] = positivityBounds(limit / 100);
    const chart = page.locator("#ps-att-chart");
    await expect(chart).toHaveAttribute("data-domain-min", "-10");
    await expect(chart).toHaveAttribute("data-domain-max", "40");
    const marks = await chart.evaluate((svg) => {
      const interval = svg.querySelector(".ps-effect-interval");
      const dot = svg.querySelector(".ps-effect-bound");
      const axis = svg.querySelector(".ps-effect-axis");
      return {
        left: interval.x1.baseVal.value,
        right: interval.x2.baseVal.value,
        dot: dot.cx.baseVal.value,
        truth: svg.querySelector(".ps-effect-truth").x1.baseVal.value,
        zero: svg.querySelector(".ps-effect-zero").x1.baseVal.value,
        axisLeft: axis.x1.baseVal.value,
        axisRight: axis.x2.baseVal.value,
      };
    });
    const toEffect = (x) =>
      -10 + ((x - marks.axisLeft) / (marks.axisRight - marks.axisLeft)) * 50;
    assert.ok(Math.abs(toEffect(marks.left) - lower * 100) < 1e-4);
    assert.ok(Math.abs(toEffect(marks.right) - upper * 100) < 1e-4);
    assert.ok(Math.abs(toEffect(marks.zero)) < 1e-4);
    assert.equal(marks.dot, marks.left);
    assert.ok(
      Math.abs(toEffect(marks.truth) - simulationTruth.overallEffect * 100) <
        1e-4,
    );
    await expect(page.locator("#ps-truth-status")).toContainText(
      limit < 80
        ? "bounds exclude the true ATT"
        : "bounds include the true ATT",
    );
    const value = Math.round(lower * 100);
    await expect(page.locator("#ps-result")).toHaveText(
      `${value > 0 ? "+" : ""}${value} pp to +36 pp`,
    );
  }
  assert.equal(await page.locator("#ps-observed").innerHTML(), observed);
  await page.locator('[data-practice="point"]').click();
  await expect(page.locator("#ps-practice-feedback")).toContainText(
    "Not quite.",
  );
  await page.locator('[data-practice="positivity"]').click();
  await expect(page.locator("#ps-practice-feedback")).toContainText(
    "supplies no missing controls",
  );
  await page.locator('[data-practice="bounds"]').click();
  await expect(page.locator("#ps-practice-feedback")).toContainText("Correct.");
  await expect(page.locator("#ps-limit")).toHaveValue("100");
  await page.locator("#ps-calculation > summary").click();

  await mkdir("test-results/positivity-sensitivity", { recursive: true });
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const theme of ["light", "dark"]) {
      await page
        .getByRole("combobox", { name: "Color theme" })
        .selectOption(theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.locator("#ps-limit").focus();
      await page.keyboard.press("End");
      await page.keyboard.press("ArrowLeft");
      await expect(page.locator("#ps-limit-value")).toHaveText("At most 95%");
      await page.locator(".ps-propensity").screenshot({
        path: `test-results/positivity-sensitivity/propensity-${width}-${theme}.png`,
      });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}/${theme} page fits`,
      );
      const plotBox = await page.locator("#ps-att-chart").boundingBox();
      assert.ok(
        plotBox.height <= 110,
        `${width}/${theme} effect plot stays shallow`,
      );
      assert.ok(
        plotBox.x >= 0 && plotBox.x + plotBox.width <= width,
        `${width}/${theme} effect plot fits`,
      );
      await page.locator("#ps-exploration").screenshot({
        path: `test-results/positivity-sensitivity/${width}-${theme}.png`,
      });
      await page.screenshot({
        path: `test-results/positivity-sensitivity/flow-${width}-${theme}.png`,
        fullPage: true,
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
  await expect(page.locator("#ps-limit")).toHaveValue("100");
  await expect(page.locator("#ps-show-truth")).not.toBeChecked();
  await expect(page.locator("#ps-truth-explanation")).toBeHidden();
  await expect(page.locator(".ps-effect-truth")).toHaveCount(0);
  await expect(page.locator("#ps-arithmetic")).toBeHidden();
  await expect(page.locator("#ps-exploration")).toBeVisible();
  await expect(page.locator("#ps-result")).toHaveText("-4 pp to +36 pp");
  await expect(page.locator("#ps-practice-feedback")).toBeEmpty();
  await expect(page.locator(".ps-detail[open]")).toHaveCount(0);
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
  await expect(page.locator("#ps-result")).toHaveText("-4 pp to +36 pp");
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
  await phone.locator("#ps-limit").scrollIntoViewIfNeeded();
  const box = await phone.locator("#ps-limit").boundingBox();
  await phone.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(phone.locator("#ps-limit")).toHaveValue("50");
  await expect(phone.locator("#ps-result")).toHaveText("+16 pp to +36 pp");
  await phone.getByRole("link", { name: "← Trimming", exact: true }).tap();
  await expect(phone.locator("h1")).toHaveText("Who remains after trimming?");
  assert.deepEqual(errors, []);
  await touch.close();
  console.log(
    "Advanced positivity: compact bound plot, fixed observations, all upper bounds, tipping point, practice, discovery, reset, history, keyboard/touch and responsive themes passed.",
  );
} finally {
  await browser.close();
}
