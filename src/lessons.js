import { arrowStrength } from "./arrow-strength.js";
import { themeControl } from "./theme.js";
import icon from "./brand.svg?raw";
import "./lessons.css";
import { effectComparison } from "./effect-comparison.js";
import { makeNoise } from "./simulation.js";
import { lessonBaseline, lessonResult } from "./lesson-simulation.js";
import { samplingView } from "./sampling-variation.js";

const lessons = [
  {
    slug: "randomization",
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
    slug: "confounding",
    title: "A common cause",
    question:
      "What happens if baseline health also influences who receives treatment?",
    transition:
      "We reset the treatment effect to 2 and add one measured variable: baseline health (C). Higher C raises the outcome. Treatment starts randomized.",
    instruction:
      "Increase baseline health’s influence on treatment assignment. Compare the outcome difference with the true effect.",
    explanation:
      "When baseline health affects both treatment and outcome, it is a common cause, or confounder. The groups differ before treatment. Their outcome difference mixes the treatment effect with the influence of baseline health. Returning the slider to zero restores random assignment; C still affects the outcome. Sample variation means the estimate need not move steadily away from truth at every step.",
    next: "How can we compare the groups while accounting for their different baseline health?",
  },
  {
    slug: "ipw",
    title: "Adjustment with IPW",
    question:
      "Can accounting for baseline health make the groups more comparable?",
    transition:
      "We return to the same baseline-health world with treatment selection on and a true effect of 2. First, look at the unadjusted difference.",
    instruction:
      "Try IPW, then compare the estimate and baseline-health balance before and after weighting.",
    explanation:
      "A propensity score is a person's probability of receiving treatment given baseline health. Inverse probability weighting (IPW) gives more weight to treated people with lower treatment probabilities and untreated people with higher treatment probabilities. We compare the weighted outcome averages. Here the treatment model captures the correct baseline-health relationship, and C is the only common cause. Weighting tends to reduce imbalance and bias across samples; it need not bring every estimate closer to truth.",
    next: "Weighting models who receives treatment. Could we instead predict the outcomes under each treatment?",
  },
  {
    slug: "outcome-regression",
    title: "Adjustment with an outcome model",
    question: "Can we predict outcomes under each treatment?",
    transition:
      "We return to the same confounded world, now accounting for baseline health in both models. The true total effect is still 2.",
    instruction:
      "Compare outcome regression and IPW with the unadjusted difference and truth. Redraw to see how the estimates vary.",
    explanation:
      "We fit an outcome model using treatment and baseline health. For every person, we predict an outcome with treatment and an outcome without treatment, keeping their baseline health fixed. Averaging those differences gives the standardized outcome-regression estimate. Both models correctly describe this simple world, so both methods can estimate the effect, although neither must equal the truth in a sample.",
    next: "Both methods account for baseline health. Should we also account for variables that treatment changes?",
  },
  {
    slug: "misspecification",
    title: "When a model is too simple",
    question: "Which relationship does each method need to model?",
    transition:
      "We remove the hidden cause and return to baseline health (C) alone: no mediator or follow-up score. The true total effect is 2. Treatment selection is slightly gentler, and both models start with the correct simple relationship.",
    instruction:
      "Make the outcome relationship more complex, then try treatment assignment. Can the same simple models still describe the world?",
    explanation:
      "A curved relationship means a one-unit change in baseline health need not have the same influence everywhere. We use C squared: the square of the same measured variable, not a new cause. A simple outcome model misses outcome curvature, while a correctly specified treatment model still supports IPW. In the second experiment, the simple outcome model is correct again, while the treatment model misses treatment curvature. These are separate failures; compare tendencies across redraws, rather than expecting every estimate to move closer to truth.",
    next: "We may not know which model is adequate. Can we combine the two approaches?",
  },
  {
    slug: "double-robustness",
    title: "Double robustness",
    question: "Can combining the models help when one is too simple?",
    transition:
      "Both relationships now contain the extra patterns from the preceding model experiment. We start with models that capture both. The world stays fixed while you change the models.",
    instruction:
      "Make either model too simple by unchecking it. Then uncheck both. What happens to AIPW?",
    explanation:
      "Augmented inverse probability weighting (AIPW) combines the outcome predictions with a propensity-weighted correction based on their errors. When adjustment controls confounding and comparable people can receive either treatment (overlap), it is consistent if either model is correctly specified: across increasingly large samples, it approaches the true effect. This does not promise exact recovery or the best estimate in every sample. When both models are wrong, that protection is lost. Model choices do not fix missing confounders or invalid adjustment.",
    next: "One correct model can protect against model mismatch. Revisit hidden confounding to see the limit of that protection, or continue to scarce treatment comparisons.",
  },
  {
    slug: "mediator",
    title: "A mediator",
    intuition: {
      title: "Example: exercise and fitness",
      paragraphs: [
        "Exercise can improve fitness, and improved fitness can help people live longer. Fitness carries part of exercise’s effect.",
        "To understand the total effect, we let fitness change with exercise. To understand the direct effect, imagine changing how much someone exercises while keeping their fitness the same. What difference would exercise still make to longevity?",
        "Adjusting for a mediator changes the question: instead of asking about the total effect, we ask what remains when we hold that intermediate step fixed.",
      ],
    },
    question: "Which effect do we want to estimate?",
    transition:
      "We keep the simple relationships and correct baseline-health adjustment from outcome regression. Treatment now also changes an intermediate response (M), which changes the outcome. This extra pathway raises the true total effect from 2 to 3.",
    instruction:
      "First compare outcome regression with the total effect. Then include the intermediate response. Does accounting for more information help answer the same question?",
    explanation:
      "A mediator carries part of treatment’s effect to the outcome. Here treatment raises M by 1, and each unit of M raises the outcome by 1. The direct contribution is 2 and the mediated contribution is 1, giving a total effect of 3. Including M holds it fixed in our outcome predictions, blocking the pathway we wanted to count. An estimate near 2 misses our total-effect target of 3, but recovers the direct contribution under this simulation’s assumptions. We still account for baseline health in both comparisons.",
    next: "The intermediate response lies on a path from treatment to outcome. What if a measured variable is instead a consequence of both?",
  },
  {
    slug: "collider",
    title: "A collider",
    intuition: {
      title: "Example: follow-up care in healthcare",
      paragraphs: [
        "Consider a healthcare example. Patients receiving treatment have scheduled follow-up visits. Patients with worse symptoms also need more follow-up care. Here, symptoms are measured before those visits, so the later care cannot change the outcome already recorded.",
        "Now compare only people with the same amount of follow-up care. A treated person may have needed those visits simply because of the treatment schedule. An untreated person may have needed them because their symptoms were worse.",
        "Matching on follow-up care therefore tends to select treated people with fewer symptoms and untreated people with more symptoms. That can make treatment look better, even if treatment was originally assigned at random.",
        "There are two reasons for ending up with the same amount of care: treatment and worse symptoms. Once we hold care use fixed, more of one reason tends to mean less of the other. That creates a relationship between treatment and symptoms that can distort our estimate.",
      ],
    },
    question: "Can adjustment create a misleading relationship?",
    transition:
      "We remove the mediator and return to the simple baseline: the true total effect is 2 again. We now measure a follow-up score (K) after the outcome. Both treatment and outcome raise this score; it causes neither.",
    instruction:
      "Start with baseline-health adjustment alone. Then include the follow-up score in the outcome model. The world stays fixed; only the comparison changes.",
    explanation:
      "A follow-up score, such as later care use, is a collider: two arrows meet at it, treatment → score ← outcome. Among people with the same score, having treatment leaves less of the score to be explained by the outcome. Holding the score fixed creates a misleading relationship and can distort the treatment estimate, even while we correctly account for baseline health. Measured variables are not automatically valid adjustment variables.",
    next: "We can account for measured baseline health. What if another common cause is missing from our data?",
  },
  {
    slug: "hidden-confounding",
    title: "A hidden common cause",
    question: "What if an important confounder is unavailable?",
    transition:
      "We remove the follow-up score and keep baseline health (C) measured and adjusted for. The true total effect remains 2. Now add smoking status (U), which is missing from our data. We show it in the graph so you can see what the models cannot use.",
    instruction:
      "Turn up smoking’s influence on treatment and outcome. Do the estimates still track the true effect?",
    explanation:
      "In this fictional experiment, smoking makes treatment more likely and raises the outcome. As its influence grows, treated and untreated groups differ in smoking status even after adjusting for baseline health. The estimates mix this difference with the treatment effect. IPW and outcome regression cannot adjust for information they do not have. Sample variation means estimates need not move steadily away from truth at every slider step.",
    next: "Missing information is one problem; describing measured information incorrectly is another. Next, remove the hidden cause and test models that are too simple.",
  },
];
lessons[9] = {
  slug: "overlap",
  title: "Too little overlap",
  question:
    "What if almost everyone with the same baseline health receives the same treatment?",
  transition:
    "We return to the simple world: baseline health (C) is observed and included in both correctly specified models. There are no hidden causes or post-treatment variables. The true total effect is 2.",
  instruction:
    "Strengthen treatment selection, then compare the treatment probabilities and weights. Redraw to explore how the estimates vary.",
  explanation:
    "Overlap means people with similar baseline health can receive either treatment. Strong selection leaves few people receiving the less likely treatment for their profile. Weighting asks those few people to represent many others, concentrating information in a small part of each group. Outcome regression relies more on predictions where comparisons are sparse. AIPW does not create missing comparisons, even with correct models. An estimate can still be close to truth in a particular sample.",
  next: "You can now explore how these limitations combine in the full sandbox. That link starts a separate experiment with two measured baseline variables. C groups C₁ and C₂ there; an interaction lets the influence of one depend on the other.",
};
// Numeric IDs retain the original simulation and ?level= link identities.
// Only this order determines the displayed positions and navigation.
const availableLevels = [1, 2, 3, 4, 7, 8, 9, 5, 6, 10];
const hiddenCallback = {
  ...lessons[8],
  title: "Revisit hidden confounding with AIPW",
  transition:
    "We return to the hidden-confounding experiment from level 7, with simple relationships and smoking’s influence reset to zero. Both models use baseline health; neither can use smoking status. AIPW is now included in the comparison.",
  explanation:
    "AIPW combines the same predictions and weights as before. A correct model for one part of an identified causal problem can protect against the other model being wrong; it cannot supply missing confounding information. As smoking’s influence grows, all three estimates can miss the true effect. Agreement between methods does not establish that confounding has been controlled.",
  next: "Return to the fixed model experiment, or continue to overlap: do we have enough comparable people receiving each treatment?",
};
let state,
  noise,
  studies = [],
  revealed = false,
  revisiting = false;
