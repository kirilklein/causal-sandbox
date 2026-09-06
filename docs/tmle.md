# Continuous-outcome TMLE (#49)

This module targets the population average total treatment effect from supplied
outcome predictions and treatment probabilities. It does not fit those models
or change the generating process. The lesson preview at `?lesson=tmle` uses its
actual updated predictions and residual correction with the AIPW formula presentation.

## Statistical contract

For independent observations `(W, A, Y)`, treatment is binary and the outcome is
continuous, with no known finite bounds, as in the current simulator. The target
is `E[Y(1) - Y(0)]`, identified by `E[Q(1,W) - Q(0,W)]` under consistency,
no interference, conditional exchangeability given baseline W, and positivity.
Post-treatment adjustment or missing confounders can invalidate that interpretation.
Finite moments and suitable nuisance-model convergence are also needed for the
usual consistency claims. This module supplies no uncertainty estimates.

Choose squared-error loss and a single linear fluctuation targeting the ATE
directly. This is not a binary-outcome logistic update or two separately targeted
treatment means. Predictions remain in outcome units and may leave the observed
outcome range. Linear targeting can be unstable under poor overlap; it does not
inherit the boundedness properties of logistic targeting.

Let `m0[i]` and `m1[i]` be fitted predictions under each treatment, and let `g[i]`
be the supplied propensity clipped to `[0.02, 0.98]`, matching the sandbox's IPW
and AIPW convention. With the initial predictions fixed, define

```math
H_i = \frac{A_i}{g_i} - \frac{1-A_i}{1-g_i},\qquad
r_i = Y_i - m_{A_i,i}.
```

Minimizing `sum((r[i] - epsilon * H[i])**2)` with no intercept gives

```math
\hat\epsilon = \frac{\sum_i H_i r_i}{\sum_i H_i^2},\qquad
m^*_{1,i} = m_{1,i} + \frac{\hat\epsilon}{g_i},\qquad
m^*_{0,i} = m_{0,i} - \frac{\hat\epsilon}{1-g_i}.
```

The estimate is `mean(m1* - m0*)`. The same clipped probabilities must be used
for fitting epsilon, updating both predictions, and calculating the residual
correction. No simulation truth enters these operations.

The targeting equation is `mean(H * (Y - mA*)) = 0`. The estimated influence
function is `H * (Y - mA*) + m1* - m0* - estimate`; H alone is not the influence
function. Its empirical mean is zero when targeting succeeds. This is an
arithmetic property, not evidence that either nuisance model is correct.

Unlike the current AIPW, which adds the initial mean weighted residual to the
initial regression contrast, this estimator updates predictions before averaging.
Its finite-sample result generally differs from AIPW. Both average over the full
sample, unlike the separately normalized treatment-arm averages in Hájek IPW.

With adequate overlap and appropriate regularity, consistency can hold if either
the outcome regression or the propensity model is consistently estimated. Fixed
clipping may make an otherwise correct propensity model incorrect for this
argument. Clipping does not remove confounding or restore absent treatment
support. Neither targeting nor double robustness guarantees a better estimate
in each sample or better predictions for each person.

## Module boundary

`targetContinuousAte(data, { m0, m1, propensities })` takes aligned ordinary
arrays. Each data row supplies numeric `A` (0 or 1) and finite `Y`; predictions
are finite numbers and raw propensities lie in `[0, 1]`. The caller is responsible
for valid model fits and row alignment; finite predictions cannot establish fit
convergence. Inputs are never mutated.

- Array-shape errors throw, since they indicate an integration bug.
- Empty data, a missing treatment arm, invalid numeric inputs, overflow, or a
  targeting equation that fails its tolerance return `status: "unavailable"`
  with a reason and no estimate. No fallback estimator is substituted.
- Success returns the estimate, initial estimate, epsilon, updated `m0`/`m1`,
  clipped propensities and count, observed clever covariates, and the mean
  residual correction before and after targeting.
- The absolute post-targeting correction must be at most
  `1e-10 * max(1, mean(abs(H * initialResidual)))`. The scale accounts for
  floating-point cancellation; a small correction does not measure precision.

