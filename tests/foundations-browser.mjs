import { expect } from "@playwright/test";
import { launchBrowser, getAppUrl, stubGoatCounter } from "./browser-setup.mjs";

const browser = await launchBrowser();
try {
  for (const width of [320, 390, 430, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 320 ? 700 : 844 },
      reducedMotion: "reduce",
      hasTouch: width < 500,
    });
    await stubGoatCounter(context);
    let page = await context.newPage();
    const home = getAppUrl();
    await page.goto(home);
    await page
      .getByRole("link", { name: "Start the course →", exact: true })
      .click();
    for (let scene = 0; scene < 3; scene++) {
      const next = page.locator("#trajectory-next");
      if (width < 500) await next.tap();
      else await next.click();
    }
    await page
      .getByRole("button", { name: "Randomly assign treatment" })
      .click();
    await expect(page.locator("#trial-result")).toContainText("Day-12 means");
    await page.getByRole("link", { name: /Compare the 100 patients/ }).click();
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Change assignment" }).click();
    const slider = page.locator("#assignment");
    if (width < 500) {
      await slider.tap({ position: { x: 8, y: 22 } });
    } else {
      await slider.focus();
      await page.keyboard.press("Home");
    }
    await expect(page.locator("#comparison")).toContainText("+12.00");
    await page.locator("#severity").selectOption("9");
    await page.close();
    page = await context.newPage();
    await page.goto(home);
    await expect(page.locator(".intro-opening")).toHaveText("Continue →");
    await page.locator(".intro-opening").click();
    await expect(page.locator("#assignment")).toHaveValue("0");
    await expect(page.locator("#severity")).toHaveValue("9");
    await page.locator("#assignment").focus();
    await page.keyboard.press("End");
    await expect(page.locator("#comparison")).toContainText("−2.93");
    await expect(page.locator("#cell")).toContainText("Treated: 9 of 10");
    const overflows = () =>
      page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(await overflows()).toBe(false);
    const controlBox = await slider.boundingBox();
    const resultBox = await page.locator(".pilot-means").boundingBox();
    expect(resultBox.y + resultBox.height - controlBox.y).toBeLessThan(300);
    await page.getByRole("button", { name: "Explain the difference" }).click();
    await page.getByRole("radio").nth(1).check();
    await page
      .getByRole("button", { name: "Compare with simulator truth" })
      .click();
    await page.getByRole("button", { name: "Test a larger study" }).click();
    await page.getByRole("button", { name: /Run 60/ }).click();
    await page.getByRole("button", { name: /Increase to/ }).click();
    await expect(page.locator(".pilot-repeats")).toHaveCount(2);
    expect(await overflows()).toBe(false);
    await page.getByRole("button", { name: "Try another hospital" }).click();
    await page.getByRole("radio").first().check();
    await expect(
      page.getByRole("button", { name: "Finish this study" }),
    ).toBeDisabled();
    await page.getByRole("radio").nth(1).check();
    await page.getByRole("button", { name: "Finish this study" }).click();
    await page.reload();
    await page.locator("#pilot-onward").click();
    await expect(page).toHaveURL(/lesson=mediator/);
    await context.close();
  }
} finally {
  await browser.close();
}
