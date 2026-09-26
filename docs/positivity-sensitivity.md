# Beyond trimming: who is still missing?

## Teaching contract

Route: `?lesson=positivity-sensitivity`. Prerequisites: overlap and trimming.
This chapter uses ATT, whereas the preceding trimming experiment averages over
everyone in each retained/excluded group.

Misconception: a precise effect after trimming also determines the effect on all
treated patients, especially if retained and excluded groups look similar.
Takeaway: assumptions about the excluded effect can turn an overall benefit into
harm without changing the observed data. The opening states this purpose and the
slider asks whether more patients could recover without treatment.

Flow: read one fixed recovery example, predict whether the retained effect
generalizes, vary the excluded group’s untreated recovery count, and explain why more data
only from supported profiles cannot identify the missing effect. Sources,
arithmetic, and calendar-time considerations are optional disclosures.
The calculation uses native MathML for the weighted-average identity and current
numeric example. Terms align over two lines on phones, with the numeric example
stacked separately. The current calculation appears after the prediction.

Learner question: could the same observed recoveries be compatible with overall
harm? The interaction compares recovery with and without treatment for the same
target population, expressed as counts per 100 treated patients. Sixty are retained
and forty excluded. Filled dots mean recovery, hollow dots mean no recovery.
Their counts encode the group proportions, not identified individual outcomes.
Dot positions never pair a person's potential outcomes or assert who benefits.

The with-treatment column stays fixed at 36 + 24 = 60 recoveries. Without treatment,
controls support 24 retained recoveries. A slider inside the dashed missing-data
cell sets the assumed 0–40 excluded recoveries in steps of two. Only that cell and
the implied total change. At 38 assumed recoveries, learners see 60 with treatment
versus 62 without: two fewer recoveries per 100 under that assumption. The two
columns stay side by side on phones, with direct labels for observed, supported,
and assumed counts. Mathematical bounds remain in the optional calculation.

## Exact model

Y is binary recovery at a fixed follow-up time. S identifies a baseline-defined
retained group. P(S=1 | A=1)=0.6. Within S=1, treatment is exchangeable with the
potential outcomes and both treatments are possible. Recovery is 0.6 under
treatment and 0.4 without it, so ATT_retained=0.2. In S=0, everyone is treated
and observed recovery is 0.6. Consistency and no interference are assumed.

The unobserved recovery probability q=E[Y(0) | A=1,S=0] may be any value in [0,1].
For every q, a joint potential-outcome distribution exists, for example independent
Bernoulli potential outcomes conditional on S. The observed distribution is
unchanged across these worlds.

```
ATT_excluded = 0.6 − q                    in [−0.4, 0.6]
ATT_all = 0.6 × 0.2 + 0.4 × ATT_excluded in [−0.04, 0.36]
```

The slider starts at 16 of 40 recovering without treatment (q=0.4,
ATT_excluded=0.2, the equal-effects assumption). At 36 of 40, q=0.9,
ATT_excluded=−0.3 and ATT_all=0. No overall truth is selected or estimated.
Bounds are sharp for this stipulated model. They exclude sampling uncertainty.
There is no fitted propensity score, trimming threshold, or estimator ranking.
OWATT is linked as further reading and is not implemented.

## Validation

`src/positivity-sensitivity.test.js` checks independently calculated effects,
bound endpoints, the zero-effect threshold, valid probabilities, and distinct
complete potential-outcome worlds with identical observed data. Browser checks
cover the trimming link, topic/search/Contents discovery, prediction and practice,
unchanged observations, keyboard/touch controls, disclosure invariance, restart,
history, and desktop/phone light/dark layouts.

Run `npm test`, `npm run build`, and `npm run test:positivity` with the worktree's
server running. Learner comprehension and screen-reader listening require a
separate walkthrough.

Sources: [Yang & Ding (2018)](https://academic.oup.com/biomet/article/105/2/487/4930690),
[Petersen et al. (2012)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4107929/),
[Mack et al. (2013)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3659185/), and
[Liu et al. (2024)](https://pubmed.ncbi.nlm.nih.gov/39246144/).
