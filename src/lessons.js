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
    next: "Weighting models who receives treatment. Could we instead predict the outcomes under each treatment?",
  },
  {
    title: "Adjustment with an outcome model",
    question: "Can we predict outcomes under each treatment?",
    transition:
      "We return to the same confounded world, now accounting for baseline health in both models. The true total effect is still 2.",
    instruction:
      "Reveal an outcome model and compare its estimate with IPW and truth. Redraw to see how both vary.",
    explanation:
      "We fit an outcome model using treatment and baseline health. For every person, we predict an outcome with treatment and an outcome without treatment, keeping their baseline health fixed. Averaging those differences gives the standardized outcome-regression estimate. Both models correctly describe this simple world, so both methods can estimate the effect, although neither must equal the truth in a sample.",
    next: "Both approaches rely on a model. What happens when a model is too simple?",
  },
  {
    title: "When a model is too simple",
    question: "Which relationship does each method need to model?",
    transition:
      "We reset to simple relationships, with slightly gentler treatment selection. Both models account for baseline health using a simple relationship.",
    instruction:
      "Make the outcome relationship more complex, then try treatment assignment. Can the same simple models still describe the world?",
    explanation:
      "A curved relationship means a one-unit change in baseline health need not have the same influence everywhere. We use C squared: the square of the same measured variable, not a new cause. A simple outcome model misses outcome curvature, while a correctly specified treatment model still supports IPW. In the second experiment, the simple outcome model is correct again, while the treatment model misses treatment curvature. These are separate failures; compare tendencies across redraws, rather than expecting every estimate to move closer to truth.",
    next: "We may not know which model is adequate. Can we combine the two approaches?",
  },
  {
    title: "Double robustness",
    question: "Can combining the models help when one is too simple?",
    transition:
      "Both relationships now contain the extra patterns from level 5. We start with models that capture both. The world stays fixed while you change the models.",
    instruction:
      "Make either model too simple by unchecking it. Then uncheck both. What happens to AIPW?",
    explanation:
      "Augmented inverse probability weighting (AIPW) combines the outcome predictions with a propensity-weighted correction based on their errors. Under the causal assumptions and with adequate overlap, it is consistent if either model is correctly specified: across increasingly large samples, it approaches the true effect. This does not promise exact recovery or the best estimate in every sample. When both models are wrong, that protection is lost. Model choices do not fix missing confounders or invalid adjustment.",
    next: "The next chapter will ask which variables it is valid to adjust for. Those lessons are still to come; the full sandbox is available as a separate advanced experiment.",
  },
];
let state,
  noise,
  revealed = false;
const app = document.querySelector("#app");
const requested = Number(new URLSearchParams(location.search).get("level"));
enter([1, 2, 3, 4, 5, 6].includes(requested) ? requested : 1, false);

