import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*.goatcounter.com/**", (r) =>
    r.fulfill({ contentType: "application/json", body: '{"count":"0"}' }),
  );
  await page.route("**/gc.zgo.at/count.js", (r) =>
    r.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.addInitScript(() => {
    const proto = CanvasRenderingContext2D.prototype;
    const clear = proto.clearRect,
      write = proto.fillText;
    proto.clearRect = function (...args) {
      if (this.canvas.id === "trajectory-canvas")
        window.trajectoryLabelBounds = [];
      return clear.apply(this, args);
    };
    proto.fillText = function (text, x, y, ...args) {
      if (this.canvas.id === "trajectory-canvas" && this.globalAlpha > 0.01) {
        const m = this.measureText(text);
        window.trajectoryLabelBounds.push({
          text,
          left: x - m.actualBoundingBoxLeft,
          right: x + m.actualBoundingBoxRight,
          top: y - m.actualBoundingBoxAscent,
          bottom: y + m.actualBoundingBoxDescent,
        });
      }
      return write.call(this, text, x, y, ...args);
    };
  });
  await page.goto(`${url}?lesson=introduction`);
  await page
    .getByRole("link", {
      name: "Explore patient trajectories: an interactive causal story →",
    })
    .click();
  await page.locator("#trajectory-next").waitFor();
  assert.match(
    await page.locator("#trajectory-frame-label").innerText(),
    /DAY 12/,
  );
  assert.equal(await page.locator("#trajectory-pause").isVisible(), false);
  for (let scene = 0; scene < 7; scene++) {
    assert.equal(
      await page.locator('[aria-current="step"]').getAttribute("data-chapter"),
      String(scene),
    );
    assert.equal(
      await page.locator("#trajectory-canvas").getAttribute("data-scene"),
      String(scene),
    );
    if (scene === 2) {
      await page.locator("#trajectory-severity").focus();
      await page.keyboard.press("End");
      assert.match(
        await page.locator("#trajectory-reading").innerText(),
        /Selected severity 9/,
      );
    }
    if (scene === 3) {
      assert.equal(
        await page.locator("#trajectory-severity").inputValue(),
        "9",
      );
      await page.screenshot({
        path: "/tmp/trajectory-unfold-desktop.png",
        fullPage: true,
      });
    }
    if (scene === 5) {
      assert.match(
        await page.locator("#trajectory-reading").innerText(),
        /−2.9 points/,
      );
      await page.locator("#trajectory-selection").focus();
      await page.keyboard.press("Home");
      assert.match(
        await page.locator("#trajectory-reading").innerText(),
        /\+12.0 points/,
      );
      assert.match(
        await page.locator("#trajectory-description").innerText(),
        /same severity mix/,
      );
      await page.keyboard.press("End");
    }
    if (scene === 6)
      assert.match(
        await page.locator("#trajectory-reading").innerText(),
        /66 treated − 54 untreated = \+12/,
      );
    await page.locator("#trajectory-next").click();
  }
  assert.equal(await page.locator("#trajectory-severity").inputValue(), "5");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator("#trajectory-replay").click();
  await page.locator("#trajectory-pause").click();
  const paused = await page.locator("#trajectory-frame-label").innerText();
  await page.waitForTimeout(350);
  assert.equal(
    await page.locator("#trajectory-frame-label").innerText(),
    paused,
  );
  await page.locator("#trajectory-pause").click();
  await page
    .locator("#trajectory-pause")
    .waitFor({ state: "hidden", timeout: 10000 });
  await page.locator("#trajectory-next").click();
  await page
    .locator("#trajectory-pause")
    .waitFor({ state: "hidden", timeout: 7000 });
  assert.match(
    await page.locator("#trajectory-reading").innerText(),
    /\+12 points/,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  for (let scene = 0; scene < 7; scene++) {
    await page.locator(`[data-chapter="${scene}"]`).click();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow scene ${scene}`,
    );
  }
  await page.locator('[data-chapter="6"]').click();
  await page.locator("#trajectory-severity").focus();
  await page.keyboard.press("End");
  const reading = await page.locator("#trajectory-reading").innerText();
  assert.match(
    await page.locator("#trajectory-receipt-count").innerText(),
    /9 of 10 treated/,
  );
  assert.equal(await page.locator(".trajectory-receipt-person").count(), 10);
  assert.equal(
    await page.locator(".receipt-dot.world-treated.is-factual").count(),
    9,
  );
  assert.equal(
    await page.locator("#trajectory-show-counterfactuals").isChecked(),
    false,
  );
  assert.equal(await page.locator(".receipt-dot.is-counterfactual").count(), 0);
  const canvas = page.locator("#trajectory-canvas");
  const pixels = () => canvas.evaluate((n) => n.toDataURL());
  const original = await pixels();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 75,
    box.y + box.height / 2 + 30,
    { steps: 8 },
  );
  await page.mouse.up();
  assert.notEqual(await pixels(), original, "drag rotates the scene");
  assert.equal(await page.locator("#trajectory-reading").innerText(), reading);
  await page.locator("#trajectory-reset-view").click();
  assert.equal(await pixels(), original, "reset restores the same projection");
  await canvas.focus();
  await page.keyboard.press("ArrowLeft");
  assert.notEqual(await pixels(), original, "keyboard rotation works");
  await page.keyboard.press("Home");
  assert.equal(await pixels(), original);
  await page.locator("#trajectory-show-counterfactuals").check();
  assert.equal(
    await page.locator(".receipt-dot.is-counterfactual").count(),
    10,
  );
  assert.notEqual(await pixels(), original);
  await page.locator("#trajectory-show-counterfactuals").uncheck();
  assert.equal(await pixels(), original);
  await page.locator("#trajectory-selection").focus();
  await page.keyboard.press("Home");
  assert.equal(
    await page.locator(".receipt-dot.world-treated.is-factual").count(),
    5,
  );
  assert.equal(
    await page.locator(".receipt-dot.world-untreated.is-factual").count(),
    5,
  );
  await page.keyboard.press("End");
  assert.equal(
    await page.locator(".receipt-dot.world-treated.is-factual").count(),
    9,
  );
  await canvas.scrollIntoViewIfNeeded();
  const touchBox = await canvas.boundingBox();
  const cdp = await page.context().newCDPSession(page);
  const touch = {
    x: touchBox.x + touchBox.width / 2,
    y: touchBox.y + touchBox.height / 2,
  };
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touch],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: touch.x + 50, y: touch.y + 20 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  assert.notEqual(await pixels(), original, "touch drag rotates");
  assert.equal(
    await canvas.evaluate((n) => n.classList.contains("is-dragging")),
    false,
    "cancel releases dragging",
  );
  await cdp.detach();
  await page.locator("#trajectory-reset-view").click();
  for (const horizontal of ["ArrowLeft", "ArrowRight"])
    for (const vertical of ["ArrowUp", "ArrowDown"]) {
      await canvas.focus();
      await page.keyboard.press("Home");
      for (let i = 0; i < 12; i++) await page.keyboard.press(horizontal);
      for (let i = 0; i < 7; i++) await page.keyboard.press(vertical);
      const clipped = await page.evaluate(() => {
        const canvas = document.getElementById("trajectory-canvas");
        return window.trajectoryLabelBounds.filter(
          (b) =>
            b.left < 0 ||
            b.right > canvas.clientWidth ||
            b.top < 0 ||
            b.bottom > canvas.clientHeight,
        );
      });
      assert.deepEqual(
        clipped,
        [],
        `labels remain inside canvas at ${horizontal}, ${vertical}`,
      );
      assert.equal(
        await page.locator("#trajectory-reading").innerText(),
        reading,
      );
    }
  await page.screenshot({
    path: "/tmp/trajectory-rotated-mobile.png",
    fullPage: true,
  });
  await page.locator("#trajectory-reset-view").click();
  await page.screenshot({
    path: "/tmp/trajectory-final-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({
    path: "/tmp/trajectory-final-desktop.png",
    fullPage: true,
  });
  await page.locator('[data-chapter="4"]').click();
  assert.equal(
    await page.locator(".receipt-dot.is-counterfactual").count(),
    10,
  );
  await page.screenshot({
    path: "/tmp/trajectory-selection-desktop.png",
    fullPage: true,
  });
  assert.equal(
    await page.locator("#trajectory-orbit-controls").isVisible(),
    false,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-chapter="3"]').click();
  await page.screenshot({
    path: "/tmp/trajectory-unfold-mobile.png",
    fullPage: true,
  });
  await page
    .locator('.trajectory-header a[href="?lesson=confounding"]')
    .click();
  await page
    .locator('.optional-preview a[href="?lesson=trajectory-landscape"]')
    .click();
  assert.equal(
    await page.locator('[aria-current="step"]').getAttribute("data-chapter"),
    "0",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Trajectory story: seven scenes, 10-slice selection, mouse/touch/keyboard rotation, label bounds, counterfactual toggle, view reset, pause/resume and mobile checks passed.",
  );
} finally {
  await browser.close();
}