const app = document.querySelector("#app");
app.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".lesson-nav")) {
    document
      .querySelector("#lesson-menu-toggle")
      .setAttribute("aria-expanded", "false");
  }
});
app.addEventListener("keydown", (event) => {
  const toggle = document.querySelector("#lesson-menu-toggle");
  if (
    event.key === "Escape" &&
    toggle.getAttribute("aria-expanded") === "true"
  ) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  }
});
enterFromUrl(false);

function enterFromUrl(focus = true) {
  const params = new URLSearchParams(location.search);
  const named =
    lessons.findIndex((lesson) => lesson.slug === params.get("lesson")) + 1;
  const requested = params.has("lesson") ? named : Number(params.get("level"));
  const level = availableLevels.includes(requested) ? requested : 1;
  const callback =
    level === 6 && params.get("revisit") === "hidden-confounding";
  enter(callback ? 9 : level, focus, callback);
}

function lessonUrl(level) {
  return `?lesson=${lessons[level - 1].slug}`;
}

function showsAipw(level) {
  return level === 6 || level === 10 || revisiting;
}

function controls(level) {
  if (level === 10)
    return `<fieldset class="model-choices" id="overlap-selection"><legend>How strongly does baseline health determine treatment?</legend><label class="lesson-switch"><input type="radio" name="overlap-selection" value="1.2" checked> Moderate selection</label><label class="lesson-switch"><input type="radio" name="overlap-selection" value="5"> Strong selection</label></fieldset>`;
  if (level === 9)
    return '<label for="hidden-strength">Hidden confounding strength <output id="hidden-strength-output">0.0</output></label><input id="hidden-strength" type="range" min="0" max="2" step="0.1" value="0" aria-describedby="hidden-strength-help"><p id="hidden-strength-help" class="sample-note">0: no influence · 2: strong influence on both treatment and outcome. Both models always adjust for C; neither can use U.</p>';
  if (level === 1)
    return '<label for="effect">True treatment effect <output id="effect-output">2.0</output></label><input id="effect" type="range" min="-1" max="4" step="0.1" value="2">';
  if (level === 2)
    return '<label for="selection">Baseline health’s influence on treatment <output id="selection-output">0.0</output></label><input id="selection" type="range" min="0" max="1.2" step="0.1" value="0" aria-describedby="selection-help"><p id="selection-help" class="sample-note">0: random assignment · 1.2: selection used in the next lesson. Baseline health’s influence on the outcome stays fixed.</p>';
  if (level === 3)
    return '<button id="reveal-ipw">Try IPW</button><p id="weighting" hidden>Weighting gives more weight to people whose baseline health is less common in their treatment group.</p>';
  if (level === 4)
    return '<p id="regression-explanation">For each person, predict an outcome with treatment and one without it, keeping baseline health fixed. Average the differences to estimate the effect.</p>';
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
  if (level === 7 || level === 8)
    return `<p>Outcome regression always accounts for baseline health. The target remains the <strong>total treatment effect</strong>.</p><label class="lesson-switch"><input id="post-adjustment" type="checkbox"> Also account for ${level === 7 ? "the intermediate response (M)" : "the follow-up score (K)"}</label>`;
  return `<p>Augmented inverse probability weighting (AIPW) combines outcome regression with a correction weighted by treatment probabilities. It uses both models below.</p><fieldset class="model-choices"><legend>What can our models capture?</legend><label class="lesson-switch"><input id="outcome-quadratic" type="checkbox" checked> Use a more flexible outcome model</label><label class="lesson-switch"><input id="treatment-quadratic" type="checkbox" checked> Use a more flexible treatment model</label><p class="sample-note">Checked: includes the extra pattern from the preceding model experiment. Unchecked: uses the simple model. Both still account for baseline health.</p></fieldset>`;
}

