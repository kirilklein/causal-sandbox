import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/");
  await page.locator(".effect-row").last().waitFor();
  const values = async () =>
    page
      .locator(".effect-row strong")
      .allTextContents()
      .then((a) => a.map(Number));
  assert.ok((await values())[0] > 3);
  await page.locator('input[value="C"]').check();
  assert.ok(Math.abs((await values())[4] - 2) < 0.15);
  await page.locator('[data-visible="C"]').click();
  assert.equal(await page.locator('input[value="C"]').isDisabled(), true);
  assert.ok((await values())[4] > 3);
  await page.locator('[data-visible="C"]').click();
  assert.equal(await page.locator('input[value="C"]').isChecked(), false);
  for (let i = 0; i < 5; i++) {
    await page.locator(`[data-preset="${i}"]`).click();
    const v = await values();
    console.log(
      ["Randomized", "Observed", "Hidden", "Collider", "Mediator"][i],
      v,
    );
    if (i === 0) assert.ok(v.every((x) => Math.abs(x - 2) < 0.1));
    if (i === 2) assert.ok(v[4] > 3);
    if (i === 3) {
      assert.ok(v[4] < 1);
      await page.locator('input[value="K"]').uncheck();
      assert.ok(Math.abs((await values())[4] - 2) < 0.1);
    }
    if (i === 4) {
      assert.ok(Math.abs(v[2] - 1) < 0.1);
      await page.locator('input[value="M"]').uncheck();
      assert.ok(Math.abs((await values())[2] - 2) < 0.1);
    }
  }
  await page.locator('[data-preset="0"]').click();
  for (const name of ["ca", "cy", "ua", "uy", "direct"]) {
    const slider = page.locator(`[data-param="${name}"]`);
    await slider.focus();
    await page.keyboard.press("End");
    assert.equal(await slider.inputValue(), name === "direct" ? "4" : "3");
  }
  assert.ok((await values()).every(Number.isFinite));
  await page.locator("#truth").click();
  assert.match(await page.locator("#truth").innerText(), /Reveal/);
  assert.equal(
    await page
      .locator("#nodes g")
      .filter({ hasText: "HIDDEN CONFOUNDER" })
      .getAttribute("opacity"),
    "0",
  );
  await page.locator("#truth").click();
  assert.match(await page.locator("#truth").innerText(), /Hide/);
  await page.locator(".path-controls summary").click();
  for (const k of ["am", "my"]) {
    await page.locator(`[data-param="${k}"]`).focus();
    await page.keyboard.press("End");
  }
  assert.equal(await page.locator("#truth-value").innerText(), "8.00");
  for (const k of ["M", "K"]) {
    await page.locator(`input[value="${k}"]`).check();
    await page.locator(`[data-visible="${k}"]`).click();
    assert.equal(await page.locator(`input[value="${k}"]`).isDisabled(), true);
    assert.equal(await page.locator(`input[value="${k}"]`).isChecked(), false);
    await page.locator(`[data-visible="${k}"]`).click();
  }
  await page.locator("#methods").click();
  assert.equal(await page.locator("#about").isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#about").isVisible(), false);
  await page.locator("#reset").click();
  await page.locator(".path-controls summary").click();
  await page.screenshot({ path: "/tmp/causal-desktop.png", fullPage: true });
  console.log(
    "Desktop dimensions",
    await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    })),
  );
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: "/tmp/causal-laptop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({ path: "/tmp/causal-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log("All browser interactions passed; no runtime errors.");
} finally {
  await browser.close();
}