function controls(level) {
  if (level === 1)
    return '<label for="effect">True treatment effect <output id="effect-output">2.0</output></label><input id="effect" type="range" min="-1" max="4" step="0.1" value="2">';
  if (level === 2)
    return '<label class="lesson-switch"><input id="selection" type="checkbox"> Baseline health influences treatment assignment</label>';
  if (level === 3)
    return '<button id="reveal-ipw">Try weighting the groups</button><div id="weighting" hidden><p>We estimate each person’s treatment probability from baseline health. Weighting uses these probabilities to make a more comparable pair of groups.</p><label class="lesson-switch"><input id="adjustment" type="checkbox"> Account for baseline health</label></div>';
  if (level === 4)
    return '<button id="reveal-regression">Predict outcomes under both treatments</button><p id="regression-explanation" hidden>For each person, predict an outcome with treatment and one without it, keeping baseline health fixed. Average the differences to estimate the effect.</p>';
  if (level === 5)
    return `<fieldset id="model-experiment"><legend>Choose an experiment</legend>${[
      ["simple", "Simple relationships"],
      ["outcome", "More complex outcome relationship"],
      ["treatment", "More complex treatment assignment"],
    ]
      .map(
        ([value, label]) =>
          `<label class="lesson-switch"><input type="radio" name="model-experiment" value="${value}" ${value === "simple" ? "checked" : ""}>${label}</label>`,
      )
      .join(
        "",
      )}</fieldset><p id="world-description" aria-live="polite"></p><figure class="model-preview" aria-labelledby="model-preview-title"><figcaption id="model-preview-title"></figcaption><div id="model-preview"></div><div class="model-legend"><span>━━ True relationship</span><span>┄┄ Our fitted model</span></div></figure><p id="model-description" aria-live="polite"></p>`;
  return `<p>AIPW combines outcome regression with a correction weighted by treatment probabilities. It uses both models below.</p><fieldset class="model-choices"><legend>What can our models capture?</legend><label class="lesson-switch"><input id="outcome-quadratic" type="checkbox" checked> Use a more flexible outcome model</label><label class="lesson-switch"><input id="treatment-quadratic" type="checkbox" checked> Use a more flexible treatment model</label><p class="sample-note">Checked: includes the extra pattern from level 5. Unchecked: uses the simple model. Both still account for baseline health.</p></fieldset>`;
}

