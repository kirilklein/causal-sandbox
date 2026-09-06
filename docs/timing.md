# What timing tells us

Optional chapter at `?lesson=timing`, linked from Contents and the collider lesson.
Prerequisites: common causes, mediators, colliders, and the total-effect target.
Core lesson order and legacy numeric URLs are unchanged.

## Timeline explorer

A and Y stay fixed while the learner places a neutral V before treatment, between
A and Y, or after outcome. Native radio choices support click, tap, and keyboard;
V also supports pointer dragging and arrow keys. A drag commits on release into
a region. Escape, pointer cancellation, loss of capture, and an invalid drop
restore the previous placement. Only V disables touch scrolling.

Start before A with no example selected. A temporal conclusion and selectable
roles describe possibilities, not an inferred graph. Selecting an example shows
its graph and explanation. V retains its name and neutral fill across roles.
Changing the time window clears the example; selecting the current window keeps
it. The main timeline has three nodes; collider examples add necessary causes.

| Window          | Examples offered                                          | Temporal exclusion                             |
| --------------- | --------------------------------------------------------- | ---------------------------------------------- |
| Before A        | Confounder, instrument, outcome predictor, collider       | V cannot mediate this treatment's effect.      |
| Between A and Y | Mediator, outcome predictor, affected by A only, collider | V cannot cause the earlier treatment decision. |
| After Y         | Affected by A only, affected by Y only, collider          | V cannot cause earlier A or Y.                 |

These examples are neither exhaustive nor mutually exclusive. All example graphs
include A → Y. The confounder adds V → A and V → Y; the instrument adds only
V → A; the outcome predictor adds only V → Y. The instrument world stipulates
no shared cause of V and Y and no route to Y outside A. A mediator adds
A → V → Y. Treatment-only and outcome-only consequences add A → V or Y → V.

The collider examples are A ← P → V ← R → Y before A,
A → V ← U → Y between A and Y, and A → V ← Y after Y. In the middle example,
U precedes V and Y and is explicitly unmeasured. P and R precede the baseline
collider. Graph positions are diagram layout; the selected window specifies V's
temporal position. The timeline remains the time axis.

The compact desktop layout puts a small example graph beside its explanation;
phones stack them. The optional overview summarizes the three windows. Timestamp
and assumption explanations remain separate disclosures.

## Baseline-collider simulation

Selecting the before-A collider reveals the P → K ← R example and a small
experiment. V is the referral score K. All P, R, and K exist before treatment.

```
P, R ~ independent Uniform(-sqrt(3), sqrt(3))
K = P + R + 0.5 * score_noise
Pr(A=1 | P) = sigmoid(1.5 * P)
Y = 2*A + 1.5*R + outcome_noise
```

The noises are independent standard normal variables. The constant total effect
is 2. P predicts treatment but is independent of potential outcomes, so the
unadjusted comparison is unconfounded. Conditioning on K connects P and R,
opening the noncausal path A ← P → K ← R → Y.

`timing-simulation.js` reuses `makeNoise` and the existing outcome-regression fit
in `estimate`. It compares fits with A alone and A plus K on the same 2,400
people. Truth never enters either fit. The checkbox changes the displayed fit;
it changes neither data nor graph. The estimate card uses the existing fixed
error color scale and reports the numerical difference from truth.

The default seed 4217 gives 2.009 without K and 1.105 with K. Across 40 independent
seeds 100–139, means are 1.992 and 1.088. Independent population covariance
calculations predict an adjusted regression limit of about 1.097. These checks
support the simulated bias; the page does not promise that every redraw worsens
the estimate. It describes the observed direction for the current sample.

Redraw increments the sample seed and retains the checkbox choice. Moving to a
new time window clears the role and checkbox but retains the current simulated
sample. Returning to a baseline-collider example reuses that sample. Changing
examples within a window preserves the checkbox. Restart and fresh entry restore
before-A, no example, seed 4217, no K adjustment, and closed disclosures.

## Boundaries and validation

The temporal rules assume causes do not act backward in time and the health
states are correctly ordered relative to one defined treatment decision. A late
recording can describe an earlier condition; a measurement before today's dose
may reflect previous treatment. Timing cannot establish a sufficient adjustment
set, instrument validity, or the absence of hidden confounding.

Unknown causal relevance remains [#82](https://github.com/kirilklein/causal-sandbox/issues/82);
there is no “X = non-contributing” category. Repeated treatment remains
[#79](https://github.com/kirilklein/causal-sandbox/issues/79), with survival later.
References: [DAGitty causal roles](https://dagitty.net/learn/graphs/roles.html) and
Hernán and Robins, [Causal Inference: What If](https://miguelhernan.org/whatifbook).

Unit tests independently reconstruct both OLS estimates from centered covariances
and compare repeated samples against the population formula. Browser checks
cover all example edge sets, fixed A/Y locations, mouse and touch dragging,
cancellation, keyboard controls, simulation values, unchanged graph on adjustment,
redraw/restart, disclosure invariance, navigation/history, and 320px light/dark
layouts. Use `npm test`, `npm run build`, and `npm run test:browser` with `APP_URL`
pointing to this worktree's server.

Learner comprehension and screen-reader listening remain untested. Ask whether
placing V before A proves confounding, whether a baseline collider is possible,
and whether a late diagnosis proves late onset. Ask why adjusting for K changes
the estimate without changing the true effect.
