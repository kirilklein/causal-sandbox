# Examples where they help

Agreed direction for [#27](https://github.com/kirilklein/causal-sandbox/issues/27):
keep the general labels and use concrete examples selectively to explain a causal
mechanism. A single medication story is not required across the curriculum.

## Labels and placement

Keep Treatment (A), Outcome (Y), Baseline health (C), and the existing role labels
in graphs. Do not add a second set of example labels, including small grey text or
parenthetical subtitles. Extra labels compete with the experiment for attention.

Put a short example in the relevant lesson explanation, where learners can open
it without changing the experiment. Start with mediator and collider examples;
add others only when a learner walkthrough reveals a specific difficulty.
The existing smoking example in hidden confounding can remain local to that lesson.

| Lesson                                              | Use of examples                                                                                                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Randomization and confounding                       | Keep the current general labels and explanation; no additional story by default.                                                                                              |
| IPW and outcome regression                          | Worked patient rows can explain weights and predictions using the existing variable names. They do not require a named medication or disease.                                 |
| Mediator                                            | Use a brief illustration of an intermediate change that carries part of the treatment effect to the outcome. State that it occurs after A and before Y.                       |
| Collider                                            | Use a brief illustration of later care use influenced by treatment and the already-measured outcome. State that it occurs after Y and cannot change that earlier outcome.     |
| Hidden confounding and revisit                      | Retain the existing unmeasured smoking example and its fictional assumptions. Do not impose it on other lessons.                                                              |
| Model specification, double robustness, and overlap | Reuse the established variables; add no new story just to accompany a new method or limitation.                                                                               |
| Full sandbox                                        | Preserve its explicit separate world with two observed covariates and a continuous hidden cause. Do not silently substitute the lesson's single C or binary smoking variable. |

## Scientific checks for the copy pass

The mediator example must fit A → M → Y alongside A → Y and the measured common
cause C. The implemented toy world has M = A + error and
Y = 2A + 1.5C + M + error: total effect 3, direct contribution 2. A clinical
illustration must not turn these invented values into treatment evidence or imply
that adjusting for a mediator generally identifies a direct effect.

The collider example must fit A → K ← Y, with K measured after Y. The implemented
K = A + Y + error is a continuous score. “Later care use” can illustrate this
mechanism; it does not make K a literal visit count. Avoid “hospitalization” alone:
it could suggest a binary event, selection into the study, or care that changes
the outcome, none of which is the current experiment.

These contracts were checked against `simulateLesson` and `lessonResult` in
[`src/lesson-simulation.js`](../src/lesson-simulation.js), the lesson graphs in
[`src/lessons.js`](../src/lessons.js), and the separate sandbox equations in
[`src/simulation.js`](../src/simulation.js) at main `c6653db`.

## Relationship to colors and worked formulas

[#20](https://github.com/kirilklein/causal-sandbox/issues/20) can define consistent
colors for the existing variables independently of example selection. Graphs and
formulas should share variable colors; estimator results need a separate method
convention and a clearly labeled truth reference. Retain text labels so color
is never the only way to distinguish a role. The palette remains to be chosen.

[#17](https://github.com/kirilklein/causal-sandbox/issues/17) can reuse patient rows
across weighting, outcome prediction, and AIPW without a curriculum-wide story.
Keep actual simulated values distinct from explicitly illustrative arithmetic.

This decision completes the example-policy step. Adding and checking the short
lesson examples remains part of the explanation copy pass; no app copy changes
are included here. Check scientific meaning, visible text volume, and learner
comprehension before adding more examples.
