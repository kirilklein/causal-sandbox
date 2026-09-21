import "./instrument-lesson.css";
import "./relevance-lesson.css";
import { themeControl } from "./theme.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { relevanceSample } from "./relevance-simulation.js";
import {
  relevanceScenes,
  relevanceGraph,
  relevancePlot,
  relevanceSummaries,
} from "./relevance-view.js";
import icon from "./brand.svg?raw";

const title = "Does better prediction mean a better causal estimate?";
document.title = `${title} · Causal Sandbox`;
document.querySelector("#app").innerHTML = `
<div class="instrument-page relevance-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main>
    ${lessonNavigation({ currentOptional: "causal-relevance" })}
    <p class="eyebrow">OPTIONAL · PREDICTION AND CAUSAL ESTIMATION</p>
    <h1 tabindex="-1">${title}</h1>
    <p class="intro">Predicting someone’s mobility and estimating what rehabilitation changes are different tasks. See how adding the same measurement can help one task and hurt the other.</p>
    <p class="small">Builds on <a href="?lesson=collider">colliders</a> and <a href="?lesson=hidden-confounding">hidden confounding</a>.</p>
    <div class="relevance-target"><span>ONE QUESTION THROUGHOUT</span><p>What is the average total effect of a rehabilitation program on mobility after 12 weeks?</p><small>Fictional study population · program versus no program · higher mobility is better</small></div>
    <nav class="relevance-steps" aria-label="Lesson steps">
      <button data-step="0"><span>1</span> A useful clue</button>
      <button data-step="1"><span>2</span> A misleading clue</button>
      <button data-step="2"><span>3</span> Your turn</button>
    </nav>
    <div id="relevance-scene"></div>
    <div class="relevance-bottom"><button id="restart-relevance">Restart lesson</button><a href="?lesson=topics">All topics</a><a href="?lesson=misspecification">Resume core lessons →</a></div>
    <details class="relevance-background"><summary>Background and other variable roles</summary>
      <p>Review <a href="?lesson=hidden-confounding">hidden common causes</a>, <a href="?lesson=collider">colliders</a>, or <a href="?lesson=timing">what timing tells us</a>.</p>
      <p>An <strong>unrelated variable</strong> has no relevant paths or predictive information in a stipulated toy world. An <strong>outcome cause independent of treatment</strong> can improve precision without removing confounding. Neither label can be established by one small fitted coefficient.</p>
      <p><strong>No direct effect</strong> still allows an indirect path through a mediator. <strong>No total effect</strong> can reflect opposing paths that cancel. <strong>No directed path</strong> rules out a causal effect within the assumed graph, but does not rule out predictive information. Explore <a href="?lesson=mediator">direct and mediated effects</a> and <a href="?lesson=arrow-strength&example=paths-cancel">cancelling paths</a>.</p>
    </details>
    <details><summary>Sources and simulation assumptions</summary>
      <p>These are specified additive models, not claims about real rehabilitation. All background draws are independent; the program’s effect is a constant +2 mobility points. Fitness and access are hidden from the analyst. Only the program, the measured score, and mobility enter the regression.</p>
      <p>Each of 60 independent studies fits outcome regression on 1,200 people and evaluates prediction on another 1,200. The two adjustment choices reuse the same people. Dots show sampling variation, not confidence intervals. Seeds 100–159 keep the comparisons reproducible.</p>
      <p>Proxy adjustment here is ordinary regression, not a specialized identification method. A noisy proxy does not necessarily reduce bias in other settings. Good prediction under the observed distribution does not establish accurate predictions under intervention.</p>
      <ul><li><a href="https://miguelhernan.org/whatifbook">Hernán & Robins, Causal Inference: What If</a>, chapters 6–8.</li><li><a href="https://arxiv.org/abs/1804.10846">Hernán, Hsu & Healy: description, prediction, and counterfactual prediction</a>.</li></ul>
    </details>
  </main>
</div>`;
setupLessonNavigation();

