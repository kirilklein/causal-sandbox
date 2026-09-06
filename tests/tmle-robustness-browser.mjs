import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const base = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
  await page.goto(new URL("docs/tmle-robustness-preview.html", base).href);
  await page.locator("#tmle-map .cell").first().waitFor();
  assert.equal(await page.locator(".cell").count(), 242);
  const start = await page.locator("#tmle-value").textContent();
  await page.locator('#tmle-map [data-x="5"][data-y="10"]').click();
  assert.equal(await page.locator("#tmle-value").textContent(), "2.000");
  assert.equal(await page.locator("#ipw-value").textContent(), "2.000");
  assert.equal(await page.locator("#treatment").inputValue(), "5");
  assert.equal(await page.locator("#outcome").inputValue(), "10");
  await page.locator('#ipw-map [data-x="10"][data-y="5"]').click();
  assert.equal(await page.locator("#tmle-value").textContent(), "2.000");
  const ipw = await page.locator("#ipw-value").textContent();
  assert.notEqual(ipw, "2.000");
  await page.locator("#outcome").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#outcome").inputValue(), "6");
  assert.equal(await page.locator("#ipw-value").textContent(), ipw);
  await page.getByRole("button", { name: "Scale", exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Scale", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.match(await page.locator("#treatment-value").textContent(), /×/);
  assert.match(await page.locator("#legend-numbers").textContent(), /2.25/);
  const values = await page.locator(".result-values").textContent();
  const models = page
    .locator("summary")
    .filter({ hasText: "What changed in the models?" });
  await models.click();
  assert.equal(await page.locator(".result-values").textContent(), values);
  assert.equal(await page.locator("#model-rows tr").count(), 2);
  await models.click();
  await page.locator("#reset").click();
  assert.equal(await page.locator("#tmle-value").textContent(), start);
  assert.equal(await page.locator("#treatment").inputValue(), "8");
  assert.equal(await page.locator("#outcome").inputValue(), "7");
  assert.match(await page.locator("#legend-numbers").textContent(), /0.50/);

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.reload();
    await page.locator("#tmle-map .cell").first().waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow at ${width}px`,
    );
    await page.locator('#ipw-map [data-x="0"][data-y="5"]').tap();
    assert.equal(await page.locator("#tmle-value").textContent(), "2.000");
    await page.getByRole("button", { name: "Scale", exact: true }).tap();
    assert.equal(await page.locator("#tmle-value").textContent(), "2.000");
    await models.tap();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Open table overflows at ${width}px`,
    );
    await page.locator("#reset").tap();
    assert.equal(await page.locator("#tmle-value").textContent(), start);
  }
  assert.deepEqual(errors, []);
  console.log(
    "TMLE robustness preview: desktop, phone, keyboard, touch and built-page checks passed.",
  );
} finally {
  await browser.close();
}
