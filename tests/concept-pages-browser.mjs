import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const root = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
const pages = [
  {
    path: "confounding/",
    title: "Confounding Explained: Interactive Causal Inference Example",
    canonical: "https://kirilklein.github.io/causal-sandbox/confounding/",
    heading: "A common cause",
    control: "#selection",
    article: /larger sample remove confounding/i,
  },
  {
    path: "collider-bias/",
    title: "Collider Bias: An Interactive Adjustment Example",
    canonical: "https://kirilklein.github.io/causal-sandbox/collider-bias/",
    heading: "A collider",
    control: "#post-adjustment",
    article: /adjusting for more variables create bias/i,
  },
  {
    path: "positivity/",
    title: "Positivity and Overlap: Interactive Propensity Score Example",
    canonical: "https://kirilklein.github.io/causal-sandbox/positivity/",
    heading: "Too little overlap",
    control: '#overlap-selection input[value="5"]',
    article: /positivity assumption/i,
  },
];

try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(root);
  await page.locator("#lesson-menu-toggle").click();
  for (const concept of pages) {
    assert.equal(
      await page
        .locator(`.concept-menu a[href="${concept.path}"]`)
        .getAttribute("href"),
      concept.path,
    );
  }

  for (const concept of pages) {
    const response = await page.goto(new URL(concept.path, root).href);
    assert.equal(response.status(), 200, concept.path);
    await page.locator(concept.control).waitFor();
    assert.equal(await page.title(), concept.title);
    assert.equal(
      await page.locator('link[rel="canonical"]').getAttribute("href"),
      concept.canonical,
    );
    assert.equal(await page.locator("h1").innerText(), concept.heading);
    assert.equal(await page.locator("h1").count(), 1);
    assert.match(
      await page.locator(".concept-content h2").innerText(),
      concept.article,
    );
    assert.ok((await page.locator(".concept-links a").count()) >= 3);
    assert.match(
      await page.locator(".site-footer").innerText(),
      /Created by Kiril Klein, PhD/,
    );
    const references = page.locator(".site-references");
    assert.equal(await references.locator("li").count(), 10);
    await references.locator("summary").click();

    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${concept.path} overflows at ${width}px`,
      );
    }
    await references.locator("summary").click();
  }

  await page.goto(new URL("confounding/", root).href);
  await page.locator("#selection").fill("1.2");
  assert.equal(await page.locator("#selection-output").innerText(), "1.2");
  await page.locator("#continue").click();
  assert.equal(page.url(), new URL("?lesson=ipw", root).href);

  await page.goto(new URL("collider-bias/", root).href);
  const colliderEstimate = await page.locator("#regression").innerText();
  await page.locator("#post-adjustment").check();
  assert.notEqual(
    await page.locator("#regression").innerText(),
    colliderEstimate,
  );

  await page.goto(new URL("positivity/", root).href);
  const moderate = await page.locator(".overlap-diagnostics").innerText();
  await page.locator('#overlap-selection input[value="5"]').check();
  assert.notEqual(
    await page.locator(".overlap-diagnostics").innerText(),
    moderate,
  );

  assert.deepEqual(errors, []);
  console.log(
    "Static concept routes, metadata, responsive layout, and exercises passed.",
  );
} finally {
  await browser.close();
}
