import { capture, campaignHref } from "./events.js";
import { lessonGraph } from "./lesson-graph.js";
import { graphComparison, setupGraphComparison } from "./graph-comparison.js";
import { themeControl } from "./theme.js";
import { filmPreview, setupFilmPreview } from "./film-preview.js";
import { renderIpwCalculation } from "./ipw-calculation.js";
import { renderPropensityPreview } from "./propensity-preview.js";
import icon from "./brand.svg?raw";
import "./lessons.css";
import { effectComparison } from "./effect-comparison.js";
import { makeNoise } from "./simulation.js";
import { lessonBaseline, lessonResult } from "./lesson-simulation.js";
import { samplingView } from "./sampling-variation.js";
import { aipwCalculation, aipwFormula } from "./aipw-calculation.js";
import { tmlePanel, tmleFormula, renderTmle } from "./tmle-lesson.js";
import {
  coreLessons,
  lessonHref,
  lessonNavigation,
  optionalChapters,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import {
  readProgress,
  recordLessonCompleted,
  recordLessonStarted,
  recordPredictionAnswer,
} from "./progress.js";
import "./tmle-lesson.css";

const lessons = [
  {
    prediction: {
      id: "randomization-effect",
      question:
        "With random assignment, will the observed outcome difference equal the true effect?",
      choices: [
        "Exactly",
        "Approximately, with chance variation",
        "No connection",
      ],
      correctChoice: 1,
      explanation:
        "Randomization makes the groups comparable in the population. Chance differences remain in a finite sample; redraw to see the estimate vary.",
    },
    question:
      "With random assignment, will the observed outcome difference equal the true effect?",
    transition:
      "<strong>True effect:</strong> Imagine the same population under two alternatives: everyone receives treatment, or nobody does. The true effect is the average outcome under the first alternative minus the average under the second.",
    instruction:
      "Change the treatment effect, then redraw the sample to see how estimates vary.",
    explanation:
      "Random assignment makes the groups comparable before treatment in the population. The unadjusted difference can estimate the treatment effect without adjustment. A finite sample still has chance differences, so its estimate need not equal the truth.",
    next: "In practice, a person's health can affect whether they receive treatment. What changes then?",
  },
  {
    question:
      "What happens if the risk score also influences who receives treatment?",
    transition:
      "We set the treatment effect to 2 and add one measured variable: a risk score (C), measured before treatment. Higher C means greater risk and raises the outcome. Treatment starts randomized.",
    instruction:
      "Increase how strongly the risk score influences treatment assignment. Compare the outcome difference with the true effect.",
    explanation:
      "When the risk score affects both treatment and outcome, it is a common cause, or confounder. The groups differ before treatment, so their outcome difference mixes the treatment effect with the risk score's influence. Returning the slider to zero restores random assignment, though C still affects the outcome. With sampling variation, the estimate need not move steadily away from truth.",
    next: "How can we compare the groups while accounting for their different risk scores?",
  },
  {
    question:
      "Can accounting for the risk score make the groups more comparable?",
    transition:
      "We return to the same confounded world with treatment selection on and a true effect of 2. First, look at the unadjusted difference.",
    instruction:
      "Try IPW, then compare the estimate and balance in C before and after weighting.",
    explanation: [
      "A propensity score is a person's probability of treatment given their risk score. IPW gives more weight to people who received the less likely option, then compares weighted outcome averages.",
      "Here the treatment model is correct, and C is the only common cause. Across samples, weighting tends to reduce imbalance and bias, though one estimate can still move farther from truth.",
    ],
    next: "Weighting models who receives treatment. Could we instead predict the outcomes under each treatment?",
  },
  {
    question: "Can we predict outcomes under each treatment?",
    transition:
      "The confounded world stays the same. Both models now account for the risk score.",
    instruction: "Compare the estimates, then redraw to see how they vary.",
    explanation:
      "Here both models capture the correct relationships and C is the only common cause. Both methods can estimate the effect; neither must equal truth in a sample.",
    next: "Both methods account for C. Should we also account for variables that treatment changes?",
  },
  {
    question: "Which relationship does each method need to model?",
    transition:
      "Here, we explore what happens when one of the models is misspecified. We return to the simple scenario with one measured confounder, a risk score (C).",
    instruction:
      "Make the outcome relationship more complex, then make treatment assignment more complex. Compare which estimates are affected.",
    explanation:
      "A model is misspecified when it cannot represent the true relationship in the data. Here, making treatment assignment more complex misspecifies the simple propensity-score model, while making the outcome relationship more complex misspecifies the simple outcome model. A more flexible model is needed to capture either relationship correctly.",
    next: "We may not know which model is adequate. Can we combine the two approaches?",
  },
  {
    question: "Can combining the models help when one is too simple?",
    transition:
      "Both relationships now contain the extra patterns from the preceding model experiment. We start with models that capture both. The world stays fixed while you change the models.",
    instruction:
      "Make either model too simple by unchecking it. Then uncheck both. What happens to AIPW?",
    explanation:
      "With confounding controlled and overlap—people with similar risk scores can receive either treatment—AIPW can approach the true effect as samples grow if either model is correctly specified. It need not be exact or closest to truth in this sample. If both models are wrong, that protection is lost. Double robustness does not repair missing confounders or invalid adjustment.",
    next: "One correct model can protect against model mismatch. Revisit hidden confounding to see the limit of that protection, or continue to see how TMLE builds the correction into the predictions.",
  },
  {
    intuition: {
      title: "Example: exercise and fitness",
      paragraphs: [
        "Exercise can improve fitness, and improved fitness can help people live longer. Therefore, fitness carries part of exercise’s effect on longevity: this part of the effect is mediated by fitness.",
        "The total effect includes this benefit through improved fitness. Holding fitness fixed by adjusting for it would exclude that pathway. To estimate the total effect, we therefore do not adjust for fitness.",
      ],
    },
    question: "Should we adjust for a mediator to estimate the total effect?",
    transition:
      "We keep the simple relationships and correct adjustment for C from outcome regression. Treatment now also changes an intermediate response (M), which changes the outcome. This extra pathway raises the true total effect from 2 to 3.",
    instruction:
      "Include the intermediate response in the model and compare the estimate with the total effect. Then remove it from the model to include its contribution in the estimated effect.",
    explanation:
      "To estimate the total effect, leave M out because A → M → Y is part of what we want to count. Including M holds it fixed and removes that mediated contribution from the outcome-regression contrast. The risk score remains adjusted for in both cases.",
    next: "The intermediate response lies on a path from treatment to outcome. What if a measured variable is instead a consequence of both?",
  },
  {
    intuition: {
      title: "Example: follow-up care in healthcare",
      paragraphs: [
        "Patients receiving treatment have scheduled follow-up visits, while patients with worse symptoms also need more care. Symptoms are measured before those visits, so later care cannot change the outcome already recorded.",
        "Now compare people receiving the same amount of follow-up care. A treated patient may have received those visits because of the treatment schedule, while an untreated patient may have needed them because their symptoms were worse.",
        "Holding follow-up care fixed can therefore select treated patients with fewer symptoms and untreated patients with worse symptoms. This creates a relationship between treatment and symptoms and can make treatment look better, even if it was originally randomized.",
      ],
    },
    prediction: {
      id: "collider-adjustment",
      question:
        "We already adjust for C. What happens if we also adjust for the follow-up score?",
      choices: ["Removes bias", "Can introduce bias", "Has no effect"],
      correctChoice: 1,
      explanation:
        "Holding the follow-up score fixed can distort the comparison because both treatment and outcome influence it. More adjustment is not automatically better.",
    },
    question: "Can adjustment create a misleading relationship?",
    transition:
      "We remove the mediator and return to the simple baseline: the true total effect is 2 again. We now measure a follow-up score (K) after the outcome. Both treatment and outcome raise this score; it causes neither.",
    instruction:
      "Toggle adjustment for the follow-up score and compare estimates. The world stays fixed; only the comparison changes.",
    explanation:
      "A follow-up score, such as later care use, is a collider: two arrows meet at it, treatment → score ← outcome. Among people with the same score, having treatment leaves less of the score to be explained by the outcome. Holding the score fixed creates a misleading relationship and can distort the treatment estimate, even while we correctly account for C. Measured variables are not automatically valid adjustment variables.",
    next: "We can account for measured C. What if another common cause is missing from our data?",
  },
  {
    question: "What if an important confounder is unavailable?",
    transition:
      "We remove the follow-up score and keep the risk score (C) measured and adjusted for. The true total effect remains 2. Now add smoking status (U), which is missing from our data. We show it in the graph so you can see what the models cannot use.",
    instruction:
      "Turn up smoking’s influence on treatment and outcome. Do the estimates still track the true effect?",
    explanation:
      "In this fictional experiment, smoking makes treatment more likely and raises the outcome. As its influence grows, treated and untreated groups differ in smoking status even after adjusting for C. The estimates mix this difference with the treatment effect. IPW and outcome regression cannot adjust for information they do not have. Sampling variation means estimates need not move steadily away from truth at every slider step.",
    next: "Missing information is one problem; describing measured information incorrectly is another. Next, remove the hidden cause and test models that are too simple.",
  },
];
lessons[9] = {
  prediction: {
    id: "overlap-weight-concentration",
    question:
      "As treatment becomes nearly determined by risk score, how will IPW distribute weight?",
    choices: ["More evenly", "More concentrated", "Unchanged"],
    correctChoice: 1,
    explanation:
      "Stronger selection leaves fewer people receiving the less likely treatment for their risk score. IPW asks those people to represent many others. An estimate can still be close to truth in one sample.",
  },
  question:
    "What if almost everyone with the same risk score receives the same treatment?",
  transition:
    "We return to the simple world: the risk score (C) is observed and included in both correctly specified models. There are no hidden causes or post-treatment variables. The true total effect is 2.",
  instruction:
    "Compare moderate and strong treatment selection: look at the probabilities and weights, then redraw to explore how estimates vary.",
  explanation:
    "Overlap means people with similar risk scores can receive either treatment. Strong selection leaves few people receiving the less likely treatment for their profile. Weighting asks those few people to represent many others, concentrating information in a small part of each group. Outcome regression relies more on predictions where comparisons are sparse. AIPW does not create missing comparisons, even with correct models.",
  next: "Before exploring the scenario sandbox, take stock of what changes when the causal world and true effect are unknown.",
};
// Numeric IDs retain the original simulation and ?level= link identities.
// Only this order determines the displayed positions and navigation.
lessons[10] = {
  question: "Can we build the correction into the predictions?",
  transition:
    "Same curved world as AIPW. The treatment model captures the relationship, while the initial outcome model misses the curve. The risk score is the only common cause.",
  instruction:
    "Apply the fitted update. Watch the predictions change and the remaining weighted error approach zero.",
  explanation:
    "TMLE updates the outcome predictions in a direction determined by the treatment probabilities. It fits the size of that update from observed outcomes, then averages the updated treated-versus-untreated predictions. Making the weighted error zero is not proof of a correct causal estimate: confounding must be controlled, overlap must hold, and at least one model must be adequate.",
  next: "Targeting uses treatment probabilities too. What happens when comparable people rarely receive the opposite treatment?",
};
lessons[11] = {};
for (const [id, slug, title] of coreLessons)
  Object.assign(lessons[id - 1], { slug, title });
const availableLevels = coreLessons.map(([id]) => id);
const hiddenCallback = {
  ...lessons[8],
  title: "Revisit hidden confounding with AIPW",
  transition:
    "We return to the hidden-confounding experiment from level 7, with simple relationships and smoking’s influence reset to zero. Both models use C; neither can use smoking status. AIPW is now included in the comparison.",
  explanation:
    "AIPW combines the same predictions and weights as before. A correct model for one part of an identified causal problem can protect against the other model being wrong; it cannot supply missing confounding information. As smoking’s influence grows, all three estimates can miss the true effect. Agreement between methods does not establish that confounding has been controlled.",
  next: "Return to the fixed model experiment, or continue to targeting: can we build the correction into the outcome predictions?",
};
let state,
  noise,
  studies = [],
  revealed = false,
  revisiting = false,
  previousGraph = null,
  comparisonOpen = false,
  comparisonView = "current";
const app = document.querySelector("#app");

function enterFromUrl(focus = true) {
  const params = new URLSearchParams(location.search);
  const topic = params.has("lesson")
    ? params.get("lesson")
    : coreLessons.find(
        ([, , , path]) => path && location.pathname.endsWith(`/${path}`),
      )?.[1] || document.body.dataset.lesson;
  if (
    topic === "introduction" ||
    (!topic && !params.has("lesson") && !params.has("level"))
  ) {
    enterIntroduction(
      focus,
      !focus &&
        performance.getEntriesByType("navigation")[0]?.type !== "back_forward",
    );
    return;
  }
  const named = lessons.findIndex((lesson) => lesson.slug === topic) + 1;
  const requested = topic ? named : Number(params.get("level"));
  const level = availableLevels.includes(requested) ? requested : 1;
  const callback =
    level === 6 && params.get("revisit") === "hidden-confounding";
  enter(callback ? 9 : level, focus, callback);
}

function lessonUrl(level) {
  return `${import.meta.env.BASE_URL}${lessonHref(coreLessons.find(([id]) => id === level))}`;
}

function showsAipw(level) {
  return level === 6 || level === 10 || revisiting;
}

function controls(level) {
  if (level === 10)
    return `<fieldset class="model-choices" id="overlap-selection"><legend>How strongly does the risk score determine treatment?</legend><label class="lesson-switch"><input type="radio" name="overlap-selection" value="1.2" checked> Moderate selection</label><label class="lesson-switch"><input type="radio" name="overlap-selection" value="5"> Strong selection</label></fieldset>`;
  if (level === 9)
    return '<label for="hidden-strength">Hidden confounding strength <output id="hidden-strength-output">0.0</output></label><input id="hidden-strength" type="range" min="0" max="2" step="0.1" value="0" aria-describedby="hidden-strength-help"><p id="hidden-strength-help" class="sample-note">0: no influence · 2: strong influence on both treatment and outcome. Both models always adjust for C; neither can use U.</p>';
  if (level === 1)
    return '<label for="effect">True treatment effect <output id="effect-output">2.0</output></label><input id="effect" type="range" min="-1" max="4" step="0.1" value="2">';
  if (level === 2)
    return '<label for="selection">Risk score’s influence on treatment <output id="selection-output">0.0</output></label><input id="selection" type="range" min="0" max="1.2" step="0.1" value="0" aria-describedby="selection-help"><p id="selection-help" class="sample-note">0: random assignment · 1.2: selection used in the next lesson. Its influence on the outcome stays fixed.</p>';
  if (level === 3)
    return '<p>Imagine people at greater risk receive treatment more often. To balance risk scores across groups, give more weight to lower-risk people who received treatment and higher-risk people who did not.</p><p>We fit a model to the observed treatment choices to estimate each person’s treatment probability from their risk score.</p><button id="reveal-ipw">Try IPW</button>';
  if (level === 4)
    return '<p id="regression-explanation">We fit a model to predict the observed outcome from treatment received and risk score. For each person, we observe the outcome under the treatment they received. What would have happened under the alternative is their counterfactual outcome. The model predicts outcomes under both treatment options at fixed risk score, and we average the predicted differences to estimate the average treatment effect.</p>';
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
    return `<p>Outcome regression always accounts for C. The target remains the <strong>total treatment effect</strong>.</p><label class="lesson-switch"><input id="post-adjustment" type="checkbox"> Also account for ${level === 7 ? "the intermediate response (M)" : "the follow-up score (K)"}</label>`;
  return `<p>Augmented inverse probability weighting (AIPW) starts with the outcome-model estimate, then corrects it using the differences between observed and predicted outcomes. It weights these prediction errors to account for different mixes of people in the treatment groups.</p><div class="aipw-calculation">${aipwFormula()}</div><fieldset class="model-choices"><legend>What can our models capture?</legend><label class="lesson-switch"><input id="outcome-quadratic" type="checkbox" checked> Use a more flexible outcome model</label><label class="lesson-switch"><input id="treatment-quadratic" type="checkbox" checked> Use a more flexible treatment model</label><p class="sample-note">Checked: includes the extra pattern from the preceding model experiment. Unchecked: uses the simple model. Both still account for C.</p></fieldset>`;
}

app.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-introduction], a[data-level]");
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
  if (link.hasAttribute("data-introduction")) {
    history.pushState(
      null,
      "",
      `${import.meta.env.BASE_URL}?lesson=introduction`,
    );
    enterIntroduction();
  } else navigate(Number(link.dataset.level));
});

