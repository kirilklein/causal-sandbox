import { chromium } from "@playwright/test";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import path from "node:path";
import { DURATION, SOCIAL_DURATION } from "./model.js";

const gif = process.argv.includes("--gif");
const fps = gif ? 20 : 60;
const url = process.env.FILM_URL || "http://127.0.0.1:5198/";
const social = process.argv.includes("--social") || gif;

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
  await page.goto(`${url}?t=0`);
  await page.waitForFunction(() => Boolean(window.cohortFilm));
  const poster = await page.evaluate((duration) => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;
    window.cohortFilm.render(canvas, duration);
    return canvas.toDataURL("image/webp", 0.85).split(",")[1];
  }, DURATION);
  await writeFile(
    path.join(output, "poster.webp"),
    Buffer.from(poster, "base64"),
  );
  for (const [name, time] of [
    ["observation", 0],
    ["time", 2],
    ["split", 5],
    ["futures", 9],
    ["reveal", 16],
    ["thumbnail", DURATION],
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
  assert.equal(await page.evaluate(() => window.cohortFilm.time), DURATION);
  await page.screenshot({ path: path.join(output, "desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({ path: path.join(output, "mobile.png") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.cohortFilm));
  assert.equal(await page.evaluate(() => window.cohortFilm.time), DURATION);
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: playback, pause, keyboard seeking, mobile layout, reduced motion; no page errors.",
  );

  if (process.argv.includes("--video") || social) {
    const filename = gif
      ? "intro.gif"
      : social
        ? "causal-sandbox-social-silent.mp4"
        : "causal-sandbox-two-futures.mp4";
    const destination = gif
      ? path.resolve("docs", filename)
      : path.join(output, filename);
    if (gif) {
      await page.locator("canvas").evaluate((canvas) => {
        canvas.width = 800;
        canvas.height = 450;
      });
    }
    const temporary = path.join(output, `rendering-${filename}`);
    const encoder = spawn(
      "ffmpeg",
      [
        "-y",
        "-hide_banner",
        "-loglevel",
        "warning",
        "-f",
        "image2pipe",
        "-framerate",
        String(fps),
        "-vcodec",
        gif ? "png" : "mjpeg",
        "-i",
        "-",
        ...(gif
          ? [
              "-filter_complex",
              "split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
              "-loop",
              "0",
            ]
          : [
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
            ]),
        temporary,
      ],
      { stdio: ["pipe", "ignore", "inherit"] },
    );
    const completion = once(encoder, "close");
    encoder.stdin.on("error", (error) =>
      console.error("Encoder input:", error.message),
    );
    const frames = (social ? SOCIAL_DURATION : DURATION) * fps;
    for (let frame = 0; frame < frames; frame++) {
      const data = await page.evaluate(
        ({ seconds, gif }) => {
          const canvas = document.querySelector("canvas");
          window.cohortFilm.render(canvas, seconds);
          return canvas
            .toDataURL(gif ? "image/png" : "image/jpeg", 0.97)
            .split(",")[1];
        },
        { seconds: frame / fps, gif },
      );
      if (!encoder.stdin.write(Buffer.from(data, "base64")))
        await once(encoder.stdin, "drain");
      if (frame % 300 === 0) console.log(`Rendered ${frame}/${frames} frames`);
    }
    encoder.stdin.end();
    const [code] = await completion;
    assert.equal(code, 0, "Media encoding failed");
    assert.deepEqual(errors, []);
    await rename(temporary, destination);
    console.log(`Media saved: ${destination}`);
  }
} finally {
  await browser.close();
}
