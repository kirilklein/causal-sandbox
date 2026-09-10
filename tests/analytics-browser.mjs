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
  await page.route("https://eu.i.posthog.com/**", async (route) => {
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

  await page.goto(`${appUrl}?private=do-not-send`);
  await page.waitForTimeout(500);
  assert.equal(
    requests.length,
    0,
    "the introduction should not contact PostHog",
  );

  const eventRequest = page.waitForRequest("https://eu.i.posthog.com/**");
  await page.goto(`${appUrl}?lesson=randomization&private=do-not-send`);
  await page.waitForFunction(() => document.querySelector("#try-prediction"));
  const request = await eventRequest;
  assert.deepEqual(errors, []);
  assert.match(request.url(), /\/e\//);
  const body = gunzipSync(request.postDataBuffer()).toString();
  const lessonEvent = JSON.parse(body).batch[0];
  assert.doesNotMatch(body, /private|do-not-send|current_url|referrer/);
  assert.equal(lessonEvent.event, "lesson_started");
  assert.equal(lessonEvent.properties.$geoip_disable, true);

  await page.route("https://github.com/kirilklein/causal-sandbox", (route) =>
    route.fulfill({ contentType: "text/html", body: "GitHub" }),
  );
  const githubEvent = page.waitForRequest("https://eu.i.posthog.com/**");
  await page.getByRole("link", { name: "GitHub source" }).click();
  await page.waitForURL("https://github.com/kirilklein/causal-sandbox");
  const githubBody = gunzipSync(
    (await githubEvent).postDataBuffer(),
  ).toString();
  assert.match(githubBody, /github_clicked/);
  console.log("PostHog lazy load and URL privacy checks passed.");
} finally {
  await browser.close();
}
