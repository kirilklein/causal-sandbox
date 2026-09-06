# Instruments and adjustment

The optional chapter opens at `?lesson=instrument` from Contents and after the
overlap lesson. `?lesson=instrument-hidden-confounding` opens its second section.
Existing lesson URLs and progression remain available. This chapter teaches
ordinary covariate adjustment, not IV estimation.

The first section defines an instrument and keeps IPW, outcome regression,
AIPW, and truth visible. A checkbox adds Z to each method's models, with measured
C always included. The uptake bars remain fixed when adjustment changes.
The second section explicitly adds hidden U and repeats the same comparison.
A more detailed explanation of the additional bias from adjusting for Z is
tracked separately in [#65](https://github.com/kirilklein/causal-sandbox/issues/65).

## World and analysis

Each sample has 2,400 people and total population effect 2. Existing independent
noise draws generate:

```text
C = +1 if C1 > 0, otherwise -1
Z = 1[jitter < 0.5]
A = 1[a < sigmoid(-0.8 + 1.2 C + 2 Z + h U)]
Y = 2 A + 1.5 C + 1.5 h U + eY
h = 0 in the introduction; h = 1 in the hidden-confounding section
```

Z is randomized independently of C, U, treatment noise, and outcome noise. It
changes treatment and affects outcome only through treatment. C is binary so
the logistic treatment model using C alone is saturated in the first section;
the C + Z model matches the generating model. Both additive outcome models
are correct there. With hidden U, neither adjustment set controls confounding.
The analyst data expose only C, Z, A, and Y.

`instrumentAdjustment` calls the existing `estimate` function with C and C + Z.
The checkbox selects the corresponding fitted results; it does not resample
data. No estimator arithmetic or clipping thresholds change. Redraw advances
the seed. Section entry and restart restore seed 4217 and adjustment for C only.
The hidden-confounding transition changes treatment/outcome mechanisms while
retaining the initial exogenous draws.

## Repeated studies

An optional disclosure runs paired comparisons across 200 independent studies.
Later runs advance to the next seed batch. Each fit uses the same data as its
paired alternative. Runs yield to the UI every ten studies, report progress,
and preserve the single-study results. Restart cancels the run and clears its
results; section links navigate to a fresh page. Returning from the browser's
page cache also restores the section baseline.

The main result shows compact stacked SD bars with shared origins and a fixed
0–0.100 scale. Within each method, the smaller SD is nearly white and additional
spread gets a pale red tint. The rule follows the values, not the adjustment
labels. Numeric SD and relative change are retained; visual saturation is
explicit. Means and RMSE are in optional detail. SD uses B - 1; RMSE uses B.
Unavailable estimates are counted and excluded explicitly from the summaries.
These are sampling summaries, not confidence intervals. A new batch can show
different means and relative spread; variance alone does not imply that every
estimate or every absolute-error comparison worsens.

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
