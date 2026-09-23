# The front-door criterion (#251)

The advanced lesson at `?lesson=front-door` follows hidden confounding. It is
registered in Contents, the topic browser, search, and the hidden-confounding
lesson's optional links. Core ordering is unchanged. Prerequisites: mediators
and hidden confounding.

**Takeaway:** a suitable mediator can identify the total effect despite hidden
treatment–outcome confounding. Measuring a mediator alone is insufficient.

The misconception is that front-door means adding M to an outcome regression
and interpreting the coefficient on A. The lesson instead makes the two averages
visible, retaining the mediated route in the total effect.

## Flow and visual meaning

1. Predict whether the observed tutoring/pass comparison identifies the effect.
   Two groups show 1,000 observed students with exact A/M/Y proportions.
2. Keep each student and split each tutoring group by practice. Regular practice
   rises from 20% to 70%; the grouping makes the observed counts visible.
3. Regroup by practice. Compare the two tutoring strata within each practice
   group, then reweight them to the population's 50/50 tutoring mix. Symbol area
   shows contribution to the average. The pass rates become 25% and 65%.
4. Reuse all observed records in two weighted copies: one with the practice mix
   under no tutoring, one under tutoring. Their pass rates are 33% and 53%.
   Explicitly reveal simulator truth to compare the reconstructed effect with it.
5. Change the graph or support and vary hidden treatment selection. A transfer
   question asks whether an app's direct hints invalidate using practice as a
   front-door mediator for its total effect.

Student marks persist across regrouping; their observed records never change.
Circles mean no tutoring, triangles mean tutoring; filled marks passed, hollow
marks did not. A keyboard-accessible student selector and mark clicks expose the
same observed tutoring → practice → outcome journey across stages. The final two
copies represent contributions to population averages, not individual futures.
Symbol area is proportional to weight within a panel; panel and subgroup sizes
are layout containers, not probability scales. Reduced-motion mode skips movement.

Only one stage is visible. Steps are freely navigable; predictions never gate
progress. The graph uses the existing A/M/Y/U palette, dashed unmeasured paths,
and fixed geometry. Effect results use the lesson result boxes: values and signed
differences in percentage points, the shared error tint, and a constant truth
background. Tint is computed in the model’s outcome units (risk), before converting
values to percentage points. Missing results remain explicitly unavailable.
The opening comparison stays neutral until truth is revealed.
Derivation, formal conditions, source, and model details start collapsed.

## Population and identification

The fictional binary model has independent background randomness:

- P(U=1)=0.5.
- P(A=1 | U)=0.5+s(U−0.5), with s from 0 to 0.8, initially 0.6.
- P(M=1 | A)=0.2+0.5A.
- P(Y=1 | M,U)=0.1+0.4M+0.3U.

Enumerating the population gives eight observed A/M/Y probability cells. Only
those cells enter `reconstructFrontDoor`. Hidden U and intervention truth never
enter the reconstruction. Exact enumeration isolates identification from
sampling variation and fitted-model error, which are explained in optional detail.

The starting observational pass rates are 24% and 62%. Standardized mediator
responses are 25% and 65%; reconstructed intervention risks are 33% and 53%.
The observed risk difference is 38 percentage points and the total effect is 20.

The direct-path world adds 0.15A to the outcome probability. The true effect is
35 points, while the reconstruction remains 20. The hidden-mediator-cause world
adds 0.2U to the mediator probability, invalidating both identification stages
at nonzero treatment selection. The support violation sets M=A, leaving two
required conditional outcomes undefined. The lesson reports Unavailable and
does not interpolate or substitute truth.

Each tutorial stage uses the baseline. Limit-experiment settings persist when
revisiting that stage; Restart resets the stage, world, selection, predictions,
practice answer, balancing, truth reveal, selected student, and disclosures. No study data are transferred to other lessons.

Source: [Pearl, Glymour & Jewell, Causal Inference in Statistics: A Primer,
§3.4](https://bayes.cs.ucla.edu/PRIMER/primer-ch3.pdf), definition and theorem 3.4.1.
The lesson uses the binary-outcome risk version of the front-door formula, not
a general claim that causal effects can be multiplied.

## Validation

`node --test src/front-door.test.js src/front-door-population.test.js src/search-index.test.js` checks hand-derived
population values, recovery across selection strengths, both graph violations,
missing support, unequal standardization weights, and discovery. The population
tests verify record preservation, weighted reconstruction, and mark area and bounds.
`APP_URL=... node tests/front-door-browser.mjs` checks navigation, displayed
calculations, keyboard controls, experiment state, reset, theme preservation,
persistent student marks, reduced motion, and desktop/390px/320px layout. It saves screenshots under `test-results/front-door/`.

Learner testing remains separate: ask a new learner why M is used without simply
blocking its path, why balancing compares within A, and what a direct A→Y path changes.
