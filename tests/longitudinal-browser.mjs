import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { longitudinalSample } from "../src/longitudinal-simulation.js";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    colorScheme: "light",
    hasTouch: true,
  });
  await context.route("**/*.goatcounter.com/**", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"count":"0"}' }),
  );
  await context.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${url}?lesson=timing`);
  await page
    .locator('main > p a[href="?lesson=time-varying-confounding"]')
    .click();
  await expect(page.locator("h1")).toHaveText(
    "When treatment changes the next treatment decision",
  );
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(
    page.locator('.optional-menu [aria-current="step"]'),
  ).toHaveAttribute("href", "?lesson=time-varying-confounding");
  await page.keyboard.press("Escape");
  await expect(page.locator("#lesson-menu-toggle")).toBeFocused();
  const randomized = longitudinalSample();
  const confounded = longitudinalSample({ confounded: true });
  await expect(page.locator("#regression-value")).toHaveText(
    randomized.unadjusted.toFixed(2),
  );
  await expect(page.locator("#ipw-card")).toBeHidden();
  await expect(page.locator("#severity-treatment-path")).toHaveCSS(
    "visibility",
    "hidden",
  );
  await page.locator("#adjust-severity").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#regression-value")).toHaveText(
    randomized.adjusted.toFixed(2),
  );
  await page.locator('[data-stage="1"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#severity-treatment-path")).toHaveCSS(
    "visibility",
    "visible",
  );
  await expect(page.locator("#regression-value")).toHaveText(
    confounded.adjusted.toFixed(2),
  );
  await page.locator("#adjust-severity").uncheck();
  await expect(page.locator("#regression-value")).toHaveText(
    confounded.unadjusted.toFixed(2),
  );
  const graph = await page.locator("#history-graph").innerHTML();
  await page.locator('[data-stage="2"]').click();
  await expect(page.locator("#ipw-value")).toHaveText(
    confounded.ipw.toFixed(2),
  );
  assert.equal(await page.locator("#history-graph").innerHTML(), graph);
  await expect(page.locator("#regression-value")).toHaveText(
    confounded.unadjusted.toFixed(2),
  );
  await page.locator("#weight-detail > summary").click();
  await expect(page.locator("#person-weight")).toContainText(
    confounded.weights[0].weight.toFixed(3),
  );
  await page.locator("#person").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#person-number")).toHaveText("2");
  await expect(page.locator("#person-weight")).toContainText(
    confounded.weights[1].weight.toFixed(3),
  );
  await page.locator("#studies > summary").click();
  await page.locator("#repeat").click();
  await expect(page.locator("#study-status")).toHaveText(
    "60 studies complete.",
  );
  await expect(page.locator("#study-results tbody tr")).toHaveCount(3);
  const studies = await page.locator("#study-results").innerHTML();
  await page.locator("#redraw").click();
  await expect(page.locator("#sample")).toContainText("4218");
  assert.equal(await page.locator("#study-results").innerHTML(), studies);
  // Keep batch cancellation deterministic by initiating both clicks in one task.
  await page.evaluate(() => {
    document.querySelector("#repeat").click();
    document.querySelector('[data-stage="0"]').click();
  });
  await expect(page.locator("#study-results")).toBeEmpty();
  await expect(page.locator("#study-status")).toBeEmpty();
  await expect(page.locator("#repeat")).toBeEnabled();
  await page.locator("#restart").click();
  await expect(page.locator("#sample")).toContainText("4217");
  await expect(page.locator("#adjust-severity")).not.toBeChecked();
  await expect(page.locator("main details[open]")).toHaveCount(0);
  await expect(page.locator("#person")).toHaveValue("1");
  await expect(page.locator("#regression-value")).toHaveText(
    randomized.unadjusted.toFixed(2),
  );
  await page.locator('[data-stage="2"]').click();
  await page.screenshot({
    path: "/tmp/longitudinal-desktop.png",
    fullPage: true,
  });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme: theme });
      await page.locator('[data-stage="1"]').tap();
      await page.locator('[data-stage="2"]').tap();
      await expect(page.locator("#ipw-card")).toBeVisible();
      await expect(page.locator(".longitudinal-intro")).toHaveCSS(
        "display",
        "block",
      );
      assert.notEqual(
        await page
          .locator(".result.truth")
          .evaluate((el) => getComputedStyle(el).backgroundColor),
        "rgba(0, 0, 0, 0)",
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow at ${width} ${theme}`,
      );
      if (width === 390 && theme === "light")
        await page.screenshot({
          path: "/tmp/longitudinal-mobile.png",
          fullPage: true,
        });
    }
  }
  await page
    .getByRole("link", { name: "← What timing tells us", exact: true })
    .click();
  await expect(page.locator("#timing-restart")).toBeVisible();
  await page.goBack();
  await expect(page.locator('[data-stage="0"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  assert.deepEqual(errors, []);
  console.log("Longitudinal lesson browser checks passed.");
} finally {
  await browser.close();
}
