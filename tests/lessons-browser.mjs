import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.locator("#unadjusted").waitFor();
  const result = () => page.locator(".lesson-results").innerText();
  const first = await result();
  assert.equal(await page.locator(".lesson-result:visible").count(), 2);
  assert.deepEqual(
    await page.locator("#lesson-graph svg text").allTextContents(),
    ["Treatment (A)", "Outcome (Y)"],
  );
  assert.equal(await page.locator("input").count(), 1);
  await page.locator(".lesson-explanation summary").focus();
  await page.keyboard.press("Enter");
  assert.equal(await result(), first);
  await page.locator("#effect").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#known-effect").innerText(), "2.10");
  await page.locator("#effect").fill("0");
  assert.match(
    await page.locator("#lesson-graph svg").getAttribute("aria-label"),
    /no effect/,
  );
  assert.equal(await page.locator("#lesson-graph g path").count(), 0);
  await page.locator("#redraw").click();
  assert.match(await page.locator("#sample-label").innerText(), /4218/);
  await page.locator("#restart").click();
  assert.equal(await result(), first);
  assert.equal(
    await page.locator("h1").evaluate((el) => el === document.activeElement),
    true,
  );
  await page.screenshot({
    path: "/tmp/causal-lesson-desktop.png",
    fullPage: true,
  });
  await page.locator("#continue").click();
  const second = await result();
  assert.equal(await page.locator("#selection").inputValue(), "0");
  assert.match(
    await page.locator("#lesson-graph svg").getAttribute("aria-label"),
    /health causes outcome\./,
  );
  const selection = page.getByRole("slider", {
    name: "Baseline health’s influence on treatment",
  });
  await selection.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await selection.inputValue(), "0.1");
  assert.equal(await page.locator("#selection-output").innerText(), "0.1");
  assert.match(await page.locator("#sample-label").innerText(), /4217/);
  await selection.fill("0.6");
  const intermediate = await result();
  assert.equal(await page.locator("#known-effect").innerText(), "2.00");
  await page.locator(".lesson-explanation summary").click();
  assert.equal(await result(), intermediate);
  await selection.fill("0");
  assert.equal(await result(), second);
  await selection.fill("1.2");
  const selected = await result();
  await page.locator("#redraw").click();
  assert.equal(await selection.inputValue(), "1.2");
  assert.match(await page.locator("#sample-label").innerText(), /4218/);
  await page.locator("#restart").click();
  assert.equal(await selection.inputValue(), "0");
  assert.equal(await page.locator("#selection-output").innerText(), "0.0");
  assert.equal(await result(), second);
  await page.setViewportSize({ width: 320, height: 740 });
  await selection.tap();
  assert.ok(Number(await selection.inputValue()) > 0);
  assert.equal(await page.locator("#known-effect").innerText(), "2.00");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/causal-confounding-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await selection.fill("1.2");
  assert.equal(await result(), selected);
  await page.screenshot({
    path: "/tmp/causal-confounding-desktop.png",
    fullPage: true,
  });
  assert.ok(Number(await page.locator("#unadjusted").innerText()) > 3);
  assert.equal(await page.locator("#ipw-result").isVisible(), false);
  await page.locator("#continue").click();
  const third = await result();
  assert.equal(await page.locator("#balance").isVisible(), false);
  await page.locator("#reveal-ipw").click();
  assert.equal(await page.locator("#adjustment").isChecked(), false);
  assert.equal(
    await page.locator("#ipw").innerText(),
    await page.locator("#unadjusted").innerText(),
  );
  const unweightedGraph = await page
    .locator("#lesson-graph svg")
    .evaluate((el) => el.outerHTML);
  assert.match(
    await page.locator("#lesson-graph .sample-note").innerText(),
    /no adjustment/,
  );
  await page.keyboard.press("Space");
  assert.equal(await page.locator("#adjustment").isChecked(), true);
  assert.equal(
    await page.locator("#lesson-graph svg").evaluate((el) => el.outerHTML),
    unweightedGraph,
  );
  assert.match(
    await page.locator("#lesson-graph .sample-note").innerText(),
    /adjusting for C/,
  );
  assert.ok(
    Math.abs(Number(await page.locator("#ipw").innerText()) - 2) < 0.15,
  );
  const weighted = await result();
  await page.locator(".lesson-explanation summary").click();
  assert.equal(await result(), weighted);
  await page.locator("#back").click();
  assert.equal(await result(), second);
  assert.equal(await selection.inputValue(), "0");
  await page.goBack();
  assert.equal(await result(), third);
  assert.equal(await page.locator("#balance").isVisible(), false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#reveal-ipw").tap();
  await page.locator("#adjustment").tap();
  assert.equal(await page.locator("#adjustment").isChecked(), true);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/causal-lesson-mobile.png",
    fullPage: true,
  });
  // Level 4 compares the familiar estimates with outcome regression immediately.
  await page.locator("#continue").tap();
  const fourth = await result();
  assert.deepEqual(
    await page.locator(".lesson-result:visible span").allTextContents(),
    [
      "True total effect",
      "Unadjusted difference",
      "IPW estimate",
      "Outcome regression",
    ],
  );
  assert.equal(
    await page.locator("#reveal-regression, .familiar-result").count(),
    0,
  );
  assert.equal(await page.locator("#unadjusted").isVisible(), true);
  assert.ok(Number(await page.locator("#unadjusted").innerText()) > 3);
  assert.equal(await page.locator("#regression-explanation").isVisible(), true);
  assert.doesNotMatch(await page.locator(".learning").innerText(), /AIPW/);
  await page.locator(".lesson-details summary").tap();
  assert.equal(await result(), fourth);
  await page.locator(".lesson-explanation summary").focus();
  await page.keyboard.press("Enter");
  assert.equal(await result(), fourth);
  await page.locator("#redraw").tap();
  assert.notEqual(await result(), fourth);
  await page.locator("#restart").tap();
  assert.equal(await result(), fourth);
  assert.equal(await page.locator(".lesson-result:visible").count(), 4);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/causal-level-4-comparison-mobile.png",
    fullPage: true,
  });
  // Numeric IDs below are legacy identities; assertions check the new display order.
  // Each causal-role lesson starts from valid baseline adjustment.
  await page.setViewportSize({ width: 1280, height: 900 });
  const roleBaselines = [];
  for (const level of [7, 8]) {
    await page.locator("#continue").click();
    const baseline = await result();
    assert.doesNotMatch(await page.locator(".learning").textContent(), /AIPW/i);
    assert.match(
      await page.locator(".lesson-nav").innerText(),
      new RegExp(`Level ${level - 2} of 11`),
    );
    roleBaselines.push([level, baseline]);
    assert.equal(await page.locator(".lesson-result:visible").count(), 2);
    assert.equal(await page.locator("input").count(), 1);
    assert.equal(await page.locator("#post-adjustment").isChecked(), false);
    assert.equal(await page.locator("#model-weight-note").count(), 0);
    assert.equal(
      await page.locator("#known-effect").innerText(),
      level === 7 ? "3.00" : "2.00",
    );
    const graph = page.locator("#lesson-graph svg");
    assert.match(
      await graph.getAttribute("aria-label"),
      level === 7 ? /response, which causes outcome/ : /score causes neither/,
    );
    const paths = await graph
      .locator("g path")
      .evaluateAll((els) => els.map((el) => el.getAttribute("d")));
    const nodeAppearance = await graph
      .locator("rect")
      .evaluateAll((els) =>
        els.map((el) => [el.outerHTML, getComputedStyle(el).stroke]),
      );
    assert.ok(nodeAppearance.every(([, stroke]) => stroke === "none"));
    assert.match(
      await page.locator("#lesson-graph .sample-note").innerText(),
      /adjusting for C only/,
    );
    await page.locator("#post-adjustment").focus();
    await page.keyboard.press("Space");
    assert.equal(await page.locator("#post-adjustment").isChecked(), true);
    assert.deepEqual(
      await graph
        .locator("rect")
        .evaluateAll((els) =>
          els.map((el) => [el.outerHTML, getComputedStyle(el).stroke]),
        ),
      nodeAppearance,
    );
    assert.match(
      await page.locator("#lesson-graph .sample-note").innerText(),
      level === 7 ? /adjusting for C and M/ : /adjusting for C and K/,
    );
    assert.ok(
      Number(await page.locator("#regression").innerText()) <
        (level === 7 ? 2.2 : 0.7),
    );
    assert.deepEqual(
      await graph
        .locator("g path")
        .evaluateAll((els) => els.map((el) => el.getAttribute("d"))),
      paths,
    );
    const adjusted = await result();
    await page.locator(".lesson-explanation summary").click();
    await page.locator(".lesson-details summary").click();
    assert.equal(await result(), adjusted);
    await page.screenshot({
      path: `/tmp/causal-role-${level}-desktop.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#post-adjustment").tap();
    assert.equal(await result(), baseline);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: `/tmp/causal-role-${level}-mobile.png`,
      fullPage: true,
    });
    await page.locator("#redraw").tap();
    assert.match(await page.locator("#sample-label").innerText(), /4218/);
    await page.locator("#post-adjustment").tap();
    await page.locator("#restart").tap();
    assert.equal(await result(), baseline);
    assert.equal(await page.locator("#post-adjustment").isChecked(), false);
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  // One slider, a fixed graph, and constant adjustment for measured C.
  const eighth = await result();
  await page.locator("#post-adjustment").check();
  await page.locator("#continue").click();
  assert.equal(await page.locator("h1").innerText(), "A hidden common cause");
  assert.match(await page.locator(".lesson-nav").innerText(), /Level 7 of 11/);
  assert.equal(await page.locator(".lesson-result:visible").count(), 3);
  assert.equal(await page.locator('input[type="checkbox"]').count(), 0);
  assert.equal(await page.locator("input").count(), 1);
  const ninth = await result();
  assert.equal(await page.locator("#aipw").count(), 0);
  assert.doesNotMatch(await page.locator(".learning").textContent(), /AIPW/i);
  assert.equal(await page.locator("#hidden-strength").inputValue(), "0");
  const graphLabels = await page
    .locator("#lesson-graph svg text")
    .allTextContents();
  assert.deepEqual(graphLabels, [
    "Baseline health (C)",
    "Treatment (A)",
    "Outcome (Y)",
    "Smoking status (U)",
  ]);
  assert.match(
    await page.locator("#lesson-graph svg").getAttribute("aria-label"),
    /no influence/,
  );
  const sample = await page.locator("#sample-label").innerText();
  const positions = () =>
    page.evaluate(() =>
      ["#lesson-graph", "#hidden-strength", ".lesson-results"].map(
        (selector) => {
          const rect = document.querySelector(selector).getBoundingClientRect();
          return { top: rect.top + scrollY, height: rect.height };
        },
      ),
    );
  const initialPositions = await positions();
  await page.locator("#hidden-strength").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.locator("#hidden-strength-output").innerText(),
    "0.1",
  );
  await page.locator("#hidden-strength").fill("2");
  const strong = await result();
  assert.notEqual(strong, ninth);
  assert.equal(await page.locator("#known-effect").innerText(), "2.00");
  for (const method of ["ipw", "regression"])
    assert.ok(Number(await page.locator(`#${method}`).innerText()) > 2.7);
  assert.equal(await page.locator("#sample-label").innerText(), sample);
  assert.deepEqual(
    await page.locator("#lesson-graph svg text").allTextContents(),
    graphLabels,
  );
  assert.deepEqual(await positions(), initialPositions);
  assert.match(
    await page.locator("#lesson-graph svg").getAttribute("aria-label"),
    /also causes/,
  );
  await page.locator(".lesson-explanation summary").click();
  assert.equal(await result(), strong);
  await page.screenshot({
    path: "/tmp/causal-hidden-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobilePositions = await positions();
  await page.locator("#hidden-strength").tap();
  assert.notEqual(await page.locator("#hidden-strength").inputValue(), "2");
  await page.locator("#hidden-strength").fill("0");
  assert.equal(await result(), ninth);
  assert.deepEqual(await positions(), mobilePositions);
  await page.locator("#hidden-strength").fill("2");
  assert.equal(await result(), strong);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/causal-hidden-mobile.png",
    fullPage: true,
  });
  await page.locator("#redraw").tap();
  assert.notEqual(await result(), strong);
  await page.locator("#restart").tap();
  assert.equal(await result(), ninth);
  assert.equal(await page.locator("#hidden-strength").inputValue(), "0");
  await page.locator("#back").tap();
  assert.equal(await result(), eighth);
  await page.locator("#continue").tap();
  assert.equal(await result(), ninth);
  await page.goBack();
  assert.equal(await result(), eighth);
  await page.goForward();
  assert.equal(await result(), ninth);
  await page.locator(".lesson-nav summary").tap();
  await page
    .getByRole("link", { name: "A hidden common cause", exact: true })
    .tap();
  assert.equal(await result(), ninth);
  await page.getByRole("link", { name: "Open full sandbox" }).click();
  await page.locator("#world-select").selectOption("both");
  await page.locator('input[value="K"]').check();
  await page.goto(`${url}?level=9`);
  assert.equal(await result(), ninth);
  await page.locator("#continue").tap();
  const fifth = await result();
  assert.match(await page.locator(".lesson-nav").innerText(), /Level 8 of 11/);
  assert.doesNotMatch(
    await page.locator("#lesson-graph svg").textContent(),
    /Smoking|response|score/,
  );
  assert.match(
    await page.locator(".lesson-transition").innerText(),
    /remove the hidden cause/,
  );
  assert.doesNotMatch(await page.locator(".learning").innerText(), /AIPW/);
  assert.equal(
    await page.locator('input[name="model-experiment"]:checked').inputValue(),
    "simple",
  );
  assert.equal(await page.locator("#unadjusted").count(), 0);
  assert.equal(await page.locator("#aipw").count(), 0);
  await page
    .getByRole("radio", { name: "Simple relationships", exact: true })
    .focus();
  await page.keyboard.press("ArrowDown");
  assert.equal(
    await page
      .getByRole("radio", {
        name: "More complex outcome relationship",
        exact: true,
      })
      .isChecked(),
    true,
  );
  assert.equal(
    await page.locator("#model-preview-title").innerText(),
    "Expected outcome without treatment",
  );
  assert.match(
    await page.locator("#model-description").innerText(),
    /outcome missing the added pattern; treatment correctly specified/,
  );
  await page
    .getByRole("radio", {
      name: "More complex treatment assignment",
      exact: true,
    })
    .check();
  assert.match(
    await page.locator("#model-description").innerText(),
    /outcome correctly specified; treatment missing the added pattern/,
  );
  assert.match(
    await page.locator("#world-description").innerText(),
    /outcome relationship is simple again/,
  );
  assert.equal(
    await page.locator("#model-preview-title").innerText(),
    "Probability of receiving treatment",
  );
  assert.equal(
    await page.locator("#model-preview svg path[data-curve]").count(),
    2,
  );
  const treatmentExperiment = await result();
  const plotBeforeRedraw = await page
    .locator('[data-curve="fitted"]')
    .getAttribute("d");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/causal-model-failure-mobile.png",
    fullPage: true,
  });
  await page.locator("#redraw").tap();
  assert.notEqual(await result(), treatmentExperiment);
  assert.notEqual(
    await page.locator('[data-curve="fitted"]').getAttribute("d"),
    plotBeforeRedraw,
  );
  await page.locator("#restart").tap();
  assert.equal(await result(), fifth);
  await page
    .getByRole("radio", {
      name: "More complex treatment assignment",
      exact: true,
    })
    .check();
  await page.locator("#continue").tap();
  const sixth = await result();
  assert.match(await page.locator(".lesson-nav").innerText(), /Level 9 of 11/);
  assert.equal(await page.locator("#aipw-result").isVisible(), true);
  assert.equal(await page.locator("#outcome-quadratic").isChecked(), true);
  assert.equal(await page.locator("#treatment-quadratic").isChecked(), true);
  assert.equal(await page.locator(".lesson-controls button").count(), 0);
  const ipwBefore = await page.locator("#ipw").innerText();
  await page.locator("#outcome-quadratic").focus();
  await page.keyboard.press("Space");
  assert.equal(await page.locator("#ipw").innerText(), ipwBefore);
  assert.match(
    await page.locator("#robustness-note").innerText(),
    /Only the treatment model/,
  );
  assert.ok(
    Math.abs(Number(await page.locator("#aipw").innerText()) - 2) < 0.2,
  );
  const regressionBefore = await page.locator("#regression").innerText();
  await page.locator("#treatment-quadratic").tap();
  assert.equal(await page.locator("#regression").innerText(), regressionBefore);
  assert.match(
    await page.locator("#robustness-note").innerText(),
    /Both models miss/,
  );
  assert.ok(Number(await page.locator("#aipw").innerText()) > 3);
  await page.locator("#outcome-quadratic").tap();
  assert.match(
    await page.locator("#robustness-note").innerText(),
    /Only the outcome model/,
  );
  assert.ok(
    Math.abs(Number(await page.locator("#aipw").innerText()) - 2) < 0.2,
  );
  await page.locator("#treatment-quadratic").tap();
  assert.equal(await result(), sixth);
  const bothCorrect = await result();
  await page.locator(".lesson-explanation summary").tap();
  await page.locator(".lesson-details summary").tap();
  assert.equal(await result(), bothCorrect);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/causal-model-lesson-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: "/tmp/causal-model-lesson-desktop.png",
    fullPage: true,
  });
  await page.locator("#restart").click();
  assert.equal(await result(), sixth);
  assert.equal(await page.locator("#outcome-quadratic").isChecked(), true);
  assert.equal(await page.locator("#treatment-quadratic").isChecked(), true);
  // The optional revisit has its own baseline and never changes model comparisons.
  await page.locator("#outcome-quadratic").uncheck();
  await page.locator("#revisit-hidden").click();
  assert.match(
    await page.locator("h1").innerText(),
    /Revisit hidden confounding/,
  );
  assert.match(
    await page.locator(".lesson-nav").innerText(),
    /Level 9 of 11.*Optional revisit/,
  );
  assert.equal(await page.locator("#hidden-strength").inputValue(), "0");
  assert.equal(await page.locator("#aipw-result").isVisible(), true);
  const callbackBaseline = await result();
  await page.screenshot({
    path: "/tmp/causal-callback-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".lesson-explanation summary").tap();
  assert.equal(await result(), callbackBaseline);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/causal-callback-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator("#hidden-strength").fill("2");
  assert.ok(Number(await page.locator("#aipw").innerText()) > 2.7);
  await page.locator("#redraw").click();
  await page.locator("#restart").click();
  assert.equal(await result(), callbackBaseline);
  await page.locator("#hidden-strength").fill("2");
  await page.locator("#back").click();
  assert.equal(await result(), sixth);
  assert.equal(await page.locator("#outcome-quadratic").isChecked(), true);
  await page.goBack();
  assert.equal(await result(), callbackBaseline);
  await page.reload();
  assert.equal(await result(), callbackBaseline);
  await page.goForward();
  assert.equal(await result(), sixth);
  await page.locator("#revisit-hidden").click();
  await page.locator("#hidden-strength").fill("2");
  // Overlap removes U and restores both simple, correctly specified models.
  await page.locator("#continue").click();
  assert.match(await page.locator("h1").innerText(), /Too little overlap/);
  assert.match(await page.locator(".lesson-nav").innerText(), /Level 10 of 11/);
  const tenth = await result();
  const diagnostics = () => page.locator("#overlap-summary").innerText();
  const moderateDiagnostics = await diagnostics();
  assert.equal(await page.locator(".lesson-result:visible").count(), 4);
  assert.equal(await page.locator("#propensity-histogram rect").count(), 20);
  assert.equal(await page.locator("input").count(), 2);
  assert.match(
    await page.locator("#model-weight-note").innerText(),
    /No treatment/,
  );
  await page
    .getByRole("radio", { name: "Moderate selection", exact: true })
    .focus();
  await page.keyboard.press("ArrowDown");
  assert.equal(
    await page
      .getByRole("radio", { name: "Strong selection", exact: true })
      .isChecked(),
    true,
  );
  assert.notEqual(await diagnostics(), moderateDiagnostics);
  assert.match(await page.locator("#sample-label").innerText(), /4217/);
  assert.equal(await page.locator("#known-effect").innerText(), "2.00");
  assert.match(
    await page.locator("#model-weight-note").innerText(),
    /clipped.*IPW and AIPW/,
  );
  const strongOverlap = await result();
  const strongDiagnostics = await diagnostics();
  await page.locator(".overlap-details summary").focus();
  await page.keyboard.press("Enter");
  await page.locator(".lesson-explanation summary").click();
  assert.equal(await result(), strongOverlap);
  assert.equal(await diagnostics(), strongDiagnostics);
  await page.screenshot({
    path: "/tmp/causal-overlap-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("radio", { name: "Moderate selection", exact: true })
    .tap();
  assert.equal(await result(), tenth);
  assert.equal(await diagnostics(), moderateDiagnostics);
  await page
    .getByRole("radio", { name: "Strong selection", exact: true })
    .tap();
  assert.equal(await result(), strongOverlap);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/causal-overlap-mobile.png",
    fullPage: true,
  });
  await page.locator("#redraw").tap();
  assert.notEqual(await result(), strongOverlap);
  assert.notEqual(await diagnostics(), strongDiagnostics);
  await page.locator("#restart").tap();
  assert.equal(await result(), tenth);
  assert.equal(await diagnostics(), moderateDiagnostics);
  await page.locator("#back").tap();
  assert.equal(await result(), sixth);
  assert.equal(await page.locator("#propensity-histogram").count(), 0);
  await page.goBack();
  assert.equal(await result(), tenth);
  await page.goForward();
  assert.equal(await result(), sixth);
  await page.locator(".lesson-nav summary").tap();
  await page
    .getByRole("link", { name: "Too little overlap", exact: true })
    .tap();
  assert.equal(await result(), tenth);
  await page.getByRole("link", { name: "Explore the full sandbox" }).tap();
  await page.locator("#world-select").selectOption("both");
  await page.locator('input[value="K"]').check();
  await page.goto(`${url}?level=10`);
  assert.equal(await result(), tenth);
  assert.equal(await diagnostics(), moderateDiagnostics);
  for (const [id, expected, position] of [
    [4, fourth, 4],
    [5, fifth, 8],
    [6, sixth, 9],
    [7, roleBaselines[0][1], 5],
    [8, roleBaselines[1][1], 6],
    [9, ninth, 7],
  ]) {
    await page.goto(`${url}?level=${id}`);
    assert.equal(await result(), expected);
    assert.match(
      await page.locator(".lesson-nav").innerText(),
      new RegExp(`Level ${position} of 11`),
    );
  }
  // Contents and the forward journey agree, including after a sandbox visit.
  await page.getByRole("link", { name: "Open full sandbox" }).click();
  await page.locator("#world-select").selectOption("both");
  await page.locator('input[value="K"]').check();
  await page.getByRole("link", { name: "Start the lessons" }).click();
  assert.equal(await result(), first);
  const titles = [
    "A randomized experiment",
    "A common cause",
    "Adjustment with IPW",
    "Adjustment with an outcome model",
    "A mediator",
    "A collider",
    "A hidden common cause",
    "When a model is too simple",
    "Double robustness",
    "Too little overlap",
  ];
  assert.deepEqual(
    await page.locator(".lesson-nav ol a").allTextContents(),
    titles,
  );
  for (let i = 0; i < titles.length; i++) {
    assert.equal(await page.locator("h1").innerText(), titles[i]);
    assert.match(
      await page.locator(".lesson-nav").innerText(),
      new RegExp(`Level ${i + 1} of 11`),
    );
    if (i < 8)
      assert.doesNotMatch(
        await page.locator(".learning").textContent(),
        /AIPW/,
      );
    if (i < titles.length - 1) await page.locator("#continue").click();
  }
  assert.deepEqual(errors, []);
  console.log(
    "Lesson navigation, baseline resets, help, keyboard and mobile checks passed.",
  );
} finally {
  await browser.close();
}
