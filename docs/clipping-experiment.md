# Probability-clipping experiment (#42)

This module prepares a lesson-10 extension: can reducing extreme weights make
an estimate more stable while moving it away from the target? It changes the
clipping threshold on a fixed sample with fixed fitted models. A standalone
preview is available; integration into lesson 10 remains separate.

## Local preview

Run `npm run dev -- --port 5186 --strictPort`, then open
[the experiment preview](http://127.0.0.1:5186/causal-sandbox/docs/clipping-preview.html).
The page uses the shared theme palette and the module below. One slider compares
no clipping with the selected threshold; redraw and restart are separate actions.
The preview is served by Vite's development server, not included in the production
site build.

With the server running, `node tests/clipping-browser.mjs` checks arithmetic,
fixed-sample behavior, keyboard/touch interaction, redraw/restart, light/dark
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

## Later lesson integration

Use one threshold slider on the existing fixed-sample overlap experiment. Keep
raw-score overlap visible and unchanged as the threshold moves. Compare estimates
and per-arm weight concentration; explain that an apparently steadier estimate
can miss the target. Default to 0.02 to match the current lesson, offer zero as an
explicit comparison, and label unavailable results. A redraw generates and fits
a new sample; moving the threshold reuses its rows. Coordinate shared lesson
sections and browser checks before integration. The standalone preview has browser
coverage; integrated lesson checks, screen-reader listening, and learner
comprehension remain pending.
