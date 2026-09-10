import "./lesson-navigation.css";
import { clearProgress, readProgress } from "./progress.js";

const coreGroups = [
  {
    title: "Foundations",
    lessons: [
      [1, "randomization", "A randomized experiment"],
      [2, "confounding", "A common cause"],
      [3, "ipw", "Adjustment with IPW", "inverse-probability-weighting/"],
      [4, "outcome-regression", "Adjustment with an outcome model"],
    ],
  },
  {
    title: "Causal roles",
    lessons: [
      [7, "mediator", "A mediator", "mediator-adjustment/"],
      [8, "collider", "A collider"],
      [9, "hidden-confounding", "A hidden common cause"],
    ],
  },
  {
    title: "Models and limitations",
    lessons: [
      [5, "misspecification", "When a model is too simple"],
      [6, "double-robustness", "Double robustness", "aipw-double-robustness/"],
      [11, "tmle", "Targeting with TMLE", "tmle/"],
      [10, "overlap", "Too little overlap"],
      [12, "leaving-the-sandbox", "Leaving the sandbox"],
    ],
  },
];

export const optionalChapters = [
  {
    id: "propensity-score",
    menuTitle: "Propensity scores",
    after: 3,
    title: "Where do propensity scores come from?",
    href: "?lesson=propensity-score",
    description:
      "Fit treatment probabilities from age and severity, then connect one person's score to their IPW weight.",
  },
  {
    id: "assumptions",
    menuTitle: "Causal assumptions",
    after: 12,
    title: "Making causal assumptions tangible",
    href: "?lesson=assumptions",
    description:
      "Change treatment assignment, available options, treatment versions, and spillovers to see what each assumption means.",
  },
  {
    id: "timing",
    menuTitle: "Timing and adjustment",
    after: 9,
    title: "What timing tells us",
    href: "?lesson=timing",
    description:
      "See why measuring a variable before treatment does not make it safe to adjust for.",
  },
  {
    id: "time-varying-confounding",
    menuTitle: "Longitudinal treatment",
    title: "When treatment changes the next treatment decision",
    href: "?lesson=time-varying-confounding",
  },
  {
    id: "instrument",
    menuTitle: "Instruments and adjustment",
    after: 6,
    title: "Instruments and adjustment",
    href: "?lesson=instrument",
    description:
      "See how adjusting for an instrument can increase variability and amplify hidden-confounding bias.",
  },
  {
    id: "arrow-strength",
    menuTitle: "Causal arrow strength",
    title: "How strong is a causal arrow?",
    href: "?lesson=arrow-strength",
  },
  {
    id: "clipping",
    menuTitle: "Weight clipping",
    after: 10,
    title: "Clipping and extreme weights",
    href: "propensity-score-clipping-trimming/",
    description:
      "Explore the tradeoff from limiting extreme weights, then see how trimming changes the target population.",
  },
  {
    id: "trimming",
    menuTitle: "Population trimming",
    title: "Trimming and the target population",
    href: "?lesson=trimming",
  },
];

export const coreLessons = coreGroups.flatMap((group) => group.lessons);
export const lessonHref = ([, slug, , path]) => path || `?lesson=${slug}`;

export function lessonNavigation({
  position,
  revisiting = false,
  currentOptional,
  introduction = false,
} = {}) {
  const progress = readProgress();
  const completed = new Set(progress.completedLessons);
  const completedCount = coreLessons.filter(([, slug]) =>
    completed.has(slug),
  ).length;
  const hasSavedResults =
    completedCount > 0 || Object.keys(progress.answers).length > 0;
  const status = introduction
    ? "Introduction"
    : currentOptional
      ? "Optional chapter"
      : `Level ${position + 1} of ${coreLessons.length + 1}${revisiting ? " · Optional revisit" : ""}`;
  let number = 0;
  return `<nav class="lesson-nav" aria-label="Lesson navigation">
    <div class="lesson-nav-heading"><button id="lesson-menu-toggle" aria-label="Contents" aria-expanded="false" aria-controls="lesson-menu"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M8 3v14"/><path class="contents-direction" d="m11 8 2 2-2 2"/></svg><span class="contents-label">Contents</span></button><span>${status}</span></div>
    <div id="lesson-menu"><a class="sandbox-nav-link" href="?lesson=introduction" data-introduction ${introduction ? 'aria-current="step"' : ""}>Introduction</a>
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
    <section class="concept-menu optional-menu" aria-label="Optional chapters"><h2>Optional chapters</h2>
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

export function setupLessonNavigation() {
  const app = document.querySelector("#app");
  const toggle = document.querySelector("#lesson-menu-toggle");
  toggle.addEventListener("click", () => {
    toggle.setAttribute(
      "aria-expanded",
      String(toggle.getAttribute("aria-expanded") !== "true"),
    );
  });
  document.querySelector("#reset-progress")?.addEventListener("click", () => {
    if (!confirm("Reset your lesson progress and saved answers?")) return;
    clearProgress();
    location.reload();
  });
  if (app.dataset.lessonNavigationSetup) return;
  app.dataset.lessonNavigationSetup = "true";
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
