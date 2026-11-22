import { trainingResult } from "./foundations-analysis.js";

function graph(id, nodes, edges, unmeasured = []) {
  return {
    id,
    unmeasured,
    facts: nodes.map(([name, label]) => [name, label]),
    graph: {
      nodes: nodes.map(([name, , x, y]) => [name, x, y]),
      edges,
      description: edges.map(([from, to]) => from + " causes " + to).join(". "),
    },
  };
}
const clinical = [
  ["A", "Day-4 treatment", 65, 165],
  ["Y", "Day-12 health", 435, 165],
  ["C", "Baseline severity", 250, 40],
];
const common = [
  ["C", "A"],
  ["C", "Y"],
  ["A", "Y"],
];
const mediator = graph(
  "course-mediator",
  [...clinical, ["M", "Recovery on day 7", 250, 250]],
  [...common, ["A", "M"], ["M", "Y"]],
);
const collider = graph(
  "course-collider",
  [
    ["A", "Treatment", 55, 205],
    ["Y", "Health", 445, 205],
    ["U", "Referral tendency", 125, 45],
    ["V", "Underlying prognosis", 375, 45],
    ["K", "Entered the specialist registry", 250, 180],
  ],
  [
    ["U", "A"],
    ["U", "K"],
    ["V", "K"],
    ["V", "Y"],
    ["A", "Y"],
  ],
  ["U", "V"],
);
const employment = graph(
  "course-training",
  [
    ["A", "Training offer", 65, 165],
    ["C", "Prior work experience", 250, 40],
    ["Y", "Employed six months later", 435, 165],
    ["M", "Training attendance", 250, 250],
  ],
  [...common, ["A", "M"], ["M", "Y"]],
);

