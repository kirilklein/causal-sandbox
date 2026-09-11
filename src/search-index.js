import {
  coreLessons,
  lessonHref,
  optionalChapters,
  lessonExperiments,
} from "./lesson-catalog.js";
import { glossary } from "./glossary.js";
import { scenarios } from "./sandbox-scenarios.js";
import { graphPresets } from "./graph-presets.js";

const lessonDetails = {
  "trajectory-landscape": [
    "Unfold patient trajectories to see confounding by indication.",
    "patient trajectory futures landscape confounding indication severity counterfactual",
  ],
  randomization: [
    "Compare treatment groups when treatment is assigned at random.",
    "randomized experiment RCT",
  ],
  confounding: [
    "See how a common cause changes the observed treatment comparison.",
    "confounder common cause bias",
  ],
  ipw: [
    "Reweight treatment groups using their treatment probabilities.",
    "inverse probability weighting weights propensity scores IPTW",
  ],
  "outcome-regression": [
    "Predict outcomes under each treatment and average the comparison.",
    "regression adjustment standardization g computation outcome model",
  ],
  mediator: [
    "Explore how adjusting for a mediator changes a total-effect comparison.",
    "mediation direct total effect",
  ],
  collider: [
    "See how adjustment can create a misleading association.",
    "collider bias selection bias",
  ],
  "hidden-confounding": [
    "Explore bias from a common cause that was not measured.",
    "unmeasured confounding exchangeability",
  ],
  misspecification: [
    "Compare models that can and cannot capture the outcome pattern.",
    "model specification flexibility interaction",
  ],
  "double-robustness": [
    "Combine treatment and outcome models to see how double robustness works.",
    "AIPW augmented inverse probability weighting weights doubly robust",
  ],
  tmle: [
    "Update outcome predictions using treatment probabilities.",
    "targeted maximum likelihood estimation targeted learning",
  ],
  "tmle-robustness": [
    "Compare TMLE and IPW across treatment- and outcome-model errors in two interactive heatmaps.",
    "TMLE vs IPW model misspecification misspecifications double robustness heatmap visual comparison both models wrong imperfect models shift scale",
  ],
  overlap: [
    "Explore what happens when treatment groups have little common support.",
    "positivity extreme weights overlap",
  ],
  "leaving-the-sandbox": [
    "Connect the experiments to causal questions, assumptions, and sensitivity analysis.",
    "recap sensitivity analysis real data",
  ],
  "propensity-score": [
    "Fit treatment probabilities and connect a person's score to their weight.",
    "propensity score logistic regression treatment model",
  ],
  assumptions: [
    "Explore exchangeability, positivity, consistency, and interference.",
    "identification exchangeability positivity consistency no interference SUTVA",
  ],
  timing: [
    "See why being measured before treatment does not make a variable safe to adjust for.",
    "temporal order pretreatment baseline",
  ],
  "time-varying-confounding": [
    "Explore treatment decisions linked across two visits.",
    "longitudinal time varying confounding sequential IPTW treatment confounder feedback",
  ],
  instrument: [
    "Explore how adjusting for an instrument can amplify hidden-confounding bias.",
    "instrumental variable IV bias amplification",
  ],
  "arrow-strength": [
    "Change a causal arrow's strength and follow its effect through the graph.",
    "DAG causal diagram path strength",
  ],
  clipping: [
    "Limit extreme weights and explore the resulting tradeoff.",
    "extreme weights weight clipping truncation",
  ],
  trimming: [
    "Remove people with extreme scores and see how the target population changes.",
    "population trimming propensity score restriction estimand",
  ],
};

const guides = [
  [
    "Confounding",
    "confounding/",
    "Understand how a common cause can distort a treatment comparison.",
    "confounder common cause",
  ],
  [
    "Collider bias",
    "collider-bias/",
    "Understand why conditioning on a common effect can create bias.",
    "selection bias collider",
  ],
  [
    "Positivity and overlap",
    "positivity/",
    "Connect treatment availability to the comparisons needed for a causal effect.",
    "common support extreme weights",
  ],
  [
    "Methodology notes",
    "methodology/",
    "Read the simulator's target, data-generating process, and estimator definitions.",
    "equations simulation assumptions methods",
  ],
];

