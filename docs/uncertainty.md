# Uncertainty and p-values

Issue: [#230](https://github.com/kirilklein/causal-sandbox/issues/230).

The core lesson `?lesson=uncertainty` follows confounding and precedes IPW.
Its numeric identity is 14; existing numeric IDs retain their meanings.
The optional `?lesson=p-values` returns to uncertainty or continues to IPW.
Both are in Contents, the topic browser, and search.

The learner question is: how precise is one study's estimate, and what could
still make it wrong? A point estimate alone cannot show the interval procedure's
coverage; repeated interval rows make the distinction visible. The first study
hides truth until the learner reveals it. Independent repeated studies calculate
their own intervals; the observed coverage count is not scripted to 95%.
Increasing sample size while introducing confounding shows precision without
causal validity. Individual outcome spread, heterogeneity of effects, sampling
uncertainty, and systematic error are explicitly distinguished.

## Statistical contract

`src/uncertainty.js` reuses `simulateLesson` with the common-cause baseline:
independent people, C uniform with variance 1, independent N(0,1) outcome error,
Y = effect × A + 1.5C + error. Treatment probability is
logistic(−0.8 + selection × C). Selection is 0 (randomized) or 1.2 (confounded).
The causal target is the population average effect, constant across people.
The analyst uses treatment and observed outcome only.

The estimate is the difference in arm means. Its SE is
√(s₁²/n₁ + s₀²/n₀), with unbiased sample variances computed separately by arm.
The 95% interval is estimate ± 1.959963984540054 × SE. The two-sided test uses
z = estimate/SE and the standard normal tail. These are large-sample
approximations, not Welch t inference or exact finite-sample intervals.
They do not extend inference to IPW, regression, AIPW, or TMLE.

Insufficient arm counts or zero estimated variance produce an explicit
unavailable result. Invalid input throws. Numerical Recipes' complementary
error-function approximation evaluates small tails directly; displayed small
p-values use an inequality instead of rounding to zero.

The uncertainty lesson starts with n=200, effect=2, seed=4217. Redraw advances
that study's seed. Coverage uses successive seeds starting at 12000, adds 50
studies per action, and stops at 500; all rows enter the count and exact table,
while the chart shows the latest 50. The precision comparison uses seeds
9000–9049 at each setting (n=200–3200). Each interval estimates uncertainty from
its own sample; the across-study spread is never substituted for its SE.

The p-value lesson simulates batches of 100 null studies (effect=0, seeds starting
at 20000) and a separate observed study (effect=0.1, seed=4217). The observed
truth is disclosed only in simulation details and never enters inference.
The curve and shaded tails use the standard normal reference, not empirical
dot counts. A separate, explicitly illustrative exercise holds estimated
magnitude, arm proportions, and outcome spread fixed while changing sample
size: SE(n)=SE(200)√(200/n). Its sliders do not claim to generate new study data.
Matching interval inclusion and p-values change continuously across 0.05.

## Presentation and validation

Interval charts share a fixed −1 to 5 outcome-unit axis, with off-scale bounds
marked by arrows and exact numeric bounds in tables. Truth uses the shared
truth color and a dashed vertical line. Missed intervals use the shared error
mark plus a broken horizontal line, with an explicit coverage legend.
This encoding describes coverage, not a test of causal validity. Before truth
is revealed, the first interval has no truth-dependent styling.
Null plots span z=−4 to 4; their displayed range does not truncate the p-value.

Both chapters use native controls and disclosures, keep answer retries and
first-answer scoring, and reset the experiment on entry or Restart. Only the
core lesson affects guided completion; opening the optional chapter from its
preview also completes uncertainty. Theme changes do not change study data.

Unit checks cover hand-calculated inference, reference normal probabilities,
interval/test agreement, invalid and degenerate input, constant-effect shifts,
coverage and null calibration across 5,000 samples, and persistent confounding
bias across 600 samples. Browser checks cover routes, Continue/Back, reset,
repeated batches, actual numeric results, keyboard/touch, disclosures, feedback,
and desktop/phone rendering. Human learner comprehension remains untested.

## References

- [Hernán & Robins, Causal Inference: What If, Chapter 10](https://miguelhernan.org/whatifbook): random variability and systematic bias.
- [Greenland et al. (2016)](https://link.springer.com/article/10.1007/s10654-016-0149-3): confidence-interval and p-value interpretations and misinterpretations.
- [Altman & Bland (2005)](https://www.bmj.com/content/331/7521/903): outcome standard deviation versus standard error.
- [Rafi & Greenland (2020)](https://link.springer.com/article/10.1186/s12874-020-01105-9): compatibility, analysis assumptions, and avoiding binary significance conclusions.