export const activities = {
  adjustment: [
    {
      id: "common",
      title: "Trace a common cause",
      text: "An arrow points from a proposed cause to its consequence. Severity is a common cause: it influences the treatment decision and later health. Without treatment causing anything, that fork can still associate treatment with health. Select an adjustment set for the total effect of treatment.",
      graph: graph("course-common", clinical, common),
      prompt: "Why use this comparison?",
      choices: [
        "It compares people who end up equally healthy.",
        "It closes the path connecting treatment and outcome through baseline severity.",
        "It removes random variation.",
      ],
      correct: 1,
      feedback:
        "Comparing within C closes A ← C → Y. Each severity group still needs both treatment options.",
    },
    {
      id: "mediator",
      writing:
        "Write the path that would be lost if you adjusted for early recovery. Explain why it belongs in the total effect.",
      title: "Keep recovery in the effect",
      text: "Now treatment can improve early recovery, which affects day-12 health. A variable carrying part of the effect is a mediator. Select a set for the total effect, including that route.",
      graph: mediator,
      prompt: "Why leave the intermediate response free to vary?",
      choices: [
        "Treatment can improve health through early recovery.",
        "Anything measured after treatment is a common cause.",
        "Recovery is irrelevant to health.",
      ],
      correct: 0,
      feedback:
        "Holding M fixed blocks some of the benefit you set out to measure.",
    },
    {
      id: "collider",
      title: "Decide whether to restrict the sample",
      text: "In this variant, referral tendency influences treatment. Referral tendency and prognosis both influence registry entry. Two arrows meet at this shared consequence, called a collider. All patients are available. Decide whether to condition on registry entry.",
      graph: collider,
      prompt: "What would restricting to registry patients do?",
      choices: [
        "It would randomize treatment among registered patients.",
        "It would remove the effect through recovery.",
        "It could associate referral tendency with prognosis within the selected group.",
      ],
      correct: 2,
      feedback:
        "K is a shared consequence. Selecting K opens A ← U → K ← V → Y. In this graph the unrestricted groups need no adjustment.",
    },
  ],
  estimation: [
    {
      id: "within",
      title: "Compare patients within severity",
      text: "Return to the original 100 patients. Before pooling anyone, predict whether the treated group scores lower at the same baseline severity. Inspect at least two groups.",
      experiment: "within",
      prompt: "Which comparison is repeated across the ten groups?",
      choices: [
        "Treated and untreated patients with the same starting severity.",
        "The same person observed twice under different treatments.",
        "Severe treated patients and mild untreated patients.",
      ],
      correct: 0,
      feedback:
        "Comparing separate patients within severity addresses the measured common cause. Each contributes one observed outcome.",
    },
    {
      id: "standardize",
      title: "Rebuild the target population",
      text: "Each severity group contributes ten patients to the target population. Choose a severity mix for each arm and compare the resulting means.",
      experiment: "standardize",
      prompt:
        "Which mix answers the question about treating all 100 versus treating none?",
      choices: [
        "Use each arm’s observed mix.",
        "Use the same full-population severity distribution for both arms.",
      ],
      correct: 1,
      feedback:
        "Standardization gives every severity group one tenth of each average. An outcome model can supply the two group predictions when direct group means are impractical.",
    },
    {
      id: "calculate",
      title: "Standardize for a different clinic",
      text: "A clinic expects three quarters of its patients to have severity 0 and one quarter to have severity 9. In the observed study, untreated means at those severities were 78 and 30 points. Keep the two observed group means fixed; change only the target population.",
      prompt:
        "What is the clinic’s standardized mean day-12 health under no treatment?",
      number: 66,
      unit: "health points",
      hint: "Multiply 78 and 30 by their respective population shares and add the two contributions.",
      feedback:
        "0.75 × 78 + 0.25 × 30 = 66 points. The treated mean would be 78. Here the target changes the two means equally because the benefit is constant across severity.",
    },
    {
      id: "outcome-model",
      title: "Predict under both treatment choices",
      text: "Return to the 100 patients. Instead of observed group means, a fitted outcome model uses severity and treatment to predict each patient’s day-12 health. Change which treatment you assign in the prediction. Everyone keeps their own baseline severity.",
      experiment: "predict",
      prompt: "Why average both sets of predictions over the same people?",
      choices: [
        "To identify each person’s missing outcome with certainty.",
        "To compare the same severity mix under two treatment policies.",
        "To choose the model with the highest treated mean.",
      ],
      correct: 1,
      feedback:
        "Each person contributes a prediction to both population averages. The averages estimate the contrast if the model is adequate and the adjustment assumptions hold.",
    },
    {
      id: "weight",
      title: "Give rare assignments more representation",
      text: "Inverse probability weighting (IPW) gives a patient a weight of one divided by the probability of receiving their actual treatment. These assignment shares are known in this teaching cohort. Reweight the observed patients and inspect the resulting group mix.",
      experiment: "weight",
      prompt:
        "One of ten patients at severity 9 is untreated. What weight does that patient receive?",
      number: 10,
      unit: "units of weight",
      feedback:
        "An untreated probability of 1/10 gives weight 10. The one observed untreated outcome represents ten patients at this severity in the weighted untreated arm.",
    },
    {
      id: "interpret",
      writing:
        "Write a two-sentence results paragraph. Give the estimate, its units and the population it describes. Explain one assumption that the calculation needs.",
      title: "Interpret the estimate",
      text: "The crude difference compares the arms as observed. Standardization, outcome regression and weighting each adjust for measured severity in the same 100 patients.",
      experiment: "estimates",
      prompt: "Which conclusion is defensible?",
      choices: [
        "Every real patient would gain exactly 12 points.",
        "Agreement proves all common causes were measured.",
        "Under the study assumptions, treating everyone raises mean day-12 health by an estimated 12 points versus treating nobody.",
      ],
      correct: 2,
      feedback:
        "The target is a population average. All three adjusted estimates need a well-defined treatment, comparable patients within severity and both treatment choices at every severity. Regression also needs a model that represents the outcome relationship.",
    },
  ],
  trust: [
    {
      id: "support",
      title: "Look for the missing comparison",
      text: "Keep the 100 patients and their possible outcomes fixed. Move from equal assignment to weak overlap and then remove the untreated option at the highest severity.",
      experiment: "support",
      prompt: "What can you report when nobody at severity 9 is untreated?",
      choices: [
        "Use a weight of zero for that group.",
        "The full-population comparison needs extrapolation. A supported subgroup would answer a narrower question.",
        "Use more precise measurements of those already treated.",
      ],
      correct: 1,
      feedback:
        "Counts reveal the support gap. A fitted model can return a number, but that missing group mean would depend on model assumptions.",
    },
    {
      id: "hidden",
      title: "Test a missing common cause",
      text: "Start a different version of the study with both treatment options at each severity. The analyst initially sees only severity.",
      experiment: "hidden",
      prompt: "What can balance on recorded severity establish?",
      choices: [
        "That severity is balanced. A hidden cause may still distort the comparison.",
        "That treatment is randomized.",
        "That a more flexible severity model will fix the bias.",
      ],
      correct: 0,
      feedback:
        "Here the simulator can reveal frailty. An analyst would need design knowledge, additional measurements or a sensitivity analysis to address the concern.",
    },
    {
      id: "curve",
      title: "Check the outcome model",
      text: "Reset to a study with measured severity as the only common cause. Both arms occur at each severity. High and low severities receive treatment more often, and untreated health bends with severity. Compare two fits on the same observations.",
      experiment: "curve",
      prompt:
        "What does the comparison of observed and fitted values diagnose?",
      choices: [
        "Whether an unmeasured confounder exists.",
        "Whether missing treatment groups are comparable.",
        "Whether the fitted relationship can reproduce the observed pattern.",
      ],
      correct: 2,
      feedback:
        "A curve fits this constructed relationship. Checking fit can reveal a misspecified outcome model. Even excellent fit cannot verify the causal graph.",
    },
    {
      id: "triage",
      writing:
        "Write your request to the study team. Name the information you need and what finding would make you revise your interpretation.",
      title: "Choose the next investigation",
      text: "A new analyst has excellent fitted predictions in both arms, adequate measured overlap, and a concern that clinicians use unrecorded symptoms to assign treatment.",
      prompt: "What would you investigate first?",
      choices: [
        "More polynomial terms in the fitted model.",
        "Whether symptom information can be recovered and how strong its confounding could be.",
        "Dropping patients with common treatment probabilities.",
      ],
      correct: 1,
      feedback:
        "The concern is about comparability after adjustment. Neither overlap diagnostics nor model fit can rule out an unrecorded common cause.",
    },
  ],
  capstone: [
    {
      id: "target",
      writing:
        "Write the effect question in your own words, including both policies and the observation period.",
      title: "Define the job-training question",
      text: "A city offered training to some of 200 eligible applicants. It recorded prior experience, whether an offer was made, attendance and employment six months later. The city wants to decide whether to offer training to everyone eligible.",
      prompt: "Which effect answers the city’s question?",
      choices: [
        "Employment among attendees compared with nonattendees.",
        "Six-month employment if all eligible applicants received an offer versus if none received an offer.",
        "Employment before and after training among those offered a place.",
      ],
      correct: 1,
      feedback:
        "Specify the eligible population, the offer, its alternative, the binary outcome and six-month horizon.",
    },
    {
      id: "design",
      writing:
        "Record your adjustment rationale. Name the path you want to block and the path you want to keep.",
      title: "Defend your adjustment set",
      text: "Use the proposed study graph. Select variables for the total effect of offering training and justify the choice.",
      graph: employment,
      prompt: "Why is your set sufficient under the proposed graph?",
      choices: [
        "It balances the two groups on how much training they actually took.",
        "It keeps only applicants who completed the programme.",
        "It blocks the common cause of offer and employment while retaining the attendance pathway.",
      ],
      correct: 2,
      feedback:
        "Prior experience affects both selection and employment. Attendance lies on a pathway from offer to employment.",
    },
    {
      id: "estimate",
      title: "Calculate a population effect",
      text: "These are original synthetic records summarized by prior work experience. Use all 200 eligible applicants as the target. Calculate each group’s employment-rate difference, then average the differences with the population shares.",
      experiment: "employment",
      prompt:
        "By how many percentage points does an offer change estimated six-month employment?",
      number: trainingResult().points,
      unit: "percentage points",
      feedback:
        "Within-group differences are 20 and 10 percentage points. The eligible mix is 60% and 40%, giving 16 percentage points.",
    },
    {
      id: "report",
      title: "Write the study conclusion",
      text: "Give the city a short conclusion in your own words. Include who the result applies to, the comparison, the estimate in percentage points and one condition that matters for interpretation.",
      writing: "Your study conclusion",
      prompt: "Which limitation belongs in the report?",
      choices: [
        "Unrecorded motivation could influence both who gets an offer and who finds employment.",
        "The two groups must have exactly the same sample size.",
        "A large enough sample would eliminate all bias.",
      ],
      correct: 0,
      feedback:
        "Compare your report with the worked interpretation. Among eligible applicants, offering training to everyone is estimated to increase six-month employment by 16 percentage points compared with offering it to nobody, assuming the adjustment accounts for common causes. The estimate does not identify the effect of attending.",
    },
  ],
};