// Pages that also host lessons use the lesson's single canonical destination.
export const searchEntries = [
  ...lessonExperiments.map((experiment) => ({
    ...experiment,
    type: "Experiment",
  })),
  ...scenarios.map((scenario) => ({
    title: scenario.name,
    type: "Scenario",
    href: `?sandbox&scenario=${scenario.id}`,
    description: `${scenario.question} ${scenario.action}`,
    keywords: `scenario sandbox ${scenario.group} ${scenario.id.includes("model") ? "model misspecification wrong models" : ""}`,
  })),
  ...graphPresets.map((preset) => ({
    title: preset.name,
    type: "Graph preset",
    href: `?sandbox=graph-lab&preset=${preset.id}`,
    description: `${preset.question} ${preset.action}`,
    keywords: `graph DAG preset ${preset.id}`,
  })),
  ...coreLessons.map((lesson) => ({
    title: lesson[2],
    type: "Lesson",
    href: lessonHref(lesson),
    description: lessonDetails[lesson[1]][0],
    keywords: lessonDetails[lesson[1]][1],
  })),
  ...optionalChapters.map((chapter) => ({
    title: chapter.title,
    type: "Optional chapter",
    href: chapter.href,
    description: chapter.description || lessonDetails[chapter.id][0],
    keywords: lessonDetails[chapter.id][1],
    aliases: [chapter.menuTitle],
  })),
  ...Object.entries(glossary).map(([key, term]) => ({
    title: term.title,
    type: "Glossary",
    href: `glossary/#${key}`,
    description: term.summary,
    aliases: [key, ...(term.aliases || [])],
    keywords: lessonDetails[key]?.[1],
  })),
  ...guides.map(([title, href, description, keywords]) => ({
    title,
    href,
    description,
    keywords,
    type: "Guide",
  })),
  {
    title: "Explore scenarios",
    aliases: ["Full sandbox", "Scenario sandbox"],
    type: "Sandbox",
    href: "?sandbox",
    description:
      "Compare causal estimators while changing the world and adjustment choices.",
    keywords: "simulation scenarios experiment estimators",
  },
  {
    title: "Build a graph",
    type: "Sandbox",
    href: "?sandbox=graph-lab",
    description:
      "Draw a causal graph and explore adjustment and interventions.",
    keywords: "DAG graph lab graph sandbox builder causal diagram",
  },
];

function containsWord(field, word) {
  return field.split(" ").some((token) => token.startsWith(word));
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function searchTopics(query, entries = searchEntries) {
  const phrase = normalize(query);
  if (!phrase) return [];
  const words = [...new Set(phrase.split(/\s+/))];
  return entries
    .map((entry) => {
      const title = normalize(entry.title);
      const aliases = (entry.aliases || []).map(normalize);
      const keywords = normalize(entry.keywords || "");
      const description = normalize(entry.description);
      const fields = [title, ...aliases, keywords, description];
      if (
        !words.every((word) =>
          fields.some((field) => containsWord(field, word)),
        )
      )
        return { entry, score: 0 };
      const score =
        (title === phrase ? 1000 : aliases.includes(phrase) ? 900 : 0) +
        (title.includes(phrase) ? 100 : 0) +
        words.reduce(
          (sum, word) =>
            sum +
            (containsWord(title, word)
              ? 20
              : aliases.some((alias) => containsWord(alias, word))
                ? 15
                : containsWord(keywords, word)
                  ? 10
                  : 1),
          0,
        );
      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title),
    )
    .filter(
      ({ entry }, index, ranked) =>
        ranked.findIndex((result) => result.entry.href === entry.href) ===
        index,
    )
    .map(({ entry }) => entry);
}
