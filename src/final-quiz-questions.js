const dagSource = [
  "DAGitty: d-separation",
  "https://dagitty.net/learn/dsep/index.html",
];
const whatIf = [
  "Hernán & Robins: Causal Inference: What If",
  "https://miguelhernan.org/whatifbook",
];

// Original transfer questions for learners who have completed the core course.
export const finalQuestions = [
  {
    id: "adjustment",
    title: "Two analysts, two adjustment sets",
    context:
      "A study estimates the total effect of a training offer (A) on productivity (Y). The graph is complete; C and L precede the offer.",
    facts: [
      ["C", "Job grade"],
      ["L", "Baseline workload"],
      ["M", "Skills gained after the offer"],
    ],
    graph: {
      nodes: [
        ["C", 90, 50],
        ["L", 410, 50],
        ["A", 90, 230],
        ["M", 250, 230],
        ["Y", 410, 230],
      ],
      edges: [
        ["C", "A"],
        ["C", "L"],
        ["L", "Y"],
        ["A", "M"],
        ["M", "Y"],
        ["A", "Y", -145],
      ],
      description:
        "C causes A and L; L causes Y. A causes M and Y; M causes Y. The direct A to Y arrow curves above M.",
    },
    assumptions:
      "All variables are measured. Consistency, no interference, and treatment positivity hold. Compare valid adjustment sets with correctly specified estimation; do not rank their precision.",
    prompt: "Which pair of sets can each identify the total effect?",
    choices: [
      [
        "c-cm",
        "C alone; or C and M",
        "C alone works, but including M blocks part of the total effect.",
      ],
      [
        "c-l",
        "C alone; or L alone",
        "Either C or L blocks A ← C → L → Y while leaving both causal paths intact.",
      ],
      [
        "l-m",
        "L alone; or M alone",
        "L blocks the backdoor path. M leaves it open and blocks part of the effect.",
      ],
      [
        "cm-lm",
        "C and M; or L and M",
        "Both sets block confounding, but both also block the mediated contribution through M.",
      ],
    ],
    answer: "c-l",
    reviewLessons: { "c-cm": "mediator", "cm-lm": "mediator" },
    explanation:
      "A valid adjustment set need not contain every baseline variable. Here C and L are alternative places to block the same backdoor path. Neither requires adjusting for M.",
    lesson: "confounding",
    sources: [dagSource],
  },
  {
    id: "selection",
    title: "A randomized study with selective follow-up",
    context:
      "A reminder (A) is randomized. Satisfaction (Y) is recorded only for survey responders (K = 1). Unmeasured enthusiasm (U) affects both response and satisfaction.",
    facts: [
      ["A", "Randomized reminder"],
      ["K", "Survey response"],
      ["U", "Unmeasured enthusiasm"],
      ["Y", "Satisfaction"],
    ],
    graph: {
      nodes: [
        ["A", 80, 60],
        ["K", 250, 60],
        ["U", 420, 60],
        ["Y", 250, 235],
      ],
      edges: [
        ["A", "K"],
        ["U", "K"],
        ["U", "Y"],
        ["A", "Y"],
      ],
      description:
        "A causes K and Y. U causes K and Y. Only people with K equal to 1 are analyzed.",
    },
    assumptions:
      "The graph is complete. The target is the total effect in everyone randomized. There is no interference, treatment is well-defined, and enthusiasm is not recorded.",
    prompt:
      "An analyst drops K from the regression among responders. What happens to the selection problem?",
    choices: [
      [
        "fixed",
        "It disappears because K is no longer a covariate.",
        "Restricting the sample to responders already conditions on K.",
      ],
      [
        "randomized",
        "It disappears because A was randomized initially.",
        "Randomization applies before selecting responders; it does not guarantee exchangeability within them.",
      ],
      [
        "persists",
        "It remains because the sample still conditions on K.",
        "Among responders, A and U can become associated through A → K ← U, opening a path to Y.",
      ],
      [
        "precision",
        "It becomes only a loss of precision from fewer people.",
        "The issue is who remains, not just how many: selection can create an A–U association.",
      ],
    ],
    answer: "persists",
    explanation:
      "Dropping a column cannot undo sample selection. Recovering the population effect needs additional data or justified assumptions about the missing outcomes.",
    lesson: "collider",
    sources: [dagSource, whatIf],
  },
  {
    id: "standardization",
    title: "Whose outcomes should be averaged?",
    context:
      "A rehabilitation study targets everyone eligible. A correctly specified outcome model gives these mean recovery scores.",
    table: {
      headings: ["Group (share of target)", "If treated", "If untreated"],
      rows: [
        ["Low severity (75%)", "8", "6"],
        ["High severity (25%)", "5", "1"],
      ],
    },
    facts: [["Among those treated", "50% low and 50% high severity"]],
    assumptions:
      "Severity suffices for conditional exchangeability. Both treatments occur in each severity group; consistency and no interference hold. Treat the displayed means and population shares as exact.",
    prompt: "What is the average treatment effect in everyone eligible?",
    choices: [
      [
        "three",
        "3 recovery-score points",
        "That averages the effects using the treated group's 50:50 mix, not the target population's 75:25 mix.",
      ],
      [
        "two",
        "2 recovery-score points",
        "That is the low-severity effect alone; it leaves out one quarter of the target population.",
      ],
      [
        "four",
        "4 recovery-score points",
        "That is the high-severity effect alone; it leaves out three quarters of the target population.",
      ],
      [
        "two-half",
        "2.5 recovery-score points",
        "The target-weighted contrast is 0.75 × (8 − 6) + 0.25 × (5 − 1) = 2.5.",
      ],
    ],
    answer: "two-half",
    explanation:
      "Predict both outcomes for the same target population, then average their differences. Changing the population used for averaging changes the question.",
    lesson: "outcome-regression",
    sources: [whatIf],
  },
  {
    id: "robustness",
    title: "An AIPW correction across larger studies",
    context:
      "In increasingly large simulated studies, the outcome-model effect estimate approaches 4. The known causal effect is 2.",
    facts: [
      ["Treatment model", "Correctly specified"],
      ["Outcome model", "Misspecified"],
      ["Adjustment", "All common causes included; good overlap"],
    ],
    assumptions:
      "Independent samples, consistency, no interference, and regularity conditions hold. The treatment model converges to the true probabilities, without clipping. The outcome model converges to a fixed incorrect function.",
    prompt:
      "What should happen to AIPW’s average correction as sample size grows?",
    choices: [
      [
        "minus-two",
        "It approaches −2.",
        "The correction offsets the outcome-model limit: 4 + (−2) = 2.",
      ],
      [
        "zero",
        "It approaches 0.",
        "The incorrect outcome model retains a systematic error; the correction need not vanish.",
      ],
      [
        "plus-two",
        "It approaches +2.",
        "Adding 2 to the model estimate of 4 would move it farther from the true effect of 2.",
      ],
      [
        "minus-four",
        "It approaches −4.",
        "The correction targets the error in the effect estimate, not the entire estimate.",
      ],
    ],
    answer: "minus-two",
    explanation:
      "With a correct treatment model, weighted residuals can remove the outcome model’s persistent error. Double robustness does not require both components of the estimator to be separately correct.",
    lesson: "double-robustness",
    sources: [
      [
        "Bang & Robins (2005): doubly robust estimation",
        "https://pubmed.ncbi.nlm.nih.gov/16401269/",
      ],
    ],
  },
  {
    id: "targeting",
    title: "The targeting step is complete",
    context:
      "After TMLE updates the outcome predictions, the sample’s average weighted residual correction is nearly zero. An unmeasured baseline cause of both treatment and outcome may still exist.",
    facts: [
      ["Before targeting", "Average correction = +0.6"],
      ["After targeting", "Average correction ≈ 0"],
    ],
    assumptions:
      "The targeting step has converged for the fitted treatment model. No external data rule out the suspected unmeasured common cause.",
    prompt: "What does the near-zero correction establish?",
    choices: [
      [
        "truth",
        "The targeted effect is close to the true causal effect.",
        "A small correction is a property of the fitted analysis, not a comparison with the unknown truth.",
      ],
      [
        "balance",
        "Treatment is independent of the unmeasured common cause.",
        "Updating outcome predictions cannot establish independence from a variable that was not measured.",
      ],
      [
        "residual",
        "The update has addressed this fitted residual imbalance.",
        "Targeting makes this sample estimating-equation correction nearly zero for the fitted models.",
      ],
      [
        "both",
        "Both nuisance models are correctly specified.",
        "The targeting step can converge even when the fitted models are wrong.",
      ],
    ],
    answer: "residual",
    explanation:
      "TMLE updates outcome predictions for the chosen target. Convergence does not validate the causal adjustment set or eliminate unmeasured confounding.",
    lesson: "tmle",
    sources: [
      [
        "van der Laan & Rubin (2006): Targeted Maximum Likelihood Learning",
        "https://doi.org/10.2202/1557-4679.1043",
      ],
    ],
  },
  {
    id: "support",
    title: "The safety-course rollout",
    context:
      "A factory always gives its new safety course to night-shift workers. On day shifts, workers can receive either course. The target is the new versus old course effect across all workers.",
    facts: [
      ["Day shift", "New and old courses observed"],
      ["Night shift", "Only the new course observed"],
    ],
    assumptions:
      "Shift is measured before assignment and suffices for exchangeability. Consistency and no interference hold. There is no justified model for transporting day-shift effects to night-shift workers.",
    prompt:
      "Which revised target can be identified from these data without extrapolating to a missing group?",
    choices: [
      [
        "night",
        "The average effect among night-shift workers.",
        "Night-shift workers have no observed old-course comparison.",
      ],
      [
        "day",
        "The average effect among day-shift workers.",
        "Both courses are observed on day shifts, where the stated assumptions permit adjustment.",
      ],
      [
        "treated",
        "The average effect among everyone taking the new course.",
        "That group includes night-shift workers whose old-course outcomes are unsupported.",
      ],
      [
        "all",
        "The average effect among all workers, with capped weights.",
        "Capping weights cannot supply the missing old-course night-shift outcomes.",
      ],
    ],
    answer: "day",
    explanation:
      "Restricting to day shifts makes a different population effect identifiable. It does not recover the original all-worker effect; report the narrower target explicitly.",
    lesson: "overlap",
    sources: [
      [
        "Petersen et al. (2012): positivity violations",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC4107929/",
      ],
    ],
  },
  {
    id: "sensitivity",
    title: "A benefit worth acting on?",
    context:
      "A program is worth adopting if it increases the outcome by more than 1 point. The adjusted estimate is +2 points. A sensitivity analysis varies an unmeasured common cause over a prespecified plausible range.",
    facts: [
      ["Across tested assumptions", "Effects range from +0.2 to +2.4 points"],
      ["Decision threshold", "More than +1 point"],
    ],
    assumptions:
      "Consider only sensitivity to these tested assumptions. These are scenario estimates, not a confidence interval; sampling uncertainty is outside this question.",
    prompt: "Which conclusion holds throughout the tested range?",
    choices: [
      [
        "both",
        "Both a positive effect and a benefit above the threshold.",
        "Some scenarios give less than the 1-point threshold.",
      ],
      [
        "neither",
        "Neither a positive effect nor a benefit above the threshold.",
        "All tested effects are positive, even though some are too small to justify adoption.",
      ],
      [
        "positive",
        "A positive effect, but not a benefit above the threshold.",
        "The minimum stays above zero but falls below the adoption threshold.",
      ],
    ],
    answer: "positive",
    explanation:
      "Robustness depends on the conclusion being defended. The sign survives these assumptions; the practical decision does not. Neither result covers untested assumptions or sampling uncertainty.",
    lesson: "leaving-the-sandbox",
    sources: [whatIf],
  },
  {
    id: "uncertain-graph",
    title: "Two plausible causal stories",
    context:
      "A service change (A) may alter trust (V) and retention (Y). The timing of the trust survey is unresolved. Both complete graphs remain plausible; the target is the total effect of A on Y.",
    graphs: [
      {
        label: "Story 1",
        nodes: [
          ["V", 250, 55],
          ["A", 100, 220],
          ["Y", 400, 220],
        ],
        edges: [
          ["V", "A"],
          ["V", "Y"],
          ["A", "Y"],
        ],
        description: "Story 1: V causes A and Y; A causes Y.",
      },
      {
        label: "Story 2",
        nodes: [
          ["V", 250, 55],
          ["A", 100, 220],
          ["Y", 400, 220],
        ],
        edges: [
          ["A", "V"],
          ["V", "Y"],
          ["A", "Y"],
        ],
        description: "Story 2: A causes V and Y; V causes Y.",
      },
    ],
    assumptions:
      "V is the only candidate adjustment variable. Each graph has no omitted common causes. Consistency, no interference, positivity, and correctly specified estimation hold under either story.",
    prompt:
      "Which adjustment choice is justified for the total effect under both stories?",
    choices: [
      [
        "none-shared",
        "Neither choice: the stories require different adjustment.",
        "Story 1 needs V to block confounding; Story 2 needs V left out to retain the mediated effect.",
      ],
      [
        "v",
        "Adjust for V in both stories.",
        "This blocks confounding in Story 1 but blocks part of the target effect in Story 2.",
      ],
      [
        "empty",
        "Leave V out in both stories.",
        "This preserves the total effect in Story 2 but leaves confounding in Story 1.",
      ],
      [
        "agreement",
        "Use whichever choice makes IPW and regression agree.",
        "Estimator agreement cannot determine whether V is a common cause or a mediator.",
      ],
    ],
    answer: "none-shared",
    explanation:
      "Resolve the causal timing with design or subject-matter evidence, or report conclusions conditional on each story. More flexible estimation does not choose the causal graph.",
    lesson: "leaving-the-sandbox",
    sources: [dagSource, whatIf],
  },
];

export function recordFinalAnswer(attempts, question, choice) {
  if (choice !== "unsure" && !question.choices.some(([id]) => id === choice))
    throw new Error(`Unknown answer for ${question.id}: ${choice}`);
  const correct = choice === question.answer;
  if (!attempts.has(question.id))
    attempts.set(question.id, { choice, correct });
  return correct;
}
