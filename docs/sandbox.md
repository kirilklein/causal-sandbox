# Full sandbox: scenarios and comparisons

The sandbox offers multiple reproducible scenarios: randomization, observed or hidden
confounding, collider, mediator, or instrument adjustment, four model-specification
comparisons, and poor overlap. Each has one question and a suggested action. Scenario selection
and Restart scenario restore all generating parameters, adjustment, and model
choices. Analytical changes mark the setup as Modified; reverting them clears that
status.

World and Analysis tabs separate generating mechanisms from fitted models. A
model choice selects a simple or more flexible form independently of the world.
Feedback beside each choice states whether it can capture the current C
relationship. Both forms can represent a simple relationship; extra flexibility
is unnecessary when the interaction is absent or its arrow strength is zero.
This feedback concerns C terms only, not hidden confounding, adjustment validity,
or overlap. Model details explain the interaction and specification terminology.

A scenario opens the tab containing its suggested action. Hidden-confounding,
instrument, and mediator scenarios expand their relevant pathway controls. The relationship
selector explains active interactions and identifies the specific zero-strength
path when an interaction is inactive. Further explanations remain in optional
details. The diagram starts collapsed on tablet and phone screens.

Adjustment choices sit directly above the estimate chart and remain available
in either tab. Results appear alongside the active controls on desktop. On smaller screens, the
controls precede results and sticky navigation provides a Results link. Model
selectors stack before they become cramped; phone chart labels sit above the
tracks. Tab navigation supports arrows, Home, and End without changing data.

The four displayed rows are unadjusted, regression adjustment, IPW, and AIPW.
Raw association and naive regression Y ~ A coincide for binary treatment and share
one row. The error axis stays at ±4 outcome units around truth. Hollow marks retain
each scenario's starting errors; solid marks show current errors. Off-scale errors
use arrows, while numeric estimates and signed errors remain visible. Error color
retains the fixed 0–2 outcome-unit scale used by the lessons. The truth card shows
the current total effect and its direct/mediated decomposition.

The sandbox uses fixed background draws for 2,400 people (seed 4217). C represents
both measured baseline variables C₁ and C₂. C, M, and K are available for
adjustment; the instrument scenario also makes Z available. U is unmeasured and
never available for adjustment. Observed outcome
clouds remain available in the results disclosure.

Links of the form `?sandbox&scenario=both-models` open a scenario's starting setup.
They do not serialize custom slider/model changes. Unknown scenario IDs fall back
to observed confounding. Guided lessons remain a separate experiment.

The optional [Graph lab](graph-lab.md) opens through **Build a graph**. It supports
small editable graphs in a separate workspace. Entering through this link saves
the full sandbox's current setup for the lab's return link; ordinary scenario
links still start at their defined baselines.

## Independent overlap experiment

Selecting Poor overlap opens an isolated experiment in place of the world/analysis workspace. Its only experiment
control is treatment selection strength, from 0 to 3. The additive world has a
true effect of 2 and C → Y strength 1.5, with both U and mediator paths off.
Both models always adjust for C₁/C₂ and are correctly specified. The card uses
its own fixed background draws for 2,400 people (seed 4217).

Outcome regression, IPW, and AIPW appear beside truth with signed differences.
The grouped histogram pairs an outlined untreated bar with a filled treated bar.
Weights and assumptions are in optional details. Increasing selection can
concentrate weights, but an individual estimate need not move farther from truth
at each step. Treatment/outcome can change; baseline variables, background draws,
and the total effect stay fixed.

Only the selected experiment is visible. Restart scenario resets overlap selection
strength to zero when Poor overlap is selected. Its slider leaves the main world
unchanged. Selecting another scenario starts that scenario from its defined
baseline. Opening details and changing theme preserve the active experiment.

## Diagnostics

The card reuses lesson 10's `overlapDiagnostics` with actual estimator outputs:

- Ten fixed bins on [0, 1], left-inclusive and right-exclusive except the last,
  which includes 1. Heights are percentages within each observed treatment arm,
  on one fixed 0–100% scale. Accessible chart labels include all bin counts and
  percentages. Scores are fitted probabilities before clipping.
- Each arm's clipping count and percentage use strict estimator boundaries:
  below 0.02 or above 0.98. Values at either boundary are not clipped.
- ESS is `(sum w)^2 / sum(w^2)`, using the actual clipped estimation weights.
  It describes weight concentration, not retained people or regression/AIPW
  precision. An empty arm reports ESS as unavailable.

The main sandbox retains its own current-fit warning and glossary help. The
warning appears if any probability is clipped or either arm's ESS is below 25%
of its size. The arm-specific threshold avoids masking concentration with a
pooled summary. It is a display heuristic, not a causal-validity cutoff.
The independent card is explicitly a different experiment, so its diagnostics
must not be interpreted as describing the main sandbox's model choices.

A fitted-score distribution cannot establish exchangeability or positivity.
See Hernán and Robins, [Causal Inference: What If](https://miguelhernan.org/whatifbook),
chapters 3 and 12 (including Fine Point 12.2). Existing estimator calculations and
lesson templates are unchanged.

## Validation

Run `npm test`, `npm run build`, and `npm run test:browser` against a running
server (`APP_URL` selects a non-default port). Focused tests cover clipping
boundaries, hand-computed per-arm ESS, empty arms, histogram accounting, and
non-mutation of estimator outputs. Browser checks reconcile the card's values
with the estimator and check independence, reset/navigation, keyboard/touch,
light/dark themes, phone chart width, model-selector alignment, complete scenario resets, starting
links, fixed error scales, and independent experiment state.

Automated checks and screenshots do not establish screen-reader usability or
learner comprehension; those walkthroughs remain pending.
