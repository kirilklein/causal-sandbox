import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { timingSample } from "../src/timing-simulation.js";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const appUrl = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1100 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*.goatcounter.com/**", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"count":"0"}' }),
  );
  await page.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.goto(`${appUrl}?lesson=collider`);
  await page.locator("#continue").click();
  assert.match(page.url(), /lesson=hidden-confounding/);
  await page.goBack();
  await page
    .getByRole("link", { name: "Optional: what timing tells us →" })
    .click();
  const handle = page.locator("#variable-handle");
  await handle.waitFor();
  const selectedWindow = () =>
    page.locator('[name="time-window"]:checked').inputValue();
  const chooseWindow = (key) =>
    page.locator(`[name="time-window"][value="${key}"]`).check();
  const chooseExample = (key) =>
    page.locator(`[name="causal-example"][value="${key}"]`).check();
  const edges = () =>
    page
      .locator("#example-graph [data-edge]")
      .evaluateAll((els) => els.map((el) => el.dataset.edge).sort());
  const landmarkPositions = () =>
    page.locator(".time-landmark strong").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return [r.x + scrollX, r.y + scrollY, r.width, r.height];
      }),
    );
  const positions = await landmarkPositions();
  assert.equal(await selectedWindow(), "before");
  assert.equal(await page.locator("#example-panel").isVisible(), false);
  assert.deepEqual(await edges(), []);

  const cases = {
    before: {
      confounder: ["AY", "VA", "VY"],
      instrument: ["AY", "VA"],
      predictor: ["AY", "VY"],
      collider: ["AY", "PA", "PV", "RV", "RY"],
    },
    between: {
      mediator: ["AV", "AY", "VY"],
      predictor: ["AY", "VY"],
      treatment: ["AV", "AY"],
      collider: ["AV", "AY", "UV", "UY"],
    },
    after: {
      treatment: ["AV", "AY"],
      outcome: ["AY", "YV"],
      collider: ["AV", "AY", "YV"],
    },
  };
  for (const [time, examples] of Object.entries(cases)) {
    await chooseWindow(time);
    assert.equal(await page.locator("#example-panel").isVisible(), false);
    for (const [example, expected] of Object.entries(examples)) {
      await chooseExample(example);
      assert.deepEqual(await edges(), expected.sort());
      const study = timingSample({ example, window: time });
      const sampleLabel = await page.locator("#timing-sample").innerText();
      assert.equal(await page.locator("#condition-V").isChecked(), false);
      assert.equal(await page.locator("#timing-truth").innerText(), "2.00");
      assert.equal(
        await page.locator("#timing-estimate").innerText(),
        study.unadjusted.toFixed(2),
      );
      await page.locator("#condition-V").focus();
      await page.keyboard.press("Space");
      assert.equal(
        await page.locator("#timing-estimate").innerText(),
        study.adjusted.toFixed(2),
      );
      assert.equal(await page.locator("#timing-truth").innerText(), "2.00");
      assert.equal(
        await page.locator("#timing-sample").innerText(),
        sampleLabel,
      );
      assert.deepEqual(await edges(), expected.sort());
      await page.locator("#condition-V").uncheck();
      assert.equal(
        await page.locator("#timing-estimate").innerText(),
        study.unadjusted.toFixed(2),
      );
      assert.match(
        await page.locator("#example-caption").innerText(),
        /One possible world/,
      );
    }
    assert.deepEqual(await landmarkPositions(), positions);
  }
  await chooseWindow("before");
  await chooseExample("predictor");
  const beforeStudies = await page.locator("#timing-estimate").innerText();
  await page.locator("#repeated-studies summary").click();
  await page.locator("#timing-repeat").click();
  await page.locator("#studies-table").waitFor();
  const cells = await page.locator("#studies-rows td").allTextContents();
  assert.equal(cells.length, 4);
  assert.ok(Number(cells[3]) < Number(cells[1]) * 0.7);
  assert.equal(
    await page.locator("#timing-estimate").innerText(),
    beforeStudies,
  );
  const summary = await page.locator("#studies-rows").innerText();
  await page.locator("#condition-V").check();
  await page.locator("#timing-redraw").click();
  assert.equal(await page.locator("#studies-rows").innerText(), summary);
  await page.locator("#timing-repeat").click();
  await chooseExample("instrument");
  assert.equal(await page.locator("#studies-table").isVisible(), false);
  await page.locator("#repeated-studies summary").click();
  await page.locator("#timing-repeat").click();
  await page.locator("#studies-table").waitFor();
  const instrumentCells = await page
    .locator("#studies-rows td")
    .allTextContents();
  assert.ok(Number(instrumentCells[3]) > Number(instrumentCells[1]));
  await page.locator("#timing-restart").click();
  await chooseWindow("after");
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await selectedWindow(), "between");
  assert.equal(await page.locator("#example-panel").isVisible(), false);
  assert.equal(
    await handle.evaluate((el) => el === document.activeElement),
    true,
  );
  await page.locator('[name="time-window"][value="between"]').focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await selectedWindow(), "before");

  const center = async (locator) => {
    const b = await locator.boundingBox();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const mouseDrag = async (target, cancel = false) => {
    const start = await center(handle);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(target.x, target.y, { steps: 8 });
    if (cancel) await page.keyboard.press("Escape");
    await page.mouse.up();
  };
  await mouseDrag(await center(page.locator('[data-window="after"]')));
  assert.equal(await selectedWindow(), "after");
  await chooseExample("collider");
  await mouseDrag(await center(page.locator('[data-window="before"]')), true);
  assert.equal(await selectedWindow(), "after");
  assert.equal(
    await page.locator('[name="causal-example"]:checked').inputValue(),
    "collider",
  );
  await mouseDrag({ x: 5, y: 5 });
  assert.equal(await selectedWindow(), "after");
  await mouseDrag(await center(page.locator('[data-window="before"]')));
  assert.equal(await selectedWindow(), "before");
  assert.equal(await page.locator("#example-panel").isVisible(), false);
  assert.deepEqual(await landmarkPositions(), positions);

  await chooseExample("collider");
  const initial = timingSample();
  assert.equal(
    await page.locator("#timing-estimate").innerText(),
    initial.unadjusted.toFixed(2),
  );
  const graph = await page.locator("#example-graph").innerHTML();
  await page.locator("#condition-V").check();
  assert.equal(
    await page.locator("#timing-estimate").innerText(),
    initial.adjusted.toFixed(2),
  );
  assert.match(
    await page.locator("#timing-comparison").innerText(),
    /Without V: .*With V:/,
  );
  assert.equal(await page.locator("#example-graph").innerHTML(), graph);
  await page.locator("#timing-redraw").click();
  assert.equal(
    await page.locator("#timing-estimate").innerText(),
    timingSample({ seed: 4218 }).adjusted.toFixed(2),
  );
  await page
    .getByText("Why does adjusting for the score connect P and R?", {
      exact: true,
    })
    .click();
  const result = await page.locator("#timing-estimate").innerText();
  await page.locator("#timing-overview summary").click();
  assert.equal(await page.locator("#timing-estimate").innerText(), result);
  await chooseWindow("before");
  assert.equal(
    await page.locator('[name="causal-example"]:checked').inputValue(),
    "collider",
  );
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({
    path: "artifacts/timing-collider-desktop.png",
    fullPage: true,
  });
  await page.locator("#timing-restart").click();
  assert.equal(await selectedWindow(), "before");
  assert.equal(await page.locator("details[open]").count(), 0);
  assert.equal(await page.locator("#example-panel").isVisible(), false);
  await page.screenshot({
    path: "artifacts/timing-explorer-desktop.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 320, height: 900 });
  for (const theme of ["light", "dark"]) {
    await page.getByLabel("Color theme").selectOption(theme);
    for (const time of Object.keys(cases)) {
      await page.locator(`[name="time-window"][value="${time}"]`).tap();
      assert.equal(await selectedWindow(), time);
      await chooseExample(time === "between" ? "mediator" : "collider");
      await page.locator("#condition-V").check();
      await page.locator("#repeated-studies summary").click();
      await page.locator("#timing-repeat").click();
      await page.locator("#studies-table").waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await page.screenshot({
        path: `artifacts/timing-mobile-${theme}-${time}.png`,
        fullPage: true,
      });
    }
  }
  await page.locator("#timeline").scrollIntoViewIfNeeded();
  const cdp = await page.context().newCDPSession(page);
  const touchDrag = async (key, cancel = false) => {
    const start = await center(handle);
    const end = await center(page.locator(`[data-window="${key}"]`));
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: start.x, y: start.y, id: 0 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: end.x, y: end.y, id: 0 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: cancel ? "touchCancel" : "touchEnd",
      touchPoints: [],
    });
  };
  await touchDrag("before", true);
  assert.equal(await selectedWindow(), "after");
  await touchDrag("between");
  assert.equal(await selectedWindow(), "between");
  assert.equal(await page.locator("#example-panel").isVisible(), false);
  assert.equal(
    await handle.evaluate((el) => getComputedStyle(el).touchAction),
    "none",
  );
  assert.equal(
    await page
      .locator("#timeline")
      .evaluate((el) => getComputedStyle(el).touchAction),
    "auto",
  );
  await cdp.detach();
  await page.locator("#timing-restart").click();
  await chooseExample("collider");
  assert.equal(
    await page.locator("#timing-estimate").innerText(),
    initial.unadjusted.toFixed(2),
  );
  await page.getByRole("link", { name: "Continue the core lessons →" }).click();
  assert.match(page.url(), /lesson=hidden-confounding/);
  await page.goBack();
  await handle.waitFor();
  assert.equal(await selectedWindow(), "before");
  assert.equal(await page.locator("#example-panel").isVisible(), false);
  await page.reload();
  await handle.waitFor();
  assert.equal(await selectedWindow(), "before");
  await page
    .getByRole("link", { name: "← Return to the collider lesson" })
    .click();
  await page.locator("#lesson-menu-toggle").click();
  await page
    .getByRole("link", { name: "What timing tells us ↗", exact: true })
    .click();
  await handle.waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Timing explorer: examples, mouse/touch dragging, cancellation, keyboard, all-world estimates, paired study summaries, reset, navigation, and mobile themes passed.",
  );
} finally {
  await browser.close();
}