const el = (id) => document.getElementById(id);
const cache = new Map();
let step = 0;
let runId = 0;
let included = [false, false];
let guesses = [null, null];
let answer = null;
const fmt = (value) => value.toFixed(2);

function predictionView(studies) {
  const stats = relevanceSummaries(studies);
  return `<div class="prediction-bars" aria-label="Prediction error on new people">${stats.map((arm, i) => `<div><span>${i ? "With measurement" : "Without measurement"}</span><div class="prediction-track"><i style="width:${Math.min(100, (arm.prediction.mean / 2) * 100)}%"></i></div><strong>${fmt(arm.prediction.mean)}</strong></div>`).join("")}</div><p class="small">Average error predicting mobility in new people (RMSE). Lower is better. Both bars use the same 0–2 mobility-point scale.</p>`;
}

function updateResults() {
  const studies = cache.get(step);
  if (!studies) return;
  const scene = relevanceScenes[step];
  const active = included[step];
  el("effect-plot").innerHTML = relevancePlot(studies, active);
  el("include-measurement").disabled = false;
  el("include-measurement").setAttribute("aria-pressed", String(active));
  el("include-measurement").textContent =
    `${active ? "Remove" : "Include"} the ${scene.measurement}`;
  el("relevance-explanation").hidden = !active;
  el("relevance-explanation").innerHTML = active
    ? `<p class="relevance-takeaway">${scene.takeaway}</p><p>${scene.explanation}</p><p class="small">${scene.limitation}</p><h3>${step === 1 ? "Yet it predicts mobility better" : "It also predicts mobility better"}</h3>${predictionView(studies)}`
    : "";
  const direction = scene.expected === "closer" ? "closer to" : "farther from";
  el("guess-feedback").textContent =
    active && guesses[step]
      ? `${guesses[step] === scene.expected ? "Your prediction matches this result." : `Here, adjustment moves the mean estimate ${direction} truth.`} Compare the mean markers with the fixed truth line.`
      : "";
  el("study-status").textContent = "";
}

