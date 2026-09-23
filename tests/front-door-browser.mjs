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
  frontDoorPopulation,
  reconstructFrontDoor,
} from "../src/front-door.js";
import { points } from "../src/front-door-view.js";

const browser = await launchBrowser();
const url = getAppUrl();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  collectPageErrors(page, errors);
  await stubGoatCounter(page);
  await page.goto(`${url}?lesson=hidden-confounding`);
  await page
    .getByRole("link", { name: "The front-door criterion →", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("The front-door criterion");
  await expect(page.locator("#fd-title")).toHaveText(
    "The groups already differ",
  );
  await expect(page.locator(".fd-details[open]")).toHaveCount(0);
  await page.getByRole("button", { name: "No", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#fd-prediction")).toContainText("Right.");
  await page.locator("#fd-next").click();
  await expect(page.locator("#fd-title")).toBeFocused();
  await expect(page.locator(".fd-practices")).toHaveCount(18);
  await page.locator("#fd-next").click();
  await expect(page.locator(".fd-standardized")).toContainText("25%");
  await expect(page.locator(".fd-standardized")).toContainText("65%");
  await page.locator("#fd-next").click();
  await expect(page.locator('[data-effect="front-door"]')).toHaveText("+20 pp");
  await expect(page.locator('[data-effect="truth"]')).toHaveText("+20 pp");
  await expect(page.locator(".fd-mixture-sum strong")).toHaveText([
    "= 33% pass",
    "= 53% pass",
  ]);
  await mkdir("test-results/front-door", { recursive: true });
  await page.screenshot({
    path: "test-results/front-door/desktop-combine.png",
    fullPage: true,
  });
  await page.locator("#fd-next").click();
  await page.locator("#fd-selection").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#fd-selection-value")).toHaveText("0.7");
  await expect(page.locator('[data-effect="observed"]')).toHaveText("+41 pp");
  await expect(page.locator('[data-effect="front-door"]')).toHaveText("+20 pp");
  for (const world of ["direct", "mediator", "support", "valid"]) {
    await page.locator("#fd-world").selectOption(world);
    const population = frontDoorPopulation({ world, selection: 0.7 });
    const result = reconstructFrontDoor(population.cells);
    await expect(page.locator('[data-effect="front-door"]')).toHaveText(
      result.effect === null ? "Unavailable" : `+${points(result.effect)}`,
    );
    await expect(page.locator('[data-effect="truth"]')).toHaveText(
      `+${points(population.effect)}`,
    );
    await expect(page.locator('#fd-graph [data-edge="direct"]')).toHaveCount(
      world === "direct" ? 1 : 0,
    );
    await expect(page.locator('#fd-graph [data-edge="mediator"]')).toHaveCount(
      world === "mediator" ? 1 : 0,
    );
  }
  await page.locator("#fd-selection").focus();
  await page.keyboard.press("Home");
  await expect(page.locator("#fd-selection-value")).toHaveText("0.0");
  await expect(page.locator('[data-effect="observed"]')).toHaveText("+20 pp");
  await expect(page.locator("#fd-limit-results")).toContainText(
    "U → A is set to zero",
  );
  await page.getByText("Check your understanding", { exact: true }).click();
  await page.getByRole("button", { name: "Yes, practice is measured" }).click();
  await expect(page.locator("#fd-answer")).toContainText("not enough");
  await page
    .getByRole("button", { name: "No, the hints bypass practice" })
    .click();
  await expect(page.locator("#fd-answer")).toContainText("Right.");
  await page.locator("#fd-world").selectOption("direct");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ["light", "dark"]) {
      await page
        .getByRole("combobox", { name: "Color theme" })
        .selectOption(theme);
      for (const step of [0, 1, 2, 3, 4]) {
        await page.locator(`[data-step="${step}"]`).click();
        await expect(page.locator(`#fd-title`)).toBeFocused();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          `No overflow at ${width}/${theme}/step ${step}`,
        );
        assert.ok(
          await page
            .locator(".fd-stage")
            .evaluate((node) => node.scrollWidth <= node.clientWidth),
          `Stage fits at ${width}/${theme}/step ${step}`,
        );
        if (
          (width === 1440 && step === 2) ||
          (width === 390 && step === 3) ||
          (width === 320 && step === 4)
        ) {
          await page.screenshot({
            path: `test-results/front-door/${width}-${theme}-step-${step}.png`,
            fullPage: true,
          });
        }
      }
      const slider = page.locator("#fd-selection");
      assert.ok(
        await slider.evaluate((node) => {
          const style = getComputedStyle(node);
          return (
            parseFloat(style.height) >= 6 &&
            style.backgroundColor !== "rgba(0, 0, 0, 0)"
          );
        }),
        `Slider has a visible track at ${width}/${theme}`,
      );
      await slider.scrollIntoViewIfNeeded();
      const track = await slider.boundingBox();
      await page.mouse.click(
        track.x + track.width / 2,
        track.y + track.height / 2,
      );
      await expect(slider).toHaveValue("0.4");
      await expect(page.locator("#fd-selection-value")).toHaveText("0.4");
      await page.locator("#fd-formulas > summary").click();
      await expect(page.locator("#fd-formulas [role=math]")).toHaveCount(2);
      assert.ok(
        await page.locator("#fd-formulas").evaluate((node) => {
          const bounds = node.getBoundingClientRect();
          return (
            node.scrollWidth <= node.clientWidth &&
            [...node.querySelectorAll("math")].every((math) => {
              const box = math.getBoundingClientRect();
              return box.left >= bounds.left && box.right <= bounds.right;
            })
          );
        }),
        `Typeset equations fit at ${width}/${theme}`,
      );
      await page.locator("#fd-formulas").screenshot({
        path: `test-results/front-door/${width}-${theme}-formulas.png`,
      });
      await page.locator("#fd-formulas > summary").click();
    }
  }
  await page.locator("#fd-restart").click();
  await expect(page.locator("#fd-title")).toHaveText(
    "The groups already differ",
  );
  await expect(page.locator("#fd-prediction")).toBeEmpty();
  await page.locator('[data-step="4"]').click();
  await expect(page.locator("#fd-world")).toHaveValue("valid");
  await expect(page.locator("#fd-selection")).toHaveValue("0.6");
  await expect(page.locator("#fd-answer")).toBeEmpty();
  await page.goto(`${url}?lesson=topics`);
  await page
    .locator(".learning-topic-group > summary")
    .filter({ hasText: "What can these methods establish?" })
    .click();
  await page
    .getByRole("link", { name: "The front-door criterion", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("The front-door criterion");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(page.locator('#lesson-menu a[aria-current="step"]')).toHaveText(
    "The front-door criterion",
  );
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Contents", exact: true }),
  ).toBeFocused();
  assert.deepEqual(errors, []);
  console.log(
    "Front-door lesson: calculations, discovery, flow, failures, reset, keyboard, themes and narrow layouts passed.",
  );
} finally {
  await browser.close();
}
