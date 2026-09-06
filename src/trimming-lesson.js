import "./clipping-lesson.css";
import "./trimming-lesson.css";
import icon from "./brand.svg?raw";
import { trimmingSample, trimmingResult } from "./trimming-experiment.js";
import { effectComparison } from "./effect-comparison.js";
import { themeControl } from "./theme.js";

document.title = "Who remains after trimming? · Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="clipping-page trimming-page">
<main>
  <header>
    <a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}
  </header>
  <div class="eyebrow">Overlap · Trimming</div>
  <h1 tabindex="-1">Who remains after trimming?</h1>
  <p class="lede">
    Clipping changes weights while keeping everyone. Trimming removes people
    with extreme fitted treatment probabilities. Move the threshold and
    compare the people who remain.
  </p>
  <section class="experiment" aria-labelledby="experiment-title">
    <h2 id="experiment-title">Change overlap, then trim the sample</h2>
    <div class="controls">
      <div class="control">
        <label for="selection"><b>Treatment selection strength</b></label>
        <output id="selection-value" for="selection">3.0</output>
        <input
          id="selection"
          type="range"
          min="0"
          max="5"
          step="0.1"
          value="3"
          aria-describedby="selection-help"
        />
        <div class="ends">
          <span>0 · more overlap</span><span>5 · poorer overlap</span>
        </div>
        <p class="help" id="selection-help">
          Stronger selection makes the opposite treatment rarer for some
          baseline profiles.
        </p>
      </div>
      <div class="control">
        <label for="threshold"><b>Trimming threshold</b></label>
        <output id="threshold-value" for="threshold"
          >0.000 · keep everyone</output
        >
        <input
          id="threshold"
          type="range"
          min="0"
          max="0.5"
          step="0.001"
          value="0"
          aria-describedby="threshold-help"
        />
        <div class="ends">
          <span>0 · keep everyone</span><span>0.50 · only score 0.50</span>
        </div>
        <p class="help" id="threshold-help">
          Keep scores inside the displayed range, including its endpoints.
          The fitted scores and remaining weights stay fixed.
        </p>
      </div>
    </div>
    <details id="heterogeneous-example">
      <summary>What if treatment effects differ between people?</summary>
      <label class="effect-switch"><input type="checkbox" id="heterogeneous"> Let the treatment effect vary with baseline health</label>
      <p class="help">In this example, treatment helps people near the extremes of baseline health more. Trimming changes which effects enter the average. Treatment assignment and the sample’s baseline health stay fixed.</p>
    </details>
    <div class="comparison">
      <figure aria-labelledby="histogram-title">
        <figcaption id="histogram-title">
          Who falls outside the range?
        </figcaption>
        <div class="legend">
          <span><i class="swatch"></i>Untreated</span
          ><span><i class="swatch treated"></i>Treated</span
          ><span><i class="swatch excluded"></i>Hatched = excluded</span>
        </div>
        <svg
          id="histogram"
          viewBox="0 0 420 230"
          role="img"
          aria-label="Raw fitted propensity scores by treatment arm"
        >
          <defs>
            <pattern
              id="excluded-0"
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
            >
              <rect width="5" height="5" fill="var(--surface)" />
              <path d="M-1 1L1 -1M0 5L5 0M4 6L6 4" stroke="var(--arm-0)" />
            </pattern>
            <pattern
              id="excluded-1"
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
            >
              <rect width="5" height="5" fill="var(--surface)" />
              <path d="M-1 1L1 -1M0 5L5 0M4 6L6 4" stroke="var(--arm-1)" />
            </pattern>
          </defs>
          <text x="40" y="17">People in each original arm (%)</text>
          <g stroke="var(--grid)">
            <path d="M40 30H400 M40 105H400 M40 180H400" />
          </g>
          <g text-anchor="end">
            <text x="34" y="34">100</text>
            <text x="34" y="109">50</text>
            <text x="34" y="184">0</text>
          </g>
          <g id="histogram-bars"></g>
          <g
            id="trim-guides"
            stroke="var(--warning)"
            stroke-dasharray="4 3"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path id="lower-guide" d="M40 30V180" />
            <path id="upper-guide" d="M400 30V180" />
          </g>
          <text x="40" y="199">0</text>
          <text x="220" y="199" text-anchor="middle">0.5</text>
          <text x="400" y="199" text-anchor="end">1</text>
          <text x="220" y="223" text-anchor="middle">
            Fitted chance of treatment
          </text>
        </svg>
        <p class="help">
          Solid bars are retained; hatched portions are excluded. Dashed
          lines mark the bounds. Total bar heights stay fixed as you trim.
        </p>
      </figure>
      <div class="retained-result" aria-live="polite" aria-atomic="true">
        <h2>Effect among retained people</h2>
        <p id="retained-size"></p>
        <div class="values">
          <div class="value estimate" id="retained-estimate">
            <span>IPW estimate</span><strong id="retained-ipw"></strong
            ><small id="retained-error"></small>
          </div>
          <div class="value truth">
            <span>Retained-group truth</span
            ><strong id="retained-truth"></strong>
          </div>
        </div>
        <p class="help" id="retained-status"></p>
        <p class="help">
          <span id="effect-note"></span>
        </p>
        <p class="help">
          Redder estimates are farther from this group’s truth in this
          sample.
        </p>
      </div>
    </div>
    <div class="group-summary">
      <table aria-label="Everyone, retained and excluded groups">
        <caption>
          Compare each estimate with its own group’s truth
        </caption>
        <thead>
          <tr>
            <th scope="col">People</th>
            <th scope="col">Count</th>
            <th scope="col">IPW</th>
            <th scope="col">Group truth</th>
          </tr>
        </thead>
        <tbody id="groups"></tbody>
      </table>
      <p class="help">
        Counts show untreated / treated. Removing people does not improve
        information about those excluded, even when their estimate is
        calculable.
      </p>
      <p id="group-status" class="help"></p>
    </div>
    <div class="actions">
      <button id="redraw">Draw another sample</button
      ><button id="restart">Restart</button
      ><span class="sample" id="sample"></span>
    </div>
  </section>
  <p class="note">
    Trimming trades fewer extreme weights for fewer people. It can help or
    hurt accuracy; one sample cannot establish a better threshold.
  </p>
  <details id="estimand-details">
    <summary>What is being estimated?</summary>
    <p class="note">
      Each target is the average treatment effect among the people in that
      row. These are effects among the sample’s people, not estimates of a fixed
      population effect. With varying effects, trimming changes their average.
    </p>
    <p class="note">
      For each group, IPW subtracts the weighted untreated mean from the
      weighted treated mean, dividing each arm by its own weight sum. No
      probability clipping is applied. Both arms and finite weights are
      needed for an estimate.
    </p>
    <p class="note">
      There are 400 people and one measured common cause, baseline health C.
      The treatment model correctly adjusts for C. Moving the threshold
      reuses the full-sample fit. Changing selection or redrawing refits;
      redraw keeps the threshold, while restart restores the original sample
      and controls.
    </p>
    <p class="note">
      Simulation truth uses each person’s two potential outcomes. Those
      values are unavailable in real data and never enter the fitted model
      or trimming rule.
      <a href="https://github.com/kirilklein/causal-sandbox/blob/main/docs/trimming-experiment.md">Calculation and validation notes</a
      >.
    </p>
  </details>
