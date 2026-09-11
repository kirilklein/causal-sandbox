import "./instrument-lesson.css";
import "./arrow-strength-lesson.css";
import { themeControl } from "./theme.js";
import { effectComparison } from "./effect-comparison.js";
import { studySummary } from "./instrument-simulation.js";
import {
  arrowStrengthSimulation,
  cancellationDirectEffect,
  populationZEffect,
} from "./arrow-strength-simulation.js";
import icon from "./brand.svg?raw";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";

document.querySelector("#app").innerHTML = `
  <div class="instrument-page arrow-strength-page">
    <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${themeControl()}</header>
    <main>
      ${lessonNavigation({ currentOptional: "arrow-strength" })}
      <p class="eyebrow">OPTIONAL · CAUSAL ROLES</p>
      <h1 tabindex="-1">How strong is a causal arrow?</h1>
      <p class="intro">A graph shows whether a causal path is assumed to exist, but not how large its effect is. A <a href="https://stacks.cdc.gov/view/cdc/229116/cdc_229116_DS1.pdf">missing arrow is a causal claim</a>, not a conclusion from a small coefficient. Meanwhile, <a href="https://doi.org/10.1214/12-AOS1080">causal paths can cancel</a> so that an observed association is close to zero.</p>

      <section class="panel" aria-labelledby="question">
        <h2 id="question">Can Z cause Y when regression finds no association?</h2>
        <p>Start with a valid instrument. Change either arrow, or select <strong>Paths cancel</strong> to see a nonzero direct effect hidden by the path through treatment.</p>
        <svg class="graph strength-graph" viewBox="0 0 590 245" role="img" id="graph">
          <defs>
            <marker id="strength-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0,7 3.5,0 7" fill="var(--causal-path)" />
            </marker>
          </defs>
          <path id="za-path" d="M150 128H237" marker-end="url(#strength-arrow)" />
          <path d="M345 128H470" marker-end="url(#strength-arrow)" />
          <path d="M380 55L302 103" marker-end="url(#strength-arrow)" />
          <path d="M402 55L513 103" marker-end="url(#strength-arrow)" />
          <path id="zy-path" d="M145 150C245 222 402 222 487 152" marker-end="url(#strength-arrow)" />
          <text id="za-label" x="194" y="116" text-anchor="middle"></text>
          <text id="zy-label" x="315" y="226" text-anchor="middle"></text>
          <rect x="10" y="106" width="140" height="44" rx="10" fill="var(--surface-subtle)" />
          <text x="80" y="134" text-anchor="middle">Candidate Z</text>
          <rect x="240" y="106" width="105" height="44" rx="10" fill="var(--node-A)" />
          <text x="292" y="134" text-anchor="middle">Treatment A</text>
          <rect x="473" y="106" width="105" height="44" rx="10" fill="var(--node-Y)" />
          <text x="525" y="134" text-anchor="middle">Outcome Y</text>
          <rect x="330" y="10" width="130" height="44" rx="10" fill="var(--node-C)" />
          <text x="395" y="38" text-anchor="middle">Measured C</text>
        </svg>

        <div class="strength-presets" aria-label="Examples">
          <button id="pure">Pure instrument</button>
          <button id="cancel" class="primary">Paths cancel</button>
        </div>
        <div class="strength-controls">
          <label for="treatment-strength">Z → A strength <output id="treatment-value" for="treatment-strength">2.00</output></label>
          <input id="treatment-strength" type="range" min="0" max="3" step="0.05" value="2" />
          <p class="small">How strongly Z changes treatment uptake.</p>
          <label for="direct-effect">Z → Y direct effect <output id="direct-value" for="direct-effect">0.00</output></label>
          <input id="direct-effect" type="range" min="-1.5" max="1.5" step="0.01" value="0" />
          <p class="small">Any nonzero value violates the instrument exclusion restriction.</p>
        </div>

        <div class="results strength-evidence" aria-live="polite" aria-atomic="true">
          <div class="result truth"><span>True A → Y effect</span><strong>2.000</strong></div>
          <div class="result"><span>True direct Z → Y</span><strong id="direct-truth"></strong></div>
          <div class="result"><span>True total effect of Z</span><strong id="z-total"></strong></div>
          <div class="result" id="association-card"><span>Marginal regression of Y on Z</span><strong id="z-association"></strong></div>
        </div>
        <p id="interpretation" class="note" aria-live="polite"></p>

        <h2>What happens to the treatment-effect estimate?</h2>
        <div class="table-wrap">
          <table class="paired-table">
            <caption>Same sample, two adjustment choices</caption>
            <thead><tr><th scope="col">Estimate</th><th scope="col">C only</th><th scope="col">C + Z</th></tr></thead>
            <tbody id="effect-estimates"></tbody>
          </table>
        </div>
        <p class="small color-key">Truth is 2. Red shows distance from truth on the same fixed 0–2 outcome-unit scale used in other lessons.</p>

        <div class="actions">
          <button id="redraw">Redraw sample</button>
          <button id="reset">Restart lesson</button>
          <span class="small" id="sample"></span>
        </div>

        <details id="study-detail">
          <summary>Is the near-zero association just this sample?</summary>
          <p>Run 200 independent studies. A sample association may miss zero, so the mean across studies is the clearer comparison.</p>
          <button id="repeat">Run 200 studies</button>
          <p id="study-progress" class="small" role="status"></p>
          <div id="study-results"></div>
        </details>
      </section>

      <details>
        <summary>What is cancelling?</summary>
        <p>Z changes treatment, and treatment raises Y. Under <strong>Paths cancel</strong>, Z also lowers Y directly by the same amount in the opposite direction. The two causal contributions sum to zero in the population.</p>
        <p>The zero marginal association does not make Z irrelevant. Because its direct path makes Z a common cause of A and Y, omitting Z leaves confounding in the treatment comparison.</p>
      </details>
      <details>
        <summary>Sources and further reading</summary>
        <ul class="reading-list">
          <li><a href="https://stacks.cdc.gov/view/cdc/229116/cdc_229116_DS1.pdf">Greenland, Pearl & Robins (1999), Causal Diagrams for Epidemiologic Research</a></li>
          <li><a href="https://doi.org/10.1214/12-AOS1080">Uhler et al. (2013), Geometry of the Faithfulness Assumption</a></li>
          <li><a href="https://ideas.repec.org/a/tpr/restat/v94y2012i1p260-272.html">Conley, Hansen & Rossi (2012), Plausibly Exogenous</a></li>
          <li><a href="https://arxiv.org/abs/1302.4976">Pearl (2013), On the Testability of Causal Models with Latent and Instrumental Variables</a></li>
          <li><a href="https://doi.org/10.1093/aje/kwr323">Glymour, Tchetgen Tchetgen & Robins (2012), Credible Mendelian Randomization Studies</a></li>
        </ul>
      </details>
      <nav class="actions" aria-label="Lesson navigation">
        <a href="?lesson=instrument-hidden-confounding">← Instruments and adjustment</a>
        <a class="primary" href="./">Return to guided lessons</a>
      </nav>
      <footer>Point estimates only; fictional effect values.</footer>
    </main>
  </div>`;
