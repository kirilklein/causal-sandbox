import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const appUrl = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "doNotTrack", { value: "0" });
    Object.defineProperty(navigator, "globalPrivacyControl", { value: false });
    Object.defineProperty(navigator, "webdriver", { value: false });
    Object.defineProperty(window, "doNotTrack", { value: "0" });
    if (navigator.userAgentData) {
      // PostHog's bot filter reads User-Agent Client Hints too.
      Object.defineProperty(navigator, "userAgentData", {
        value: {
          brands: [{ brand: "Chromium", version: "140" }],
          mobile: false,
          platform: "macOS",
        },
      });
    }
  });
  const requests = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://analytics.invalid/**", async (route) => {
    requests.push({
      url: route.request().url(),
      body: route.request().postDataBuffer(),
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
  await page.route("**/*.goatcounter.com/**", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"count":"0"}' }),
  );
  await page.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );

  await page.goto(
    `${appUrl}?private=do-not-send&utm_source=linkedin&utm_medium=social&utm_term=private&utm_content=private%40example.com`,
  );
  await page.waitForTimeout(500);
  assert.equal(
    requests.length,
    0,
    "the introduction should not contact PostHog",
  );

  const eventRequest = page.waitForRequest("https://analytics.invalid/**");
  await page.getByRole("link", { name: "Learn", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("#try-prediction"));
  const request = await eventRequest;
  assert.deepEqual(errors, []);
  assert.match(request.url(), /\/e\//);
  const body = gunzipSync(request.postDataBuffer()).toString();
  const lessonEvent = JSON.parse(body).batch[0];
  assert.doesNotMatch(body, /private|do-not-send|current_url|referrer/);
  assert.equal(lessonEvent.event, "lesson_started");
  assert.equal(lessonEvent.properties.$geoip_disable, true);
  assert.equal(lessonEvent.properties.utm_source, "linkedin");
  assert.equal(lessonEvent.properties.utm_medium, "social");
  assert.equal(
    (await page.context().cookies()).filter((cookie) =>
      cookie.name.startsWith("ph_"),
    ).length,
    0,
  );
  const startsBefore = requests.length;
  await page.locator("#restart").click();
  await page.waitForTimeout(300);
  assert.equal(
    requests.length,
    startsBefore,
    "restart should not count another start",
  );

  const advanced = page.waitForRequest("https://analytics.invalid/**");
  await page.locator("#continue").click();
  assert.equal(
    JSON.parse(gunzipSync((await advanced).postDataBuffer()).toString())
      .batch[0].event,
    "lesson_advanced",
  );
  for (const [source, content, expectedContent] of [
    ["reddit", "causal_inference", "causal_inference"],
    ["reddit", "r_projects", "r_projects"],
    ["reddit", "r_stats", "r_stats"],
    ["linkedin", "LinkedIn_Post_2", "linkedin_post_2"],
    ["linkedin", "a".repeat(64), "a".repeat(64)],
    ["reddit", "a".repeat(65), undefined],
    ["reddit", "invalid label", undefined],
  ]) {
    await page.goto(
      `${appUrl}?utm_source=${source}&utm_medium=social&utm_campaign=launch&utm_content=${encodeURIComponent(content)}`,
    );
    const postStart = page.waitForRequest("https://analytics.invalid/**");
    await page.getByRole("link", { name: "Learn", exact: true }).click();
    const postPayload = JSON.parse(
      gunzipSync((await postStart).postDataBuffer()).toString(),
    ).batch[0];
    assert.equal(postPayload.event, "lesson_started");
    assert.equal(postPayload.properties.utm_source, source);
    assert.equal(postPayload.properties.utm_medium, "social");
    assert.equal(postPayload.properties.utm_content, expectedContent);
    assert.equal(postPayload.properties.utm_campaign, undefined);

    const postAdvance = page.waitForRequest("https://analytics.invalid/**");
    await page.locator("#continue").click();
    const advancePayload = JSON.parse(
      gunzipSync((await postAdvance).postDataBuffer()).toString(),
    ).batch[0];
    assert.equal(advancePayload.event, "lesson_advanced");
    assert.equal(advancePayload.properties.utm_source, source);
    assert.equal(advancePayload.properties.utm_content, expectedContent);
  }
  await page.goto(`${appUrl}?sandbox`);
  await page.getByRole("tab", { name: "World", exact: true }).click();
  const sliderEvent = page.waitForRequest("https://analytics.invalid/**");
  await page.locator('[data-param="direct"]').evaluate((slider) => {
    slider.value = "3";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const sliderPayload = JSON.parse(
    gunzipSync((await sliderEvent).postDataBuffer()).toString(),
  ).batch[0];
  assert.equal(sliderPayload.event, "sandbox_parameter_changed");
  assert.equal(sliderPayload.properties.control, "direct");

  await page.route("https://github.com/kirilklein/causal-sandbox", (route) =>
    route.fulfill({ contentType: "text/html", body: "GitHub" }),
  );
  const githubEvent = page.waitForRequest("https://analytics.invalid/**");
  await page.getByRole("link", { name: "GitHub source" }).click();
  await page.waitForURL("https://github.com/kirilklein/causal-sandbox");
  const githubBody = gunzipSync(
    (await githubEvent).postDataBuffer(),
  ).toString();
  assert.match(githubBody, /github_clicked/);
  const recapStart = page.waitForRequest("https://analytics.invalid/**");
  await page.goto(`${appUrl}?lesson=leaving-the-sandbox`);
  await recapStart;
  const recapAdvance = page.waitForRequest("https://analytics.invalid/**");
  await page.locator("#recap-exit").click();
  const recapPayload = JSON.parse(
    gunzipSync((await recapAdvance).postDataBuffer()).toString(),
  ).batch[0];
  assert.equal(recapPayload.event, "lesson_advanced");
  assert.equal(recapPayload.properties.lesson, "leaving-the-sandbox");

  const stalled = await browser.newPage();
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await stalled.route("**/assets/module-*.js", async (route) => {
    await held;
    await route.abort();
  });
  await stalled.route("https://github.com/kirilklein/causal-sandbox", (route) =>
    route.fulfill({ contentType: "text/html", body: "GitHub" }),
  );
  await stalled.goto(appUrl);
  await stalled.getByRole("link", { name: "GitHub source" }).click();
  await stalled.waitForURL("https://github.com/kirilklein/causal-sandbox", {
    timeout: 5000,
  });
  release();
  await stalled.close();
  console.log("PostHog lazy load and URL privacy checks passed.");
} finally {
  await browser.close();
}
