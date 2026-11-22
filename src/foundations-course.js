import { learningFrame, learningUrl } from "./learning.js";
import { modules } from "./foundations-catalog.js";
import {
  readPilot,
  saveActivity,
  completeModule,
  completedModules,
} from "./foundations-progress.js";
import { activities } from "./foundations-activities.js";
import {
  experimentControl,
  experimentResult,
  explored,
} from "./foundations-experiments.js";
import { adjustmentMarkup, bindAdjustment } from "./adjustment-input.js";
import { gradeAdjustment, validAdjustmentChoice } from "./adjustment-model.js";
import "./foundations.css";

const route = new URLSearchParams(location.search).get("lesson");
const module = modules.find((m) => m.href === `?lesson=${route}`);
const steps = activities[module.id];
const saved = readPilot().activities?.[module.id] || {};
const records = saved.records || {};
let position = steps.findIndex((s) => s.id === saved.step);
if (position < 0) position = saved.step === "summary" ? steps.length : 0;
const escapeText = (text) =>
  String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const resources = {
  adjustment: [
    ["Explore timing and adjustment", "?lesson=timing"],
    ["Edit the mediator graph", "?sandbox=graph-lab&preset=mediator"],
    ["Longitudinal treatment", "?lesson=time-varying-confounding"],
  ],
  estimation: [
    [
      "Compare outcome regression and weighting in the scenario sandbox",
      "?sandbox&scenario=observed",
    ],
    ["Fit a propensity score", "?lesson=propensity-score"],
    ["Explore outcome predictions", "?lesson=outcome-regression"],
    ["Combine predictions and weights with AIPW", "?lesson=double-robustness"],
    ["Target predictions with TMLE", "?lesson=tmle"],
  ],
  trust: [
    ["Hidden confounding experiment", "?lesson=hidden-confounding"],
    ["Front-door identification", "?lesson=front-door"],
    ["Explore population trimming", "?lesson=trimming"],
    ["Open Scenario Sandbox", "?sandbox"],
  ],
  capstone: [
    ["Extended assessment", "?lesson=final-quiz"],
    ["Concept map", "?lesson=concept-map"],
  ],
};
const readings = {
  adjustment: [
    "Brady Neal, chapters 3–4: graphs and backdoor adjustment",
    "https://www.bradyneal.com/causal-inference-course",
  ],
  estimation: [
    "Facure, chapters 6 and 11: grouped regression and propensity scores",
    "https://matheusfacure.github.io/python-causality-handbook/landing-page.html",
  ],
  trust: [
    "Hernán and Robins, chapters 3 and 7: observational studies and confounding",
    "https://miguelhernan.org/whatifbook",
  ],
  capstone: [
    "Berkeley Causal Roadmap, step 7: interpretation",
    "https://ctml.berkeley.edu/introduction-causal-inference",
  ],
};
learningFrame(
  module.title,
  module.id,
  `<nav class="course-location"><a href="${learningUrl("learn")}">Course modules</a> · Module ${modules.indexOf(module) + 1} of 6</nav>
<section id="course-activity" class="panel patient-pilot course-activity"></section><p id="course-storage" role="status"></p>
<details class="course-resources"><summary>Optional reading and experiments</summary><ul>${[...resources[module.id], readings[module.id]].map(([title, url]) => `<li><a href="${url}">${title}</a></li>`).join("")}</ul></details>`,
);
const panel = document.querySelector("#course-activity");
function save() {
  if (
    !saveActivity(module.id, {
      step: steps[position]?.id || "summary",
      records,
    })
  )
    document.querySelector("#course-storage").textContent =
      "Progress is available for this visit. Browser storage is unavailable.";
}
function summary() {
  const next = modules[modules.indexOf(module) + 1];
  const scores = steps.filter((s) => records[s.id]?.first?.correct).length;
  const finished = completedModules().length;
  const estimate = steps.find((s) => s.number !== undefined);
  return `<h2 tabindex="-1">${next ? "Module complete" : "Your final study"}</h2>
 ${next ? `<p>${module.goal}</p>` : `<dl class="study-summary"><dt>${estimate.title}</dt><dd>${+estimate.number.toFixed(2)} ${estimate.unit}</dd><dt>Conclusion</dt><dd>${steps.at(-1).feedback}</dd></dl><ul>${steps.map((s) => `<li>${s.title}: ${records[s.id]?.first?.correct ? "correct on first submission" : "revised after feedback"}</li>`).join("")}</ul><p>${scores} of ${steps.length} decisions correct on first submission.</p>`}
 <p>${finished} of 6 modules completed in this browser.</p>
 <a class="primary" href="${next?.href || learningUrl("learn")}">${next ? "Continue: " + next.title : "View course modules"} →</a>
 <button type="button" data-back>Review last activity</button>`;
}
function render(focus = true) {
  const step = steps[position];
  if (!step) {
    panel.innerHTML = summary();
    const count = document.querySelector("[data-course-count]");
    if (count) count.textContent = completedModules().length;
    if (focus) panel.querySelector("h2").focus();
    return;
  }
  const r = (records[step.id] ||= {});
  const control = experimentControl(
    step.experiment,
    r.setting || 0,
    r.severity,
  );
  if (control && !r.seen) r.seen = [0];
  const options = step.choices
    ?.map(
      (label, i) =>
        `<label><input type="radio" name="reason" value="${i}" ${r.answer === i ? "checked" : ""} required>${label}</label>`,
    )
    .join("");
  panel.innerHTML = `<p class="sample-note">Activity ${position + 1} of ${steps.length}</p><h2 tabindex="-1">${step.title}</h2><p>${step.text}</p>
 ${control}<div id="course-result" aria-live="polite">${experimentResult(step.experiment, r.setting || 0, r.severity)}</div>
 <form>${step.graph ? adjustmentMarkup(step.graph) : ""} <fieldset><legend>${step.prompt}</legend>${options ?? `<label><input type="number" name="number" step="any" required value="${escapeText(r.answer)}"> ${step.unit}</label>`}</fieldset>
 <p id="course-feedback" role="status"></p><button class="primary" type="submit">${r.passed ? (position === steps.length - 1 ? "Finish module" : "Next activity") : "Check my decision"}</button></form>
 ${position ? '<button data-back class="pilot-back text-button">← Previous activity</button>' : ""}`;
  const form = panel.querySelector("form"),
    feedback = panel.querySelector("#course-feedback");
  const clearCheck = () => {
    r.passed = false;
    delete r.lastFeedback;
    feedback.textContent = "";
    form.querySelector("button[type=submit]").textContent = "Check my decision";
    save();
  };
  const graph = step.graph
    ? bindAdjustment(form, r.graph, (choice) => {
        r.graph = choice;
        clearCheck();
      })
    : null;
  feedback.textContent = r.passed ? step.feedback : r.lastFeedback || "";
  form.addEventListener("input", (event) => {
    if (event.target.name === "reason") r.answer = Number(event.target.value);
    else if (event.target.name === "number") r.answer = event.target.value;
    else return;
    clearCheck();
  });
  panel
    .querySelector("#course-setting")
    ?.addEventListener("change", (event) => {
      r.setting = Number(event.target.value);
      r.seen = [...new Set([...r.seen, r.setting])];
      panel.querySelector("#course-result").innerHTML = experimentResult(
        step.experiment,
        r.setting,
        r.severity,
      );
      clearCheck();
    });
  panel.querySelector("#inspect-fit")?.addEventListener("change", (event) => {
    r.severity = Number(event.target.value);
    panel.querySelector("#course-result").innerHTML = experimentResult(
      step.experiment,
      r.setting || 0,
      r.severity,
    );
    save();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (r.passed) {
      position++;
      if (position === steps.length) completeModule(module.id);
      save();
      render();
      return;
    }
    if (!explored(step.experiment, r.seen)) {
      feedback.textContent =
        step.experiment === "support"
          ? "Compare all three assignment settings first."
          : "Try a second setting and compare the result first.";
      return;
    }
    if (step.graph && !validAdjustmentChoice(step.graph, r.graph)) {
      feedback.textContent =
        "Select an adjustment set on the graph or choose one of the options below it.";
      return;
    }
    const judgment = step.graph ? gradeAdjustment(step.graph, r.graph) : null;
    const answerCorrect =
      step.number !== undefined
        ? Math.abs(Number(r.answer) - step.number) < 0.01
        : r.answer === step.correct;
    r.passed = answerCorrect && (!judgment || judgment.correct);
    r.first ??= {
      answer: r.answer,
      graph: r.graph,
      correct: r.passed,
    };
    r.attempts = (r.attempts || 0) + 1;
    if (judgment) graph.highlight(judgment.path);
    feedback.textContent = r.passed
      ? step.feedback
      : judgment && !judgment.correct
        ? judgment.message
        : step.hint ||
          (step.number !== undefined
            ? "Check the denominator and units, then calculate again."
            : "Trace the comparison in the study and reconsider your reason.");
    r.lastFeedback = feedback.textContent;
    if (r.passed)
      form.querySelector("button[type=submit]").textContent =
        position === steps.length - 1 ? "Finish module" : "Next activity";
    save();
  });
  if (focus) panel.querySelector("h2").focus();
}
panel.addEventListener("click", (event) => {
  if (event.target.closest("[data-back]")) {
    position--;
    save();
    render();
  }
});
save();
render(false);
