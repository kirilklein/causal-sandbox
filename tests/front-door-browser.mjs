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
import { effectComparison } from "../src/effect-comparison.js";

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
  await expect(page.locator(".fd-details[open]")).toHaveCount(0);
  await expect(page.locator('[data-effect="observed"]')).toHaveText("+38 pp");
  await expect(page.locator('[data-effect="front-door"]')).toHaveText("+20 pp");
  await expect(page.locator('[data-effect="truth"]')).toHaveText("+20 pp");
  await expect(
    page.locator('.fd-graph-desktop [data-link="practice"]'),
  ).toHaveText("+50 pp");
  await expect(
    page.locator('.fd-graph-desktop [data-link="passing"]'),
  ).toHaveText("+40 pp");
  await expect(page.locator("#fd-explanation")).toContainText(
    "20 extra passes per 100",
  );
  await expect(page.locator("#fd-population, .fd-steps")).toHaveCount(0);
  await page.locator("#fd-evidence > summary").click();
  await expect(page.locator('[data-within="0"]')).toHaveText("+40 pp");
  await expect(page.locator('[data-within="1"]')).toHaveText("+40 pp");
  await expect(page.locator("#fd-evidence-content")).toContainText("16%");
  await page.locator("#fd-selection").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#fd-selection-value")).toHaveText("0.7");
  await expect(page.locator('[data-effect="observed"]')).toHaveText("+41 pp");
  await expect(page.locator('[data-effect="front-door"]')).toHaveText("+20 pp");
  await expect(page.locator("#fd-evidence")).toHaveAttribute("open", "");
  await expect(page.locator("#fd-evidence-content")).toContainText("14.5%");
  await page.locator("#fd-evidence > summary").click();
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
    for (const [id, value] of [
      ["observed", result.rawEffect],
      ["front-door", result.effect],
    ]) {
      const tint = await page
        .locator(`[data-effect="${id}"]`)
        .evaluate((node) =>
          parseFloat(node.parentElement.style.getPropertyValue("--error-tint")),
        );
      assert.equal(tint, effectComparison(value, population.effect).tint);
    }
    await expect(page.locator('#fd-graph [data-edge="direct"]')).toHaveCount(
      world === "direct" ? 2 : 0,
    );
    await expect(page.locator('#fd-graph [data-edge="mediator"]')).toHaveCount(
      world === "mediator" ? 2 : 0,
    );
    await page.locator("#fd-arithmetic > summary").click();
    if (world === "support")
      await expect(page.locator("#fd-arithmetic-content")).toContainText(
        "cannot be reconstructed",
      );
    else
      await expect(
        page.locator("#fd-arithmetic-content [role=math]"),
      ).toHaveCount(1);
    await page.locator("#fd-arithmetic > summary").click();
    if (world === "mediator")
      await expect(page.locator(".fd-graph-desktop")).toContainText(
        "still confounded",
      );
  }
  await page.locator("#fd-selection").focus();
  await page.keyboard.press("Home");
  await expect(page.locator("#fd-selection-value")).toHaveText("0.0");
  await expect(page.locator('[data-effect="observed"]')).toHaveText("+20 pp");
  await expect(page.locator("#fd-explanation")).toContainText(
    "Readiness → tutoring is off",
  );
  await page.getByText("Check your understanding", { exact: true }).click();
  await page.getByRole("button", { name: "Yes, practice is measured" }).click();
  await expect(page.locator("#fd-answer")).toContainText("not enough");
  await page
    .getByRole("button", { name: "No, the hints bypass practice" })
    .click();
  await expect(page.locator("#fd-answer")).toContainText("Right.");
  await page.getByText("Check your understanding", { exact: true }).click();
  await mkdir("test-results/front-door", { recursive: true });
  for (const width of [1440, 700, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const theme of ["light", "dark"]) {
      await page
        .getByRole("combobox", { name: "Color theme" })
        .selectOption(theme);
      for (const world of ["valid", "direct", "mediator", "support"]) {
        await page.locator("#fd-world").selectOption(world);
        const currentSelection = Number(
          await page.locator("#fd-selection").inputValue(),
        );
        const currentResult = reconstructFrontDoor(
          frontDoorPopulation({ world, selection: currentSelection }).cells,
        );
        await expect(page.locator('[data-effect="front-door"]')).toHaveText(
          currentResult.effect === null
            ? "Unavailable"
            : `+${points(currentResult.effect)}`,
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `No page overflow ${width}/${theme}/${world}`,
        );
        assert.ok(
          await page.locator("#fd-graph svg:visible").evaluate((svg) => {
            const bounds = svg.getBoundingClientRect();
            return [...svg.querySelectorAll("text")].every((text) => {
              const box = text.getBoundingClientRect();
              return (
                box.left >= bounds.left - 1 &&
                box.right <= bounds.right + 1 &&
                box.top >= bounds.top - 1 &&
                box.bottom <= bounds.bottom + 1
              );
            });
          }),
          `Graph labels fit ${width}/${theme}/${world}`,
        );
        if (width !== 700 && (world === "valid" || world === "direct"))
          await page.locator(".fd-experiment").screenshot({
            path: `test-results/front-door/chain-${width}-${theme}-${world}.png`,
          });
      }
      const slider = page.locator("#fd-selection");
      assert.ok(
        await slider.evaluate((node) => {
          const css = getComputedStyle(node);
          return (
            parseFloat(css.height) >= 6 &&
            css.backgroundColor !== "rgba(0, 0, 0, 0)"
          );
        }),
      );
      await slider.scrollIntoViewIfNeeded();
      const box = await slider.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await expect(slider).toHaveValue("0.4");
      await expect(page.locator("#fd-selection-value")).toHaveText("0.4");
      for (const [id, count] of [
        ["fd-formulas", 2],
        ["fd-model", 4],
      ]) {
        await page.locator(`#${id} > summary`).click();
        await expect(page.locator(`#${id} [role=math]`)).toHaveCount(count);
        assert.ok(
          await page.locator(`#${id}`).evaluate((node) => {
            const bounds = node.getBoundingClientRect();
            return (
              node.scrollWidth <= node.clientWidth &&
              [...node.querySelectorAll("math")].every((math) => {
                const box = math.getBoundingClientRect();
                return box.left >= bounds.left && box.right <= bounds.right;
              })
            );
          }),
        );
        await page.locator(`#${id} > summary`).click();
      }
    }
  }
  await page.locator("#fd-restart").click();
  await expect(page.locator("h1")).toBeFocused();
  await expect(page.locator("#fd-world")).toHaveValue("valid");
  await expect(page.locator("#fd-selection")).toHaveValue("0.6");
  await expect(page.locator("#fd-answer")).toBeEmpty();
  await expect(page.locator(".fd-details[open]")).toHaveCount(0);
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
  assert.deepEqual(errors, []);
  console.log(
    "Integrated front-door lesson: mechanism, selection, failures, disclosures, discovery, keyboard, reset, themes and responsive graph passed.",
  );
} finally {
  await browser.close();
}
