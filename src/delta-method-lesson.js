import "./instrument-lesson.css";
import "./delta-method.css";
import { themeControl } from "./theme.js";
import icon from "./brand.svg?raw";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { capture } from "./events.js";
import {
  orderRatioApproximation,
  jointRatioApproximation,
  ratioBaseline,
  ratioStudy,
  ratioTruth,
  deltaRatioDifference,
  bootstrapRatioDifference,
} from "./delta-method.js";
import {
  transformationPlots,
  jointUncertaintyPlot,
  intervalComparison,
  coveragePlot,
  number,
} from "./delta-method-view.js";

document.title = "How uncertain is revenue per order? — Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page dm-page">
  <header class="lesson-header"><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main class="learning">
    ${lessonNavigation({ currentOptional: "delta-method" })}
    <p class="eyebrow">OPTIONAL · AFTER UNCERTAINTY</p>
    <h1 tabindex="-1">How uncertain is revenue per order?</h1>
    <p class="intro">Follow uncertainty through a curve, then use its slope to approximate the spread.</p>
    <p class="small dm-credit">Visual explanation inspired by <a href="https://www.linkedin.com/posts/aabugaev_statistics-abtesting-datascience-activity-7503052275343552512-tKCT">Anton Bugaev’s Delta Method visualization</a>. An independent interactive adaptation.</p>
    <details id="dm-setting" class="panel"><summary>Why this matters in an A/B test</summary>
      <h2 id="dm-setting-title">A new checkout looks better</h2>
      <p>An online shop randomly assigns visitors to its current checkout (A) or a new version (B). It compares total revenue divided by total orders.</p>
      <p class="small">Illustrative result</p>
      <div class="dm-readout" aria-label="Illustrative A/B test: current checkout 10 euros per order, new checkout 12 euros per order, observed difference plus 2 euros per order">
        <div><span>Current checkout · A</span><strong>€10 / order</strong></div>
        <div><span>New checkout · B</span><strong>€12 / order</strong></div>
        <div><span>Observed difference</span><strong>+€2 / order</strong></div>
      </div>
      <p>Is that gain estimated precisely, or is the study still compatible with no improvement? A confidence interval helps us assess the uncertainty around the difference.</p>
      <p>Both revenue and order counts vary from sample to sample. Their ratio’s uncertainty depends on both, including how they vary together.</p>
      <p><strong>The Delta Method gives a fast approximate standard error for a ratio or another smooth transformation.</strong> We can use it to build a confidence interval without repeatedly resampling the data.</p>
      <p class="small">First, see how a curve changes uncertainty. Then simulate this checkout comparison and check Delta intervals against a bootstrap.</p>
    </details>
    <section class="panel" aria-labelledby="dm-curve-title">
      <h2 id="dm-curve-title">1. Start with one estimate</h2>
      <p>To isolate the uncertainty from orders, hold average revenue at <strong>€20 per visitor</strong>. Revenue per order is the ratio of these two averages, just as it is the ratio of the totals.</p>
      <div class="dm-formula" role="math" aria-label="Revenue per order equals 20 euros per visitor divided by average orders per visitor, so y equals 20 divided by x">
        <math aria-hidden="true"><mi>y</mi><mo>=</mo><mfrac><mn>20</mn><mi>x</mi></mfrac></math>
      </div>
      <p><strong>Horizontal axis:</strong> estimated average orders per visitor. <strong>Vertical axis:</strong> revenue per order in euros. At 2 orders per visitor, the ratio is €10 per order.</p>
      <p id="dm-distribution-caption" class="small" hidden>The bell below the curve illustrates how the estimated average order count varies across repeated studies. Each study supplies one estimate; this is not the distribution of individual visitors’ orders.</p>
      <div id="dm-point-control"><label for="dm-point">Move one estimate: <output id="dm-point-value"></output></label><input id="dm-point" type="range" min="1.25" max="2.75" step="0.05" value="2"></div>
      <div id="dm-preview" class="dm-plots dm-unrevealed"></div>
      <button id="dm-distribution" class="primary">What if the estimate varies? →</button>
      <fieldset id="dm-prediction" hidden><legend>Across studies, what shape will revenue per order have?</legend>
        <label><input type="radio" name="shape" value="symmetric"> Still symmetric</label>
        <label><input type="radio" name="shape" value="skewed"> Stretched toward larger values</label>
        <label><input type="radio" name="shape" value="narrow"> Always narrower</label>
      </fieldset>
      <button id="dm-reveal" class="primary" hidden disabled>Send the distribution through →</button>
      <p id="dm-feedback" role="status"></p>
      <div id="dm-explore" hidden>
        <h3 id="dm-explore-title" tabindex="-1">3. A curve changes the shape</h3>
        <p id="dm-explore-copy">Equal changes in order estimates produce unequal changes in revenue per order. Follow the dotted guides: the smaller denominator has the larger effect.</p>
        <div id="dm-curve-controls" class="dm-controls">
          <div><label for="dm-mean">Average orders / visitor <output id="dm-mean-value"></output></label><input id="dm-mean" type="range" min="1.5" max="3" step="0.1" value="2"></div>
          <div><label for="dm-sd">Uncertainty in orders (SE) <output id="dm-sd-value"></output></label><input id="dm-sd" type="range" min="0.1" max="0.45" step="0.05" value="0.25"></div>
        </div>
        <div class="dm-legend"><span>━ Ratio curve / actual distribution</span><span id="dm-tangent-legend" hidden>┄ Tangent / linear approximation</span></div>
        <div id="dm-plots" class="dm-plots"></div>
        <button id="dm-tangent" class="primary">Approximate with a tangent →</button>
        <div id="dm-tangent-details" hidden>
        <p>The tangent matches the curve’s value and slope at the center. It preserves the input’s symmetric shape. With an approximately normal input, this gives an approximately normal output.</p>
        <div id="dm-spread" class="dm-readout" aria-live="polite"></div>
        <p class="small">Dotted guides map the center and one standard error (SE) on either side. SE is the spread of estimates across studies. Axes rescale; the SE readout retains its units.</p>
        <details id="dm-slope"><summary>Why does the slope determine uncertainty?</summary>
          <p>At 2 orders per visitor, the slope is −5: an increase of 0.1 orders per visitor lowers the ratio by about €0.50 per order. Uncertainty scales by the slope’s magnitude:</p>
          <div class="dm-formula" role="math" aria-label="Output standard deviation is approximately the absolute slope times input standard deviation">
            <math aria-hidden="true"><msub><mi>σ</mi><mtext>output</mtext></msub><mo>≈</mo><mo>|</mo><msup><mi>g</mi><mo>′</mo></msup><mo>(</mo><mi>μ</mi><mo>)</mo><mo>|</mo><mo>×</mo><msub><mi>σ</mi><mtext>input</mtext></msub></math>
          </div>
          <p>Here <math><mi>μ</mi></math> is the input center and <math><msup><mi>g</mi><mo>′</mo></msup><mo>(</mo><mi>μ</mi><mo>)</mo></math> is the slope there. This works when the curve is nearly straight across the input’s spread.</p>
        </details>
        <div class="actions"><button id="dm-to-ratios" class="primary">Let revenue vary too →</button></div>
        </div>
      </div>
    </section>
    <section id="dm-joint" class="panel" hidden aria-labelledby="dm-joint-title">
      <h2 id="dm-joint-title" tabindex="-1">5. Two inputs can move together</h2>
      <p>Now let revenue vary too. Each point is a pair of estimates from one possible study: average orders and average revenue per visitor.</p>
      <p>More revenue raises revenue per order; more orders lowers it. If they rise together in the same proportion, the ratio barely changes.</p>
      <label for="dm-correlation">How strongly do the estimates move together? <output id="dm-correlation-value"></output></label>
      <input id="dm-correlation" type="range" min="-0.9" max="0.9" step="0.1" value="0">
      <div id="dm-joint-plot"></div>
      <p id="dm-joint-readout" class="dm-readout" aria-live="polite"></p>
      <p class="small">Illustrative uncertainty contour, not observed data or a confidence region. The center stays at 2 orders and €20 per visitor; input SEs stay at 0.2 orders and €2. Only correlation changes. Lines connect pairs with the same revenue per order.</p>
      <p>The multivariable Delta Method uses a tangent plane: one slope for revenue, one for orders, and their covariance to combine the uncertainty.</p>
      <button id="dm-to-experiment" class="primary">Compare two checkout versions →</button>
    </section>
    <section id="dm-ratios" class="panel" aria-labelledby="dm-ratio-title" hidden>
      <h2 id="dm-ratio-title" tabindex="-1">6. Put an interval around the checkout difference</h2>
      <p>We held revenue fixed to see what orders alone do. In a real checkout experiment, both vary together. Now simulate both inputs in each arm, then compare B’s revenue per order with A’s.</p>
      <p>Revenue per order has two uncertain inputs. In each arm of an A/B test, estimate it using:</p>
      <div class="dm-formula" role="math" aria-label="Estimated revenue per order equals total revenue divided by total orders">
        <math aria-hidden="true"><mover><mi>r</mi><mo>^</mo></mover><mo>=</mo><mfrac><mtext>Total revenue</mtext><mtext>Total orders</mtext></mfrac></math>
      </div>
      <p>Compare B’s ratio with A’s. Change the study settings, or draw a new study with the same settings.</p>
      <div class="dm-controls">
        <div><label for="dm-n">Users per arm</label><select id="dm-n"><option value="40">40</option><option value="200" selected>200</option><option value="800">800</option></select></div>
        <div><label for="dm-active">Chance a user orders</label><select id="dm-active"><option value="0.8">80% · many buyers</option><option value="0.08">8% · sparse orders</option></select></div>
        <div><label for="dm-skew">User spending variation</label><select id="dm-skew"><option value="0.5">Moderate</option><option value="1.3">Strong right skew</option></select></div>
        <div><label for="dm-association">Order–spend relationship</label><select id="dm-association"><option value="0">Same mean spend per order</option><option value="2">Frequent buyers spend more per order</option></select></div>
      </div>
      <div class="actions"><button id="dm-redraw">Draw a new study</button></div>
      <p id="dm-sample" class="small"></p>
      <details id="dm-covariance"><summary>Two inputs: why covariance matters</summary>
        <p>More revenue raises the ratio. More orders lowers it if revenue stays fixed. When both move together, these contributions can offset one another.</p>
        <div class="dm-formula" role="math" aria-label="Estimated variance of the ratio is approximately revenue variance divided by n times squared mean orders, plus squared ratio times order variance divided by n times squared mean orders, minus twice the ratio times revenue-order covariance divided by n times squared mean orders">
          <math aria-hidden="true"><mover><mi mathvariant="normal">Var</mi><mo>^</mo></mover><mo>(</mo><mover><mi>r</mi><mo>^</mo></mover><mo>)</mo><mo>≈</mo><mfrac><msubsup><mi>s</mi><mi>X</mi><mn>2</mn></msubsup><mrow><mi>n</mi><msup><mover><mi>Y</mi><mo>¯</mo></mover><mn>2</mn></msup></mrow></mfrac></math>
          <math aria-hidden="true"><mo>+</mo><mfrac><mrow><msup><mover><mi>r</mi><mo>^</mo></mover><mn>2</mn></msup><msubsup><mi>s</mi><mi>Y</mi><mn>2</mn></msubsup></mrow><mrow><mi>n</mi><msup><mover><mi>Y</mi><mo>¯</mo></mover><mn>2</mn></msup></mrow></mfrac></math>
          <math aria-hidden="true"><mo>−</mo><mfrac><mrow><mn>2</mn><mover><mi>r</mi><mo>^</mo></mover><msub><mi>s</mi><mrow><mi>X</mi><mi>Y</mi></mrow></msub></mrow><mrow><mi>n</mi><msup><mover><mi>Y</mi><mo>¯</mo></mover><mn>2</mn></msup></mrow></mfrac></math>
        </div>
        <p><math><mi>X</mi></math> is user revenue, <math><mi>Y</mi></math> is orders, and <math><mi>n</mi></math> is users per arm. The bars denote sample means. <math><msubsup><mi>s</mi><mi>X</mi><mn>2</mn></msubsup></math> and <math><msubsup><mi>s</mi><mi>Y</mi><mn>2</mn></msubsup></math> are sample variances; <math><msub><mi>s</mi><mrow><mi>X</mi><mi>Y</mi></mrow></msub></math> is their sample covariance.</p>
        <p>Even with constant mean spend per order, more orders usually means more revenue. The order–spend control changes that relationship further. Independent arms let us add their ratio variances for the B − A difference.</p>
      </details>
      <h3>Compare the Delta interval with a bootstrap</h3>
      <p>Delta uses the tangent approximation. The bootstrap resamples whole users within each arm, keeping revenue and orders paired, and recalculates both ratios 499 times.</p>
      <div class="actions"><button id="dm-bootstrap" class="primary">Compare with bootstrap</button></div>
      <div id="dm-intervals"></div>
      <div id="dm-interval-values" class="dm-interval-values" aria-live="polite"></div>
      <p class="small">These are nominal 95% intervals for B − A, in revenue units per order. Similar intervals in one study do not establish correct coverage.</p>
      <details id="dm-bootstrap-details"><summary>How are these intervals calculated?</summary>
        <p>The Delta interval uses the estimated standard error of the ratio difference:</p>
        <div class="dm-formula" role="math" aria-label="95 percent interval equals estimated difference plus or minus 1.96 times its standard error">
          <math aria-hidden="true"><mtext>95% CI</mtext><mo>=</mo><mover><mi>Δ</mi><mo>^</mo></mover><mo>±</mo><mn>1.96</mn><mo>×</mo><mi mathvariant="normal">SE</mi><mo>(</mo><mover><mi>Δ</mi><mo>^</mo></mover><mo>)</mo></math>
        </div>
        <p>The percentile bootstrap uses the 2.5th and 97.5th percentiles of the resampled differences. Both methods estimate ratios of totals, not averages of individual ratios.</p>
        <p>If an arm has no orders, its ratio is undefined. This demonstration reports an unavailable bootstrap interval if any resample has that problem, rather than dropping those resamples. Bootstrap does not automatically repair sparse data or unstable denominators.</p>
        <p><a href="?lesson=uncertainty#bootstrap">Explore the bootstrap introduction →</a></p>
      </details>
      <h3>Check coverage across fresh studies</h3>
      <p>Repeat the entire experiment. How often does each interval contain the simulator’s true difference of +2?</p>
      <div class="actions"><button id="dm-repeat" class="primary">Check coverage in 100 fresh studies</button><button id="dm-cancel" hidden>Stop</button></div>
      <p id="dm-progress" role="status"></p>
      <div id="dm-coverage" hidden>
        <p class="small">Each row is a fresh study with its own interval. Matching rows use the same study for both methods.</p>
        <div class="dm-plots"><div><h3>Delta normal</h3><p id="dm-delta-summary"></p><div id="dm-delta-coverage"></div></div><div><h3>Bootstrap percentile</h3><p id="dm-bootstrap-summary"></p><div id="dm-bootstrap-coverage"></div></div></div>
        <p class="small">Solid: contains truth · dashed: misses truth · ×: unavailable · arrows: outside axis. Counts include all attempted studies; unavailable intervals cannot count as containing truth.</p>
        <p>Coverage means how often the procedure’s interval contains the fixed true effect across fresh studies. It is not a probability assigned to this one interval.</p>
        <p class="small">A batch of 100 gives a noisy coverage estimate (about 2 percentage points of Monte Carlo SE near 95%). Each bootstrap interval also has simulation noise from its 499 resamples. More resamples add no new users and do not repair a wrong resampling scheme.</p>
      </div>
      <details><summary>Check your interpretation</summary>
        <p>Both intervals agree in one small study with sparse orders. What can you conclude?</p>
        <div class="actions"><button data-dm-answer="guarantee">Both methods have 95% coverage</button><button data-dm-answer="investigate">Agreement alone cannot establish coverage</button></div>
        <p id="dm-check-feedback" role="status"></p>
      </details>
    </section>
    <details id="dm-model"><summary>Simulation assumptions and references</summary>
      <h3>The curve and its tangent</h3>
      <div class="dm-formula" role="math" aria-label="g of x is approximately g of mu plus g prime of mu times x minus mu">
        <math aria-hidden="true"><mi>g</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>≈</mo><mi>g</mi><mo>(</mo><mi>μ</mi><mo>)</mo></math>
        <math aria-hidden="true"><mo>+</mo><msup><mi>g</mi><mo>′</mo></msup><mo>(</mo><mi>μ</mi><mo>)</mo><mo>(</mo><mi>x</mi><mo>−</mo><mi>μ</mi><mo>)</mo></math>
      </div>
      <p>For <math><mi>g</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mfrac><mn>20</mn><mi>x</mi></mfrac></math>, the slope at the input center is <math><mo>−</mo><mfrac><mn>20</mn><msup><mi>μ</mi><mn>2</mn></msup></mfrac></math>. The first graph uses an illustrative symmetric Beta(4, 4) bell, scaled to the chosen mean and SE and bounded three SEs either side. Orders stay positive. The curve and tangent transform that same distribution; the actual ratio’s SE is computed by numerical integration.</p>
      <p>The first graph isolates denominator uncertainty; it is not a fitted distribution from the checkout simulation. A linear transformation preserves the input’s shape. In inference, approximately normal estimators therefore give approximately normal outputs when the curve is nearly straight over their uncertainty. This motivates the normal intervals below.</p>
      <h3>The ratio experiment</h3>
      <p>Users are independent, with fixed randomized arm sizes and no interference. Each user buys with the chosen probability, then places either 1 or 5 orders with equal probability. Non-buyers stay in the sample with zero revenue and orders.</p>
      <div class="dm-formula" role="math" aria-label="Revenue X equals orders Y times 10 plus 2 A plus b times Y minus 1, times e to the power s Z minus s squared divided by 2">
        <math aria-hidden="true"><mi>X</mi><mo>=</mo><mi>Y</mi><mo>[</mo><mn>10</mn><mo>+</mo><mn>2</mn><mi>A</mi><mo>+</mo><mi>b</mi><mo>(</mo><mi>Y</mi><mo>−</mo><mn>1</mn><mo>)</mo><mo>]</mo></math>
        <math aria-hidden="true"><mo>×</mo><msup><mi>e</mi><mrow><mi>s</mi><mi>Z</mi><mo>−</mo><mfrac><msup><mi>s</mi><mn>2</mn></msup><mn>2</mn></mfrac></mrow></msup></math>
      </div>
      <p><math><mi>A</mi></math> is 0 or 1, <math><mi>Z</mi></math> is standard normal, <math><mi>s</mi></math> controls spending variation, and <math><mi>b</mi></math> is 0 or 2. The multiplier has mean 1 and is independent of orders.</p>
      <div class="dm-formula" role="math" aria-label="The population ratio in arm A equals 10 plus 2 A plus 10 b divided by 3">
        <math aria-hidden="true"><msub><mi>r</mi><mi>A</mi></msub><mo>=</mo><mn>10</mn><mo>+</mo><mn>2</mn><mi>A</mi><mo>+</mo><mfrac><mrow><mn>10</mn><mi>b</mi></mrow><mn>3</mn></mfrac></math>
      </div>
      <p>The true difference is always +2. Estimation uses only observed revenue and orders.</p>
      <p>Randomization supports a causal comparison of the arm-specific ratios here. This target is not an average individual treatment effect on revenue. Neither interval method establishes causal validity in an observational study.</p>
      <h3>Inspiration and references</h3>
      <p class="small dm-credit">Visual intuition inspired by <a href="https://www.linkedin.com/posts/aabugaev_statistics-abtesting-datascience-activity-7503052275343552512-tKCT">Anton Bugaev’s Delta Method video</a>. These interactive graphics and simulations are an independent implementation.</p>
      <ul>
        <li><a href="https://arxiv.org/abs/1803.06336">Deng, Knoblich & Lu (2018): Applying the Delta Method in Metric Analytics</a> — ratio metrics and experimentation.</li>
        <li><a href="https://arxiv.org/abs/2206.15310">Zepeda-Tello et al. (2022): The Delta-Method and Influence Function in Medical Statistics</a> — derivation and further applications.</li>
        <li><a href="https://www.stat.cmu.edu/~cshalizi/dst/18/lectures/18/lecture-18.html">Shalizi: Simulation for Inference I — The Bootstrap</a> — resampling and interval construction.</li>
      </ul>
    </details>
    <nav class="actions" aria-label="Continue learning"><a href="?lesson=uncertainty">← Return to uncertainty</a><button id="dm-restart">Restart lesson</button><a href="?lesson=topics">Browse topics →</a></nav>
  </main>
