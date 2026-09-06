import "./instrument-lesson.css";
import { themeControl } from "./theme.js";
import { effectComparison } from "./effect-comparison.js";
import icon from "./brand.svg?raw";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page"><header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Full sandbox ↗</a>${themeControl()}</header>
    <main>
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
          <path d="M150 128H237" marker-end="url(#arrow)" />
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
          <p class="small">
            Z changes how many people receive treatment. The treatment effect
            itself stays at 2.
          </p>
        </div>
        <div class="actions">
          <button id="redraw">Redraw sample</button
          ><button id="reset">Restart section</button
          ><span class="small" id="sample"></span>
        </div>
        <details id="study-detail">
          <summary id="study-title">
            Why can adjusting for Z increase variability?
          </summary>
          <p id="study-mechanism"></p>
          <p id="study-explanation"></p>
          <p>
            Run 200 independent studies of 2,400 people. Compare adjustment for
            C alone with C + Z using the same people in each paired comparison.
          </p>
          <button id="repeat">Run 200 studies</button>
          <p id="study-progress" class="small" role="status"></p>
          <div id="study-results"></div>
        </details>
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
      <footer>
        Point estimates only; fictional effect values.
      </footer>
    </main></div>`;

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
      "An instrument Z influences treatment A, affects outcome Y only through treatment, and is independent of the underlying causes of treatment and outcome. Measured baseline health C is still adjusted for.",
    question: "Should we also adjust for Z?",
    instruction:
      "Add Z to the adjustment set, then remove it. The people, outcomes, and treatment uptake below stay fixed.",
    interpretation:
      "Z is not a confounder. Adding it can change the estimates in this sample and increase their spread across studies, even when they remain centered near the true effect.",
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
      '<p>Imagine Z is a randomly assigned invitation to take treatment. After adjusting for measured C, people still take treatment partly because of U, partly because of the invitation, and partly by chance. U also changes outcomes, so the C-only estimate can mistake some of U’s effect for a treatment effect.</p><p>The invitation supplies treatment differences unrelated to U. Accounting for Z removes that source of variation from the comparison without removing U’s influence. Among people with the same invitation status, U can have more influence over the remaining treatment differences, amplifying the existing bias.</p><p>Adjustment changes the comparison, not anyone’s treatment or outcome. The hidden path A ← U → Y remains open with either choice. Using Z for IV estimation is a different operation: it uses the treatment variation supplied by Z.</p><p>Amplification depends on the causal model and is not guaranteed in every sample. C still controls measured confounding. The pattern across independent studies is more informative than one estimate moving away from truth.</p><p><a href="https://arxiv.org/abs/1701.04177">Read more: when instruments amplify bias</a></p>',
    next: "Return to the instrument introduction",
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
      : "?lesson=instrument";
  el("back").href = "?lesson=instrument";
  document.title = `${lesson.title} · Causal Sandbox`;
  el("back").hidden = state.step === 1;
  el("next-note").textContent =
    state.step === 2
      ? "Using an instrument to estimate a treatment effect is a separate, later lesson."
      : "";
  const comparing = state.step === 2;
  el("hidden-control").hidden = !comparing;
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
    `Instrument Z causes A, A causes Y, and measured C causes both A and Y.${state.step === 2 ? (state.hidden ? " Unmeasured U also causes A and Y." : " Unmeasured U is shown with both paths inactive at zero strength.") : ""}`,
  );
  el("adjust").checked = state.adjust;
  el("study-title").textContent =
    state.step === 1
      ? "Why can adjusting for Z increase variability?"
      : "Compare bias and spread across studies";
  el("study-explanation").textContent = comparing
    ? "Mean estimate minus truth estimates bias across studies. The C-only bias is already present; the change in bias after adding Z shows whether it is amplified. SD measures spread, not bias."
    : "The mean estimate shows where estimates are centered. Their standard deviation (SD) shows how much they vary between studies. Larger SD means less precision; it does not mean the average estimate is shifted away from truth.";
  el("study-mechanism").textContent =
    state.step === 1
      ? "Z predicts treatment but adds no outcome information once A and C are known. Adjusting for Z can leave less independent treatment variation and make IPW weights more uneven."
      : `Both analyses use hidden confounding strength ${state.hidden.toFixed(1)}. Changing strength clears these results.`;
  el("model-note").textContent = comparing
    ? "IPW, outcome regression, and AIPW each compare C only with C + Z. U stays unavailable to their models."
    : `All three methods adjust for ${state.adjust ? "C and Z" : "C"}.`;
  const { data, fits } = instrumentAdjustment({
    seed: state.seed,
    strength: 2,
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
  el("study-results").innerHTML = "";
}
function enter(step) {
  clearStudies();
  state.hidden = 0;
  state.step = step;
  state.adjust = false;
  state.seed = 4217;
  el("study-detail").open = false;
  el("detail").parentElement.open = false;
  render();
  el("title").focus();
}
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
  const start = batchStart;
  const values = Array.from({ length: 2 }, () =>
    Array.from({ length: 3 }, () => []),
  );
  const names = methods.map(([name]) => name);
  let clipped = 0;
  el("repeat").disabled = true;
  el("study-results").innerHTML = "";
  try {
    for (let i = 0; i < 200; i++) {
      if (current !== runId) return;
      const { fits } = instrumentAdjustment({ seed: start + i, hidden });
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
    // Bar lengths share a fixed scale; tint compares SD within each pair.
    const sdLimit = 0.1;
    const sdRow = (sd, other, label) => {
      const width = Number.isFinite(sd) ? Math.min(sd / sdLimit, 1) * 100 : 0;
      const extra =
        Number.isFinite(sd) && Number.isFinite(other) && sd > other
          ? other > 0
            ? 100 * (sd / other - 1)
            : 27
          : 0;
      const tint = 1 + Math.min(extra, 27);
      return `<div class="sd-row"><span class="sd-label">${label}</span><span class="sd-track" aria-hidden="true"><span class="sd-bar" style="width:${width}%;--sd-tint:${tint}%"></span></span><strong>${fmt(sd)}</strong></div>`;
    };
    const change = (before, after) => {
      if (!Number.isFinite(before) || !Number.isFinite(after) || before === 0)
        return "Change unavailable";
      const percent = 100 * (after / before - 1);
      return `${percent > 0 ? "+" : ""}${percent.toFixed(0)}% SD`;
    };
    const spread =
      `<h3>How much do estimates vary?</h3><p class="small">SD across 200 studies. Both analyses adjust for C; the second also adds Z.</p><div class="sd-comparison">${names.map((name, k) => `<section class="sd-method" aria-label="${name} standard deviation"><div class="sd-method-header"><h4>${name}</h4><span class="sd-change">${change(stats[0][k].sd, stats[1][k].sd)} with Z</span></div>${sdRow(stats[0][k].sd, stats[1][k].sd, "Without Z")}${sdRow(stats[1][k].sd, stats[0][k].sd, "With Z")}</section>`).join("")}</div><p class="small">Bars share a 0–0.100 SD scale. Light red marks extra spread within each pair. Seeds ${start}–${start + 199}.${stats.flat().some((s) => s.sd > sdLimit) ? " Bars stop at 0.100; numbers retain the full SD." : ""}</p>` +
      (state.step === 1
        ? `<details id="study-means"><summary>Are estimates still centered near truth?</summary><p>The mean shows where estimates are centered; the true total effect is 2. ${hidden ? "Here U creates bias, so greater spread is only part of the error." : "Here the means stay near truth even though adding Z increases sampling spread."}</p><table><thead><tr><th>Mean estimate</th><th>Without Z</th><th>With Z</th></tr></thead><tbody>${names.map((name, k) => `<tr><th scope="row">${name}</th><td>${fmt(stats[0][k].mean)}</td><td>${fmt(stats[1][k].mean)}</td></tr>`).join("")}</tbody></table></details>`
        : "") +
      `<p class="small">SD is in outcome units; variance is SD squared. A new batch will give slightly different results. These are sampling summaries, not confidence intervals.</p><details><summary>Does more spread mean more error?</summary><p>When estimates are centered at truth, greater variance means greater mean squared error. Root mean squared error (RMSE) expresses that error in outcome units. It need not increase for every individual study.</p><table><thead><tr><th>Method</th><th>RMSE: C</th><th>RMSE: C + Z</th></tr></thead><tbody>${names.map((name, k) => `<tr><th scope="row">${name}</th><td>${fmt(stats[0][k].rmse)}</td><td>${fmt(stats[1][k].rmse)}</td></tr>`).join("")}</tbody></table><p>With hidden confounding, error reflects both spread and systematic bias.</p><p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3254160/">Read more: adjustment for instruments, bias, and precision</a></p></details>`;
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
    } else el("study-results").innerHTML = spread;
    const unavailable = stats.flat().reduce((s, r) => s + r.unavailable, 0);
    el("study-progress").textContent =
      `200 studies complete.${unavailable ? " " + unavailable + " estimates unavailable; summaries use available estimates only." : ""}${clipped ? " " + clipped + " probabilities clipped across fits." : ""}`;
    batchStart += 200;
    el("repeat").textContent = "Run another 200 studies";
  } finally {
    if (current === runId) el("repeat").disabled = false;
  }
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) enter(state.step);
});
render();
el("title").focus();
