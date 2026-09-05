# Full sandbox: results and overlap

The main comparison appears at the top right on desktop and first on mobile:
truth and all five estimates precede adjustment/model controls and outcome
clouds. Laptop browser checks require all five estimates above the fold. Bars
and markers use the same fixed 0–2 outcome-unit error scale as the lessons,
blending from neutral to red with increasing absolute error. Signed errors stay
visible below the estimates. Truth uses the constant outcome-blue background.
The independent overlap card uses the lesson background tints for its estimates.

The sandbox starts a separate experiment with fixed background draws (2,400
people, seed 4217). C represents both measured baseline variables C₁ and C₂;
the lesson's single C is not transferred. Entry and Reset world use the existing
additive, observed-confounding baseline with no adjustment. Reset also restores
variable visibility, display of U, and both main-effects models. Start the lessons
returns to the first lesson.

Variable availability controls sit directly above adjustment, in the estimates
card. They change which variables can enter the analysis, not the simulated
population. The “Show hidden factor U” switch changes only U and its arrows in
the diagram. Its label is stable and its on/off state is visible; U remains
unavailable to the analyst, and neither the total effect nor estimates change.

## Independent overlap experiment

A separate card asks what happens when overlap gets worse. Its only experiment
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

Main sandbox controls and Reset world leave the card unchanged. Its slider and
Restart experiment leave the main sandbox unchanged. Restart restores selection
strength zero. Entering the page resets both experiments. Opening details and
changing theme preserve both experiments.

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
light/dark themes, phone layout and visibility of the main comparison on laptops.

Automated checks and screenshots do not establish screen-reader usability or
learner comprehension; those walkthroughs remain pending.
