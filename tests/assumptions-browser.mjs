import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : "chrome",
});
const root = process.env.APP_URL || "http://127.0.0.1:5173/causal-sandbox/";
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*.goatcounter.com/**", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"count":"0"}' }),
  );
  await page.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  const open = async (topic) => {
    await page.goto(`${root}?lesson=assumptions&assumption=${topic}`);
    await page.locator("#feedback").waitFor();
  };
  const feedback = () => page.locator("#feedback").innerText();
  const screenshot = async (name) => {
    if (process.env.ASSUMPTION_SCREENSHOTS)
      await page.screenshot({
        path: `${process.env.ASSUMPTION_SCREENSHOTS}/${name}.png`,
        fullPage: true,
      });
  };
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await open("exchangeability");
    const documentStart = await page.evaluate(() => performance.timeOrigin);
    const header = await page.locator("header").elementHandle();
    let documentRequests = 0;
    const onRequest = (request) => {
      if (request.isNavigationRequest()) documentRequests += 1;
    };
    page.on("request", onRequest);
    await page.locator('.assumption-topics a[href$="positivity"]').focus();
    await page.keyboard.press("Enter");
    await page.locator("#support").waitFor();
    assert.match(page.url(), /assumption=positivity$/);
    assert.equal(
      await page
        .locator("h1")
        .evaluate((heading) => heading === document.activeElement),
      true,
    );
    await page.locator("#support").selectOption("weak");
    assert.match(await feedback(), /rare/i);
    await page.getByRole("link", { name: "Next: Consistency →" }).click();
    await page.locator("#version").waitFor();
    await page.goBack();
    await page.locator("#support").waitFor();
    assert.equal(await page.locator("#support").inputValue(), "good");
    await page.goForward();
    await page.locator("#version").waitFor();
    await page.locator('.assumption-topics a[href$="no-interference"]').tap();
    await page.locator("#peer").check();
    await page.locator("#spillover").check();
    assert.match(await page.locator("#peer-picture").innerText(), /Score 58/);
    assert.equal(
      await page.evaluate(() => performance.timeOrigin),
      documentStart,
    );
    assert.equal(await header.evaluate((element) => element.isConnected), true);
    assert.equal(
      documentRequests,
      0,
      "Topic navigation must not reload the document",
    );
    assert.equal(
      await page
        .locator('.assumption-topics [aria-current="page"]')
        .getAttribute("href"),
      "?lesson=assumptions&assumption=no-interference",
    );
    page.off("request", onRequest);
  }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto(`${root}?lesson=leaving-the-sandbox`);
  await page.locator('.optional-preview a[href="?lesson=assumptions"]').click();
  assert.equal(await page.locator("#comparison").innerText(), "2.0");
  await page.locator("#assignment").selectOption("measured");
  assert.equal(await page.locator("#comparison").innerText(), "4.4");
  const fixedFutures = await page.locator(".outcome-value").allTextContents();
  await page.locator("#condition").focus();
  await page.keyboard.press("Space");
  assert.equal(await page.locator("#comparison").innerText(), "2.0");
  assert.equal(await page.locator(".distribution").count(), 2);
  await page.locator("#assignment").selectOption("hidden");
  assert.equal(await page.locator("#comparison").innerText(), "4.4");
  assert.match(await feedback(), /C is perfectly balanced/);
  await screenshot("exchangeability-hidden-conditional");
  await page.locator("#condition").uncheck();
  assert.deepEqual(
    await page.locator(".outcome-value").allTextContents(),
    fixedFutures,
  );
  await page.locator("#potential").selectOption("y1");
  assert.deepEqual(await page.locator(".outcome-value").allTextContents(), [
    "Score 4",
    "Score 8",
    "Score 12",
  ]);
  assert.equal(await page.locator("#comparison").innerText(), "4.4");
  const bars = await page.locator("#distributions").innerHTML();
  await page
    .getByText("What stays fixed, and what does adjustment do?", {
      exact: true,
    })
    .click();
  assert.equal(await page.locator("#distributions").innerHTML(), bars);
  await page.getByLabel("Color theme").selectOption("dark");
  assert.equal(await page.locator("#distributions").innerHTML(), bars);
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  assert.equal(
    await page
      .locator('.optional-menu a[aria-current="step"]')
      .getAttribute("href"),
    "?lesson=assumptions",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("button", { name: "Contents", exact: true })
      .getAttribute("aria-expanded"),
    "false",
  );

  await open("positivity");
  await page.locator("#support").selectOption("weak");
  assert.match(await page.locator("#support-weights").innerText(), /20.0×/);
  const counts = await page.locator("#support-groups").innerHTML();
  await page
    .getByText("Where do the propensity scores sit?", { exact: true })
    .click();
  assert.deepEqual(
    await page.locator("#support-scores strong").allTextContents(),
    ["95.0%", "5.0%", "5.0%", "95.0%"],
  );
  const scores = await page.locator("#support-scores").innerHTML();
  await page.locator("#clip").check();
  assert.match(await page.locator("#support-weights").innerText(), /10.0×/);
  assert.equal(await page.locator("#support-groups").innerHTML(), counts);
  assert.equal(await page.locator("#support-scores").innerHTML(), scores);
  await page.locator("#support").selectOption("absent");
  assert.match(await page.locator("#support-weights").innerText(), /No people/);
  assert.match(await feedback(), /empty comparison remains empty/);
  assert.deepEqual(
    await page.locator("#support-scores strong").allTextContents(),
    ["100.0%", "33.3%", "0.0%", "66.7%"],
  );
  await screenshot("positivity-structural-zero");
  await page.locator("#clip").uncheck();
  assert.match(
    await page.locator("#support-groups").innerText(),
    /0 untreated · 100 treated/,
  );

  await open("consistency");
  assert.match(await feedback(), /54 or 62/);
  await page.locator("#version").selectOption("brief");
  assert.match(await feedback(), /gain over no coaching is 4 points/);
  await page.locator("#version").selectOption("intensive");
  assert.match(await feedback(), /gain over no coaching is 12 points/);
  await page.locator("#version").selectOption("policy");
  assert.match(await feedback(), /expected score 58.0/);
  await screenshot("consistency-policy");
  await page.locator("#mix").focus();
  await page.keyboard.press("End");
  assert.match(await feedback(), /expected score 62.0/);
  await page.keyboard.press("Home");
  assert.match(await feedback(), /expected score 54.0/);

  await open("no-interference");
  for (const own of [false, true]) {
    await page.locator("#own").setChecked(own);
    for (const spillover of [false, true]) {
      await page.locator("#spillover").setChecked(spillover);
      for (const peer of [false, true]) {
        await page.locator("#peer").setChecked(peer);
        assert.match(
          await page.locator("#peer-picture").innerText(),
          new RegExp(
            `Score ${50 + 10 * Number(own) + 8 * Number(peer && spillover)}`,
          ),
        );
      }
    }
  }

  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const topic of [
      "exchangeability",
      "positivity",
      "consistency",
      "no-interference",
    ]) {
      await open(topic);
      for (const theme of ["light", "dark"]) {
        await page.getByLabel("Color theme").selectOption(theme);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${topic}, ${theme}, ${width}: overflow`,
        );
        assert.equal(
          await page
            .locator('.assumption-topics [aria-current="page"]')
            .count(),
          1,
        );
        assert.deepEqual(
          await page
            .locator(".panel select, .distribution, #feedback, .version-card")
            .evaluateAll((elements) =>
              elements
                .filter((element) => {
                  const box = element.getBoundingClientRect();
                  return (
                    box.right > innerWidth ||
                    box.left < 0 ||
                    element.scrollWidth > element.clientWidth + 1
                  );
                })
                .map((element) => element.id || element.className),
            ),
          [],
          `${topic}, ${theme}, ${width}: clipped content`,
        );
        if (process.env.ASSUMPTION_SCREENSHOTS)
          await page.screenshot({
            path: `${process.env.ASSUMPTION_SCREENSHOTS}/${topic}-${width}-${theme}.png`,
            fullPage: true,
          });
      }
    }
  }
  await page.locator("#peer").tap();
  await page.locator("#spillover").tap();
  assert.match(await page.locator("#peer-picture").innerText(), /Score 58/);
  await screenshot("spillover-active-mobile");
  await page
    .getByRole("link", { name: "1 · Exchangeability Comparable futures" })
    .click();
  assert.equal(await page.locator("#comparison").innerText(), "2.0");
  await page.goBack();
  assert.ok(await page.locator("#peer").isVisible());
  await open("invalid");
  assert.equal(await page.locator("#comparison").innerText(), "2.0");
  await page.goto(`${root}positivity/`);
  await page
    .getByRole("link", { name: /Start with the visual support experiment/ })
    .click();
  await page.locator("#support").waitFor();
  await page.goto(`${root}glossary/`);
  await page.locator("#consistency .glossary-related").click();
  await page.locator("#version").waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Assumptions browser checks passed: four experiments, keyboard/touch, navigation, themes, desktop/320px.",
  );
} finally {
  await browser.close();
}
