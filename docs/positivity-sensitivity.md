# Beyond trimming: who is still missing?

## Teaching contract

Route: `?lesson=positivity-sensitivity`. Prerequisites: overlap and trimming.
This chapter uses ATT, whereas the preceding trimming experiment averages over
everyone in each retained/excluded group.

Misconception: a precise effect after trimming also determines the effect on all
treated patients, especially if retained and excluded groups look similar.
Takeaway: excluded patients still contribute to the original ATT. Without their
counterfactual comparison, the overall effect needs further evidence or assumptions.

Flow: read one fixed recovery example, predict whether the retained effect
generalizes, vary an excluded-group effect assumption, and explain why more data
only from supported profiles cannot identify the missing effect. Sources,
arithmetic, and calendar-time considerations are optional disclosures.

The split strip widths encode shares of treated patients. The three effect tracks
share a fixed −40 to +60 percentage-point scale. A filled marker is the supported
effect; open markers are the assumed and implied effects. Range bars show logical
bounds, never uncertainty intervals. Labels preserve meaning without color.
Changing the assumption moves two markers while the evidence and ranges stay fixed.

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

The slider starts at ATT_excluded=0.2 (equal-effects assumption, q=0.4).
At −0.3, q=0.9 and ATT_all=0. No overall truth is selected or estimated.
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
