# Making causal assumptions tangible

Issues #124–127 share an optional chapter at `?lesson=assumptions`. Direct links
use `&assumption=exchangeability`, `positivity`, `consistency`, or
`no-interference`. Contents, the recap's optional exploration card, the glossary,
and the positivity concept guide lead here. The core sequence and estimators
are unchanged. Each experiment assumes familiarity with treatment groups and
potential outcomes and can be read independently. Topic navigation resets controls.

## Learning objectives and exact teaching worlds

- Exchangeability: compare potential-outcome distributions under the same
  intervention across received-treatment groups, then condition on C. Four
  equally common C/U types have Y(0) = 2 + 4C + 4U and Y(1) = Y(0) + 2.
  Assignment uses p = 0.5, 0.2 + 0.6C, or 0.2 + 0.6U. The raw contrast is 2,
  4.4, or 4.4 respectively. C standardization recovers 2 only for measured
  selection. Under hidden selection C is perfectly balanced but conditional
  exchangeability fails. Population mass and potential outcomes stay fixed.
- Positivity: distinguish common options, rare options, and structural absence.
  Expected counts per 100 people in each C group use probabilities (0.5, 0.5),
  (0.05, 0.95), or (0.5, 1). These form a discrete known propensity distribution.
  Received-treatment weights invert those probabilities. Clipping to [0.10, 0.90]
  changes weights only; missing cells have no weight. No estimate is shown for
  an unsupported effect. Expected counts are not realized sample counts.
- Consistency: distinguish an unspecified label from one treatment version or
  a specified stochastic policy. Fictional scores are 50, 54, and 62 for no
  coaching, one session, and twelve sessions. A policy assigns twelve sessions
  with probability q and has expected score 54 + 8q. This averages over policy
  assignment, not a person's guaranteed outcome, and illustrates intervention
  definition rather than identification from an observational mixture.
- No interference: hold Alex's treatment fixed and change Sam's. Alex's score
  is 50 + 10 × own tutoring + 8 × peer tutoring × spillover. With spillover,
  the direct contrast is 10 but the neither-to-both allocation contrast is 18.
  These answer different questions. No clinical claims or fitted models are used.

## Validation and learning checks

The exact worlds are tested through identities, distributional comparisons,
invariance, empty support, policy endpoints, and direct/allocation contrasts.
Repeated-sample tests do not apply to deterministic population calculations.
`tests/assumptions-browser.mjs` covers controls, direct links, navigation,
keyboard/touch, disclosure invariance, themes, and narrow layouts.

For a learner walkthrough, ask why we compare the same potential outcome in both
groups, why balanced C can miss confounding, what remains missing after clipping,
what a policy average means, and whose treatment changed in each spillover
contrast. Automated checks do not establish comprehension or screen-reader
usability. Sources are linked inside each experiment and in the shared glossary.
