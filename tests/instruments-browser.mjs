import {
  launchBrowser,
  getAppUrl,
  collectPageErrors,
  stubGoatCounter,
} from "./browser-setup.mjs";
import assert from "node:assert/strict";
import {
  instrumentAdjustment,
  studySummary,
} from "../src/instrument-simulation.js";
import { studyRange } from "../src/instrument-study-view.js";
import { effectComparison } from "../src/effect-comparison.js";

const browser = await launchBrowser();
const url = getAppUrl();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    colorScheme: "light",
  });
  const errors = [];
  collectPageErrors(page, errors);
  await stubGoatCounter(page);
  await page.goto(`${url}?lesson=double-robustness`);
  await page
    .getByRole("link", { name: "Instruments and adjustment →" })
    .click();
  await page.locator("#ipw").filter({ hasText: /\d/ }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("lesson"), "instrument");
  const contents = page.getByRole("button", { name: "Contents" });
  assert.ok(await contents.isVisible());
  await contents.click();
  assert.ok(await page.locator("#lesson-menu").isVisible());
  assert.equal(
    await page.locator('.optional-menu a[aria-current="step"]').innerText(),
    "Instruments and adjustment",
  );
  await contents.click();
  assert.equal(
    await page.locator("#step").textContent(),
    "CAUSAL ROLES · 1 OF 2",
  );
  assert.ok(
    await page
      .getByRole("heading", { name: "What does Z change?" })
      .isVisible(),
  );
  const results = () => page.locator(".instrument-page .results").innerText();
  const initial = await results();
  const uptake = await page.locator("#uptake").innerText();
  const graph = await page.locator("#graph").innerHTML();
  const adjust = page.getByLabel("Also adjust for instrument Z");
  await adjust.focus();
  await page.keyboard.press("Space");
  const expected = instrumentAdjustment({ strength: 2.8 }).fits[1];
  assert.equal(
    await page.locator("#ipw").textContent(),
    expected.values[3].toFixed(3),
  );
  assert.equal(await page.locator("#uptake").innerText(), uptake);
  assert.equal(await page.locator("#graph").innerHTML(), graph);
  await page.keyboard.press("Space");
  assert.equal(await results(), initial);

  const instrumentSlider = page.getByLabel("Z → treatment strength");
  assert.equal(await instrumentSlider.inputValue(), "2.8");
  await instrumentSlider.focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await instrumentSlider.inputValue(), "2.7");
  assert.equal(await page.locator("#instrument-value").innerText(), "2.7");
  await instrumentSlider.fill("0");
  assert.match(
    await page.locator("#instrument-status").innerText(),
    /no effect on treatment/,
  );
  assert.match(
    await page.locator("#graph").getAttribute("aria-label"),
    /no effect on A/,
  );
  assert.equal(
    await page.locator("#ipw").innerText(),
    instrumentAdjustment({ strength: 0 }).fits[0].values[3].toFixed(3),
  );
  assert.notEqual(await page.locator("#uptake").innerText(), uptake);
  await page.locator("#repeat").click();
  await page.waitForFunction(() => {
    const dots = document.querySelectorAll(
      ".study-distributions > .study-method .study-row:first-of-type .study-dot",
    );
    return (
      dots.length === 200 &&
      Number(getComputedStyle(dots[0]).opacity) > 0 &&
      Number(getComputedStyle(dots[199]).opacity) === 0
    );
  });
  const plotBeforeReveal = await page
    .locator(".study-distributions > .study-method .study-dot")
    .evaluateAll((dots) =>
      dots.map((dot) => [dot.getAttribute("cx"), dot.getAttribute("cy")]),
    );
  const pairOpacity = await page
    .locator(".study-distributions > .study-method .study-cloud")
    .evaluateAll((clouds) =>
      clouds.map((cloud) =>
        [...cloud.querySelectorAll(".study-dot")].map(
          (dot) => getComputedStyle(dot).opacity,
        ),
      ),
    );
  assert.deepEqual(pairOpacity[0], pairOpacity[1]);
  assert.equal(await page.locator(".study-range").first().isVisible(), false);
  assert.equal(
    await page.locator("#study-results").getAttribute("aria-busy"),
    "true",
  );
  assert.equal(
    await page
      .locator("#study-progress")
      .evaluate((node) => getComputedStyle(node).clipPath),
    "inset(50%)",
  );
  await page.locator("#study-results").screenshot({
    path: "/tmp/instruments-dots-appearing.png",
    animations: "allow",
  });
  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .waitFor();
  assert.deepEqual(
    await page
      .locator(".study-distributions > .study-method .study-dot")
      .evaluateAll((dots) =>
        dots.map((dot) => [dot.getAttribute("cx"), dot.getAttribute("cy")]),
      ),
    plotBeforeReveal,
  );
  assert.equal(await page.locator(".study-range").first().isVisible(), true);
  assert.equal(
    await page.locator("#study-results").getAttribute("aria-busy"),
    "false",
  );
  assert.equal(await page.locator(".study-method:visible").count(), 1);
  assert.equal(
    await page.locator("#study-other-methods").getAttribute("open"),
    null,
  );
  assert.doesNotMatch(await page.locator("#study-results").innerText(), /RMSE/);

  const zeroValues = Array.from({ length: 3 }, () => [[], []]);
  for (let seed = 100; seed < 300; seed++) {
    instrumentAdjustment({ seed, strength: 0 }).fits.forEach((fit, j) => {
      [3, 2, 4].forEach((index, k) => zeroValues[k][j].push(fit.values[index]));
    });
  }
  assert.deepEqual(
    (await page.locator(".study-sd").allTextContents()).map((s) =>
      s.replace("SD ", ""),
    ),
    zeroValues.flatMap((pair) =>
      pair.map((values) => studySummary(values).sd.toFixed(3)),
    ),
  );
  assert.match(
    await page.locator("#study-results").innerText(),
    /strength 0.0/,
  );
  await instrumentSlider.fill("0.3");
  await page.locator("#repeat").click();
  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .waitFor();
  await page.getByLabel("Color theme").selectOption("dark");
  await page
    .locator("#study-results")
    .screenshot({ path: "/tmp/instruments-dots-weak-dark.png" });
  await page.getByLabel("Color theme").selectOption("light");
  await instrumentSlider.fill("1");
  assert.equal(await page.locator("#study-results").innerText(), "");
  assert.equal(
    await page.locator("#ipw").innerText(),
    instrumentAdjustment({ strength: 1 }).fits[0].values[3].toFixed(3),
  );
  await page.locator("#repeat").click();
  await page.locator("#study-results.studies-animating").waitFor();
  await instrumentSlider.fill("2.8");
  assert.equal(await page.locator("#study-results").innerText(), "");
  assert.equal(await page.locator("#study-progress").innerText(), "");
  assert.equal(await results(), initial);
  assert.equal(await page.locator("#uptake").innerText(), uptake);
  assert.ok(await page.locator("#repeat").isVisible());
  assert.equal(
    await page.locator("#repeat").evaluate((node) => node.closest("details")),
    null,
  );
  assert.equal(await page.locator("#study-reason").getAttribute("open"), null);
  assert.equal(await results(), initial);
  await page.locator("#repeat").focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .waitFor();
  assert.equal(await results(), initial);
  assert.match(
    await page.locator("#study-results").innerText(),
    /Seeds 100–299/,
  );
  assert.equal(await page.locator(".study-method").count(), 3);
  assert.equal(await page.locator("#study-means").getAttribute("open"), null);
  const expectedDots = Array.from({ length: 3 }, () => [[], []]);
  for (let seed = 100; seed < 300; seed++) {
    instrumentAdjustment({ seed, strength: 2.8 }).fits.forEach((fit, j) => {
      [3, 2, 4].forEach((index, k) =>
        expectedDots[k][j].push(fit.values[index]),
      );
    });
  }
  const clouds = page.locator(".study-cloud");
  assert.equal(await clouds.count(), 6);
  for (let i = 0; i < 6; i++) {
    const cloud = clouds.nth(i);
    const values = expectedDots.flat()[i];
    const actual = await cloud
      .locator(".study-dot")
      .evaluateAll((dots) => dots.map((dot) => Number(dot.dataset.estimate)));
    assert.equal(actual.length, values.length);
    actual.forEach((value, j) =>
      assert.ok(Math.abs(value - values[j]) < 1e-10),
    );
    const range = cloud.locator(".study-range");
    const endpoints = [
      Number(await range.getAttribute("data-low")),
      Number(await range.getAttribute("data-high")),
    ];
    const expectedRange = studyRange(values);
    endpoints.forEach((value, j) =>
      assert.ok(Math.abs(value - expectedRange[j]) < 1e-10),
    );
    assert.equal(await cloud.getAttribute("data-min"), "1.75");
    assert.equal(await cloud.getAttribute("data-max"), "2.25");
    assert.equal(await cloud.locator(".study-truth").getAttribute("x1"), "50%");
    const dots = await cloud.locator(".study-dot").evaluateAll((nodes) =>
      nodes.map((n) => ({
        x: parseFloat(n.getAttribute("cx")),
        value: Number(n.dataset.estimate),
      })),
    );
    for (const dot of dots) {
      assert.ok(Math.abs(dot.x - (4 + (92 * (dot.value - 1.75)) / 0.5)) < 1e-9);
      assert.ok(dot.x >= 4 && dot.x <= 96);
    }
  }
  await page
    .locator("#study-results")
    .screenshot({ path: "/tmp/instruments-sd-desktop.png" });
  await page
    .locator("#study-detail")
    .screenshot({ path: "/tmp/instruments-flow-desktop.png" });
  const compareMethods = page.locator("#study-other-methods summary");
  await compareMethods.focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".study-method:visible").count(), 3);
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".study-method:visible").count(), 1);
  const studyResult = await page.locator("#study-results").innerText();
  await page.getByLabel("Color theme").selectOption("dark");
  assert.equal(await results(), initial);
  assert.equal(await page.locator("#study-results").innerText(), studyResult);
  await page
    .locator("#study-results")
    .screenshot({ path: "/tmp/instruments-sd-dark.png" });
  await page.getByLabel("Color theme").selectOption("light");
  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .click();
  await page.waitForFunction(() =>
    document
      .querySelector("#study-results")
      .textContent.includes("Seeds 300–499"),
  );
  await page.waitForFunction(() => !document.querySelector("#repeat").disabled);
  await page.setViewportSize({ width: 320, height: 850 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page
    .locator("#study-results")
    .screenshot({ path: "/tmp/instruments-sd-mobile.png" });
  await page
    .locator("#study-detail")
    .screenshot({ path: "/tmp/instruments-flow-mobile.png" });
  await page.locator("#study-means summary").click();
  assert.match(await page.locator("#study-means").innerText(), /Mean estimate/);

  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restart section", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Run 200 studies", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .waitFor();
  assert.match(
    await page.locator("#study-results").innerText(),
    /Seeds 100–299/,
  );
  assert.equal(await results(), initial);

  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .click();
  await page
    .getByRole("link", {
      name: "What happens when there is hidden confounding?",
    })
    .click();
  await page.locator("#paired-values td").first().waitFor();
  assert.equal(
    new URL(page.url()).searchParams.get("lesson"),
    "instrument-hidden-confounding",
  );
  assert.equal(await page.locator("#study-results").innerText(), "");
  assert.equal(await adjust.isVisible(), false);
  assert.equal(await instrumentSlider.isVisible(), false);
  assert.ok(await page.locator("#hidden-node").isVisible());
  const slider = page.getByLabel("Hidden confounding strength");
  const paired = () => page.locator("#paired-results").innerText();
  assert.equal(await slider.inputValue(), "0");
  const baseline = await paired();
  const assertFits = async (hidden, seed = 4217) => {
    const { fits } = instrumentAdjustment({ hidden, seed });
    const expected = [3, 2, 4].flatMap((index) =>
      fits.map((f) => f.values[index].toFixed(3)),
    );
    assert.deepEqual(
      await page.locator("#paired-values .estimate-value").allTextContents(),
      expected,
    );
  };
  const assertColors = async (hidden) => {
    const { fits } = instrumentAdjustment({ hidden });
    const cells = await page
      .locator("#paired-values .comparison-value")
      .evaluateAll((nodes) =>
        nodes.map((n) => ({
          tint: parseFloat(n.style.getPropertyValue("--error-tint")),
          extra: parseFloat(n.style.getPropertyValue("--extra-width")),
          background: getComputedStyle(n).backgroundColor,
        })),
      );
    [3, 2, 4].forEach((index, k) =>
      fits.forEach((f, j) => {
        const error = Math.abs(f.values[index] - 2);
        const other = Math.abs(fits[1 - j].values[index] - 2);
        assert.ok(
          Math.abs(
            cells[2 * k + j].tint - effectComparison(f.values[index], 2).tint,
          ) < 1e-9,
        );
        assert.ok(
          Math.abs(
            cells[2 * k + j].extra -
              Math.min(Math.max(0, error - other) / 0.5, 1) * 100,
          ) < 1e-9,
        );
        assert.notEqual(cells[2 * k + j].background, "rgba(0, 0, 0, 0)");
      }),
    );
  };
  await assertFits(0);
  await assertColors(0);
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await slider.inputValue(), "0.1");
  await assertFits(0.1);
  await slider.fill("1");
  await assertFits(1);
  await assertColors(1);
  assert.notEqual(
    await slider.evaluate((node) => getComputedStyle(node).backgroundImage),
    "none",
  );
  assert.notEqual(await paired(), baseline);
  const hiddenResults = await paired();
  const sample = await page.locator("#sample").innerText();
  await page.locator("#detail-title").click();
  assert.equal(await paired(), hiddenResults);
  await page.getByLabel("Color theme").selectOption("dark");
  assert.equal(await paired(), hiddenResults);
  await assertColors(1);
  await page
    .getByRole("button", { name: "Run 200 studies", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .waitFor();
  assert.equal(await paired(), hiddenResults);
  assert.match(
    await page.locator("#bias-comparison").innerText(),
    /Strength: 1.0/,
  );
  assert.equal(await page.locator(".bias-method").count(), 3);
  const meanValues = await page.locator(".bias-method td").allTextContents();
  const meanFits = [
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let seed = 100; seed < 300; seed++) {
    instrumentAdjustment({ seed, hidden: 1 }).fits.forEach((f, j) =>
      [3, 2, 4].forEach(
        (index, k) => (meanFits[j][k] += f.values[index] / 200),
      ),
    );
  }
  for (let k = 0; k < 3; k++) {
    for (let j = 0; j < 2; j++) {
      assert.equal(meanValues[k * 4 + j * 2], meanFits[j][k].toFixed(3));
      assert.equal(
        Number(meanValues[k * 4 + j * 2 + 1]),
        Number((meanFits[j][k] - 2).toFixed(3)),
      );
    }
  }
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page
    .locator("#paired-results")
    .screenshot({ path: "/tmp/instrument-bias-mobile-dark.png" });
  await page
    .locator("#bias-comparison")
    .screenshot({ path: "/tmp/instrument-bias-studies-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.getByLabel("Color theme").selectOption("light");
  await page
    .locator(".panel")
    .screenshot({ path: "/tmp/instrument-bias-desktop.png" });

  // A new strength cancels an old batch and clears completed results.
  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .click();
  await slider.fill("2");
  assert.equal(await page.locator("#study-results").innerText(), "");
  assert.equal(await page.locator("#sample").innerText(), sample);
  await assertFits(2);
  await assertColors(2);
  await page
    .getByRole("button", { name: "Run 200 studies", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .waitFor();
  assert.match(
    await page.locator("#bias-comparison").innerText(),
    /Strength: 2.0/,
  );
  assert.match(
    await page.locator("#bias-comparison").innerText(),
    /Seeds 100–299/,
  );
  await slider.fill("0");
  assert.equal(await paired(), baseline);
  assert.equal(await page.locator("#study-results").innerText(), "");
  await slider.fill("1");
  await page
    .getByRole("button", { name: "Redraw sample", exact: true })
    .click();
  await assertFits(1, 4218);
  await page
    .getByRole("button", { name: "Restart section", exact: true })
    .click();
  assert.equal(await slider.inputValue(), "0");
  assert.equal(await paired(), baseline);
  await slider.fill("1");
  await page.reload();
  await page.locator("#paired-values td").first().waitFor();
  assert.equal(await slider.inputValue(), "0");
  assert.equal(await paired(), baseline);
  await page.goBack();
  await page.locator("#ipw").filter({ hasText: /\d/ }).waitFor();
  assert.equal(await results(), initial);
  await page
    .getByRole("link", { name: "Explore scenarios ↗", exact: true })
    .click();
  await page.locator("#effects").waitFor();
  assert.equal(await page.locator(".instrument-page").count(), 0);
  const touch = await browser.newPage({
    viewport: { width: 320, height: 850 },
    hasTouch: true,
  });
  await touch.emulateMedia({ reducedMotion: "reduce" });
  await touch.goto(`${url}?lesson=instrument`);
  const touchInstrument = touch.getByLabel("Z → treatment strength");
  await touchInstrument.tap();
  assert.ok(Number(await touchInstrument.inputValue()) < 2.8);
  await touch
    .getByRole("button", { name: "Restart section", exact: true })
    .click();
  assert.equal(await touchInstrument.inputValue(), "2.8");
  await touchInstrument.fill("0");
  await touch.reload();
  assert.equal(await touchInstrument.inputValue(), "2.8");
  await touch.locator("#repeat").click();
  await touch
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .waitFor();
  assert.equal(
    await touch.locator("#study-results.studies-animating").count(),
    0,
  );
  assert.equal(await touch.locator(".study-range").first().isVisible(), true);
  assert.equal(
    await touch
      .locator(".study-dot")
      .first()
      .evaluate((dot) => getComputedStyle(dot).animationName),
    "none",
  );
  assert.equal(await touch.locator(".study-method:visible").count(), 1);
  await touch.goto(`${url}?lesson=instrument-hidden-confounding`);
  const touchSlider = touch.getByLabel("Hidden confounding strength");
  await touchSlider.tap();
  assert.ok(Number(await touchSlider.inputValue()) > 0);
  assert.ok(
    await touch.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await touch.close();
  assert.deepEqual(errors, []);
  console.log("Instrument lesson browser checks passed.");
} finally {
  await browser.close();
}
