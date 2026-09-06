import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { graphPreset } from "../src/graph-presets.js";
import { simulateGraph, analyzeGraph } from "../src/graph-simulation.js";

const appUrl = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
try {
  const page = await browser.newPage({
    viewport: { width: 1360, height: 1100 },
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
  await mkdir("artifacts", { recursive: true });
  const values = () => page.locator(".lab-estimate-value").allTextContents();
  const truth = () => page.locator("#lab-truth").innerText();
  const analysis = () =>
    page.getByRole("tab", { name: "Analysis", exact: true }).click();
  const world = () =>
    page.getByRole("tab", { name: "World", exact: true }).click();
  const connect = async (from, to) => {
    await page.locator("#lab-connect").evaluate((form) => {
      form.closest("details").open = true;
    });
    await page.locator("#lab-from").selectOption(from);
    await page.locator("#lab-to").selectOption(to);
    await page.getByRole("button", { name: "Add arrow", exact: true }).click();
  };

  await page.goto(`${appUrl}?sandbox=graph-lab`);
  await page.locator("#lab-truth").waitFor();
  assert.equal(await truth(), "2.00");
  const graph = graphPreset("pkr").graph,
    sample = simulateGraph(graph);
  assert.deepEqual(
    await values(),
    [0, 2, 3, 4].map((i) =>
      analyzeGraph(graph, sample.data, []).values[i].toFixed(2),
    ),
  );
  const initial = await values();
  const initialPaths = await page
    .locator(".lab-edge")
    .evaluateAll((edges) => edges.map((e) => e.getAttribute("d")));
  // Adjustment stays beside results, including while editing the world.
  await world();
  assert.equal(
    await page.locator('#lab-results [data-adjust="v3"]').isVisible(),
    true,
  );
  await page.locator('[data-adjust="v3"]').check();
  assert.deepEqual(
    await values(),
    [0, 2, 3, 4].map((i) =>
      analyzeGraph(graph, sample.data, ["v3"]).values[i].toFixed(2),
    ),
  );
  assert.deepEqual(
    await page
      .locator(".lab-edge")
      .evaluateAll((edges) => edges.map((e) => e.getAttribute("d"))),
    initialPaths,
  );
  await page.screenshot({
    path: "artifacts/graph-lab-desktop.png",
    fullPage: true,
  });
  await world();
  await page.locator('[data-edge="v1:v3"]').focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Remove arrow", exact: true }).click();
  assert.equal(await page.locator("[data-edge]").count(), 4);
  assert.equal(await truth(), "2.00");
  const changed = await values();
  await connect("Y", "A");
  assert.match(await page.locator("#lab-validation").innerText(), /cycle/);
  assert.deepEqual(await values(), changed);
  await connect("A", "Y");
  assert.match(
    await page.locator("#lab-validation").innerText(),
    /already exists/,
  );

  await page.getByRole("button", { name: "Reset graph", exact: true }).click();
  assert.deepEqual(await values(), initial);
  await page
    .getByRole("button", { name: "Edit variable P", exact: true })
    .click();
  await page.locator("#lab-name").fill("Preference");
  await page.locator("#lab-name").press("Tab");
  assert.deepEqual(await values(), initial);
  await analysis();
  await page.locator('[data-adjust="v1"]').check();
  await page
    .getByRole("button", { name: "Edit variable Preference", exact: true })
    .click();
  await page.locator("#lab-observed").uncheck();
  await analysis();
  assert.equal(await page.locator('[data-adjust="v1"]').isEnabled(), false);
  assert.equal(await page.locator('[data-adjust="v1"]').isChecked(), false);
  assert.deepEqual(await values(), initial);

  await page.locator("#lab-preset").selectOption("blank");
  assert.equal(await truth(), "0.00");
  await connect("A", "Y");
  assert.equal(await truth(), "1.00");
  await page.locator("#lab-strength").focus();
  await page.keyboard.press("ArrowRight");
  await page.locator("#lab-strength").press("Tab");
  assert.equal(await truth(), "1.10");
  await page.locator("#lab-new-name").fill("Mediator");
  await page.getByRole("button", { name: "Add variable", exact: true }).click();
  await connect("A", "v1");
  await connect("v1", "Y");
  assert.equal(await truth(), "2.10");
  await analysis();
  await page.locator('[data-adjust="v1"]').check();
  assert.match(
    await page.locator("#lab-causal-note").innerText(),
    /downstream/,
  );
  await world();
  await page
    .getByRole("button", { name: "Edit variable Mediator", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove variable", exact: true })
    .click();
  assert.equal(await truth(), "1.10");
  assert.equal(await page.locator("[data-edge]").count(), 1);
  for (let i = 0; i < 6; i++) {
    await page.locator("#lab-new-name").fill(`Extra ${i}`);
    await page
      .getByRole("button", { name: "Add variable", exact: true })
      .click();
  }
  assert.equal(await page.locator("[data-node]").count(), 8);
  assert.equal(await page.locator("#lab-add-node").isEnabled(), false);

  await page.locator("#lab-preset").selectOption("mediator");
  // Dragging, keyboard placement and auto-arrange affect only presentation.
  const beforeMove = await values();
  const nodeA = page.locator('[data-node="A"]');
  const originalPosition = await nodeA.getAttribute("transform");
  const box = await nodeA.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 - 80,
    box.y + box.height / 2 + 20,
    { steps: 10 },
  );
  await page.mouse.up();
  assert.notEqual(await nodeA.getAttribute("transform"), originalPosition);
  assert.deepEqual(await values(), beforeMove);
  const draggedPosition = await nodeA.getAttribute("transform");
  await analysis();
  await world();
  assert.equal(await nodeA.getAttribute("transform"), draggedPosition);
  await nodeA.focus();
  await page.keyboard.press("ArrowLeft");
  assert.notEqual(await nodeA.getAttribute("transform"), draggedPosition);
  await page.getByRole("button", { name: "Auto arrange", exact: true }).click();
  assert.equal(await nodeA.getAttribute("transform"), originalPosition);
  assert.deepEqual(await values(), beforeMove);
  // Draw a new arrow using two node clicks, then reject its reverse cycle.
  await page
    .getByRole("button", { name: "Edit arrow A → Y: 1", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  assert.notEqual(
    await page
      .locator("#lab-strength")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
    "rgba(0, 0, 0, 0)",
  );
  await page.getByRole("button", { name: "Remove arrow", exact: true }).click();
  await page.getByRole("button", { name: "Draw arrow", exact: true }).click();
  await nodeA.click();
  await page.locator('[data-node="Y"]').click();
  assert.equal(await page.locator('[data-edge="A:Y"]').count(), 1);
  assert.equal(await truth(), "2.00");
  await page.getByRole("button", { name: "Draw arrow", exact: true }).click();
  await page.locator('[data-node="Y"]').click();
  await nodeA.click();
  assert.match(await page.locator("#lab-graph-help").innerText(), /cycle/);
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator("#lab-draw-arrow").getAttribute("aria-pressed"),
    "false",
  );
  await analysis();
  await page.locator('[data-adjust="v1"]').check();
  const mediatorResults = await values();
  await page.getByLabel("Color theme").selectOption("dark");
  assert.deepEqual(await values(), mediatorResults);
  await page.screenshot({
    path: "artifacts/graph-lab-dark.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByRole("tab", { name: "World", exact: true }).tap();
  await page.locator("#lab-world-tab").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.locator("#lab-analysis-tab").getAttribute("aria-selected"),
    "true",
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "page overflows phone width",
  );
  await page.screenshot({
    path: "artifacts/graph-lab-phone-dark.png",
    fullPage: true,
  });
  await page.getByLabel("Color theme").selectOption("light");
  await world();
  const touchNode = page.locator('[data-node="A"]');
  await touchNode.scrollIntoViewIfNeeded();
  const touchBox = await touchNode.boundingBox();
  const touchPosition = await touchNode.getAttribute("transform");
  const touchValues = await values();
  const client = await page.context().newCDPSession(page);
  const finger = {
    x: touchBox.x + touchBox.width / 2,
    y: touchBox.y + touchBox.height / 2,
  };
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [finger],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: finger.x + 30, y: finger.y + 25 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  assert.notEqual(await touchNode.getAttribute("transform"), touchPosition);
  assert.deepEqual(await values(), touchValues);
  await client.detach();
  await page.screenshot({
    path: "artifacts/graph-lab-phone.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 1360, height: 1100 });
  await page.goto(`${appUrl}?sandbox&scenario=mediator`);
  await page.locator("#world-tab").click();
  await page.locator('[data-param="direct"]').fill("2.4");
  await page.locator('.adjust-option input[value="M"]').uncheck();
  const sandboxValues = await page.locator("#effects").innerText();
  await page.locator("#open-graph-lab").click();
  await page
    .getByRole("link", { name: "Return to full sandbox", exact: true })
    .click();
  assert.equal(await page.locator('[data-param="direct"]').inputValue(), "2.4");
  assert.equal(
    await page.locator('.adjust-option input[value="M"]').isChecked(),
    false,
  );
  assert.equal(
    await page.locator("#world-tab").getAttribute("aria-selected"),
    "true",
  );
  assert.equal(await page.locator("#effects").innerText(), sandboxValues);
  assert.equal(await page.locator("#scenario-status").innerText(), "Modified");
  await page.locator("#scenario-select").selectOption("overlap");
  await page.locator("#overlap-strength").fill("2");
  await page.locator("#open-graph-lab").click();
  await page
    .getByRole("link", { name: "Return to full sandbox", exact: true })
    .click();
  assert.equal(await page.locator("#scenario-select").inputValue(), "overlap");
  assert.equal(await page.locator("#overlap-strength").inputValue(), "2");
  assert.equal(await page.locator("#scenario-status").innerText(), "Modified");
  // Reproduce the two long arrows from the reported layout issue.
  await page.goto(`${appUrl}?sandbox=graph-lab&preset=blank`);
  for (const label of ["X1", "X2"]) {
    await page.locator("#lab-new-name").fill(label);
    await page
      .getByRole("button", { name: "Add variable", exact: true })
      .click();
  }
  await connect("v1", "Y");
  await connect("v2", "Y");
  await connect("v2", "A");
  await connect("A", "Y");
  await page.getByRole("button", { name: "Auto arrange", exact: true }).click();
  const label1 = await page.locator('[data-edge="v1:Y"] text').boundingBox();
  const label2 = await page.locator('[data-edge="v2:Y"] text').boundingBox();
  assert.ok(Math.hypot(label1.x - label2.x, label1.y - label2.y) > 25);
  await page.locator('[data-edge="v1:Y"]').focus();
  await page.keyboard.press("Enter");
  await page.locator("#lab-strength").fill("-0.7");
  await page.getByLabel("Color theme").selectOption("dark");
  await page.screenshot({
    path: "artifacts/graph-lab-editor-dark.png",
    fullPage: true,
  });
  await page.goto(`${appUrl}?lesson=timing`);
  await page.locator('[name="causal-example"][value="collider"]').check();
  await page.locator("#baseline-explanation summary").click();
  await page
    .getByRole("link", {
      name: "Explore P–K–R in the Graph lab →",
      exact: true,
    })
    .click();
  assert.equal(await page.locator("#lab-preset").inputValue(), "pkr");
  assert.deepEqual(errors, []);
  console.log(
    "Graph lab browser checks passed: custom editing, estimates, invalid graphs, navigation, keyboard, themes and phone layout.",
  );
} finally {
  await browser.close();
}
