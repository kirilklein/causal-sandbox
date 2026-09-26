# Beyond trimming: bounds and sensitivity

## Teaching contract

Route: `?lesson=positivity-sensitivity`. Prerequisites: overlap and trimming.
This chapter uses ATT, whereas the preceding trimming experiment averages over
everyone in each retained/excluded group.

Objective: keep the original ATT target when controls are absent for some
patients. Derive bounds, then explore how an externally justified upper limit on
untreated recovery narrows them. The advanced task is to find the weakest upper
limit that rules out fewer recoveries with treatment, not to repeat the earlier overlap diagnosis.

The propensity histogram supplies the starting context. Known probabilities,
within-arm percentages, and a hatched treated-only mass at score 1 identify the
excluded 40%. It stays fixed throughout the sensitivity analysis. An empty region
of fitted scores alone does not establish a structural violation.

The recovery display opens immediately, with no preliminary yes/no gate or
separate paragraphs repeating the same evidence. Two columns compare the same
target population per 100 treated patients. Sixty are retained and forty excluded.
Filled and hollow dots show aggregate recovery counts, not paired individual
potential outcomes. The right-hand dots depict the maximum untreated recovery
allowed by the learner's bound, not an estimated counterfactual.

Observed recovery stays 36 + 24 = 60. Controls support 24 retained recoveries
without treatment. Starting at 40 permits 0–40 excluded recoveries, so untreated
total recovery lies between 24 and 64 and the overall ATT between −4 and +36 pp.
The slider sets an upper limit, leaving zero as the lower limit. At 36 (90%), the
ATT lower bound reaches zero. At 32 (80%), it is +4 pp. The upper ATT bound stays
+36 pp because zero excluded untreated recoveries remain allowed.

The result explicitly depends on the assumption and excludes sampling uncertainty.
A transfer question asks learners to distinguish an ATT interval from a point
estimate under an 80% upper limit. Optional details give native MathML arithmetic,
alternative targets and evidence, calendar-time comparisons, and sources.

## Exact model

The example is a fictional medicine study. Y=1 means symptom-free at 30 days
(recovered), and Y=0 means not symptom-free. This is the patient outcome, not
recovery of an estimand or deterioration of an estimator. S identifies a baseline-defined
retained group. P(S=1 | A=1)=0.6. Within S=1, treatment is exchangeable with the
potential outcomes and both treatments are possible. Recovery is 0.6 under
treatment and 0.4 without it, so ATT_retained=0.2. In S=0, everyone is treated
and observed recovery is 0.6. Consistency and no interference are assumed.

To make support visible, S=1 has six equally common baseline profiles with
propensity scores 0.15, 0.25, 0.35, 0.45, 0.55, and 0.65. Their population share
is 15/19 and the always-treated S=0 profile has share 4/19. This gives P(A=1)=10/19
and preserves P(S=1 | A=1)=0.6. Outcome probabilities remain constant across the
retained profiles. Within-arm score masses follow Bayes' rule, not hand-drawn
density curves. Histogram bins have width 0.1, with score 1 included in the last
bin. Its entire mass is at 1, not spread over 0.9–1.

The unobserved recovery probability q=E[Y(0) | A=1,S=0] may be any value in [0,1].
For every q, a joint potential-outcome distribution exists, for example independent
Bernoulli potential outcomes conditional on S. The observed distribution is
unchanged across these worlds.

```
ATT_excluded = 0.6 − q                    in [−0.4, 0.6]
ATT_all = 0.6 × 0.2 + 0.4 × ATT_excluded in [−0.04, 0.36]
```

For a chosen upper limit u on excluded untreated recovery, q lies in [0,u].
The identified set becomes [0.36 − 0.4u, 0.36]. These bounds are sharp in this model.
The slider starts at u=1, so it initially adds no outcome restriction. No overall
point truth is selected or estimated. There is no fitted propensity score,
trimming threshold, or estimator ranking. OWATT remains further reading.

## Validation

`src/positivity-sensitivity.test.js` checks propensity calibration, within-arm
normalization, the same 60/40 treated split, independently calculated effects,
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