async function showStep(next, focus = true) {
  step = next;
  const current = ++runId;
  document.querySelectorAll("[data-step]").forEach((button) => {
    if (Number(button.dataset.step) === step)
      button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  if (step === 2) {
    el("relevance-scene").innerHTML =
      `<section class="panel relevance-transfer" aria-labelledby="scene-title"><p class="eyebrow">03 · APPLY THE DISTINCTION</p><h2 id="scene-title" tabindex="-1">A new measurement, an unknown role</h2><p>A wearable records a baseline activity score. It improves prediction of 12-week mobility in new patients. You do not yet know what causes this score or whether it affects treatment or mobility.</p><p class="relevance-question">Is that enough to decide whether to adjust for it when estimating the program’s total effect?</p><div class="relevance-answers" role="group" aria-label="Choose an answer"><button data-answer="include">Include it: it predicts mobility.</button><button data-answer="exclude">Omit it: it is not a proven cause.</button><button data-answer="unknown">We need a causal explanation first.</button></div><div id="practice-feedback" role="status"></div><div class="relevance-real-world"><h3>In real data, the graph is an assumption</h3><p>The first two examples supplied the causal story. Here, prediction cannot supply the missing arrows. Use study design, timing, and knowledge of how the measurement is produced. Check whether a proposed adjustment is valid across plausible graphs.</p><details><summary>What could justify leaving out an arrow?</summary><p>Timing can exclude backward causation. Randomized assignment can justify missing causes of treatment. Evidence about mechanisms and interventions can support particular exclusions. A weak association, null coefficient, or low feature importance alone cannot show that a variable is causally irrelevant.</p></details></div></section>`;
    document.querySelectorAll("[data-answer]").forEach((button) =>
      button.addEventListener("click", () => {
        answer = button.dataset.answer;
        showAnswer();
      }),
    );
    showAnswer();
  } else {
    const scene = relevanceScenes[step];
    el("relevance-scene").innerHTML =
      `<section class="panel relevance-experiment" aria-labelledby="scene-title">
      <p class="eyebrow">0${step + 1} · ${step ? "PREDICTION DOES NOT CERTIFY ADJUSTMENT" : "A VARIABLE CAN HELP WITHOUT CAUSING THE OUTCOME"}</p>
      <h2 id="scene-title" tabindex="-1">${scene.title}: the ${scene.measurement}</h2><p class="relevance-story">${scene.story}</p>
      <div class="relevance-workspace"><div class="relevance-world"><h3>The assumed world</h3><p class="small">Treat this graph as correct for the fictional study. Dashed nodes and arrows represent unmeasured causes.</p><div id="relevance-graph">${relevanceGraph(scene)}</div><p class="relevance-graph-note">The ${scene.measurement} is recorded before treatment. It has no causal path to mobility.</p></div>
      <div class="relevance-analysis"><h3>Our estimate of the program’s effect</h3><p class="small">60 independent studies · same studies before and after adjustment</p><div id="effect-plot"></div><p class="small effect-axis-label">Estimated effect (mobility points)</p><p class="small plot-key">Each dot is one study; ◆ marks the mean. Vertical spacing separates dots. Redder dots are farther from truth (0–2 points of error).</p></div></div>
      <div class="relevance-action"><p class="relevance-question">${scene.question}</p><fieldset id="relevance-guess"><legend>Predict where the mean estimate will move:</legend>${[
        ["closer", "Closer to truth"],
        ["same", "About the same"],
        ["farther", "Farther from truth"],
      ]
        .map(
          ([value, label]) =>
            `<label><input type="radio" name="guess" value="${value}" ${guesses[step] === value ? "checked" : ""}> ${label}</label>`,
        )
        .join(
          "",
        )}</fieldset><button id="include-measurement" class="primary" aria-pressed="false" disabled>Include the ${scene.measurement}</button><p class="small">This changes the regression adjustment, not the people, their outcomes, or the true effect.</p><p id="study-status" role="status">Preparing 60 studies…</p><p id="guess-feedback" role="status"></p></div>
      <div id="relevance-explanation" aria-live="polite" hidden></div>
      <div class="relevance-forward"><button id="next-relevance">${step ? "Try an unknown measurement →" : "Next: a misleading clue →"}</button></div>
    </section>`;
    document.querySelectorAll('[name="guess"]').forEach((radio) =>
      radio.addEventListener("change", () => {
        guesses[step] = radio.value;
        updateResults();
      }),
    );
    el("include-measurement").addEventListener("click", () => {
      included[step] = !included[step];
      updateResults();
    });
    el("next-relevance").addEventListener("click", () => showStep(step + 1));
    if (!cache.has(step)) {
      const studies = [];
      for (let i = 0; i < 60; i++) {
        if (current !== runId) return;
        const { fits, truth } = relevanceSample({
          world: scene.world,
          seed: 100 + i,
        });
        studies.push({ fits, truth });
        if (i % 10 === 9)
          await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (current !== runId) return;
      cache.set(step, studies);
    }
    updateResults();
  }
  if (focus && current === runId) el("scene-title").focus();
}

function showAnswer() {
  const responses = {
    include:
      "Prediction alone is not enough. The research score improved prediction but opened a collider path. We need to know how the activity score relates causally to treatment and mobility.",
    exclude:
      "Not being a proven cause does not make a measurement useless. The fitness test helped as a proxy in the first example. Its adjustment role still needed a causal explanation.",
    unknown:
      "Yes. Predictive usefulness is established for the tested setting; adjustment safety is not. Ask what causes the activity score, whether it affects treatment or mobility, and which paths adjustment would open or block.",
  };
  document
    .querySelectorAll("[data-answer]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.answer === answer),
      ),
    );
  el("practice-feedback").textContent = answer ? responses[answer] : "";
}

document
  .querySelectorAll("[data-step]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      showStep(Number(button.dataset.step)),
    ),
  );
el("restart-relevance").addEventListener("click", () => {
  included = [false, false];
  guesses = [null, null];
  answer = null;
  showStep(0);
});
showStep(0, false);
document.querySelector("h1").focus();
