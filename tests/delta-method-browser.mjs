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
  orderRatioApproximation,
  ratioStudy,
  jointRatioApproximation,
  deltaRatioDifference,
  bootstrapRatioDifference,
} from "../src/delta-method.js";
import { number } from "../src/delta-method-view.js";

const browser = await launchBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  collectPageErrors(page, errors);
  await stubGoatCounter(page);
  const url = getAppUrl();
  await page.goto(`${url}?lesson=uncertainty`);
  await page
    .getByRole("link", {
      name: "How uncertain is revenue per order? →",
      exact: true,
    })
    .click();
  await expect(page.locator("h1")).toHaveText(
    "How uncertain is revenue per order?",
  );
  await expect(page.locator("#dm-preview svg")).toHaveAttribute(
    "aria-label",
    /Horizontal axis: estimated orders per visitor.*Vertical axis: euros per order/,
  );
  await expect(page.locator("#dm-prediction")).toBeHidden();
  await expect(page.locator("#dm-preview .dm-input")).toHaveCount(0);
  await page.locator("#dm-point").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#dm-point-value")).toContainText("2.05 orders");
  await page.locator("#dm-distribution").click();
  await expect(page.locator("#dm-preview .dm-input")).toHaveCount(1);
  await expect(page.locator("#dm-reveal")).toBeDisabled();
  await expect(page.locator("#dm-ratios")).toBeHidden();
  await page
    .getByRole("radio", { name: "Still symmetric", exact: true })
    .focus();
  await page.keyboard.press("Space");
  await page.locator("#dm-reveal").click();
  await expect(page.locator("#dm-feedback")).toContainText(
    "stretches toward larger values",
  );
  await expect(page.locator("#dm-sd")).toBeFocused();
  await expect(page.locator("#dm-plots svg")).toHaveCount(1);
  await expect(page.locator("#dm-plots .dm-approx")).toHaveCount(0);
  await expect(page.locator("#dm-to-ratios")).toBeHidden();
  await page.locator("#dm-tangent").click();
  await expect(page.locator("#dm-plots .dm-approx")).toHaveCount(2);
  await expect(page.locator("#dm-sd")).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.locator("#dm-sd-value")).toHaveText(
    "0.45 orders / visitor",
  );
  await expect(page.locator("#dm-spread strong")).toHaveText(
    number(orderRatioApproximation(2, 0.45).exactSD),
  );
  assert.ok(
    await page.evaluate(() => {
      const ids = [
        "dm-feedback",
        "dm-curve-controls",
        "dm-plots",
        "dm-spread",
        "dm-slope",
        "dm-to-ratios",
      ];
      const tops = ids.map(
        (id) => document.getElementById(id).getBoundingClientRect().top,
      );
      return tops.every((top, i) => i === 0 || top >= tops[i - 1]);
    }),
    "Prediction feedback, controls, plots, readout and explanation follow reading order",
  );
  await page.locator("#dm-mean").focus();
  await page.keyboard.press("Home");
  await expect(page.locator("#dm-mean-value")).toHaveText(
    "1.50 orders / visitor",
  );
  await expect(page.locator("#dm-spread strong")).toHaveText(
    number(orderRatioApproximation(1.5, 0.45).exactSD),
  );
  await page.locator("#dm-mean").fill("2");
  await page.locator("#dm-mean").dispatchEvent("input");
  await page.locator("#dm-sd").focus();
  await page.keyboard.press("Home");
  await expect(page.locator("#dm-sd-value")).toHaveText(
    "0.10 orders / visitor",
  );
  assert.ok(
    await page
      .locator("#dm-sd")
      .evaluate(
        (node) => getComputedStyle(node).backgroundColor !== "rgba(0, 0, 0, 0)",
      ),
    "Slider track remains visible",
  );
  assert.ok(
    await page
      .locator(".lesson-nav-heading .search-open svg")
      .evaluate((node) => node.getBoundingClientRect().width <= 32),
    "Chart sizing does not affect the search icon",
  );
  await page.locator("#dm-to-ratios").click();
  await expect(page.locator("#dm-joint-title")).toBeFocused();
  await expect(page.locator("#dm-ratios")).toBeHidden();
  await page.locator("#dm-correlation").focus();
  await page.keyboard.press("End");
  await expect(page.locator("#dm-joint-readout")).toContainText(
    number(jointRatioApproximation(0.9).se),
  );
  await page.locator("#dm-to-experiment").click();
  await expect(page.locator("#dm-ratio-title")).toBeFocused();
  assert.ok(
    await page.evaluate(() => {
      const ids = [
        "dm-redraw",
        "dm-sample",
        "dm-bootstrap",
        "dm-intervals",
        "dm-interval-values",
        "dm-repeat",
      ];
      const tops = ids.map(
        (id) => document.getElementById(id).getBoundingClientRect().top,
      );
      return tops.every((top, i) => i === 0 || top >= tops[i - 1]);
    }),
    "Study actions precede their results, followed by the coverage experiment",
  );
  await page.locator("#dm-bootstrap").click();
  const rows = ratioStudy();
  for (const result of [
    deltaRatioDifference(rows),
    bootstrapRatioDifference(rows, { seed: 4217 + 7300 }),
  ]) {
    await expect(page.locator("#dm-interval-values")).toContainText(
      `[${number(result.lower)}, ${number(result.upper)}]`,
    );
  }
  await page.locator("#dm-repeat").click();
  await expect(page.locator("#dm-progress")).toHaveText(
    "100 / 100 fresh studies completed.",
    { timeout: 30000 },
  );
  await expect(page.locator("#dm-repeat")).toBeEnabled();
  await expect(page.locator("#dm-delta-summary")).toContainText(
    "/ 100 contain truth",
  );
  await expect(page.locator("#dm-delta-coverage [data-covered]")).toHaveCount(
    100,
  );
  await mkdir("test-results/delta-method", { recursive: true });
  await page
    .locator("#dm-coverage")
    .screenshot({ path: "test-results/delta-method/coverage-desktop.png" });
  await page.locator("#dm-n").selectOption("40");
  await page.locator("#dm-active").selectOption("0.08");
  await expect(page.locator("#dm-coverage")).toBeHidden();
  await expect(page.locator("#dm-interval-values")).toContainText(
    "Run the bootstrap",
  );
  await page.locator("#dm-bootstrap").click();
  await expect(page.locator("#dm-interval-values")).toContainText(
    "no percentile interval is reported",
  );
  await page.locator("#dm-n").selectOption("800");
  await page.locator("#dm-repeat").click();
  await page.locator("#dm-cancel").click();
  await expect(page.locator("#dm-progress")).toContainText("Stopped after");
  await expect(page.locator("#dm-repeat")).toBeEnabled();
  await page.locator("#dm-repeat").click();
  await page.locator("#dm-active").selectOption("0.8");
  await expect(page.locator("#dm-coverage")).toBeHidden();
  await expect(page.locator("#dm-progress")).toBeEmpty();
  await expect(page.locator("#dm-repeat")).toBeEnabled();
  await page.locator("#dm-n").selectOption("200");
  await page.locator("#dm-bootstrap").click();
  await page.getByText("Check your interpretation", { exact: true }).click();
  await page
    .getByRole("button", { name: "Agreement alone cannot establish coverage" })
    .click();
  await expect(page.locator("#dm-check-feedback")).toContainText("Right.");
  await page.getByText("Check your interpretation", { exact: true }).click();
  await page.locator("#dm-sd").focus();
  await page.keyboard.press("End");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const theme of ["light", "dark"]) {
      await page
        .getByRole("combobox", { name: "Color theme" })
        .selectOption(theme);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}/${theme}: no horizontal overflow`,
      );
      await expect
        .poll(
          () =>
            page
              .locator("#dm-plots svg")
              .evaluate((svg) =>
                Math.abs(
                  svg.viewBox.baseVal.width - svg.getBoundingClientRect().width,
                ),
              ),
          { message: `${width}/${theme}: diagram keeps text at readable size` },
        )
        .toBeLessThan(2);
      for (const svg of await page
        .locator("#dm-plots svg, #dm-intervals svg, #dm-joint-plot svg")
        .all()) {
        assert.ok(
          await svg.evaluate((node) => {
            const bounds = node.getBoundingClientRect();
            return [...node.querySelectorAll("text")].every((text) => {
              const box = text.getBoundingClientRect();
              return (
                box.left >= bounds.left - 1 &&
                box.right <= bounds.right + 1 &&
                box.top >= bounds.top - 1 &&
                box.bottom <= bounds.bottom + 1
              );
            });
          }),
          `${width}/${theme}: chart labels fit`,
        );
      }
      for (const id of ["dm-plots", "dm-joint"]) {
        await page.locator(`#${id}`).screenshot({
          path: `test-results/delta-method/${id}-${width}-${theme}.png`,
        });
      }
      await page.screenshot({
        path: `test-results/delta-method/lesson-${width}-${theme}.png`,
        fullPage: true,
      });
      for (const id of [
        "dm-slope",
        "dm-covariance",
        "dm-bootstrap-details",
        "dm-model",
      ]) {
        await page.locator(`#${id} > summary`).click();
        for (const formula of await page
          .locator(`#${id} [role="math"]`)
          .all()) {
          await expect(formula).toHaveAttribute("aria-label", /.+/);
          assert.ok(
            await formula.evaluate((node) => {
              const bounds = node.getBoundingClientRect();
              return [...node.querySelectorAll("math")].every((math) => {
                const box = math.getBoundingClientRect();
                return (
                  getComputedStyle(math).display.includes("math") &&
                  box.height < 100 &&
                  box.left >= bounds.left - 1 &&
                  box.right <= bounds.right + 1
                );
              });
            }),
            `${width}/${theme}/${id}: formulas fit without horizontal scrolling`,
          );
        }
        if (width === 320 || width === 1440)
          await page.locator(`#${id}`).screenshot({
            path: `test-results/delta-method/${id}-${width}-${theme}.png`,
          });
        await page.locator(`#${id} > summary`).click();
      }
    }
  }
  await expect(page.locator(".dm-credit").first()).toBeVisible();
  await expect(page.locator(".dm-credit").first()).toContainText(
    "Anton Bugaev",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#dm-restart").click();
  await expect(page.locator("#dm-ratios")).toBeHidden();
  await expect(page.locator("#dm-reveal")).toBeDisabled();
  await expect(page.locator("#dm-sd")).toHaveValue("0.25");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(page.locator('#lesson-menu a[aria-current="step"]')).toHaveText(
    "The Delta Method",
  );
  await page.goto(`${url}?lesson=topics`);
  await page
    .locator(".learning-topic-group > summary")
    .filter({ hasText: "How uncertain is the result?" })
    .click();
  await page
    .getByRole("link", {
      name: "How uncertain is revenue per order?",
      exact: true,
    })
    .click();
  await expect(page.locator("h1")).toHaveText(
    "How uncertain is revenue per order?",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Delta lesson: prediction, inference, coverage, cancellation, reset, discovery, keyboard, themes and narrow layouts passed.",
  );
} finally {
  await browser.close();
}
