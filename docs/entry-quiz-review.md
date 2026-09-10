# Entry quiz item review — September 10, 2026

The entry quiz is suitable for suggesting places to start, with revisions below.
It is not sufficient to assign an ability level: each topic has little evidence,
short routes leave later topics unasked, and no learner response data establish
item difficulty or diagnostic accuracy. Keep recommendations optional and retain
“I’m not sure,” clarification branches, and explanations after the assessment.

Compared the uncommitted `feat/adaptive-learning` implementation with
`origin/main` at `7b38923` and [final-quiz PR #195](https://github.com/kirilklein/causal-sandbox/pull/195)
at `bc4007f`. The current local overlap item already used surgery versus
physiotherapy; an older planning note described bus passes. The local item was
the baseline for this revision.

## Item decisions

| Item                       | Assessment of the previous question                                                                                                                                                                                | Revision and diagnostic purpose                                                                                                                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E: confounding             | Tutoring is concrete, needs no notation, and distinguishes association from effect. A blanket “observational data cannot answer this” distractor is easy to reject but identifies a useful beginner misconception. | Retain the scenario and key. Use a neutral title. A correct answer alone does not establish adjustment competence; G probes that next.                                                                                                                                                                  |
| F: randomization           | A coin toss clearly separates independence from exact balance and equal individual effects. Unlike the lesson prediction, it asks about assignment rather than the observed estimate.                              | Retain; make the title match the coin-toss mechanism.                                                                                                                                                                                                                                                   |
| B: adjustment recovery     | The explicit assumptions make standardization valid, but “randomization required” repeats E's blanket objection.                                                                                                   | Replace that distractor with restricting to the most difficult pupils. This tests whether the learner preserves the population target. Retain within-difficulty comparisons averaged over the population distribution.                                                                                  |
| G: confounder and mediator | The course → skill → earnings story, graph, target, and adjustment options effectively repeat the final quiz.                                                                                                      | Use home size → insulation/heating bill, with heating use as mediator. Preserve the graph structure so the item still separates missing the confounder from blocking part of the total effect. This remains a parallel adjustment task; it is not an independent pre/post measure.                      |
| M: mediator recovery       | “What does total include?” could be answered as a vocabulary question without applying the concept.                                                                                                                | Ask whether savings from turning heating down count. The answer requires connecting a behavior caused by insulation to the target. Passing produces mixed evidence rather than erasing G.                                                                                                               |
| C: collider                | The alumni-event example is almost the final quiz's follow-up selection question, and both can be solved using a blanket “avoid post-treatment variables” rule.                                                    | Ask about pre-treatment sports-club membership on A ← P → K ← R → Y. Adjusting only for K opens a path; timing alone does not justify adjustment. The supplied complete graph is essential: real fitness could affect wellbeing through omitted paths. This is intentionally the harder collider probe. |
| K: collider recovery       | A question about “opening a path” depends heavily on graph vocabulary.                                                                                                                                             | Use a scholarship rule: qualify with at least 80 in either subject. Among winners below 80 academically, music must be at least 80. This tests selection reasoning without requiring d-separation terminology or asserting that selection creates causation.                                            |
| H: hidden confounding      | The stem gives away the unresolved path and then asks the same estimator-agreement question as the final quiz.                                                                                                     | Ask which research step supplies missing information: measure starting health in a cycling/sick-days study. Larger samples and flexible models of existing variables do not supply it. Measurement is a next step, not a guarantee of identification.                                                   |
| O: overlap                 | The surgery/physiotherapy example gives a clear unsupported prediction. It differs from the final quiz's “more data under the same policy” intervention. The unequal-sample-size distractor is weak.               | Retain the scenario and model-extrapolation target; replace the sample-size distractor with seeking a narrower interval. Keep the distinction between justified extrapolation and evidence supplied by observations.                                                                                    |
| P: weighting recovery      | Two untreated people with different treatment probabilities test the common confusion between propensity and observed treatment. The 80%/20% contrast is concrete.                                                 | Retain. This is a prerequisite probe after O, not a second measure of overlap. Getting P right never clears the overlap recommendation.                                                                                                                                                                 |
| D: double robustness       | Correct treatment model/wrong outcome model and finite-sample ranking repeat the final quiz's main decision.                                                                                                       | Reverse the model error and ask which estimators retain large-sample protection. Correct outcome regression and AIPW are supported; misspecified IPW is not guaranteed. Keep identification and estimation assumptions explicit.                                                                        |

The six-question main route remains E → G → C → H → O → D. All 287
complete routes remain reachable and bounded at six answers. G now records both
confounding and mediation as assessed topics. Recommendations still rely on
actual responses, not inferred failures in unasked prerequisites. Two early
misses suggest the foundations; they do not establish that randomization is the
only gap.

## Relation to lessons and the final quiz

The subsequent wording pass removes repeated graph narration, uses variable keys
and short rows for the supplied information, and keeps supporting conditions in
an Assumptions disclosure. Counting setup, prompt, and authored choices, the
initially visible text falls from 106 to 43 words for G, 122 to 55 for C, and 107
to 31 for D. Explanations remain after the assessment. Keys and branching are
unchanged. These reductions address reading burden; they do not establish that
comprehension or completion rates improved.

This follows the [NBME item-writing guide](https://www.nbme.org/sites/default/files/2021-02/NBME_Item%20Writing%20Guide_R_6.pdf)
principle of removing difficulty unrelated to the intended knowledge or skill.
Here, the intended skill is reasoning from a supplied causal structure; inferring
a graph from a long narrative would be a different assessment objective.

The revised questions apply the current curriculum's distinctions: assignment
versus realized balance, the population target, total versus mediated pathways,
causal roles versus timing, missing information versus model error, and support
versus precision. They do not add TMLE, longitudinal methods, or heterogeneity to
the entry test merely because those chapters exist.

The final quiz remains useful as practice after lessons: its graph, target, and
assumptions are explicit; first-answer scoring and later retries serve different
purposes. Its overlap scenario clearly separates structural missing support from
sample size. Its robustness and sensitivity items avoid equating an estimate
with truth. However, the agreement and sensitivity answers are the most qualified
options, so cautious wording can cue the answer. Six questions do not establish
mastery of the full curriculum. This review changes the entry quiz only.

The entry and final quiz share concepts intentionally. G still uses a parallel
adjustment structure, and both tests address model robustness. Seeing entry
explanations may therefore help on the final quiz. Do not interpret score changes
as an independent measure of learning.

Before combining the branches, reserve `?lesson=quiz` for the final quiz and give
the entry quiz its own route (for example, `?lesson=entry-quiz`). Both branches
currently use `src/quiz.js`, `src/quiz-questions.js`, and `tests/quiz-browser.mjs`;
rename the entry files and reconcile entry points, navigation, scripts, and docs
as part of that integration. Keep attempts separate and access ungated. This
content revision does not merge or resolve those feature conflicts.

## Evidence and remaining checks

Per-item sources remain attached in `src/quiz-questions.js`. The graph review
uses [DAGitty's d-separation rules](https://dagitty.net/learn/dsep/index.html),
including conditioning on a collider. The model distinction is consistent with
[Funk et al.'s discussion of doubly robust estimation](https://pmc.ncbi.nlm.nih.gov/articles/PMC3070495/).
These references support the concepts, not the quality or calibration of the
items themselves.

A learner think-aloud pilot should check:

- Can learners explain E/H/O without merely choosing the cautious answer?
- Can they map the five nodes in C without losing the research question?
- Does K recover intuitive selection reasoning when C was missed?
- Does the population wording in B distinguish targeting from adjustment errors?
- Can learners justify D without guessing from the method names?

Record reasoning and completion burden as well as answers. Revise or simplify C
if its reading load dominates the causal distinction. The source-backed content
review and functional tests do not substitute for that pilot.

Validation for this revision: the full unit suite passed, followed by a focused
nine-test routing recheck after the assessed-topic change. The production build,
touched-file Prettier checks, and `git diff --check` passed. The focused Chrome
quiz suite passed, including legacy-attempt isolation, keyboard interaction,
history, practice, and storage recovery. All eleven items were checked for
horizontal overflow at 1280px and 320px; screenshots of the longer revised
questions were inspected. The full browser suite was not rerun. The in-app
browser was unavailable, so visual checks used local Chrome.
