import { targetContinuousAte } from "./tmle.js";

const average = (values) =>
  values.reduce((sum, v) => sum + v, 0) / values.length;
const number = (value) =>
  Math.abs(value) < 0.0005 ? "0.000" : value.toFixed(3);
const math = (body, label) =>
  `<math display="block" aria-label="${label}">${body}</math>`;
const prediction = (star = false) =>
  `<msub${star ? "sup" : ""}><mi>m</mi><mi>a</mi>${star ? "<mo>*</mo>" : ""}</msub${star ? "sup" : ""}><mo>(</mo><msub><mi>C</mi><mi>i</mi></msub><mo>)</mo>`;

export function tmlePath(rows, fraction) {
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1)
    throw new RangeError("Targeting progress must be between 0 and 1");
  const target = targetContinuousAte(rows, {
    m0: rows.map((row) => row.m0),
    m1: rows.map((row) => row.m1),
    propensities: rows.map((row) => row.p),
  });
  if (target.status !== "ok") return target;
  const current0 = rows.map(
    (row, i) => row.m0 + fraction * (target.m0[i] - row.m0),
  );
  const current1 = rows.map(
    (row, i) => row.m1 + fraction * (target.m1[i] - row.m1),
  );
  return {
    ...target,
    current0,
    current1,
    currentEstimate: average(current1.map((q1, i) => q1 - current0[i])),
    correction: average(
      rows.map(
        (row, i) =>
          target.cleverCovariate[i] *
          (row.Y - (row.A ? current1[i] : current0[i])),
      ),
    ),
  };
}

function tmleControls() {
  return `<label for="targeting-progress">Apply the fitted update <output id="targeting-output">0%</output></label>
    <input id="targeting-progress" type="range" min="0" max="100" step="1" value="0" aria-describedby="targeting-help">
    <div class="tmle-control-row"><span id="targeting-help" class="sample-note">0%: original predictions · 100%: TMLE</span><button id="apply-targeting">Apply full update</button></div>`;
}

export function tmlePanel() {
  return `<section class="tmle-diagnostics" aria-labelledby="tmle-correction-title">
    <h3 id="tmle-correction-title">The correction left to make</h3>
    <div class="tmle-correction-readout" aria-live="polite" aria-atomic="true"><span>Before <strong id="tmle-before-correction"></strong></span><span aria-hidden="true">→</span><span>Now <strong id="tmle-current-correction"></strong></span></div>
    <p class="sample-note">Average signed, propensity-weighted prediction error, in outcome units. Full targeting brings this to zero.</p>
    <p id="tmle-status" role="status"></p>
    <section class="tmle-curve-panel" aria-labelledby="tmle-prediction-title">
    <h3 id="tmle-prediction-title">How the predictions change</h3>
    <div class="lesson-controls">${tmleControls()}</div>
    <div class="tmle-legend"><span><i class="tmle-key-before"></i>Before targeting</span><span><i class="tmle-key-current"></i>Current predictions</span></div>
    <div id="tmle-predictions" class="tmle-predictions"></div>
    <p class="sample-note">Each panel predicts outcomes assuming everyone receives the treatment shown. Here, p is the fitted chance of treatment. Observed prediction errors set the update's direction; treatment probabilities shape the bends. Targeting aims at the average effect; individual predictions need not improve.</p>
    </section>
  </section>`;
}

