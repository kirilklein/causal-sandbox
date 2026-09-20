import { chromium } from "@playwright/test";

export function launchBrowser() {
  return chromium.launch({
    headless: true,
    channel: process.env.CI ? undefined : "chrome",
  });
}

export function getAppUrl() {
  return process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
}

export function collectPageErrors(page, errors) {
  page.on("pageerror", (error) => errors.push(error.message));
}

// Opt in per page or context; other analytics routes remain suite-specific.
export async function stubGoatCounter(target) {
  await target.route("**/*.goatcounter.com/**", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"count":"0"}' }),
  );
  await target.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
}
