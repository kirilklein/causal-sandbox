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
const title = "Should we adjust for this measurement?";
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
  await expect(include).toBeEnabled();
  await expect(page.locator("#relevance-graph")).toBeVisible();
  await expect(page.locator("#scene-title")).toContainText("fitness test");
  await expect(page.locator(".study-dot")).toHaveCount(60);
  await expect(page.locator("#relevance-explanation")).toBeHidden();
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
  await page.keyboard.press("Enter");
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
      .locator("#effect-summary strong")
      .allTextContents();
    assert.deepEqual(
      means,
      stats.map((s) => s.effect.mean.toFixed(2)),
    );
    await expect(page.locator(".effect-truth").first()).toHaveAttribute(
      "x1",
      "148.8",
    );
    return stats;
  };
  const proxyStats = await checkStudies("proxy");
  await page
    .getByText("Does the fitness test also help prediction?", { exact: true })
    .click();
  assert.deepEqual(
    await page.locator(".prediction-bars strong").allTextContents(),
    proxyStats.map((s) => s.prediction.mean.toFixed(2)),
  );
  await page.getByLabel("Color theme").selectOption("dark");
  assert.equal(await page.locator("#relevance-graph").innerHTML(), beforeGraph);
  await checkStudies("proxy");
  await include.click();
  await expect(page.locator(".study-dot")).toHaveCount(60);
  await expect(page.locator("#relevance-explanation")).toBeEmpty();
  await include.click();

  await page.locator("#next-relevance").click();
  await expect(include).toBeEnabled();
  await expect(page.locator("#scene-title")).toContainText("research score");
  await expect(page.locator("#relevance-graph svg")).toHaveAttribute(
    "aria-label",
    /collider/,
  );
  await expect(page.locator(".study-dot")).toHaveCount(60);
  await page
    .getByRole("radio", { name: "Farther from truth", exact: true })
    .check();
  await include.click();
  const colliderStats = await checkStudies("collider");
  await expect(page.locator("#guess-feedback")).toContainText("matches");
  assert.deepEqual(
    await page.locator(".prediction-bars strong").allTextContents(),
    colliderStats.map((s) => s.prediction.mean.toFixed(2)),
  );
  await expect(page.locator("#relevance-explanation")).toContainText(
    "same score",
  );
  await page.locator('[data-step="0"]').click();
  await expect(include).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("radio", { name: "About the same", exact: true }),
  ).toBeChecked();
  await checkStudies("proxy");
  await page.locator('[data-step="2"]').click();
  await expect(page.locator("#relevance-graph")).toHaveCount(0);
  for (const [answer, text] of [
    ["include", "collider"],
    ["exclude", "proxy"],
    ["unknown", "adjustment safety is not"],
  ]) {
    await page.locator(`[data-answer="${answer}"]`).click();
    await expect(page.locator("#practice-feedback")).toContainText(text);
  }
  assert.equal(
    await page.evaluate(() => localStorage.getItem("causal-sandbox-progress")),
    originalProgress,
  );
  await page.locator("#restart-relevance").click();
  await expect(include).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('[name="guess"]:checked')).toHaveCount(0);
  await expect(page.locator(".study-dot")).toHaveCount(60);
  await page.locator('[data-step="2"]').click();
  await expect(page.locator("#practice-feedback")).toBeEmpty();

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
  await expect(include).toBeEnabled();

  await mkdir("test-results", { recursive: true });
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const scene of [0, 1, 2]) {
      await page.locator(`[data-step="${scene}"]`).click();
      if (scene < 2) {
        await expect(include).toBeEnabled();
        if ((await include.getAttribute("aria-pressed")) === "false")
          await include.click();
      }
      for (const mode of ["light", "dark"]) {
        await page.getByLabel("Color theme").selectOption(mode);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${width} ${scene} ${mode} overflow`,
        );
        const logo = await page.locator(".brand svg").boundingBox();
        assert.ok(logo.width < 100 && logo.height < 100, "header icon size");
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
  await expect(touch.locator("#scene-title")).toContainText("unknown role");
  await touch.waitForTimeout(150);
  await expect(touch.locator(".study-dot")).toHaveCount(0);
  await touch.locator('[data-step="0"]').tap();
  await expect(touch.locator("#include-measurement")).toBeEnabled();
  await touch.locator("#include-measurement").tap();
  await expect(touch.locator(".study-dot")).toHaveCount(120);
  assert.deepEqual(errors, []);
  console.log(
    "Relevance story: paired estimates, fixed graph/truth, prediction feedback, transfer, replay/reset, navigation, keyboard/touch, themes and phone layouts passed.",
  );
} finally {
  await browser.close();
}
