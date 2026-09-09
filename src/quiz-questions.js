export const quizQuestions = [
  {
    id: "adjustment",
    kind: "graph",
    title: "Which variables belong in the adjustment set?",
    context:
      "A training program (A) changes skill (M) and later earnings (Y). Prior experience (C) affects enrollment and earnings. We want the total effect of everyone taking the program versus no one taking it.",
    assumptions:
      "Assume this graph contains all common causes, both program options occur at each level of C, and the intervention is well defined with no spillovers.",
    graph: {
      nodes: [
        ["C", 50, 15],
        ["A", 15, 50],
        ["Y", 85, 50],
        ["M", 50, 85],
      ],
      edges: [
        ["C", "A"],
        ["C", "Y"],
        ["A", "Y"],
        ["A", "M"],
        ["M", "Y"],
      ],
      description: "C → A, C → Y, A → Y, A → M, M → Y.",
    },
    choices: [
      ["C", "Prior experience (C)"],
      ["M", "Skill after training (M)"],
    ],
    correct: ["C"],
    explanation:
      "Adjust for C to block A ← C → Y. Leave M out: A → M → Y carries part of the total effect we want to count. The highlighted arrows trace the confounding path.",
    paths: [
      ["C", "A"],
      ["C", "Y"],
    ],
    lesson: "mediator",
    concept: "Choosing adjustment for the total effect",
  },
  {
    id: "selection",
    title: "Keep only people who attended follow-up?",
    context:
      "In a randomized study, treatment (A) and symptoms measured at week 4 (Y) both affect attendance at a week-6 visit (K). Week-4 outcomes are recorded for everyone. An analyst proposes comparing treatment groups only among attendees.",
    assumptions:
      "Assume the graph is complete. The target is the total effect on week-4 symptoms in everyone randomized; the later visit cannot change that earlier outcome.",
    graph: {
      nodes: [
        ["A", 15, 30],
        ["Y", 85, 30],
        ["K", 50, 80],
      ],
      edges: [
        ["A", "Y"],
        ["A", "K"],
        ["Y", "K"],
      ],
      description:
        "A → Y, A → K, Y → K. K is a consequence of both treatment and the earlier outcome.",
    },
    choices: [
      [
        "restrict",
        "Yes: attendees are more comparable because they all came back.",
        "Sharing attendance does not make the groups comparable. Treatment and symptoms both influence who attends.",
      ],
      [
        "all",
        "No: use everyone randomized; restricting to attendees can introduce bias.",
        "Restricting the sample conditions on K even without adding K to a regression.",
      ],
      [
        "randomized",
        "Either is safe: randomization protects every subgroup.",
        "Randomization protects assignment in the original study, not a subgroup selected using a consequence of treatment and outcome.",
      ],
    ],
    correct: ["all"],
    explanation:
      "Selection on K opens A → K ← Y. Among attendees, treatment status can become associated with symptoms through attendance. Keep everyone to preserve the randomized comparison. The highlighted arrows meet at K.",
    paths: [
      ["A", "K"],
      ["Y", "K"],
    ],
    lesson: "collider",
    concept: "Selection can act like adjustment",
  },
  {
    id: "overlap",
    title: "Predict what ten times as much data would fix",
    context:
      "A hospital always treats severely ill patients. Less severely ill patients sometimes receive treatment and sometimes do not. Researchers collect ten times as many patients under exactly the same policy.",
    assumptions:
      "The target remains the average treatment effect in all patients, including the severely ill. Treatment policy does not change.",
    choices: [
      [
        "precision",
        "The larger study will establish the effect in severely ill patients.",
        "More precise estimates elsewhere do not supply untreated severely ill patients.",
      ],
      [
        "missing",
        "The untreated comparison for severely ill patients will still be missing.",
        "Ten times zero untreated severely ill patients is still zero.",
      ],
      [
        "flexible",
        "A flexible outcome model will remove the need for that comparison.",
        "A model can extrapolate, but those predictions require extra assumptions; flexibility does not create supporting observations.",
      ],
    ],
    correct: ["missing"],
    explanation:
      "This is a zero-probability treatment option, not just a small sample. The effect in all patients is not identified from these observations alone. Changing the policy, obtaining another source of support, or explicitly changing the target would address different parts of the problem.",
    lesson: "overlap",
    concept: "Sample size versus missing support",
  },
  {
    id: "robustness",
    title: "One model is wrong. Must this estimate be wrong?",
    context:
      "An AIPW analysis uses a correctly specified treatment model and a misspecified outcome model. In one sample, its estimate is farther from truth than outcome regression. A colleague concludes that double robustness has failed.",
    assumptions:
      "Confounding is controlled, consistency and no interference hold, and treatment probabilities stay away from zero and one. Assume the usual estimation regularity conditions and no weight clipping.",
    choices: [
      [
        "rank",
        "Yes: AIPW must be the closest estimate whenever one model is correct.",
        "Double robustness does not promise the best estimate in each sample.",
      ],
      [
        "both",
        "Yes: both models must be correct for AIPW to approach truth.",
        "One correctly specified nuisance model can be sufficient under the stated causal and estimation assumptions.",
      ],
      [
        "limit",
        "No: protection as samples grow is compatible with a worse estimate in one sample.",
        "A consistency property and the ranking of estimates in one sample are different claims.",
      ],
    ],
    correct: ["limit"],
    explanation:
      "Across increasingly large samples, one correct model can protect AIPW against misspecification of the other. Finite-sample variation remains. One unlucky estimate neither disproves that property nor establishes that the model is correct.",
    lesson: "double-robustness",
    concept: "Double robustness versus finite-sample luck",
  },
  {
    id: "agreement",
    title: "Three estimates agree. What have we learned?",
    context:
      "IPW, outcome regression, and AIPW all estimate a benefit near 2 units. Their models use the same recorded variables. An unrecorded factor may affect both treatment and outcome.",
    choices: [
      [
        "proof",
        "The agreement rules out important hidden confounding.",
        "All three methods can share the same missing confounding information.",
      ],
      [
        "stable",
        "The result is similar across these methods, but the shared causal assumptions still need defending.",
        "Agreement is useful to report, but it does not test whether every common cause was recorded.",
      ],
      [
        "average",
        "Averaging the three estimates will cancel any confounding bias.",
        "Bias shared by all three need not cancel when their estimates are averaged.",
      ],
    ],
    correct: ["stable"],
    explanation:
      "Changing estimators does not change the information available about confounding. Investigate the suspected common cause and examine how plausible hidden confounding would affect the conclusion.",
    lesson: "hidden-confounding",
    concept: "Agreement does not verify causal assumptions",
  },
  {
    id: "sensitivity",
    title: "Choose the conclusion you would publish",
    context:
      "A study estimates a benefit. Its sensitivity analysis shows that an amount of unmeasured confounding judged plausible by subject-matter experts would reverse that benefit.",
    choices: [
      [
        "robust",
        "Treatment helps: the original estimate is positive.",
        "The original estimate alone leaves out a plausible explanation that changes its sign.",
      ],
      [
        "harm",
        "Treatment harms: sensitivity analysis has revealed the true effect.",
        "Sensitivity analysis explores alternatives; it does not establish which alternative is true.",
      ],
      [
        "qualified",
        "The estimated benefit depends on assumptions that plausible hidden confounding could overturn.",
        "This states what the estimate suggests and what makes that conclusion fragile.",
      ],
    ],
    correct: ["qualified"],
    explanation:
      "Report the estimate with its assumptions and the plausible departures that change the conclusion. The analysis supports caution about the benefit, not certainty that the effect is zero or harmful.",
    lesson: "leaving-the-sandbox",
    concept: "Conclusions that reflect sensitivity",
  },
];

export function isCorrect(question, selected) {
  return (
    selected.length === question.correct.length &&
    question.correct.every((id) => selected.includes(id))
  );
}

export function recordAttempt(attempts, question, selected) {
  const correct = isCorrect(question, selected);
  if (!attempts.has(question.id))
    attempts.set(question.id, { selected: [...selected], correct });
  return correct;
}
