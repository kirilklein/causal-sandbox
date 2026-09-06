# TMLE model-error preview

[Open the interactive preview](https://kirilklein.github.io/causal-sandbox/docs/tmle-robustness-preview.html).
For local development, run `npm run dev` and open
`http://127.0.0.1:5173/causal-sandbox/docs/tmle-robustness-preview.html`.
The page is also included in `npm run build` and available through `npm run preview`.

This standalone experiment addresses the model-error interaction part of
[#69](https://github.com/kirilklein/causal-sandbox/issues/69). It preserves the
approved light-mode preview without changing the lesson sequence or its theme.
Curriculum integration and the repeated-study comparison remain follow-ups.

## Experiment

The two equally common covariate groups have true treatment probabilities 0.2
and 0.8, untreated means 0 and 3, and treated means 1 and 6. Their effects are
1 and 3, so the population ATE is 2. Exact treatment proportions remove sampling
variation; each heatmap cell shows population estimate minus true effect, not
empirical simulation bias, precision, or a confidence interval.

The true conditional means are denoted `Q_a`, and the true propensity is `g0`.
Both distortion coordinates range from −0.6 to +0.6 in steps of 0.12.

| Pattern | Supplied propensity                | Initial outcome means              |
| ------- | ---------------------------------- | ---------------------------------- |
| Shift   | `expit(logit(g0) + delta_ps)`      | `Q_a + delta_y`                    |
| Scale   | `expit(exp(delta_ps) * logit(g0))` | `2.5 + exp(delta_y) * (Q_a - 2.5)` |

Shift moves outcomes in outcome units. Scale stretches outcomes around the
fixed average of the four true means, 2.5. Its controls display multipliers;
zero distortion corresponds to a multiplier of one. An additive logit shift
already multiplies odds; the Scale pattern multiplies logits instead. These
are supplied functions, not fitted models or percentages of prediction error.

Every cell reuses `targetContinuousAte` from `src/tmle.js`. IPW normalizes
separately within each treatment arm. Both use the same clipped propensities;
none of this experiment's values reach the 0.02–0.98 bounds. Changing a model
does not change the population, treatment assignments, outcomes, or true effect.
The experiment contains no hidden confounding or post-treatment adjustment.

## Reading the maps

Blue indicates underestimation, neutral indicates zero error, and rust indicates
overestimation. This signed scale differs from the core lessons' absolute-error
tint. Both maps share a symmetric range, fixed while selecting cells. The legend
explicitly changes from ±0.50 for Shift to ±2.25 for Scale, covering every cell
without saturation. Color intensity should not be compared across patterns.

Both sliders and either heatmap select the same coordinates. Keyboard controls
provide access to every cell and its exact values; phone layouts stack the maps.
Optional details show the supplied functions and explain why a zero fitted
residual correction does not establish accuracy.

Either correct-model axis recovers truth in this exact population. Both wrong
models can leave error, including cases where TMLE is worse than IPW. These
results concern this population and these distortion patterns, not a universal
ranking. Linear continuous-outcome TMLE does not inherit the boundedness of
logistic TMLE and does not repair missing confounders or absent overlap.

## Validation

```sh
node --test src/tmle.test.js src/tmle-robustness.test.js
npm run build
# With a server running on port 5173:
node tests/tmle-robustness-browser.mjs
```

The unit checks cover all 242 cells, correct-model axes, IPW invariance to
outcome distortion, absence of clipping, color-range coverage, and known
two-group outcome/propensity values. A separate check reconciles TMLE error with
the exact population remainder using the targeted outcome predictions.
The existing decimal reference in `tests/tmle-reference.py` independently checks
the reused targeting calculation.

Browser coverage runs against the built page in CI: map selection, both
patterns, slider keyboard/touch use, reset, disclosure invariance, and desktop,
390px and 320px widths. Learner comprehension and screen-reader listening remain
unassessed.