enterFromUrl(false);

function enterIntroduction(focus = true, animate = false) {
  state = null;
  document.querySelector("#intro-film video")?.pause();
  const progress = readProgress();
  const completed = new Set(progress.completedLessons);
  const resumeLesson =
    coreLessons.find(([, slug]) => slug === progress.currentLesson) ||
    coreLessons.find(([, slug]) => !completed.has(slug)) ||
    coreLessons[0];
  const hasProgress =
    progress.completedLessons.length > 0 || progress.currentLesson;
  app.innerHTML = `
    <header class="lesson-header introduction-header"><a class="brand" href="./" data-introduction>${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
    <main class="learning introduction${animate ? " introduction-arriving" : ""}">
      ${lessonNavigation({ introduction: true })}
      <section class="intro-hero" aria-labelledby="intro-title">
        <div class="intro-copy"><p class="intro-kicker">An interactive causal lab</p>
          <h1 tabindex="-1" id="intro-title">See what<br>causes what.</h1>
          <p class="intro-context">Learn through experiments, explore simulated worlds, or build your own causal graphs.</p>
        </div>
        <svg class="intro-graph" viewBox="0 0 460 310" aria-hidden="true" focusable="false">
          <defs><marker id="intro-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 9 5 1 9" fill="none" stroke="currentColor" stroke-width="1.5"/></marker></defs>
          <g class="intro-orbits"><circle cx="230" cy="170" r="125"/><circle cx="230" cy="170" r="85"/><path d="M30 170h400M230 20v280"/></g>
          <g class="intro-edges" fill="none" marker-end="url(#intro-arrow)"><path pathLength="1" d="M209 86 116 211"/><path pathLength="1" d="m251 86 93 125"/><path pathLength="1" d="M135 240h188"/></g>
          <g class="intro-node intro-node-c"><circle cx="230" cy="58" r="34"/><text x="230" y="59">C</text><text class="intro-node-label" x="230" y="115">Context</text></g>
          <g class="intro-node intro-node-a"><circle cx="94" cy="240" r="34"/><text x="94" y="241">A</text><text class="intro-node-label" x="94" y="296">Treatment</text></g>
          <g class="intro-node intro-node-y"><circle cx="366" cy="240" r="34"/><text x="366" y="241">Y</text><text class="intro-node-label" x="366" y="296">Outcome</text></g>
        </svg>
      </section>
      <nav class="intro-paths" aria-label="Choose your way in">
        <a class="intro-path" href="${hasProgress ? lessonHref(resumeLesson) : campaignHref(`${import.meta.env.BASE_URL}?lesson=learn`)}" ${hasProgress ? `data-level="${resumeLesson[0]}"` : ""} aria-label="Learn">
          <span class="intro-path-top"><svg viewBox="0 0 64 40" aria-hidden="true"><path d="M8 30h16V20h16V10h16"/><circle cx="8" cy="30" r="3"/><circle cx="56" cy="10" r="3"/></svg><span class="intro-path-arrow" aria-hidden="true">↗</span></span>
          <h2>Learn</h2><p>Build your intuition through guided experiments, one concept at a time.</p><span class="intro-path-detail">${hasProgress ? `Continue with ${resumeLesson[2]}` : "Choose your starting point"} <span aria-hidden="true">→</span></span>
        </a>
        <a class="intro-path" href="?sandbox" aria-label="Explore">
          <span class="intro-path-top"><svg viewBox="0 0 64 40" aria-hidden="true"><path d="M6 10h52M6 30h52"/><circle cx="22" cy="10" r="5"/><circle cx="43" cy="30" r="5"/></svg><span class="intro-path-arrow" aria-hidden="true">↗</span></span>
          <h2>Explore</h2><p>Change a simulated world and see how causal estimates respond.</p><span class="intro-path-detail">Explore scenarios <span aria-hidden="true">→</span></span>
        </a>
        <a class="intro-path" href="?sandbox=graph-lab" aria-label="Build">
          <span class="intro-path-top"><svg viewBox="0 0 64 40" aria-hidden="true"><path d="m16 30 16-20 16 20M16 30h32"/><circle cx="16" cy="30" r="5"/><circle cx="32" cy="10" r="5"/><circle cx="48" cy="30" r="5"/></svg><span class="intro-path-arrow" aria-hidden="true">↗</span></span>
          <h2>Build</h2><p>Draw a causal graph and explore what your assumptions imply.</p><span class="intro-path-detail">Build a graph <span aria-hidden="true">→</span></span>
        </a>
      </nav>
      ${filmPreview()}
    </main>`;
  setupFilmPreview();
  setupLessonNavigation();
  if (focus) document.querySelector("h1").focus();
}

