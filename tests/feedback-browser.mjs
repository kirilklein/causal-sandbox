import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const url = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const errors = [];
  const submissions = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let responseStatus = 200;
  let offline = false;
  let release;
  await page.route("https://formspree.io/**", async (route) => {
    const request = route.request();
    submissions.push({ body: request.postData(), headers: request.headers() });
    if (release) await new Promise((resolve) => (release = resolve));
    if (offline) return route.abort("failed");
    await route.fulfill({
      status: responseStatus,
      contentType: "application/json",
      body: JSON.stringify(
        responseStatus === 200
          ? { ok: true }
          : { errors: [{ message: "<script>bad()</script>" }] },
      ),
    });
  });
  await page.goto(
    `${url}?lesson=randomization&private=do-not-send#private-fragment`,
  );
  await page.locator(".site-footer").waitFor();
  const open = page.getByRole("button", { name: "Give feedback", exact: true });
  if (
    process.env.FEEDBACK_DISABLED === "1" ||
    (!(await open.count()) && !process.env.CI)
  ) {
    await expect(open).toHaveCount(0);
    assert.equal(submissions.length, 0);
    console.log("Unconfigured feedback stays hidden.");
  } else {
    const dialog = page.getByRole("dialog", { name: "Give feedback" });
    const message = page.getByLabel("Your message", { exact: true });
    const send = page.getByRole("button", {
      name: "Send feedback",
      exact: true,
    });
    const status = page.locator(".feedback-status");
    await open.click();
    await expect(message).toBeFocused();
    await message.fill("   ");
    await send.click();
    assert.equal(submissions.length, 0);
    await message.fill("<b>A useful suggestion</b>");
    await page.getByLabel("Email", { exact: false }).fill("invalid");
    await send.click();
    assert.equal(submissions.length, 0);
    await page.getByLabel("Email", { exact: false }).fill("");
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(open).toBeFocused();
    await open.press("Enter");
    await expect(message).toHaveValue("<b>A useful suggestion</b>");
    await page.locator(".feedback-close").focus();
    await page.keyboard.press("Shift+Tab");
    await expect(send).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator(".feedback-close")).toBeFocused();

    responseStatus = 429;
    await send.click();
    await expect(status).toContainText("try again later");
    await expect(message).toHaveValue("<b>A useful suggestion</b>");
    responseStatus = 500;
    await send.click();
    await expect(status).toContainText("couldn’t be sent");
    assert.equal(await status.locator("script").count(), 0);
    offline = true;
    await send.click();
    await expect(status).toContainText("couldn’t be confirmed");
    await expect(message).toHaveValue("<b>A useful suggestion</b>");
    offline = false;
    responseStatus = 200;
    release = true;
    const before = submissions.length;
    await send.click();
    await expect(page.getByRole("button", { name: "Sending…" })).toBeDisabled();
    await page.waitForFunction(
      () => document.querySelector(".feedback-dialog fieldset").disabled,
    );
    // A programmatic second submit must also be ignored while delivery is pending.
    await page
      .locator(".feedback-dialog form")
      .evaluate((form) =>
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
      );
    await expect.poll(() => submissions.length).toBe(before + 1);
    release();
    release = undefined;
    await expect(status).toContainText("Your feedback has been sent");
    await expect(message).toHaveValue("");
    assert.equal(submissions.length, before + 1);
    const submission = submissions.at(-1);
    assert.match(submission.body, /name="message"/);
    assert.match(submission.body, /<b>A useful suggestion<\/b>/);
    assert.match(submission.body, /name="context"/);
    assert.match(submission.body, /name="_gotcha"/);
    assert.doesNotMatch(
      submission.body,
      /name="email"|do-not-send|private-fragment|gmail\.com/,
    );
    assert.equal(submission.headers.referer, undefined);
    assert.equal(submission.headers.cookie, undefined);
    await page.getByRole("button", { name: "Close feedback" }).click();
    await open.click();
    await expect(send).toBeEnabled();
    await expect(status).toBeEmpty();
    await message.fill("Please clarify this step.");
    await page.getByLabel("Email", { exact: false }).fill("reader@example.org");
    await send.click();
    await expect(status).toContainText("Your feedback has been sent");
    assert.match(submissions.at(-1).body, /reader@example.org/);

    for (const path of [
      "?lesson=confounding",
      "?sandbox",
      "?sandbox=graph-lab",
      "glossary/",
      "methodology/",
    ]) {
      await page.goto(url + path);
      await open.click();
      const heading = await page.locator("h1").first().textContent();
      await expect(page.locator(".feedback-context span")).toHaveText(
        heading.trim(),
      );
      await page.keyboard.press("Escape");
    }
    await page.goto(`${url}?lesson=randomization`);
    for (const theme of ["light", "dark"]) {
      await page.getByLabel("Color theme").selectOption(theme);
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await open.click();
        await message.fill(
          "I liked changing the treatment effect. Could you explain the outcome scale?",
        );
        const box = await dialog.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width);
        assert.ok(
          await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
        );
        await page.screenshot({
          path: `/tmp/causal-feedback-${theme}-${width}.png`,
        });
        await page.keyboard.press("Escape");
      }
    }
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 700 },
      isMobile: true,
      hasTouch: true,
    });
    await mobile.goto(`${url}?lesson=randomization`);
    await mobile
      .getByRole("button", { name: "Give feedback", exact: true })
      .tap();
    await expect(mobile.getByRole("dialog")).toBeVisible();
    await mobile.getByRole("button", { name: "Close feedback" }).tap();
    await expect(mobile.getByRole("dialog")).not.toBeVisible();
    console.log(
      "Feedback success, failures, drafts, duplicate protection, payload privacy, routes, keyboard, themes, mobile and touch checks passed.",
    );
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