function lessonNavigation(position) {
  const groups = [
    { title: "Foundations", start: 0, end: 4 },
    { title: "Causal roles", start: 4, end: 7 },
    { title: "Models and limitations", start: 7, end: 10 },
  ];
  return `<nav class="lesson-nav" aria-label="Lesson navigation">
    <div class="lesson-nav-heading"><button id="lesson-menu-toggle" aria-expanded="false" aria-controls="lesson-menu"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M8 3v14"/><path class="contents-direction" d="m11 8 2 2-2 2"/></svg><span>Contents</span></button><span>Level ${position + 1} of 11${revisiting ? " · Optional revisit" : ""}</span></div>
    <div id="lesson-menu">${groups
      .map(
        ({ title, start, end }) =>
          `<section class="lesson-group" aria-label="${title}"><h2>${title}</h2><ol start="${start + 1}">${availableLevels
            .slice(start, end)
            .map(
              (id, offset) =>
                `<li><a href="${lessonUrl(id)}" data-level="${id}" aria-label="${lessons[id - 1].title}" data-number="${start + offset + 1}" ${position === start + offset ? 'aria-current="step"' : ""}>${lessons[id - 1].title}</a></li>`,
            )
            .join("")}</ol></section>`,
      )
      .join("")}
    <a class="sandbox-nav-link" href="?sandbox">Full sandbox ↗</a></div>
  </nav>`;
}

