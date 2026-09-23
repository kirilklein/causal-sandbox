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
  proxyMechanism,
  relevanceGraph,
  relevancePlot,
  relevanceSummaries,
} from "./relevance-view.js";
import icon from "./brand.svg?raw";

const title = "Proxies for hidden confounders";
document.title = `${title} · Causal Sandbox`;
document.querySelector("#app").innerHTML = `
<div class="instrument-page relevance-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main>
    ${lessonNavigation({ currentOptional: "causal-relevance" })}
    <p class="eyebrow">OPTIONAL · HIDDEN CONFOUNDING</p>
    <h1 tabindex="-1">${title}</h1>
    <p class="intro">We cannot always measure the factors that confound a treatment effect. Their observed consequences can give us partial information about them.</p>
    <p class="small">Builds on <a href="?lesson=hidden-confounding">hidden confounding</a>.</p>
    <section class="panel proxy-mechanism" aria-labelledby="mechanism-title">
      <h2 id="mechanism-title">How a proxy can help</h2>
      <div class="proxy-mechanism-layout">
        <div><div id="proxy-mechanism-graph" class="relevance-graph">${relevanceGraph(proxyMechanism, "proxy-mechanism-arrow")}</div><p class="small">U is unobserved; V, treatment, and outcome are measured.</p></div>
        <ol>
          <li><strong>A hidden confounder.</strong> U affects both treatment and outcome. This can bias our estimate of the treatment’s effect.</li>
          <li><strong>An observed proxy.</strong> U also influences V, which we can measure. V carries information about U; we call it a <em>proxy for the confounder</em>.</li>
          <li><strong>Partial adjustment.</strong> Adjusting for V can make the groups more comparable in U. A noisy proxy leaves some differences in U, so confounding can remain.</li>
        </ol>
      </div>
      <p class="small">The proxy need not cause treatment or outcome itself. This is one way proxy adjustment can help; it is not a guarantee that every proxy reduces bias.</p>
    </section>
    <nav class="relevance-steps" aria-label="Lesson steps">
      <button data-step="0"><span>1</span> Try the example</button>
      <button data-step="2"><span>2</span> Check your understanding</button>
    </nav>
    <div id="relevance-scene"></div>
    <div class="relevance-bottom"><button id="restart-relevance">Restart lesson</button><a href="?lesson=topics">All topics</a><a href="?lesson=misspecification">Resume core lessons →</a></div>
    <details class="relevance-background"><summary>Optional: why not adjust for every predictor?</summary>
      <p>A predictive measurement need not be a useful proxy for a confounder. If it is a <a href="?lesson=collider">collider</a>, adjustment can introduce bias even when it improves prediction.</p>
      <button data-step="1">Explore the collider comparison</button>
    </details>
    <details><summary>Background and other variable roles</summary>
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
let completed = [false, false];
let collapsed = [false, false, false];
const guessChoices = {
  closer: "Closer to truth",
  same: "About the same",
  farther: "Farther from truth",
};
const practiceChoices = {
  removed: "The proxy removed the hidden confounding.",
  reduced: "The proxy reduced the hidden confounding.",
  caused: "The proxy itself caused the outcome.",
};
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
  el("include-measurement").disabled = !completed[step] && !guesses[step];
  el("include-measurement").setAttribute("aria-pressed", String(active));
  el("include-measurement").textContent =
    `${active ? "Remove" : "Include"} the ${scene.measurement}`;
  el("relevance-explanation").hidden = !active;
  el("relevance-explanation").innerHTML = active
    ? `<p class="relevance-takeaway">${scene.takeaway}</p><p>${scene.explanation}</p><p class="small">${scene.limitation}</p>${step === 1 ? `<h3>Yet it predicts mobility better</h3>${predictionView(studies)}` : `<details><summary>Prediction is a separate question</summary>${predictionView(studies)}<p>Lower prediction error alone cannot show that a measurement is a useful proxy for a confounder. Its causal role matters.</p></details>`}`
    : "";
  el("study-status").textContent = "";
}

function showFeedback(
  { selected, correct, message, practice = false },
  anchorTop,
) {
  const choices = el("question-choices");
  choices.replaceWith(el("prediction-question"));
  const feedback = document.createElement("div");
  feedback.id = practice ? "practice-feedback" : "guess-feedback";
  feedback.className = "prediction-feedback";
  feedback.dataset.result = correct ? "correct" : "review";
  feedback.innerHTML = `<p><span class="prediction-feedback-icon" aria-hidden="true">${correct ? "✓" : "!"}</span><strong>${correct ? (practice ? "Correct." : "Good prediction!") : "Not quite."}</strong> ${practice ? "You answered" : "You predicted"}: “${selected}”</p><p>${message}</p>`;
  feedback.tabIndex = -1;
  feedback.setAttribute("role", "region");
  feedback.setAttribute(
    "aria-label",
    practice ? "Answer explained" : "Prediction explained",
  );
  el("prediction-hint").replaceWith(feedback);
  el("submit-practice")?.remove();
  const content = el("prediction-content");
  const toggle = document.createElement("button");
  toggle.id = "toggle-prediction";
  toggle.innerHTML = `<svg aria-hidden="true" width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m4 2 4 4-4 4"/></svg><span>${practice ? "Question and feedback" : "Prediction and feedback"}</span>`;
  toggle.setAttribute("aria-controls", content.id);
  toggle.setAttribute("aria-expanded", String(!collapsed[step]));
  content.hidden = collapsed[step];
  toggle.addEventListener("click", () => {
    collapsed[step] = !collapsed[step];
    content.hidden = collapsed[step];
    toggle.setAttribute("aria-expanded", String(!content.hidden));
  });
  document.querySelector(".prediction-header").replaceChildren(toggle);
  if (anchorTop !== undefined) {
    feedback.focus({ preventScroll: true });
    // Preserve the reading position as choices disappear and results are revealed.
    window.scrollBy({
      top: feedback.firstElementChild.getBoundingClientRect().top - anchorTop,
      behavior: "instant",
    });
  }
}