The 0.02 bound is a fixed compatibility choice for this educational module.
Changing it later requires coordinated estimator comparisons. No extra clipping
control, fit abstraction, or shared simulation output is introduced here.

## Validation contract

- Check a small rational example by hand and independently minimize the actual
  squared-error objective in Python using decimal arithmetic, without the
  JavaScript closed-form epsilon calculation.
- Check the targeting equation, prediction updates, and invariance to treatment
  relabeling and outcome location/scale. Include heterogeneous treatment effects.
- Use a finite population with exact treatment proportions to isolate each
  nuisance-model error, then independent simulated samples with the repository's
  fitted predictions to check behavior beyond a selected seed.
- Check clipping, poor overlap, both-wrong bias despite successful targeting,
  missing arms, invalid predictions/probabilities, and numerical overflow.
- Run the repository unit suite, production build, and touched-file formatting.
  The lesson wrapper also checks navigation/reset, explanation invariance,
  keyboard/touch use, and desktop/phone rendering.

## Validation results (2026-09-06)

On base `d4821ab`, all 41 unit tests pass (including seven new TMLE tests),
the production build passes, and the new JavaScript and Markdown files pass
Prettier. The Python reference independently minimizes the loss with 80-digit
decimal arithmetic on five datasets: a hand example, randomized treatment,
confounding, poor overlap, and clipping boundaries. Maximum absolute difference
from JavaScript across epsilon, ATE, and updated predictions is `3.41e-13`.
This validates the targeting calculation, not equivalence to an external TMLE
package with potentially different fluctuation and clipping choices.

Forty independent samples of 2,400 people from the existing nonlinear lesson
(stable ID 6, seeds 100–139, truth 2) use existing regression/logistic fits:

| Outcome model | Treatment model | Mean bias |     SD | Monte Carlo SE of mean bias |
| ------------- | --------------- | --------: | -----: | --------------------------: |
| Misspecified  | Misspecified    |    1.4081 | 0.1106 |                      0.0175 |
| Correct       | Misspecified    |   -0.0107 | 0.0453 |                      0.0072 |
| Misspecified  | Correct         |   -0.0117 | 0.0502 |                      0.0079 |
| Correct       | Correct         |   -0.0114 | 0.0482 |                      0.0076 |

All 160 fits return available targeting results. These are scenario-specific
checks, not a general performance comparison. An exact population with
heterogeneous effects checks the ATE separately. A poor-overlap population shows
bias despite a zero residual correction when the true propensities are clipped
and the outcome predictions are wrong. Overflow and loss of targeting accuracy
from floating-point rounding return unavailable results.

Reproduce from the repository root:

```sh
npm test
python3 tests/tmle-reference.py
npm run build
npx prettier --check src/tmle.js src/tmle.test.js docs/tmle.md
```

The reference script needs Python 3.10+ and Node, with no Python dependencies.
It is a separate validation command; the existing Node unit suite runs in CI.
The initial estimator-only stage did not run browser checks. The lesson preview
now connects the calculation through `tmle-lesson.js`; see the integration checks
in [education.md](education.md#tmle-targeting-level-10). Learner comprehension and
screen-reader listening remain pending.

The integrated preview passed all 50 unit tests before updating its main base,
with all three browser suites also checked during integration. On main base
`4c99d34`, the 26 focused TMLE and lesson-simulation tests, independent Python
reference, lesson browser suite, production build, and touched-file formatting
pass. Desktop and 320px light/dark screenshots were reviewed. The local preview
uses `?lesson=tmle`; its new numeric ID is 11, preserving the earlier lesson IDs.

## References

[Gruber (2011), section 4.2, printed pages 28–29](https://escholarship.org/content/qt1849174p/qt1849174p.pdf#page=40)
defines the signed ATE clever covariate and targeted substitution approach. We
use the basic targeting step, without collaborative propensity-model selection.
[Porter (2011), section 3.4.2, printed page 54](https://escholarship.org/content/qt3hp4r33n/qt3hp4r33n.pdf#page=65)
describes squared-error loss with a linear fluctuation and its sensitivity to
positivity violations. That discussion targets a mean under missingness; the
signed ATE update above is the specialization used here.
