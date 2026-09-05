import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/",
  );
  await page.locator(".effect-row").last().waitFor();
  for (const name of ["direct", "ca", "cy", "ua", "uy", "am", "my"]) {
    const slider = page.locator(`[data-param="${name}"]`);
    const descriptionId = await slider.getAttribute("aria-describedby");
    assert.equal(descriptionId, `help-${name}`);
    assert.ok(
      (await page.locator(`#${descriptionId}`).textContent()).length > 20,
    );
  }
  assert.match(
    await page.locator("#world-select").getAttribute("aria-describedby"),
    /world-help world-description/,
  );
  assert.match(
    await page.locator(".visibility-row .choice-explanation").innerText(),
    /not used automatically/,
  );
  assert.match(
    await page.locator(".adjust-row .choice-explanation").innerText(),
    /estimators actually use/,
  );
  for (const model of ["outcome", "treatment"]) {
    assert.match(
      await page.locator(`#${model}-model`).getAttribute("aria-describedby"),
      new RegExp(`${model}-purpose.*${model}-terms`),
    );
  }
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
  // Worlds and analyst models are independent controls.
  await page.locator('input[value="C"]').check();
  const baseline = await values();
  const populationLabel = await page
    .locator("#population")
    .getAttribute("aria-label");
  await page.locator("#world-select").selectOption("both");
  assert.equal(await page.locator('input[value="C"]').isChecked(), true);
  assert.equal(await page.locator("#truth-value").innerText(), "2.00");
  const bothSimple = await values();
  assert.ok(bothSimple.slice(2).every((v) => v > 3));
  await page.locator("#outcome-model").selectOption("interaction");
  const outcomeOnly = await values();
  assert.ok(Math.abs(outcomeOnly[2] - 2) < 0.2);
  assert.ok(Math.abs(outcomeOnly[4] - 2) < 0.2);
  assert.equal(outcomeOnly[3], bothSimple[3]);
  await page.locator("#outcome-model").selectOption("main");
  await page.locator("#treatment-model").selectOption("interaction");
  const treatmentOnly = await values();
  assert.equal(treatmentOnly[2], bothSimple[2]);
  assert.ok(Math.abs(treatmentOnly[3] - 2) < 0.2);
  assert.ok(Math.abs(treatmentOnly[4] - 2) < 0.2);
  await page.locator("#outcome-model").selectOption("interaction");
  assert.ok((await values()).slice(2).every((v) => Math.abs(v - 2) < 0.2));
  await page.locator('[data-visible="C"]').click();
  for (const model of ["outcome", "treatment"])
    assert.equal(await page.locator(`#${model}-model`).isDisabled(), true);
  assert.ok((await values()).slice(2).every((v) => v > 4));
  await page.locator('[data-visible="C"]').click();
  assert.equal(await page.locator("#outcome-model").isDisabled(), true);
  await page.locator('input[value="C"]').check();
  assert.equal(
    await page.locator("#outcome-model").inputValue(),
    "interaction",
  );
  assert.ok(Math.abs((await values())[4] - 2) < 0.2);
  for (const world of ["additive", "outcome", "treatment", "both"]) {
    await page.locator("#world-select").selectOption(world);
    for (let i = 0; i < 5; i++) {
      await page.locator(`[data-preset="${i}"]`).click();
      assert.equal(await page.locator("#world-select").inputValue(), world);
      assert.equal(
        await page.locator("#outcome-model").inputValue(),
        "interaction",
      );
      const v = await values();
      assert.ok(v.every(Number.isFinite));
      if (i === 0) assert.ok(v.every((x) => Math.abs(x - 2) < 0.1));
      if (i === 2) assert.ok(v.slice(2).every((x) => x > 3));
      if (i === 3) assert.ok(v.slice(2).every((x) => Math.abs(x - 2) > 0.8));
      if (i === 4) assert.ok(Math.abs(v[2] - 1) < 0.15);
    }
  }
  await page.locator("#reset").click();
  await page.locator('input[value="C"]').check();
  assert.deepEqual(await values(), baseline);
  assert.equal(
    await page.locator("#population").getAttribute("aria-label"),
    populationLabel,
  );
  assert.equal(await page.locator("#outcome-model").inputValue(), "main");
  await page.locator("#world-select").selectOption("outcome");
  assert.ok((await values())[2] > 2.5);
  assert.match(
    await page.locator("#lesson").innerText(),
    /outcome model misses/,
  );
  await page.locator("#world-select").selectOption("treatment");
  assert.ok((await values())[3] < 1.7);
  assert.match(
    await page.locator("#lesson").innerText(),
    /treatment model misses/,
  );
  await page.locator("#world-select").selectOption("both");
  assert.match(await page.locator("#lesson").innerText(), /Both models omit/);
  await page.screenshot({
    path: "/tmp/causal-worlds-desktop.png",
    fullPage: true,
  });
  console.log(
    "Desktop dimensions",
    await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    })),
  );
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({
    path: "/tmp/causal-worlds-laptop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#outcome-model").selectOption("interaction");
  assert.ok(Math.abs((await values())[4] - 2) < 0.2);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/causal-worlds-mobile.png",
    fullPage: true,
  });
  // Time the complete synchronous slider update, including estimation and rendering.
  const timings = await page.evaluate(() => {
    const control = document.querySelector('[data-param="direct"]');
    const original = control.value;
    const times = [];
    for (let i = 0; i < 35; i++) {
      const start = performance.now();
      control.value = i % 2 ? "2" : "2.1";
      control.dispatchEvent(new Event("input", { bubbles: true }));
      if (i >= 5) times.push(performance.now() - start);
    }
    control.value = original;
    control.dispatchEvent(new Event("input", { bubbles: true }));
    times.sort((a, b) => a - b);
    return { median_ms: times[15], p95_ms: times[28] };
  });
  console.log("Browser slider recomputation", timings);
  assert.deepEqual(errors, []);
  console.log("All browser interactions passed; no runtime errors.");
} finally {
  await browser.close();
}
