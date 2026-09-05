# Probability-clipping experiment (#42)

This module prepares a lesson-10 extension: can reducing extreme weights make
an estimate more stable while moving it away from the target? It changes the
clipping threshold on a fixed sample with fixed fitted models. A standalone
preview is available; integration into lesson 10 remains separate.

## Local preview

Run `npm run dev -- --port 5186 --strictPort`, then open
[the experiment preview](http://127.0.0.1:5186/causal-sandbox/docs/clipping-preview.html).
The page uses the shared theme palette and the module below. Selection strength
(0–5, starting at 3) changes treatment assignment with paired background draws and
refits both models. A clipping slider (0–0.10 in steps of 0.001, starting at zero)
reuses that sample and those fits. The histogram shows raw fitted scores by arm,
with clipping bounds overlaid. Its bin counts and fixed 0–100% axis stay unchanged
when clipping moves; each arm's bars sum to 100%. Redraw and restart are separate
actions; restart restores both sliders and the original seed.

The preview uses 400 people to make finite-sample weight instability more visible.
It retains seed 4217. At selection 3, IPW is 1.75 without clipping, 1.87 at 0.005,
and 2.98 at 0.10, against truth 2. This illustrates modest benefit and excessive
clipping without selecting a new seed. The repeated-sample checks below establish
that benefit and harm both occur beyond this opening example.
The preview is served by Vite's development server, not included in the production
site build.

With the server running, `node tests/clipping-browser.mjs` checks arithmetic,
both sliders, histogram accounting and invariance, keyboard/touch interaction, redraw/restart, light/dark
themes, and 320px/desktop layout. Set `CLIPPING_URL` to use a different preview
address. Screenshots are written to the ignored `test-results` directory.

## Contract and use

```js
import { lessonBaseline, simulateLesson } from "../src/lesson-simulation.js";
import {
  fitClippingSample,
  clippingResult,
} from "../src/clipping-experiment.js";

const state = { ...lessonBaseline(10), selection: 3 };
const rows = fitClippingSample(simulateLesson(state));
const unclipped = clippingResult(rows, 0);
const currentDefault = clippingResult(rows); // 0.02, matching existing estimators
const stronger = clippingResult(rows, 0.1);
```

`fitClippingSample(data, adjustment = ["C"], models = {})` uses the existing
estimator's optional fitted predictions and **raw**, pre-clipping propensity
scores. It returns one `{ A, Y, p, m0, m1 }` row per person; no simulation truth
enters the calculation. Call it again only when the sample or models change.
External fitted rows with the same fields can be used directly.

`clippingResult(rows, threshold = 0.02)` does not fit or mutate anything. A finite
threshold in [0, 0.5] clips p to [threshold, 1 − threshold]. Zero applies no
additional probability clipping; the existing fitter still has its numerical
logit bound of ±30. At 0.5, all probabilities become 0.5 and IPW becomes the
unadjusted group-mean difference.

The calculation retains everyone and returns:

- `regression`: average of m1 − m0, invariant to the threshold.
- `ipw`: treated weighted mean minus untreated weighted mean, dividing each
  arm by its own weight sum (Hájek normalization).
- `aipw`: average of m1 − m0 plus the signed, weighted observed prediction error,
  dividing by the full sample size. It is not displayed IPW plus a correction.
- `propensities` and `weights`: threshold-specific scores and received-treatment
  weights, in input order.
- `overlap`: untreated then treated counts, unchanged raw-score histogram bins,
  clipped-score counts, maximum weight, ESS, and the largest 1% weight share.
  A clipped score is counted even when clipping increases a small received-treatment
  weight; probability clipping is not simply a cap on large weights.

Check `available` before using estimates or diagnostics. Empty samples, absent
treatment arms, invalid/non-finite fitted values, probabilities at 0 or 1 without
clipping, and numeric overflow return `available: false` with a reason and no
estimates. Invalid thresholds throw `RangeError`. Fitter exceptions propagate;
the shared fitter has no convergence-status output, so finite results do not
certify convergence or model correctness.

## Statistical meaning

The question remains the population ATE. Clipping retains the sample but changes
its estimating equations; it does not automatically recover that ATE or define
a single common overlap-population target for both normalized arms. It can
introduce bias, and cannot create absent treatment comparisons. This tradeoff is
discussed by [Gruber et al. (2022)](https://pubmed.ncbi.nlm.nih.gov/35512316/).

A correct outcome model still gives a mean-zero AIPW residual correction in the
population. With a wrong outcome model, clipping a correct propensity score can
remove the correction that would otherwise identify the ATE. Finite-sample
behavior need not improve at each slider step. ESS describes weight concentration,
not precision, retained people, or the absence of bias.

Trimming people, direct weight capping, threshold selection, uncertainty intervals,
and TMLE are separate work. In particular, a trimming experiment must state its
restricted target and validate it with heterogeneous treatment effects.

## Validation

Run `node --test src/clipping-experiment.test.js` (also included in `npm test`).
The checks include:

- A hand-calculated four-person example, including distinct IPW/AIPW averages
  and per-arm diagnostics.
- Reconciliation at 0.02 against the existing estimator for all four quadratic
  model choices and three selection strengths.
- Exact two-stratum population counts with known treatment probabilities,
  both correct and wrong outcome predictions, and constant/heterogeneous effects.
  This supplies an independent arithmetic/target check without the shared fitter.
- Input and histogram invariance, treatment-label reversal, threshold boundaries,
  missing arms, invalid fitted values, and overflow.
- Forty independent lesson-10 studies, n = 2,400, seeds 100–139, selection = 3,
  both models adjusting correctly for C. All threshold comparisons share each
  study's fitted rows. Their observed mean and sample SD are:

| Threshold | IPW mean | IPW SD | AIPW mean | AIPW SD |
| --------- | -------- | ------ | --------- | ------- |
| 0         | 1.999    | 0.317  | 1.951     | 0.157   |
| 0.02      | 2.325    | 0.168  | 1.971     | 0.092   |
| 0.10      | 3.058    | 0.096  | 1.981     | 0.063   |

Truth is 2. These are simulation results for this world, not guarantees or
confidence intervals. The exact-population test separately shows failure of
propensity-only AIPW after clipping when outcome predictions are wrong.

### Revised preview setup

An initial exploration used n = 400/800/2,400, selection strengths
1.2/3/4/5/6, and seeds 100–179. The 400-person setup exposes more sampling
variation; the finer slider includes the small thresholds skipped by the previous
0.01 steps. A separate validation used 200 samples (seeds 1000–1199), n = 400,
selection = 3, both models correct:

| Threshold | IPW mean error | IPW root mean squared error | Samples closer to truth than no clipping |
| --------- | -------------- | --------------------------- | ---------------------------------------- |
| 0         | 0.156          | 0.574                       | —                                        |
| 0.005     | 0.184          | 0.540                       | 55 / 200                                 |
| 0.010     | 0.254          | 0.505                       | 65 / 200                                 |
| 0.020     | 0.390          | 0.526                       | 53 / 200                                 |
| 0.050     | 0.713          | 0.758                       | 30 / 200                                 |
| 0.100     | 1.062          | 1.082                       | 6 / 200                                  |

Reducing a few large errors can lower average squared error even when most samples
do not improve. Neither the opening sample nor this simulation selects a generally
optimal clipping threshold. The focused unit suite checks the zero/0.01/0.10
comparison and the opening sample; browser checks validate histogram accounting
and both sliders at the range boundaries.

## Later lesson integration

Keep selection strength and probability clipping as separate controls. Use the
raw-score distribution to explain how selection changes overlap, then compare
unclipped and clipped estimates on the same sample. The preview starts unclipped;
the existing estimator default remains 0.02. Label unavailable results. A redraw
generates and fits a new sample; moving the threshold reuses its rows. Coordinate shared lesson
sections and browser checks before integration. The standalone preview has browser
coverage; integrated lesson checks, screen-reader listening, and learner
comprehension remain pending.
