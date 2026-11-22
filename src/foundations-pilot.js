import { learningFrame, learningUrl } from "./learning.js";
import {
  observedPatients,
  observedComparison,
  repeatedDifferences,
} from "./foundations-study.js";
import {
  completeModule,
  readPilot,
  savePilot,
} from "./foundations-progress.js";
import { BENEFIT, SEVERITIES } from "./trajectory-model.js";
import "./foundations.css";

const stages = [
  "predict",
  "assign",
  "explain",
  "reveal",
  "repeat",
  "transfer",
  "done",
];
const saved = readPilot();
const state = {
  stage: stages.includes(saved.stage) ? saved.stage : "predict",
  assignment: [0, 25, 50, 75, 100].includes(saved.assignment)
    ? saved.assignment
    : 100,
  previousAssignment: [0, 25, 50, 75, 100].includes(saved.previousAssignment)
    ? saved.previousAssignment
    : null,
  severity: SEVERITIES.includes(saved.severity) ? saved.severity : 7,
  sampleSize: [100, 1600].includes(saved.sampleSize) ? saved.sampleSize : 0,
};
const questions = {
  predict: {
    prompt: "Does the lower treated mean show that treatment caused harm?",
    choices: [
      "Yes, treated patients scored lower.",
      "No, the groups may have differed before treatment.",
      "I’m unsure.",
    ],
    replies: [
      "The means describe two different groups. Check how sick each group was before treatment.",
      "Exactly. Inspect how baseline severity differs between the groups.",
      "Start by comparing how sick the two groups were before treatment.",
    ],
  },
  explain: {
    prompt:
      "Why can changing the assignment rule reverse the observed difference?",
    choices: [
      "Treatment changes each patient’s health by a different amount under the new rule.",
      "The rule changes which severities contribute to each arm’s mean.",
    ],
    replies: [
      "Try again. The assignment control leaves each patient’s two possible outcomes fixed. Look at the shapes of the two groups.",
      "Yes. More severely ill patients have lower day-12 scores and receive treatment more often.",
    ],
    correct: 1,
  },
  transfer: {
    prompt:
      "A larger hospital uses the same assignment rule. Its crude difference is precisely negative. What would help you assess harm?",
    choices: [
      "Collect more patients under the same rule to eliminate the difference.",
      "Compare treated and untreated patients of the same baseline severity, then average using the hospital’s severity mix.",
      "Conclude harm because a precise difference excludes zero.",
    ],
    replies: [
      "Try again. More patients can reduce sampling noise while leaving the severity imbalance intact.",
      "That comparison addresses measured severity when both arms are represented. A causal interpretation still depends on having measured the important common causes.",
      "Try again. Precision describes variation across samples. It cannot tell you whether the comparison groups started out alike.",
    ],
    correct: 1,
  },
};
for (const [id, question] of Object.entries(questions)) {
  for (const key of [id, id + "First"]) {
    if (
      Number.isInteger(saved[key]) &&
      question.choices[saved[key]] !== undefined
    )
      state[key] = saved[key];
  }
}
learningFrame(
  "Did treatment harm these patients?",
  "observed-difference",
  '<nav class="course-location"><a href="?lesson=learn">Course modules</a> · Module 2 of 6</nav><section id="patient-pilot" class="panel patient-pilot"></section><p id="pilot-save" role="status"></p><details class="course-resources"><summary>Optional reading and experiments</summary><p><a href="?lesson=uncertainty">Explore confidence intervals</a> · <a href="?lesson=trajectory-landscape">Follow the patient trajectories</a> · <a href="https://miguelhernan.org/whatifbook">What If, chapters 7 and 10</a></p></details>',
);
const panel = document.querySelector("#patient-pilot");
function persist() {
  if (!savePilot({ ...state, current: "pilot" })) {
    document.querySelector("#pilot-save").textContent =
      "Progress is available for this visit. Browser storage is unavailable.";
  }
}
const format = (v) => v.toFixed(2);
const signed = (v) => (v >= 0 ? "+" : "−") + format(Math.abs(v));
function comparison() {
  return observedComparison(observedPatients(state.assignment / 100));
}
function means({ arms }, previous) {
  const difference = arms[1].mean - arms[0].mean;
  let change = "";
  if (previous) {
    const previousGap = previous.arms[1].mean - previous.arms[0].mean;
    change = `<p class="pilot-change">Change from previous setting: ${signed(difference - previousGap)} points.</p>`;
  }
  return `<div class="pilot-means">
    <div><span>Treated</span><strong>${format(arms[1].mean)}</strong></div>
    <div><span>Untreated</span><strong>${format(arms[0].mean)}</strong></div>
    <div><span>Difference</span><strong>${signed(difference)}</strong></div>
  </div>${change}`;
}
function ask(id, action) {
  const question = questions[id];
  const selected = state[id];
  const canContinue =
    selected !== undefined &&
    (question.correct === undefined || question.correct === selected);
  const choices = question.choices
    .map(
      (label, index) =>
        `<label><input type="radio" name="answer" value="${index}" ${selected === index ? "checked" : ""}>${label}</label>`,
    )
    .join("");
  return `<fieldset><legend>${question.prompt}</legend>${choices}</fieldset>
    <p role="status" id="answer-feedback">${question.replies[selected] || ""}</p>
    <button class="primary" data-next ${canContinue ? "" : "disabled"}>${action}</button>`;
}
function distribution(result) {
  const strips = [1, 0].map((arm) => {
    const bars = result.strata
      .map(
        (cell) =>
          `<i class="arm-${arm}" style="height:${cell[arm].count * 10}%"></i>`,
      )
      .join("");
    return `<div class="pilot-strip"><span>${arm ? "Treated" : "Untreated"}</span>
      <div class="pilot-bars" aria-hidden="true">${bars}</div></div>`;
  });
  return `${strips.join("")}<div class="pilot-axis"><span>Milder</span><span>More severe</span></div>`;
}
function cellText(result) {
  const [untreated, treated] = result.strata[state.severity];
  return `Severity ${state.severity} · Treated: ${treated.count} of 10, mean ${format(treated.mean)}. Untreated: ${untreated.count} of 10, mean ${format(untreated.mean)} points.`;
}
function experiment() {
  const options = SEVERITIES.map(
    (s) => `<option ${state.severity === s ? "selected" : ""}>${s}</option>`,
  ).join("");
  return `<label for="assignment">How strongly should severity influence assignment?</label>
    <input id="assignment" type="range" min="0" max="100" step="25" value="${state.assignment}">
    <div class="pilot-axis"><span>Equal shares</span><span>Favor more severe</span></div>
    <div id="comparison" aria-live="polite"></div>
    <label for="severity">Inspect baseline severity</label><select id="severity">${options}</select>
    <p id="cell" role="status"></p><button class="primary" data-next>Explain the difference</button>`;
}
function updateComparison() {
  const result = comparison();
  const previous =
    state.previousAssignment === null
      ? null
      : observedComparison(observedPatients(state.previousAssignment / 100));
  document.querySelector("#comparison").innerHTML =
    means(result, previous) + distribution(result);
  panel.querySelector("[data-next]").disabled = previous === null;
  document.querySelector("#cell").textContent = cellText(result);
}
function repeatFigure(size) {
  const values = repeatedDifferences(size);
  const center = values.reduce((sum, value) => sum + value, 0) / values.length;
  const range = `${signed(Math.min(...values))} to ${signed(Math.max(...values))}`;
  const x = (value) => 24 + (value + 16) * 8;
  return `<figure><figcaption>${size.toLocaleString("en-US")} patients per study</figcaption>
    <svg class="pilot-repeats" viewBox="0 0 288 84" role="img" aria-label="60 crude differences. Mean ${signed(center)} points. Range ${range}.">
      <path d="M24 56H280 M${x(BENEFIT)} 8V58"/>
      ${values.map((v, i) => `<circle cx="${x(v)}" cy="${12 + (i % 7) * 6}" r="2.5"/>`).join("")}
      <text x="24" y="77">−16</text><text x="${x(0)}" y="77">0</text><text x="${x(BENEFIT)}" y="77" text-anchor="middle">+12 truth</text>
    </svg><small>Mean ${signed(center)} · Range ${range} points</small></figure>`;
}
function repeats() {
  const figures = [100, 1600]
    .filter((size) => size <= state.sampleSize)
    .map(repeatFigure)
    .join("");
  let action =
    '<button class="primary" id="repeat">Run 60 studies of 100 patients</button>';
  if (state.sampleSize === 100)
    action =
      '<button class="primary" id="repeat">Increase to 1,600 patients per study</button>';
  if (state.sampleSize === 1600)
    action =
      '<p>With more patients the crude estimates cluster more tightly around the biased comparison.</p><button class="primary" data-next>Try another hospital</button>';
  return `<p>Return to the rule that favors treating sicker patients. Predict where repeated crude differences will cluster. Each dot represents a new sample from the same patient population.</p>${figures}${action}`;
}
function render(focus = true) {
  let body;
  const result = comparison();
  switch (state.stage) {
    case "predict":
      body =
        "<p>The opening followed ten patients. Here are all 100 from the same study. Sicker patients received treatment more often. Compare observed day-12 health in points (higher is better).</p>" +
        means(observedComparison(observedPatients(1))) +
        ask("predict", "Change assignment");
      break;
    case "assign":
      body =
        "<p>Predict which way the difference will move if both groups have the same severity mix. Slide toward equal shares to test it. Each bar counts patients at one severity.</p>" +
        experiment();
      break;
    case "explain":
      body =
        [1, 0]
          .map((rule) => {
            const ruled = observedComparison(observedPatients(rule));
            return `<figure><figcaption>${rule ? "Favor more severe" : "Equal shares"}</figcaption>${means(ruled)}${distribution(ruled)}</figure>`;
          })
          .join("") + ask("explain", "Compare with simulator truth");
      break;
    case "reveal":
      body =
        "<p>Averaging the observed within-severity differences over all ten groups gives <strong>" +
        signed(result.standardized) +
        " points</strong>. Both treatments occur at every severity.</p><p>In this simulation we can also compare each patient’s two day-12 outcomes. Treatment adds <strong>+" +
        BENEFIT +
        ' points</strong> for every patient, even when the pooled treated group looks sicker.</p><button class="primary" data-next>Test a larger study</button>';
      break;
    case "repeat":
      body = repeats();
      break;
    case "transfer":
      body = ask("transfer", "Finish this study");
      break;
    case "done":
      body =
        '<p>You explained how severity-based treatment assignment can reverse a comparison, and why a larger study can narrow its uncertainty while preserving the bias.</p><a class="primary" id="pilot-onward" href="' +
        learningUrl("foundations-adjustment") +
        '">Continue to adjustment choices →</a><p><a href="' +
        learningUrl("trajectory-landscape") +
        '">Explore the patient trajectories</a></p>';
      break;
  }
  const titles = [
    "Read the observed comparison",
    "Change who gets treated",
    "Explain the reversal",
    "Compare with the two possible futures",
    "Repeat the study",
    "Apply it to another hospital",
    "Study complete",
  ];
  const index = stages.indexOf(state.stage);
  panel.innerHTML =
    '<h2 tabindex="-1">' +
    titles[index] +
    "</h2>" +
    body +
    (index
      ? '<button class="text-button pilot-back" id="pilot-back">← Previous step</button>'
      : "");
  if (state.stage === "assign") updateComparison();
  if (focus) panel.querySelector("h2").focus();
}
panel.addEventListener("change", (event) => {
  if (event.target.name === "answer") {
    const choice = Number(event.target.value),
      id = state.stage,
      q = questions[id];
    state[id] = choice;
    state[id + "First"] ??= choice;
    document.querySelector("#answer-feedback").textContent = q.replies[choice];
    panel.querySelector("[data-next]").disabled =
      q.correct !== undefined && choice !== q.correct;
    persist();
  } else if (event.target.id === "severity") {
    state.severity = Number(event.target.value);
    document.querySelector("#cell").textContent = cellText(comparison());
    persist();
  }
});
panel.addEventListener("input", (event) => {
  if (event.target.id === "assignment") {
    state.previousAssignment = state.assignment;
    state.assignment = Number(event.target.value);
    updateComparison();
    persist();
  }
});
panel.addEventListener("click", (event) => {
  const index = stages.indexOf(state.stage);
  if (event.target.matches("[data-next]")) state.stage = stages[index + 1];
  else if (event.target.id === "pilot-back") state.stage = stages[index - 1];
  else if (event.target.id === "repeat")
    state.sampleSize = state.sampleSize ? 1600 : 100;
  else if (event.target.id === "pilot-onward") {
    savePilot({ current: "adjustment" });
    return;
  } else return;
  if (state.stage === "done") completeModule("pilot");
  persist();
  render();
});
persist();
render(false);