function enter(level, focus = true, callback = false, restart = false) {
  document.querySelector("#intro-film video")?.pause();
  revisiting = callback;
  const recap = level === 12;
  const position = availableLevels.indexOf(revisiting ? 6 : level);
  const previous = revisiting ? 6 : availableLevels[position - 1];
  previousGraph =
    !recap && previous
      ? {
          state:
            state?.level === previous ? { ...state } : lessonBaseline(previous),
          visited: state?.level === previous,
        }
      : null;
  comparisonOpen = false;
  comparisonView = "current";
  state = recap ? null : lessonBaseline(level);
  studies = [];
  noise = recap ? null : makeNoise(state.n, state.seed);
  revealed = false;
  const lesson = revisiting ? hiddenCallback : lessons[level - 1];
  const next = availableLevels[position + 1];
  if (!restart)
    capture("lesson_started", {
      lesson: lesson.slug,
      is_revisit: revisiting,
    });
  if (!revisiting) recordLessonStarted(lesson.slug);
  app.innerHTML = `
    <header class="lesson-header"><a class="brand" href="./" data-introduction>${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${themeControl()}</header>
    <main class="learning${level === 11 ? " tmle-learning" : ""}">
      ${lessonNavigation({ position, revisiting })}
      <div class="eyebrow">${recap ? "TAKEAWAYS" : "PREDICT · TRY · OBSERVE"}</div><h1 tabindex="-1">${lesson.title}</h1>
      ${
        recap
          ? leavingTheSandbox()
          : `
      <p class="lesson-transition">${lesson.transition}</p>
      ${level === 1 ? "<p><strong>Observed outcome difference:</strong> In our study, each person receives only one treatment option. We calculate the average outcome among those treated minus the average among those untreated.</p><p>Here, we know the true effect because we set the simulation’s rules. In a real study, we would need to estimate it.</p>" : ""}
      ${level === 11 ? "<p>AIPW adds a correction to the final estimate. TMLE uses the same kind of weighted prediction errors to update the outcome predictions first, then averages their treated-versus-untreated differences.</p>" : ""}
      <section class="experiment panel" aria-labelledby="question"><h2 id="question">${lesson.prediction?.question || lesson.question}</h2>
        ${previousGraph ? graphComparison(level, revisiting) : ""}
        <div id="lesson-graph"></div>
        <p class="lesson-instruction">${lesson.instruction}</p>
        ${level === 11 ? "" : `<div class="lesson-controls">${controls(level)}</div>`}
        <div class="lesson-results" aria-live="polite" aria-atomic="true"><div class="lesson-result truth-result"><span>True total effect</span><strong id="known-effect"></strong></div>${level <= 4 ? '<div class="lesson-result"><span>Unadjusted difference</span><strong id="unadjusted"></strong></div>' : ""}<div id="ipw-result" class="lesson-result" tabindex="-1" hidden><span>IPW estimate</span><strong id="ipw"></strong></div>${level >= 4 ? '<div id="regression-result" class="lesson-result" hidden><span>Outcome regression</span><strong id="regression"></strong></div>' : ""}${showsAipw(level) ? '<div id="aipw-result" class="lesson-result" hidden><span>AIPW estimate</span><strong id="aipw"></strong></div>' : ""}${level === 11 ? '<div class="lesson-result"><span id="tmle-estimate-label">Current prediction contrast</span><strong id="tmle"></strong></div>' : ""}</div>
        <p class="sample-note">Stronger red means farther from truth in this sample.</p>
        ${level === 7 ? '<p class="sample-note">True effect breakdown: 2 direct + 1 through the intermediate response = 3 total.</p>' : ""}
        ${level === 7 || level === 8 ? '<p id="adjustment-note" aria-live="polite"></p>' : ""}
        ${level === 6 ? '<p id="robustness-note" aria-live="polite"></p>' : ""}
        ${(level >= 4 && level <= 6) || level === 9 || level === 10 ? '<p id="model-weight-note" class="sample-note" aria-live="polite"></p>' : ""}
        ${level === 10 ? overlapPanel() : ""}${level === 11 ? tmlePanel() : ""}
        <div id="balance" hidden><h3>Risk scores in the two groups</h3><p>Compare their average C before and after weighting. More similar averages indicate better balance of this variable.</p><table><caption>Average risk score (C)</caption><thead><tr><th scope="col">Comparison</th><th scope="col">Untreated</th><th scope="col">Treated</th></tr></thead><tbody><tr><th scope="row">Before weighting</th><td id="before-0"></td><td id="before-1"></td></tr><tr><th scope="row">After weighting</th><td id="after-0"></td><td id="after-1"></td></tr></tbody></table><p id="weight-note"></p></div>
        ${level === 3 ? '<details id="weighting" hidden><summary>Why these weights?</summary><div id="weight-examples"></div><details id="ipw-calculation"><summary>How do weights become an effect?</summary><div id="ipw-arithmetic"></div></details></details>' : ""}
        <div class="sample-actions"><button id="redraw">Redraw sample</button><span id="sample-label"></span></div>
        ${
          level <= 2
            ? `<details class="sampling-variation" id="repeated-studies"><summary>Compare repeated studies</summary>
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
      <details class="lesson-explanation"><summary>Explain what is happening</summary>${(Array.isArray(lesson.explanation) ? lesson.explanation : [lesson.explanation]).map((paragraph) => `<p>${paragraph}</p>`).join("")}${level === 4 ? '<math id="outcome-formula" display="block" aria-label="Outcome regression estimate: average over all people of Y hat one at C i minus Y hat zero at C i"><mrow><mfrac><mn>1</mn><mi>n</mi></mfrac><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mo>[</mo><msub><mover><mi>Y</mi><mo>^</mo></mover><mn>1</mn></msub><mo>(</mo><msub><mi>C</mi><mi>i</mi></msub><mo>)</mo><mo>−</mo><msub><mover><mi>Y</mi><mo>^</mo></mover><mn>0</mn></msub><mo>(</mo><msub><mi>C</mi><mi>i</mi></msub><mo>)</mo><mo>]</mo></mrow></math><p>For person i with risk score Cᵢ, Ŷ₁ and Ŷ₀ are fitted outcomes with and without treatment; n is the sample size. These are predictions, not two observed outcomes.</p>' : ""}${level === 3 ? '<div id="propensity-preview" class="ps-preview"></div><p>Without C, fitted treatment probabilities would be equal, so weighting would leave the unadjusted difference unchanged.</p>' : ""}</details>
      ${level === 4 ? '<details class="outcome-numbers"><summary>See the numbers</summary><div id="outcome-arithmetic"></div></details>' : ""}
      ${lesson.intuition ? `<details class="lesson-intuition"><summary>${lesson.intuition.title}</summary>${lesson.intuition.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}</details>` : ""}
      ${level === 11 ? tmleFormula() : ""}
      ${level >= 5 && level <= 6 ? `<details class="lesson-details"><summary>Model details (optional)</summary><p>Outcome regression fits an additive model of outcome using treatment and C, then averages predicted treated-minus-untreated outcomes. The treatment model is logistic: its linear predictor is converted to a probability, never used directly as one.</p>${level >= 5 ? "<p>Here, the true relationship includes C² − 1. A linear model using only C cannot capture this curve. It needs a C² term and an intercept to represent the relationship correctly.</p>" : ""}<p>IPW normalizes weights within each treatment group. ${level === 6 ? "IPW and AIPW clip" : "IPW clips"} fitted probabilities to [0.02, 0.98]. Clipping can introduce bias even with a correct treatment model; these examples are designed to avoid it, and any clipping is reported beside the estimates.</p></details>` : ""}
      ${level === 7 || level === 8 ? `<details class="lesson-details"><summary>Model details (optional)</summary><p>We fit outcome using treatment and C${level === 7 ? ", optionally adding M" : ", optionally adding K"}. As in level 4, we average predicted treated-minus-untreated outcomes, holding the other included variables fixed.</p><p>${level === 7 ? "This additive simulation has independent errors: M = A + error and Y = 2A + 1.5C + M + error. If we specifically wanted a controlled direct effect, we would instead compare treatment choices while fixing M at a specified value. Regression including M estimates that effect of 2 here: the outcome model is correct, C is adjusted for, and the errors are independent. Mediator adjustment does not generally identify a direct effect. Unmeasured common causes of M and Y can bias it; treatment–mediator interactions can make the effect depend on the value at which M is fixed." : "The baseline outcome is Y = 2A + 1.5C + error. The follow-up score is K = A + Y + independent error. It is measured after Y, so there is no arrow from K to Y. Including K changes the comparison, not the population total effect."}</p></details>` : ""}
      <p class="lesson-next">${lesson.next}</p>
      `
      }
      ${level === 6 ? '<button id="revisit-hidden">Revisit hidden confounding with AIPW</button>' : ""}
      <nav class="lesson-actions" aria-label="Continue learning">${previous ? `<button id="back">${revisiting ? "← Return to double robustness" : "← Back"}</button>` : '<a href="?lesson=introduction" data-introduction>← Introduction</a>'}${recap ? "" : '<button id="restart">Restart level</button>'}${next ? `<button id="continue" class="primary">Continue: ${lessons[next - 1].title} →</button>` : '<a id="recap-exit" class="primary" href="?sandbox">Explore scenarios ↗</a>'}</nav>
      ${
        !revisiting
          ? optionalChapters
              .filter(({ after }) => after === level)
              .map(
                ({ title, href, description }) =>
                  `<aside class="optional-preview" aria-label="Optional exploration"><span class="sample-note">Optional exploration</span><h2><a href="${href}">${title} →</a></h2><p>${description}</p></aside>`,
              )
              .join("")
          : ""
      }
    </main>`;
  setupLessonNavigation();
  document
    .querySelector("#targeting-progress")
    ?.addEventListener("input", (event) => {
      state.targeting = Number(event.target.value) / 100;
      update();
    });
  document.querySelector("#apply-targeting")?.addEventListener("click", () => {
    state.targeting = 1;
    document.querySelector("#targeting-progress").value = "100";
    update();
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
    if (revealed) return;
    revealed = true;
    state.adjusted = true;
    capture("lesson_ipw_applied", { lesson: lesson.slug });
    capture("method_compared", { lesson: lesson.slug, method: "ipw" });
    document.querySelector("#weighting").hidden = false;
    e.currentTarget.textContent = "IPW applied";
    e.currentTarget.setAttribute("aria-disabled", "true");
    update();
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
      capture("simulation_run", { lesson: lesson.slug, action: id });
      update();
    });
  document
    .querySelector("#restart")
    ?.addEventListener("click", () => enter(level, true, revisiting, true));
  document
    .querySelector("#revisit-hidden")
    ?.addEventListener("click", () => navigate(6, true));
  document
    .querySelector("#back")
    ?.addEventListener("click", () => navigate(previous));
  document.querySelector("#continue")?.addEventListener("click", () => {
    recordLessonCompleted(lesson.slug);
    capture("lesson_advanced", { lesson: lesson.slug });
    navigate(next);
  });
  document.querySelector("#recap-exit")?.addEventListener("click", () => {
    recordLessonCompleted(lesson.slug);
    void capture(
      "lesson_advanced",
      { lesson: lesson.slug },
      { transport: "sendBeacon" },
    );
  });
  if (previousGraph)
    setupGraphComparison((open, view) => {
      comparisonOpen = open;
      comparisonView = view;
      renderLessonGraph();
    });
  if (!recap) update();
  const repeatedStudies = level <= 2 && location.hash === "#repeated-studies";
  if (lesson.prediction && !repeatedStudies) setupPrediction(lesson.prediction);
  if (repeatedStudies) {
    const panel = document.querySelector("#repeated-studies");
    panel.open = true;
    panel.querySelector("summary").focus();
    panel.scrollIntoView();
  } else if (focus) document.querySelector("h1").focus();
}

function setupPrediction(prediction) {
  const withheld = [
    ...document.querySelectorAll(
      ".lesson-instruction, .lesson-controls, .sample-actions, .sampling-variation, .lesson-explanation, .lesson-intuition, .lesson-details, .lesson-next",
    ),
  ];
  if (state.level === 1) {
    withheld.push(document.querySelector("#unadjusted").parentElement);
    withheld.push(document.querySelector(".lesson-results + .sample-note"));
  }
  withheld.forEach((element) => {
    element.hidden = true;
  });
  const checkpoint = document.createElement("div");
  checkpoint.className = "lesson-prediction";
  checkpoint.innerHTML = `
    <fieldset class="model-choices" aria-describedby="prediction-hint">
      <legend>Your prediction</legend>
      ${prediction.choices.map((choice, index) => `<label class="lesson-switch"><input type="radio" name="prediction" value="${index}">${choice}</label>`).join("")}
    </fieldset>
    <p id="prediction-hint" class="sample-note">Choose a prediction to try the experiment. Any choice lets you continue.</p>
    <button id="try-prediction" disabled>Try it</button>`;
  document.querySelector("#lesson-graph").after(checkpoint);
  const button = checkpoint.querySelector("button");
  checkpoint.addEventListener("change", () => {
    button.disabled = false;
  });
  button.addEventListener("click", () => {
    const selected = checkpoint.querySelector("input:checked");
    if (!selected) return;
    const before = lessonResult(state, noise);
    if (state.level === 8) {
      state.postAdjusted = true;
      document.querySelector("#post-adjustment").checked = true;
    } else if (state.level === 10) {
      state.selection = 5;
      document.querySelector('#overlap-selection input[value="5"]').checked =
        true;
    }
    update();
    const after = lessonResult(state, noise);
    const observed =
      state.level === 1
        ? `First sample: outcome difference ${after.unadjusted.toFixed(2)}; true effect ${after.totalEffect.toFixed(2)}.`
        : state.level === 8
          ? `First comparison: the estimate changed from ${before.regression.toFixed(2)} to ${after.regression.toFixed(2)}; the true total effect stayed ${after.totalEffect.toFixed(2)}.`
          : `First comparison, moderate → strong selection. Top 1% weight share: ${after.overlap.map((arm, index) => `${index === 0 ? "untreated" : "treated"} ${(100 * before.overlap[index].topShare).toFixed(1)}% → ${(100 * arm.topShare).toFixed(1)}%`).join("; ")}.`;
    withheld.forEach((element) => {
      element.hidden = false;
    });
    const correct = Number(selected.value) === prediction.correctChoice;
    recordPredictionAnswer(
      prediction.id,
      lessons[state.level - 1].slug,
      Number(selected.value),
      correct,
    );
    capture("lesson_prediction_submitted", {
      lesson: lessons[state.level - 1].slug,
      selected_choice_index: Number(selected.value),
      is_correct: correct,
    });
    const encouragement = correct ? "Good prediction!" : "Not quite.";
    checkpoint.innerHTML = `<p><strong>${encouragement}</strong></p><p class="sample-note">Your prediction: ${prediction.choices[Number(selected.value)]}</p><p>${observed}</p><p>${prediction.explanation}</p>`;
    checkpoint.setAttribute("tabindex", "-1");
    checkpoint.setAttribute("role", "region");
    checkpoint.setAttribute("aria-label", "Prediction explained");
    document.querySelector(".lesson-results").after(checkpoint);
    checkpoint.focus();
  });
}

function leavingTheSandbox() {
  return `<article class="lesson-recap" aria-label="What changes in real research">
    <p class="lesson-transition">The sandbox gave us something real studies never do: a known causal world and a known true effect. Before leaving it, here is what changes when both are hidden.</p>
    <section class="recap-takeaway" aria-labelledby="recap-takeaway-title">
      <h2 id="recap-takeaway-title">Causal estimates should arrive with their assumptions attached.</h2>
    <p>This is the strange bargain of causal inference: answering one causal question requires assumptions about the relationships around it. In the sandbox, those relationships are known because we created them. In real studies, they remain partly uncertain.</p>
    </section>
    <section aria-labelledby="recap-reminders-title">
      <h2 id="recap-reminders-title">Important to remember</h2>
      <ul class="recap-reminders">
        <li><strong>The question comes first.</strong> Define the intervention, comparison, outcome, population, and time horizon before choosing an estimator.</li>
        <li><strong>Data do not choose the causal story.</strong> The same observed pattern can fit different causal explanations. Study design, timing, and subject-matter knowledge help decide what is plausible.</li>
        <li><strong>Adjustment is a causal decision.</strong> A variable can remove confounding, block part of the effect, or create bias. More adjustment is not automatically safer.</li>
        <li><strong>Methods inherit the assumptions.</strong> Regression, IPW, AIPW, and TMLE solve statistical problems inside a causal design. By themselves, they cannot resolve unmeasured confounding or create a comparison with no support.</li>
        <li><strong>Diagnostics can warn, not certify.</strong> Checks for imbalance, model misspecification, and poor overlap can reveal trouble. Passing those checks does not prove that the causal model is right.</li>
      </ul>
    </section>
    <section aria-labelledby="recap-practice-title">
      <h2 id="recap-practice-title">Ask what would change your conclusion</h2>
      <p>Make assumptions explicit and defend them, then explore plausible alternatives. What if a suspected cause has no effect on the outcome? Would adjusting for it reduce bias, add uncertainty, or make bias worse? How strong would an unmeasured common cause need to be to change the practical conclusion? Use causal reasoning and sensitivity analysis to examine these possibilities, and judge their plausibility using subject-matter knowledge.</p>
    </section>
    <details class="lesson-explanation"><summary>What does it mean to defend an assumption?</summary>
      <p>These assumptions describe conditions for identifying an effect. Some can hold by design, while others remain uncertain. Their failure need not have the same consequences in every study.</p>
      <p><strong>Uncertain relationships:</strong> consider plausible causal graphs, including whether an uncertain arrow is absent, and ask whether the same adjustment set remains valid. A variable with no causal effect on the outcome is not automatically harmless to adjust for: its other relationships matter. For example, adjusting for an instrument can reduce precision and amplify remaining unmeasured confounding. Comparing estimates with and without a variable shows sensitivity to that choice, but it does not tell you which estimate is closer to truth.</p>
      <p><strong>Exchangeability:</strong> within the covariate groups used for adjustment, treatment groups must be comparable in their potential outcomes. Adjusting for all observed confounders is not enough if important confounding remains unmeasured. Randomization supports exchangeability for assigned treatment, but does not guarantee exact balance in a finite sample.</p>
      <p><strong>Positivity:</strong> both treatments must be possible within relevant covariate groups in the target population. Sparse comparisons can make estimates unstable. An impossible comparison prevents identification under this adjustment strategy. Restricting the population changes the question, while extrapolation adds assumptions.</p>
      <p><strong>Consistency:</strong> the observed treatment must correspond to the intervention whose effect we ask about. Different doses, delivery methods, or versions may need to be distinguished if they change outcomes.</p>
      <p><strong>No interference:</strong> one person’s treatment must not affect another person’s outcome under the usual individual-treatment formulation. When spillovers matter, such as with vaccination, the causal question and analysis need to represent them.</p>
      <p>Observed data can reveal sparse comparisons, but cannot by themselves establish exchangeability. Sensitivity analyses explore specified departures, such as a range of unmeasured-confounding strengths. No single check covers every assumption. If plausible departures change the practical conclusion, report that fragility.</p>
      <p class="sample-note">Further reading: <a href="https://www.stats.ox.ac.uk/~evans/APTS/causassmp.html">Causal assumptions</a>, <a href="https://carloscinelli.com/sensemakr/">sensitivity analysis for unmeasured confounding</a>, and <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3254160/">instrument adjustment, bias, and precision</a>.</p>
    </details>
  </article>`;
}
function navigate(level, callback = false) {
  const url = lessonUrl(level);
  history.pushState(
    null,
    "",
    url +
      (callback
        ? `${url.includes("?") ? "&" : "?"}revisit=hidden-confounding`
        : ""),
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
    `<svg viewBox="0 0 360 165" role="img" aria-label="${title} by risk score: solid line is the true relationship; dashed line is the fitted model.">${[lo, (lo + hi) / 2, hi].map((v) => `<path d="M42 ${y(v)}H342" stroke="var(--grid)"/><text x="34" y="${y(v) + 4}" text-anchor="end">${treatment ? `${v * 100}%` : v}</text>`).join("")}<path data-curve="truth" d="${path(false)}" fill="none" stroke="var(--truth)" stroke-width="2.5"/><path data-curve="fitted" d="${path(true)}" fill="none" stroke="var(--fitted)" stroke-width="2.5" stroke-dasharray="6 4"/><text x="42" y="143">−1.7</text><text x="192" y="143" text-anchor="middle">0</text><text x="342" y="143" text-anchor="end">1.7</text><text x="192" y="161" text-anchor="middle">Risk score (C)</text></svg>`;
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
  if (state.level === 3)
    renderPropensityPreview(
      document.querySelector("#propensity-preview"),
      result.propensityData,
    );
  if (state.level === 4)
    document.querySelector("#outcome-arithmetic").innerHTML =
      outcomeCalculation(result.outcomePredictions);
  if (state.level === 6)
    document.querySelector("#aipw-arithmetic").innerHTML = aipwCalculation(
      result.aipwContributions,
    );
  if (state.level === 11) {
    const view = renderTmle(result.tmleData, state.targeting, result.clipped);
    updateEstimate(
      "tmle",
      view.status === "ok" ? view.currentEstimate : NaN,
      result.totalEffect,
    );
  }
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
    state.level === 7 ||
    state.level === 8 ||
    state.level === 11 ||
    (state.level < 4 && !revealed);
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
          ? "World: both relationships with C are curved. Model choices change only the analysis."
          : "Only the outcome relationship is now more complex. Treatment assignment stays simple."
        : state.treatmentCurve
          ? "Only treatment assignment is now more complex. The outcome relationship is simple again."
          : "Both relationships match what our simple models can describe.";
    document.querySelector("#model-description").textContent =
      `Our models: outcome ${!state.outcomeCurve || state.outcomeQuadratic ? "correctly specified" : "missing the added pattern"}; treatment ${!state.treatmentCurve || state.treatmentQuadratic ? "correctly specified" : "missing the added pattern"}. Both account for C.`;
  }
  document.querySelector("#balance").hidden = state.level !== 3 || !revealed;
  if (state.level === 3 && revealed) {
    renderIpwCalculation(result.calculation);
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
        ? "Including M blocks part of the effect we want to measure. The estimate near 2 misses our total-effect target of 3. Leave M out of the adjustment set to include its pathway."
        : "We now hold the follow-up score fixed. Conditioning on this shared consequence can distort the treatment comparison."
      : "We account for C only, leaving the total treatment effect intact. Try including the new variable.";
  }
  renderLessonGraph();
}

function outcomeCalculation(predictions) {
  const person = predictions[0];
  const number = (value) => value.toFixed(2);
  const average =
    predictions.reduce((sum, row) => sum + row.contrast, 0) /
    predictions.length;
  return `<p>Person ${person.person} received ${person.A ? "treatment" : "no treatment"}, so only that outcome was observed. The model predicts both outcomes at the same risk score, C = ${number(person.C)}.</p>
    <table><caption>Current predictions for person ${person.person}</caption><tbody>
      <tr><th scope="row">With treatment, Ŷ₁(Cᵢ)</th><td>${number(person.m1)}</td></tr>
      <tr><th scope="row">Without treatment, Ŷ₀(Cᵢ)</th><td>${number(person.m0)}</td></tr>
      <tr><th scope="row">Predicted difference</th><td>${number(person.contrast)}</td></tr>
    </tbody></table>
    <p><strong>Average predicted difference:</strong> <span id="outcome-worked-effect">${number(average)}</span> across all ${predictions.length.toLocaleString("en-US")} people.</p>
    <p class="sample-note">Values are rounded; the estimate uses full precision.</p>`;
}

function overlapPanel() {
  return `<section class="overlap-diagnostics" aria-labelledby="overlap-title">
    <h3 id="overlap-title">Who supplies the comparison?</h3>
    <p>Each histogram shows fitted treatment probabilities within one observed treatment group, before clipping. Similar distributions indicate more overlap.</p>
    <div id="propensity-histogram"></div>
    <p id="overlap-reading" aria-live="polite"></p>
    <table><caption>Information after weighting, using the estimator’s clipped weights</caption><thead><tr><th scope="col">Diagnostic</th><th scope="col">Untreated</th><th scope="col">Treated</th></tr></thead><tbody id="overlap-summary"></tbody></table>
    <p class="sample-note">Lower ESS and a larger top-1% weight share indicate greater weight concentration.</p>
    <details class="overlap-details"><summary>How to read these diagnostics</summary><p>Effective sample size (ESS) summarizes how uneven the weights are within each arm. It is not a count of remaining patients or an exact measure of estimator precision. “Top 1% weight share” is the fraction of that arm’s total weight carried by its highest-weight 1% of people (rounded up).</p><p>Probabilities near 0 or 1 mean one treatment is rare for that baseline profile. The histogram uses ten equal-width probability bins and percentages within each arm, so unequal group sizes do not drive the comparison.</p><p>For each arm, ESS is the squared sum of weights divided by the sum of squared weights. Equal weights give ESS equal to the group size; concentrated weights reduce it. No diagnostic here is a pass/fail threshold for causal validity.</p><p>IPW and AIPW use fitted probabilities clipped to [0.02, 0.98], limiting individual weights to 50. Clipping can introduce bias and make ESS look less extreme; it cannot restore missing comparisons. Outcome regression uses the correct additive model here but must extrapolate more under strong selection. This experiment has small but nonzero treatment probabilities, not a structural impossibility of treatment.</p><p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9293235/">Read more about weighting and effective sample size</a></p></details>
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

function renderLessonGraph() {
  const graph = document.querySelector("#lesson-graph");
  if (!comparisonOpen) {
    graph.innerHTML = lessonGraph(state);
    return;
  }
  const previous = previousGraph.state;
  graph.innerHTML = `<div class="graph-comparison-views">${[
    [
      "previous",
      previous,
      `Previous: ${lessons[previous.level - 1].title}`,
      previousGraph.visited ? "As you left it" : "Starting view",
    ],
    [
      "current",
      state,
      `Current: ${revisiting ? hiddenCallback.title : lessons[state.level - 1].title}`,
      "Your current settings",
    ],
  ]
    .map(
      ([
        view,
        graphState,
        title,
        source,
      ]) => `<div class="graph-comparison-view" aria-hidden="${comparisonView !== view}">
    <p class="graph-comparison-label"><strong>${title}</strong><span>${source}</span></p>
    ${lessonGraph(graphState, { aligned: true, markerId: `comparison-${view}-arrow` })}
  </div>`,
    )
    .join("")}</div>`;
}
