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
  page.on("pageerror", (error) => errors.push(error.message));
  const toggle = page.locator("#compare-graph");
  const previous = page.getByRole("button", { name: "Previous", exact: true });
  const current = page.getByRole("button", { name: "Current", exact: true });
  const visibleView = page.locator(
    '.graph-comparison-view[aria-hidden="false"]',
  );
  const experiment = () =>
    page.evaluate(() => ({
      results: document.querySelector(".lesson-results").textContent,
      sample: document.querySelector("#sample-label").textContent,
      controls: [...document.querySelectorAll(".lesson-controls input")].map(
        (input) => [input.id, input.value, input.checked],
      ),
    }));
  const position = () =>
    page.evaluate(() => ({
      scroll: window.scrollY,
      controls: document
        .querySelector(".lesson-controls")
        .getBoundingClientRect().top,
    }));
  const nodes = () =>
    visibleView
      .locator("svg rect")
      .evaluateAll((rects) =>
        Object.fromEntries(
          rects.map((rect) => [
            rect.getAttribute("fill"),
            ["x", "y", "width", "height"].map((attribute) =>
              rect.getAttribute(attribute),
            ),
          ]),
        ),
      );

  await page.goto(`${url}?lesson=mediator`);
  await page.locator('input[name="prediction"]').first().check();
  await page.locator("#try-prediction").click();
  await page.locator("#post-adjustment").check();
  await page.locator("#redraw").click();
  await page.locator("#continue").click();
  await page.locator('input[name="prediction"]').first().check();
  await page.locator("#try-prediction").click();
  await page.locator("#post-adjustment").check();
  await page.locator("#redraw").click();
  const before = await experiment();
  await toggle.focus();
  await page.keyboard.press("Enter");
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  assert.match(await visibleView.innerText(), /Current: A collider/);
  const currentNodes = await nodes();
  await previous.focus();
  const currentPosition = await position();
  await page.keyboard.press("Space");
  assert.equal(await previous.getAttribute("aria-pressed"), "true");
  assert.match(await visibleView.innerText(), /Previous: A mediator/);
  assert.match(await visibleView.innerText(), /As you left it/);
  assert.match(await visibleView.innerText(), /adjusting for C and M/);
  assert.match(
    await visibleView.locator("svg").getAttribute("aria-label"),
    /response, which causes outcome/,
  );
  const previousNodes = await nodes();
  for (const variable of ["A", "C", "Y"])
    assert.deepEqual(
      previousNodes[`var(--node-${variable})`],
      currentNodes[`var(--node-${variable})`],
    );
  assert.deepEqual(await position(), currentPosition);
  assert.deepEqual(await experiment(), before);
  assert.equal(await page.locator("#lesson-graph").getByRole("img").count(), 1);
  await page.screenshot({
    path: "/tmp/diagram-comparison-desktop.png",
    fullPage: true,
  });
  await current.click();
  assert.match(await visibleView.innerText(), /adjusting for C and K/);
  await toggle.click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  assert.equal(await page.locator("#lesson-graph svg").count(), 1);
  assert.deepEqual(await experiment(), before);

  // A direct link has no previous experiment to capture.
  await page.goto(`${url}?lesson=confounding`);
  await page.locator("#selection").fill("0.7");
  await toggle.click();
  await previous.click();
  assert.match(await visibleView.innerText(), /Starting view/);
  assert.match(
    await visibleView.locator("svg").getAttribute("aria-label"),
    /assigned at random/,
  );
  const priorGraph = await visibleView.locator("svg").innerHTML();
  await page.locator("#selection").fill("1.2");
  assert.equal(await visibleView.locator("svg").innerHTML(), priorGraph);
  await current.click();
  assert.match(
    await visibleView.locator("svg").getAttribute("aria-label"),
    /and treatment/,
  );
  await page.locator("#continue").click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await toggle.click();
  await previous.click();
  assert.match(await visibleView.innerText(), /As you left it/);
  assert.match(
    await visibleView.locator("svg").getAttribute("aria-label"),
    /and treatment/,
  );
  await page.locator("#reveal-ipw").click();
  assert.equal(await previous.getAttribute("aria-pressed"), "true");
  await current.click();
  assert.equal(await page.locator("#reveal-ipw").textContent(), "IPW applied");
  await page.locator("#restart").click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await page.goBack();
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");

  // Check every core comparison at phone width, including stable geometry and
  // a fixed graph position when lesson titles wrap to different heights.
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  const transitions = [
    ["confounding", "A randomized experiment"],
    ["ipw", "A common cause"],
    ["outcome-regression", "Adjustment with IPW"],
    ["mediator", "Adjustment with an outcome model"],
    ["collider", "A mediator"],
    ["hidden-confounding", "A collider"],
    ["misspecification", "A hidden common cause"],
    ["double-robustness", "When a model is too simple"],
    ["tmle", "Double robustness"],
    ["overlap", "Targeting with TMLE"],
    ["double-robustness&revisit=hidden-confounding", "Double robustness"],
  ];
  for (const [slug, title] of transitions) {
    await page.goto(`${url}?lesson=${slug}`);
    await toggle.tap();
    await previous.tap();
    assert.match(
      await visibleView.innerText(),
      new RegExp(`Previous: ${title}`),
    );
    const priorNodes = await nodes();
    const priorTop = await visibleView
      .locator("svg")
      .evaluate((svg) => svg.getBoundingClientRect().top + window.scrollY);
    await current.tap();
    const nowNodes = await nodes();
    for (const variable of ["A", "C", "Y"]) {
      const fill = `var(--node-${variable})`;
      if (priorNodes[fill])
        assert.deepEqual(
          priorNodes[fill],
          nowNodes[fill],
          `${slug}: ${variable}`,
        );
    }
    const nowTop = await visibleView
      .locator("svg")
      .evaluate((svg) => svg.getBoundingClientRect().top + window.scrollY);
    assert.equal(nowTop, priorTop, `${slug}: graph stays in place`);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    assert.equal(
      await page.locator("#lesson-graph").getByRole("img").count(),
      1,
    );
    if (slug === "collider") {
      await toggle.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: "/tmp/diagram-comparison-mobile.png",
        fullPage: true,
      });
    }
  }
  for (const slug of ["randomization", "leaving-the-sandbox", "introduction"]) {
    await page.goto(`${url}?lesson=${slug}`);
    await page.locator("h1").waitFor();
    assert.equal(await toggle.count(), 0);
  }
  assert.deepEqual(errors, []);
  console.log("Graph comparison browser checks passed");
} finally {
  await browser.close();
}