<nav class="chapter-nav" aria-label="Chapter navigation"><a href="propensity-score-clipping-trimming/">← Probability clipping</a><a href="?lesson=instrument">Instruments and adjustment →</a><a href="?sandbox">Full sandbox ↗</a></nav>
</main>
</div>`;

const slider = document.querySelector("#threshold");
const selectionSlider = document.querySelector("#selection");
const heterogeneous = document.querySelector("#heterogeneous");
let seed = 4217;
let sample;
const labels = {
  everyone: "Everyone",
  retained: "Retained",
  excluded: "Excluded",
};
const number = (value) =>
  Number.isFinite(value) ? value.toFixed(2) : "Unavailable";

function update() {
  const threshold = Number(slider.value);
  for (const input of [slider, selectionSlider]) {
    input.style.setProperty(
      "--fill",
      `${(100 * (Number(input.value) - Number(input.min))) / (Number(input.max) - Number(input.min))}%`,
    );
  }
  document.querySelector("#effect-note").textContent = heterogeneous.checked
    ? "Effects vary with baseline health. Compare the retained group’s truth with everyone’s truth below."
    : "Treatment adds 2 to every person’s outcome, so every nonempty group has truth 2.";
  const result = trimmingResult(sample.rows, sample.effects, threshold);
  const range = `[${threshold.toFixed(3)}, ${(1 - threshold).toFixed(3)}]`;
  document.querySelector("#threshold-value").textContent =
    threshold === 0 ? "0.000 · keep everyone" : `Keep ${range}`;
  slider.setAttribute(
    "aria-valuetext",
    threshold === 0
      ? "No trimming; keep everyone"
      : `Keep scores from ${threshold.toFixed(3)} to ${(1 - threshold).toFixed(3)}, including endpoints`,
  );
  document
    .querySelector("#lower-guide")
    .setAttribute("d", `M${40 + 360 * threshold} 30V180`);
  document
    .querySelector("#upper-guide")
    .setAttribute("d", `M${400 - 360 * threshold} 30V180`);
  document.querySelector("#trim-guides").style.display =
    threshold === 0 ? "none" : "";
  const retained = result.groups.retained;
  const comparison = effectComparison(
    retained.ipw ?? NaN,
    retained.truth ?? NaN,
  );
  document.querySelector("#retained-size").textContent =
    `${retained.n} of ${sample.rows.length} people retained · ${result.groups.excluded.n} excluded`;
  document.querySelector("#retained-ipw").textContent = number(retained.ipw);
  document.querySelector("#retained-truth").textContent = number(
    retained.truth,
  );
  document.querySelector("#retained-error").textContent = retained.available
    ? comparison.difference
    : "";
  document
    .querySelector("#retained-estimate")
    .style.setProperty("--error-tint", `${comparison.tint}%`);
  document.querySelector("#retained-status").textContent =
    retained.reason ?? "";
  document.querySelector("#groups").innerHTML = Object.entries(result.groups)
    .map(
      ([key, group]) =>
        `<tr data-group="${key}"><th scope="row">${labels[key]}</th><td class="count"><span>${group.n}</span><small>${group.counts.join(" / ")}</small></td><td class="ipw">${number(group.ipw)}</td><td class="group-truth">${number(group.truth)}</td></tr>`,
    )
    .join("");
  document.querySelector("#group-status").textContent = Object.entries(
    result.groups,
  )
    .filter(([key, group]) => key !== "retained" && !group.available)
    .map(([key, group]) => `${labels[key]}: ${group.reason}`)
    .join(" ");

  const armLabels = ["Untreated", "Treated"];
  document.querySelector("#histogram-bars").innerHTML = result.histogram
    .map((arm, A) =>
      arm.retained
        .map((count, bin) => {
          const keptHeight = arm.count ? (150 * count) / arm.count : 0;
          const excludedCount = arm.excluded[bin];
          const excludedHeight = arm.count
            ? (150 * excludedCount) / arm.count
            : 0;
          const x = 42 + bin * 36 + A * 16;
          const title = `${armLabels[A]}, ${bin / 10} to ${(bin + 1) / 10}${bin === 9 ? " inclusive" : " (upper edge excluded)"}: ${count} retained, ${excludedCount} excluded`;
          return `<g data-arm="${A}" data-bin="${bin}" data-retained="${count}" data-excluded="${excludedCount}" data-count="${count + excludedCount}"><title>${title}</title><rect x="${x}" y="${180 - keptHeight}" width="14" height="${keptHeight}" fill="var(--arm-${A})"/><rect x="${x}" y="${180 - keptHeight - excludedHeight}" width="14" height="${excludedHeight}" fill="url(#excluded-${A})" stroke="var(--arm-${A})" stroke-width="${excludedCount ? 1 : 0}"/></g>`;
        })
        .join(""),
    )
    .join("");
  document
    .querySelector("#histogram")
    .setAttribute(
      "aria-label",
      `Raw fitted scores; retained range ${range}, inclusive. ` +
        result.histogram
          .map(
            (arm, A) =>
              `${armLabels[A]}: ${arm.count} people. ` +
              arm.retained
                .map(
                  (count, bin) =>
                    `${bin / 10} to ${(bin + 1) / 10}${bin === 9 ? " inclusive" : " upper edge excluded"}: ${count} retained, ${arm.excluded[bin]} excluded`,
                )
                .join("; "),
          )
          .join(". "),
    );
  document.querySelector("#sample").textContent =
    `${sample.rows.length} people · sample seed ${seed}`;
}

function draw() {
  const selection = Number(selectionSlider.value);
  document.querySelector("#selection-value").textContent = selection.toFixed(1);
  sample = trimmingSample({
    selection,
    seed,
    heterogeneous: heterogeneous.checked,
  });
  update();
}
slider.addEventListener("input", update);
heterogeneous.addEventListener("change", draw);
selectionSlider.addEventListener("input", draw);
document.querySelector("#redraw").addEventListener("click", () => {
  seed++;
  draw();
});
function restart() {
  seed = 4217;
  selectionSlider.value = "3";
  slider.value = "0";
  heterogeneous.checked = false;
  document.querySelectorAll(".trimming-page details").forEach((details) => {
    details.open = false;
  });
  draw();
}
document.querySelector("#restart").addEventListener("click", restart);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) restart();
});
draw();

document.querySelector("h1").focus();
