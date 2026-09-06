import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { glossary } from "../src/glossary.js";

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
  {
    path: "inverse-probability-weighting/",
    title: "Inverse Probability Weighting (IPW): Interactive Guide",
    canonical:
      "https://kirilklein.github.io/causal-sandbox/inverse-probability-weighting/",
    heading: "Adjustment with IPW",
    control: "#reveal-ipw",
    article: /inverse probability weighting work/i,
  },
  {
    path: "aipw-double-robustness/",
    title: "AIPW and Double Robustness: Interactive Guide",
    canonical:
      "https://kirilklein.github.io/causal-sandbox/aipw-double-robustness/",
    heading: "Double robustness",
    control: "#outcome-quadratic",
    article: /double robustness guarantee/i,
  },
  {
    path: "mediator-adjustment/",
    title: "Mediator Adjustment and Total Effects: Interactive Guide",
    canonical:
      "https://kirilklein.github.io/causal-sandbox/mediator-adjustment/",
    heading: "A mediator",
    control: "#post-adjustment",
    article: /adjust for a mediator/i,
  },
  {
    path: "tmle/",
    title: "TMLE Explained: Interactive Targeting Example",
    canonical: "https://kirilklein.github.io/causal-sandbox/tmle/",
    heading: "Targeting with TMLE",
    control: "#apply-targeting",
    article: /TMLE targeting step/i,
  },
  {
    path: "propensity-score-clipping-trimming/",
    title: "Propensity Score Clipping vs Trimming: Interactive Guide",
    canonical:
      "https://kirilklein.github.io/causal-sandbox/propensity-score-clipping-trimming/",
    heading: "What changes when we clip?",
    control: "#threshold",
    article: /clipping and trimming different/i,
  },
];

try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(root);
  const structuredData = JSON.parse(
    await page.locator('script[type="application/ld+json"]').textContent(),
  );
  assert.deepEqual(structuredData["@type"], [
    "WebApplication",
    "LearningResource",
  ]);
  assert.equal(structuredData.isAccessibleForFree, true);
  assert.equal(structuredData.author.name, "Kiril Klein");

  await page.locator("#lesson-menu-toggle").click();
  assert.equal(
    await page
      .locator('.concept-menu a[href="glossary/"]')
      .getAttribute("href"),
    "glossary/",
  );
  for (const concept of pages) {
    assert.equal(
      await page
        .locator(`.concept-menu a[href="${concept.path}"]`)
        .getAttribute("href"),
      concept.path,
    );
  }

  const glossaryUrl = new URL("glossary/", root).href;
  const glossaryResponse = await page.goto(glossaryUrl);
  assert.equal(glossaryResponse.status(), 200);
  assert.equal(
    await page.title(),
    "Causal Inference Glossary | Causal Sandbox",
  );
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute("href"),
    "https://kirilklein.github.io/causal-sandbox/glossary/",
  );
  assert.equal(
    await page.locator("h1").innerText(),
    "Causal inference glossary",
  );
  assert.equal(
    await page.locator(".glossary-entry").count(),
    Object.keys(glossary).length,
  );
  assert.equal(
    await page.locator(".glossary-summary").count(),
    Object.keys(glossary).length,
  );
  assert.equal(
    await page.locator(".glossary-related").count(),
    Object.keys(glossary).length,
  );
  assert.match(
    await page.locator("#aipw").innerText(),
    /either the outcome model/i,
  );
  assert.match(
    await page.locator("#ate").innerText(),
    /Average describes aggregation/i,
  );
  assert.match(
    await page.locator("#total-effect").innerText(),
    /every causal pathway/i,
  );
  assert.match(
    await page.locator("#hidden .glossary-aliases").innerText(),
    /Hidden confounder/i,
  );
  assert.equal(
    await page
      .locator('#glossary-contents-list a[href="#confounder"]')
      .innerText(),
    "Confounder",
  );
  await page.getByLabel("Color theme").selectOption("light");
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `glossary/ overflows at ${width}px`,
    );
    if (width !== 320) {
      await page.screenshot({
        path: `/tmp/causal-glossary-${width}.png`,
        fullPage: true,
      });
    }
  }

  const methodologyUrl = new URL("methodology/", root).href;
  const methodologyResponse = await page.goto(methodologyUrl);
  assert.equal(methodologyResponse.status(), 200);
  assert.equal(await page.title(), "Methodology Notes | Causal Sandbox");
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute("href"),
    "https://kirilklein.github.io/causal-sandbox/methodology/",
  );
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await page.locator(".methodology-equation math").count(), 13);
  assert.match(
    await page.locator("#target").innerText(),
    /direct and mediated paths/i,
  );
  assert.match(
    await page.locator("#limitations").innerText(),
    /point estimates/i,
  );
  const methodologyFooterLink = page.getByRole("link", {
    name: "Methodology notes",
  });
  assert.equal(await methodologyFooterLink.count(), 1);
  assert.equal(
    new URL(await methodologyFooterLink.getAttribute("href"), page.url()).href,
    methodologyUrl,
  );
  const modelDetails = page.locator(".methodology-detail").first();
  await modelDetails.locator("summary").focus();
  await page.keyboard.press("Enter");
  assert.equal(await modelDetails.getAttribute("open"), "");
  await page.getByLabel("Color theme").selectOption("light");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `methodology/ overflows at ${width}px`,
    );
    if (width !== 320) {
      await page.screenshot({
        path: `/tmp/causal-methodology-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.getByLabel("Color theme").selectOption("dark");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({
    path: "/tmp/causal-methodology-dark-390.png",
    fullPage: true,
  });
  await page.getByLabel("Color theme").selectOption("system");

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
  assert.equal(
    page.url(),
    new URL("inverse-probability-weighting/", root).href,
  );
  assert.equal(await page.locator("h1").innerText(), "Adjustment with IPW");
  await page.goBack();
  assert.equal(await page.locator("h1").innerText(), "A common cause");
  await page.goForward();
  assert.equal(await page.locator("h1").innerText(), "Adjustment with IPW");

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
