# Difference-in-differences

Optional lesson: `?lesson=difference-in-differences`, after hidden confounding.
Learner question: how much would the treated group have improved without treatment?

A short opening connects DiD to the same missing-counterfactual question as the
core lessons. The visible comparison below the experiment separates the target
(ATE versus ATT), the assumption (comparable untreated changes versus adjusted
outcome levels), and the estimator. Links return to IPW and outcome regression;
conditional parallel trends introduces their use within DiD with a link to the
separate [Comparable hospitals chapter](did-adjustment.md).
Optional regression and director-facing exercises connect the four observed
means to the group-by-period interaction without changing the six stages.

## Storyboard

1. Hospital A's recovery rises from 40% to 65%. Predict whether all 25 percentage
   points came from its new program.
2. Reveal comparison Hospital B: 60% to 70%, without the program.
3. Translate B's +10-point change to A's baseline, constructing an assumed 50%
   untreated endpoint. Solid observations and the dashed assumption stay distinct.
4. Compare 65% with 50%. Reveal `(65 − 40) − (70 − 60) = +15 pp`.
   Change the baseline gap or shared improvement separately to see cancellation.
5. Introduce an A-specific untreated change while holding the program effect at
   +15 pp. Optionally reveal the simulator's untreated endpoint and estimation error.
6. Expand the history. Compare parallel untreated changes, existing differential
   trends, and a new post-treatment shock with identical pre-treatment histories.
   A final prediction checks why matching histories cannot prove identification.

## Scientific contract

All values are exact synthetic population percentages. Hospital A is the treated
group even before treatment starts. Patient composition is stable. No sampling
or intervals are implemented, and no inference about individual patients follows.

For baseline gap `g`, shared change `c`, and differential untreated change `d`:

```
B before = 60                 B after = 60 + c
A before = 60 − g             A without program after = 60 − g + c + d
A with program after = 60 − g + c + d + 15
DiD counterfactual = A before + (B after − B before)
DiD estimate = 15 + d         ATT = 15         bias = d
```

The estimator receives only the four observed means. Truth never enters its
calculation. UI ranges are g=10…30, c=0…20, d=−10…10, keeping all rates in [0,100].
The baseline and shared-change experiments set d=0. Earlier guided stages always
show the original example. Switching experiments restores baseline parameters.
Stage 5 retains the explored starting gap and shared change. Stage 6 explicitly
returns to the baseline example and uses separate history presets.

History presets have A=[30,35,40], B=[50,55,60] before treatment. The drift preset
uses A=[10,25,40], preserving a 10 pp differential change into the post period.
The new-shock preset preserves the original pre-history but adds d=10 only after
treatment. Both violations give a 25 pp estimate for a 15 pp true effect.

Identification requires parallel untreated mean changes, no anticipation, no
spillovers, consistency, and a stable composition for this repeated-cross-section
example. The target is the post-period average effect on A's patient population.
Parallel pre-trends are evidence about plausibility, not proof of the identifying
assumption. Staggered adoption, TWFE, and inference are separate future lessons.

## Visual and interaction contract

One SVG uses a fixed 0–100% scale, shared arm colors, triangle/circle group marks,
direct labels, and explicit legends. The final stage expands the pre-treatment
time window. Baseline and Follow-up label the measurement points, with Program
starts marking the event between them. Lines connect period averages, not individual patient trajectories.
The translated comparison segment represents the same numerical change. Reduced
motion shows the finished counterfactual immediately. Simulator truth uses a
purple dotted line, square marker, and labelled result, revealed on request.
Its endpoint is A's untreated recovery rate, not a treatment effect. The effect
bracket is explicitly labelled DiD and compares observed recovery with the
assumed untreated rate. Purple (`--counterfactual-truth`) distinguishes truth
from both hospital groups in light and dark themes.

When simulator truth is revealed, the estimated and true effects sit side by
side immediately below the chart, including on phones. Both cards show the
follow-up contrast for A. The difference-of-changes arithmetic sits beneath
them. The estimate uses the shared `effectComparison` red tint after converting
percentage points to risk units, and reports signed error in pp. Truth retains
its fixed purple styling. Hiding truth removes both the error text and tint so
the missing outcome cannot be inferred from color.

Steps preserve answers and experiments when revisited. Restart resets everything.
Controls remain keyboard usable through updates. Theme changes do not reset data.
No progress or state is persisted across visits.

## Validation

`node --test src/did.test.js` checks the arithmetic, all integer combinations in
the supported UI ranges, bounded rates, identical prehistories with different
post-treatment biases, and alternative hidden truths compatible with the same
observations. `tests/did-browser.mjs` exercises navigation, discovery, controls,
prediction feedback, themes, reset, reduced motion, and desktop/phone layouts.
A newcomer comprehension check remains separate from automated correctness.

## References

- [Roth, Sant’Anna, Bilinski & Poe (2023)](https://pedrohcgs.github.io/files/RSBP_DiD_Review.pdf): canonical DiD, identification, pre-trends, and inference.
- [Roth (2022)](https://doi.org/10.1257/aeri.20210236): limits of pre-trend testing.
- [Sant’Anna & Zhao (2020)](https://psantanna.com/DRDID/): covariate-adjusted and doubly robust DiD for the ATT.
- [Issue #186](https://github.com/kirilklein/causal-sandbox/issues/186): deferred staggered-adoption/TWFE extension.
- [Issue #309](https://github.com/kirilklein/causal-sandbox/issues/309): planned multi-hospital comparisons, covariate-adjusted DiD, and hospital-cluster uncertainty lessons.
