import { defaults, makeNoise, simulate, estimate } from "./simulation.js";
import { sandboxOverlap } from "./sandbox-overlap.js";
import { effectComparison } from "./effect-comparison.js";

export function setupOverlapExperiment(card) {
  const noise = makeNoise();
  card.innerHTML = `
    <div class="panel-heading"><div><h2 id="overlap-experiment-title">What happens when overlap gets worse?</h2></div><button id="overlap-restart" class="text-button">Restart experiment ↺</button></div>
    <p>This is a separate experiment. Both models adjust for C₁ and C₂, with no hidden confounding or post-treatment adjustment. The true effect stays at 2.</p>
    <div class="overlap-experiment-grid">
      <div><label class="slider-control"><span><b>Treatment selection strength</b><output id="overlap-strength-value">0.0</output></span><input id="overlap-strength" type="range" min="0" max="3" step="0.1" value="0" aria-describedby="overlap-strength-help"><small id="overlap-strength-help">Increase selection to make the opposite treatment rarer for some baseline profiles.</small></label>
      <div id="overlap-histogram"></div><p class="overlap-caption">Each pair of bars shows the percentage of its treatment arm in that probability range. Scores are fitted before clipping.</p></div>
      <div><div class="overlap-estimates" aria-label="Overlap experiment estimates"><div class="overlap-truth"><span>True effect</span><strong>2.00</strong><small>Fixed in this experiment</small></div>${[
        ["regression", "Outcome regression"],
        ["ipw", "IPW"],
        ["aipw", "AIPW"],
      ]
        .map(
          ([key, label]) =>
            `<div><span>${label}</span><strong id="overlap-${key}"></strong><small id="overlap-${key}-error"></small></div>`,
        )
        .join("")}</div>
      <p>Compare each estimate with truth in this sample. Stronger selection can concentrate weights; it need not move every estimate farther from truth.</p>
      <details id="overlap-weight-details"><summary>Weight diagnostics</summary><table><caption>Clipped weights, by treatment arm</caption><thead><tr><th scope="col">Diagnostic</th><th scope="col">Untreated</th><th scope="col">Treated</th></tr></thead><tbody id="overlap-weight-summary"></tbody></table><p>Effective sample size (ESS) describes weight concentration, not retained people or a precision guarantee. Probabilities are clipped to [0.02, 0.98]; clipping cannot supply missing comparisons.</p></details>
      </div>
    </div>
    <details class="overlap-assumptions"><summary>What stays fixed?</summary><p>The additive world, both correctly specified models, C₁ → Y and C₂ → Y, and the background draws for 2,400 people (seed 4217) stay fixed. Only treatment selection changes. Main sandbox controls do not affect this card.</p><p>A fitted-score plot depends on the treatment model. It cannot prove adequate overlap or the absence of unmeasured confounding. <a href="https://miguelhernan.org/whatifbook">Read more: Causal Inference: What If</a>.</p></details>`;
  const slider = card.querySelector("#overlap-strength");
  function update() {
    const strength = Number(slider.value);
    const data = simulate({ ...defaults, ca: strength, am: 0, my: 0 }, noise);
    const result = estimate(data, ["C"]);
    const arms = sandboxOverlap(data, result);
    card.querySelector("#overlap-strength-value").textContent =
      strength.toFixed(1);
    slider.style.setProperty("--fill", `${(strength / 3) * 100}%`);
    for (const [key, value] of [
      ["regression", result.values[2]],
      ["ipw", result.values[3]],
      ["aipw", result.values[4]],
    ]) {
      const comparison = effectComparison(value, 2);
      card.querySelector(`#overlap-${key}`).textContent = comparison.value;
      card
        .querySelector(`#overlap-${key}`)
        .parentElement.style.setProperty("--error-tint", `${comparison.tint}%`);
      card.querySelector(`#overlap-${key}-error`).textContent =
        comparison.difference;
    }
    const labels = ["Untreated", "Treated"];
    const percent = (count, total) =>
      total ? `${((100 * count) / total).toFixed(1)}%` : "Unavailable";
    const summaries = arms.map(
      (arm, a) =>
        `${labels[a]}: ${arm.bins.map((count, i) => `${i / 10} to ${(i + 1) / 10}${i === 9 ? " inclusive" : " exclusive"}: ${count} people (${percent(count, arm.count)} of this arm)`).join("; ")}`,
    );
    const bars = arms
      .map(
        (arm, a) =>
          `<g data-arm="${a}" aria-label="${summaries[a]}">${arm.bins
            .map((count, i) => {
              const height = arm.count ? (110 * count) / arm.count : 0;
              return `<rect x="${41 + i * 27 + a * 12}" y="${135 - height}" width="10" height="${height}" fill="var(--arm-${a})" ${a === 0 ? 'fill-opacity="0.18" stroke="var(--arm-0)" stroke-width="1"' : ""}><title>${labels[a]}, ${i / 10}–${(i + 1) / 10}: ${count} people (${percent(count, arm.count)})</title></rect>`;
            })
            .join("")}</g>`,
      )
      .join("");
    card.querySelector("#overlap-histogram").innerHTML =
      `<figure><figcaption class="overlap-legend">${labels.map((label, a) => `<span><i class="overlap-arm-${a}"></i>${label} · A = ${a}</span>`).join("")}</figcaption><svg viewBox="0 0 320 185" role="img" aria-label="Fitted treatment probabilities before clipping. ${summaries.join(". ")}"><text x="40" y="16">People in each arm (%)</text>${[0, 50, 100].map((v) => `<path d="M40 ${135 - v * 1.1}H310" stroke="var(--grid)"/><text x="34" y="${139 - v * 1.1}" text-anchor="end">${v}</text>`).join("")}${bars}<text x="40" y="153">0</text><text x="175" y="153" text-anchor="middle">0.5</text><text x="310" y="153" text-anchor="end">1</text><text x="175" y="176" text-anchor="middle">Fitted treatment probability</text></svg></figure>`;
    const rows = [
      ["People", (arm) => arm.count.toLocaleString("en-US")],
      [
        "Clipped probabilities",
        (arm) => `${arm.clipped} (${percent(arm.clipped, arm.count)})`,
      ],
      [
        "Effective sample size",
        (arm) => (arm.ess === null ? "Unavailable" : arm.ess.toFixed(0)),
      ],
    ];
    card.querySelector("#overlap-weight-summary").innerHTML = rows
      .map(
        ([label, value]) =>
          `<tr><th scope="row">${label}</th>${arms.map((arm) => `<td>${value(arm)}</td>`).join("")}</tr>`,
      )
      .join("");
  }
  slider.addEventListener("input", update);
  card.querySelector("#overlap-restart").addEventListener("click", () => {
    slider.value = "0";
    update();
  });
  update();
}