setupLessonNavigation();

const el = (id) => document.getElementById(id);
const methods = [
  ["IPW", 3],
  ["Outcome regression", 2],
  ["AIPW", 4],
];
const state = { seed: 4217, treatmentStrength: 2, directEffect: 0 };
let runId = 0;
let batchStart = 100;
const fmt = (value) =>
  Number.isFinite(value) ? value.toFixed(3) : "Unavailable";

function estimateCell(value) {
  const comparison = effectComparison(value, 2);
  return `<td><span class="comparison-value" style="--error-tint:${comparison.tint}%"><strong>${fmt(value)}</strong><small>${comparison.difference}</small></span></td>`;
}

function clearStudies() {
  runId++;
  batchStart = 100;
  el("repeat").disabled = false;
  el("repeat").textContent = "Run 200 studies";
  el("study-progress").textContent = "";
  el("study-results").innerHTML = "";
}

function render() {
  const result = arrowStrengthSimulation(state);
  el("treatment-strength").value = state.treatmentStrength;
  el("direct-effect").value = state.directEffect;
  el("treatment-value").textContent = state.treatmentStrength.toFixed(2);
  el("direct-value").textContent = state.directEffect.toFixed(2);
  el("direct-truth").textContent = fmt(state.directEffect);
  el("z-total").textContent = fmt(result.totalZEffect);
  el("z-association").textContent = fmt(result.zAssociation);
  el("sample").textContent = `2,400 people · sample ${state.seed}`;
  el("za-label").textContent = `strength ${state.treatmentStrength.toFixed(2)}`;
  el("zy-label").textContent = `direct effect ${state.directEffect.toFixed(2)}`;
  el("za-path").style.opacity = 0.12 + 0.88 * (state.treatmentStrength / 3);
  el("zy-path").style.opacity =
    state.directEffect === 0
      ? 0
      : 0.2 + 0.8 * (Math.abs(state.directEffect) / 1.5);
  el("graph").setAttribute(
    "aria-label",
    `The Z to A path has strength ${state.treatmentStrength.toFixed(2)}. A causes Y with effect 2. C causes A and Y. The direct Z to Y path has effect ${state.directEffect.toFixed(2)}.`,
  );
  el("pure").setAttribute(
    "aria-pressed",
    state.treatmentStrength === 2 && state.directEffect === 0,
  );
  const cancelling =
    Math.abs(result.totalZEffect) < 0.005 &&
    Math.abs(state.directEffect) > 0.05;
  el("cancel").setAttribute("aria-pressed", cancelling);
  el("association-card").classList.toggle(
    "near-zero",
    Math.abs(result.zAssociation) < 0.15,
  );
  if (state.treatmentStrength === 0) {
    el("interpretation").textContent =
      "At zero Z → A strength, Z does not predict treatment, so it is not an instrument. Instrument relevance also has a magnitude.";
  } else if (state.directEffect === 0) {
    el("interpretation").textContent =
      "At zero, Z affects Y only through treatment. Z can be a valid instrument in this simulated world.";
  } else if (cancelling) {
    el("interpretation").textContent =
      `Z has a direct effect of ${state.directEffect.toFixed(2)}, but its direct and treatment-mediated effects cancel in the population. Regression of Y on Z is therefore near zero even though the Z → Y arrow is real.`;
  } else {
    el("interpretation").textContent =
      "Z now affects Y both directly and through treatment. The direct effect violates the exclusion restriction, and its direction determines whether the two paths reinforce or offset each other.";
  }
  el("effect-estimates").innerHTML = methods
    .map(
      ([name, index]) =>
        `<tr><th scope="row">${name}</th>${result.fits.map((fit) => estimateCell(fit.values[index])).join("")}</tr>`,
    )
    .join("");
}

