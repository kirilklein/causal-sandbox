import "./lessons.css";
import { makeNoise } from "./simulation.js";
import { lessonBaseline, lessonResult } from "./lesson-simulation.js";

const lessons = [
  {
    title: "A randomized experiment",
    question:
      "If treatment is assigned at random, will the outcome difference equal the true effect?",
    transition:
      "Start with a treatment that changes an outcome. Nothing else influences treatment assignment.",
    instruction:
      "Change the treatment effect, then redraw the sample to see how estimates vary.",
    explanation:
      "Random assignment makes the groups comparable before treatment in the population. The unadjusted difference can estimate the treatment effect without adjustment. A finite sample still has chance differences, so its estimate need not equal the truth.",
    next: "In practice, people often receive treatment because of their baseline health. What changes then?",
  },
  {
    title: "A common cause",
    question:
      "What happens if baseline health also influences who receives treatment?",
    transition:
      "We reset the treatment effect to 2 and add one measured variable: baseline health (C). Higher C raises the outcome. Treatment starts randomized.",
    instruction:
      "Let baseline health influence treatment assignment. Compare the outcome difference with the true effect.",
    explanation:
      "When baseline health affects both treatment and outcome, it is a common cause, or confounder. The groups differ before treatment. Their outcome difference mixes the treatment effect with the influence of baseline health. Turning selection off restores random assignment; C still affects the outcome.",
    next: "How can we compare the groups while accounting for their different baseline health?",
  },
  {
    title: "Adjustment with IPW",
    question:
      "Can accounting for baseline health make the groups more comparable?",
    transition:
      "We return to the same baseline-health world with treatment selection on and a true effect of 2. First, look at the unadjusted difference.",
    instruction:
      "Open the weighting experiment, then account for baseline health.",
    explanation:
      "A propensity score is a person's probability of receiving treatment given baseline health. Inverse probability weighting (IPW) gives more weight to treated people with lower treatment probabilities and untreated people with higher treatment probabilities. We compare the weighted outcome averages. Here the treatment model includes the correct baseline-health relationship, and C is the only common cause. Weighting tends to reduce imbalance and bias across samples; it need not bring every estimate closer to truth.",
    next: "You have followed randomization → confounding → weighting. Later lessons will introduce outcome models and causal limitations. The full sandbox is available now, with additional concepts and controls.",
  },
];
let state,
  noise,
  revealed = false;
const app = document.querySelector("#app");
const requested = Number(new URLSearchParams(location.search).get("level"));
enter([1, 2, 3].includes(requested) ? requested : 1, false);