function enter(level, focus = true, callback = false) {
  revisiting = callback;
  state = lessonBaseline(level);
  studies = [];
  noise = makeNoise(state.n, state.seed);
  revealed = false;
  const lesson = revisiting ? hiddenCallback : lessons[level - 1];
  const position = availableLevels.indexOf(revisiting ? 6 : level);
  const previous = revisiting ? 6 : availableLevels[position - 1];
  const next = availableLevels[position + 1];
  app.innerHTML = `
    <header class="lesson-header"><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Open full sandbox ↗</a>${themeControl()}</header>
    <main class="learning">
      ${position === 0 ? '<p class="brand-tagline">Learn causal inference by changing the world.</p>' : ""}
      ${lessonNavigation(position)}
      <div class="eyebrow">PREDICT · TRY · OBSERVE</div><h1 tabindex="-1">${lesson.title}</h1>
      <p class="lesson-transition">${lesson.transition}</p>
      <section class="experiment panel" aria-labelledby="question"><h2 id="question">${lesson.question}</h2>
        <div id="lesson-graph"></div>
        <p>${lesson.instruction}</p>
        <div class="lesson-controls">${controls(level)}</div>
        <div class="lesson-results" aria-live="polite" aria-atomic="true"><div class="lesson-result truth-result"><span>True total effect</span><strong id="known-effect"></strong></div>${level <= 4 ? '<div class="lesson-result"><span>Unadjusted difference</span><strong id="unadjusted"></strong></div>' : ""}<div id="ipw-result" class="lesson-result" tabindex="-1" hidden><span>IPW estimate</span><strong id="ipw"></strong></div>${level >= 4 ? '<div id="regression-result" class="lesson-result" hidden><span>Outcome regression</span><strong id="regression"></strong></div>' : ""}${showsAipw(level) ? '<div id="aipw-result" class="lesson-result" hidden><span>AIPW estimate</span><strong id="aipw"></strong></div>' : ""}</div>
        <p class="sample-note">Stronger red means farther from truth in this sample.</p>
        ${level === 7 ? '<p class="sample-note">True effect breakdown: 2 direct + 1 through the intermediate response = 3 total.</p>' : ""}
        ${level === 7 || level === 8 ? '<p id="adjustment-note" aria-live="polite"></p>' : ""}
        ${level === 6 ? '<p id="robustness-note" aria-live="polite"></p>' : ""}
        ${(level >= 4 && level <= 6) || level === 9 || level === 10 ? '<p id="model-weight-note" class="sample-note" aria-live="polite"></p>' : ""}
        ${level === 10 ? overlapPanel() : ""}
        <div id="balance" hidden><h3>Baseline health in the two groups</h3><p>Compare their average C before and after weighting. More similar averages indicate better balance of this variable.</p><table><caption>Average baseline health (C)</caption><thead><tr><th scope="col">Comparison</th><th scope="col">Untreated</th><th scope="col">Treated</th></tr></thead><tbody><tr><th scope="row">Before weighting</th><td id="before-0"></td><td id="before-1"></td></tr><tr><th scope="row">After weighting</th><td id="after-0"></td><td id="after-1"></td></tr></tbody></table><p id="weight-note"></p></div>
        <div class="sample-actions"><button id="redraw">Redraw sample</button><span id="sample-label"></span></div>
        ${
          level <= 2
            ? `<details class="sampling-variation"><summary>Compare repeated studies</summary>
          <p>Repeat the study with another 2,400 people. Each dot is an unadjusted estimate; the dashed line marks the true effect. The filled dot is the latest study.</p>
          <button id="repeat-study">Repeat study</button>
          <p id="sampling-summary" class="sample-note" aria-live="polite"></p>
          <div id="sampling-plot"></div>
          <p>${level === 1 ? "Randomization lets estimates fluctuate around truth across studies. Their spread is sampling variation." : "At zero selection, estimates fluctuate around truth. With confounding, repeated estimates tend to remain away from truth: systematic error, or bias. Repeating a biased comparison does not fix it."} One study cannot show either pattern. This plot is not a confidence interval.</p>
          <p class="sample-note">Changing the slider starts a new series with the current sample. Restart restores the initial world and sample.</p>
          <details><summary>Study values</summary><div class="sampling-table"><table><caption>Unadjusted estimates in outcome units</caption><thead><tr><th scope="col">Study</th><th scope="col">Seed</th><th scope="col">Estimate</th><th scope="col">Difference from truth</th></tr></thead><tbody id="sampling-values"></tbody></table></div></details>
        </details>`
            : ""
        }
      </section>
      <details class="lesson-explanation"><summary>Explain what is happening</summary><p>${lesson.explanation}</p>${level === 3 ? "<p>We fit treatment probabilities using baseline health (C), then compare weighted outcome averages. Each average divides by its group’s total weight. For numerical stability, probabilities outside [0.02, 0.98] are clipped; this can introduce bias.</p>" : ""}</details>
      ${lesson.intuition ? `<details class="lesson-intuition"><summary>${lesson.intuition.title}</summary>${lesson.intuition.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}</details>` : ""}
      ${level >= 4 && level <= 6 ? `<details class="lesson-details"><summary>Model details (optional)</summary><p>Outcome regression fits an additive model of outcome using treatment and C, then averages predicted treated-minus-untreated outcomes. The treatment model is logistic: its linear predictor is converted to a probability, never used directly as one.</p>${level >= 5 ? "<p>Curvature adds C² − 1 to the world’s equation. Subtracting 1 centers the term without changing its shape. A model that includes C² can capture it because it also has an intercept. The causal graph stays the same: C is still the only common cause.</p>" : ""}${level === 6 ? "<p>AIPW averages m₁(C) − m₀(C) + A(Y − m₁(C))/p(C) − (1 − A)(Y − m₀(C))/(1 − p(C)), where m predicts outcomes and p predicts treatment probability. Both models are fitted to the same sample.</p>" : ""}<p>IPW normalizes weights within each treatment group. ${level === 6 ? "IPW and AIPW clip" : "IPW clips"} fitted probabilities to [0.02, 0.98]. Clipping can introduce bias even with a correct treatment model; these examples are designed to avoid it, and any clipping is reported beside the estimates.</p></details>` : ""}
      ${level === 7 || level === 8 ? `<details class="lesson-details"><summary>Model details (optional)</summary><p>We fit outcome using treatment and baseline health${level === 7 ? ", optionally adding M" : ", optionally adding K"}. As in level 4, we average predicted treated-minus-untreated outcomes, holding the other included variables fixed.</p><p>${level === 7 ? "This additive simulation has independent errors: M = A + error and Y = 2A + 1.5C + M + error. A controlled direct effect compares treatment choices while fixing M at a specified value. Holding M fixed recovers that effect here because the additive simulation has no treatment–mediator interaction or unmeasured mediator–outcome confounding. Adjusting for a mediator does not generally identify a direct effect." : "The baseline outcome is Y = 2A + 1.5C + error. The follow-up score is K = A + Y + independent error. It is measured after Y, so there is no arrow from K to Y. Including K changes the comparison, not the population total effect."}</p></details>` : ""}
      <p class="lesson-next">${lesson.next}</p>
      ${level === 6 ? '<button id="revisit-hidden">Revisit hidden confounding with AIPW</button>' : ""}
      <nav class="lesson-actions" aria-label="Continue learning">${previous ? `<button id="back">${revisiting ? "← Return to double robustness" : "← Back"}</button>` : ""}<button id="restart">Restart level</button>${next ? `<button id="continue" class="primary">Continue: ${lessons[next - 1].title} →</button>` : '<a class="primary" href="?sandbox">Explore the full sandbox ↗</a>'}</nav>
      <p class="lesson-credit">Guided prompts inspired by Carlos Mendez’s <a href="https://carlos-mendez.org/post/stata_matching/web_app/">Treatment Effects in Stata — Interactive Lab</a>.</p>
    </main>`;
  const menuToggle = document.querySelector("#lesson-menu-toggle");
  menuToggle.addEventListener("click", () => {
    menuToggle.setAttribute(
      "aria-expanded",
      String(menuToggle.getAttribute("aria-expanded") !== "true"),
    );
  });
  document.querySelector("#lesson-menu").addEventListener("click", (event) => {
    const link = event.target.closest("a[data-level]");
    if (
      !link ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate(Number(link.dataset.level));
  });
  document.querySelector("#hidden-strength")?.addEventListener("input", (e) => {
    state.hiddenStrength = +e.target.value;
    document.querySelector("#hidden-strength-output").textContent =
      state.hiddenStrength.toFixed(1);
    update();
  });
  document
    .querySelector("#overlap-selection")
    ?.addEventListener("change", (e) => {
      state.selection = Number(e.target.value);
      update();
    });
  document.querySelector("#effect")?.addEventListener("input", (e) => {
    studies = [];
    state.effect = +e.target.value;
    document.querySelector("#effect-output").textContent =
      state.effect.toFixed(1);
    update();
  });
  document.querySelector("#selection")?.addEventListener("input", (e) => {
    studies = [];
    state.selection = +e.target.value;
    document.querySelector("#selection-output").textContent =
      state.selection.toFixed(1);
    update();
  });
  document.querySelector("#reveal-ipw")?.addEventListener("click", (e) => {
    revealed = true;
    state.adjusted = true;
    document.querySelector("#weighting").hidden = false;
    e.target.hidden = true;
    update();
    document.querySelector("#ipw-result").focus();
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
  document
    .querySelector("#post-adjustment")
    ?.addEventListener("change", (e) => {
      state.postAdjusted = e.target.checked;
      update();
    });
  for (const id of ["redraw", "repeat-study"])
    document.querySelector(`#${id}`)?.addEventListener("click", () => {
      noise = makeNoise(state.n, ++state.seed);
      update();
    });
  document
    .querySelector("#restart")
    .addEventListener("click", () => enter(level, true, revisiting));
  document
    .querySelector("#revisit-hidden")
    ?.addEventListener("click", () => navigate(6, true));
  document
    .querySelector("#back")
    ?.addEventListener("click", () => navigate(previous));
  document
    .querySelector("#continue")
    ?.addEventListener("click", () => navigate(next));
  update();
  if (focus) document.querySelector("h1").focus();
}
function navigate(level, callback = false) {
  history.pushState(
    null,
    "",
    lessonUrl(level) + (callback ? "&revisit=hidden-confounding" : ""),
  );
  enter(callback ? 9 : level, true, callback);
}
window.addEventListener("popstate", () => enterFromUrl());
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
    `<svg viewBox="0 0 360 165" role="img" aria-label="${title} by baseline health: solid line is the true relationship; dashed line is the fitted model.">${[lo, (lo + hi) / 2, hi].map((v) => `<path d="M42 ${y(v)}H342" stroke="var(--grid)"/><text x="34" y="${y(v) + 4}" text-anchor="end">${treatment ? `${v * 100}%` : v}</text>`).join("")}<path data-curve="truth" d="${path(false)}" fill="none" stroke="var(--truth)" stroke-width="2.5"/><path data-curve="fitted" d="${path(true)}" fill="none" stroke="var(--fitted)" stroke-width="2.5" stroke-dasharray="6 4"/><text x="42" y="143">−1.7</text><text x="192" y="143" text-anchor="middle">0</text><text x="342" y="143" text-anchor="end">1.7</text><text x="192" y="161" text-anchor="middle">Baseline health (C)</text></svg>`;
}

function updateEstimate(id, estimate, truth) {
  const value = document.querySelector(`#${id}`);
  if (!value) return;
  const comparison = effectComparison(estimate, truth);
  value.textContent = comparison.value;
  value.parentElement.style.setProperty("--error-tint", `${comparison.tint}%`);
  let difference = value.parentElement.querySelector(".effect-difference");
  if (!difference) {
    difference = document.createElement("span");
    difference.className = "effect-difference";
    value.after(difference);
  }
  difference.textContent = comparison.difference;
}

function update() {
  const result = lessonResult(state, noise);
  if (state.level <= 2) {
    if (studies.at(-1)?.seed !== state.seed)
      studies.push({ seed: state.seed, estimate: result.unadjusted });
    const view = samplingView(studies, result.totalEffect);
    document.querySelector("#sampling-summary").textContent = view.summary;
    document.querySelector("#sampling-plot").innerHTML = view.plot;
    document.querySelector("#sampling-values").innerHTML = view.rows;
  }
  document.querySelector("#known-effect").textContent =
    result.totalEffect.toFixed(2);
  for (const id of ["unadjusted", "ipw", "regression", "aipw"]) {
    updateEstimate(id, result[id], result.totalEffect);
  }
  document.querySelector("#ipw-result").hidden =
    state.level === 7 || state.level === 8 || (state.level < 4 && !revealed);
  if (state.level >= 4) {
    document.querySelector("#regression-result").hidden = false;
  }
  if (state.level === 10) renderOverlap(result.overlap);
  if (
    (state.level >= 4 && state.level <= 6) ||
    state.level === 9 ||
    state.level === 10
  ) {
    document.querySelector("#model-weight-note").textContent = result.clipped
      ? `${result.clipped} treatment probabilities were clipped to [0.02, 0.98]; clipping can affect ${showsAipw(state.level) ? "IPW and AIPW" : "IPW"}.`
      : "No treatment probabilities were clipped in this sample.";
  }
  if (showsAipw(state.level)) {
    document.querySelector("#aipw-result").hidden = false;
  }
  if (state.level === 6) {
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
  if (state.level === 7 || state.level === 8) {
    document.querySelector("#adjustment-note").textContent = state.postAdjusted
      ? state.level === 7
        ? "We now hold the intermediate response fixed. An estimate near 2 captures the direct contribution under this simulation’s assumptions, but misses our total-effect target of 3."
        : "We now hold the follow-up score fixed. Conditioning on this shared consequence can distort the treatment comparison."
      : "We account for baseline health only, leaving the total treatment effect intact. Try including the new variable.";
    renderRoleGraph();
    return;
  }
  if (state.level === 9) {
    const strength = state.hiddenStrength;
    document.querySelector("#lesson-graph").innerHTML = `
      <svg viewBox="0 0 540 300" role="img" aria-label="Baseline health C is measured and causes treatment and outcome. Smoking status U is unmeasured and ${strength === 0 ? "currently has no influence; its faded paths are inactive" : "also causes treatment and outcome"}. Treatment causes outcome. Only C is adjusted for.">
        <defs><marker id="lesson-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="var(--causal-path)"/></marker></defs>
        <g fill="none" stroke="var(--causal-path)" stroke-width="2" marker-end="url(#lesson-arrow)"><path d="M220 60L100 125"/><path d="M320 60L440 125"/><path d="M155 145H380"/></g>
        <g data-hidden-paths fill="none" stroke="var(--causal-path)" ${arrowStrength(strength, 2)} stroke-dasharray="6 4" marker-end="url(#lesson-arrow)"><path d="M220 235L100 169"/><path d="M320 235L440 169"/></g>
        <rect x="165" y="10" width="210" height="50" rx="16" fill="var(--node-C)"/><text x="270" y="41">Baseline health (C)</text>
        <rect x="15" y="125" width="140" height="42" rx="16" fill="var(--node-A)"/><text x="85" y="152">Treatment<tspan class="graph-symbol"> (A)</tspan></text>
        <rect x="385" y="125" width="140" height="42" rx="16" fill="var(--node-Y)"/><text x="455" y="152">Outcome<tspan class="graph-symbol"> (Y)</tspan></text>
        <rect x="165" y="235" width="210" height="50" rx="16" fill="var(--node-U)" stroke="var(--causal-path)" stroke-dasharray="6 4"/><text x="270" y="266">Smoking status (U)</text>
      </svg><p class="sample-note">Treatment and outcome models: adjusting for C. Dashed paths: unmeasured smoking status. Darker paths mean stronger influence as the slider increases; faint paths at zero are inactive.</p>`;
    return;
  }
  const commonCause = state.level > 1;
  const treatmentDescription =
    state.effect === 0
      ? "Treatment has no effect on outcome."
      : "Treatment causes outcome.";
  const description = commonCause
    ? `Baseline health causes outcome${state.selection ? " and treatment" : ""}. ${treatmentDescription}`
    : `${treatmentDescription} Treatment is assigned at random.`;
  document.querySelector("#lesson-graph").innerHTML =
    `<svg viewBox="0 0 540 ${commonCause ? 190 : 95}" role="img" aria-label="${description}"><defs><marker id="lesson-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="var(--causal-path)"/></marker></defs><g fill="none" stroke="var(--causal-path)" stroke-width="2" marker-end="url(#lesson-arrow)"><path d="M155 ${commonCause ? 145 : 45}H380" ${state.level === 1 ? arrowStrength(state.effect, 4) : ""}/>${commonCause ? `<path d="M320 65L400 123"/><path d="M220 65L130 123" ${[2, 10].includes(state.level) ? arrowStrength(state.selection, state.level === 2 ? 1.2 : 5) : ""}/>` : ""}</g>${commonCause ? '<rect x="170" y="15" width="200" height="50" rx="16" fill="var(--node-C)"/><text x="270" y="46">Baseline health<tspan class="graph-symbol"> (C)</tspan></text>' : ""}<rect x="15" y="${commonCause ? 125 : 25}" width="140" height="42" rx="16" fill="var(--node-A)"/><text x="85" y="${commonCause ? 152 : 52}">Treatment<tspan class="graph-symbol"> (A)</tspan></text><rect x="385" y="${commonCause ? 125 : 25}" width="140" height="42" rx="16" fill="var(--node-Y)"/><text x="455" y="${commonCause ? 152 : 52}">Outcome<tspan class="graph-symbol"> (Y)</tspan></text></svg>${[1, 2, 10].includes(state.level) ? '<p class="sample-note">Darker arrows show stronger influence; faint arrows at zero are inactive. Shading shows magnitude, not sign.</p>' : ""}${state.level >= 3 && (state.level !== 3 || revealed) ? `<p class="sample-note">${state.level === 3 ? "IPW accounts for baseline health (C)." : "Treatment and outcome models: adjusting for C."}</p>` : ""}`;
}

function overlapPanel() {
  return `<section class="overlap-diagnostics" aria-labelledby="overlap-title">
    <h3 id="overlap-title">Who supplies the comparison?</h3>
    <p>Each histogram shows fitted treatment probabilities within one observed treatment group, before clipping. Similar distributions indicate more overlap.</p>
    <div id="propensity-histogram"></div>
    <p id="overlap-reading" aria-live="polite"></p>
    <table><caption>Information after weighting, using the estimator’s clipped weights</caption><thead><tr><th scope="col">Diagnostic</th><th scope="col">Untreated</th><th scope="col">Treated</th></tr></thead><tbody id="overlap-summary"></tbody></table>
    <p class="sample-note">Effective sample size (ESS) summarizes how uneven the weights are within each arm. It is not a count of remaining patients or an exact measure of estimator precision. “Top 1% weight share” is the fraction of that arm’s total weight carried by its highest-weight 1% of people (rounded up).</p>
    <details class="overlap-details"><summary>How to read these diagnostics</summary><p>Probabilities near 0 or 1 mean one treatment is rare for that baseline profile. The histogram uses ten equal-width probability bins and percentages within each arm, so unequal group sizes do not drive the comparison.</p><p>For each arm, ESS is the squared sum of weights divided by the sum of squared weights. Equal weights give ESS equal to the group size; concentrated weights reduce it. No diagnostic here is a pass/fail threshold for causal validity.</p><p>IPW and AIPW use fitted probabilities clipped to [0.02, 0.98], limiting individual weights to 50. Clipping can introduce bias and make ESS look less extreme; it cannot restore missing comparisons. Outcome regression uses the correct additive model here but must extrapolate more under strong selection. This experiment has small but nonzero treatment probabilities, not a structural impossibility of treatment.</p><p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9293235/">Read more about weighting and effective sample size</a></p></details>
  </section>`;
}

function renderOverlap(arms) {
  const labels = ["Untreated", "Treated"];
  document.querySelector("#propensity-histogram").innerHTML = arms
    .map((arm, a) => {
      const bars = arm.bins
        .map((count, i) => {
          const percent = arm.count ? (100 * count) / arm.count : 0;
          const height = percent * 1.1;
          return `<rect x="${40 + i * 27}" y="${135 - height}" width="24" height="${height}" fill="${a ? "var(--arm-1)" : "var(--arm-0)"}"><title>${i * 10}–${(i + 1) * 10}% probability: ${count} people (${percent.toFixed(1)}%)</title></rect>`;
        })
        .join("");
      return `<figure class="overlap-histogram"><figcaption>${labels[a]}</figcaption><svg viewBox="0 0 320 185" role="img" aria-label="${labels[a]}: distribution of fitted treatment probability. ${arm.bins.map((count, i) => `${i * 10} to ${(i + 1) * 10} percent probability: ${count} people`).join("; ")}"><text x="40" y="16">People in this arm (%)</text>${[0, 50, 100].map((v) => `<path d="M40 ${135 - v * 1.1}H310" stroke="var(--grid)"/><text x="34" y="${139 - v * 1.1}" text-anchor="end">${v}</text>`).join("")}${bars}<text x="40" y="153">0</text><text x="175" y="153" text-anchor="middle">0.5</text><text x="310" y="153" text-anchor="end">1</text><text x="175" y="176" text-anchor="middle">Fitted treatment probability</text></svg></figure>`;
    })
    .join("");
  const rows = [
    ["People", (arm) => arm.count.toLocaleString("en-US")],
    [
      "Effective sample size",
      (arm) => (arm.ess === null ? "Unavailable" : arm.ess.toFixed(0)),
    ],
    [
      "Top 1% weight share",
      (arm) =>
        arm.topShare === null
          ? "Unavailable"
          : `${(100 * arm.topShare).toFixed(1)}% (${arm.topCount} people)`,
    ],
  ];
  document.querySelector("#overlap-summary").innerHTML = rows
    .map(
      ([label, value]) =>
        `<tr><th scope="row">${label}</th>${arms.map((arm) => `<td>${value(arm)}</td>`).join("")}</tr>`,
    )
    .join("");
  document.querySelector("#overlap-reading").textContent =
    state.selection > 1.2
      ? "Strong selection makes the opposite treatment rare for many baseline profiles. Compare both arms’ effective sample sizes and weight shares, then redraw. A close estimate in this sample does not establish adequate support."
      : "Start with moderate selection, then strengthen it using the same underlying sample draws. The true effect and both model specifications stay fixed.";
}

function renderRoleGraph() {
  const mediator = state.level === 7;
  const role = mediator ? "Intermediate response" : "Follow-up score";
  const symbol = mediator ? "M" : "K";
  const description = `Baseline health causes treatment and outcome. Treatment causes outcome. ${mediator ? "Treatment causes the intermediate response, which causes outcome." : "Treatment and outcome cause the follow-up score; the score causes neither."} We adjust for baseline health${state.postAdjusted ? ` and ${role.toLowerCase()}` : " only"}.`;
  const nodes = mediator
    ? [
        ["C", 170, 16, 200, 48, "Baseline health", "var(--node-C)"],
        ["A", 10, 158, 130, 48, "Treatment", "var(--node-A)"],
        ["Y", 400, 158, 130, 48, "Outcome", "var(--node-Y)"],
        ["M", 195, 150, 150, 64, "Intermediate|response", "var(--node-M)"],
      ]
    : [
        ["C", 70, 16, 200, 48, "Baseline health", "var(--node-C)"],
        ["A", 10, 158, 130, 48, "Treatment", "var(--node-A)"],
        ["Y", 205, 158, 130, 48, "Outcome", "var(--node-Y)"],
        ["K", 390, 150, 140, 64, "Follow-up|score", "var(--node-K)"],
      ];
  const paths = mediator
    ? [
        "M220 64C220 100 75 100 75 136V150",
        "M320 64C320 100 465 100 465 136V150",
        "M140 182H187",
        "M345 182H392",
        "M75 206V228C75 282 465 282 465 228V214",
      ]
    : [
        "M120 64C120 100 75 100 75 136V150",
        "M220 64C220 100 270 100 270 136V150",
        "M140 182H197",
        "M335 182H382",
        "M75 206V228C75 282 460 282 460 236V222",
      ];
  document.querySelector("#lesson-graph").innerHTML =
    `<svg class="role-graph" viewBox="0 0 540 290" role="img" aria-label="${description}">
      <defs><marker id="lesson-arrow" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M1 1L9 5L1 9Z" fill="var(--causal-path)"/></marker></defs>
      <g fill="none" stroke="var(--causal-path)" stroke-width="1.8" stroke-linecap="butt" marker-end="url(#lesson-arrow)">
        ${paths.map((d) => `<path d="${d}"/>`).join("")}
      </g>
      ${nodes
        .map(([id, x, y, width, height, label, fill]) => {
          const lines = label.split("|");
          return `<rect class="role-node" x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${fill}"/>
          <text x="${x + width / 2}" y="${y + height / 2 + (lines.length === 1 ? 6 : -6)}">${lines[0]}${lines.length > 1 ? `<tspan x="${x + width / 2}" dy="24">${lines[1]}<tspan class="graph-symbol"> (${id})</tspan></tspan>` : `<tspan class="graph-symbol"> (${id})</tspan>`}</text>`;
        })
        .join("")}
    </svg><p class="sample-note">Outcome model: adjusting for C${state.postAdjusted ? ` and ${symbol}` : " only"}. Arrows describe the world and stay fixed.</p>`;
}
