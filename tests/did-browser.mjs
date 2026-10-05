import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { expect } from "@playwright/test";
import {
  launchBrowser,
  getAppUrl,
  collectPageErrors,
  stubGoatCounter,
} from "./browser-setup.mjs";

const browser = await launchBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
  });
  const errors = [];
  collectPageErrors(page, errors);
  await stubGoatCounter(page);
  const url = getAppUrl();
  const stage = async (i) => page.locator(`[data-did-step="${i}"]`).click();
  const result = page.locator("#did-result");
  await page.goto(`${url}?lesson=hidden-confounding`);
  await page
    .getByRole("link", { name: "Difference-in-differences →", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Difference-in-differences");
  await expect(result).toContainText("65% − 40% = +25");
  await expect(page.locator(".did-line.did-b")).toHaveCount(0);
  await page.locator('[data-did-predict="yes"]').click();
  await expect(page.locator("#did-feedback")).toContainText("Not quite");
  await page.locator("#did-next").click();
  await expect(page.locator("#did-title")).toBeFocused();
  await expect(page.locator(".did-line.did-b")).toHaveCount(1);
  await expect(page.locator(".did-assumed")).toHaveCount(0);
  await page.locator("#did-next").click();
  await expect(result).toContainText("40% + 10 pp = 50%");
  await expect(page.locator(".did-assumed")).toHaveCount(1);
  await expect(page.locator(".did-truth-line")).toHaveCount(0);
  await page.locator("#did-next").click();
  await expect(page.locator(".did-estimate strong")).toHaveText("+15 pp");
  await page.locator("#did-gap").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#did-gap")).toHaveValue("21");
  await expect(page.locator("#did-gap")).toBeFocused();
  await expect(page.locator(".did-estimate strong")).toHaveText("+15 pp");
  await page
    .getByRole("radio", { name: "Shared improvement", exact: true })
    .check();
  await page.locator("#did-common").focus();
  await page.keyboard.press("End");
  await expect(page.locator("#did-common-value")).toHaveText("+20 pp");
  await expect(page.locator(".did-estimate strong")).toHaveText("+15 pp");
  const priorResult = await result.textContent();
  await page
    .getByRole("combobox", { name: "Color theme" })
    .selectOption("dark");
  assert.equal(await result.textContent(), priorResult);
  await page.locator("#did-next").click();
  await page.locator("#did-extra").focus();
  await page.keyboard.press("End");
  await expect(page.locator("#did-extra")).toBeFocused();
  await expect(page.locator(".did-estimate strong")).toHaveText("+25 pp");
  await expect(result).toContainText("+10-point unrelated change");
  await page
    .getByRole("checkbox", { name: "Reveal simulator’s untreated outcome" })
    .check();
  await expect(page.locator(".did-truth-result")).toContainText(
    "85% − 70% = +15 pp",
  );
  await expect(page.locator(".did-truth-line")).toHaveCount(1);
  await page.locator("#did-extra").focus();
  await page.keyboard.press("Home");
  await expect(page.locator(".did-estimate strong")).toHaveText("+5 pp");
  await expect(page.locator(".did-truth-result")).toContainText(
    "DiD error: −10 pp",
  );
  await page.locator("#did-back").click();
  await expect(page.locator("#did-common")).toHaveValue("20");
  await expect(page.locator(".did-estimate strong")).toHaveText("+15 pp");
  await stage(5);
  await expect(page.locator(".did-estimate strong")).toHaveText("+15 pp");
  const parallelLine = await page.locator(".did-line.did-a").getAttribute("d");
  await page.getByRole("radio", { name: "New shock after treatment" }).check();
  await expect(page.locator(".did-estimate strong")).toHaveText("+25 pp");
  const shockLine = await page.locator(".did-line.did-a").getAttribute("d");
  assert.equal(
    parallelLine.split("L").slice(0, 3).join("L"),
    shockLine.split("L").slice(0, 3).join("L"),
  );
  await expect(result).toContainText("pre-treatment histories are unchanged");
  await page.getByRole("radio", { name: "A was improving faster" }).check();
  await expect(result).toContainText("challenges the equal-change assumption");
  await page.locator('[data-did-practice="no"]').click();
  await expect(page.locator("#did-feedback")).toContainText("Correct");

  await mkdir("test-results", { recursive: true });
  for (const theme of ["light", "dark"]) {
    await page
      .getByRole("combobox", { name: "Color theme" })
      .selectOption(theme);
    for (const width of [1280, 390, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      for (let i = 0; i < 6; i++) {
        await stage(i);
        await expect(page.locator("#did-title")).toBeVisible();
        await expect(page.locator(".did-chart")).toBeVisible();
        await expect(
          page.locator(".did-axis").filter({ hasText: /^Baseline$/ }),
        ).toBeVisible();
        await expect(
          page.locator(".did-axis").filter({ hasText: /^Follow-up$/ }),
        ).toBeVisible();
        if (i >= 4) {
          const colors = await page
            .locator(".did-chart")
            .evaluate((svg) =>
              [".did-truth-line", ".did-line.did-a", ".did-line.did-b"].map(
                (selector) =>
                  getComputedStyle(svg.querySelector(selector)).stroke,
              ),
            );
          assert.equal(
            new Set(colors).size,
            3,
            `${theme}: truth must differ from both hospital colors`,
          );
          await expect(
            page.locator(".did-truth-label").filter({ hasText: /^A without$/ }),
          ).toBeVisible();
        }
        for (const slider of await page.locator(".did-slider input").all()) {
          const style = await slider.evaluate((input) => {
            const css = getComputedStyle(input);
            return {
              track: css.backgroundImage,
              height: input.getBoundingClientRect().height,
            };
          });
          assert.notEqual(
            style.track,
            "none",
            `${theme}/${width}/${i}: missing slider track`,
          );
          assert.ok(
            style.height >= 24,
            `${theme}/${width}/${i}: slider hit area`,
          );
        }
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${theme}/${width}/${i}: page overflow`,
        );
        // SVG text must fit within the chart and not collide with other labels.
        const collisions = await page.locator(".did-chart").evaluate((svg) => {
          const texts = [...svg.querySelectorAll("text")].map((node) => ({
            text: node.textContent,
            box: node.getBBox(),
          }));
          const issues = [];
          const w = svg.viewBox.baseVal.width;
          for (let i = 0; i < texts.length; i++) {
            const a = texts[i];
            if (a.box.x < -1 || a.box.x + a.box.width > w + 1)
              issues.push(`${a.text} outside chart`);
            for (const b of texts.slice(i + 1)) {
              if (
                a.box.x < b.box.x + b.box.width &&
                a.box.x + a.box.width > b.box.x &&
                a.box.y < b.box.y + b.box.height &&
                a.box.y + a.box.height > b.box.y
              )
                issues.push(`${a.text} overlaps ${b.text}`);
            }
          }
          return issues;
        });
        assert.deepEqual(
          collisions,
          [],
          `${theme}/${width}/${i}: chart labels`,
        );
        if (width !== 360)
          await page.screenshot({
            path: `test-results/did-${theme}-${width}-${i}.png`,
            fullPage: true,
          });
      }
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await stage(2);
  await expect(page.locator(".did-transfer")).toBeHidden();
  await expect(result).toContainText("50%");
  await page.locator("#did-reset").click();
  await expect(page.locator("#did-title")).toBeFocused();
  await expect(page.locator("#did-feedback")).toBeEmpty();
  await page.locator('[data-did-predict="no"]').click();
  await expect(page.locator("#did-feedback")).toContainText("Correct");
  await stage(3);
  await expect(page.locator("#did-gap")).toHaveValue("20");
  await stage(4);
  await expect(page.locator("#did-extra")).toHaveValue("0");
  await expect(page.locator("#did-truth")).not.toBeChecked();
  await stage(5);
  await expect(
    page.getByRole("radio", { name: "Parallel untreated changes" }),
  ).toBeChecked();
  await expect(page.locator("#did-feedback")).toBeEmpty();
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(
    page
      .locator("#lesson-menu")
      .getByRole("link", { name: "Difference-in-differences", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Find a lesson or concept" })
    .fill("parallel trends");
  await page.locator("#search-results a").first().click();
  await expect(page.locator("h1")).toHaveText("Difference-in-differences");
  await page.getByRole("link", { name: "All topics", exact: true }).click();
  await page
    .locator("summary")
    .filter({ hasText: "What can these methods establish?" })
    .click();
  await page
    .getByRole("link", { name: "Difference-in-differences", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Difference-in-differences");
  await page
    .getByRole("link", { name: "Resume core lessons →", exact: true })
    .click();
  await expect(page).toHaveURL(/lesson=misspecification/);
  assert.deepEqual(errors, []);
  console.log(
    "DiD: arithmetic, assumption controls, histories, reset, discovery, keyboard, themes, motion, and layouts passed.",
  );
} finally {
  await browser.close();
}
