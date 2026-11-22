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
    await page.locator("#patient-prediction").selectOption("unknown");
    for (let scene = 0; scene < 3; scene++) {
      const next = page.locator("#trajectory-next");
      if (width < 500) await next.tap();
      else await next.click();
    }
    await page
      .getByRole("button", { name: "Randomly assign treatment" })
      .click();
    const before = page.getByRole("radio", { name: /Change since day 4/ });
    await before.check();
    await expect(page.locator("#target-feedback")).toContainText("Try again");
    await expect(page.locator("#opening-next-locked")).toBeVisible();
    await expect(page.locator("#opening-next-locked")).toBeDisabled();
    await page.reload();
    await expect(before).toBeChecked();
    await page.getByRole("radio", { name: /Mean day-12 health/ }).check();
    await expect(page.locator("#target-feedback")).toContainText("Module 1 complete");
    await expect(page.locator("#opening-next")).toBeVisible();
    await expect(page.locator("#trial-result")).toContainText("Day-12 means");
    if (width === 390) {
      await page.goto(home);
      await page.locator(".intro-opening").click();
    } else {
      await page.getByRole("link", { name: /Continue to module 2/ }).click();
    }
    await expect(page).toHaveURL(/lesson=observed-difference/);
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
    const controlBox = await page.locator("#assignment").boundingBox();
    const resultBox = await page.locator(".pilot-means").boundingBox();
    expect(resultBox.y + resultBox.height - controlBox.y).toBeLessThan(300);
    await page.getByRole("button", { name: "Explain the difference" }).click();
    await expect(page.locator("#patient-pilot")).toContainText("−2.93");
    await expect(page.locator("#patient-pilot")).toContainText("+12.00");
    await page.getByRole("radio").first().check();
    await expect(page.locator("#answer-feedback")).toContainText("Try again");
    await expect(
      page.getByRole("button", { name: "Compare with simulator truth" }),
    ).toBeDisabled();
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
    const tasks = [
      [
        "adjustment",
        [
          { graph: "C", choice: 1 },
          {
            graph: "C",
            choice: 0,
            note: "Adjust for severity; preserve treatment → early recovery → health.",
          },
          { graph: "none", choice: 2 },
        ],
      ],
      [
        "estimation",
        [
          { settings: [9], choice: 0 },
          { settings: [1], choice: 1 },
          { number: 66 },
          { settings: [1], number: 10 },
          { settings: [1], choice: 1 },
          {
            choice: 2,
            note: "Treating all 100 would increase mean day-12 health by 12 points, assuming comparable groups within severity.",
          },
        ],
      ],
      [
        "trust",
        [
          { settings: [1, 2], choice: 1 },
          { settings: [1], choice: 0 },
          { settings: [1], choice: 2 },
          {
            choice: 1,
            note: "Ask clinicians which symptoms influenced their decisions and whether they also predict outcomes.",
          },
        ],
      ],
      [
        "capstone",
        [
          {
            choice: 1,
            note: "Among eligible applicants, compare six-month employment if everyone versus nobody received an offer.",
          },
          {
            graph: "C",
            choice: 2,
            note: "Prior experience affects offers and employment. Attendance is a mediator.",
          },
          { number: 16 },
          {
            choice: 0,
            note: "Among eligible applicants the estimated increase in employment is 16 percentage points if all receive an offer, assuming adjustment suffices.",
          },
        ],
      ],
    ];
    for (const [module, steps] of tasks) {
      await expect(page).toHaveURL(new RegExp("lesson=foundations-" + module));
      for (const [index, task] of steps.entries()) {
        const panel = page.locator("#course-activity");
        if (task.settings)
          for (const value of task.settings)
            await panel.locator("#course-setting").selectOption(String(value));
        if (task.graph === "none")
          await panel
            .getByLabel("No adjustment needed", { exact: true })
            .check();
        else if (task.graph)
          await panel
            .locator('[data-adjust-node="' + task.graph + '"]')
            .click();
        if (task.choice !== undefined)
          await panel.locator("input[name=reason]").nth(task.choice).check();
        else await panel.getByRole("spinbutton").fill(String(task.number));
        if (task.note) await panel.getByRole("textbox").fill(task.note);
        if (module === "capstone" && index === 3) {
          await page.goto(home);
          await page.locator(".intro-opening").click();
          await expect(panel.getByRole("textbox")).toHaveValue(task.note);
        }
        await panel.getByRole("button", { name: "Check my decision" }).click();
        await expect(panel.locator("#course-feedback")).not.toBeEmpty();
        expect(await overflows()).toBe(false);
        await panel
          .getByRole("button", {
            name:
              index === steps.length - 1 ? "Finish module" : "Next activity",
          })
          .click();
      }
      if (module !== "capstone")
        await page.locator("#course-activity a.primary").click();
    }
    await expect(page.locator("#course-activity")).toContainText(
      "6 of 6 modules completed",
    );
    await expect(page.locator("#course-activity")).toContainText(
      "4 of 4 decisions correct on first submission",
    );
    await page.goto(home);
    await page.locator(".intro-opening").click();
    await expect(
      page.getByRole("heading", { name: "Your final study" }),
    ).toBeVisible();
    await context.close();
  }
} finally {
  await browser.close();
}