function enter(level, focus = true) {
  state = lessonBaseline(level);
  noise = makeNoise(state.n, state.seed);
  revealed = false;
  const lesson = lessons[level - 1];
  app.innerHTML = `
    <header class="lesson-header"><a class="brand" href="./">causal<span class="brand-dot">.</span></a><a href="?sandbox">Open full sandbox ↗</a></header>
    <main class="learning">
      <nav class="lesson-nav" aria-label="Lesson navigation"><span>Level ${level} of 3 · First chapter</span><details><summary>Contents</summary><ol>${lessons.map((l, i) => `<li><a href="?level=${i + 1}" ${level === i + 1 ? 'aria-current="step"' : ""}>${l.title}</a></li>`).join("")}</ol><a href="?sandbox">Full sandbox</a></details></nav>
      <div class="eyebrow">PREDICT · TRY · OBSERVE</div><h1 tabindex="-1">${lesson.title}</h1>
      <p class="lesson-transition">${lesson.transition}</p>
      <section class="experiment panel" aria-labelledby="question"><h2 id="question">${lesson.question}</h2>
        <div id="lesson-graph"></div>
        <p>${lesson.instruction}</p>
        <div class="lesson-controls">${level === 1 ? '<label for="effect">True treatment effect <output id="effect-output">2.0</output></label><input id="effect" type="range" min="-1" max="4" step="0.1" value="2">' : level === 2 ? '<label class="lesson-switch"><input id="selection" type="checkbox"> Baseline health influences treatment assignment</label>' : '<button id="reveal-ipw">Try weighting the groups</button><div id="weighting" hidden><p>We estimate each person’s treatment probability from baseline health. Weighting uses these probabilities to make a more comparable pair of groups.</p><label class="lesson-switch"><input id="adjustment" type="checkbox"> Account for baseline health</label></div>'}</div>
        <div class="lesson-results" aria-live="polite" aria-atomic="true"><div class="lesson-result truth-result"><span>True total effect</span><strong id="known-effect"></strong></div><div class="lesson-result"><span>Unadjusted difference</span><strong id="unadjusted"></strong></div><div id="ipw-result" class="lesson-result" hidden><span>IPW estimate</span><strong id="ipw"></strong></div></div>
        <div id="balance" hidden><h3>Baseline health in the two groups</h3><p>Compare their average C before and after weighting. More similar averages indicate better balance of this variable.</p><table><caption>Average baseline health (C)</caption><thead><tr><th scope="col">Comparison</th><th scope="col">Untreated</th><th scope="col">Treated</th></tr></thead><tbody><tr><th scope="row">Before weighting</th><td id="before-0"></td><td id="before-1"></td></tr><tr><th scope="row">After weighting</th><td id="after-0"></td><td id="after-1"></td></tr></tbody></table><p id="weight-note"></p></div>
        <div class="sample-actions"><button id="redraw">Redraw sample</button><span id="sample-label"></span></div>
      </section>
      <details class="lesson-explanation"><summary>Explain what is happening</summary><p>${lesson.explanation}</p>${level === 3 ? "<p>With baseline health unchecked, the treatment model uses one overall probability for everyone, so IPW equals the unadjusted difference. With it checked, we fit logistic treatment probabilities using C. We normalize weights within each group. For numerical stability, probabilities outside [0.02, 0.98] are clipped; this can introduce bias.</p>" : ""}</details>
      <p class="lesson-next">${lesson.next}</p>
      <nav class="lesson-actions" aria-label="Continue learning">${level > 1 ? '<button id="back">← Back</button>' : ""}<button id="restart">Restart level</button>${level < 3 ? `<button id="continue" class="primary">Continue: ${lessons[level].title} →</button>` : '<a class="primary" href="?sandbox">Explore the full sandbox ↗</a>'}</nav>
      <p class="lesson-credit">Guided prompts inspired by Carlos Mendez’s <a href="https://carlos-mendez.org/post/stata_matching/web_app/">Treatment Effects in Stata — Interactive Lab</a>.</p>
    </main>`;
  document.querySelector("#effect")?.addEventListener("input", (e) => {
    state.effect = +e.target.value;
    document.querySelector("#effect-output").textContent =
      state.effect.toFixed(1);
    update();
  });
  document.querySelector("#selection")?.addEventListener("change", (e) => {
    state.selection = e.target.checked ? 1.2 : 0;
    update();
  });
  document.querySelector("#adjustment")?.addEventListener("change", (e) => {
    state.adjusted = e.target.checked;
    update();
  });
  document.querySelector("#reveal-ipw")?.addEventListener("click", (e) => {
    revealed = true;
    document.querySelector("#weighting").hidden = false;
    document.querySelector("#adjustment").focus();
    e.target.hidden = true;
    update();
  });
  document.querySelector("#redraw").addEventListener("click", () => {
    noise = makeNoise(state.n, ++state.seed);
    update();
  });
  document
    .querySelector("#restart")
    .addEventListener("click", () => enter(level));
  document
    .querySelector("#back")
    ?.addEventListener("click", () => navigate(level - 1));
  document
    .querySelector("#continue")
    ?.addEventListener("click", () => navigate(level + 1));
  update();
  if (focus) document.querySelector("h1").focus();
}
function navigate(level) {
  history.pushState(null, "", `?level=${level}`);
  enter(level);
}
window.addEventListener("popstate", () => {
  const level = Number(new URLSearchParams(location.search).get("level"));
  enter([1, 2, 3].includes(level) ? level : 1);
});
function update() {
  const result = lessonResult(state, noise);
  document.querySelector("#known-effect").textContent = state.effect.toFixed(2);
  document.querySelector("#unadjusted").textContent =
    result.unadjusted.toFixed(2);
  document.querySelector("#ipw").textContent = result.ipw.toFixed(2);
  document.querySelector("#ipw-result").hidden = !revealed;
  document.querySelector("#balance").hidden = !revealed;
  if (revealed) {
    for (const when of ["before", "after"])
      result[when].forEach((value, arm) => {
        document.querySelector(`#${when}-${arm}`).textContent =
          value.toFixed(2);
      });
    document.querySelector("#weight-note").textContent = result.clipped
      ? `${result.clipped} treatment probabilities were clipped to [0.02, 0.98]; clipping can affect the comparison.`
      : "No treatment probabilities were clipped in this sample.";
  }
  document.querySelector("#sample-label").textContent =
    `2,400 people · Sample seed ${state.seed}`;
  const commonCause = state.level > 1;
  const treatmentDescription =
    state.effect === 0
      ? "Treatment has no effect on outcome."
      : "Treatment causes outcome.";
  const description = commonCause
    ? `Baseline health causes outcome${state.selection ? " and treatment" : ""}. ${treatmentDescription}`
    : `${treatmentDescription} Treatment is assigned at random.`;
  document.querySelector("#lesson-graph").innerHTML =
    `<svg viewBox="0 0 540 ${commonCause ? 190 : 95}" role="img" aria-label="${description}"><defs><marker id="lesson-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="#537565"/></marker></defs><g fill="none" stroke="#537565" stroke-width="2" marker-end="url(#lesson-arrow)">${state.effect !== 0 ? `<path d="M155 ${commonCause ? 145 : 45}H380"/>` : ""}${commonCause ? `<path d="M320 65L400 123"/>${state.selection ? '<path d="M220 65L130 123"/>' : ""}` : ""}</g>${commonCause ? '<rect x="170" y="15" width="200" height="50" rx="16" fill="#e7eee6"/><text x="270" y="46">Baseline health<tspan class="graph-symbol"> (C)</tspan></text>' : ""}<rect x="15" y="${commonCause ? 125 : 25}" width="140" height="42" rx="16" fill="#e6efe9"/><text x="85" y="${commonCause ? 152 : 52}">Treatment<tspan class="graph-symbol"> (A)</tspan></text><rect x="385" y="${commonCause ? 125 : 25}" width="140" height="42" rx="16" fill="#e5ebf4"/><text x="455" y="${commonCause ? 152 : 52}">Outcome<tspan class="graph-symbol"> (Y)</tspan></text></svg>`;
}