export function tmleFormula() {
  return `<details class="tmle-formula-details"><summary>How does targeting work?</summary>
    <p>TMLE fits an update to the outcome predictions, then averages their treated-minus-untreated differences.</p>
    <div class="tmle-formula" role="group" aria-label="Targeted prediction equals initial prediction plus the fitted update amount times the targeting direction">
      <div class="tmle-formula-start"><div class="tmle-targeted">${math(prediction(true), "Targeted prediction for treatment a at person i's baseline health")}<span>Targeted prediction</span></div><span class="tmle-operator">=</span></div>
      <div class="tmle-formula-parts"><div class="tmle-initial">${math(prediction(), "Initial fitted prediction for treatment a at person i's baseline health")}<span>Initial prediction</span></div><span class="tmle-operator">+</span><div class="tmle-update"><div><span class="tmle-amount">${math("<mover><mi>ε</mi><mo>^</mo></mover>", "epsilon hat, the fitted update amount")}</span><span aria-label="times">×</span><span class="tmle-direction">${math("<mi>H</mi><mo>(</mo><mi>a</mi><mo>,</mo><msub><mi>C</mi><mi>i</mi></msub><mo>)</mo>", "H of treatment a and baseline health C i, the targeting direction")}</span></div><span>Targeted update</span></div></div>
    </div>
    <div class="tmle-definitions">
      <section class="tmle-initial"><h3>Initial prediction · m</h3><p>What the outcome model predicts for each person under treatment a: 1 for treated, 0 for untreated.</p></section>
      <section class="tmle-direction"><h3>Targeting direction · H</h3>
        ${math("<mi>H</mi><mo>(</mo><mi>a</mi><mo>,</mo><msub><mi>C</mi><mi>i</mi></msub><mo>)</mo><mo>=</mo><mfrac><mi>a</mi><msub><mi>p</mi><mi>i</mi></msub></mfrac><mo>−</mo><mfrac><mrow><mn>1</mn><mo>−</mo><mi>a</mi></mrow><mrow><mn>1</mn><mo>−</mo><msub><mi>p</mi><mi>i</mi></msub></mrow></mfrac>", "H equals a divided by p i minus one minus a divided by one minus p i")}
        <p>The familiar inverse-probability weight, positive for the treated prediction and negative for the untreated prediction. p is the fitted chance of treatment.</p></section>
      <section class="tmle-amount"><h3>Fitted amount · ε</h3><p>One value, fitted using observed outcomes to minimize squared prediction errors along H. The slider applies a fraction of this fitted update.</p><p>Full fitted ε: <strong id="tmle-epsilon"></strong></p></section>
      <section class="tmle-targeted"><h3>Targeted prediction · m*</h3><p>The updated outcome prediction. Average m₁* − m₀* over all people to get the TMLE estimate.</p></section>
    </div>
    <details class="tmle-influence"><summary>Why this direction? The influence function</summary>
      <p>For an average treatment effect, the influence function combines two pieces: a signed weighted prediction error, and the person's predicted treatment contrast minus the overall estimate.</p>
      <div class="tmle-influence-formula" role="group" aria-label="Influence function equals weighted prediction error plus targeted contrast minus the overall estimate">
        ${math("<mi>D</mi><mo>=</mo><mi>H</mi><mo>(</mo><mi>Y</mi><mo>−</mo><msubsup><mi>m</mi><mi>A</mi><mo>*</mo></msubsup><mo>)</mo>", "D equals the signed weighted prediction error")}
        ${math("<mo>+</mo><mo>(</mo><msubsup><mi>m</mi><mn>1</mn><mo>*</mo></msubsup><mo>−</mo><msubsup><mi>m</mi><mn>0</mn><mo>*</mo></msubsup><mo>−</mo><mover><mi>τ</mi><mo>^</mo></mover><mo>)</mo>", "plus targeted treatment contrast minus the overall estimate")}
      </div>
      <p>The contrasts minus their average already sum to zero. Fitting ε makes the average weighted error zero too. That is why we update in direction H; H alone is not the influence function. Baseline-health arguments are omitted in this expression.</p>
    </details>
    <details><summary>Inspect this sample</summary><div id="tmle-sample-values"></div></details>
    <details><summary>Assumptions and clipping</summary><p>This continuous-outcome version uses a linear update with squared-error loss. Its predictions can leave the observed outcome range. Treatment probabilities are clipped to [0.02, 0.98], matching IPW and AIPW; clipping can introduce bias. A zero correction does not establish that the models or causal assumptions are correct. Targeting cannot recover missing confounders or absent treatment comparisons.</p><p>AIPW adds the initial weighted correction to the initial regression estimate. TMLE updates predictions first, so the two estimates can differ in a finite sample. No confidence intervals are shown.</p><p><a href="https://escholarship.org/content/qt1849174p/qt1849174p.pdf#page=40">Read more: targeted estimation of an average treatment effect</a></p></details>
  </details>`;
}

export function tmleCurveExplanation(rows, view, arm) {
  if (Math.abs(view.epsilon) < 1e-12)
    return "The fitted update is effectively zero, so this curve stays on the original regression.";
  const rarest = view.propensities.reduce(
    (best, p, i, probabilities) =>
      (arm ? p < probabilities[best] : p > probabilities[best]) ? i : best,
    0,
  );
  const direction =
    (arm ? view.epsilon : -view.epsilon) > 0 ? "raises" : "lowers";
  const baseline = Number(rows[rarest].C.toFixed(1));
  return `The fitted update ${direction} this curve most near C = ${baseline}, where ${arm ? "treated" : "untreated"} people are least likely. The factor ${arm ? "1 / p" : "1 / (1 − p)"} amplifies the update there.`;
}

