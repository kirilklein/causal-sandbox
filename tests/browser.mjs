import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { defaults, makeNoise, simulate, estimate } from "../src/simulation.js";
import { scenarios, scenarioState } from "../src/sandbox-scenarios.js";
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
  const sourceFooter = page.locator(".site-footer");
  assert.match(await sourceFooter.innerText(), /Created by Kiril Klein, PhD/);
  assert.equal(
    await sourceFooter
      .getByRole("link", { name: "GitHub source" })
      .getAttribute("href"),
    "https://github.com/kirilklein/causal-sandbox",
  );
  assert.equal(
    await sourceFooter
      .getByRole("link", { name: "Methodology notes" })
      .getAttribute("href"),
    "https://github.com/kirilklein/causal-sandbox#the-causal-world",
  );
  const references = sourceFooter.locator(".site-references");
  assert.equal(await references.getAttribute("open"), null);
  assert.equal(await references.locator("li").count(), 10);
  assert.ok(
    await references
      .locator("li")
      .evaluateAll((items) =>
        items.every(
          (item) =>
            item.querySelectorAll("a").length === 1 &&
            item.querySelector("a").href.startsWith("http"),
        ),
      ),
  );
  await page.locator(".data summary").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#population")
      .getAttribute("aria-label")
      .startsWith("Outcome clouds"),
  );
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
    /world-description/,
  );
  assert.equal(await page.locator(".analyst .adjust-option").count(), 0);
  assert.equal(await page.locator(".estimates .adjust-option").count(), 3);
  assert.equal(await page.locator(".world [data-graph-variable]").count(), 4);
  const adjustmentBounds = await page.locator(".adjust-row").boundingBox();
  const chartBounds = await page.locator("#effects").boundingBox();
  assert.ok(adjustmentBounds.y + adjustmentBounds.height <= chartBounds.y);
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
  assert.deepEqual(adjustedStyles.slice(0, 1), unadjustedStyles.slice(0, 1));
  assert.ok(
    adjustedStyles
      .slice(1)
      .every(
        (style, i) =>
          style.tint < unadjustedStyles[i + 1].tint &&
          style.mark !== unadjustedStyles[i + 1].mark,
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
  assert.ok((await page.locator(".glossary dd").count()) >= definitions.size);
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
  const selectScenario = async (id) => {
    await page.locator("#scenario-select").selectOption(id);
    assert.equal(
      await page.locator("#scenario-status").innerText(),
      "Starting setup",
    );
  };
  const worldTab = () => page.getByRole("tab", { name: "World" }).click();
  const analysisTab = () => page.getByRole("tab", { name: "Analysis" }).click();
  const graphView = async () => {
    await worldTab();
    if (!(await page.locator(".graph-details").evaluate((el) => el.open)))
      await page.locator(".graph-details > summary").click();
  };
  const setArrow = async (key, value) => {
    await page.locator(`[data-param="${key}"]`).evaluate((el, value) => {
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  };
  const startingMarks = () =>
    page
      .locator(".starting-dot")
      .evaluateAll((els) => els.map((el) => [el.style.left, el.title]));
  const axis = await page.locator(".chart-axis").innerText();
  const originalMarks = await startingMarks();
  await page.locator('input[value="C"]').check();
  assert.ok(Math.abs((await values())[3] - 2) < 0.15);
  assert.equal(await page.locator("#scenario-status").innerText(), "Modified");
  assert.deepEqual(await startingMarks(), originalMarks);
  await page.locator('input[value="C"]').uncheck();
  assert.equal(
    await page.locator("#scenario-status").innerText(),
    "Starting setup",
  );
  await page.locator('input[value="C"]').check();
  await graphView();
  const beforeGraphChanges = await simulationView();
  const statusBeforeGraphChanges = await page
    .locator("#scenario-status")
    .innerText();
  for (const variable of ["C", "M", "K", "U"]) {
    const toggle = page.locator(`[data-graph-variable="${variable}"]`);
    const before = await toggle.getAttribute("aria-pressed");
    await toggle.click();
    assert.notEqual(await toggle.getAttribute("aria-pressed"), before);
    assert.deepEqual(await simulationView(), beforeGraphChanges);
    assert.equal(
      await page.locator("#scenario-status").innerText(),
      statusBeforeGraphChanges,
    );
    assert.equal(await page.locator('input[value="C"]').isChecked(), true);
    assert.equal(await page.locator('input[value="C"]').isDisabled(), false);
    assert.equal(
      await page
        .locator(`#nodes [data-node="${variable}"]`)
        .getAttribute("opacity"),
      before === "true" ? "0.12" : "1",
    );
  }
  // C stays adjustable while faded, and only adjustment changes its estimates.
  await page.locator('input[value="C"]').uncheck();
  assert.ok((await values())[3] > 3);
  await page.locator('input[value="C"]').check();
  assert.ok(Math.abs((await values())[3] - 2) < 0.15);

  // Every entry resets the complete experiment, even after unrelated changes.
  for (const scenario of scenarios.filter((s) => s.id !== "overlap")) {
    await selectScenario("both-models");
    await page.locator("#outcome-model").selectOption("interaction");
    await graphView();
    await page.locator('[data-graph-variable="M"]').click();
    await setArrow("direct", 4);
    await setArrow("ua", 3);
    await selectScenario(scenario.id);
    const expected = scenarioState(scenario);
    const result = estimate(
      simulate(expected.p, makeNoise(), expected.world),
      [...expected.adjust],
      expected.models,
    );
    assert.deepEqual(
      await values(),
      [0, 2, 3, 4].map((i) => Number(result.values[i].toFixed(2))),
    );
    assert.equal(
      await page.locator("#world-select").inputValue(),
      expected.world.id,
    );
    for (const model of ["outcome", "treatment"])
      assert.equal(
        await page.locator(`#${model}-model`).inputValue(),
        expected.models[model] ? "interaction" : "main",
      );
    for (const variable of ["C", "M", "K"]) {
      assert.equal(
        await page.locator(`input[value="${variable}"]`).isChecked(),
        expected.adjust.has(variable),
      );
      assert.equal(
        await page
          .locator(`[data-graph-variable="${variable}"]`)
          .getAttribute("aria-pressed"),
        "true",
      );
    }
    assert.equal(
      await page.locator(".path-controls").evaluate((el) => el.open),
      scenario.id === "mediator",
    );
    assert.equal(
      await page.locator(".hidden-controls").evaluate((el) => el.open),
      scenario.id === "hidden",
    );
    const baseline = await values();
    await setArrow("direct", -1);
    await page.locator("#reset").click();
    assert.deepEqual(await values(), baseline);
    assert.equal(
      await page.locator("#scenario-status").innerText(),
      "Starting setup",
    );
    assert.equal(new URL(page.url()).searchParams.get("scenario"), scenario.id);
  }

  // Double robustness: repairing either model changes only the methods using it.
  await selectScenario("both-models");
  const bothSimple = await values();
  assert.ok(bothSimple.slice(1).every((v) => v > 3));
  await page.locator("#outcome-model").selectOption("interaction");
  const outcomeOnly = await values();
  assert.ok(Math.abs(outcomeOnly[1] - 2) < 0.2);
  assert.ok(Math.abs(outcomeOnly[3] - 2) < 0.2);
  assert.equal(outcomeOnly[2], bothSimple[2]);
  await page.locator("#outcome-model").selectOption("main");
  await page.locator("#treatment-model").selectOption("interaction");
  const treatmentOnly = await values();
  assert.equal(treatmentOnly[1], bothSimple[1]);
  assert.ok(Math.abs(treatmentOnly[2] - 2) < 0.2);
  assert.ok(Math.abs(treatmentOnly[3] - 2) < 0.2);
  await graphView();
  await page.locator('[data-graph-variable="C"]').click();
  for (const model of ["outcome", "treatment"])
    assert.equal(await page.locator(`#${model}-model`).isDisabled(), false);
  await page.locator('input[value="C"]').uncheck();
  assert.equal(await page.locator("#treatment-model").isDisabled(), true);
  await page.locator('input[value="C"]').check();
  assert.equal(
    await page.locator("#treatment-model").inputValue(),
    "interaction",
  );
  await worldTab();
  await page.locator("#world-select").selectOption("outcome");
  await setArrow("cy", 0);
  assert.match(
    await page.locator("#world-description").innerText(),
    /inactive because C → Y is 0/,
  );
  await page.locator("#world-select").selectOption("both");
  await setArrow("ca", 0);
  assert.match(
    await page.locator("#world-description").innerText(),
    /C → A is 0/,
  );
  assert.match(
    await page.locator("#world-description").innerText(),
    /C → Y is 0/,
  );

  // Fixed error scale and explicit overflow retain meaning at supported extremes.
  await selectScenario("randomized");
  const randomMarks = await startingMarks();
  for (const key of ["ca", "cy", "ua", "uy"]) await setArrow(key, 3);
  assert.deepEqual(await startingMarks(), randomMarks);
  assert.equal(await page.locator(".chart-axis").innerText(), axis);
  assert.ok((await page.locator(".estimate-dot.off-scale").count()) > 0);
  assert.ok((await values()).every(Number.isFinite));
  assert.ok(
    await page
      .locator(".estimate-dot")
      .evaluateAll((els) =>
        els.every(
          (el) =>
            parseFloat(el.style.left) >= 0 && parseFloat(el.style.left) <= 100,
        ),
      ),
  );
  await page.locator(".hidden-controls summary").click();
  await page.locator('[data-param="ua"]').focus();
  await page.keyboard.press("Home");
  assert.equal(await page.locator('[data-param="ua"]').inputValue(), "0");
  await page.keyboard.press("End");
  assert.equal(await page.locator('[data-param="ua"]').inputValue(), "3");
  const beforeDiagram = await simulationView();
  await page.locator('[data-graph-variable="U"]').click();
  assert.deepEqual(await simulationView(), beforeDiagram);
  assert.equal(
    await page
      .locator('[data-graph-variable="U"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.locator(".path-controls summary").click();
  for (const key of ["am", "my"]) await setArrow(key, 2);
  await setArrow("direct", 4);
  assert.equal(await page.locator("#truth-value").innerText(), "8.00");

  // Tab switching is keyboard accessible and changes only presentation.
  const beforeTabs = await simulationView();
  await page.getByRole("tab", { name: "World" }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page
      .getByRole("tab", { name: "Analysis" })
      .getAttribute("aria-selected"),
    "true",
  );
  assert.equal(await page.locator("#world-panel").isVisible(), false);
  await page.keyboard.press("Home");
  assert.equal(
    await page
      .getByRole("tab", { name: "World" })
      .getAttribute("aria-selected"),
    "true",
  );
  assert.deepEqual(await simulationView(), beforeTabs);

  // Overlap has its own state, visible only when selected; the shared reset has one scope.
  const overlap = page.locator("#overlap-experiment");
  const overlapView = () =>
    overlap.evaluate((el) => ({
      strength: el.querySelector("input").value,
      estimates: el.querySelector(".overlap-estimates").textContent,
      histogram: el.querySelector("svg").getAttribute("aria-label"),
      weights: el.querySelector("tbody").textContent,
    }));
  const mainBeforeOverlap = await simulationView();
  await selectScenario("overlap");
  assert.equal(await page.locator(".workspace").isVisible(), false);
  assert.equal(await overlap.isVisible(), true);
  const baselineOverlap = await overlapView();
  await page.locator("#overlap-weight-details summary").click();
  for (const strength of [0, 3]) {
    await page.locator("#overlap-strength").focus();
    await page.keyboard.press(strength ? "End" : "Home");
    assert.deepEqual(await simulationView(), mainBeforeOverlap);
    const data = simulate(
      { ...defaults, ca: strength, am: 0, my: 0 },
      makeNoise(),
    );
    const result = estimate(data, ["C"]);
    const arms = sandboxOverlap(data, result);
    for (const [key, i] of [
      ["regression", 2],
      ["ipw", 3],
      ["aipw", 4],
    ])
      assert.equal(
        await page.locator(`#overlap-${key}`).innerText(),
        result.values[i].toFixed(2),
      );
    for (const [a, arm] of arms.entries()) {
      const bars = await overlap
        .locator(`[data-arm="${a}"] rect title`)
        .allTextContents();
      assert.equal(bars.length, 10);
      arm.bins.forEach((count, i) =>
        assert.match(bars[i], new RegExp(`: ${count} people`)),
      );
      assert.deepEqual(
        await page
          .locator(`#overlap-weight-summary td:nth-child(${a + 2})`)
          .allTextContents(),
        [
          arm.count.toLocaleString("en-US"),
          `${arm.clipped} (${((100 * arm.clipped) / arm.count).toFixed(1)}%)`,
          arm.ess.toFixed(0),
        ],
      );
    }
  }
  assert.equal(await page.locator("#scenario-status").innerText(), "Modified");
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await overlap.evaluate((el) => el.scrollWidth <= el.clientWidth));
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await page.locator("#reset").click();
  assert.deepEqual(await overlapView(), baselineOverlap);
  assert.equal(
    await page.locator("#scenario-status").innerText(),
    "Starting setup",
  );

  const overlapLink = await page.locator("#scenario-link").getAttribute("href");
  await page.goto(overlapLink);
  await page.locator("#overlap-strength").waitFor();
  await selectScenario("observed");
  await page.locator('.help-button[popovertarget="help-ipw"]').hover();
  await page.locator("#help-ipw").waitFor({ state: "visible" });
  await page.keyboard.press("Escape");

  // Starting links survive reload; unknown scenario IDs fall back to observed confounding.
  await selectScenario("outcome-model");
  const linkedValues = await values();
  await page.locator("#outcome-model").selectOption("interaction");
  await page.locator("#scenario-link").click();
  await page.locator(".effect-row").last().waitFor();
  assert.deepEqual(await values(), linkedValues);
  assert.equal(await page.locator("#outcome-model").inputValue(), "main");
  const invalid = new URL(page.url());
  invalid.searchParams.set("scenario", "unknown");
  await page.goto(invalid.href);
  await page.locator(".effect-row").last().waitFor();
  assert.equal(await page.locator("#scenario-select").inputValue(), "observed");

  // Cards align; selectors align; narrow charts retain usable width and tab navigation.
  for (const [width, height] of [
    [1440, 1000],
    [1280, 900],
    [1024, 768],
    [768, 1024],
    [390, 844],
    [320, 740],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => scrollTo(0, 0));
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow at ${width}px`,
    );
    const track = await page.locator(".effect-track").first().boundingBox();
    assert.ok(
      track.width >= (width <= 600 ? 180 : 80),
      `Chart too narrow at ${width}px: ${track.width}`,
    );
    const modelFont = await page
      .locator("#outcome-model")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    assert.ok(modelFont >= 14);
    if (width > 1200) {
      const outcome = await page.locator("#outcome-model").boundingBox();
      const treatment = await page.locator("#treatment-model").boundingBox();
      assert.equal(outcome.y, treatment.y);
    }
    if (width > 1000) {
      const analyst = await page.locator("#analyst-panel").boundingBox();
      const result = await page.locator("#results-panel").boundingBox();
      assert.equal(analyst.y, result.y);
    } else {
      await page.locator(".results-jump").click();
      const result = await page.locator("#results-panel").boundingBox();
      assert.ok(
        result.y >= 60 && result.y < height,
        "Jump target must clear the sticky navigation",
      );
      await worldTab();
      const world = await page.locator("#world-panel").boundingBox();
      assert.ok(
        world.y >= 60 && world.y < height,
        "Sticky tabs should bring their controls into view",
      );
      await analysisTab();
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `/tmp/causal-scenarios-${width}.png`,
      fullPage: true,
    });
  }
  const colliderHelp = page.locator(
    '.help-button[popovertarget="help-collider"]',
  );
  await colliderHelp.tap();
  const helpBounds = await page.locator("#help-collider").boundingBox();
  assert.ok(helpBounds.x >= 0 && helpBounds.x + helpBounds.width <= 320);
  assert.ok(helpBounds.y >= 0 && helpBounds.y + helpBounds.height <= 740);
  await page.locator("#help-collider .close-help").tap();
  await page.getByLabel("Color theme").selectOption("dark");
  await page.screenshot({
    path: "/tmp/causal-scenarios-dark.png",
    fullPage: true,
  });
  await page.locator(".lessons-link").click();
  await page.locator("#continue").waitFor();
  await page.goBack();
  await page.locator("#effects").waitFor();
  assert.equal(await page.locator("#scenario-select").inputValue(), "observed");
  assert.deepEqual(errors, []);
  console.log(
    "Scenario resets, model comparisons, help, keyboard, overlap and responsive layouts passed.",
  );
} finally {
  await browser.close();
}
