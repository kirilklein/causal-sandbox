import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import path from "node:path";

const output = path.resolve("film/exports");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5198/?t=0");
  await page.waitForFunction(() => Boolean(window.cohortFilm));
  for (const [name, time] of [
    ["observation", 2],
    ["time", 7],
    ["split", 12],
    ["futures", 18],
    ["reveal", 26],
    ["thumbnail", 32],
  ]) {
    await page.evaluate((time) => window.cohortFilm.seek(time), time);
    const data = await page
      .locator("canvas")
      .evaluate((canvas) => canvas.toDataURL("image/png").split(",")[1]);
    await writeFile(
      path.join(output, `${name}.png`),
      Buffer.from(data, "base64"),
    );
  }
  await page.getByRole("button", { name: "Replay from beginning" }).click();
  await page.waitForTimeout(200);
  assert.ok(await page.evaluate(() => window.cohortFilm.time > 0));
  await page.getByRole("button", { name: "Pause animation" }).click();
  const paused = await page.evaluate(() => window.cohortFilm.time);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => window.cohortFilm.time), paused);
  await page.getByRole("slider").focus();
  await page.keyboard.press("End");
  assert.equal(await page.evaluate(() => window.cohortFilm.time), 32);
  await page.screenshot({ path: path.join(output, "desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({ path: path.join(output, "mobile.png") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:5198/");
  await page.waitForFunction(() => Boolean(window.cohortFilm));
  assert.equal(await page.evaluate(() => window.cohortFilm.time), 32);
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: playback, pause, keyboard seeking, mobile layout, reduced motion; no page errors.",
  );

  if (process.argv.includes("--video")) {
    const encoder = spawn(
      "ffmpeg",
      [
        "-y",
        "-f",
        "image2pipe",
        "-framerate",
        "30",
        "-vcodec",
        "mjpeg",
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        path.join(output, "causal-sandbox-two-futures.mp4"),
      ],
      { stdio: ["pipe", "ignore", "inherit"] },
    );
    const completion = once(encoder, "close");
    encoder.stdin.on("error", (error) =>
      console.error("Encoder input:", error.message),
    );
    for (let frame = 0; frame < 960; frame++) {
      const data = await page.evaluate((seconds) => {
        window.cohortFilm.seek(seconds);
        return document
          .querySelector("canvas")
          .toDataURL("image/jpeg", 0.97)
          .split(",")[1];
      }, frame / 30);
      if (!encoder.stdin.write(Buffer.from(data, "base64")))
        await once(encoder.stdin, "drain");
      if (frame % 150 === 0) console.log(`Rendered ${frame}/960 frames`);
    }
    encoder.stdin.end();
    const [code] = await completion;
    assert.equal(code, 0, "Video encoding failed");
    console.log(
      `Video saved: ${path.join(output, "causal-sandbox-two-futures.mp4")}`,
    );
  }
} finally {
  await browser.close();
}