for (const [id, key] of [
  ["treatment-strength", "treatmentStrength"],
  ["direct-effect", "directEffect"],
]) {
  el(id).addEventListener("input", (event) => {
    state[key] = Number(event.target.value);
    clearStudies();
    render();
  });
}
el("pure").addEventListener("click", () => {
  state.treatmentStrength = 2;
  state.directEffect = 0;
  clearStudies();
  render();
});
el("cancel").addEventListener("click", () => {
  state.directEffect = cancellationDirectEffect(state.treatmentStrength);
  clearStudies();
  render();
});
el("redraw").addEventListener("click", () => {
  state.seed++;
  render();
});
el("reset").addEventListener("click", () => {
  state.seed = 4217;
  state.treatmentStrength = 2;
  state.directEffect = 0;
  clearStudies();
  el("study-detail").open = false;
  render();
});

el("repeat").addEventListener("click", async () => {
  const current = ++runId;
  const settings = {
    treatmentStrength: state.treatmentStrength,
    directEffect: state.directEffect,
  };
  const start = batchStart;
  const associations = [];
  const estimates = Array.from({ length: 2 }, () =>
    Array.from({ length: 3 }, () => []),
  );
  el("repeat").disabled = true;
  el("study-results").innerHTML = "";
  try {
    for (let i = 0; i < 200; i++) {
      if (current !== runId) return;
      const result = arrowStrengthSimulation({ seed: start + i, ...settings });
      associations.push(result.zAssociation);
      result.fits.forEach((fit, adjustment) =>
        [3, 2, 4].forEach((index, method) =>
          estimates[adjustment][method].push(fit.values[index]),
        ),
      );
      if ((i + 1) % 10 === 0) {
        el("study-progress").textContent = `${i + 1} of 200 studies`;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    if (current !== runId) return;
    const association = studySummary(associations);
    const means = estimates.map((arm) =>
      arm.map((values) => studySummary(values).mean),
    );
    el("study-results").innerHTML = `
      <div class="study-association"><span>Mean regression of Y on Z</span><strong>${fmt(association.mean)}</strong><small>True total effect of Z: ${fmt(populationZEffect(settings))}</small></div>
      <table><caption>Mean treatment-effect estimate across 200 studies</caption><thead><tr><th scope="col">Estimate</th><th scope="col">C only</th><th scope="col">C + Z</th></tr></thead><tbody>${methods.map(([name], method) => `<tr><th scope="row">${name}</th><td>${fmt(means[0][method])}</td><td>${fmt(means[1][method])}</td></tr>`).join("")}</tbody></table>
      <p class="small">Seeds ${start}–${start + 199}. The mean association estimates the total effect of randomized Z, not its direct effect. Mean treatment-effect estimates should be compared with truth: 2.</p>`;
    el("study-progress").textContent = "200 studies complete.";
    batchStart += 200;
    el("repeat").textContent = "Run another 200 studies";
  } finally {
    if (current === runId) el("repeat").disabled = false;
  }
});

document.title = "How strong is a causal arrow? · Causal Sandbox";
if (new URLSearchParams(location.search).get("example") === "paths-cancel") {
  state.directEffect = cancellationDirectEffect(state.treatmentStrength);
}
render();
document.querySelector("h1").focus();
