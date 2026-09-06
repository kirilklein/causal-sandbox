# Instruments and adjustment

The optional chapter opens at `?lesson=instrument` from Contents and after the
overlap lesson. `?lesson=instrument-hidden-confounding` opens its second section.
Existing lesson URLs and progression remain available. This chapter teaches
ordinary covariate adjustment, not IV estimation.

The first section defines an instrument and keeps IPW, outcome regression,
AIPW, and truth visible. A checkbox adds Z to each method's models, with measured
C always included. The uptake bars remain fixed when adjustment changes.
The follow-on section asks “What happens when there is hidden confounding?”
A strength slider starts at zero and controls both U → A and U → Y, up to 2
in steps of 0.1. C-only and C + Z estimates remain visible together beside truth.
Estimate cells reuse the fixed lesson error tint and show signed errors.
A darker strip highlights extra absolute error within each pair on a fixed
0–0.5 unit scale, preserving a visible comparison when both backgrounds saturate.
Repeated-study mean estimates use the same colors.
The invitation example explains why accounting for treatment variation supplied
by Z can amplify U’s existing bias ([#65](https://github.com/kirilklein/causal-sandbox/issues/65)).

## World and analysis

Each sample has 2,400 people and total population effect 2. Existing independent
noise draws generate:

```text
C = +1 if C1 > 0, otherwise -1
Z = 1[jitter < 0.5]
A = 1[a < sigmoid(-0.8 + 1.2 C + 2 Z + h U)]
Y = 2 A + 1.5 C + 1.5 h U + eY
h = 0 in the introduction; h ranges from 0 to 2 in the follow-on section
```

Z is randomized independently of C, U, treatment noise, and outcome noise. It
changes treatment and affects outcome only through treatment. C is binary so
the logistic treatment model using C alone is saturated in the first section;
the C + Z model matches the generating model. Both additive outcome models
are correct there. With hidden U, neither adjustment set controls confounding.
The analyst data expose only C, Z, A, and Y.

`instrumentAdjustment` calls the existing `estimate` function with C and C + Z.
The checkbox selects the corresponding fitted results; it does not resample
data. The follow-on section displays both fits simultaneously. No estimator
arithmetic or clipping thresholds change. Redraw advances the seed. Section
entry and restart restore seed 4217, zero hidden strength, and adjustment for C
only in the introduction. Moving the slider changes treatment/outcome mechanisms
while retaining the same exogenous draws. Returning to zero recovers the original
sample exactly. U never enters the analyst data or either adjustment set.
At zero, U’s label remains readable and its inactive paths are faded.

## Repeated studies

An optional disclosure runs paired comparisons across 200 independent studies.
Later runs advance to the next seed batch. Each fit uses the same data as its
paired alternative. Runs yield to the UI every ten studies, report progress,
and preserve the single-study results. Restart cancels the run and clears its
results; changing strength does the same, restarting the seed batches at 100.
The next run uses the selected strength. Section links navigate to a fresh page. Returning from the browser's
page cache also restores the section baseline.

In the introduction, the main result shows compact stacked SD bars with shared origins and a fixed
0–0.100 scale. Within each method, the smaller SD is nearly white and additional
spread gets a pale red tint. The rule follows the values, not the adjustment
labels. Numeric SD and relative change are retained; visual saturation is
explicit. Means and RMSE are in optional detail. SD uses B - 1; RMSE uses B.
Unavailable estimates are counted and excluded explicitly from the summaries.
These are sampling summaries, not confidence intervals. A new batch can show
different means and relative spread; variance alone does not imply that every
estimate or every absolute-error comparison worsens.

In the follow-on section, mean estimates and signed mean-minus-truth values
lead the repeated-study results, including the signed change after adding Z.
Moving farther from truth establishes amplification in that batch; a positive
signed change alone does not. SD and RMSE remain optional. Single-sample estimates
are not labeled bias. The explanation distinguishes the residual bias with C only
from its amplification after adding Z, without claiming every sample must worsen.

## Validation

Run `node --test src/instrument-simulation.test.js` and
`node tests/instruments-browser.mjs` against the separately running built app.
The browser suite is included in `npm run test:browser`.

Across 1,000 seeds (100–1099) with h = 0, all means were within 0.0011 of truth.
SD increased from 0.0479 to 0.0572 for IPW, 0.0478 to 0.0505 for outcome
regression, and 0.0479 to 0.0568 for AIPW. This is simulated evidence, not a proof
of exact finite-sample unbiasedness. No probabilities were clipped. Additional
tests check hidden-confounding bias amplification and a diagnostic model with U,
data separation, reproducibility, and hand-calculated SD/RMSE.

Browser checks cover direct links and core navigation, unchanged uptake under
adjustment, independent batches, reset/cancellation, theme invariance, aligned
bars and tint ordering, optional means, and phone layout. Successful automated
checks do not establish learner comprehension or screen-reader usability.

Broader lesson scope remains tracked in [#38](https://github.com/kirilklein/causal-sandbox/issues/38).
For the statistical mechanism, see [Myers et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3254160/).

The slider checks include intermediate strengths and the upper endpoint. Across
80 independent seeds (600–679), outcome-regression means at strengths 0.5, 1,
and 2 were 2.303/2.352, 3.109/3.264, and 5.443/5.733 (C only / C + Z).
With Z’s treatment influence set to zero as a diagnostic control, adding Z changed
all mean estimates by less than 0.001. These checks test the role of treatment
variation supplied by Z; they are not a proof for arbitrary models. No probabilities
were clipped. The existing diagnostic adjustment for U still recovers truth.

Browser checks also reconcile both displayed fits and repeated-study means with
the simulator, exercise keyboard/touch strength changes, zero restoration, redraw,
reset/reload, and cancellation when strength changes. Desktop and 320px screenshots
cover paired results and bias summaries in light/dark themes.