</div>`;
setupLessonNavigation();
capture("lesson_started", { lesson: "delta-method" });
const el = (id) => document.getElementById(id);
const width = (id) => Math.max(230, el(id).clientWidth);
let curveStage = 0;
let seed = ratioBaseline.seed;
let arms;
let delta;
let bootstrap = null;
let studies = [];
let runId = 0;
let batch = 0;

function settings() {
  return {
    n: +el("dm-n").value,
    active: +el("dm-active").value,
    skew: +el("dm-skew").value,
    association: +el("dm-association").value,
    seed,
  };
}
function renderCurve() {
  const mean = +el("dm-mean").value;
  const sd = +el("dm-sd").value;
  el("dm-mean-value").textContent = `${number(mean)} orders / visitor`;
  el("dm-sd-value").textContent = `${number(sd)} orders / visitor`;
  el(curveStage >= 2 ? "dm-plots" : "dm-preview").innerHTML =
    transformationPlots(mean, sd, curveStage, +el("dm-point").value);
  el("dm-point-value").textContent =
    `${number(+el("dm-point").value)} orders / visitor → €${number(20 / +el("dm-point").value)} / order`;
  const model = orderRatioApproximation(mean, sd);
  el("dm-spread").innerHTML =
    `<div><span>Approximate SE · €/order</span><math aria-label="${number(Math.abs(model.slope))} times ${number(sd)} equals ${number(model.sd)} euros per order"><mn>${number(Math.abs(model.slope))}</mn><mo>×</mo><mn>${number(sd)}</mn><mo>=</mo><mn>${number(model.sd)}</mn></math><small>Absolute slope × input SE</small></div><div><span>Actual SE · €/order</span><strong>${number(model.exactSD)}</strong></div>`;
}
function renderIntervals() {
  const results = [
    delta,
    bootstrap || { status: "pending", reason: "Run the bootstrap to compare." },
  ];
  el("dm-intervals").innerHTML = intervalComparison(
    bootstrap ? results : [delta],
    width("dm-intervals"),
  );
  el("dm-interval-values").innerHTML = results
    .map(
      (r, i) =>
        `<p><strong>${i ? "Bootstrap percentile" : "Delta normal"}</strong><br>${r.status === "ok" ? `Estimate ${number(r.estimate)} · 95% interval [${number(r.lower)}, ${number(r.upper)}]` : r.reason}</p>`,
    )
    .join("");
}
function renderCoverage() {
  el("dm-coverage").hidden = !studies.length;
  for (const method of ["delta", "bootstrap"]) {
    const valid = studies.filter((s) => s[method].status === "ok");
    const covered = valid.filter(
      (s) => s[method].lower <= ratioTruth && ratioTruth <= s[method].upper,
    ).length;
    el(`dm-${method}-summary`).textContent =
      `${covered} / ${studies.length} contain truth · ${studies.length - valid.length} unavailable`;
    el(`dm-${method}-coverage`).innerHTML = coveragePlot(
      studies,
      method,
      width(`dm-${method}-coverage`),
    );
  }
}
function stop() {
  runId++;
  el("dm-repeat").disabled = false;
  el("dm-cancel").hidden = true;
}
function drawStudy() {
  stop();
  studies = [];
  renderCoverage();
  el("dm-progress").textContent = "";
  arms = ratioStudy(settings());
  delta = deltaRatioDifference(arms);
  bootstrap = null;
  el("dm-sample").textContent =
    arms
      .map(
        (rows, i) =>
          `Arm ${i ? "B" : "A"}: ${rows.filter((r) => r.orders > 0).length} buyers / ${rows.length} users`,
      )
      .join(" · ") + ". Dashed vertical line: simulator truth +2.";
  renderIntervals();
}
el("dm-point").addEventListener("input", renderCurve);
el("dm-distribution").addEventListener("click", () => {
  curveStage = 1;
  el("dm-curve-title").textContent = "2. An estimate varies across studies";
  el("dm-point-control").hidden = true;
  el("dm-distribution").hidden = true;
  el("dm-distribution-caption").hidden = false;
  el("dm-prediction").hidden = false;
  el("dm-reveal").hidden = false;
  renderCurve();
  document.querySelector('[name="shape"]').focus();
});
el("dm-tangent").addEventListener("click", () => {
  curveStage = 3;
  el("dm-tangent").hidden = true;
  el("dm-tangent-legend").hidden = false;
  el("dm-tangent-details").hidden = false;
  el("dm-explore-title").textContent =
    "4. Replace the curve locally with its tangent";
  el("dm-explore-copy").textContent =
    "Narrow the input uncertainty. The curve and tangent agree better over a smaller range; widen it to expose the approximation’s limits.";
  renderCurve();
  el("dm-sd").focus();
});
function renderJoint() {
  const rho = +el("dm-correlation").value;
  el("dm-correlation-value").textContent = rho.toFixed(1);
  el("dm-joint-plot").innerHTML = jointUncertaintyPlot(rho);
  el("dm-joint-readout").textContent =
    `Approximate ratio SE: €${number(jointRatioApproximation(rho).se)} / order. Without covariance: €${number(Math.sqrt(2))} / order.`;
}
el("dm-correlation").addEventListener("input", renderJoint);
for (const input of document.querySelectorAll('[name="shape"]'))
  input.addEventListener("change", () => {
    el("dm-reveal").disabled = false;
  });
el("dm-reveal").addEventListener("click", () => {
  const choice = document.querySelector('[name="shape"]:checked').value;
  curveStage = 2;
  el("dm-feedback").textContent =
    choice === "skewed"
      ? "Yes. Smaller order counts push revenue per order up more sharply, creating a right tail."
      : "Revenue per order stretches toward larger values. With revenue fixed, fewer orders increase the ratio more sharply than extra orders decrease it.";
  el("dm-prediction").hidden = true;
  el("dm-preview").hidden = true;
  el("dm-reveal").hidden = true;
  el("dm-explore").hidden = false;
  renderCurve();
  el("dm-sd").focus();
});
for (const id of ["dm-mean", "dm-sd"])
  el(id).addEventListener("input", renderCurve);
el("dm-to-ratios").addEventListener("click", () => {
  el("dm-joint").hidden = false;
  renderJoint();
  el("dm-joint-title").focus();
});
el("dm-to-experiment").addEventListener("click", () => {
  el("dm-ratios").hidden = false;
  renderIntervals();
  el("dm-ratio-title").focus();
});
for (const id of ["dm-n", "dm-active", "dm-skew", "dm-association"])
  el(id).addEventListener("change", drawStudy);
el("dm-redraw").addEventListener("click", () => {
  seed++;
  drawStudy();
});
el("dm-bootstrap").addEventListener("click", () => {
  bootstrap = bootstrapRatioDifference(arms, { seed: seed + 7300 });
  renderIntervals();
});
el("dm-repeat").addEventListener("click", async () => {
  stop();
  const currentRun = runId;
  const state = settings();
  const firstSeed = 50000 + batch++ * 100;
  studies = [];
  el("dm-repeat").disabled = true;
  el("dm-cancel").hidden = false;
  for (let i = 0; i < 100; i++) {
    if (currentRun !== runId) return;
    const data = ratioStudy({ ...state, seed: firstSeed + i });
    studies.push({
      delta: deltaRatioDifference(data),
      bootstrap: bootstrapRatioDifference(data, {
        seed: firstSeed + i + 100000,
      }),
    });
    if ((i + 1) % 5 === 0) {
      el("dm-progress").textContent = `${i + 1} / 100 fresh studies completed.`;
      renderCoverage();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  if (currentRun === runId) stop();
});
el("dm-cancel").addEventListener("click", () => {
  stop();
  el("dm-progress").textContent =
    `Stopped after ${studies.length} studies. Start again to run a fresh batch.`;
});
for (const button of document.querySelectorAll("[data-dm-answer]"))
  button.addEventListener("click", () => {
    el("dm-check-feedback").textContent =
      button.dataset.dmAnswer === "investigate"
        ? "Right. Agreement in one study cannot establish repeated-study coverage. Check assumptions and compare fresh studies in a plausible model."
        : "Both can agree while missing their intended coverage. One pair of intervals cannot establish the long-run rate.";
  });
el("dm-restart").addEventListener("click", () => location.reload());
window.addEventListener("resize", () => {
  renderIntervals();
  renderCoverage();
});
renderCurve();
drawStudy();
