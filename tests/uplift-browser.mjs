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
    viewport: { width: 1280, height: 1100 },
  });
  const errors = [];
  collectPageErrors(page, errors);
  await stubGoatCounter(page);
  const url = getAppUrl();
  await page.goto(`${url}?lesson=randomization`);
  await page
    .getByRole("link", {
      name: "Uplift modelling: from effects to decisions →",
      exact: true,
    })
    .click();
  await expect(page.locator("h1")).toHaveText("Uplift modelling");
  await expect(page.locator(".intro")).toContainText(
    "how an intervention changes an outcome",
  );
  await expect(page.locator("#uplift-intro")).toContainText(
    "create as many extra purchases as possible",
  );
  await expect(page.locator("#uplift-result")).toContainText("35 → 65");
  await expect(page.locator(".uplift-group")).toHaveCount(4);
  await expect(page.locator(".uplift-details[open]")).toHaveCount(0);
  await page.locator("#uplift-next").click();
  await expect(page.locator("#uplift-title")).toBeFocused();
  await expect(page.locator("#uplift-targeting")).toBeHidden();
  await page.locator('[data-predict="conversion"]').click();
  await expect(page.locator("#uplift-feedback")).toContainText("Not quite");
  await expect(
    page.getByRole("radio", { name: "Highest purchase chance", exact: true }),
  ).toBeChecked();
  await expect(page.locator("#uplift-rule-note")).toContainText(
    "ignores whether contact helps",
  );
  await expect(page.locator("#uplift-result")).toContainText(
    "prevents 5 purchases",
  );
  await page
    .getByRole("radio", { name: "Highest uplift", exact: true })
    .check();
  await expect(page.locator("#uplift-result")).toContainText(
    "adds 30 purchases",
  );
  await expect(
    page.locator('.uplift-group[data-contacted="true"]'),
  ).toContainText("Browsing");
  await page
    .getByRole("radio", { name: "Random contacts", exact: true })
    .check();
  await expect(
    page.locator('.uplift-group[data-contacted="true"]'),
  ).toHaveCount(4);
  await expect(page.locator("#uplift-result")).toContainText(
    "adds 8 purchases",
  );
  await page.locator("#uplift-budget").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#uplift-budget-value")).toHaveText("200");
  await expect(page.locator("#uplift-budget")).toBeFocused();
  await page.locator("#uplift-world").selectOption("null");
  await expect(page.locator("#uplift-result")).toContainText(
    "adds 0 purchases",
  );
  await page.locator("#uplift-world").selectOption("aligned");
  await page
    .getByRole("radio", { name: "Highest uplift", exact: true })
    .check();
  const upliftResult = await page.locator("#uplift-result").textContent();
  await page
    .getByRole("radio", { name: "Highest purchase chance", exact: true })
    .check();
  assert.equal(
    await page.locator("#uplift-result").textContent(),
    upliftResult,
  );
  await page.locator("#uplift-next").click();
  await expect(page.locator("#uplift-evidence")).toBeHidden();
  await page.locator("#uplift-fit").click();
  await expect(page.locator("#uplift-evidence")).toContainText(
    "Fitted purchase chances",
  );
  const firstFit = await page.locator("#uplift-evidence").textContent();
  await page.locator("#uplift-fit").click();
  assert.notEqual(
    await page.locator("#uplift-evidence").textContent(),
    firstFit,
  );
  const frozenFit = await page.locator("#uplift-evidence").textContent();
  await page
    .getByRole("combobox", { name: "Color theme" })
    .selectOption("dark");
  assert.equal(await page.locator("#uplift-evidence").textContent(), frozenFit);
  await page.locator("#uplift-next").click();
  await expect(page.locator("#uplift-evidence")).toBeHidden();
  await page.locator("#uplift-evaluate").click();
  await expect(page.locator(".uplift-policy")).toHaveCount(3);
  await expect(page.locator("#uplift-result")).toContainText("200 contacts");
  const firstHoldout = await page.locator("#uplift-evidence").textContent();
  await page.locator("#uplift-evaluate").click();
  assert.notEqual(
    await page.locator("#uplift-evidence").textContent(),
    firstHoldout,
  );
  await page.locator('[data-practice="no"]').click();
  await expect(page.locator("#uplift-practice-feedback")).toContainText(
    "Correct",
  );
  await page.locator('[data-step="2"]').click();
  assert.equal(await page.locator("#uplift-evidence").textContent(), frozenFit);
  await page.locator('[data-step="0"]').click();
  await expect(page.locator("#uplift-result")).toContainText("35 → 65");
  await page.locator('[data-step="1"]').click();
  await expect(page.locator("#uplift-world")).toHaveValue("aligned");
  await page.locator("#uplift-reset").click();
  await page.locator("#uplift-next").click();
  await expect(page.locator("#uplift-prediction")).toBeVisible();
  await page.locator('[data-predict="uplift"]').click();
  await expect(page.locator("#uplift-feedback")).toContainText("Correct");
  await expect(
    page.getByRole("radio", { name: "Highest uplift", exact: true }),
  ).toBeChecked();
  await expect(
    page.locator('.uplift-group[data-contacted="true"]'),
  ).toContainText("Browsing");
  await expect(page.locator("#uplift-result")).toContainText(
    "adds 30 purchases",
  );
  await expect(page.locator("#uplift-rule-note")).toContainText(
    "increase in purchase chance caused by contact",
  );
  await expect(page.locator("#uplift-budget-value")).toHaveText("100");
  await expect(page.locator("#uplift-world")).toHaveValue("different");

  await mkdir("test-results", { recursive: true });
  for (const theme of ["light", "dark"]) {
    await page
      .getByRole("combobox", { name: "Color theme" })
      .selectOption(theme);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 1100 });
      for (let step = 0; step < 4; step++) {
        await page.locator(`[data-step="${step}"]`).click();
        if (step === 2) await page.locator("#uplift-fit").click();
        if (step === 3) await page.locator("#uplift-evaluate").click();
        await expect(page.locator(`#uplift-title`)).toBeVisible();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          `${theme}/${width}/${step}: overflow`,
        );
        await page.screenshot({
          path: `test-results/uplift-${theme}-${width}-${step}.png`,
          fullPage: true,
        });
      }
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#uplift-reset").click();
  await page.locator("#lesson-menu-toggle").click();
  await expect(
    page.getByRole("region", { name: "Optional tracks", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#lesson-menu-toggle")).toBeFocused();
  await page.getByText("References and inspiration", { exact: true }).click();
  await expect(
    page.getByText("Inspired by Sandip D.", { exact: true }),
  ).toBeVisible();

  await page.goto(`${url}?lesson=topics`);
  await page
    .getByRole("region", { name: "Optional tracks", exact: true })
    .getByRole("link", { name: "Uplift modelling: from effects to decisions" })
    .click();
  await expect(page.locator("h1")).toHaveText("Uplift modelling");
  assert.deepEqual(errors, []);
  console.log(
    "Uplift track: comparisons, keyboard, independent evaluation, restart, discovery, and themes passed.",
  );
} finally {
  await browser.close();
}
