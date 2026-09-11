import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { finalQuestions } from "../src/final-quiz-questions.js";
import {
  adjustmentChoice,
  validAdjustmentSets,
} from "../src/adjustment-model.js";
const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const select = async (choice) => {
    if (choice.startsWith("set:")) {
      for (const id of choice.slice(4).split(","))
        await page.locator(`[data-adjust-node="${id}"]`).click();
    } else await page.locator(`input[value="${choice}"]`).check();
  };
  await page.goto(`${url}?lesson=quiz`);
  await expect(page.locator("#quiz-question")).toBeVisible();
  const entryBefore = await page.evaluate(() =>
    sessionStorage.getItem("causal-sandbox-entry-quiz-v2"),
  );
  await page.goto(`${url}?lesson=leaving-the-sandbox`);
  await page.locator("#recap-quiz").click();
  await expect(page).toHaveURL(/lesson=final-quiz/);
  await expect(page.locator("#warmup-start")).toBeVisible();
  await page.locator('[data-adjust-node="C"]').focus();
  await page.keyboard.press("Space");
  await page.locator("#warmup-check").click();
  await expect(page.locator("#warmup-feedback")).toContainText("That’s right");
  await page.locator("#warmup-start").click();
  for (const [index, q] of finalQuestions.entries()) {
    await expect(page.locator("#final-question")).toHaveText(q.title);
    await expect(page.locator("#final-submit")).toBeDisabled();
    await expect(page.locator('a[href*="preset="]')).toHaveCount(0);
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${q.id} width ${width}`,
      );
      if (q.adjustment)
        await page.screenshot({
          path: `/tmp/final-quiz-${q.id}-${width}.png`,
          fullPage: true,
        });
    }
    if (index === 0) {
      // Toggle, keyboard, immutable wrong first answer, then a valid alternative.
      await page.locator('[data-adjust-node="C"]').focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Space");
      await expect(page.locator("#final-submit")).toBeDisabled();
      await select("set:C,M");
      await page.locator("#final-submit").click();
      await expect(page.locator("#final-feedback")).toContainText("0 points");
      await expect(page.locator(".adjustment-path")).toHaveCount(2);
      await expect(page.locator('[data-adjust-node="C"]')).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      await page.locator("#final-retry").tap();
    }
    const choice =
      index === 0
        ? "set:L"
        : index === 1
          ? "unsure"
          : q.adjustment
            ? validAdjustmentSets(q).length
              ? adjustmentChoice(validAdjustmentSets(q)[0])
              : "impossible"
            : q.answer;
    await select(choice);
    await page.locator("#final-submit").click();
    await expect(page.locator("#final-feedback")).toBeFocused();
    await expect(page.locator('a[href*="preset="]')).toHaveCount(0);
    if (index === 0)
      await expect(page.locator("#final-feedback")).toContainText(
        "score stays the same",
      );
    if (index === 1) {
      await page.locator("#final-back").click();
      await expect(page.locator('[data-adjust-node="M"]')).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.locator("#final-next").click();
      await expect(page.locator('input[value="unsure"]')).toBeChecked();
    }
    await page.locator("#final-next").click();
  }
  await expect(page.locator(".quiz-summary h2")).toHaveText(
    "Your results: 10/12",
  );
  await expect(page.locator(".final-quiz-review > details[open]")).toHaveCount(
    0,
  );
  await expect(
    page.locator('.final-quiz-review a[href*="preset="]'),
  ).toHaveCount(5);
  const [lab] = await Promise.all([
    page.waitForEvent("popup"),
    page.locator('.quiz-experiment a[href*="preset="]').click(),
  ]);
  lab.on("pageerror", (e) => errors.push(e.message));
  await expect(lab.locator("#lab-preset")).toHaveValue("adjustment");
  await expect(lab.locator("#lab-adjustment input:checked")).toHaveCount(2);
  await expect(lab.locator("#lab-model-caption")).toContainText("C");
  await expect(lab.locator("#lab-model-caption")).toContainText("M");
  const before = await lab.locator("#lab-estimates").innerText();
  const truth = await lab.locator("#lab-truth").innerText();
  await lab.locator("#lab-redraw").click();
  await expect(lab.locator("#lab-seed")).toHaveText("4218");
  assert.notEqual(await lab.locator("#lab-estimates").innerText(), before);
  await expect(lab.locator("#lab-truth")).toHaveText(truth);
  for (const width of [1280, 320]) {
    await lab.setViewportSize({ width, height: 900 });
    assert.ok(
      await lab.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await lab.screenshot({
      path: `/tmp/quiz-building-box-${width}.png`,
      fullPage: true,
    });
  }
  await lab.locator("#lab-reset").click();
  await expect(lab.locator("#lab-adjustment input:checked")).toHaveCount(0);
  await expect(lab.locator("#lab-seed")).toHaveText("4217");
  await lab.close();
  await expect(page.locator(".quiz-summary h2")).toHaveText(
    "Your results: 10/12",
  );
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: `/tmp/final-quiz-results-${width}.png`,
      fullPage: true,
    });
  }
  await page.locator(".final-quiz-review > details > summary").first().click();
  await expect(
    page.locator(".final-quiz-review > details").first(),
  ).toContainText("Your first answer: Adjust for C, M");
  await page.locator('[data-practice="0"]').click();
  await select("set:C");
  await page.locator("#final-submit").click();
  await page.locator("#final-results").click();
  await expect(page.locator(".quiz-summary h2")).toHaveText(
    "Your results: 10/12",
  );
  assert.equal(
    await page.evaluate(() =>
      sessionStorage.getItem("causal-sandbox-entry-quiz-v2"),
    ),
    entryBefore,
  );
  await page.locator("#final-restart").click();
  await expect(page.locator("#final-quiz-content")).toContainText(
    "Practice · Choose your adjustment set · Question 1",
  );
  await page.getByLabel("Color theme").selectOption("dark");
  await page.screenshot({
    path: "/tmp/final-quiz-dark-mobile.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("#warmup-start")).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    "Final quiz: 12 questions, keyboard/touch selection, alternative sets, deferred templates, popup transfer, redraw, first-answer scoring, mobile/dark and reset passed.",
  );
} finally {
  await browser.close();
}
