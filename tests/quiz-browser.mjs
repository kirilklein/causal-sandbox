import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${url}?lesson=leaving-the-sandbox`);
  await page
    .getByRole("link", { name: "Test your causal intuition →", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Test your causal intuition", exact: true })
    .waitFor();
  await page.screenshot({ path: "/tmp/quiz-desktop.png", fullPage: true });
  // An empty set is a valid submission, but not correct for this graph.
  await page.locator("#quiz-submit").click();
  assert.match(
    await page.locator("#quiz-feedback").innerText(),
    /Leaving C out/,
  );
  assert.equal(await page.locator("[data-node=C]").isDisabled(), true);
  await page.locator("#quiz-retry").click();
  await page
    .getByRole("button", {
      name: "Adjust for Prior experience (C)",
      exact: true,
    })
    .focus();
  await page.keyboard.press("Space");
  assert.equal(await page.locator('input[value="C"]').isChecked(), true);
  await page.locator("#quiz-submit").click();
  assert.match(
    await page.locator("#quiz-feedback").innerText(),
    /Practice attempt/,
  );
  assert.equal(await page.locator(".quiz-path-explained").count(), 2);
  await page.locator("#quiz-next").click();
  for (const answer of ["all", "missing", "limit", "stable", "qualified"]) {
    assert.equal(await page.locator("#quiz-submit").isDisabled(), true);
    await page.locator(`input[value="${answer}"]`).check();
    await page.locator("#quiz-submit").click();
    assert.match(
      await page.locator("#quiz-feedback").innerText(),
      /That’s right/,
    );
    await page.locator("#quiz-next").click();
  }
  assert.match(await page.locator("#quiz-content h2").innerText(), /5\/6/);
  assert.equal(await page.locator(".quiz-review li").count(), 6);
  assert.match(
    await page.locator(".quiz-review li").first().innerText(),
    /Your first answer: No adjustment/,
  );
  await page.locator("#quiz-restart").click();
  assert.equal(await page.locator('input[name="answer"]:checked').count(), 0);
  // Narrow-screen touch controls, all-correct score, and feedback layouts.
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.locator("[data-node=C]").tap();
  assert.equal(await page.locator('input[value="C"]').isChecked(), true);
  await page.locator('input[value="M"]').check();
  assert.equal(
    await page.locator("[data-node=M]").getAttribute("aria-pressed"),
    "true",
  );
  await page.locator("[data-node=M]").tap();
  await page.screenshot({ path: "/tmp/quiz-mobile.png", fullPage: true });
  for (const answer of [
    null,
    "all",
    "missing",
    "limit",
    "stable",
    "qualified",
  ]) {
    if (answer) await page.locator(`input[value="${answer}"]`).check();
    await page.locator("#quiz-submit").click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    assert.equal(
      await page
        .locator("#quiz-feedback")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    if (!answer)
      await page.screenshot({
        path: "/tmp/quiz-mobile-feedback.png",
        fullPage: true,
      });
    await page.locator("#quiz-next").click();
  }
  assert.match(await page.locator("#quiz-content h2").innerText(), /6\/6/);
  await page.reload();
  assert.match(
    await page.locator("#quiz-content").innerText(),
    /Question 1 of 6/,
  );
  await page.locator("#lesson-menu-toggle").click();
  assert.equal(
    await page
      .getByRole("link", { name: "Test your causal intuition", exact: true })
      .getAttribute("aria-current"),
    "step",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator("#lesson-menu-toggle").getAttribute("aria-expanded"),
    "false",
  );
  // The new prediction changes the actual mediator experiment and resets on restart.
  for (let choice = 0; choice < 3; choice++) {
    await page.setViewportSize({
      width: choice === 1 ? 1280 : 320,
      height: 900,
    });
    await page.goto(`${url}?lesson=mediator`);
    assert.equal(await page.locator(".lesson-controls").isVisible(), false);
    if (choice < 2)
      await page.screenshot({
        path: `/tmp/mediator-prediction-${choice === 1 ? "desktop" : "mobile"}.png`,
        fullPage: true,
      });
    await page.locator(`input[name="prediction"][value="${choice}"]`).check();
    await page.locator("#try-prediction").click();
    assert.equal(await page.locator("#post-adjustment").isChecked(), true);
    assert.match(
      await page.locator(".lesson-prediction").innerText(),
      /true total effect stayed 3.00/,
    );
    assert.equal(await page.locator(".lesson-controls").isVisible(), true);
    await page.locator("#restart").click();
    assert.equal(await page.locator("#try-prediction").isDisabled(), true);
  }
  assert.deepEqual(errors, []);
  console.log(
    "Quiz scoring, retries, graph controls, navigation, keyboard/touch, mobile and mediator prediction passed.",
  );
} finally {
  await browser.close();
}