function predictionPlots(rows, view) {
  const order = rows.map((_, i) => i).sort((a, b) => rows[a].C - rows[b].C);
  const lowC = rows[order[0]].C,
    highC = rows[order.at(-1)].C;
  const values = rows.flatMap((row, i) => [
    row.m0,
    row.m1,
    view.m0[i],
    view.m1[i],
  ]);
  const min = Math.min(...values),
    max = Math.max(...values),
    pad = Math.max(0.5, (max - min) * 0.08);
  const low = min - pad,
    high = max + pad;
  const x = (c) => 60 + ((c - lowC) / (highC - lowC || 1)) * 258;
  const y = (q) => 156 - ((q - low) / (high - low)) * 132;
  // Draw a subset of actual fitted rows, retaining both extremes. Axes use all rows.
  const indices = Array.from(
    { length: Math.min(81, rows.length) },
    (_, i) =>
      order[
        Math.round((i * (rows.length - 1)) / (Math.min(81, rows.length) - 1))
      ],
  );
  return [0, 1]
    .map((arm) => {
      const before = rows.map((row) => row[`m${arm}`]),
        current = view[`current${arm}`];
      const path = (predictions) =>
        indices
          .map(
            (i, j) =>
              `${j ? "L" : "M"}${x(rows[i].C).toFixed(2)},${y(predictions[i]).toFixed(2)}`,
          )
          .join(" ");
      const title = arm ? "With treatment" : "Without treatment";
      return `<figure><figcaption>${title}</figcaption><svg viewBox="0 0 336 207" role="img" aria-label="${title}: predicted outcome by baseline health. Dashed line is before targeting; solid line is the current prediction.">
      <text transform="translate(14 90) rotate(-90)" text-anchor="middle">Predicted outcome</text>
      ${[low, (low + high) / 2, high].map((q) => `<path d="M60 ${y(q)}H318" stroke="var(--grid)"/><path d="M55 ${y(q)}H60" stroke="var(--text-muted)"/><text x="52" y="${y(q) + 4}" text-anchor="end">${q.toFixed(1)}</text>`).join("")}
      <path class="tmle-y-axis" d="M60 24V156H318" fill="none" stroke="var(--text-muted)"/>
      <path data-tmle-curve="before" d="${path(before)}" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-dasharray="6 4"/>
      <path data-tmle-curve="current" d="${path(current)}" fill="none" stroke="var(--arm-${arm})" stroke-width="2.5"/>
      ${[lowC, (lowC + highC) / 2, highC].map((c) => `<text x="${x(c)}" y="179" text-anchor="middle">${c.toFixed(1)}</text>`).join("")}
      <text x="189" y="201" text-anchor="middle">Baseline health (C)</text>
    </svg><p class="sample-note tmle-curve-explanation">${tmleCurveExplanation(rows, view, arm)}</p></figure>`;
    })
    .join("");
}

export function renderTmle(rows, fraction, clipped) {
  const view = tmlePath(rows, fraction);
  const available = view.status === "ok";
  document.querySelector("#targeting-progress").disabled = !available;
  document.querySelector("#apply-targeting").disabled =
    !available || fraction === 1;
  document.querySelector("#targeting-output").textContent =
    `${Math.round(100 * fraction)}%`;
  document.querySelector("#tmle-estimate-label").textContent =
    fraction === 1 ? "TMLE estimate" : "Current prediction contrast";
  for (const [id, value] of [
    ["tmle-before-correction", view.correctionBefore],
    ["tmle-current-correction", view.correction],
    ["tmle-epsilon", view.epsilon],
  ])
    document.getElementById(id).textContent = available
      ? number(value)
      : "Unavailable";
  document.querySelector("#tmle-status").textContent = !available
    ? "Targeting is unavailable for this sample. Redraw to try another sample."
    : fraction === 1
      ? "Targeting complete: the average weighted error is zero, up to numerical rounding. This does not guarantee an unbiased estimate."
      : "Move toward 100% to remove the aggregate correction. Intermediate positions show the update in progress, not the final TMLE estimate.";
  document.querySelector("#tmle-predictions").innerHTML = available
    ? predictionPlots(rows, view)
    : "";
  document.querySelector("#tmle-sample-values").innerHTML = available
    ? `<p>First untreated and treated person. Predictions below use the treatment actually received; the effect averages both predicted outcomes over all ${rows.length.toLocaleString("en-US")} people. Values are rounded.</p><table><caption>Observed outcomes and fitted predictions</caption><thead><tr><th scope="col">Person</th><th scope="col">Observed Y</th><th scope="col">Before</th><th scope="col">Now</th></tr></thead><tbody>${[
        0, 1,
      ]
        .map((arm) => {
          const i = rows.findIndex((row) => row.A === arm);
          return `<tr><th scope="row">${rows[i].person} · ${arm ? "treated" : "untreated"}</th><td>${number(rows[i].Y)}</td><td>${number(rows[i][`m${arm}`])}</td><td>${number(view[`current${arm}`][i])}</td></tr>`;
        })
        .join(
          "",
        )}</tbody></table><p>${clipped} fitted probabilities clipped. Full TMLE estimate: ${number(view.estimate)}.</p>`
    : "<p>Finite predictions and both treatment groups are required.</p>";
  return view;
}