function enter(level, focus = true) {
  state = lessonBaseline(level);
  noise = makeNoise(state.n, state.seed);
  revealed = false;
  const lesson = lessons[level - 1];
  app.innerHTML = `
    <header class="lesson-header"><a class="brand" href="./">causal<span class="brand-dot">.</span></a><a href="?sandbox">Open full sandbox ↗</a></header>
    <main class="learning">
      <nav class="lesson-nav" aria-label="Lesson navigation"><span>Level ${level} of ${lessons.length} · ${level < 4 ? "Foundations" : "Model reasoning"}</span><details><summary>Contents</summary><ol>${lessons.map((l, i) => `<li><a href="?level=${i + 1}" ${level === i + 1 ? 'aria-current="step"' : ""}>${l.title}</a></li>`).join("")}</ol><a href="?sandbox">Full sandbox</a></details></nav>
      <div class="eyebrow">PREDICT · TRY · OBSERVE</div><h1 tabindex="-1">${lesson.title}</h1>
      <p class="lesson-transition">${lesson.transition}</p>
      <section class="experiment panel" aria-labelledby="question"><h2 id="question">${lesson.question}</h2>
        <div id="lesson-graph"></div>
        <p>${lesson.instruction}</p>
        <div class="lesson-controls">${controls(level)}</div>
        <div class="lesson-results" aria-live="polite" aria-atomic="true"><div class="lesson-result truth-result"><span>True total effect</span><strong id="known-effect"></strong></div>${level <= 3 ? '<div class="lesson-result"><span>Unadjusted difference</span><strong id="unadjusted"></strong></div>' : ""}<div id="ipw-result" class="lesson-result" hidden><span>IPW estimate</span><strong id="ipw"></strong></div>${level >= 4 ? '<div id="regression-result" class="lesson-result" hidden><span>Outcome regression</span><strong id="regression"></strong></div>' : ""}${level === 6 ? '<div id="aipw-result" class="lesson-result" hidden><span>AIPW estimate</span><strong id="aipw"></strong></div>' : ""}</div>
        ${level === 6 ? '<p id="robustness-note" aria-live="polite"></p>' : ""}
        ${level === 4 ? '<details class="familiar-result"><summary>Recall the unadjusted difference</summary><p>Without accounting for baseline health: <strong id="unadjusted"></strong></p></details>' : ""}
        ${level >= 4 ? '<p id="model-weight-note" class="sample-note" aria-live="polite"></p>' : ""}
        <div id="balance" hidden><h3>Baseline health in the two groups</h3><p>Compare their average C before and after weighting. More similar averages indicate better balance of this variable.</p><table><caption>Average baseline health (C)</caption><thead><tr><th scope="col">Comparison</th><th scope="col">Untreated</th><th scope="col">Treated</th></tr></thead><tbody><tr><th scope="row">Before weighting</th><td id="before-0"></td><td id="before-1"></td></tr><tr><th scope="row">After weighting</th><td id="after-0"></td><td id="after-1"></td></tr></tbody></table><p id="weight-note"></p></div>
        <div class="sample-actions"><button id="redraw">Redraw sample</button><span id="sample-label"></span></div>
      </section>
      <details class="lesson-explanation"><summary>Explain what is happening</summary><p>${lesson.explanation}</p>${level === 3 ? "<p>With baseline health unchecked, the treatment model uses one overall probability for everyone, so IPW equals the unadjusted difference. With it checked, we fit logistic treatment probabilities using C. We normalize weights within each group. For numerical stability, probabilities outside [0.02, 0.98] are clipped; this can introduce bias.</p>" : ""}</details>
      ${level >= 4 ? `<details class="lesson-details"><summary>Model details (optional)</summary><p>Outcome regression fits an additive model of outcome using treatment and C, then averages predicted treated-minus-untreated outcomes. The treatment model is logistic: its linear predictor is converted to a probability, never used directly as one.</p>${level >= 5 ? "<p>Curvature adds C² − 1 to the world’s equation. Subtracting 1 centers the term without changing its shape. A model that includes C² can capture it because it also has an intercept. The causal graph stays the same: C is still the only common cause.</p>" : ""}${level === 6 ? "<p>AIPW averages m₁(C) − m₀(C) + A(Y − m₁(C))/p(C) − (1 − A)(Y − m₀(C))/(1 − p(C)), where m predicts outcomes and p predicts treatment probability. Both models are fitted to the same sample.</p>" : ""}<p>IPW normalizes weights within each treatment group. ${level === 6 ? "IPW and AIPW clip" : "IPW clips"} fitted probabilities to [0.02, 0.98]. Clipping can introduce bias even with a correct treatment model; these examples are designed to avoid it, and any clipping is reported beside the estimates.</p></details>` : ""}
      <p class="lesson-next">${lesson.next}</p>
      <nav class="lesson-actions" aria-label="Continue learning">${level > 1 ? '<button id="back">← Back</button>' : ""}<button id="restart">Restart level</button>${level < lessons.length ? `<button id="continue" class="primary">Continue: ${lessons[level].title} →</button>` : '<a class="primary" href="?sandbox">Explore the full sandbox ↗</a>'}</nav>
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
  document
    .querySelector("#reveal-regression")
    ?.addEventListener("click", (e) => {
      revealed = true;
      e.target.hidden = true;
      document.querySelector("#regression-explanation").hidden = false;
      update();
      document.querySelector("#redraw").focus();
    });
  document
    .querySelector("#model-experiment")
    ?.addEventListener("change", (e) => {
      state.outcomeCurve = e.target.value === "outcome" ? 2 : 0;
      state.treatmentCurve = e.target.value === "treatment" ? 0.9 : 0;
      update();
    });
  for (const model of ["outcome", "treatment"]) {
    document
      .querySelector(`#${model}-quadratic`)
      ?.addEventListener("change", (e) => {
        state[`${model}Quadratic`] = e.target.checked;
        update();
      });
  }
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
  enter([1, 2, 3, 4, 5, 6].includes(level) ? level : 1);
});
function renderModelPreview(points) {
  const treatment = state.treatmentCurve !== 0;
  const model = treatment ? "treatment" : "outcome";
  const title = treatment
    ? "Probability of receiving treatment"
    : "Expected outcome without treatment";
  const lo = treatment ? 0 : -4,
    hi = treatment ? 1 : 8;
  const x = (c) => 42 + (c / Math.sqrt(3) + 1) * 150;
  const y = (value) => 125 - ((value - lo) / (hi - lo)) * 105;
  const path = (fitted) =>
    points
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${x(p.C).toFixed(2)},${y(fitted ? p.fitted[model] : p[model]).toFixed(2)}`,
      )
      .join(" ");
  document.querySelector("#model-preview-title").textContent = title;
  document.querySelector("#model-preview").innerHTML =
    `<svg viewBox="0 0 360 165" role="img" aria-label="${title} by baseline health: solid line is the true relationship; dashed line is the fitted model.">${[lo, (lo + hi) / 2, hi].map((v) => `<path d="M42 ${y(v)}H342" stroke="#dde3db"/><text x="34" y="${y(v) + 4}" text-anchor="end">${treatment ? `${v * 100}%` : v}</text>`).join("")}<path data-curve="truth" d="${path(false)}" fill="none" stroke="#315e48" stroke-width="2.5"/><path data-curve="fitted" d="${path(true)}" fill="none" stroke="#ad562e" stroke-width="2.5" stroke-dasharray="6 4"/><text x="42" y="143">−1.7</text><text x="192" y="143" text-anchor="middle">0</text><text x="342" y="143" text-anchor="end">1.7</text><text x="192" y="161" text-anchor="middle">Baseline health (C)</text></svg>`;
}

function update() {
  const result = lessonResult(state, noise);
  document.querySelector("#known-effect").textContent = state.effect.toFixed(2);
  const unadjusted = document.querySelector("#unadjusted");
  if (unadjusted) unadjusted.textContent = result.unadjusted.toFixed(2);
  document.querySelector("#ipw").textContent = result.ipw.toFixed(2);
  document.querySelector("#ipw-result").hidden = state.level < 4 && !revealed;
  if (state.level >= 4) {
    document.querySelector("#regression").textContent =
      result.regression.toFixed(2);
    document.querySelector("#regression-result").hidden =
      state.level === 4 && !revealed;
    document.querySelector("#model-weight-note").textContent = result.clipped
      ? `${result.clipped} treatment probabilities were clipped to [0.02, 0.98]; clipping can affect ${state.level === 6 ? "IPW and AIPW" : "IPW"}.`
      : "No treatment probabilities were clipped in this sample.";
  }
  if (state.level === 6) {
    document.querySelector("#aipw").textContent = result.aipw.toFixed(2);
    document.querySelector("#aipw-result").hidden = false;
    const count =
      Number(state.outcomeQuadratic) + Number(state.treatmentQuadratic);
    document.querySelector("#robustness-note").textContent =
      count === 2
        ? "Both models capture their relationship. All three methods can estimate the effect in this world. Try simplifying one model."
        : count === 1
          ? `${state.outcomeQuadratic ? "Only the outcome model captures its relationship. IPW uses the model that is too simple." : "Only the treatment model captures its relationship. Outcome regression uses the model that is too simple."} AIPW can still estimate the effect with one correct model; it need not equal the truth in this sample.`
          : "Both models miss part of their relationship. AIPW no longer has the protection of one correct model.";
  }
  if (state.level === 5) renderModelPreview(result.preview);
  if (state.level === 5) {
    document.querySelector("#world-description").textContent =
      state.outcomeCurve
        ? state.treatmentCurve
          ? "World: both baseline-health relationships are curved. Model choices change only the analysis."
          : "Only the outcome relationship is now more complex. Treatment assignment stays simple."
        : state.treatmentCurve
          ? "Only treatment assignment is now more complex. The outcome relationship is simple again."
          : "Both relationships match what our simple models can describe.";
    document.querySelector("#model-description").textContent =
      `Our models: outcome ${!state.outcomeCurve || state.outcomeQuadratic ? "correctly specified" : "missing the added pattern"}; treatment ${!state.treatmentCurve || state.treatmentQuadratic ? "correctly specified" : "missing the added pattern"}. Both account for C.`;
  }
  document.querySelector("#balance").hidden = state.level !== 3 || !revealed;
  if (state.level === 3 && revealed) {
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
