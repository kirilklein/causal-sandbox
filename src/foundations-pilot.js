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
  "write",
  "school",
  "done",
];
const saved = readPilot();
const state = {
  stage:
    saved.stage === "transfer"
      ? "write"
      : stages.includes(saved.stage)
        ? saved.stage
        : "predict",
  assignment: [0, 25, 50, 75, 100].includes(saved.assignment)
    ? saved.assignment
    : 100,
  previousAssignment: [0, 25, 50, 75, 100].includes(saved.previousAssignment)
    ? saved.previousAssignment
    : null,
  severity: SEVERITIES.includes(saved.severity) ? saved.severity : 7,
  sampleSize: [100, 1600].includes(saved.sampleSize) ? saved.sampleSize : 0,
  explanation: typeof saved.explanation === "string" ? saved.explanation : "",
};
if (typeof saved.explanationFirst === "string")
  state.explanationFirst = saved.explanationFirst;
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
  repeat: {
    prompt: "What changed when each study grew from 100 to 1,600 patients?",
    choices: [
      "The estimates moved closer to +12.",
      "The estimates spread out more widely.",
      "The estimates clustered more tightly, and their center stayed away from +12.",
    ],
    replies: [
      "Try again. Compare each plot’s mean with the +12 truth line.",
      "Try again. Compare the range under each plot.",
      "Yes. More patients reduce variation between samples. The severity imbalance remains, so the bias does too.",
    ],
    correct: 2,
  },
  school: {
    prompt: "Which explanation fits the school result?",
    choices: [
      "Tutoring harms pupils overall. Ten times as many pupils would show the harm more precisely.",
      "Pupils who start low are tutored more and also finish lower. More pupils would narrow the spread of estimates without removing the gap.",
      "The gap is chance in a small school. Ten times as many pupils would make it disappear.",
    ],
    replies: [
      "Try again. Within each starting-score group, tutored pupils improve more.",
      "Yes. To estimate the effect, compare pupils with the same starting score, then average over one shared mix of starting scores.",
      "Try again. A larger sample reduces chance variation. It leaves the difference in starting scores between the groups.",
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
function distribution(result, selected) {
  const strips = [1, 0].map((arm) => {
    const bars = result.strata
      .map((cell, s) => {
        const bar = `<i class="arm-${arm}" style="height:${cell[arm].count * 10}%"></i>`;
        return selected === undefined
          ? bar
          : `<span data-severity="${s}"${s === selected ? ' class="selected"' : ""}>${bar}</span>`;
      })
      .join("");
    return `<div class="pilot-strip"><span>${arm ? "Treated" : "Untreated"}</span>
      <div class="pilot-bars" aria-hidden="true">${bars}</div></div>`;
  });
  return `${strips.join("")}<div class="pilot-axis"><span>Milder</span><span>More severe</span></div>`;
}
function cellText(result) {
  const [untreated, treated] = result.strata[state.severity];
  if (!treated.count || !untreated.count)
    return `Severity ${state.severity} · Treated: ${treated.count} of 10. Untreated: ${untreated.count} of 10. No within-group comparison: one arm is empty.`;
  return `Severity ${state.severity} · Treated: ${treated.count} of 10, mean ${format(treated.mean)}. Untreated: ${untreated.count} of 10, mean ${format(untreated.mean)} points. Treated minus untreated: ${signed(treated.mean - untreated.mean)} points.`;
}
function experiment() {
  const options = SEVERITIES.map(
    (s) => `<option ${state.severity === s ? "selected" : ""}>${s}</option>`,
  ).join("");
  return `<label for="assignment">How strongly should severity influence assignment?</label>
    <input id="assignment" type="range" min="0" max="100" step="25" value="${state.assignment}">
    <div class="pilot-axis"><span>Equal shares</span><span>Favor more severe</span></div>
    <div id="comparison" aria-live="polite"></div>
    <label for="severity">Inspect baseline severity (or tap a bar column)</label><select id="severity">${options}</select>
    <p id="cell" role="status"></p><button class="primary" data-next>Explain the difference</button>`;
}
function updateComparison() {
  const result = comparison();
  const previous =
    state.previousAssignment === null
      ? null
      : observedComparison(observedPatients(state.previousAssignment / 100));
  document.querySelector("#comparison").innerHTML =
    means(result, previous) + distribution(result, state.severity);
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
  if (state.sampleSize === 1600) action = ask("repeat", "Try a new example");
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
    case "write":
      body = `<p>A school offers extra tutoring mainly to pupils with low baseline scores. Within each starting-score group, tutored pupils improve more. Yet their average final score is lower than that of other pupils.</p>
        <label for="explanation">How could that happen? What would enrolling ten times as many pupils under the same rule change? Answer in your own words.</label>
        <textarea id="explanation" rows="5" maxlength="2500"></textarea>
        <p>Your answer stays in this browser.</p>
        <button class="primary" data-next ${state.explanation.trim() ? "" : "disabled"}>Save and see answer choices</button>`;
      break;
    case "school":
      body = ask("school", "Finish this study");
      break;
    case "done":
      body =
        '<p>You explained how severity-based treatment assignment can reverse a comparison, and why a larger study can narrow its uncertainty while preserving the bias.</p><div class="pilot-review">' +
        (state.explanationFirst
          ? '<section><h3>Your first explanation</h3><p class="course-report" id="pilot-explanation"></p></section>'
          : "") +
        "<section><h3>Check it for three points</h3><ul><li>Starting score influences both who gets tutoring and the final score.</li><li>So the two groups average different mixes of pupils.</li><li>A larger sample narrows the spread of estimates but keeps the misleading comparison.</li></ul></section></div>" +
        '<a class="primary" id="pilot-onward" href="' +
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
    "Explain a new case",
    "Choose an explanation",
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
  if (state.stage === "write")
    panel.querySelector("#explanation").value = state.explanation;
  if (state.stage === "done" && state.explanationFirst)
    panel.querySelector("#pilot-explanation").textContent =
      state.explanationFirst;
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
    updateComparison();
    persist();
  }
});
panel.addEventListener("input", (event) => {
  if (event.target.id === "assignment") {
    state.previousAssignment = state.assignment;
    state.assignment = Number(event.target.value);
    updateComparison();
    persist();
  } else if (event.target.id === "explanation") {
    state.explanation = event.target.value;
    panel.querySelector("[data-next]").disabled = !state.explanation.trim();
    persist();
  }
});
panel.addEventListener("click", (event) => {
  const index = stages.indexOf(state.stage);
  const column = event.target.closest("[data-severity]");
  if (column) {
    state.severity = Number(column.dataset.severity);
    panel.querySelector("#severity").value = state.severity;
    updateComparison();
    persist();
    return;
  }
  if (event.target.matches("[data-next]")) {
    if (state.stage === "write")
      state.explanationFirst ??= state.explanation.trim();
    state.stage = stages[index + 1];
  } else if (event.target.id === "pilot-back") state.stage = stages[index - 1];
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
