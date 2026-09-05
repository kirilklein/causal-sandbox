import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({ colorScheme: "light" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const theme = () => page.locator("html").getAttribute("data-theme");
  const snapshot = () =>
    page.evaluate(() => ({
      results: document.querySelector(".lesson-results, #effects").textContent,
      graph: document.querySelector("#lesson-graph, #dag").innerHTML,
      controls: [...document.querySelectorAll("input, select:not(#theme)")].map(
        (el) => [el.value, el.checked, el.disabled],
      ),
      sample: document
        .querySelector(".sample-note, #population")
        ?.getAttribute("aria-label"),
    }));
  await page.goto(url);
  await page.locator("#unadjusted").waitFor();
  assert.equal(await theme(), "light");
  const initial = await snapshot();
  await page.getByLabel("Color theme").selectOption("dark");
  assert.equal(await theme(), "dark");
  assert.deepEqual(await snapshot(), initial);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByLabel("Color theme").selectOption("light");
  assert.equal(await theme(), "light");
  await page.reload();
  await page.locator("#unadjusted").waitFor();
  assert.equal(await theme(), "light");
  await page.getByLabel("Color theme").selectOption("system");
  assert.equal(await theme(), "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "light",
  );
  await page.getByLabel("Color theme").selectOption("dark");
  await page.locator("#continue").click();
  assert.equal(await page.getByLabel("Color theme").inputValue(), "dark");

  // Check text and essential graphics against both palettes, including error-tint extremes.
  for (const mode of ["light", "dark"]) {
    await page.getByLabel("Color theme").selectOption(mode);
    const contrast = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      const rgb = (token) =>
        styles
          .getPropertyValue(`--${token}`)
          .trim()
          .slice(1)
          .match(/../g)
          .map((v) => parseInt(v, 16) / 255);
      const luminance = (c) =>
        c
          .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
      const ratio = (a, b) =>
        (Math.max(luminance(a), luminance(b)) + 0.05) /
        (Math.min(luminance(a), luminance(b)) + 0.05);
      const failures = [];
      const check = (fg, bg, minimum) => {
        if (ratio(rgb(fg), rgb(bg)) < minimum) failures.push(`${fg} on ${bg}`);
      };
      for (const surface of [
        "page",
        "surface",
        "surface-subtle",
        "surface-hover",
      ]) {
        for (const text of ["text", "text-secondary", "text-muted"])
          check(text, surface, 4.5);
      }
      for (const node of [
        "node-A",
        "node-C",
        "node-Y",
        "node-M",
        "node-K",
        "node-U",
      ]) {
        check("text", node, 4.5);
        check("causal-path", node, 3);
      }
      for (const line of ["truth", "fitted", "arm-0", "arm-1"])
        check(line, "surface", 3);
      for (let i = 0; i <= 10; i++) {
        const mark = rgb("estimate").map(
          (v, j) => v * (1 - i / 10) + (rgb("error-mark")[j] * i) / 10,
        );
        if (ratio(mark, rgb("surface")) < 3)
          failures.push(`estimate mark tint ${i}`);
      }
      check("on-accent", "accent", 4.5);
      check("note-text", "note-surface", 4.5);
      check("warning", "surface", 4.5);
      const dark = document.documentElement.dataset.theme === "dark";
      if (dark) check("text-secondary", "truth-surface", 4.5);
      for (let i = 0; i <= 10; i++) {
        const blend = rgb(dark ? "surface-subtle" : "page").map(
          (v, j) => v * (1 - i / 10) + (rgb("error-surface")[j] * i) / 10,
        );
        if (ratio(rgb(dark ? "text-secondary" : "text"), blend) < 4.5)
          failures.push(`error tint ${i}`);
      }
      return failures;
    });
    assert.deepEqual(contrast, [], `${mode} palette contrast`);
  }

  await page.goto(`${url}?sandbox`);
  await page.locator(".effect-row").last().waitFor();
  assert.equal(await theme(), "dark");
  const sandbox = await snapshot();
  const canvas = () => page.locator("canvas").evaluate((el) => el.toDataURL());
  const darkCanvas = await canvas();
  await page.getByLabel("Color theme").selectOption("light");
  assert.notEqual(await canvas(), darkCanvas);
  assert.deepEqual(await snapshot(), sandbox);
  await page.getByLabel("Color theme").selectOption("dark");
  assert.equal(await canvas(), darkCanvas);

  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["?level=1", "?level=5", "?level=10", "?sandbox"]) {
      await page.goto(url + path);
      await page.locator(".lesson-results, #effects").waitFor();
      assert.equal(await theme(), "dark");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} at ${width}px overflows`,
      );
      await page.screenshot({
        path: `/tmp/causal-dark-${width}-${path.slice(1).replace("=", "-")}.png`,
        fullPage: true,
      });
    }
  }
  // Denied storage must not prevent loading or changing the theme.
  const blocked = await browser.newPage({ colorScheme: "dark" });
  blocked.on("pageerror", (error) => errors.push(error.message));
  await blocked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });
  await blocked.goto(url);
  await blocked.locator("#unadjusted").waitFor();
  await blocked.getByLabel("Color theme").selectOption("light");
  assert.equal(
    await blocked.locator("html").getAttribute("data-theme"),
    "light",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Theme persistence, system preference, state preservation, canvas redraw, contrast, mobile and denied-storage checks passed.",
  );
} finally {
  await browser.close();
}
