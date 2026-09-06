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
    .getByRole("link", { name: "Continue: add hidden confounding" })
    .click();
  await page.locator("#ipw").filter({ hasText: /\d/ }).waitFor();
  assert.equal(
    new URL(page.url()).searchParams.get("lesson"),
    "instrument-hidden-confounding",
  );
  assert.equal(await page.locator("#study-results").innerText(), "");
  assert.equal(await adjust.isChecked(), false);
  assert.ok(await page.locator("#hidden-node").isVisible());
  const hidden = instrumentAdjustment({ hidden: 1 });
  assert.equal(
    await page.locator("#ipw").textContent(),
    hidden.fits[0].values[3].toFixed(3),
  );
  await adjust.check();
  assert.equal(
    await page.locator("#ipw").textContent(),
    hidden.fits[1].values[3].toFixed(3),
  );
  await page.reload();
  await page.locator("#ipw").filter({ hasText: /\d/ }).waitFor();
  assert.equal(await adjust.isChecked(), false);
  await page.goBack();
  await page.locator("#ipw").filter({ hasText: /\d/ }).waitFor();
  assert.equal(await results(), initial);
  await page.getByRole("link", { name: "Full sandbox ↗", exact: true }).click();
  await page.locator("#effects").waitFor();
  assert.equal(await page.locator(".instrument-page").count(), 0);
  assert.deepEqual(errors, []);
  console.log("Instrument lesson browser checks passed.");
} finally {
  await browser.close();
}
