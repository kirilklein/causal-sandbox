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
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/",
  );
  await page.locator(".effect-row").last().waitFor();
  const values = async () =>
    page
      .locator(".effect-row strong")
      .allTextContents()
      .then((a) => a.map(Number));
  const simulationView = () =>
    page.evaluate(() => ({
      estimates: document.querySelector("#effects").textContent,
      truth: document.querySelector("#truth-value").textContent,
      population: document
        .querySelector("#population")
        .getAttribute("aria-label"),
      controls: [...document.querySelectorAll("input, select")].map((el) => [
        el.value,
        el.checked,
        el.disabled,
      ]),
      visibility: [...document.querySelectorAll("[data-visible]")].map((el) =>
        el.getAttribute("aria-pressed"),
      ),
    }));
  const beforeHelp = await simulationView();
  const hoverTerm = page.locator('.help-button[popovertarget="help-ipw"]');
  const hoverPanel = page.locator("#help-ipw");
  assert.equal(await hoverTerm.innerText(), "IPW");
  // Passing over a term does not flash a definition; dwelling opens it nearby.
  await hoverTerm.hover();
  await page.waitForTimeout(150);
  assert.equal(await hoverPanel.isVisible(), false);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(550);
  assert.equal(await hoverPanel.isVisible(), false);
  await hoverTerm.hover();
  await hoverPanel.waitFor({ state: "visible" });
  const termBounds = await hoverTerm.boundingBox();
  const panelBounds = await hoverPanel.boundingBox();
  assert.ok(
    Math.min(
      Math.abs(panelBounds.y - termBounds.y - termBounds.height),
      Math.abs(termBounds.y - panelBounds.y - panelBounds.height),
    ) < 12,
  );
  await hoverPanel.hover();
  await page.waitForTimeout(300);
  assert.equal(await hoverPanel.isVisible(), true);
  assert.deepEqual(await simulationView(), beforeHelp);
  await page.screenshot({ path: "/tmp/causal-term-hover.png", fullPage: true });
  await page.mouse.move(0, 0);
  await hoverPanel.waitFor({ state: "hidden" });
  await hoverTerm.hover();
  await hoverPanel.waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(550);
  assert.equal(await hoverPanel.isVisible(), false);
  await page.mouse.move(0, 0);
  await hoverTerm.hover();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(550);
  assert.equal(await hoverPanel.isVisible(), false);
  await page.mouse.move(0, 0);
  const definitions = new Map();
  // Every contextual trigger is independent of labels and supports the keyboard.
  for (const trigger of await page.locator(".help-button").all()) {
    assert.equal(await trigger.evaluate((el) => el.closest("label")), null);
    assert.match(await trigger.getAttribute("aria-label"), /^Explain .+/);
    const target = await trigger.getAttribute("popovertarget");
    const panel = page.locator(`#${target}`);
    await trigger.focus();
    assert.equal(
      await trigger.evaluate((el) => getComputedStyle(el).outlineStyle),
      "solid",
    );
    await page.keyboard.press("Enter");
    assert.equal(await panel.isVisible(), true);
    definitions.set(
      target.replace("help-", ""),
      await panel.locator("p").innerText(),
    );
    assert.deepEqual(await simulationView(), beforeHelp);
    await page.keyboard.press("Escape");
    assert.equal(await panel.isVisible(), false);
    assert.equal(
      await trigger.evaluate((el) => el === document.activeElement),
      true,
    );
  }
  // Updating the simulation must not replace an estimator's focused help button.
  const aipwHelp = page.locator('.help-button[popovertarget="help-aipw"]');
  await aipwHelp.focus();
  await page.keyboard.press("Space");
  const definition = await page.locator("#help-aipw p").innerText();
  await page.locator('[data-param="direct"]').evaluate((el) => {
    el.value = "2.1";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  assert.equal(
    await aipwHelp.evaluate((el) => el === document.activeElement),
    true,
  );
  assert.equal(await page.locator("#help-aipw").isVisible(), true);
  assert.equal(await page.locator("#help-aipw p").innerText(), definition);
  assert.equal(await page.locator("#truth-value").innerText(), "2.10");
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator("#help-aipw .close-help")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#help-aipw").isVisible(), false);
  assert.equal(
    await aipwHelp.evaluate((el) => el === document.activeElement),
    true,
  );
  await page.locator("#reset").click();
  assert.deepEqual(await simulationView(), beforeHelp);

  // Warning text changes independently of its focused help and open definition.
  await page.locator('input[value="C"]').check();
  const essHelp = page.locator('.help-button[popovertarget="help-ess"]');
  await essHelp.focus();
  await page.keyboard.press("Enter");
  const essDefinition = await page.locator("#help-ess p").innerText();
  for (const strength of ["3", "0"]) {
    await page.locator('[data-param="ca"]').evaluate((el, value) => {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, strength);
    assert.equal(await page.locator("#help-ess").isVisible(), true);
    assert.equal(
      await essHelp.evaluate((el) => el === document.activeElement),
      true,
    );
    assert.equal(await page.locator("#help-ess p").innerText(), essDefinition);
    assert.equal(
      (await page.locator("#overlap-warning").innerText()).length > 0,
      strength === "3",
    );
  }
  await page.keyboard.press("Escape");
  await page.locator("#reset").click();
  assert.deepEqual(await simulationView(), beforeHelp);

  await page.locator("#methods").click();
  assert.equal(await page.locator(".glossary").getAttribute("open"), null);
  await page.locator(".glossary summary").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".glossary dd").count(), definitions.size);
  for (const [key, text] of definitions) {
    assert.equal(
      await page.locator(`[data-glossary="${key}"]`).innerText(),
      text,
    );
  }
  assert.equal(
    await page.locator(".help-credit a").getAttribute("href"),
    "https://carlos-mendez.org/post/stata_matching/web_app/",
  );
  assert.deepEqual(await simulationView(), beforeHelp);
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .locator("#methods")
      .evaluate((el) => el === document.activeElement),
    true,
  );
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
  const mobileBeforeHelp = await simulationView();
  const colliderHelp = page.locator(
    '.help-button[popovertarget="help-collider"]',
  );
  // Opening must place the panel on screen before the next animation frame.
  await colliderHelp.scrollIntoViewIfNeeded();
  const initialBounds = await colliderHelp.evaluate((trigger) => {
    trigger.click();
    const panel = trigger.popoverTargetElement;
    const { left, right, top, bottom } = panel.getBoundingClientRect();
    panel.querySelector(".close-help").click();
    return { left, right, top, bottom };
  });
  assert.ok(
    initialBounds.left >= 0 &&
      initialBounds.right <= 390 &&
      initialBounds.top >= 0 &&
      initialBounds.bottom <= 844,
    `Initial mobile help bounds: ${JSON.stringify(initialBounds)}`,
  );
  await colliderHelp.tap();
  assert.equal(await page.locator("#help-collider").isVisible(), true);
  assert.deepEqual(await simulationView(), mobileBeforeHelp);
  const helpBounds = await page.locator("#help-collider").boundingBox();
  assert.ok(helpBounds.x >= 0 && helpBounds.x + helpBounds.width <= 390);
  assert.ok(helpBounds.y >= 0 && helpBounds.y + helpBounds.height <= 844);
  await page.screenshot({
    path: "/tmp/causal-help-mobile.png",
    fullPage: true,
  });
  await page.locator("#help-collider .close-help").tap();
  assert.equal(await page.locator("#help-collider").isVisible(), false);
  assert.deepEqual(await simulationView(), mobileBeforeHelp);
  await page.locator("#methods").tap();
  assert.ok(await page.locator(".glossary dd").first().isVisible());
  assert.ok(
    await page
      .locator("#about")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  );
  await page.locator("#close-about").tap();
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
