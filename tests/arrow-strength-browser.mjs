import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import {
  arrowStrengthSimulation,
  cancellationDirectEffect,
} from "../src/arrow-strength-simulation.js";

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
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*.goatcounter.com/**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ count: "0" }),
    }),
  );
  await page.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );

  await page.goto(`${url}?lesson=instrument-hidden-confounding`);
  await page
    .getByRole("link", { name: "How strong is a causal arrow?" })
    .click();
  await page.locator("#direct-truth").waitFor();
  assert.equal(
    new URL(page.url()).searchParams.get("lesson"),
    "arrow-strength",
  );
  assert.equal(
    await page.locator("h1").innerText(),
    "How strong is a causal arrow?",
  );
  assert.equal(await page.locator(".intro a").count(), 2);
  assert.equal(await page.getByLabel("Z → A strength").inputValue(), "2");
  assert.equal(await page.getByLabel("Z → Y direct effect").inputValue(), "0");
  assert.equal(await page.locator("#direct-truth").textContent(), "0.000");
  assert.equal(
    await page.locator("#pure").getAttribute("aria-pressed"),
    "true",
  );

  const sample = await page.locator("#sample").textContent();
  const initialEstimates = await page.locator("#effect-estimates").innerText();
  await page.getByRole("button", { name: "Paths cancel" }).click();
  const directEffect = cancellationDirectEffect(2);
  const expected = arrowStrengthSimulation({ directEffect });
  assert.ok(
    Math.abs(
      Number(await page.getByLabel("Z → Y direct effect").inputValue()) -
        directEffect,
    ) < 0.01,
  );
  assert.equal(await page.locator("#direct-truth").textContent(), "-0.699");
  assert.equal(await page.locator("#z-total").textContent(), "0.000");
  assert.equal(
    await page.locator("#z-association").textContent(),
    expected.zAssociation.toFixed(3),
  );
  assert.match(
    await page.locator("#interpretation").innerText(),
    /near zero even though the Z → Y arrow is real/,
  );
  assert.equal(
    await page.locator("#cancel").getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(await page.locator("#sample").textContent(), sample);
  assert.notEqual(
    await page.locator("#effect-estimates").innerText(),
    initialEstimates,
  );
  const displayed = await page
    .locator("#effect-estimates .comparison-value strong")
    .allTextContents();
  assert.deepEqual(
    displayed,
    [3, 2, 4].flatMap((index) =>
      expected.fits.map((fit) => fit.values[index].toFixed(3)),
    ),
  );

  await page.locator("#study-detail summary").click();
  await page.getByRole("button", { name: "Run 200 studies" }).click();
  await page.getByRole("button", { name: "Run another 200 studies" }).waitFor();
  assert.match(await page.locator("#study-progress").innerText(), /complete/);
  assert.ok(
    Math.abs(
      Number(await page.locator(".study-association strong").textContent()),
    ) < 0.02,
  );
  assert.match(
    await page.locator("#study-results").innerText(),
    /Seeds 100–299/,
  );

  await page.getByLabel("Z → A strength").fill("0");
  assert.equal(await page.locator("#study-results").innerText(), "");
  assert.equal(await page.locator("#sample").textContent(), sample);
  assert.match(
    await page.locator("#interpretation").innerText(),
    /not an instrument/,
  );
  await page.getByRole("button", { name: "Pure instrument" }).click();
  assert.equal(await page.getByLabel("Z → A strength").inputValue(), "2");
  await page.getByLabel("Z → A strength").fill("1");
  await page.getByLabel("Z → Y direct effect").fill("0.2");
  assert.match(
    await page.locator("#interpretation").innerText(),
    /violates the exclusion restriction/,
  );
  await page.getByRole("button", { name: "Redraw sample" }).click();
  assert.match(await page.locator("#sample").innerText(), /sample 4218/);
  await page.getByRole("button", { name: "Restart lesson" }).click();
  assert.equal(await page.getByLabel("Z → A strength").inputValue(), "2");
  assert.equal(await page.getByLabel("Z → Y direct effect").inputValue(), "0");
  assert.match(await page.locator("#sample").innerText(), /sample 4217/);

  assert.equal(await page.locator(".reading-list a").count(), 5);
  assert.match(
    await page.locator(".reading-list a").first().getAttribute("href"),
    /stacks\.cdc\.gov/,
  );
  await page.getByLabel("Color theme").selectOption("dark");
  await page.setViewportSize({ width: 320, height: 850 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page
    .locator(".panel")
    .screenshot({ path: "/tmp/arrow-strength-mobile-dark.png" });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.getByLabel("Color theme").selectOption("light");
  await page.getByRole("button", { name: "Paths cancel" }).click();
  await page
    .locator(".panel")
    .screenshot({ path: "/tmp/arrow-strength-desktop.png" });
  assert.deepEqual(errors, []);
  console.log("Arrow-strength lesson browser checks passed.");
} finally {
  await browser.close();
}
