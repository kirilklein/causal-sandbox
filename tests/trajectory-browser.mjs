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
      assert.match(
        await page.locator("#trajectory-receipt-count").innerText(),
        /7 of these 10 treated/,
      );
      assert.match(
        await page.locator("#trajectory-probability").innerText(),
        /70%/,
      );
      assert.equal(
        await page.evaluate(
          () =>
            window.trajectoryLabelBounds.filter((l) => l.text === "Treated")
              .length,
        ),
        7,
      );
      const chartLabels = await page.evaluate(() =>
        window.trajectoryLabelBounds.filter((l) => /^Patient \d/.test(l.text)),
      );
      assert.equal(
        chartLabels.length,
        10,
        "ten individual charts at the same severity",
      );
      assert.equal(chartLabels.filter((l) => /keep/.test(l.text)).length, 1);
      await page.screenshot({
        path: "/tmp/trajectory-frequency-desktop.png",
        fullPage: true,
      });
      await page.locator("#trajectory-severity").focus();
      await page.keyboard.press("End");
      assert.match(
        await page.locator("#trajectory-receipt-count").innerText(),
        /9 of these 10 treated/,
      );
      await page.locator("#trajectory-selection").focus();
      await page.keyboard.press("Home");
      assert.equal(
        await page.evaluate(
          () =>
            window.trajectoryLabelBounds.filter((l) => l.text === "Treated")
              .length,
        ),
        5,
      );
      assert.match(
        await page.locator("#trajectory-probability").innerText(),
        /50%/,
      );
      await page.keyboard.press("End");
    }
    if (scene === 3) {
      assert.equal(
        await page.locator("#trajectory-severity").inputValue(),
        "9",
      );
      assert.match(
        await page.locator("#trajectory-probability").innerText(),
        /90%/,
      );
      assert.equal(
        await page.locator("#trajectory-receipt").isVisible(),
        false,
      );
      assert.equal(
        await page.evaluate(
          () =>
            window.trajectoryLabelBounds.filter((l) =>
              /^Patient \d/.test(l.text),
            ).length,
        ),
        0,
      );
      const probability = await page
        .locator("#trajectory-probability")
        .innerText();
      await page.locator("#trajectory-prognosis").focus();
      await page.keyboard.press("Home");
      assert.equal(
        await page.locator("#trajectory-prognosis-value").innerText(),
        "0%",
      );
      assert.equal(
        await page.locator("#trajectory-probability").innerText(),
        probability,
      );
      assert.match(
        await page.locator("#trajectory-description").innerText(),
        /no effect on either health path/,
      );
      const zeroLabels = await page.evaluate(() =>
        window.trajectoryLabelBounds.map((l) => l.text),
      );
      assert.ok(zeroLabels.includes("Treated · 90.0"));
      assert.ok(zeroLabels.includes("Untreated · 78.0"));
      assert.ok(zeroLabels.includes("+12"));
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      const halfLabels = await page.evaluate(() =>
        window.trajectoryLabelBounds.map((l) => l.text),
      );
      assert.ok(halfLabels.includes("Treated · 66.0"));
      assert.ok(halfLabels.includes("Untreated · 54.0"));
      await page.keyboard.press("End");
      await page.screenshot({
        path: "/tmp/trajectory-collapse-desktop.png",
        fullPage: true,
      });
    }
    if (scene === 4) {
      assert.equal(
        await page.locator("#trajectory-orbit-controls").isVisible(),
        true,
      );
      const canvas = page.locator("#trajectory-canvas");
      const original = await canvas.evaluate((n) => n.toDataURL());
      await canvas.focus();
      await page.keyboard.press("ArrowRight");
      assert.notEqual(
        await canvas.evaluate((n) => n.toDataURL()),
        original,
        "rotation works as soon as severity unfolds",
      );
      await page.keyboard.press("Home");
      assert.equal(await canvas.evaluate((n) => n.toDataURL()), original);
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        box.x + box.width / 2 + 80,
        box.y + box.height / 2 + 20,
        { steps: 6 },
      );
      await page.mouse.up();
      assert.notEqual(
        await canvas.evaluate((n) => n.toDataURL()),
        original,
        "drag works in the first landscape",
      );
      await page.locator("#trajectory-reset-view").click();
      await page.screenshot({
        path: "/tmp/trajectory-unfold-desktop.png",
        fullPage: true,
      });
    }
    if (scene === 5) {
      assert.match(
        await page.locator("#trajectory-reading").innerText(),
        /−8.3 points/,
      );
      await page.locator("#trajectory-selection").focus();
      await page.keyboard.press("Home");
      assert.match(
        await page.locator("#trajectory-reading").innerText(),
        /\+14.2 points/,
      );
      assert.match(
        await page.locator("#trajectory-description").innerText(),
        /different severity mixes/,
      );
      await page.locator("#trajectory-prognosis").focus();
      await page.keyboard.press("Home");
      assert.match(
        await page.locator("#trajectory-reading").innerText(),
        /\+12.0 points/,
      );
      assert.match(
        await page.locator("#trajectory-description").innerText(),
        /regardless of who receives treatment/,
      );
      await page.locator("#trajectory-selection").focus();
      await page.keyboard.press("End");
      assert.match(
        await page.locator("#trajectory-reading").innerText(),
        /\+12.0 points/,
      );
      await page.locator("#trajectory-prognosis").focus();
      await page.keyboard.press("End");
      assert.match(
        await page.locator("#trajectory-reading").innerText(),
        /−8.3 points/,
      );
      await page.keyboard.press("End");
    }
    if (scene === 6) {
      await page.locator("#trajectory-prognosis").focus();
      await page.keyboard.press("Home");
      assert.match(
        await page.locator("#trajectory-reading").innerText(),
        /same patient.*two simulated outcomes/,
      );
    }
    await page.locator("#trajectory-next").click();
  }
  assert.equal(await page.locator("#trajectory-severity").inputValue(), "7");
  assert.equal(await page.locator("#trajectory-prognosis").inputValue(), "100");
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
    if (scene === 2)
      await page.screenshot({
        path: "/tmp/trajectory-frequency-mobile.png",
        fullPage: true,
      });
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
  await page.locator("#trajectory-prognosis").focus();
  await page.keyboard.press("Home");
  assert.equal(
    await page.locator("#trajectory-prognosis-value").innerText(),
    "0%",
  );
  await page.screenshot({
    path: "/tmp/trajectory-no-prognosis-mobile.png",
    fullPage: true,
  });
  await page.keyboard.press("End");
  const reading = await page.locator("#trajectory-reading").innerText();
  assert.equal(await page.locator("#trajectory-receipt").isVisible(), false);
  assert.equal(
    await page.locator("#trajectory-show-counterfactuals").isChecked(),
    true,
  );
  const canvas = page.locator("#trajectory-canvas");
  const pixels = () => canvas.evaluate((n) => n.toDataURL());
  const original = await pixels();
  await canvas.scrollIntoViewIfNeeded();
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
  await page.locator("#trajectory-show-counterfactuals").uncheck();
  assert.notEqual(await pixels(), original);
  const hiddenLabels = await page.evaluate(() =>
    window.trajectoryLabelBounds.map((l) => l.text),
  );
  assert.ok(
    !hiddenLabels.includes("+12"),
    "no paired gap annotation when the alternative is hidden",
  );
  assert.ok(
    !hiddenLabels.some((l) => /^Untreated ·/.test(l)),
    "hidden counterfactual has no endpoint label",
  );
  await page.locator("#trajectory-show-counterfactuals").check();
  assert.equal(await pixels(), original);
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
      for (let i = 0; i < 24; i++) await page.keyboard.press(horizontal);
      for (let i = 0; i < 20; i++) await page.keyboard.press(vertical);
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
    await page.locator("#trajectory-orbit-controls").isVisible(),
    true,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/trajectory-unfold-mobile.png",
    fullPage: true,
  });
  // Earlier narration follows the actual retained patient after changing severity.
  await page.locator('[data-chapter="3"]').click();
  await page.locator("#trajectory-severity").focus();
  await page.keyboard.press("Home");
  await page.locator('[data-chapter="1"]').click();
  assert.match(
    await page.locator("#trajectory-description").innerText(),
    /solid blue path remains their observed course/,
  );
  // Exercise the expansion and collapse with motion as well as reduced motion.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator('[data-chapter="2"]').click();
  await page
    .locator("#trajectory-pause")
    .waitFor({ state: "hidden", timeout: 5000 });
  await page.locator("#trajectory-next").click();
  await page
    .locator("#trajectory-pause")
    .waitFor({ state: "hidden", timeout: 5000 });
  assert.equal(
    await page.evaluate(
      () =>
        window.trajectoryLabelBounds.filter((l) => /^Patient \d/.test(l.text))
          .length,
    ),
    0,
  );
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
    "Trajectory story: frequency before collapse/unfold, ten retained profiles, mouse/touch/keyboard rotation, label bounds, counterfactual toggle, view reset, pause/resume and mobile checks passed.",
  );
} finally {
  await browser.close();
}
