import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { finalQuestions } from "../src/final-quiz-questions.js";

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
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${url}?lesson=quiz`);
  await expect(page.locator("#quiz-question")).toBeVisible();
  const entryBefore = await page.evaluate(() =>
    sessionStorage.getItem("causal-sandbox-entry-quiz-v2"),
  );
  await page.goto(`${url}?lesson=leaving-the-sandbox`);
  await page.locator("#recap-quiz").click();
  await expect(page).toHaveURL(/lesson=final-quiz/);
  assert.ok(
    await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("causal-sandbox-progress"),
      ).completedLessons.includes("leaving-the-sandbox"),
    ),
  );
  await expect(page.locator(".lesson-nav-heading")).toContainText("Final quiz");
  await page.locator("#lesson-menu-toggle").click();
  await expect(
    page.locator('#lesson-menu a[href$="lesson=final-quiz"]'),
  ).toHaveAttribute("aria-current", "step");
  await page.keyboard.press("Escape");
  await expect(page.locator("#lesson-menu-toggle")).toBeFocused();
  for (const [index, question] of finalQuestions.entries()) {
    await expect(page.locator("#final-question")).toHaveText(question.title);
    await expect(page.locator("#final-feedback")).toBeHidden();
    await expect(page.locator("#final-submit")).toBeDisabled();
    await expect(page.locator(".quiz-assumptions").first()).not.toHaveAttribute(
      "open",
      "",
    );
    assert.equal(await page.locator(".quiz-figure figcaption").count(), 0);
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${question.id}: overflow at ${width}`,
      );
      if ([0, 2, 7].includes(index))
        await page.screenshot({
          path: `/tmp/final-quiz-${question.id}-${width}.png`,
          fullPage: true,
        });
    }
    if (index === 0) {
      const curveLength = await page
        .locator('.quiz-figure path[d*="Q"]')
        .evaluate((path) => path.getTotalLength());
      assert.ok(
        curveLength > 250 && curveLength < 400,
        "Direct A to Y curve is visible and correctly formed",
      );
      await page.locator('input[value="c-cm"]').focus();
      await page.keyboard.press("Space");
      await page.locator("#final-submit").focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("#final-feedback")).toBeFocused();
      await expect(page.locator("#final-feedback")).toContainText("0 points");
      await page.locator("#final-retry").tap();
    }
    await page
      .locator(`input[value="${index === 1 ? "unsure" : question.answer}"]`)
      .check();
    await page.locator("#final-submit").click();
    await expect(page.locator("#final-feedback")).toBeVisible();
    if (index === 0)
      await expect(page.locator("#final-feedback")).toContainText(
        "score stays the same",
      );
    if (index === 1) {
      await page.locator("#final-back").click();
      await expect(page.locator('input[value="c-cm"]')).toBeChecked();
      await expect(page.locator("fieldset input").first()).toBeDisabled();
      await page.locator("#final-next").click();
      await expect(page.locator('input[value="unsure"]')).toBeChecked();
    }
    await page.locator("#final-next").click();
  }
  await expect(page.locator(".quiz-summary h2")).toHaveText(
    "Your results: 6/8",
  );
  await expect(
    page.locator('.quiz-summary > ul a[href$="mediator-adjustment/"]'),
  ).toHaveCount(1);
  await expect(page.locator(".final-quiz-review > details[open]")).toHaveCount(
    0,
  );
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: `/tmp/final-quiz-results-${width}.png`,
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await page.locator(".final-quiz-review > details > summary").first().click();
  await expect(
    page.locator(".final-quiz-review > details").first(),
  ).toContainText("Your first answer: C alone; or C and M");
  await page.locator('[data-practice="0"]').click();
  await page.locator('input[value="c-l"]').check();
  await page.locator("#final-submit").click();
  await page.locator("#final-retry").click();
  await page
    .getByRole("button", { name: "Back to results", exact: true })
    .click();
  await expect(page.locator(".quiz-summary h2")).toHaveText(
    "Your results: 6/8",
  );
  assert.equal(
    await page.evaluate(() =>
      sessionStorage.getItem("causal-sandbox-entry-quiz-v2"),
    ),
    entryBefore,
  );
  await page.locator("#final-restart").click();
  await expect(page.locator("#final-quiz-content")).toContainText(
    "Practice · Question 1",
  );
  await expect(page.locator("#final-feedback")).toBeHidden();
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.screenshot({
    path: "/tmp/final-quiz-dark-mobile.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("#final-question")).toHaveText(
    finalQuestions[0].title,
  );
  await expect(page.locator("#final-feedback")).toBeHidden();
  await page.goto(`${url}?quiz`);
  await expect(page.locator("#quiz-question")).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    "Final quiz: eight items, immutable scoring, retries, review, entry isolation, recap/Contents, keyboard/touch, desktop/mobile, dark mode and reset passed.",
  );
} finally {
  await browser.close();
}
