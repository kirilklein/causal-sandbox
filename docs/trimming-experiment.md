# Trimming experiment (#61)

The published chapter at `?lesson=trimming` follows [probability clipping](clipping-experiment.md).
It asks who the estimate describes after excluding people with extreme propensity
scores. The retained group’s IPW estimate is compared with its own truth; everyone
and the excluded group remain visible for context. An optional varying-effect
example shows how those truths can differ.

## Chapter and checks

Run `npm run dev -- --port 5173 --strictPort`, then open
[the trimming chapter](http://127.0.0.1:5173/causal-sandbox/?lesson=trimming).
The chapter ships in the production build, linked from clipping and Contents.
The old development preview URLs redirect to their respective chapters; their
calculation and interaction code now lives under `src/`.

With the server running, `npm run test:trimming` runs the repeated-sample study
and browser checks. Use `APP_URL` for another base URL. Browser checks also run
in `npm run test:browser`, against the built site in CI. CI runs the repeated-sample
study separately without a second development server. Screenshots are saved in
`test-results/`. Unit checks run with `node --test src/trimming-experiment.test.js`
and are included in `npm test`.

## Rule and estimands

`trimmingSample({ n = 400, seed = 4217, selection = 3, heterogeneous = false })`
starts in the existing constant-effect lesson world: C is the only common cause, the treatment effect
is 2, and the treatment model correctly adjusts for C. It returns `{ rows,
effects }`. Rows use the full observed sample's raw fitted propensities from
`fitClippingSample`; its existing outcome fit is unused here.

`trimmingResult(rows, effects, threshold = 0)` retains person i exactly when
`threshold <= rows[i].p <= 1 - threshold`. Both endpoints are included. The
threshold must be finite and in [0, 0.5]; zero retains everyone, and 0.5 retains
only exact scores of 0.5. The chapter uses steps of 0.001. Scores are compared
at full precision, never after display rounding.

The same fitted scores define membership and weights. Threshold changes never
refit either model or modify the remaining weights. Selection changes regenerate
treatment and outcomes using paired background draws, then refit. Redraw changes
the seed while retaining both sliders; restart restores seed 4217, selection 3,
and threshold zero, with constant effects and closed details. Browser-history
re-entry uses the same baseline. Reading details or changing theme preserves the
experiment. There is no threshold recommendation or optimization.

For each of everyone, retained, and excluded, the target is the average treatment
effect among that group's people. Simulation truth averages their paired
potential-outcome differences. The simulator is evaluated with the same noise
under treatment forced off and on; only observed data enter fitting. Group truth
never enters the trimming rule or estimate. Fitted-score-defined groups vary
across samples. With the default constant effect, all nonempty groups have truth 2.
The optional varying-effect world uses treatment effect `1 + C²`, with C uniform
on [-√3, √3]. Its population ATE is also 2 because E[C²] = 1. Each displayed truth
averages the effects among that sample group’s people, so it can differ from 2.
Trimming in the opening example retains profiles nearer C = 0 and lowers their
mean true effect. Toggling this world changes outcomes and individual effects;
it preserves covariates, assignments, fitted propensities, and trimming membership.
The unused outcome-model fit is not an estimator displayed in this chapter.

Each group's IPW is its weighted treated mean minus its weighted untreated mean.
The received-treatment weights are `1/p` and `1/(1-p)`; each mean divides by
that group's own arm-specific weight sum (Hájek normalization). No probability
clipping is applied. The shared fitter retains its numerical logit bound of ±30;
finite fitted scores do not certify convergence or adequate overlap.

The result returns original-row indices for retained and excluded membership,
group summaries, and raw-score histogram counts. Ten equal-width bins use
left-closed/right-open boundaries; the last includes 1. Each bin counts retained
and excluded people individually, even when the threshold cuts through it.
Bars stack those counts as percentages of the **original** treatment arm; the
axis and total bar heights stay fixed during trimming. Exclusion is hatched.

## Unavailable results

Empty groups have no estimate or defined mean truth. Single-arm groups retain
counts and simulation truth but cannot supply an IPW estimate. Non-finite
outcomes, endpoint scores of 0 or 1, and numerical overflow also yield
`available: false`, an explanatory `reason`, and `ipw: null` for the affected
group. Counts and truth remain available. A calculable excluded-group estimate
does not establish adequate treatment comparisons.

Invalid thresholds, treatment labels, or scores outside [0,1] throw `RangeError`:
they cannot define a valid partition. Truth must contain one finite effect per
row. Unexpected fitting failures propagate rather than silently changing methods.

## Validation

Unit fixtures verify independent hand arithmetic, subgroup denominators,
inclusive thresholds, within-bin splits, zero trimming, empty and single-arm
groups, endpoint scores, overflow, treatment reversal, and input preservation.
A heterogeneous fixture has retained truth 3 and excluded truth 4.5; their
size-weighted average equals everyone’s truth 3.75. Paired simulator outcomes
validate the constant-effect world separately. Zero trimming reconciles with
the existing unclipped IPW implementation.

`tests/trimming-study.mjs` fixes n=400, seeds 1000–1199, selection strengths
0.8 and 3, and thresholds 0, 0.01, 0.1, and 0.2. Each threshold reuses each
study's fitted rows. Error is measured against that sample's own subgroup
truth. The script reports mean error, error SD, RMSE, average group size,
unavailable counts, and individual improvements/harms for both subgroups.

Selected retained-group results across 200 studies:

| Selection | Threshold | Mean retained n | Mean error | Error SD | RMSE  | Improved / worsened vs everyone |
| --------- | --------- | --------------- | ---------- | -------- | ----- | ------------------------------- |
| 0.8       | 0         | 400.0           | 0.006      | 0.136    | 0.136 | —                               |
| 0.8       | 0.2       | 288.6           | 0.014      | 0.160    | 0.161 | 93 / 107                        |
| 3         | 0         | 400.0           | 0.156      | 0.553    | 0.574 | —                               |
| 3         | 0.1       | 167.7           | 0.008      | 0.215    | 0.215 | 158 / 42                        |
| 3         | 0.2       | 106.6           | 0.022      | 0.231    | 0.231 | 162 / 38                        |

All these retained estimates were calculable. Excluded estimates were unavailable
in 130/200 studies at selection 0.8, threshold 0.1, and 96/200 at selection 3,
threshold 0.01. At selection 3, threshold 0.1, all excluded estimates were
calculable, but their RMSE was 1.027. Reported errors omit unavailable estimates;
availability is reported separately, never counted as successful estimation.

These checks demonstrate both benefit and harm in this simulation. They do not
select an optimal threshold or establish improved accuracy for excluded people.
The opening sample remains seed 4217, and the page starts with no trimming.

Browser checks cover group values, histogram/threshold consistency, reversibility,
selection changes, redraw/restart, empty retained groups, keyboard/touch, links,
light/dark themes, and 320/390px and desktop layouts. Screen-reader listening and
new-learner comprehension remain untested.

The varying-effect tests independently check each potential-outcome difference
against `1 + C²`, unchanged assignments/scores/membership, subgroup truth arithmetic,
and deterministic restoration. Across 100 independent studies (seeds 2000–2099,
n=2,400, selection 3, threshold 0.1), retained IPW’s mean error relative to its own
group truth is below 0.05 in absolute value; the average retained truth is more
than 0.6 below everyone’s truth. This validates the intended contrast in this
world, not a guarantee about arbitrary trimming rules or fitted models.

Refitting after trimming, other estimators, uncertainty intervals, and automated
threshold selection remain outside this chapter.
