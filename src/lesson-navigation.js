import "./lesson-navigation.css";
import { clearProgress, readProgress } from "./progress.js";

import {
  coreGroups,
  coreLessons,
  lessonHref,
  optionalChapters,
} from "./lesson-catalog.js";
import { searchButton } from "./search.js";

export { coreLessons, lessonHref, optionalChapters } from "./lesson-catalog.js";

export function lessonNavigation({
  position,
  revisiting = false,
  currentOptional,
  introduction = false,
  learningPage,
} = {}) {
  const progress = readProgress();
  const completed = new Set(progress.completedLessons);
  const completedCount = coreLessons.filter(([, slug]) =>
    completed.has(slug),
  ).length;
  const hasSavedResults =
    completedCount > 0 || Object.keys(progress.answers).length > 0;
  const status = learningPage
    ? {
        learn: "Learning choices",
        topics: "Topic browser",
        quiz: "Starting-point quiz",
      }[learningPage]
    : introduction
      ? "Introduction"
      : currentOptional
        ? ["propensity-score", "assumptions"].includes(currentOptional)
          ? "Refresher"
          : "Advanced lesson"
        : `Level ${position + 1} of ${coreLessons.length + 1}${revisiting ? " · Optional revisit" : ""}`;
  let number = 0;
  return `<nav class="lesson-nav" aria-label="Lesson navigation">
    <div class="lesson-nav-heading"><button id="lesson-menu-toggle" aria-label="Contents" aria-expanded="false" aria-controls="lesson-menu"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M8 3v14"/><path class="contents-direction" d="m11 8 2 2-2 2"/></svg><span class="contents-label">Contents</span></button>${searchButton()}<span>${status}</span></div>
    <div id="lesson-menu"><a class="sandbox-nav-link" href="?lesson=introduction" data-introduction ${introduction ? 'aria-current="step"' : ""}>Introduction</a><a class="sandbox-nav-link" href="${import.meta.env.BASE_URL}?lesson=learn" ${learningPage === "learn" ? 'aria-current="step"' : ""}>Learning choices</a>
    <div class="lesson-progress"><label for="lesson-progress">${completedCount} of ${coreLessons.length} guided lessons complete</label><progress id="lesson-progress" max="${coreLessons.length}" value="${completedCount}"></progress><span id="lesson-complete-description">Completed</span>${hasSavedResults ? '<button id="reset-progress" type="button">Reset progress</button>' : ""}</div>${coreGroups
      .map(
        ({ title, lessons }) =>
          `<section class="lesson-group" aria-label="${title}"><h2>${title}</h2><ol>${lessons
            .map((lesson) => {
              number += 1;
              const isComplete = completed.has(lesson[1]);
              return `<li><a href="${lessonHref(lesson)}" data-level="${lesson[0]}" aria-label="${lesson[2]}" ${isComplete ? 'aria-describedby="lesson-complete-description" data-complete="true"' : ""} data-number="${number}" ${position === number - 1 ? 'aria-current="step"' : ""}>${lesson[2]}</a></li>`;
            })
            .join("")}</ol></section>`,
      )
      .join("")}
    <section class="concept-menu optional-menu" aria-label="Refreshers and advanced lessons"><h2>Refreshers & advanced lessons</h2>
      ${optionalChapters.map(({ id, menuTitle, href }) => `<a href="${href}" aria-label="${menuTitle}" ${currentOptional === id ? 'aria-current="step"' : ""}>${menuTitle}</a>`).join("")}
    </section>
    <section class="concept-menu" aria-label="Concept guides"><h2>Concept guides</h2>
      <a href="glossary/">Glossary</a>
      <a href="confounding/">Confounding</a>
      <a href="collider-bias/">Collider bias</a>
      <a href="positivity/">Positivity and overlap</a>
      <a href="inverse-probability-weighting/">Inverse probability weighting</a>
      <a href="aipw-double-robustness/">How double robustness works</a>
      <a href="mediator-adjustment/">Mediator adjustment</a>
      <a href="tmle/">TMLE</a>
    </section>
    <a class="sandbox-nav-link" href="?sandbox">Explore scenarios ↗</a>
    <a class="sandbox-nav-link" href="?sandbox=graph-lab">Build a graph ↗</a></div>
  </nav>`;
}

function fitLessonMenu() {
  if (
    document
      .querySelector("#lesson-menu-toggle")
      ?.getAttribute("aria-expanded") !== "true"
  )
    return;
  const menu = document.querySelector("#lesson-menu");
  menu.style.setProperty(
    "--menu-available-height",
    `${Math.max(0, window.innerHeight - menu.getBoundingClientRect().top - 16)}px`,
  );
}

export function setupLessonNavigation() {
  const app = document.querySelector("#app");
  const toggle = document.querySelector("#lesson-menu-toggle");
  toggle.addEventListener("click", () => {
    toggle.setAttribute(
      "aria-expanded",
      String(toggle.getAttribute("aria-expanded") !== "true"),
    );
    fitLessonMenu();
  });
  document.querySelector("#reset-progress")?.addEventListener("click", () => {
    if (!confirm("Reset your lesson progress and saved answers?")) return;
    clearProgress();
    location.reload();
  });
  if (app.dataset.lessonNavigationSetup) return;
  app.dataset.lessonNavigationSetup = "true";
  window.addEventListener("resize", fitLessonMenu);
  window.addEventListener("scroll", fitLessonMenu, { passive: true });
  app.addEventListener("click", (event) => {
    if (!event.target.closest(".lesson-nav"))
      document
        .querySelector("#lesson-menu-toggle")
        ?.setAttribute("aria-expanded", "false");
  });
  app.addEventListener("keydown", (event) => {
    const currentToggle = document.querySelector("#lesson-menu-toggle");
    if (
      event.key === "Escape" &&
      currentToggle?.getAttribute("aria-expanded") === "true"
    ) {
      currentToggle.setAttribute("aria-expanded", "false");
      currentToggle.focus();
    }
  });
}
