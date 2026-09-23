import "./instrument-lesson.css";
import { studyDistributions } from "./instrument-study-view.js";
import { themeControl } from "./theme.js";
import { effectComparison } from "./effect-comparison.js";
import icon from "./brand.svg?raw";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page"><header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${themeControl()}</header>
    <main>
      ${lessonNavigation({ currentOptional: "instrument" })}
      <p class="eyebrow" id="step"></p>
      <h1 id="title" tabindex="-1"></h1>
      <p class="intro" id="intro"></p>
      <section class="panel" aria-label="Instrument and adjustment experiment">
        <svg class="graph" viewBox="0 0 590 225" role="img" id="graph">
          <defs>
            <marker
              id="arrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0,7 3.5,0 7" fill="var(--causal-path)" />
            </marker>
          </defs>
          <path id="instrument-path" d="M150 128H237" marker-end="url(#arrow)" />
          <path d="M345 128H470" marker-end="url(#arrow)" />
          <path d="M380 55L302 103" marker-end="url(#arrow)" />
          <path d="M402 55L513 103" marker-end="url(#arrow)" />
          <rect
            x="10"
            y="106"
            width="140"
            height="44"
            rx="10"
            fill="var(--surface-subtle)"
          />
          <text x="80" y="134" text-anchor="middle">Instrument Z</text>
          <rect
            x="240"
            y="106"
            width="105"
            height="44"
            rx="10"
            fill="var(--node-A)"
          />
          <text x="292" y="134" text-anchor="middle">Treatment A</text>
          <rect
            x="473"
            y="106"
            width="105"
            height="44"
            rx="10"
            fill="var(--node-Y)"
          />
          <text x="525" y="134" text-anchor="middle">Outcome Y</text>
          <rect
            x="330"
            y="10"
            width="130"
            height="44"
            rx="10"
            fill="var(--node-C)"
          />
          <text x="395" y="38" text-anchor="middle">Measured C</text>
          <g id="hidden-node" stroke-dasharray="5 4">
            <path d="M380 180L302 152" marker-end="url(#arrow)" />
            <path d="M402 180L513 152" marker-end="url(#arrow)" />
            <rect
              x="325"
              y="181"
              width="140"
              height="40"
              rx="10"
              fill="var(--node-U)"
              stroke-dasharray="5 4"
            />
            <text x="395" y="206" text-anchor="middle">Unmeasured U</text>
          </g>
        </svg>
        <h2 id="question"></h2>
        <p id="instruction"></p>
        <label class="adjust" id="adjust-control"
          ><input type="checkbox" id="adjust" />Also adjust for instrument
          Z</label
        >
        <div id="hidden-control" hidden>
          <label for="hidden-strength">Hidden confounding strength <output id="hidden-value" for="hidden-strength">0.0</output></label>
          <input id="hidden-strength" type="range" min="0" max="2" step="0.1" value="0" aria-describedby="hidden-help" />
          <p class="small" id="hidden-help">Strengthens both U → A and U → Y. The same people and random draws are retained; treatment and outcomes can change. The true effect stays at 2.</p>
        </div>
        <p class="small" id="model-note"></p>
        <div aria-live="polite" aria-atomic="true">
          <div class="results" id="single-results">
            <div class="result truth">
              <span>True total effect</span><strong>2.000</strong>
            </div>
            <div class="result">
              <span>IPW estimate</span><strong id="ipw"></strong>
            </div>
            <div class="result">
              <span>Outcome regression</span><strong id="regression"></strong>
            </div>
            <div class="result">
              <span>AIPW estimate</span><strong id="aipw"></strong>
            </div>
          </div>
          <div id="paired-results" hidden>
            <p class="truth paired-truth">True total effect <strong>2.000</strong></p>
            <table class="paired-table">
              <caption>Same sample, two adjustment choices</caption>
              <thead><tr><th scope="col">Estimate</th><th scope="col">C only</th><th scope="col">C + Z</th></tr></thead>
              <tbody id="paired-values"></tbody>
            </table>
            <p class="small color-key">Red shows distance from truth (full tint at 2 units). The darker strip highlights extra error versus the other estimate, on a 0–0.5 unit scale.</p>
          </div>
          <p id="interpretation" class="note"></p>
          <p class="small" id="clipping"></p>
        </div>
        <div id="uptake">
          <h2>What does Z change?</h2>
          <div class="bar-row">
            <span>Treatment, Z = 0</span>
            <div class="track"><div class="fill" id="bar0"></div></div>
            <span id="uptake0"></span>
          </div>
          <div class="bar-row">
            <span>Treatment, Z = 1</span>
            <div class="track"><div class="fill blue" id="bar1"></div></div>
            <span id="uptake1"></span>
          </div>
          <p class="small" id="uptake-note">
            Z changes how many people receive treatment. The treatment effect
            itself stays at 2.
          </p>
        </div>
        <div class="actions">
          <button id="redraw">Redraw sample</button
          ><button id="reset">Restart section</button
          ><span class="small" id="sample"></span>
        </div>
        <section id="study-detail" aria-labelledby="study-title">
          <h2 id="study-title">Next: compare variability across studies</h2>
          <p id="study-explanation"></p>
          <div id="instrument-control">
            <label for="instrument-strength">Z → treatment strength <output id="instrument-value" for="instrument-strength">2.0</output></label>
            <input id="instrument-strength" type="range" min="0" max="2" step="0.1" value="2" aria-describedby="instrument-help instrument-status" />
            <p class="small" id="instrument-help">Lower the strength, then rerun the studies. The same people and random draws are retained; treatment and outcomes can change. The true effect stays at 2.</p>
            <p class="small" id="instrument-status" role="status"></p>
          </div>
          <p>
            Run 200 independent studies of 2,400 people. Compare adjustment for
            C alone with C + Z using the same people in each paired comparison.
          </p>
          <button id="repeat">Run 200 studies</button>
          <p id="study-progress" class="study-progress" role="status"></p>
          <p id="study-warning" class="small"></p>
          <div id="study-results"></div>
          <details id="study-reason">
            <summary id="study-reason-title"></summary>
            <p id="study-mechanism"></p>
          </details>
        </section>
      </section>
      <details>
        <summary id="detail-title"></summary>
        <div id="detail"></div>
      </details>
      <nav class="actions" aria-label="Lesson sections">
        <a id="back">← Back</a
        ><a id="next" class="primary"></a>
      </nav>
      <p class="small" id="next-note"></p>
      <nav class="actions" aria-label="Chapter navigation"><a href="?lesson=double-robustness">← Back to double robustness</a><a href="?lesson=tmle">Resume core: targeting with TMLE →</a></nav>
      <footer>
        Point estimates only; fictional effect values.
      </footer>
    </main></div>`;
setupLessonNavigation();

import { instrumentAdjustment, studySummary } from "./instrument-simulation.js";
const el = (id) => document.getElementById(id);
const state = {
  step:
    new URLSearchParams(location.search).get("lesson") ===
    "instrument-hidden-confounding"
      ? 2
      : 1,
  seed: 4217,
  adjust: false,
  strength: 2,
  hidden: 0,
};
let batchStart = 100,
  runId = 0;
const fmt = (x) => (Number.isFinite(x) ? x.toFixed(3) : "Unavailable");
const signed = (x) =>
  Number.isFinite(x) ? `${x > 0 ? "+" : ""}${fmt(x)}` : "Unavailable";
function errorCell(value, other, showDifference = false) {
  const comparison = effectComparison(value, 2);
  const extra =
    Number.isFinite(value) && Number.isFinite(other)
      ? Math.max(0, Math.abs(value - 2) - Math.abs(other - 2))
      : 0;
  return `<td><span class="comparison-value" style="--error-tint:${comparison.tint}%;--extra-width:${Math.min(extra / 0.5, 1) * 100}%" title="${Number.isFinite(value) && Number.isFinite(other) ? `${extra.toFixed(3)} extra absolute error versus the other estimate` : "Comparison unavailable"}"><strong class="estimate-value">${fmt(value)}</strong>${showDifference ? `<small>${comparison.difference}</small>` : ""}<span class="extra-error" aria-hidden="true"></span></span></td>`;
}
const methods = [
  ["IPW", 3],
  ["Outcome regression", 2],
  ["AIPW", 4],
];
const lessons = [
  {
    title: "Instruments",
    intro:
      "An instrument Z influences treatment A, affects outcome Y only through treatment, and is independent of the underlying causes of treatment and outcome. The measured risk score C is still adjusted for.",
    question: "Should we also adjust for Z?",
    instruction:
      "Add Z to the adjustment set, then remove it. The people, outcomes, and treatment uptake below stay fixed.",
    interpretation:
      "Z is not a confounder. Here, adjusting for C already controls confounding, so adding Z does not introduce confounding bias. It can reduce precision: estimates vary more across studies. One estimate cannot show that difference—compare repeated studies below.",
    detailTitle: "An example of an instrument",
    detail:
      "<p>Imagine randomly assigning an invitation to take treatment. The invitation is Z; receiving treatment is A. For the invitation to be an instrument, it must change uptake and affect Y only through receiving treatment. Random assignment makes it independent of baseline causes.</p><p>In a real study these conditions need justification. Here they are built into the simulation.</p><p>The checkbox adds Z to the IPW treatment model, the outcome-regression model, and both AIPW models. C remains included. This example uses a binary measured baseline factor C, so both treatment models are correctly specified when U is absent.</p>",
    next: "What happens when there is hidden confounding?",
  },
  {
    title: "Instruments",
    intro:
      "An unmeasured cause U can affect both treatment and outcome. Explore what happens to the two adjustment choices as its influence grows.",
    question: "What happens when there is hidden confounding?",
    instruction:
      "Start at zero, then increase the strength and compare the two columns.",
    interpretation: "",
    detailTitle: "Why can adjustment make things worse?",
    detail:
      '<p>Imagine Z is a randomly assigned invitation to take treatment. After adjusting for measured C, people still differ in treatment partly because of U, partly because of the invitation, and partly by chance. Because U also affects outcomes, the C-only estimate can mistake some of U’s effect for a treatment effect.</p><p>Adjusting for Z compares treated and untreated people with the same invitation status. Within those comparisons, the invitation can no longer explain treatment differences, so U may account for a larger share of the differences that remain. This can amplify the existing hidden-confounding bias.</p><p>Adjustment changes the comparison; it does not change anyone’s treatment or outcome. The path A ← U → Y remains open. IV estimation is different: it uses the treatment variation created by Z.</p><p>Amplification depends on the causal model and may not appear in every sample. The pattern across many independent studies is more informative than one estimate moving toward or away from the truth.</p><p><a href="https://arxiv.org/abs/1701.04177">Read more: when instruments amplify bias</a></p>',
    next: "How strong is a causal arrow?",
  },
];
function render() {
  const lesson = lessons[state.step - 1];
  for (const key of [
    "title",
    "intro",
    "question",
    "instruction",
    "interpretation",
  ])
    el(key).textContent = lesson[key];
  el("step").textContent = `CAUSAL ROLES · ${state.step} OF 2`;
  el("detail-title").textContent = lesson.detailTitle;
  el("detail").innerHTML = lesson.detail;
  el("next").textContent = lesson.next;
  el("next").href =
    state.step === 1
      ? "?lesson=instrument-hidden-confounding"
      : "?lesson=arrow-strength";
  el("back").href = "?lesson=instrument";
  document.title = `${lesson.title} · Causal Sandbox`;
  el("back").hidden = state.step === 1;
  el("next-note").textContent =
    state.step === 2
      ? "Next: what changes when the exclusion restriction is only approximately true?"
      : "";
  const comparing = state.step === 2;
  el("hidden-control").hidden = !comparing;
  el("instrument-control").hidden = comparing;
  el("instrument-strength").value = state.strength;
  el("instrument-strength").style.setProperty(
    "--fill",
    `${50 * state.strength}%`,
  );
  el("instrument-value").textContent = state.strength.toFixed(1);
  el("instrument-status").textContent =
    state.strength === 0
      ? "Z has no effect on treatment at zero; it is no longer an instrument."
      : "Changing strength clears study results. Compare with and without Z at each strength.";
  el("instrument-path").classList.toggle("inactive", state.strength === 0);
  el("uptake-note").textContent =
    state.strength === 0
      ? "Any uptake difference at zero is due to chance. The treatment effect stays at 2."
      : "Z changes how many people receive treatment. The treatment effect itself stays at 2.";
  el("paired-results").hidden = !comparing;
  el("single-results").hidden = comparing;
  el("adjust-control").hidden = comparing;
  el("uptake").hidden = comparing;
  el("hidden-strength").value = state.hidden;
  el("hidden-strength").style.setProperty("--fill", `${50 * state.hidden}%`);
  el("hidden-value").textContent = state.hidden.toFixed(1);
  el("hidden-node").classList.toggle("inactive", state.hidden === 0);
  if (comparing)
    el("interpretation").textContent =
      state.hidden === 0
        ? "At zero, U has no effect on treatment or outcome. Both analyses are centered near truth across studies; adding Z can increase their spread."
        : "U already biases the C-only comparison. Adjusting for Z accounts for treatment differences unrelated to U, so U can have more influence over the remaining comparison. Check across studies: a single sample can move differently.";
  el("hidden-node").style.visibility = state.step === 2 ? "visible" : "hidden";
  el("graph").setAttribute(
    "aria-label",
    `Z ${state.strength === 0 ? "has no effect on A" : "causes A"}, A causes Y, and measured C causes both A and Y.${state.step === 2 ? (state.hidden ? " Unmeasured U also causes A and Y." : " Unmeasured U is shown with both paths inactive at zero strength.") : ""}`,
  );
  el("adjust").checked = state.adjust;
  el("study-title").textContent =
    state.step === 1
      ? "Next: compare variability across studies"
      : "Compare bias and spread across studies";
  el("study-explanation").textContent = comparing
    ? "Mean estimate minus truth estimates bias across studies. The C-only bias is already present; the change in bias after adding Z shows whether it is amplified. SD measures spread, not bias."
    : "The mean estimate shows where estimates are centered. Their standard deviation (SD) shows how much they vary between studies. Larger SD means less precision; it does not mean the average estimate is shifted away from truth.";
  el("study-reason-title").textContent = comparing
    ? "Which hidden-confounding strength is used?"
    : "Why can adjusting for Z increase variability?";
  el("study-mechanism").textContent =
    state.step === 1
      ? state.strength === 0
        ? "At zero, Z predicts neither treatment nor outcome. Adding it can still change a finite-sample fit by chance, but there is no treatment variation supplied by Z to remove."
        : "Z predicts treatment but adds no outcome information once A and C are known. Adjusting for Z can leave less independent treatment variation and make IPW weights more uneven."
      : `Both analyses use hidden confounding strength ${state.hidden.toFixed(1)}. Changing strength clears these results.`;
  el("model-note").textContent = comparing
    ? "IPW, outcome regression, and AIPW each compare C only with C + Z. U stays unavailable to their models."
    : `All three methods adjust for ${state.adjust ? "C and Z" : "C"}.`;
  const { data, fits } = instrumentAdjustment({
    seed: state.seed,
    strength: state.strength,
    hidden: state.hidden,
  });
  el("paired-values").innerHTML = methods
    .map(
      ([name, index]) =>
        `<tr><th scope="row">${name}</th>${fits.map((f, j) => errorCell(f.values[index], fits[1 - j].values[index], true)).join("")}</tr>`,
    )
    .join("");
  const fit = fits[+state.adjust];
  for (const [id, index] of [
    ["ipw", 3],
    ["regression", 2],
    ["aipw", 4],
  ])
    el(id).textContent = fmt(fit.values[index]);
  const clipped = comparing
    ? fits.reduce((sum, f) => sum + f.clipped, 0)
    : fit.clipped;
  el("clipping").textContent = clipped
    ? `${clipped} fitted probabilities clipped${comparing ? " across both fits" : ""}; clipping may affect weighting estimates.`
    : "";
  el("sample").textContent = `2,400 people · sample ${state.seed}`;
  for (const z of [0, 1]) {
    const group = data.filter((d) => d.Z === z);
    const p = group.reduce((s, d) => s + d.A, 0) / group.length;
    el(`bar${z}`).style.width = `${100 * p}%`;
    el(`uptake${z}`).textContent = `${(100 * p).toFixed(1)}%`;
  }
}
function clearStudies() {
  runId++;
  batchStart = 100;
  el("repeat").disabled = false;
  el("repeat").textContent = "Run 200 studies";
  el("study-progress").textContent = "";
  el("study-warning").textContent = "";
  el("study-results").classList.remove("studies-animating");
  el("study-results").setAttribute("aria-busy", "false");
  el("study-results").innerHTML = "";
}
function enter(step) {
  clearStudies();
  state.hidden = 0;
  state.strength = 2;
  state.step = step;
  state.adjust = false;
  state.seed = 4217;
  el("study-reason").open = false;
  el("detail").parentElement.open = false;
  render();
  el("title").focus();
}
el("instrument-strength").addEventListener("input", (e) => {
  state.strength = Number(e.target.value);
  clearStudies();
  render();
});
el("hidden-strength").addEventListener("input", (e) => {
  state.hidden = Number(e.target.value);
  clearStudies();
  render();
});
el("adjust").addEventListener("change", (e) => {
  state.adjust = e.target.checked;
  render();
});
el("redraw").addEventListener("click", () => {
  state.seed++;
  render();
});
el("reset").addEventListener("click", () => enter(state.step));

el("repeat").addEventListener("click", async () => {
  const current = ++runId;
  const hidden = state.hidden;
  const strength = state.strength;
  const start = batchStart;
  const values = Array.from({ length: 2 }, () =>
    Array.from({ length: 3 }, () => []),
  );
  const names = methods.map(([name]) => name);
  let clipped = 0;
  el("repeat").disabled = true;
  el("repeat").textContent = "Running studies…";
  el("study-warning").textContent = "";
  el("study-results").setAttribute("aria-busy", "true");
  el("study-results").innerHTML = "";
  try {
    for (let i = 0; i < 200; i++) {
      if (current !== runId) return;
      const { fits } = instrumentAdjustment({
        seed: start + i,
        hidden,
        strength,
      });
      fits.forEach((f, j) => {
        clipped += f.clipped;
        [3, 2, 4].forEach((index, k) => values[j][k].push(f.values[index]));
      });
      if ((i + 1) % 10 === 0) {
        el("study-progress").textContent = `${i + 1} of 200 studies`;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    if (current !== runId) return;
    const stats = values.map((arm) => arm.map((v) => studySummary(v)));
    const spread =
      `<h3>How much do estimates vary?</h3><p class="small">Each dot is one study’s estimate. Compare the widths with and without Z: a wider cloud means less precision.</p><p class="study-key"><span><span class="study-truth-key"></span> True effect: 2</span><span class="study-summary"><span class="study-range-key"></span> Middle 90% of estimates</span></p>${studyDistributions(values, stats, names, start)}<p class="small study-summary">The ranges span the 5th–95th percentiles across studies, not confidence intervals. Vertical position only separates dots. All plots share the same effect axis.</p><p class="small study-summary">200 studies · Z → treatment strength ${strength.toFixed(1)} · Seeds ${start}–${start + 199}.</p>` +
      (state.step === 1
        ? `<details id="study-means" class="study-summary"><summary>Are estimates still centered near truth?</summary><p>The mean shows where estimates are centered; the true total effect is 2. ${hidden ? "Here U creates bias, so greater spread is only part of the error." : "With confounding controlled and correctly specified models, both analyses are centered near truth across repeated studies. Compare the observed spread above; adding Z need not increase it in every batch or at every strength."}</p><table><thead><tr><th>Mean estimate</th><th>Without Z</th><th>With Z</th></tr></thead><tbody>${names.map((name, k) => `<tr><th scope="row">${name}</th><td>${fmt(stats[0][k].mean)}</td><td>${fmt(stats[1][k].mean)}</td></tr>`).join("")}</tbody></table></details>`
        : "") +
      `<p class="small study-summary">${state.step === 1 ? "Greater spread means estimates are typically farther from truth, even though adding Z may bring an individual estimate closer." : "With hidden confounding, error reflects both spread and systematic bias."}</p>`;

    if (state.step === 2) {
      el("study-results").innerHTML =
        `<div id="bias-comparison"><h3>Where are estimates centered?</h3><p class="small">True effect: 2 · Strength: ${hidden.toFixed(1)} · 200 studies · Seeds ${start}–${start + 199}</p>${names
          .map((name, k) => {
            const before = stats[0][k].mean;
            const after = stats[1][k].mean;
            const bias = (mean) =>
              Number.isFinite(mean) ? signed(mean - 2) : "Unavailable";
            const difference =
              Number.isFinite(before) && Number.isFinite(after)
                ? signed(after - before)
                : "Unavailable";
            return `<section class="bias-method" aria-label="${name} bias"><h4>${name}</h4><table><thead><tr><th scope="col">Adjustment</th><th scope="col">Mean estimate</th><th scope="col">Mean − truth</th></tr></thead><tbody><tr><th scope="row">C only</th>${errorCell(before, after)}<td>${bias(before)}</td></tr><tr><th scope="row">C + Z</th>${errorCell(after, before)}<td>${bias(after)}</td></tr></tbody></table><p class="small">Change in bias after adding Z: <strong>${difference}</strong></p></section>`;
          })
          .join(
            "",
          )}<p class="small">The same red tint and darker strip now compare mean errors across studies. Bias is amplified when the mean moves farther from 2. The signed change is C + Z minus C only; a positive change alone does not establish amplification. A new batch can differ, and the pattern need not hold in every causal world.</p></div><details><summary>Sampling spread and other summaries</summary>${spread}</details>`;
    } else {
      el("study-results").innerHTML = spread;
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el("repeat").textContent = "Showing study estimates…";
        el("study-progress").textContent =
          "Showing paired estimates from 200 studies.";
        el("study-results").classList.add("studies-animating");
        // Paired dots share their delay; the last pair finishes within four seconds.
        await new Promise((resolve) => setTimeout(resolve, 4000));
        if (current !== runId) return;
        el("study-results").classList.remove("studies-animating");
      }
    }
    const unavailable = stats.flat().reduce((s, r) => s + r.unavailable, 0);
    el("study-progress").textContent = "200 studies complete.";
    el("study-warning").textContent =
      `${unavailable ? unavailable + " estimates unavailable; summaries use available estimates only. " : ""}${clipped ? clipped + " probabilities clipped across fits." : ""}`;
    batchStart += 200;
    el("repeat").textContent = "Run another 200 studies";
  } finally {
    if (current === runId) {
      el("repeat").disabled = false;
      el("study-results").setAttribute("aria-busy", "false");
    }
  }
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) enter(state.step);
});
render();
el("title").focus();
