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

## Adjustment experiments

Every selected world shows the same true-total-effect and estimate cards, an
“Adjust for V” checkbox, and a redraw button. The two outcome-regression fits
use the same 2,400 people with A alone or A plus V. Truth never enters either
fit. Adjustment changes neither the sample nor the graph; the card retains the
existing fixed error scale and signed difference from truth.

The total effect is 2 in every world. In the mediator world, the direct and
mediated contributions are each 1. Adjusting does not change the displayed target
to the direct effect. The interpretation below the card distinguishes the causal
path from the numerical error in one sample.

`timing-simulation.js` reuses `makeNoise` and `estimate`. P and R are independent
standardized uniform variables; U and every noise term are independent standard
normal variables. A is randomized with probability 0.5 except where stated:

| World                    | Equations                                        | Adjusted regression limit |
| ------------------------ | ------------------------------------------------ | ------------------------- |
| Confounder               | V=P; Pr(A=1)=sigmoid(1.5V); Y=2A+1.5V+eY         | 2                         |
| Instrument               | V=P; Pr(A=1)=sigmoid(1.5V); Y=2A+eY              | 2, with less precision    |
| Outcome predictor        | V=P; Y=2A+1.5V+eY                                | 2, with more precision    |
| Mediator                 | V=A+eM; Y=A+V+eY                                 | 1                         |
| Affected by A only       | V=2A+eM; Y=2A+eY                                 | 2, with less precision    |
| Affected by Y only       | Y=2A+eY; V=Y+eK                                  | 1                         |
| Collider before A        | V=P+R+0.5eK; Pr(A=1)=sigmoid(1.5P); Y=2A+1.5R+eY | About 1.097               |
| Collider between A and Y | V=A+U+0.5eK; Y=2A+1.5U+eY                        | 0.8                       |
| Collider after Y         | Y=2A+eY; V=A+Y+eK                                | 0.5                       |

All unadjusted limits are 2 except the confounder world. These limits describe
these particular additive worlds, not every distribution compatible with a DAG.
The baseline collider retains its original simulation: seed 4217 gives 2.009
without V and 1.105 with V. Repeated estimates and independent covariance
calculations validate the limits; a single redraw need not follow the bias ranking.

“Compare across repeated samples” runs 60 paired studies with seeds 100–159.
It reports each fit's mean and empirical standard deviation (SD), reusing
`studySummary` from the instrument chapter. Smaller SD means more precision;
it does not imply less bias. Nonfinite fits are counted and excluded explicitly.
The batch yields between studies and is cancelled when the role or window changes
or the chapter restarts. It does not replace the current sample. Redrawing,
toggling adjustment, and opening disclosures preserve the batch summary.

Redraw increments the sample seed and retains adjustment. Selecting a different
example resets adjustment and closes the example-specific disclosures and batch
view, while retaining the seed. Moving to another time window clears the selected
role and batch; selecting the current window preserves them. Worlds with identical
arrows (the predictor and treatment-only consequence) use identical equations
across their compatible windows. Restart and fresh entry restore before-A, no
example, seed 4217, no adjustment, and closed disclosures.

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
and compare repeated samples against analytic limits for all worlds, including
precision gains and losses. Browser checks also cover repeated-study summaries
and cancellation when changing examples, all example edge sets, fixed A/Y locations, mouse and touch dragging,
cancellation, keyboard controls, simulation values, unchanged graph on adjustment,
redraw/restart, disclosure invariance, navigation/history, and 320px light/dark
layouts. Use `npm test`, `npm run build`, and `npm run test:browser` with `APP_URL`
pointing to this worktree's server.

Learner comprehension and screen-reader listening remain untested. Ask whether
placing V before A proves confounding, whether a baseline collider is possible,
and whether a late diagnosis proves late onset. Ask why adjusting for V changes
the estimate without changing the true effect.