function showGuessFeedback(anchorTop) {
  const scene = relevanceScenes[step];
  const direction = scene.expected === "closer" ? "closer to" : "farther from";
  const stats = relevanceSummaries(cache.get(step));
  showFeedback(
    {
      selected: guessChoices[guesses[step]],
      correct: guesses[step] === scene.expected,
      message: `Adjustment moves the mean estimate ${direction} truth: ${fmt(stats[0].effect.mean)} → ${fmt(stats[1].effect.mean)}. Compare the mean lines with the true-effect line.`,
    },
    anchorTop,
  );
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
      `<section class="panel relevance-transfer" aria-labelledby="scene-title"><p class="eyebrow">02 · CHECK YOUR UNDERSTANDING</p><h2 id="scene-title" tabindex="-1">Closer to truth, but not all the way</h2><p>Across repeated studies, adjusting for the noisy proxy brings the average estimate closer to the true effect. A systematic gap remains.</p><div class="lesson-prediction"><div class="prediction-header">Your answer</div><div id="prediction-content"><fieldset id="question-choices" aria-describedby="prediction-hint"><legend><h3 id="prediction-question" class="relevance-question">What does this show in the simulated example?</h3></legend><div class="relevance-choices">${Object.entries(
        practiceChoices,
      )
        .map(
          ([value, label]) =>
            `<label><input type="radio" name="practice" value="${value}"> ${label}</label>`,
        )
        .join(
          "",
        )}</div></fieldset><p id="prediction-hint" class="small">Choose an answer, then check it.</p><button id="submit-practice" disabled>Check answer</button></div></div><div class="relevance-real-world"><h3>In real data, we do not know the true effect</h3><p>Here, we supplied the causal graph and the true effect. In a real study, a changed estimate alone cannot establish that a proxy helped. We need evidence that the measurement carries information about the hidden confounder, and assumptions about its other causal relationships.</p><details><summary>Does good outcome prediction establish a proxy’s role?</summary><p>No. A new wearable score might predict mobility without being a useful proxy for the hidden confounder. Study design, timing, and knowledge of how the score is produced help assess its causal role. The optional collider comparison shows why prediction alone is insufficient.</p></details></div></section>`;
    document.querySelectorAll('[name="practice"]').forEach((radio) =>
      radio.addEventListener("change", () => {
        el("submit-practice").disabled = false;
      }),
    );
    el("submit-practice").addEventListener("click", () => {
      const anchorTop = el("prediction-hint").getBoundingClientRect().top;
      answer = document.querySelector('[name="practice"]:checked').value;
      showAnswer(anchorTop);
    });
    showAnswer();
  } else {
    const scene = relevanceScenes[step];
    el("relevance-scene").innerHTML =
      `<section class="panel relevance-experiment" aria-labelledby="scene-title">
      <p class="eyebrow">${step ? "OPTIONAL · A DIFFERENT CAUSAL ROLE" : "01 · FROM MECHANISM TO EXAMPLE"}</p>
      <h2 id="scene-title" tabindex="-1">${scene.title}</h2><p class="relevance-story">${scene.story}</p><div class="relevance-target"><span>THE EFFECT WE WANT TO ESTIMATE</span><p>What is the average total effect of rehabilitation on mobility after 12 weeks?</p><small>Fictional study population · program versus no program · higher mobility is better</small></div>
      <div class="relevance-workspace"><div class="relevance-world"><h3>The assumed world</h3><p class="small">Treat this graph as correct for the fictional study. Dashed nodes and arrows represent unmeasured causes.</p><div id="relevance-graph" class="relevance-graph">${relevanceGraph(scene)}</div><p class="relevance-graph-note">The ${scene.measurement} is recorded before treatment. It has no causal path to mobility.</p></div>
      <div class="relevance-analysis"><h3>Our estimate of the program’s effect</h3><p class="small">60 independent studies · same studies before and after adjustment</p><div id="effect-plot"></div><p class="small effect-axis-label">Estimated effect (mobility points)</p><ul class="effect-legend" aria-label="Chart legend"><li><svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="3"/></svg>One study</li><li><svg viewBox="0 0 14 14" aria-hidden="true"><line class="effect-mean" x1="7" x2="7" y1="1" y2="13"/></svg>Mean</li></ul><p class="small plot-key">Vertical spacing separates studies. Redder dots indicate more error (0–2 points).</p></div></div>
      <div class="lesson-prediction"><div class="prediction-header">Your prediction</div><div id="prediction-content"><fieldset id="question-choices" aria-describedby="prediction-hint"><legend><h3 id="prediction-question" class="relevance-question">${scene.question}</h3></legend><p class="small">Predict where the mean estimate will move:</p><div class="relevance-choices">${Object.entries(
        guessChoices,
      )
        .map(
          ([value, label]) =>
            `<label><input type="radio" name="guess" value="${value}" ${guesses[step] === value ? "checked" : ""}> ${label}</label>`,
        )
        .join(
          "",
        )}</div></fieldset><p id="prediction-hint" class="small">Choose a prediction, then include the measurement. Any choice lets you continue.</p></div></div>
      <div class="relevance-action"><button id="include-measurement" class="primary" aria-pressed="false" disabled>Include the ${scene.measurement}</button><p class="small">This changes the regression adjustment, not the people, their outcomes, or the true effect.</p><p id="study-status" role="status">Preparing 60 studies…</p></div>
      <div id="relevance-explanation" hidden></div>
      <div class="relevance-forward"><button id="next-relevance">Check your understanding →</button></div>
    </section>`;
    document.querySelectorAll('[name="guess"]').forEach((radio) =>
      radio.addEventListener("change", () => {
        guesses[step] = radio.value;
        updateResults();
      }),
    );
    el("include-measurement").addEventListener("click", () => {
      const firstAnswer = !completed[step];
      const anchorTop = firstAnswer
        ? el("prediction-hint").getBoundingClientRect().top
        : undefined;
      completed[step] = true;
      included[step] = !included[step];
      updateResults();
      if (firstAnswer) showGuessFeedback(anchorTop);
    });
    el("next-relevance").addEventListener("click", () => showStep(2));
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
    if (completed[step]) showGuessFeedback();
  }
  if (focus && current === runId) el("scene-title").focus();
}

function showAnswer(anchorTop) {
  if (!answer) return;
  const responses = {
    removed:
      "Some confounding remains: the mean estimate still misses truth. A noisy proxy does not make hidden fitness identical between the treated and untreated groups.",
    reduced:
      "Yes. In this model, the proxy carries information about hidden fitness and reduces confounding. It does not fully measure fitness, so a systematic gap remains.",
    caused:
      "A proxy can help without causing the outcome. Hidden fitness causes both the test score and mobility; changing the recorded score alone would not change mobility in this graph.",
  };
  showFeedback(
    {
      selected: practiceChoices[answer],
      correct: answer === "reduced",
      message: responses[answer],
      practice: true,
    },
    anchorTop,
  );
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
  completed = [false, false];
  collapsed = [false, false, false];
  showStep(0);
});
showStep(0, false);
document.querySelector("h1").focus();
