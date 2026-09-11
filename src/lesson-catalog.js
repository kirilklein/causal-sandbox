export const coreGroups = [
  {
    title: "Foundations",
    lessons: [
      [1, "randomization", "A randomized experiment"],
      [2, "confounding", "A common cause"],
      [14, "uncertainty", "How uncertain is this estimate?"],
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
    id: "p-values",
    menuTitle: "P-values",
    after: 14,
    title: "What does a p-value tell us?",
    href: "?lesson=p-values",
    description:
      "Compare a result with a zero-effect world, then connect its p-value to precision and confidence intervals.",
  },
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
