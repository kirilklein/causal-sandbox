// Records docs/demo.gif and docs/lessons.png against a running server.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.env.APP_URL || "http://localhost:5173/causal-sandbox/";
const videoDir = mkdtempSync(join(tmpdir(), "causal-demo-"));
const viewport = { width: 1000, height: 820 };
const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const context = await browser.newContext({
  viewport,
  recordVideo: { dir: videoDir, size: viewport },
});
const page = await context.newPage();
const pause = (ms) => page.waitForTimeout(ms);
const focusCard = () =>
  page
    .locator(".lesson-results")
    .evaluate((el) => el.scrollIntoView({ block: "end" }));

async function slide(id, from, to, step = 0.1) {
  const el = page.locator(`#${id}`);
  const box = await el.boundingBox();
  const max = Number(await el.getAttribute("max"));
  const min = Number(await el.getAttribute("min"));
  const x = (v) => box.x + ((v - min) / (max - min)) * box.width;
  await page.mouse.move(x(from), box.y + box.height / 2);
  await page.mouse.down();
  for (
    let v = from;
    to > from ? v <= to : v >= to;
    v += to > from ? step : -step
  ) {
    await page.mouse.move(x(v), box.y + box.height / 2);
    await pause(45);
  }
  await page.mouse.up();
}

await page.goto(url + "?lesson=randomization");
await page.locator("#unadjusted").waitFor();
await pause(600);
await focusCard();
await pause(800);
await page.screenshot({ path: "docs/lessons.png" });
await slide("effect", 2, 4);
await pause(700);
await slide("effect", 4, 0.5);
await pause(900);

await page.locator("#continue").click();
await page.locator("#selection").waitFor();
await pause(900);
await focusCard();
await pause(900);
await slide("selection", 0, 1.2);
await pause(1400);

await page.locator("#continue").click();
await page.locator("#reveal-ipw").waitFor();
await pause(900);
await focusCard();
await pause(900);
await page.locator("#reveal-ipw").click();
await pause(2200);

await context.close();
await browser.close();

const webm = join(
  videoDir,
  readdirSync(videoDir).find((f) => f.endsWith(".webm")),
);
const frames = join(videoDir, "frames");
execFileSync("ffmpeg", [
  "-loglevel",
  "error",
  "-i",
  webm,
  "-vf",
  "fps=12",
  "-y",
  `${frames}%04d.png`,
]);
execFileSync("gifski", [
  "--fps",
  "12",
  "--width",
  "900",
  "--quality",
  "80",
  "-o",
  "docs/demo.gif",
  ...readdirSync(videoDir)
    .filter((f) => f.startsWith("frames"))
    .sort()
    .map((f) => join(videoDir, f)),
]);
rmSync(videoDir, { recursive: true });
console.log("wrote docs/demo.gif and docs/lessons.png");
