# Beyond trimming: bounds and sensitivity

## Teaching contract

Route: `?lesson=positivity-sensitivity`. Prerequisites: overlap and trimming.
This chapter uses ATT, whereas the preceding trimming experiment averages over
everyone in each retained/excluded group.

Objective: keep the original ATT target when controls are absent for some
units. Derive bounds, then explore how an externally justified upper limit on
outcome probability without exposure narrows them. The task locates the upper-limit threshold that rules out a negative ATT, then
asks whether that restriction is externally defensible. Choosing a restriction
to obtain a desired result is not evidence for it.

The propensity histogram supplies the starting context. Known probabilities,
within-arm percentages, and a hatched exposed-only mass at score 1 identify the
excluded 40%. It stays fixed throughout the sensitivity analysis. An empty region
of fitted scores alone does not establish a structural violation.

Before the control, visible evidence states the retained ATT (+20 pp), retained
share (60%), and excluded outcome probability under exposure (60%). The retained contrast
explicitly compares 60% under exposure with 40% without exposure for the same
retained exposed units. The lesson
then explains the unrestricted −4 to +36 pp interval. A probability slider sets the assumed
upper limit on P(Y(0)=1 | A=1, excluded), from 0% to 100% in five-point steps.
A single horizontal plot shows the ATT interval on a fixed −10 to +40 pp axis.
The dot marks its lower bound, the right cap its upper bound, and the dashed
reference marks zero. There is no point estimate. An optional reveal adds a fixed simulation-truth
marker at +4 pp.
These are identification bounds, not confidence intervals.

Starting at 100% adds no outcome restriction and yields −4 to +36 pp. At 90%, the
lower bound reaches zero. At 80%, it reaches +4 pp. The upper bound stays +36 pp
because zero outcome probability without exposure remains allowed. The plot keeps
a constant 106px height across desktop and phone widths. The weighted calculation remains in the optional formula disclosure.

The optional truth reveal fixes excluded P(Y(0)=1) at 80%, giving excluded ATT
−20 pp and overall ATT +4 pp. Neither the truth nor the observed data change with
the slider. Below an 80% assumed maximum, the restriction is false in this world
and its bounds exclude the truth. The marker and explanation are hidden on entry
and reset; revealing them never alters the bounds. The practice question uses only
observed data and the restriction, even when simulator truth has been revealed.

The result explicitly depends on the assumption and excludes sampling uncertainty.
A visible transfer question follows the experiment, before optional details. It
asks whether an externally supported 80% limit narrows the ATT interval, identifies
a point, or restores positivity. Optional details give native MathML arithmetic,
alternative targets and evidence, calendar-time comparisons, and sources.

## Exact model

A is a binary exposure and Y a binary outcome. S identifies a baseline-defined
retained group. P(S=1 | A=1)=0.6. Within S=1, exposure is exchangeable with the
potential outcomes and both exposure levels are possible. Outcome probability is 0.6 under
exposure and 0.4 without it, so ATT_retained=0.2. In S=0, everyone is exposed
and observed outcome probability is 0.6. Consistency and no interference are assumed.

To make support visible, S=1 has six equally common baseline profiles with
propensity scores 0.15, 0.25, 0.35, 0.45, 0.55, and 0.65. Their population share
is 15/19 and the always-exposed S=0 profile has share 4/19. This gives P(A=1)=10/19
and preserves P(S=1 | A=1)=0.6. Outcome probabilities remain constant across the
retained profiles. Within-arm score masses follow Bayes' rule, not hand-drawn
density curves. Histogram bins have width 0.1, with score 1 included in the last
bin. Its entire mass is at 1, not spread over 0.9–1.

The unobserved outcome probability q=E[Y(0) | A=1,S=0] may be any value in [0,1].
For every q, a joint potential-outcome distribution exists, for example independent
Bernoulli potential outcomes conditional on S. The observed distribution is
unchanged across these worlds.

```
ATT_excluded = 0.6 − q                    in [−0.4, 0.6]
ATT_all = 0.6 × 0.2 + 0.4 × ATT_excluded in [−0.04, 0.36]
```

For a chosen upper limit u on excluded outcome probability without exposure, q lies in [0,u].
The identified set becomes [0.36 − 0.4u, 0.36]. These bounds are sharp in this model.
The slider starts at u=1, so it initially adds no outcome restriction. One world, q=0.8, is selected for the optional truth reveal. Its overall ATT
is +0.04; the bounds calculation never uses this hidden value. There is no fitted propensity score,
trimming threshold, or estimator ranking. OWATT remains further reading.

## Validation

`src/positivity-sensitivity.test.js` checks propensity calibration, within-arm
normalization, the same 60/40 exposed split, independently calculated effects,
bound endpoints, the zero-effect threshold, valid probabilities, and distinct
complete potential-outcome worlds with identical observed data. Browser checks
cover the trimming link, topic/search/Contents discovery, bound interpretation and practice,
unchanged observations, keyboard/touch controls, disclosure invariance, restart,
history, and desktop/phone light/dark layouts.

Run `npm test`, `npm run build`, and `npm run test:positivity` with the worktree's
server running. Learner comprehension and screen-reader listening require a
separate walkthrough.

Sources: [Yang & Ding (2018)](https://academic.oup.com/biomet/article/105/2/487/4930690),
[Petersen et al. (2012)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4107929/),
[Mack et al. (2013)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3659185/), and
[Liu et al. (2024)](https://pubmed.ncbi.nlm.nih.gov/39246144/).
