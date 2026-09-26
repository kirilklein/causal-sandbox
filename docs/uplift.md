# Uplift modelling track

The optional `?lesson=uplift` track uses one fictional reminder campaign to
separate purchase prediction from incremental benefit. Four steps share the
same customer groups: introduce uplift, compare targeting rules, estimate CATE,
and evaluate fixed rules on an independent randomized holdout. The core course
order stays unchanged. Contents, the topic browser, search, the concept map's
“An effect for whom?” entry, and the randomization lesson link to the track.

## Teaching and visual contract

The learner question is: **Which contacts create extra purchases?** The supported
inference is that ranking people by purchase probability can differ from ranking
them by incremental benefit. The paired probability chart keeps customer groups
fixed while highlighting the groups a policy contacts. Horizontal distance
between the no-contact circle and contact triangle represents uplift. Both
markers sit on one horizontal baseline. At equal probabilities, the triangle
fits inside the open circle at their shared position.

Before the example, the track defines uplift modelling and states the campaign's
goal: create extra purchases compared with sending no reminders. Each selected
rule explains what it ranks, including that purchase-based targeting ignores
whether contact helps. Answering the prediction selects that rule in the chart,
and the result leads with incremental purchases rather than attributed purchases.
Learners predict the better rule before changing budgets and worlds, then answer
a transfer question about attributed purchases. The first two steps explicitly
show simulator truth. Later steps use fitted estimates and independent evidence.
All methods, assumptions, and evaluation details are progressive disclosures.
The reference disclosure includes six research references and the small credit
“Inspired by Sandip D.” No author identity or original-post URL is inferred.

## Simulator and estimands

The target campaign contains four groups of 100 customers. Group membership is
measured before treatment. No-contact purchase probabilities are 0.10, 0.35,
0.65, and 0.95 for New visitors, Browsing, Returning, and Frequent buyers.

| World                        | Contact purchase probabilities |
| ---------------------------- | ------------------------------ |
| Frequent buyers benefit less | 0.10, 0.65, 0.72, 0.90         |
| Frequent buyers benefit more | 0.10, 0.36, 0.67, 0.99         |
| Contact changes nothing      | Same as no contact             |

These specify average response probabilities, not a joint distribution of both
potential outcomes. No individual “persuadable” label is inferred. CATE is the
within-group probability difference. Study outcomes are independent Bernoulli
draws conditional on group and arm, equivalent to a balanced randomized study
under independent sampling. Consistency, no interference, and transportability
from study to campaign are assumed. The example does not model noncompliance.

The purchase rule ranks by no-contact probability. The uplift rule ranks by the
contact-minus-no-contact difference. Ties use displayed group order. Budgets are
100, 200, 300, or 400 contacts, filled even if a group's effect is nonpositive.
The lesson explains that a real budget may be a ceiling. Random targeting uses
its expected allocation, spreading the contact fraction equally across groups.
All rules use the same budget and group composition.

## Estimation and independent evaluation

Each training/evaluation study has 400 independently sampled people per arm per
group (3,200 total). A saturated categorical T-learner estimates each arm's
purchase rate within each group. Its inputs contain only observed counts.
Missing arms are unavailable, never replaced with simulator probabilities.

Policies learned from training estimates are fixed before evaluation. For group
contact counts `c[g]`, the holdout estimates extra campaign purchases as
`sum(c[g] * (p1hat[g] - p0hat[g]))`, relative to contacting nobody. The variance is
`sum(c[g]^2 * (p1hat[g]*(1-p1hat[g])/(n1[g]-1) + p0hat[g]*(1-p0hat[g])/(n0[g]-1)))`.
The displayed intervals use estimate ± 1.96 standard errors. They concern
expected incremental purchases, not prediction intervals for realized campaign
counts, and condition on the training rule and fixed group composition.
Different policies share holdout data, so these are not intervals for pairwise
policy differences. Normal approximations can fail in small or sparse samples.

Training and holdout use separate reproducible seeds. Redrawing training changes
the fitted rules and hides previous evaluation. Redrawing the holdout leaves
training estimates fixed. Navigation and theme changes preserve controls and
draws. The introduction always shows its labelled opening example. Restart
restores all defaults and unanswered prediction/practice questions.

AUUC/Qini, other learners, observational identification, and costs appear as
conceptual extensions, not additional implemented estimators. The experiment
does not claim a universal ranking of algorithms or optimize net revenue.

## Validation

`src/uplift.test.js` checks hand-calculated contrasts and variances, allocation
constraints, missing comparisons, deterministic draws, and independent holdout
bias/coverage over 500 studies in each world. `tests/uplift-browser.mjs` checks
all four steps, prediction/practice feedback, keyboard controls, state retention,
reset, discovery, mobile overflow, themes, and reduced-motion operation. It saves
desktop/mobile screenshots for inspection. These checks do not establish learner
comprehension or screen-reader usability.
