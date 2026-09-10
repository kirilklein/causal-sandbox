import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
const key = "causal-sandbox-entry-quiz-v2";
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
  });
  page.on("pageerror", (error) => errors.push(error.message));
  async function answer(id, choice) {
    await expect(page.locator(".quiz-card")).toHaveAttribute(
      "data-question",
      id,
    );
    await page.locator(`#quiz-form input[value="${choice}"]`).check();
    await page.locator("#quiz-submit").click();
  }
  async function fresh() {
    await page.goto(url);
    await page.evaluate((key) => sessionStorage.removeItem(key), key);
    await page.goto(`${url}?lesson=quiz`);
    await expect(page.locator(".quiz-card")).toHaveAttribute(
      "data-question",
      "E",
    );
  }
  await page.goto(url);
  // Earlier scenarios must not be interpreted as answers to the revised items.
  await page.evaluate(() =>
    sessionStorage.setItem(
      "causal-sandbox-entry-quiz-v1",
      JSON.stringify({
        answers: [
          { question: "E", choice: "unsure" },
          { question: "F", choice: "unsure" },
        ],
        index: 2,
        screen: "results",
      }),
    ),
  );
  assert.equal(await page.locator(".intro-path").count(), 3);
  await page.getByRole("link", { name: "Learn", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Where would you like to begin?");
  assert.equal(await page.locator(".learning-choice").count(), 3);
  await page.screenshot({
    path: "/tmp/adaptive-learning-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: /Find my starting point/ }).click();
  await expect(page.locator("#quiz-submit")).toBeDisabled();
  assert.equal(
    await page.locator(".quiz-source, .quiz-answer-review").count(),
    0,
  );
  await page.locator('input[value="unsure"]').focus();
  await page.keyboard.press("Space");
  await page.locator("#quiz-submit").click();
  await expect(page.locator("#quiz-question")).toBeFocused();
  await answer("F", "unsure");
  await expect(page.locator("h1")).toHaveText("Start with the foundations");
  await expect(page.locator(".quiz-score")).toHaveText("0/2 correct");
  await expect(page.locator(".quiz-score-counts")).toHaveText(
    "0 to review · 2 unsure",
  );
  assert.deepEqual(
    await page
      .locator(".quiz-suggestion")
      .evaluateAll((items) => items.map((item) => item.dataset.topic)),
    ["randomization"],
  );
  await page.locator(".quiz-suggestion h3 a").click();
  await expect(page.locator("h1")).toHaveText("A randomized experiment");
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Start with the foundations");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Start with the foundations");
  // Practice after feedback preserves the entry recommendation and answers.
  const original = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)).answers,
    key,
  );
  await page.getByRole("link", { name: "Why this suggestion?" }).click();
  await expect(page.locator("#quiz-review-E")).toBeFocused();
  await page.locator("#quiz-review-E .quiz-source summary").click();
  await expect(page.locator("#quiz-review-E .quiz-source")).toContainText(
    "Hernán & Robins",
  );
  await page
    .locator("#quiz-review-E")
    .getByText("Try this question again for practice", { exact: true })
    .click();
  await page.locator('#quiz-review-E input[value="confounded"]').check();
  await page
    .locator("#quiz-review-E")
    .getByRole("button", { name: "Check practice answer" })
    .click();
  await expect(page.locator("#quiz-review-E [role=status]")).toContainText(
    "That’s right",
  );
  await expect(page.locator(".quiz-score")).toHaveText("0/2 correct");
  assert.deepEqual(
    await page.evaluate(
      (key) => JSON.parse(sessionStorage.getItem(key)).answers,
      key,
    ),
    original,
  );

  await expect(page.locator("#quiz-restart")).toHaveText(
    "Start a new practice attempt",
  );
  await page.locator("#quiz-restart").click();
  await expect(page.locator(".learning-note")).toContainText(
    "Practice attempt",
  );

  // Main path; graph semantics remain available as prose, and sources stay deferred.
  await fresh();
  await answer("E", "confounded");
  await expect(page.locator(".quiz-facts")).toBeVisible();
  const assumptions = page.locator(".quiz-assumptions");
  await expect(assumptions).not.toHaveAttribute("open", "");
  await assumptions.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(assumptions).toHaveAttribute("open", "");
  await expect(assumptions.locator("p")).toBeVisible();
  await expect(page.locator("#quiz-submit")).toBeDisabled();
  await page.keyboard.press("Enter");
  await expect(assumptions).not.toHaveAttribute("open", "");
  await page.screenshot({
    path: "/tmp/adaptive-quiz-graph-desktop.png",
    fullPage: true,
  });
  await answer("G", "c-only");
  await answer("C", "all");
  await answer("H", "agreement-only");
  await answer("O", "unsupported-extrapolation");
  await expect(page.locator(".quiz-progress")).toHaveText("6/6");
  await answer("D", "consistent");
  await expect(page.locator(".quiz-score")).toHaveText("6/6 correct");
  await expect(page.locator("h1")).toHaveText(
    "Looks like we have an expert here.",
  );
  assert.equal(await page.locator(".quiz-suggestion").count(), 0);
  await expect(page.locator(".quiz-answer-review:visible")).toHaveCount(0);
  await page.locator("#quiz-toggle-G").click();
  await page
    .locator("#quiz-review-G")
    .getByText("Try this question again for practice", { exact: true })
    .click();
  await expect(page.locator("#quiz-review-G svg")).toBeVisible();
  await expect(page.locator("#quiz-review-G .quiz-facts")).toBeVisible();
  await expect(
    page.locator("#quiz-review-G .quiz-assumptions"),
  ).not.toHaveAttribute("open", "");
  assert.equal(await page.locator("#quiz-arrow-G").count(), 1);
  await page.getByRole("link", { name: /explore deeper topics/ }).click();
  await expect(page.locator("h1")).toHaveText("Refresh & go deeper");
  assert.equal(await page.locator(".learning-topic-group").count(), 3);
  assert.equal(await page.locator(".learning-topic-group[open]").count(), 0);
  await page.locator(".learning-topic-group > summary").first().click();
  await expect(page.locator(".learning-topic-group[open]")).toContainText(
    "Advanced lessons",
  );
  await page.screenshot({
    path: "/tmp/adaptive-topics-desktop.png",
    fullPage: true,
  });

  // Editing an earlier answer recomputes the path and discards later answers.
  await fresh();
  await answer("E", "confounded");
  await answer("G", "c-only");
  await page.goBack();
  await expect(page.locator(".quiz-card")).toHaveAttribute(
    "data-question",
    "G",
  );
  await expect(page.locator('input[value="c-only"]')).toBeChecked();
  await answer("G", "both");
  await expect(page.locator(".quiz-card")).toHaveAttribute(
    "data-question",
    "M",
  );
  await page.locator("#quiz-back").click();
  await page.locator("#quiz-back").click();
  await answer("E", "unsure");
  await expect(page.locator(".quiz-card")).toHaveAttribute(
    "data-question",
    "F",
  );
  assert.deepEqual(
    await page.evaluate(
      (key) => JSON.parse(sessionStorage.getItem(key)).answers,
      key,
    ),
    [{ question: "E", choice: "unsure" }],
  );

  // Final answer at the cap adds the prerequisite review, without a seventh question.
  await fresh();
  for (const [id, choice] of [
    ["E", "confounded"],
    ["G", "c-only"],
    ["C", "all"],
    ["H", "agreement-only"],
    ["O", "remove-severity"],
    ["P", "low-p"],
  ])
    await answer(id, choice);
  assert.deepEqual(
    await page
      .locator(".quiz-suggestion")
      .evaluateAll((items) => items.map((item) => item.dataset.topic)),
    ["ipw", "overlap"],
  );
  await page.screenshot({
    path: "/tmp/adaptive-results-desktop.png",
    fullPage: true,
  });

  // Touch, reduced motion, dark mode, long question and result text at 320px.
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.getByLabel("Color theme").selectOption("dark");
  await page.screenshot({
    path: "/tmp/adaptive-results-mobile.png",
    fullPage: true,
  });
  await page.goto(`${url}?lesson=learn`);
  await page.screenshot({
    path: "/tmp/adaptive-learning-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await fresh();
  await answer("E", "confounded");
  await page.screenshot({
    path: "/tmp/adaptive-quiz-graph-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.locator('input[value="unsure"]').tap();
  await page.locator("#quiz-finish").tap();
  // Unsubmitted answers, including unsure, do not silently become evidence.
  assert.deepEqual(
    await page.evaluate(
      (key) => JSON.parse(sessionStorage.getItem(key)).answers,
      key,
    ),
    [{ question: "E", choice: "confounded" }],
  );
  await page.getByRole("button", { name: "Continue the quiz" }).tap();
  await expect(page.locator(".quiz-card")).toHaveAttribute(
    "data-question",
    "G",
  );
  await page.locator("#lesson-menu-toggle").tap();
  await page.keyboard.press("Escape");
  await expect(page.locator("#lesson-menu-toggle")).toBeFocused();
  await page.goto(`${url}?lesson=topics`);
  await page.locator(".learning-topic-group > summary").last().tap();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/adaptive-topics-mobile.png",
    fullPage: true,
  });

  // Saved inputs are validated before rendering; denied storage keeps the active quiz usable.
  for (const raw of [
    "not json",
    "null",
    JSON.stringify({
      answers: [{ question: "E", choice: '<img src=x onerror="alert(1)">' }],
    }),
  ]) {
    await page.evaluate(({ key, raw }) => sessionStorage.setItem(key, raw), {
      key,
      raw,
    });
    await page.goto(`${url}?quiz`);
    await expect(page.locator(".quiz-card")).toHaveAttribute(
      "data-question",
      "E",
    );
  }
  const blocked = await browser.newPage();
  blocked.on("pageerror", (error) => errors.push(error.message));
  await blocked.addInitScript(() =>
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    }),
  );
  await blocked.goto(`${url}?lesson=quiz`);
  for (let i = 0; i < 2; i++) {
    await blocked.locator('input[value="unsure"]').check();
    await blocked.locator("#quiz-submit").click();
  }
  await expect(blocked.locator("h1")).toHaveText("Start with the foundations");
  // Scores describe submitted answers, keeping uncertainty and practice separate.
  await fresh();
  await answer("E", "confounded");
  await answer("G", "both");
  await answer("M", "unsure");
  await expect(page.locator(".quiz-score")).toHaveText("1/3 correct");
  await expect(page.locator(".quiz-score-counts")).toHaveText(
    "1 to review · 1 unsure",
  );
  assert.deepEqual(
    await page
      .locator(".quiz-score-items button")
      .evaluateAll((links) => links.map((link) => link.dataset.status)),
    ["correct", "review", "unsure"],
  );
  await expect(page.locator(".quiz-score-symbol")).toHaveText(["✓", "×", "×"]);
  await expect(page.locator(".quiz-answer-review:visible")).toHaveCount(0);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({ path: "/tmp/quiz-score-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: "/tmp/quiz-score-desktop.png",
    fullPage: true,
  });
  await page.locator('.quiz-score-items [data-review="G"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#quiz-review-G")).toBeFocused();
  await expect(page.locator("#quiz-toggle-G")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.locator("#quiz-review-G h3")).toHaveText(
    "Question 2 · Which differences should we account for?",
  );
  await page.screenshot({
    path: "/tmp/quiz-review-desktop.png",
    fullPage: true,
  });
  await page.locator("#quiz-toggle-G").click();
  await expect(page.locator(".quiz-answer-review:visible")).toHaveCount(0);
  await expect(page.locator("#quiz-toggle-G")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.locator("#quiz-review-G")).toBeVisible();
  await page.locator("#quiz-toggle-M").click();
  await expect(page.locator(".quiz-answer-review:visible")).toHaveCount(1);
  await expect(page.locator("#quiz-review-G")).toBeHidden();
  await expect(page.locator("#quiz-toggle-G")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.locator("#quiz-review-M h3")).toContainText("Question 3 ·");
  await page.setViewportSize({ width: 320, height: 800 });
  await page.locator("#quiz-toggle-G").tap();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/quiz-review-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Close explanation for question 2" })
    .tap();
  await expect(page.locator(".quiz-answer-review:visible")).toHaveCount(0);
  await expect(page.locator("#quiz-toggle-G")).toBeFocused();
  await fresh();
  await page.locator("#quiz-finish").click();
  assert.equal(await page.locator(".quiz-summary").count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    "Adaptive quiz: entry, early stop, advanced path, editing/history, session restore, final-answer recommendations, attribution, practice, mobile/touch, and unavailable storage passed.",
  );
} finally {
  await browser.close();
}
