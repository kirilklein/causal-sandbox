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
  await page.goto(`${url}?lesson=difference-in-differences`);
  await page
    .getByText("The same comparison as a regression", { exact: true })
    .click();
  await expect(page.locator("#did-regression")).toContainText(
    "60 −20 +10 +15 = 65%",
  );
  await page.locator('[data-regression-answer="no"]').click();
  await expect(page.locator("#did-regression-feedback")).toContainText(
    "Correct",
  );
  await page
    .getByText("Explain the result to a hospital director", { exact: true })
    .click();
  await page.locator('[data-communication-answer="qualified"]').click();
  await expect(page.locator("#did-communication-feedback")).toContainText(
    "If A would have changed",
  );
  await page.locator('[data-did-step="4"]').click();
  await page.locator("#did-extra").focus();
  await page.keyboard.press("End");
  await expect(page.locator("#did-regression")).toContainText("δ = +25");
  await expect(page.locator("#did-regression-feedback")).toContainText(
    "stays +25 pp",
  );
  await page.locator("#did-reset").click();
  await expect(page.locator("#did-regression-feedback")).toBeEmpty();
  await expect(page.locator("#did-communication-feedback")).toBeEmpty();
  await mkdir("test-results", { recursive: true });
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Open regression bridge fits a phone",
    );
  }
  await page
    .locator("#did-regression")
    .screenshot({ path: "test-results/did-regression-phone.png" });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page
    .getByRole("link", {
      name: "Next: which hospitals make a credible comparison? →",
    })
    .click();
  await expect(page.locator("h1")).toHaveText(
    "Which hospitals make a credible comparison?",
  );
  const stage = (i) => page.locator(`[data-da-step="${i}"]`).click();
  const value = page.locator(".did-estimate strong");
  const tint = () =>
    page
      .locator(".did-estimate")
      .evaluate((e) =>
        Number.parseFloat(e.style.getPropertyValue("--error-tint")),
      );
  const data = async () =>
    (await page.locator("#da-chart .hospital-record").allTextContents()).sort();
  const endpoints = () =>
    page.locator(".da-treated-row").evaluateAll((rows) =>
      rows.map((row) => ({
        id: row.dataset.hospital,
        baseline: row.querySelector(".da-baseline").getAttribute("cx"),
        observed: row.querySelector(".da-observed path").getAttribute("d"),
      })),
    );
  const assumed = () =>
    page
      .locator(".da-assumed")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  await expect(value).toHaveText("+15 pp");
  await expect(page.locator(".da-treated-row")).toHaveCount(6);
  await expect(page.locator(".da-source-hospital")).toHaveCount(6);
  await expect(page.locator(".da-row-gap")).toHaveText(Array(6).fill("+15 pp"));
  await expect(
    page.locator('.da-treated-row[data-hospital="T1"] .da-row-values'),
  ).toHaveText("30% → 40% assumed → 55%");
  const initial = await data();
  await page.locator('[data-da-answer="0"]').click();
  await expect(page.locator("#da-feedback")).toContainText("Reconsider");
  await page.locator(".da-trajectories summary").click();
  await expect(page.locator(".da-mini")).toHaveCount(12);
  assert.deepEqual(
    (
      await page.locator("#da-trajectories .hospital-record").allTextContents()
    ).sort(),
    initial,
  );
  await page.locator(".da-trajectories summary").click();
  await stage(1);
  assert.deepEqual(await data(), initial);
  await page.locator("#da-manipulate").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#da-manipulate")).toBeFocused();
  await expect(value).toHaveText("+20 pp");
  await expect(page.locator(".da-row-gap")).toHaveText([
    "+25 pp",
    "+25 pp",
    "+25 pp",
    "+25 pp",
    "+10 pp",
    "+10 pp",
  ]);
  const capacity = await data();
  assert.equal(await tint(), 0);
  await expect(page.locator(".did-effect-error")).toHaveCount(0);
  await page.locator("#da-truth").check();
  await expect(page.locator(".did-truth-result strong")).toHaveText("+15 pp");
  assert.ok((await tint()) > 0 && (await tint()) < 20);
  await stage(2);
  const fixed = await endpoints();
  const beforeAssumed = await assumed();
  await page.locator("#da-manipulate").check();
  assert.deepEqual(await data(), capacity);
  assert.deepEqual(
    await endpoints(),
    fixed,
    "Observed endpoints stay at the same positions during adjustment",
  );
  assert.notDeepEqual(
    await assumed(),
    beforeAssumed,
    "Only the assumed endpoints change",
  );
  await expect(page.locator(".da-row-gap")).toHaveText(Array(6).fill("+15 pp"));
  await expect(page.locator(".da-borrow-amount strong")).toHaveText([
    "+20 pp",
    "+5 pp",
  ]);
  await expect(page.locator(".da-contributions")).toContainText(
    "4/6 of the target",
  );
  await expect(page.locator(".da-contributions")).toContainText(
    "2/6 of the target",
  );
  await page.locator("#da-shock-details summary").click();
  await page.locator("#da-shock").check();
  await expect(value).toHaveText("+25 pp");
  await expect(page.locator(".did-effect-error")).toHaveText(
    "+10 pp from truth",
  );
  const shocked = await data();
  await page.locator("#da-manipulate").uncheck();
  assert.deepEqual(await data(), shocked);
  await expect(value).toHaveText("+30 pp");
  await page.locator("#da-manipulate").check();
  assert.deepEqual(await data(), shocked);
  await page.locator("#da-truth").uncheck();
  assert.equal(await tint(), 0);
  await expect(page.locator(".did-effect-error")).toHaveCount(0);
  await page.locator("#da-truth").check();
  await page.locator("#da-shock").uncheck();
  await page.locator("#da-shock-details summary").click();
  for (const theme of ["light", "dark"]) {
    await page
      .getByRole("switch", { name: "Dark mode" })
      .setChecked(theme === "dark");
    for (const width of [1280, 760, 390, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      for (let i = 0; i < 3; i++) {
        await stage(i);
        await expect(page.locator("#da-title")).toBeFocused();
        await expect(page.locator("#da-chart .hospital-record")).toHaveCount(
          12,
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${theme}/${width}/${i}: overflow`,
        );
        const [a, b] = await Promise.all([
          page.locator(".did-estimate").boundingBox(),
          page.locator(".did-truth-result").boundingBox(),
        ]);
        assert.ok(
          Math.abs(a.y - b.y) < 1 && b.x > a.x,
          "Truth remains beside estimate",
        );
        const overflow = await page
          .locator("#da-chart svg")
          .evaluateAll((svgs) =>
            svgs.flatMap((svg) =>
              [...svg.querySelectorAll("text")]
                .filter((text) => {
                  const r = text.getBBox();
                  return (
                    r.x < -1 || r.x + r.width > svg.viewBox.baseVal.width + 1
                  );
                })
                .map((text) => text.textContent),
            ),
          );
        assert.deepEqual(overflow, [], "Chart labels stay in bounds");
        if (i === 2) {
          const observed = await endpoints();
          await page.locator("#da-manipulate").uncheck();
          assert.deepEqual(await endpoints(), observed);
          await page.locator("#da-manipulate").check();
        }
        if (width !== 360)
          await page.locator("#da-chart").screenshot({
            path: `test-results/did-borrow-${theme}-${width}-${i}.png`,
          });
      }
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await stage(2);
  await expect(value).toHaveText("+15 pp");
  await page.locator("#da-reset").click();
  await expect(page.locator("#da-truth")).not.toBeChecked();
  await expect(page.locator("#da-feedback")).toBeEmpty();
  await expect(page.locator(".da-trajectories")).not.toHaveAttribute(
    "open",
    "",
  );
  for (const i of [1, 2]) {
    await stage(i);
    await expect(page.locator("#da-manipulate")).not.toBeChecked();
  }
  await expect(page.locator("#da-shock")).not.toBeChecked();
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(
    page
      .locator("#lesson-menu")
      .getByRole("link", { name: "Comparable hospitals", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Find a lesson or concept" })
    .fill("capacity");
  await page
    .locator('#search-results a[href$="?lesson=did-adjustment"]')
    .click();
  await expect(page.locator("h1")).toContainText("credible comparison");
  await page.getByRole("link", { name: "All topics", exact: true }).click();
  await page
    .locator("summary")
    .filter({ hasText: "What can these methods establish?" })
    .click();
  await page
    .getByRole("link", {
      name: "Which hospitals make a credible comparison?",
      exact: true,
    })
    .click();
  await expect(page.locator("h1")).toContainText("credible comparison");
  await page.getByRole("link", { name: "← Basic DiD", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Difference-in-differences");
  assert.deepEqual(errors, []);
  console.log(
    "Comparable hospitals and regression bridge: fixtures, fixed data, truth gating, discovery, reset, keyboard, themes, motion, and layouts passed.",
  );
} finally {
  await browser.close();
}
