import "./instrument-lesson.css";
import { themeControl } from "./theme.js";
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
        <p class="small" id="model-note"></p>
        <div aria-live="polite" aria-atomic="true">
          <div class="results">
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
          <p>
            The mean estimate shows where estimates are centered. Their standard
            deviation (SD) shows how much they vary between studies. Larger SD
            means less precision; it does not mean the average estimate is
            shifted away from truth.
          </p>
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
};
let batchStart = 100,
  runId = 0;
const fmt = (x) => (Number.isFinite(x) ? x.toFixed(3) : "Unavailable");
const lessons = [
  {
    title: "A new causal role: the instrument",
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
    next: "Continue: add hidden confounding",
  },
  {
    title: "An instrument with hidden confounding",
    intro:
      "Now we change the world: an unmeasured cause U affects both treatment and outcome. C is still measured and adjusted for; U is unavailable to all three estimators.",
    question: "Can adjusting for Z make the remaining bias worse?",
    instruction:
      "Compare adjustment for C alone with adjustment for C and Z. Check the pattern across studies below.",
    interpretation:
      "Adding Z does not block the hidden path A ← U → Y. In this experiment it increases the remaining bias on average. A particular sample can move differently.",
    detailTitle: "Why can adjustment make things worse?",
    detail:
      '<p>Z supplies treatment variation unrelated to U. Adjusting for Z removes that source from the comparison, so U can account for more of the remaining treatment differences. This can amplify hidden-confounding bias.</p><p>This is not a rule that every added variable is harmful. C still controls measured confounding.</p><p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3254160/">Read more: instrument adjustment and bias</a></p>',
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
  el("hidden-node").style.visibility = state.step === 2 ? "visible" : "hidden";
  el("graph").setAttribute(
    "aria-label",
    `Instrument Z causes A, A causes Y, and measured C causes both A and Y.${state.step === 2 ? " Unmeasured U also causes A and Y." : ""}`,
  );
  el("adjust").checked = state.adjust;
  el("study-title").textContent =
    state.step === 1
      ? "Why can adjusting for Z increase variability?"
      : "Compare bias and spread across studies";
  el("study-mechanism").textContent =
    state.step === 1
      ? "Z predicts treatment but adds no outcome information once A and C are known. Adjusting for Z can leave less independent treatment variation and make IPW weights more uneven."
      : "U remains unmeasured with either adjustment choice. Compare both the mean estimates and their spread to distinguish remaining bias from sampling variation.";
  el("model-note").textContent =
    `All three methods adjust for ${state.adjust ? "C and Z" : "C"}.${state.step === 2 ? " U remains unmeasured." : ""}`;
  const { data, fits } = instrumentAdjustment({
    seed: state.seed,
    strength: 2,
    hidden: state.step === 2 ? 1 : 0,
  });
  const fit = fits[+state.adjust];
  for (const [id, index] of [
    ["ipw", 3],
    ["regression", 2],
    ["aipw", 4],
  ])
    el(id).textContent = fmt(fit.values[index]);
  el("clipping").textContent = fit.clipped
    ? `${fit.clipped} fitted probabilities clipped; clipping may affect weighting estimates.`
    : "";
  el("sample").textContent = `2,400 people · sample ${state.seed}`;
  for (const z of [0, 1]) {
    const group = data.filter((d) => d.Z === z);
    const p = group.reduce((s, d) => s + d.A, 0) / group.length;
    el(`bar${z}`).style.width = `${100 * p}%`;
    el(`uptake${z}`).textContent = `${(100 * p).toFixed(1)}%`;
  }
}
function enter(step) {
  runId++;
  batchStart = 100;
  el("repeat").disabled = false;
  el("repeat").textContent = "Run 200 studies";
  el("study-progress").textContent = "";
  state.step = step;
  state.adjust = false;
  state.seed = 4217;
  el("study-results").innerHTML = "";
  el("study-detail").open = false;
  el("detail").parentElement.open = false;
  render();
  el("title").focus();
}
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
  const hidden = state.step === 2 ? 1 : 0;
  const start = batchStart;
  const values = Array.from({ length: 2 }, () =>
    Array.from({ length: 3 }, () => []),
  );
  const names = ["IPW", "Outcome regression", "AIPW"];
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
    el("study-results").innerHTML =
      `<h3>How much do estimates vary?</h3><p class="small">SD across 200 studies. Both analyses adjust for C; the second also adds Z.</p><div class="sd-comparison">${names.map((name, k) => `<section class="sd-method" aria-label="${name} standard deviation"><div class="sd-method-header"><h4>${name}</h4><span class="sd-change">${change(stats[0][k].sd, stats[1][k].sd)} with Z</span></div>${sdRow(stats[0][k].sd, stats[1][k].sd, "Without Z")}${sdRow(stats[1][k].sd, stats[0][k].sd, "With Z")}</section>`).join("")}</div><p class="small">Bars share a 0–0.100 SD scale. Light red marks extra spread within each pair. Seeds ${start}–${start + 199}.${stats.flat().some((s) => s.sd > sdLimit) ? " Bars stop at 0.100; numbers retain the full SD." : ""}</p>` +
      `<details id="study-means"><summary>Are estimates still centered near truth?</summary><p>The mean shows where estimates are centered; the true total effect is 2. ${hidden ? "Here U creates bias, so greater spread is only part of the error." : "Here the means stay near truth even though adding Z increases sampling spread."}</p><table><thead><tr><th>Mean estimate</th><th>Without Z</th><th>With Z</th></tr></thead><tbody>${names.map((name, k) => `<tr><th scope="row">${name}</th><td>${fmt(stats[0][k].mean)}</td><td>${fmt(stats[1][k].mean)}</td></tr>`).join("")}</tbody></table></details>` +
      `<p class="small">SD is in outcome units; variance is SD squared. A new batch will give slightly different results. These are sampling summaries, not confidence intervals.</p><details><summary>Does more spread mean more error?</summary><p>When estimates are centered at truth, greater variance means greater mean squared error. Root mean squared error (RMSE) expresses that error in outcome units. It need not increase for every individual study.</p><table><thead><tr><th>Method</th><th>RMSE: C</th><th>RMSE: C + Z</th></tr></thead><tbody>${names.map((name, k) => `<tr><th scope="row">${name}</th><td>${fmt(stats[0][k].rmse)}</td><td>${fmt(stats[1][k].rmse)}</td></tr>`).join("")}</tbody></table><p>With hidden confounding, error reflects both spread and systematic bias.</p><p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3254160/">Read more: adjustment for instruments, bias, and precision</a></p></details>`;
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
