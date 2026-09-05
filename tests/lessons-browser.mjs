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
  assert.equal(await page.locator("#selection").isChecked(), false);
  assert.match(
    await page.locator("#lesson-graph svg").getAttribute("aria-label"),
    /health causes outcome\./,
  );
  await page.locator("#selection").check();
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
  await page.keyboard.press("Space");
  assert.equal(await page.locator("#adjustment").isChecked(), true);
  assert.ok(
    Math.abs(Number(await page.locator("#ipw").innerText()) - 2) < 0.15,
  );
  const weighted = await result();
  await page.locator(".lesson-explanation summary").click();
  assert.equal(await result(), weighted);
  await page.locator("#back").click();
  assert.equal(await result(), second);
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
  await page.locator("#continue").tap();
  const fifth = await result();
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
  // Each causal-role lesson starts from valid baseline adjustment.
  const roleBaselines = [];
  await page.locator("#outcome-quadratic").uncheck();
  await page.locator("#treatment-quadratic").uncheck();
  for (const level of [7, 8]) {
    await page.locator("#continue").click();
    const baseline = await result();
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
    await page.locator("#post-adjustment").focus();
    await page.keyboard.press("Space");
    assert.equal(await page.locator("#post-adjustment").isChecked(), true);
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
  await page.locator("#back").click();
  assert.equal(await result(), roleBaselines[0][1]);
  await page.goBack();
  assert.equal(await result(), roleBaselines[1][1]);
  await page.goForward();
  assert.equal(await result(), roleBaselines[0][1]);
  await page.locator("#back").click();
  assert.equal(await result(), sixth);
  await page.locator("#back").click();
  assert.equal(await result(), fifth);
  await page.locator("#back").click();
  assert.equal(await result(), fourth);
  await page.goBack();
  assert.equal(await result(), fifth);
  await page.goForward();
  assert.equal(await result(), fourth);
  await page.locator(".lesson-nav summary").tap();
  await page
    .getByRole("link", { name: "A randomized experiment", exact: true })
    .tap();
  assert.equal(await result(), first);
  await page.getByRole("link", { name: "Open full sandbox" }).click();
  await page.locator("#world-select").selectOption("both");
  await page.locator('input[value="K"]').check();
  await page.getByRole("link", { name: "Start the lessons" }).click();
  assert.equal(await result(), first);
  assert.equal(await page.locator("input").count(), 1);
  for (const [level, expected] of [
    [4, fourth],
    [5, fifth],
    [6, sixth],
    ...roleBaselines,
  ]) {
    await page.goto(`${url}?level=${level}`);
    assert.equal(await result(), expected);
  }
  assert.deepEqual(errors, []);
  console.log(
    "Lesson navigation, baseline resets, help, keyboard and mobile checks passed.",
  );
} finally {
  await browser.close();
}
