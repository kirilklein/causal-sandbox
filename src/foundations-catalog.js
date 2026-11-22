export const modules = [
  {
    id: "opening",
    title: "Define the treatment effect",
    goal: "Name the people, choices, outcome and time in a treatment-effect question.",
    href: "?lesson=what-if&course=foundations",
    minutes: 30,
    topics: ["what-if", "randomization"],
  },
  {
    id: "pilot",
    title: "Explain a misleading difference",
    goal: "Separate severity-driven bias from the variation between samples.",
    href: "?lesson=observed-difference",
    minutes: 35,
    topics: ["confounding", "uncertainty"],
  },
  {
    id: "adjustment",
    title: "Choose what to adjust for",
    goal: "Trace the paths in a graph and defend a comparison for the total effect.",
    href: "?lesson=foundations-adjustment",
    minutes: 40,
    topics: ["mediator", "collider", "timing"],
  },
  {
    id: "estimation",
    title: "Estimate the effect",
    goal: "Compare like with like, then recover the target population by averaging or weighting.",
    href: "?lesson=foundations-estimation",
    minutes: 50,
    topics: [
      "ipw",
      "outcome-regression",
      "propensity-score",
      "double-robustness",
      "tmle",
    ],
  },
  {
    id: "trust",
    title: "Decide when to trust the result",
    goal: "Diagnose sparse comparisons, missing causes and errors in the outcome model.",
    href: "?lesson=foundations-trust",
    minutes: 45,
    topics: ["overlap", "hidden-confounding", "misspecification"],
  },
  {
    id: "capstone",
    title: "Solve a new study",
    goal: "Write and defend a conclusion about offering job training.",
    href: "?lesson=foundations-capstone",
    minutes: 40,
    topics: ["leaving-the-sandbox", "final-quiz"],
  },
];
export function moduleForTopic(topic) {
  return modules.find((module) => module.topics.includes(topic));
}
export const moduleById = Object.fromEntries(
  modules.map((module) => [module.id, module]),
);
