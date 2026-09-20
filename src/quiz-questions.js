import { entryGraphScenarios } from "./adjustment-scenarios.js";

const entryGraphs = entryGraphScenarios.map((scenario, index) => ({
  ...scenario,
  scenarioId: scenario.id,
  id: index ? "J" : "G",
  context: [scenario.context],
  correct: "set:C",
  choices: [],
  provenance: "Original scenario; clickable adjustment inspired by daggle.",
  sources: scenario.sources.map(([citation, url]) => ({
    citation,
    url,
    section: "Graphical adjustment rules and interactive practice",
  })),
}));
// Authored entry questions. Source details appear after the assessment.
export const quizQuestions = [
  {
    id: "E",
    title: "Tutoring and final scores",
    context: [
      "Pupils who struggle with reading are more likely to get tutoring and score lower at term’s end. Tutored pupils have lower average final scores.",
    ],
    prompt: "Does the lower average score show that tutoring harms learning?",
    choices: [
      {
        id: "harm",
        text: "Yes: the score difference measures tutoring’s effect.",
      },
      {
        id: "confounded",
        text: "No: starting difficulties also contribute to the difference.",
      },
      {
        id: "no-observational-causation",
        text: "No: observational data can never tell us tutoring’s effect.",
      },
    ],
    correct: "confounded",
    explanation:
      "Starting difficulty affects both tutoring and final scores. The raw difference therefore cannot separate tutoring’s effect from those starting differences. Observational comparisons can still identify effects under appropriate assumptions.",
    sources: [
      {
        citation:
          "Hernán & Robins, Causal Inference: What If (2020; August 19, 2026 draft)",
        url: "https://miguelhernan.org/whatifbook",
        section: "Sections 3.1–3.2 and 7.1",
      },
    ],
    provenance: "Original question; references support the concepts.",
  },
  {
    id: "F",
    title: "What the coin toss changes",
    context: [
      "Each participant is assigned to a course or no course by an independent fair coin toss.",
    ],
    prompt: "What does the coin toss do?",
    choices: [
      {
        id: "exact-balance",
        text: "Makes starting characteristics identical in the two groups.",
      },
      {
        id: "equal-effects",
        text: "Makes the course’s effect identical for everyone.",
      },
      {
        id: "assignment",
        text: "Makes assignment independent of starting characteristics.",
      },
    ],
    correct: "assignment",
    explanation:
      "The coin toss makes assignment independent of starting characteristics. Chance differences between the realized groups remain possible, and people can respond differently to the course.",
    sources: [
      {
        citation: "Neal, Introduction to Causal Inference (December 17, 2020)",
        url: "https://www.bradyneal.com/Introduction_to_Causal_Inference-Dec17_2020-Neal.pdf",
        section: "Sections 5.1–5.2",
      },
    ],
    provenance: "Original question; references support the concepts.",
  },
  {
    id: "B",
    title: "Is adjustment possible here?",
    context: [
      "Starting reading difficulty is the only common cause of tutoring and final scores. It is measured accurately, and both tutoring groups exist at every difficulty level.",
    ],
    prompt: "How can we estimate tutoring’s average effect across all pupils?",
    choices: [
      {
        id: "raw",
        text: "Compare the overall means of the two tutoring groups.",
      },
      {
        id: "within",
        text: "Compare within difficulty levels, then average using their proportions among all pupils.",
      },
      {
        id: "highest-difficulty",
        text: "Compare only pupils with the greatest reading difficulty.",
      },
    ],
    correct: "within",
    explanation:
      "Under the stated assumptions, comparing pupils at the same starting difficulty addresses confounding. Averaging those differences using the population’s difficulty distribution targets the effect in that population. Restricting to the greatest difficulty changes the population; it does not give the average effect across all pupils.",
    sources: [
      {
        citation:
          "Hernán & Robins, Causal Inference: What If (2020; August 19, 2026 draft)",
        url: "https://miguelhernan.org/whatifbook",
        section: "Section 3.1",
      },
    ],
    provenance: "Original question; references support the concepts.",
    assumptions:
      "Assume the same tutoring intervention for everyone, no effects on other pupils, and all final scores recorded.",
  },
  ...entryGraphs,
  {
    id: "M",
    title: "Which savings count?",
    context: [
      "Insulation lowers bills by reducing heat loss. It also leads residents to turn down their heating.",
    ],
    prompt: "Which savings count toward insulation’s total effect?",
    choices: [
      {
        id: "direct-only",
        text: "Savings from reduced heat loss only.",
      },
      {
        id: "all-paths",
        text: "Savings from both reduced heat loss and changed heating use.",
      },
      {
        id: "mediated-only",
        text: "Savings from changed heating use only.",
      },
    ],
    correct: "all-paths",
    explanation:
      "Changing heating use is one way insulation can change the bill. The total effect counts that pathway together with the other pathways; it does not hold a consequence of insulation fixed.",
    sources: [
      {
        citation: "Huntington-Klein, The Effect, chapter 8",
        url: "https://theeffectbook.net/ch-CausalPaths.html",
        section: "Section 8.3",
      },
    ],
    provenance: "Original question; references support the concepts.",
  },
  {
    id: "C",
    title: "A variable measured before treatment",
    context: [
      "Target: the total effect of A on Y. Treat the graph as complete. P, R and K are measured before A.",
    ],
    prompt: "What does adjusting only for K do?",
    choices: [
      {
        id: "restrict",
        text: "Blocks a confounding path.",
      },
      {
        id: "adjust",
        text: "Leaves the comparison unbiased: K predates A.",
      },
      {
        id: "all",
        text: "Opens a noncausal path.",
      },
    ],
    correct: "all",
    explanation:
      "The path A ← P → K ← R → Y is blocked at K before adjustment. Adjusting for K opens it: among people with the same membership status, fitness and sociability can become associated. Being measured before treatment does not make a variable safe to adjust for. Under this graph, the empty adjustment set is valid.",
    sources: [
      {
        citation: "DAGitty, d-Separation Without Tears, section 3",
        url: "https://dagitty.net/learn/dsep/index.html",
        section: "Conditioning on colliders",
      },
    ],
    provenance: "Revised from the local quiz; references support the concepts.",
    graph: {
      nodes: [
        ["P", 75, 40],
        ["K", 250, 40],
        ["R", 425, 40],
        ["A", 75, 235],
        ["Y", 425, 235],
      ],
      edges: [
        ["P", "A"],
        ["P", "K"],
        ["R", "K"],
        ["R", "Y"],
        ["A", "Y"],
      ],
      description:
        "Fitness P → exercise A, P → club membership K, sociability R → K, R → wellbeing Y, A → Y. P, R and K are measured before A.",
    },
    facts: [
      ["A", "Exercise"],
      ["Y", "Wellbeing"],
      ["P", "Fitness"],
      ["R", "Sociability"],
      ["K", "Existing sports-club membership"],
    ],
    assumptions:
      "Both exercise options occur at each fitness and sociability profile. Assume accurate measurements, a well-defined exercise routine, no spillovers, and all outcomes recorded.",
  },
  {
    id: "K",
    title: "Two ways to qualify",
    context: [
      "A scholarship requires at least 80 in academics P or music R. The two scores are independent among all applicants.",
    ],
    prompt: "A winner scored below 80 in academics. What follows?",
    choices: [
      {
        id: "stays-blocked",
        text: "Their music score is no more predictable than before selection.",
      },
      {
        id: "opens",
        text: "Their music score must be at least 80.",
      },
      {
        id: "causal-arrow",
        text: "Their low academic score caused their music score to rise.",
      },
    ],
    correct: "opens",
    explanation:
      "Winning with an academic score below 80 requires a music score of at least 80. Selection therefore lets one score tell us something about the other, even though they were independent among all applicants. This is conditioning on P → S ← R; it does not mean one ability causes the other.",
    sources: [
      {
        citation: "DAGitty, d-Separation Without Tears, section 3",
        url: "https://dagitty.net/learn/dsep/index.html",
        section: "Conditioning on colliders",
      },
    ],
    provenance: "Original question; references support the concepts.",
    graph: {
      nodes: [
        ["P", 100, 65],
        ["R", 400, 65],
        ["S", 250, 230],
      ],
      edges: [
        ["P", "S"],
        ["R", "S"],
      ],
      description:
        "Academic score P → scholarship selection S ← music score R. P and R are independent among all applicants.",
    },
  },
  {
    id: "H",
    title: "An unmeasured common cause",
    context: [
      "A cycling study adjusts for age and commute distance. Starting health still confounds cycling’s effect on sick days, but was not measured.",
    ],
    prompt: "Which step addresses this missing information?",
    choices: [
      {
        id: "no-bias",
        text: "Collect more people with the same recorded variables.",
      },
      {
        id: "agreement-only",
        text: "Measure health before cycling began and reassess adjustment.",
      },
      {
        id: "average-removes-bias",
        text: "Fit more flexible models of age and commute distance.",
      },
    ],
    correct: "agreement-only",
    explanation:
      "Measuring starting health supplies information about the omitted common cause. More employees or more flexible models of the same variables do not supply it. Measuring health is a step toward a defensible adjustment set, not proof that all confounding has been addressed.",
    sources: [
      {
        citation:
          "Funk et al. (2011), Doubly Robust Estimation of Causal Effects",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3070495/",
        section: "Assumptions subsection",
      },
    ],
    provenance: "Revised from the local quiz; references support the concepts.",
  },
  {
    id: "O",
    title: "An outcome model for two treatments",
    context: [
      "An outcome model reports a precise average effect of surgery versus physiotherapy across all patients. It adjusts for symptom severity.",
    ],
    prompt: "What deserves the most scrutiny?",
    choices: [
      {
        id: "remove-severity",
        text: "Whether omitting severity would make patients more comparable.",
      },
      {
        id: "unsupported-extrapolation",
        text: "Whether physiotherapy predictions for severe patients are justified.",
      },
      {
        id: "equal-group-sizes",
        text: "Whether a narrower interval would establish the effect in severe patients.",
      },
    ],
    correct: "unsupported-extrapolation",
    explanation:
      "For patients with severe symptoms, the model predicts outcomes under physiotherapy without an observed comparison in that group. The overall effect therefore depends on extrapolation assumptions that a precise estimate does not verify. Extrapolation can be credible with sufficient justification, but the observed data alone cannot establish those predictions. Removing severity or narrowing the confidence interval does not supply the missing comparison.",
    sources: [
      {
        citation: "Neal, Introduction to Causal Inference (December 17, 2020)",
        url: "https://www.bradyneal.com/Introduction_to_Causal_Inference-Dec17_2020-Neal.pdf",
        section: "Section 2.3.4",
      },
    ],
    provenance: "Original question; references support the concepts.",
    facts: [
      ["Mild symptoms", "Both treatments occur"],
      ["Severe symptoms", "Everyone receives surgery"],
    ],
  },
  {
    id: "P",
    title: "Who gets more weight?",
    context: [
      "Two untreated people had different probabilities of receiving treatment:",
    ],
    prompt: "Using IPW for the effect in everyone, who gets more weight?",
    choices: [
      {
        id: "high-p",
        text: "Person 1 (80%).",
      },
      {
        id: "low-p",
        text: "Person 2 (20%).",
      },
      {
        id: "equal",
        text: "Equal weights: both were untreated.",
      },
    ],
    correct: "high-p",
    explanation:
      "An untreated person with an 80% chance of treatment had only a 20% chance of their observed treatment status. Their ordinary weight is 1/0.2 = 5, compared with 1/0.8 = 1.25 for the other person. Within-arm normalization preserves this ordering.",
    sources: [
      {
        citation: "Neal, Introduction to Causal Inference (December 17, 2020)",
        url: "https://www.bradyneal.com/Introduction_to_Causal_Inference-Dec17_2020-Neal.pdf",
        section: "Section 7.6",
      },
    ],
    provenance: "Original question; references support the concepts.",
    facts: [
      ["Person 1", "80% probability of treatment"],
      ["Person 2", "20% probability of treatment"],
    ],
  },
  {
    id: "D",
    title: "If the propensity model is wrong",
    context: ["Assume confounding is controlled and overlap holds."],
    prompt: "Which methods are guaranteed to remain consistent?",
    choices: [
      {
        id: "ipw-aipw",
        text: "IPW and AIPW.",
      },
      {
        id: "consistent",
        text: "Outcome regression and AIPW.",
      },
      {
        id: "outcome-only",
        text: "Outcome regression only.",
      },
    ],
    correct: "consistent",
    explanation:
      "The correct outcome model supports outcome regression. It also supplies one of the two routes to AIPW consistency, even when the treatment model is wrong. IPW has no such guarantee with a misspecified treatment model. These are large-sample properties, not promises about which estimate is closest in one sample.",
    sources: [
      {
        citation:
          "Bang & Robins (2005), Doubly Robust Estimation in Missing Data and Causal Inference Models",
        url: "https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1541-0420.2005.00377.x",
        section: "Abstract",
      },
      {
        citation:
          "Funk et al. (2011), Doubly Robust Estimation of Causal Effects",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3070495/",
        section: "Discussion",
      },
    ],
    provenance: "Revised from the local quiz; references support the concepts.",
    facts: [
      ["Propensity-score model", "Misspecified"],
      ["Outcome model", "Correctly specified"],
    ],
    assumptions:
      "Assume a well-defined treatment, no interference, consistent estimation of the correct outcome model, the usual estimation regularity conditions, and no weight clipping.",
  },
];

export const unsureChoice = { id: "unsure", text: "I’m not sure" };
