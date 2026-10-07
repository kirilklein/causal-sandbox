# Comparable hospitals

First delivery of #309: `?lesson=did-adjustment`, after basic DiD, confounding,
and potential outcomes. The learner distinguishes selection on levels from
selection on untreated changes. The existing six-stage DiD lesson gains optional
regression and communication exercises and a link to this chapter.

## Storyboard and teaching review

1. Twelve stable hospital IDs have distinct starting rates: treated hospitals
   start at 30, 34, 38, 42, 46, and 50%; comparison hospitals at 50, 54, 58, 62,
   66, and 70%. Predict whether these differences invalidate DiD. Each hospital
   has its own small trajectory chart on a shared 0–100% scale.
2. Switch to changes: each hospital becomes one mark on a shared 0–50 pp axis.
   Rows identify hospitals; dashed lines show group means, and the bracket
   subtracts them. Change only the relationship between baseline capacity and
   untreated improvement: crude DiD moves from +15 to +20 pp.
3. Reveal capacity and regroup the same hospital marks. Each within-capacity
   contrast is +15 pp. Combine using treated shares 4/6 and 2/6. Switching views
   or regrouping never changes hospital identities or outcomes.

An optional stress test after adjustment adds a treated-only +10 pp shock,
raising adjusted DiD to +25 pp while truth remains +15 pp. This remains outside
the three-step main flow.

Visual review criteria: all mini charts share one recovery scale, all dot plots
share one change scale, and stable IDs connect both views. A dot represents a
measured change, never an assumed counterfactual. Vertical dot positions identify
hospitals and prevent overplotting; they do not encode outcome values. Group
means and within-profile contrasts use observed data only. Capacity bars encode
treated target shares. Truth remains separately gated. Static redraws also serve
reduced-motion users; no cosmetic motion implies that weighting changes outcomes.

This storyboard follows the issue's proposed order. Implementation review checked
that every encoding has a stated meaning and inspected desktop and phone
screenshots in light and dark themes. This is not a learner review. A newcomer walkthrough remains
pending: identify the target, assumption, and estimator; explain why a stable
baseline gap cancels; identify a failure that capacity adjustment cannot repair.

## Scientific contract

Records are hospitals, observed twice around one shared adoption date. The
comparison hospitals never adopt. Individual patients may differ across visits,
but within-hospital composition is stable. All hospitals have size 1,000 and are
weighted equally; the target is the average post-treatment effect across the six
treated hospitals. Unequal-size hospital/patient targets are deferred to #299.

The pure simulator and observed-data estimators in `src/did-adjustment.js` have
separate inputs. All calculations use risks. Records contain only ID, D, baseline
capacity, baseline/follow-up recovery, and size. Potential untreated follow-up
rates and the effect live in a separate truth object. Estimators never receive it.

The original hand-checkable fixture (with `variedBaselines: false`) has four
high/two low capacity treated hospitals and two high/four
low capacity comparison hospitals. Baseline is 40% versus 60%; the program adds
15 pp. Equal untreated improvement of 10 pp gives −5 pp follow-up association
and +15 pp crude DiD. Capacity-specific improvements of 20/5 pp give treated
change +30 pp, comparison change +10 pp, and crude DiD +20 pp. Both stratum
contrasts are +15 pp. Their treated shares 4/6 and 2/6 yield +15 pp.

The lesson uses `variedBaselines: true`: fixed offsets −10, −6, −2, +2, +6,
and +10 pp distinguish hospitals while preserving the original arm mean baselines
and every change contrast above. Offsets, identities, and adoption stay fixed
across scenarios. The unit tests retain both the original and varied fixtures.

Every treated hospital has weight 1/6. Each high-capacity comparison hospital
contributes 1/3 of the borrowed change; each low-capacity comparison hospital
contributes 1/12. These weights describe the stratified estimator; nuisance-model
fitting and model misspecification experiments belong to the second delivery.

A treated-only +10 pp shock raises adjusted DiD to +25 pp without changing the
program effect. All rates stay bounded. Missing arms, invalid risks, duplicate
IDs, and unsupported treated profiles fail explicitly. No clipping, dropping
of unsupported treated hospitals, or substitution of simulator truth occurs.

Identification requires conditional parallel untreated changes, comparison
support for treated profiles, no anticipation, consistency, no spillovers, and
stable composition. Measured balance and earlier trends cannot prove it.
Covariates must belong to the causal design: baseline capacity is distinct from
staffing changed by treatment. No sampling or inference claims are made.

## Basic DiD bridge

`didRegression` reconstructs the four observed means algebraically: intercept
is B at baseline, group coefficient is the baseline gap, period coefficient is
B's change, and interaction is DiD. The default coefficients in percentage-point
units are 60, −20, 10, 15. Fitted A follow-up is 65%; removing the interaction
gives the assumed, unobserved 50% counterfactual. Arbitrary supported means,
including assumption violations, are tested. No numerical solver is needed.

Optional prediction and director-facing choices distinguish algebraic equivalence
from causal interpretation. Attribution links to Scott Cunningham,
[Causal Inference: The Remix, §9.2](https://mixtape.scunning.com/08a-difference_in_differences#four-averages-and-three-subtractions).

## Validation and deferred work

Run `node --test src/did.test.js src/did-adjustment.test.js`, `npm test`,
`npm run build`, touched-file Prettier checks, and
`APP_URL=http://127.0.0.1:5199/causal-sandbox/ node tests/did-adjustment-browser.mjs`
with the worktree server running. Existing DiD browser checks protect its six
stages. The new checks cover fixed observations across analysis changes, truth
gating, keyboard/reset, discovery, themes, motion, and 360/390/1280px layouts.

Separate deliveries remain: outcome regression, ATT weighting, and DR with
observed-data fits and repeated-study robustness tests; then hospital-cluster
uncertainty after specifying its sampling target and inference procedure.

References: [Sant’Anna & Zhao (2020)](https://arxiv.org/abs/1812.01723);
[Roth et al. (2023)](https://www.jonathandroth.com/assets/files/DiD_Review_Paper.pdf).
