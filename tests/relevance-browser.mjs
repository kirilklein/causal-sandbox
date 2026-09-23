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
import { relevanceSummaries } from "../src/relevance-view.js";

const browser = await launchBrowser();
const url = getAppUrl();
const title = "Proxies for hidden confounders";
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  collectPageErrors(page, errors);
  await stubGoatCounter(page);
  await page.goto(`${url}?lesson=hidden-confounding`);
  await page.getByRole("link", { name: `${title} →`, exact: true }).click();
  await expect(page.locator("h1")).toHaveText(title);
  const include = page.locator("#include-measurement");
  await expect(page.locator("#study-status")).toBeEmpty();
  await expect(page.locator("#relevance-graph")).toBeVisible();
  await expect(page.locator("#scene-title")).toContainText(
    "proxy for hidden fitness",
  );
  await expect(page.locator(".study-dot")).toHaveCount(60);
  await expect(page.locator(".truth-label")).toHaveText("True effect: 2");
  await expect(page.locator(".effect-legend li")).toHaveText([
    "One study",
    "Mean",
  ]);
  await expect(page.locator("#relevance-explanation")).toBeHidden();
  await expect(page.locator("#mechanism-title")).toHaveText(
    "How a proxy can help",
  );
  await expect(page.locator(".proxy-mechanism")).toContainText(
    "U also influences V",
  );
  assert.ok(
    await page.evaluate(
      () =>
        document
          .querySelector(".proxy-mechanism")
          .compareDocumentPosition(document.querySelector("#relevance-scene")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ),
  );
  await expect(page.locator('.relevance-steps [data-step="1"]')).toHaveCount(0);
  await expect(include).toBeDisabled();
  await expect(page.locator("#toggle-prediction")).toHaveCount(0);
  const question = await page.locator("#prediction-question").innerText();
  await expect(
    page.getByRole("group", { name: question, exact: true }),
  ).toHaveCount(1);
  const answerAtAnchor = async (
    target,
    button,
    feedback,
    activate = () => button.click(),
  ) => {
    await button.scrollIntoViewIfNeeded();
    await button.evaluate((el) =>
      el.addEventListener(
        "click",
        () => {
          window.relevanceFeedbackTop = document
            .querySelector("#prediction-hint")
            .getBoundingClientRect().top;
        },
        { capture: true, once: true },
      ),
    );
    await activate();
    await expect(feedback).toBeFocused();
    const anchor = await target.evaluate(() => window.relevanceFeedbackTop);
    const top = await feedback
      .locator("p")
      .first()
      .evaluate((el) => el.getBoundingClientRect().top);
    assert.ok(
      Math.abs(top - anchor) <= 1,
      `Feedback stays at the reading position: ${anchor} → ${top}`,
    );
    await expect(target.locator("#question-choices")).toHaveCount(0);
  };
  const checkCollapse = async (target, feedback) => {
    const toggle = target.locator("#toggle-prediction");
    const graph = await target
      .locator("#relevance-graph")
      .evaluateAll((els) => els.map((el) => el.innerHTML));
    const plot = await target
      .locator("#effect-plot")
      .evaluateAll((els) => els.map((el) => el.innerHTML));
    const message = await feedback.innerText();
    await toggle.focus();
    await target.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(target.locator("#prediction-content")).toBeHidden();
    await expect(toggle).toBeFocused();
    assert.deepEqual(
      await target
        .locator("#relevance-graph")
        .evaluateAll((els) => els.map((el) => el.innerHTML)),
      graph,
    );
    assert.deepEqual(
      await target
        .locator("#effect-plot")
        .evaluateAll((els) => els.map((el) => el.innerHTML)),
      plot,
    );
    await target.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(feedback).toHaveText(message, { useInnerText: true });
  };
  const beforeGraph = await page.locator("#relevance-graph").innerHTML();
  const beforeDots = await page
    .locator('.study-dot[data-arm="0"]')
    .evaluateAll((els) => els.map((e) => e.outerHTML));
  const originalProgress = await page.evaluate(() =>
    localStorage.getItem("causal-sandbox-progress"),
  );
  await page
    .getByRole("radio", { name: "About the same", exact: true })
    .check();
  await include.focus();
  await answerAtAnchor(page, include, page.locator("#guess-feedback"), () =>
    page.keyboard.press("Enter"),
  );
  await expect(page.locator("#guess-feedback")).toHaveAttribute(
    "data-result",
    "review",
  );
  await expect(page.locator("#guess-feedback")).toContainText("About the same");
  await checkCollapse(page, page.locator("#guess-feedback"));
  await expect(include).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".study-dot")).toHaveCount(120);
  assert.equal(await page.locator("#relevance-graph").innerHTML(), beforeGraph);
  assert.deepEqual(
    await page
      .locator('.study-dot[data-arm="0"]')
      .evaluateAll((els) => els.map((e) => e.outerHTML)),
    beforeDots,
  );
  await expect(page.locator("#guess-feedback")).toContainText(
    "closer to truth",
  );
  await expect(page.locator("#relevance-explanation")).toContainText(
    "confounding remains",
  );
  const checkStudies = async (world) => {
    const studies = Array.from({ length: 60 }, (_, i) =>
      relevanceSample({ world, seed: 100 + i }),
    );
    const stats = relevanceSummaries(studies);
    const dots = await page.locator(".study-dot").evaluateAll((els) =>
      els.map((e) => ({
        study: Number(e.dataset.study),
        arm: Number(e.dataset.arm),
        value: Number(e.dataset.estimate),
        x: Number(e.getAttribute("cx")),
      })),
    );
    assert.equal(dots.length, 120);
    for (const dot of dots) {
      assert.ok(
        Math.abs(dot.value - studies[dot.study].fits[dot.arm].effect) < 1e-9,
      );
      assert.ok(Math.abs(dot.x - (24 + (dot.value / 5) * 312)) < 1e-9);
    }
    const means = await page
      .locator("#effect-plot .effect-mean title")
      .allTextContents();
    assert.deepEqual(
      means,
      stats.map((s) => `Mean: ${s.effect.mean.toFixed(2)}`),
    );
    await expect(page.locator(".effect-truth").first()).toHaveAttribute(
      "x1",
      "148.8",
    );
    return stats;
  };
  const proxyStats = await checkStudies("proxy");
  await page
    .getByText("Prediction is a separate question", { exact: true })
    .click();
  assert.deepEqual(
    await page.locator(".prediction-bars strong").allTextContents(),
    proxyStats.map((s) => s.prediction.mean.toFixed(2)),
  );
  await page.getByLabel("Color theme").selectOption("dark");
  assert.equal(await page.locator("#relevance-graph").innerHTML(), beforeGraph);
  await checkStudies("proxy");
  const firstFeedback = await page.locator("#guess-feedback").textContent();
  await page.locator("#toggle-prediction").click();
  await include.click();
  await expect(page.locator("#guess-feedback")).toHaveText(firstFeedback);
  await expect(page.locator(".study-dot")).toHaveCount(60);
  await expect(page.locator("#relevance-explanation")).toBeEmpty();
  await include.click();

  await page.locator("#next-relevance").click();
  await expect(page.locator("#scene-title")).toHaveText(
    "Closer to truth, but not all the way",
  );
  await page
    .getByText("Optional: why not adjust for every predictor?", { exact: true })
    .click();
  await page.locator('[data-step="1"]').click();
  await expect(page.locator("#study-status")).toBeEmpty();
  await expect(include).toBeDisabled();
  await expect(page.locator("#scene-title")).toContainText("misleading clue");
  await expect(page.locator("#relevance-graph svg")).toHaveAttribute(
    "aria-label",
    /collider/,
  );
  await expect(page.locator(".study-dot")).toHaveCount(60);
  await page
    .getByRole("radio", { name: "Farther from truth", exact: true })
    .check();
  await answerAtAnchor(page, include, page.locator("#guess-feedback"));
  const colliderStats = await checkStudies("collider");
  await expect(page.locator("#guess-feedback")).toHaveAttribute(
    "data-result",
    "correct",
  );
  await expect(page.locator("#guess-feedback")).toContainText(
    "Farther from truth",
  );
  assert.deepEqual(
    await page.locator(".prediction-bars strong").allTextContents(),
    colliderStats.map((s) => s.prediction.mean.toFixed(2)),
  );
  await expect(page.locator("#relevance-explanation")).toContainText(
    "same score",
  );
  await page.locator('[data-step="0"]').click();
  await expect(include).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[name="guess"]')).toHaveCount(0);
  await expect(page.locator("#toggle-prediction")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.locator("#toggle-prediction").click();
  await expect(page.locator("#guess-feedback")).toContainText("About the same");
  await checkStudies("proxy");
  await page.locator('[data-step="2"]').click();
  await expect(page.locator("#relevance-graph")).toHaveCount(0);
  for (const [answer, text] of [
    ["removed", "Some confounding remains"],
    ["reduced", "reduces confounding"],
    ["caused", "without causing the outcome"],
  ]) {
    await page.locator("#restart-relevance").click();
    await page.locator('[data-step="2"]').click();
    await expect(page.locator("#submit-practice")).toBeDisabled();
    await page.locator(`[name="practice"][value="${answer}"]`).check();
    await answerAtAnchor(
      page,
      page.locator("#submit-practice"),
      page.locator("#practice-feedback"),
    );
    await expect(page.locator("#practice-feedback")).toContainText(text);
    await expect(page.locator("#practice-feedback")).toHaveAttribute(
      "data-result",
      answer === "reduced" ? "correct" : "review",
    );
    await expect(page.locator("#submit-practice")).toHaveCount(0);
    await checkCollapse(page, page.locator("#practice-feedback"));
  }
  assert.equal(
    await page.evaluate(() => localStorage.getItem("causal-sandbox-progress")),
    originalProgress,
  );
  await page.locator("#restart-relevance").click();
  await expect(include).toHaveAttribute("aria-pressed", "false");
  await expect(include).toBeDisabled();
  await expect(page.locator('[name="guess"]:checked')).toHaveCount(0);
  await expect(page.locator(".study-dot")).toHaveCount(60);
  await page.locator('[data-step="2"]').click();
  await expect(page.locator("#practice-feedback")).toHaveCount(0);
  await expect(page.locator("#toggle-prediction")).toHaveCount(0);
  await expect(page.locator("#submit-practice")).toBeDisabled();

  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(page.locator('.optional-menu [aria-current="step"]')).toHaveText(
    title,
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox").fill("causal relevance");
  await page.locator("#search-results a").first().click();
  await expect(page.locator("h1")).toHaveText(title);
  await page.getByRole("link", { name: "All topics", exact: true }).click();
  await page
    .locator(".learning-topic-group > summary")
    .filter({ hasText: "What should I adjust for?" })
    .click();
  await page
    .locator(".learning-topic-columns a")
    .filter({ hasText: title })
    .click();
  await expect(page.locator("h1")).toHaveText(title);
  await page.goto(`${url}?lesson=timing`);
  await page.getByRole("link", { name: `${title} →`, exact: true }).click();
  await expect(page.locator("#study-status")).toBeEmpty();

  await mkdir("test-results", { recursive: true });
  await page
    .getByText("Optional: why not adjust for every predictor?", { exact: true })
    .click();
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const scene of [0, 1, 2]) {
      await page.locator(`[data-step="${scene}"]`).click();
      if (scene < 2) {
        await expect(page.locator("#study-status")).toBeEmpty();
        if (await page.locator('[name="guess"]').count())
          await page.locator('[name="guess"][value="closer"]').check();
        if ((await include.getAttribute("aria-pressed")) === "false")
          await include.click();
      }
      for (const mode of ["light", "dark"]) {
        await page.getByLabel("Color theme").selectOption(mode);
        if (scene < 2) {
          await include.click();
          await expect(page.locator(".effect-truth")).toHaveCount(1);
          await expect(page.locator(".row-label")).toHaveCount(1);
          await page.locator(".relevance-analysis").screenshot({
            path: `test-results/relevance-before-${width}-${scene}-${mode}.png`,
          });
          await include.click();
          await expect(page.locator(".effect-truth")).toHaveCount(2);
        }
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${width} ${scene} ${mode} overflow`,
        );
        const logo = await page.locator(".brand svg").boundingBox();
        assert.ok(logo.width < 100 && logo.height < 100, "header icon size");
        if (scene === 0)
          await page.locator(".proxy-mechanism").screenshot({
            path: `test-results/proxy-mechanism-${width}-${mode}.png`,
          });
        await page.locator("#relevance-scene").screenshot({
          path: `test-results/relevance-story-${width}-${scene}-${mode}.png`,
        });
      }
    }
  }
  const touch = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  collectPageErrors(touch, errors);
  await stubGoatCounter(touch);
  await touch.goto(`${url}?lesson=causal-relevance`);
  // Changing steps while computations yield must not put results into the wrong scene.
  await touch.evaluate(() => {
    document.querySelector('[data-step="1"]').click();
    document.querySelector('[data-step="2"]').click();
  });
  await expect(touch.locator("#scene-title")).toContainText("Closer to truth");
  await touch.waitForTimeout(150);
  await expect(touch.locator(".study-dot")).toHaveCount(0);
  await touch.locator('[data-step="0"]').tap();
  await expect(touch.locator("#study-status")).toBeEmpty();
  await touch.locator('[name="guess"][value="closer"]').check();
  await answerAtAnchor(
    touch,
    touch.locator("#include-measurement"),
    touch.locator("#guess-feedback"),
    () => touch.locator("#include-measurement").tap(),
  );
  await expect(touch.locator(".study-dot")).toHaveCount(120);
  await touch.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await touch
      .locator("#guess-feedback")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  await checkCollapse(touch, touch.locator("#guess-feedback"));
  await touch.locator('[data-step="2"]').tap();
  await touch.locator('[name="practice"][value="reduced"]').check();
  await answerAtAnchor(
    touch,
    touch.locator("#submit-practice"),
    touch.locator("#practice-feedback"),
    () => touch.locator("#submit-practice").tap(),
  );
  await checkCollapse(touch, touch.locator("#practice-feedback"));
  await touch
    .locator(".lesson-prediction")
    .screenshot({ path: "test-results/relevance-feedback-mobile.png" });
  assert.deepEqual(errors, []);
  console.log(
    "Relevance story: paired estimates, fixed graph/truth, prediction feedback, transfer, replay/reset, navigation, keyboard/touch, themes and phone layouts passed.",
  );
} finally {
  await browser.close();
}
