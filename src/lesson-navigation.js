import "./lesson-navigation.css";

const coreGroups = [
  {
    title: "Foundations",
    lessons: [
      [1, "randomization", "A randomized experiment"],
      [2, "confounding", "A common cause"],
      [3, "inverse-probability-weighting/", "Adjustment with IPW", true],
      [4, "outcome-regression", "Adjustment with an outcome model"],
    ],
  },
  {
    title: "Causal roles",
    lessons: [
      [7, "mediator-adjustment/", "A mediator", true],
      [8, "collider", "A collider"],
      [9, "hidden-confounding", "A hidden common cause"],
    ],
  },
  {
    title: "Models and limitations",
    lessons: [
      [5, "misspecification", "When a model is too simple"],
      [6, "aipw-double-robustness/", "Double robustness", true],
      [11, "tmle/", "Targeting with TMLE", true],
      [10, "overlap", "Too little overlap"],
    ],
  },
];

export const optionalChapters = [
  {
    id: "timing",
    after: 9,
    title: "What timing tells us",
    href: "?lesson=timing",
    description:
      "See why measuring a variable before treatment does not make it safe to adjust for.",
    summary: "Timing and safe adjustment",
  },
  {
    id: "instrument",
    after: 6,
    title: "Instruments and adjustment",
    href: "?lesson=instrument",
    description:
      "See how adjusting for an instrument can increase variability and amplify hidden-confounding bias.",
    summary: "Variability and hidden-confounding bias",
  },
  {
    id: "arrow-strength",
    title: "How strong is a causal arrow?",
    href: "?lesson=arrow-strength",
    summary: "Weak effects and cancelling paths",
  },
  {
    id: "clipping",
    after: 10,
    title: "Clipping and extreme weights",
    href: "propensity-score-clipping-trimming/",
    description:
      "Explore the tradeoff from limiting extreme weights, then see how trimming changes the target population.",
    summary: "Limiting extreme weights",
  },
  {
    id: "trimming",
    title: "Trimming and the target population",
    href: "?lesson=trimming",
    summary: "Who remains after trimming",
  },
];

const lessonHref = ([, slug, , permanent]) =>
  permanent ? slug : `?lesson=${slug}`;
const coreLessonCount = coreGroups.reduce(
  (count, group) => count + group.lessons.length,
  0,
);

export function lessonNavigation({
  position,
  revisiting = false,
  currentOptional,
} = {}) {
  const status = currentOptional
    ? "Optional chapter"
    : `Level ${position + 1} of ${coreLessonCount + 1}${revisiting ? " · Optional revisit" : ""}`;
  let number = 0;
  return `<nav class="lesson-nav" aria-label="Lesson navigation">
    <div class="lesson-nav-heading"><button id="lesson-menu-toggle" aria-label="Contents" aria-expanded="false" aria-controls="lesson-menu"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M8 3v14"/><path class="contents-direction" d="m11 8 2 2-2 2"/></svg><span class="contents-label">Contents</span></button><span>${status}</span></div>
    <div id="lesson-menu">${coreGroups
      .map(
        ({ title, lessons }) =>
          `<section class="lesson-group" aria-label="${title}"><h2>${title}</h2><ol>${lessons
            .map((lesson) => {
              number += 1;
              return `<li><a href="${lessonHref(lesson)}" data-level="${lesson[0]}" aria-label="${lesson[2]}" data-number="${number}" ${position === number - 1 ? 'aria-current="step"' : ""}>${lesson[2]}</a></li>`;
            })
            .join("")}</ol></section>`,
      )
      .join("")}
    <section class="concept-menu optional-menu" aria-label="Optional chapters"><h2>Optional chapters</h2>
      ${optionalChapters.map(({ id, title, href, summary }) => `<a href="${href}" aria-label="${title}" ${currentOptional === id ? 'aria-current="step"' : ""}>${title}<small>${summary}</small></a>`).join("")}
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
    <a class="sandbox-nav-link" href="?sandbox">Full sandbox ↗</a></div>
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
  if (app.dataset.lessonNavigationSetup) return;
  app.dataset.lessonNavigationSetup = "true";
  app.addEventListener("pointerdown", (event) => {
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
