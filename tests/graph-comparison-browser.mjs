import {
  launchBrowser,
  getAppUrl,
  collectPageErrors,
} from "./browser-setup.mjs";
import assert from "node:assert/strict";

const browser = await launchBrowser();
const url = getAppUrl();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
  });
  const errors = [];
  collectPageErrors(page, errors);
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
  await page.locator("#post-adjustment").check();
  await page.locator("#redraw").click();
  await page.locator("#continue").click();
  await page.locator('input[name="prediction"]').first().check();
  await page.locator("#try-prediction").click();
  await page.locator("#post-adjustment").check();
  await page.locator("#redraw").click();
  const before = await experiment();
  const currentGraph = await page.locator("#lesson-graph").innerHTML();
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
  assert.equal(await page.locator("#lesson-graph").innerHTML(), currentGraph);
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
  await page.locator("#opening-next").waitFor();
  await page.locator("#continue").click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await toggle.click();
  await previous.click();
  assert.match(await visibleView.innerText(), /Starting view/);
  assert.match(
    await visibleView.locator("svg").getAttribute("aria-label"),
    /risk score causes outcome/,
  );
  await page.locator("#reveal-ipw").click();
  assert.equal(await previous.getAttribute("aria-pressed"), "true");
  await current.click();
  assert.equal(await page.locator("#reveal-ipw").textContent(), "IPW applied");
  await page.locator("#restart").click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await page.goBack();
  await page.locator("#opening-next").waitFor();
  assert.match(await page.locator("h1").innerText(), /How uncertain/);

  // Method lessons keep context compact and the experiment on the current setup.
  for (const width of [1280, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const slug of [
      "outcome-regression",
      "misspecification",
      "double-robustness",
      "tmle",
    ]) {
      await page.goto(`${url}?lesson=${slug}`);
      const context = page.locator("#lesson-graph.method-context");
      await context.waitFor();
      assert.equal(await toggle.count(), 0);
      assert.match(await context.innerText(), /adjust for risk score C/);
      assert.match(await context.innerText(), /whole population/);
      const layout = await page.evaluate(() => {
        const graph = document.querySelector("#lesson-graph");
        const instruction = document.querySelector(".lesson-instruction");
        return {
          graphHeight: graph.querySelector("svg").getBoundingClientRect()
            .height,
          inOrder:
            graph.getBoundingClientRect().bottom <=
            instruction.getBoundingClientRect().top,
          overflows: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.ok(
        layout.graphHeight <= 91,
        `${slug}: compact graph at ${width}px`,
      );
      assert.ok(layout.inOrder, `${slug}: context precedes instruction`);
      assert.equal(layout.overflows, false, `${slug}: no horizontal overflow`);
      const initial = await experiment();
      await page.locator("#redraw").focus();
      await page.keyboard.press("Enter");
      assert.notEqual((await experiment()).sample, initial.sample);
      assert.equal(await toggle.count(), 0);
      await page.locator("#restart").focus();
      await page.keyboard.press("Enter");
      assert.deepEqual(await experiment(), initial);
      if (width !== 320)
        await page.screenshot({
          path: `/tmp/266-${slug}-${width}.png`,
          fullPage: true,
        });
    }
  }

  // Check every core comparison at phone width, including stable geometry and
  // a fixed graph position when lesson titles wrap to different heights.
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  const transitions = [
    ["confounding", "A randomized experiment"],
    ["ipw", "A common cause"],
    ["mediator", "Adjustment with an outcome model"],
    ["collider", "A mediator"],
    ["hidden-confounding", "A collider"],
    ["overlap", "Targeting with TMLE"],
    ["double-robustness&revisit=hidden-confounding", "Double robustness"],
  ];
  for (const [slug, title] of transitions) {
    await page.goto(`${url}?lesson=${slug}`);
    const prediction = page.locator("#try-prediction");
    if (await prediction.isVisible()) {
      assert.equal(await toggle.isVisible(), false);
      await page.locator('input[name="prediction"]').first().check();
      await prediction.click();
    }
    const mainGraph = await page.locator("#lesson-graph").innerHTML();
    await toggle.tap();
    await previous.tap();
    if (["collider", "overlap"].includes(slug))
      assert.equal(await page.locator("#lesson-graph").innerHTML(), mainGraph);
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
