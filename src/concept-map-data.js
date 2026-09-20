export const mapRegions = [
  {
    id: "question",
    name: "The question",
    question: "What would change?",
    summary: "Imagine the same people under two different choices.",
    terms: "Possible futures · average effects · populations",
    concepts: [
      {
        id: "futures",
        name: "Two possible futures",
        description:
          "Each person has a potential outcome under each treatment choice. We observe only the outcome under the choice they actually receive.",
        lessons: ["what-if", "trajectory-landscape"],
        connection: [
          "comparison",
          "The missing future is why we need a comparison group. A difference between groups must stand in for a comparison we cannot observe within one person.",
        ],
      },
      {
        id: "average",
        name: "An average effect",
        description:
          "Compare the average outcome if everyone in a population received treatment with the average if nobody did. This is the average treatment effect.",
        lessons: ["what-if", "outcome-regression"],
        connection: [
          "methods",
          "Outcome regression predicts both outcomes for each person and averages the differences. These predictions estimate the target; they do not reveal individual counterfactuals.",
        ],
      },
      {
        id: "total",
        name: "Total or direct?",
        description:
          "A treatment can act directly and through intermediate changes. The total effect includes both routes. A direct-effect question needs a more specific comparison and additional assumptions.",
        lessons: ["mediator", "arrow-strength", "paths-cancel"],
        connection: [
          "comparison",
          "For the total effect, adjusting for a mediator can block part of the effect we want to include. The causal question helps determine the adjustment set.",
        ],
      },
      {
        id: "population",
        name: "An effect for whom?",
        description:
          "An average effect belongs to a particular population. If treatment effects differ across people, changing that population can change the answer.",
        lessons: ["trimming", "what-if"],
        connection: [
          "evidence",
          "Trimming removes people with extreme treatment probabilities. It can improve the available comparison, but the effect now concerns the retained population.",
        ],
      },
    ],
  },
  {
    id: "comparison",
    name: "The comparison",
    question: "What makes it fair?",
    summary: "Understand why groups differ before interpreting their outcomes.",
    terms: "Randomization · causal graphs · assumptions",
    concepts: [
      {
        id: "randomization",
        name: "Randomization",
        description:
          "Random assignment makes treatment independent of potential outcomes. Groups can still differ by chance in a finite study.",
        lessons: ["randomization", "sampling-variation"],
        connection: [
          "evidence",
          "A valid randomized comparison still has sampling uncertainty. Repeating the study shows how much its estimate can vary.",
        ],
      },
      {
        id: "confounding",
        name: "Common causes",
        description:
          "A common cause of treatment and outcome can make a helpful treatment look harmful. Adjustment tries to account for measured differences that distort the comparison.",
        lessons: ["confounding", "trajectory-landscape", "repeated-bias"],
        connection: [
          "methods",
          "Weighting and outcome regression are two ways to account for measured confounders, under the causal assumptions and suitable model conditions.",
        ],
      },
      {
        id: "roles",
        name: "What to adjust for",
        description:
          "A variable’s role depends on the causal graph and the effect we want. Adjusting for a collider can create bias; measuring something before treatment does not automatically make it safe to adjust for.",
        lessons: [
          "collider",
          "mediator",
          "timing",
          "causal-relevance",
          "instrument",
        ],
        connection: [
          "question",
          "An adjustment set is chosen for a particular causal effect. Adding more variables is not automatically an improvement.",
        ],
      },
      {
        id: "hidden",
        name: "Hidden common causes",
        description:
          "If an important common cause is unmeasured, adjustment using the available variables may leave confounding bias.",
        lessons: ["hidden-confounding", "instrument-hidden-confounding"],
        connection: [
          "methods",
          "Double robustness concerns errors in fitted models. It does not remove the need for sufficient information to control confounding.",
        ],
      },
      {
        id: "overlap",
        name: "Comparable people",
        description:
          "For the population we want to study, each treatment must be possible at relevant covariate values. Sparse comparisons make estimation difficult even when treatment is theoretically possible.",
        lessons: ["overlap", "assumptions"],
        connection: [
          "evidence",
          "Little overlap can produce extreme weights and unstable estimates. Neither a flexible model nor a narrow interval supplies missing comparisons.",
        ],
      },
      {
        id: "assumptions",
        name: "Causal assumptions",
        description:
          "Connecting observed outcomes to an intervention requires assumptions about confounding, treatment availability, what treatment means, and whether one person’s treatment affects another.",
        lessons: ["assumptions", "leaving-the-sandbox"],
        connection: [
          "question",
          "Clearly specifying the treatment, outcome, and population makes these assumptions concrete. Data alone cannot verify every causal assumption.",
        ],
      },
    ],
  },
  {
    id: "methods",
    name: "The methods",
    question: "How do we estimate it?",
    summary: "Use treatment probabilities, outcome predictions, or both.",
    terms: "Weighting · outcome models · double robustness",
    concepts: [
      {
        id: "weighting",
        name: "Reweight people · IPW",
        description:
          "A propensity score is a treatment probability given measured covariates. Inverse probability weighting gives greater contribution to people whose actual treatment was less likely.",
        lessons: ["propensity-score", "ipw"],
        connection: [
          "comparison",
          "Weighting aims to balance measured confounders across treatment groups. It relies on the adjustment variables and treatment probabilities supporting a valid comparison.",
        ],
      },
      {
        id: "predictions",
        name: "Predict outcomes",
        description:
          "Fit an outcome model, predict each person’s outcome under both treatment choices, and average the predicted differences.",
        lessons: ["outcome-regression"],
        connection: [
          "evidence",
          "Predictions depend on how well the model represents the outcome relationship. Where comparisons are sparse, it may rely heavily on extrapolation.",
        ],
      },
      {
        id: "combine",
        name: "Combine both · AIPW & TMLE",
        description:
          "AIPW corrects an outcome-model estimate using treatment probabilities. TMLE updates outcome predictions first. Under the causal and regularity assumptions, either model being correct can suffice for consistent estimation.",
        lessons: ["double-robustness", "tmle", "tmle-robustness"],
        connection: [
          "evidence",
          "Double robustness is not a promise of accuracy in every sample. Both models can be wrong, and hidden confounding or poor overlap can still undermine the analysis.",
        ],
      },
      {
        id: "longitudinal",
        name: "Treatment over time",
        description:
          "Earlier treatment can change a patient’s health, which can then influence the next treatment decision. The target becomes a comparison between treatment strategies across time.",
        lessons: ["time-varying-confounding", "timing"],
        connection: [
          "comparison",
          "A changing health measure can be both a mediator of earlier treatment and a confounder of later treatment. Sequential weighting addresses this structure under additional assumptions.",
        ],
      },
    ],
  },
  {
    id: "evidence",
    name: "The evidence",
    question: "How much can we trust it?",
    summary: "Separate random uncertainty from systematic error.",
    terms: "Uncertainty · model errors · limitations",
    concepts: [
      {
        id: "uncertainty",
        name: "Uncertainty & precision",
        description:
          "A different sample gives a different estimate. Confidence intervals describe sampling uncertainty under their assumptions; p-values compare the data with a specified null model.",
        lessons: ["uncertainty", "p-values", "sampling-variation"],
        connection: [
          "comparison",
          "Precision does not establish causal validity. A narrow interval can surround a biased estimate when the comparison is confounded.",
        ],
      },
      {
        id: "models",
        name: "When models are wrong",
        description:
          "Even with the right adjustment variables, a fitted model may miss a curve or interaction. Causal assumptions and statistical model specification are separate requirements.",
        lessons: ["misspecification", "tmle-robustness"],
        connection: [
          "methods",
          "IPW depends on the treatment model; outcome regression depends on the outcome model. AIPW and TMLE combine the two, with qualified protection against one being wrong.",
        ],
      },
      {
        id: "weights",
        name: "Extreme weights",
        description:
          "A few people can dominate a weighted estimate. Clipping limits extreme probabilities or weights, trading some potential instability for possible bias.",
        lessons: ["overlap", "clipping"],
        connection: [
          "comparison",
          "Extreme weights are a reason to revisit overlap and the treatment model. Limiting weights does not establish that the comparison is causally valid.",
        ],
      },
      {
        id: "trimming",
        name: "Trimming the population",
        description:
          "Trimming excludes people with extreme treatment probabilities. The remaining population may support a better comparison, but it is a different target.",
        lessons: ["trimming"],
        connection: [
          "question",
          "Removing people changes whose effect we estimate. If effects vary, the retained population’s average effect can differ from the original population’s effect.",
        ],
      },
      {
        id: "real-world",
        name: "Beyond the sandbox",
        description:
          "In a simulation we can compare estimates with a known truth. In a real study we must justify assumptions, examine limitations, and consider plausible alternative causal structures.",
        lessons: ["leaving-the-sandbox", "assumptions"],
        connection: [
          "question",
          "A credible causal claim starts with a well-defined question and keeps its assumptions visible all the way to the conclusion.",
        ],
      },
    ],
  },
];
