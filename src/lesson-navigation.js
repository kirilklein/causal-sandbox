import "./lesson-navigation.css";

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
    after: 3,
    title: "Where do propensity scores come from?",
    href: "?lesson=propensity-score",
    description:
      "Fit treatment probabilities from age and severity, then connect one person's score to their IPW weight.",
    summary: "From patient characteristics to treatment probability",
  },
  {
    id: "assumptions",
    after: 12,
    title: "Making causal assumptions tangible",
    href: "?lesson=assumptions",
    description:
      "Change treatment assignment, available options, treatment versions, and spillovers to see what each assumption means.",
    summary: "Four visual experiments",
  },
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
    id: "time-varying-confounding",
    title: "When treatment changes the next treatment decision",
    href: "?lesson=time-varying-confounding",
    summary: "Repeated treatment and time-varying confounding",
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

export const coreLessons = coreGroups.flatMap((group) => group.lessons);
export const lessonHref = ([, slug, , path]) => path || `?lesson=${slug}`;

export function lessonNavigation({
  position,
  revisiting = false,
  currentOptional,
  introduction = false,
} = {}) {
  const status = introduction
    ? "Introduction"
    : currentOptional
      ? "Optional chapter"
      : `Level ${position + 1} of ${coreLessons.length + 1}${revisiting ? " · Optional revisit" : ""}`;
  let number = 0;
  return `<nav class="lesson-nav" aria-label="Lesson navigation">
    <div class="lesson-nav-heading"><button id="lesson-menu-toggle" aria-label="Contents" aria-expanded="false" aria-controls="lesson-menu"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M8 3v14"/><path class="contents-direction" d="m11 8 2 2-2 2"/></svg><span class="contents-label">Contents</span></button><span>${status}</span></div>
    <div id="lesson-menu"><a class="sandbox-nav-link" href="?lesson=introduction" data-introduction ${introduction ? 'aria-current="step"' : ""}>Introduction</a>${coreGroups
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
