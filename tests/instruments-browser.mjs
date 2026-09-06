import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { instrumentAdjustment } from "../src/instrument-simulation.js";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    colorScheme: "light",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*.goatcounter.com/**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ count: "0" }),
    }),
  );
  await page.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.goto(`${url}?lesson=overlap`);
  await page
    .getByRole("link", { name: "Explore instruments and adjustment →" })
    .click();
  await page.locator("#ipw").filter({ hasText: /\d/ }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("lesson"), "instrument");
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
  const expected = instrumentAdjustment().fits[1];
  assert.equal(
    await page.locator("#ipw").textContent(),
    expected.values[3].toFixed(3),
  );
  assert.equal(await page.locator("#uptake").innerText(), uptake);
  assert.equal(await page.locator("#graph").innerHTML(), graph);
  await page.keyboard.press("Space");
  assert.equal(await results(), initial);

  await page.locator("#study-title").click();
  assert.equal(await results(), initial);
  await page
    .getByRole("button", { name: "Run 200 studies", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .waitFor();
  assert.equal(await results(), initial);
  assert.match(
    await page.locator("#study-results").innerText(),
    /Seeds 100–299/,
  );
  assert.equal(await page.locator(".sd-method").count(), 3);
  assert.equal(await page.locator("#study-means").getAttribute("open"), null);
  const bars = await page.locator(".sd-bar").evaluateAll((nodes) =>
    nodes.map((n) => ({
      x: n.getBoundingClientRect().x,
      width: n.getBoundingClientRect().width,
      tint: parseFloat(n.style.getPropertyValue("--sd-tint")),
    })),
  );
  for (let i = 0; i < 6; i += 2) {
    assert.equal(bars[i].x, bars[i + 1].x);
    assert.equal(bars[i].tint, 1);
    assert.ok(bars[i + 1].tint > 1 && bars[i + 1].tint <= 28);
    assert.ok(bars[i + 1].width > bars[i].width);
  }
  await page
    .locator("#study-results")
    .screenshot({ path: "/tmp/instruments-sd-desktop.png" });
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
  await page.setViewportSize({ width: 320, height: 850 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page
    .locator("#study-results")
    .screenshot({ path: "/tmp/instruments-sd-mobile.png" });
  await page.locator("#study-means summary").click();
  assert.match(await page.locator("#study-means").innerText(), /Mean estimate/);

  await page
    .getByRole("button", { name: "Run another 200 studies", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restart section", exact: true })
    .click();
  await page.locator("#study-title").click();
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
          Math.abs(cells[2 * k + j].tint - Math.min(error / 2, 1) * 100) < 1e-9,
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
  await page.locator("#study-title").click();
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
  await page.getByRole("link", { name: "Full sandbox ↗", exact: true }).click();
  await page.locator("#effects").waitFor();
  assert.equal(await page.locator(".instrument-page").count(), 0);
  const touch = await browser.newPage({
    viewport: { width: 320, height: 850 },
    hasTouch: true,
  });
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
