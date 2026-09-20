import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*.goatcounter.com/**", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"count":"0"}' }),
  );
  await page.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.goto(`${url}?lesson=introduction`);
  await page
    .getByRole("link", {
      name: "Start here: one patient, two possible futures",
    })
    .click();
  await expect(page.locator("h1")).toHaveText(
    "Did treatment help this patient?",
  );
  await expect(page.locator("#trajectory-pause")).toBeHidden();
  await expect(page.locator("#trajectory-frame-label")).toContainText("DAY 12");
  await expect(page.locator("#what-if-ghost")).toBeHidden();
  await page.locator("#trajectory-next").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).toBeFocused();
  await expect(page.locator("#trajectory-canvas")).toHaveAttribute(
    "aria-label",
    /52.7 with treatment and 40.7 without/,
  );
  await page.screenshot({
    path: "/tmp/what-if-two-futures-desktop.png",
    fullPage: true,
  });
  await page.locator("#trajectory-next").click();
  await expect(
    page.locator(".what-if-world").first().locator(".what-if-person"),
  ).toHaveCount(10);
  await expect(page.locator("[data-outcome]")).toHaveCount(20);
  await expect(page.locator('[data-mean="1"]')).toContainText("66.0");
  await expect(page.locator('[data-mean="0"]')).toContainText("54.0");
  const focal = page
    .locator(".what-if-world")
    .first()
    .getByRole("img", { name: /Patient 08:/ });
  await focal.focus();
  await expect(focal.locator(".what-if-value")).toBeVisible();
  await expect(focal.locator(".what-if-value")).toHaveText("52.7");
  const identities = await page
    .locator("[data-person]")
    .evaluateAll((marks) => marks.map((mark) => mark.dataset.person));
  await page.screenshot({
    path: "/tmp/what-if-population-desktop.png",
    fullPage: true,
  });
  await page.locator("#trajectory-next").click();
  assert.deepEqual(
    await page
      .locator("[data-person]")
      .evaluateAll((marks) => marks.map((mark) => mark.dataset.person)),
    identities,
  );
  await expect(page.locator("[data-outcome]")).toHaveCount(10);
  await expect(page.locator("[data-observed=false]")).toHaveCount(0);
  await expect(page.locator(".what-if-missing")).toHaveCount(10);
  await expect(page.locator("[data-mean]").first()).toContainText(
    "Average unknown",
  );
  await expect(page.locator("#what-if-ghost")).toBeHidden();
  await page
    .getByRole("link", { name: "Start with a randomized experiment" })
    .click();
  await expect(page.locator("h1")).toHaveText("A randomized experiment");
  // The opening does not renumber core lessons or claim completion.
  assert.equal(
    await page
      .locator('.lesson-nav ol a[data-number="1"]')
      .getAttribute("aria-label"),
    "A randomized experiment",
  );
  await page.getByRole("link", { name: "← What if?", exact: true }).click();
  await expect(page.locator("h1")).toContainText("Did treatment");
  await page.goto(`${url}?lesson=learn`);
  await page.getByRole("link", { name: /Start from scratch/ }).click();
  await expect(page.locator("h1")).toContainText("Did treatment");
  await page.goto(`${url}?lesson=topics`);
  await page
    .getByText("What are we trying to learn?", { exact: false })
    .click();
  await page.getByRole("link", { name: "What if?", exact: true }).click();
  await expect(page.locator("h1")).toContainText("Did treatment");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(page.locator('#lesson-menu a[aria-current="step"]')).toHaveText(
    "What if?",
  );
  await page.keyboard.press("Escape");
  await page
    .locator(".lesson-nav")
    .getByRole("button", { name: /Search/ })
    .click();
  await page.getByRole("searchbox").fill("what if");
  await expect(
    page.locator('#search-results a[href$="?lesson=what-if"]'),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  for (const theme of ["light", "dark"]) {
    await page.getByLabel("Color theme").selectOption(theme);
    await page.setViewportSize({ width: 375, height: 812 });
    for (const chapter of [0, 1, 2, 3]) {
      await page.locator(`[data-chapter="${chapter}"]`).click();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${theme} chapter ${chapter} fits a phone`,
      );
      await page.screenshot({
        path: `/tmp/what-if-${theme}-phone-${chapter}.png`,
        fullPage: true,
      });
    }
    await page.locator("#trajectory-back").click();
    await expect(page.locator("[data-outcome]")).toHaveCount(20);
  }
  await page.setViewportSize({ width: 320, height: 700 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator('[data-chapter="0"]').click();
  await page
    .getByRole("button", { name: "Pause animation", exact: true })
    .click();
  const pausedDay = await page.locator("#trajectory-frame-label").innerText();
  await page.waitForTimeout(100);
  assert.equal(
    await page.locator("#trajectory-frame-label").innerText(),
    pausedDay,
  );
  await page
    .getByRole("button", { name: "Resume animation", exact: true })
    .click();
  await page.locator('[data-chapter="3"]').click();
  await expect(page.locator("#what-if-playback")).toBeHidden();
  await expect(page.locator(".what-if-missing")).toHaveCount(10);
  assert.deepEqual(errors, []);
  console.log("What if browser checks passed");
} finally {
  await browser.close();
}
