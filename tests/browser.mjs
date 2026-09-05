import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { defaults, makeNoise, simulate, estimate } from "../src/simulation.js";
import { sandboxOverlap } from "../src/sandbox-overlap.js";
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
    `${process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/"}?sandbox`,
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
  assert.equal(await page.locator(".data [data-visible]").count(), 0);
  assert.equal(await page.locator(".estimates [data-visible]").count(), 3);
  const availabilityBounds = await page
    .locator(".visibility-row")
    .boundingBox();
  const adjustmentBounds = await page.locator(".adjust-row").boundingBox();
  assert.ok(
    availabilityBounds.y + availabilityBounds.height <= adjustmentBounds.y,
  );
  assert.equal(
    await page
      .getByRole("switch", { name: "Show hidden factor U" })
      .getAttribute("aria-checked"),
    "true",
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
  const simulationView = () =>
    page.evaluate(() => ({
      estimates: document.querySelector("#effects").textContent,
      truth: document.querySelector("#truth-value").textContent,
      population: document
        .querySelector("#population")
        .getAttribute("aria-label"),
      controls: [
        ...document.querySelectorAll(
          ".workspace input, .workspace select, #world-select, #theme",
        ),
      ].map((el) => [el.value, el.checked, el.disabled]),
      visibility: [...document.querySelectorAll("[data-visible]")].map((el) =>
        el.getAttribute("aria-pressed"),
      ),
    }));
  const beforeHelp = await simulationView();
  const estimateStyles = () =>
    page.locator(".effect-row").evaluateAll((rows) =>
      rows.map((row) => ({
        tint: Number.parseFloat(row.style.getPropertyValue("--error-tint")),
        mark: getComputedStyle(row.querySelector(".estimate-dot"))
          .backgroundColor,
        bar: getComputedStyle(row.querySelector(".bias-line")).backgroundColor,
        difference: row
          .querySelector(".effect-value small")
          .getAttribute("aria-label"),
      })),
    );
  const unadjustedStyles = await estimateStyles();
  assert.ok(
    unadjustedStyles.every((style) => style.tint > 75 && style.tint < 85),
  );
  assert.ok(
    unadjustedStyles.every(
      (style) =>
        style.mark === style.bar && /from truth/.test(style.difference),
    ),
  );
  await page.locator('input[value="C"]').check();
  const adjustedStyles = await estimateStyles();
  assert.deepEqual(adjustedStyles.slice(0, 2), unadjustedStyles.slice(0, 2));
  assert.ok(
    adjustedStyles
      .slice(2)
      .every(
        (style, i) =>
          style.tint < unadjustedStyles[i + 2].tint &&
          style.mark !== unadjustedStyles[i + 2].mark,
      ),
  );
  await page.locator("#reset").click();
  assert.deepEqual(await simulationView(), beforeHelp);
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
  const observedBeforeHideC = await page
    .locator("#population")
    .getAttribute("aria-label");
  await page.locator('[data-visible="C"]').click();
  assert.equal(
    await page.locator("#population").getAttribute("aria-label"),
    observedBeforeHideC,
  );
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
  const beforeHideU = await simulationView();
  await page.locator("#show-u").click();
  assert.equal(
    await page.locator("#show-u").getAttribute("aria-checked"),
    "false",
  );
  assert.deepEqual(await simulationView(), beforeHideU);
  assert.equal(
    await page
      .locator("#nodes g")
      .filter({ hasText: "HIDDEN CONFOUNDER" })
      .getAttribute("opacity"),
    "0",
  );
  await page.locator("#show-u").click();
  assert.equal(
    await page.locator("#show-u").getAttribute("aria-checked"),
    "true",
  );
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
  // The focused card owns its experiment; neither set of controls changes the other.
  await page.locator("#reset").click();
  const overlap = page.locator("#overlap-experiment");
  const overlapSlider = page.locator("#overlap-strength");
  const overlapView = () =>
    overlap.evaluate((el) => ({
      strength: el.querySelector("input").value,
      estimates: el.querySelector(".overlap-estimates").textContent,
      histogram: el.querySelector("svg").getAttribute("aria-label"),
      weights: el.querySelector("tbody").textContent,
    }));
  const baselineOverlap = await overlapView();
  await page.locator('input[value="C"]').check();
  await page.locator("#world-select").selectOption("both");
  await page.locator("#treatment-model").selectOption("interaction");
  await page.locator('[data-visible="C"]').click();
  assert.deepEqual(await overlapView(), baselineOverlap);
  const mainBeforeOverlap = await simulationView();
  const details = overlap.locator("#overlap-weight-details");
  await details.locator("summary").focus();
  await page.keyboard.press("Enter");
  assert.deepEqual(await overlapView(), baselineOverlap);
  for (const strength of [0, 3]) {
    await overlapSlider.focus();
    await page.keyboard.press(strength ? "End" : "Home");
    assert.deepEqual(await simulationView(), mainBeforeOverlap);
    const data = simulate(
      { ...defaults, ca: strength, am: 0, my: 0 },
      makeNoise(),
    );
    const result = estimate(data, ["C"]);
    const arms = sandboxOverlap(data, result);
    for (const [key, value] of [
      ["regression", result.values[2]],
      ["ipw", result.values[3]],
      ["aipw", result.values[4]],
    ])
      assert.equal(
        await page.locator(`#overlap-${key}`).innerText(),
        value.toFixed(2),
      );
    assert.equal(await overlap.locator("svg").count(), 1);
    for (const [a, arm] of arms.entries()) {
      const bars = await overlap
        .locator(`[data-arm="${a}"] rect title`)
        .allTextContents();
      assert.equal(bars.length, 10);
      arm.bins.forEach((count, i) =>
        assert.match(bars[i], new RegExp(`: ${count} people`)),
      );
      const cells = await page
        .locator(`#overlap-weight-summary td:nth-child(${a + 2})`)
        .allTextContents();
      assert.deepEqual(cells, [
        arm.count.toLocaleString("en-US"),
        `${arm.clipped} (${((100 * arm.clipped) / arm.count).toFixed(1)}%)`,
        arm.ess.toFixed(0),
      ]);
    }
    assert.equal(
      await overlap.locator(".overlap-truth strong").innerText(),
      "2.00",
    );
  }
  const strongOverlap = await overlapView();
  await page.locator("#reset").click();
  assert.deepEqual(await overlapView(), strongOverlap);
  assert.deepEqual(await simulationView(), beforeHelp);
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await details.locator("summary").tap();
    await details.locator("summary").tap();
    assert.deepEqual(await overlapView(), strongOverlap);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Page overflow at ${width}px`,
    );
    assert.ok(
      await overlap.evaluate((el) => el.scrollWidth <= el.clientWidth),
      `Experiment overflow at ${width}px`,
    );
    await page.screenshot({
      path: `/tmp/causal-sandbox-overlap-${width}.png`,
      fullPage: true,
    });
    await overlap.screenshot({ path: `/tmp/causal-overlap-card-${width}.png` });
    const lightFill = await overlap
      .locator("rect")
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    await page.getByLabel("Color theme").selectOption("dark");
    assert.deepEqual(await overlapView(), strongOverlap);
    assert.notEqual(
      await overlap
        .locator("rect")
        .first()
        .evaluate((el) => getComputedStyle(el).fill),
      lightFill,
    );
    await overlap.screenshot({
      path: `/tmp/causal-overlap-card-${width}-dark.png`,
    });
    await page.getByLabel("Color theme").selectOption("system");
  }
  await page.locator("#overlap-restart").click();
  assert.deepEqual(await overlapView(), baselineOverlap);
  assert.deepEqual(await simulationView(), beforeHelp);
  // On a laptop all five main estimates are above the fold, ahead of model controls.
  for (const [width, height] of [
    [1280, 800],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    const results = await page.locator("#effects").boundingBox();
    const controls = await page.locator(".adjust-row").boundingBox();
    const clouds = await page.locator(".data").boundingBox();
    assert.ok(
      results.y + results.height < height,
      "All estimates should fit above the fold",
    );
    assert.ok(
      results.y + results.height <= controls.y,
      "Estimates precede analysis controls",
    );
    assert.ok(results.y < clouds.y, "Estimates precede outcome clouds");
    await page.screenshot({ path: `/tmp/causal-results-first-${width}.png` });
  }
  await page.locator(".lessons-link").click();
  await page.locator("#continue").waitFor();
  await page.goBack();
  await page.locator("#effects").waitFor();
  assert.deepEqual(await simulationView(), beforeHelp);
  assert.deepEqual(await overlapView(), baselineOverlap);
  // Time the complete synchronous slider update, including estimation and rendering.
  await page.locator('input[value="C"]').check();
  await page.locator("#world-select").selectOption("both");
  await page.locator("#outcome-model").selectOption("interaction");
  await page.locator("#treatment-model").selectOption("interaction");
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
