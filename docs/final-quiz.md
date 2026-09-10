# Final course quiz

`?lesson=final-quiz` opens eight fixed challenges after the core course, linked
from the recap and Contents. The entry quiz stays at `?lesson=quiz` (and `?quiz`)
with its existing saved attempts. The final quiz does not require optional
chapters or gate any content.

Built from main at `126c656`, borrowing PR #195's first-answer scoring and
feedback/retry distinction. It does not import that branch's mediator prediction
or replace the entry quiz. Main's graph renderer is shared by both assessments.

## Item design

Apply the [entry quiz review](entry-quiz-review.md): concrete scenarios, an explicit
target, concise facts, complete accessible graphs, optional assumptions, and
plausible alternatives with misconception-specific feedback. Avoid repeating entry
stems or relying on the longest, most cautious option as the answer. Graphs show
relationships needed for the decision; they are not extra controls. No redundant
visible arrow lists or invented completion-time estimates.

| Item                        | Decision after the course                                                                   | Difference from entry assessment                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Alternative adjustment sets | Find two separate places to block the same backdoor path while preserving mediation.        | Multiple sufficient sets, not just confounder versus mediator.                      |
| Selective follow-up         | Explain why dropping a collider column does not undo sample restriction.                    | Conditions on the sample after randomization, not just covariate inclusion.         |
| Standardization             | Compute 2.5 for the population versus 3 using the treated mix.                              | A numerical target-population decision; all required group information is supplied. |
| AIPW correction             | Recognize a persistent −2 correction when the outcome-model limit is 4 and the effect is 2. | Uses the estimator's correction, not naming which estimator is consistent.          |
| TMLE                        | Interpret a converged residual equation without concluding exchangeability.                 | Connects the fitted targeting step to unresolved hidden confounding.                |
| Support                     | Choose a defensible narrower population target.                                             | Changes the research question rather than simply identifying extrapolation.         |
| Sensitivity                 | Distinguish a stable sign from an unstable practical decision.                              | Applies a threshold to a supplied sensitivity range; not a confidence interval.     |
| Competing stories           | Recognize no shared adjustment choice across confounder and mediator graphs.                | Tests causal uncertainty separately from estimator agreement.                       |

These are original scenarios, not reproduced textbook exercises. Per-item sources
are in `src/final-quiz-questions.js`, exposed after answering. Conceptual sources:
[DAGitty's d-separation tutorial](https://dagitty.net/learn/dsep/index.html),
[Hernán & Robins](https://miguelhernan.org/whatifbook),
[Bang & Robins](https://pubmed.ncbi.nlm.nih.gov/16401269/),
[van der Laan & Rubin](https://doi.org/10.2202/1557-4679.1043), and
[Petersen et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC4107929/).
DAGitty, Bang & Robins' abstract, and Petersen were checked for this revision;
TMLE also follows the implemented course's targeting explanation. The DOI's
full text was unavailable during this pass.

## Attempt and feedback behavior

One point per correct first submission, including an explicit unsure option.
The next question opens after a submission; wrong answers do not block progress.
Immediate feedback explains the chosen option and the causal reasoning. Previous
question restores the first answer, locked; explicit retries are practice and do
not overwrite it. Results start with explanations collapsed and open one item at
a time. Review links open in new tabs to preserve the active attempt. A new attempt
after viewing feedback is labeled practice.

Attempts remain in memory, as in #195. The introduction explicitly says leaving
or reloading starts over. The entry quiz's session storage and course progress are
separate. No new analytics events, environment variables, secrets, dependencies,
or backend are introduced. Existing optional site integrations are unchanged.

The score describes these eight decisions. It does not certify mastery, estimate
an ability level, or provide an independent pre/post learning measure. Feedback
can help with later questions, intentionally. A think-aloud pilot should check
whether graph reading, numerical burden, or answer cues dominate the intended
reasoning; difficulty and educational effectiveness remain uncalibrated.

## Validation

Unit tests exercise every choice and retry against immutable first-answer
scoring, question metadata, and target versus treated-population averaging.
`tests/final-quiz-browser.mjs` covers all items, recap and Contents navigation,
entry-attempt isolation, feedback, back/retry/results behavior, reset, keyboard,
touch, light/dark themes, and desktop/320px layouts. It is included in the existing
browser command. Functional tests do not establish learner comprehension.
