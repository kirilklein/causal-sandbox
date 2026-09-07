# Time-varying confounding

`?lesson=time-varying-confounding` is an optional chapter linked from Timing and
Contents. Prerequisites are IPW, outcome regression, and mediators. It addresses
the two-visit part of [#79](https://github.com/kirilklein/causal-sandbox/issues/79).
The learning objective is to recognize that updated health can mediate earlier
treatment and confound later treatment.

## Experiment

The target is E[Y(1,1)] − E[Y(0,0)]: treating everyone at both visits versus
neither, with severity responding naturally to first treatment. Lower final
symptom scores are better. All values are fictional.

- A₁ is randomized with probability 0.5.
- L is high severity with probability 0.7 − 0.4A₁.
- Stage 1: A₂ is randomized with probability 0.5.
- Stages 2–3: Pr(A₂=1 | A₁,L) = 0.2 + 0.6L.
- Y = 6 − A₁ − A₂ + 2L + independent standard normal noise.

Truth is −2.8: −2 directly plus −0.8 through severity. Stages share background
draws for 2,400 people (seed 4217), preserving A₁ and L when the second assignment
rule changes. Stages 2 and 3 use exactly the same data. The L → A₂ arrow is
absent in stage 1; the other arrows remain. Adjustment never changes the graph.

## Estimators and identification

Outcome regression uses saturated cell means. Without L, the both-versus-neither
prediction contrast equals the difference in those observed groups' means. With
L, it averages within-severity contrasts over the pooled observed L distribution.
Thus the failure is not a restricted outcome model. The adjusted contrast holds
severity fixed instead of preserving its response to A₁.

Sequential IPW uses known first-decision probability 0.5 and, in stages 2–3,
empirical second-treatment probabilities within each (A₁,L) history. This is a
saturated binary treatment model. Each weight is 1 divided by the product of
the probabilities of the person's actual decisions. Weighted outcome means are
normalized separately within the both and neither groups. Mixed histories inform
the treatment model but not those two outcome means. There is no clipping.

The weighting estimator represents two means of a saturated marginal structural
model. It uses neither potential outcomes nor the analytic truth. Unsupported
cells produce unavailable estimates, rather than regularized or clipped fits.

Identification assumes sequential exchangeability, positivity, consistency, and
no interference. Estimation also requires adequate treatment models. The world
supplies these conditions; balance cannot establish them in real data. Ordinary
regression adjustment is distinguished from the longitudinal g-formula, which
allows the severity distribution to change under each strategy.

| World                      | Regression without L | Regression with L | Sequential IPW |
| -------------------------- | -------------------- | ----------------- | -------------- |
| Randomized decisions       | −2.8                 | −2                | −2.8           |
| Second decision confounded | −1.473684…           | −2                | −2.8           |

These are population limits, not guaranteed rankings in each finite sample.

## Interaction and validation

Stage selection preserves the sample seed and adjustment choice and clears any
repeated-study comparison. Redraw changes the current sample only. The person
slider explains the actual observed history and its calculated weight. Details,
adjustment, and theme changes preserve the sample. Restart restores stage 1,
seed 4217, no adjustment, person 1, and closed disclosures.

The optional repeated-study table runs 60 studies with seeds 100–159 and displays
each method's mean, empirical SD, and count of unavailable fits. Stage changes
and restart cancel running batches. These are not confidence intervals.

Unit checks independently enumerate the exact joint distribution, reconstruct
weights and their normalized contrasts, verify paired draws, test unsupported
histories, and assess population limits across 160 additional seeds per world.
The browser test covers entry/navigation, stages, adjustment, weights, repeated
studies, cancellation, restart, keyboard/touch, and narrow light/dark layouts.
Human learner comprehension and screen-reader listening remain separate checks.

Sources: Hernán & Robins, [Causal Inference: What If](https://miguelhernan.org/whatifbook),
chapters 19–21; Hernán, Brumback & Robins (2000),
[Marginal Structural Models to Estimate the Causal Effect of Zidovudine](https://hsph.harvard.edu/wp-content/uploads/2012/10/hernan_epid00.pdf).
The longitudinal g-formula, adaptive strategies, and loss to follow-up are later
extensions.
