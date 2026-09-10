# Choosing a learning route

The homepage keeps Learn / Explore / Build. Learn opens `?lesson=learn`, with
Start from scratch, Refresh & go deeper, and Find my starting point.
The topic browser is `?lesson=topics`. The quiz opens at `?lesson=quiz`;
`?quiz` is also accepted. Existing lesson, concept-page, and sandbox routes remain.

The browser groups questions about adjustment, methods/assumptions, and overlap.
Each group separates refreshers from advanced lessons, including deeper core
lessons. Helpful-background links explain prerequisites without restricting entry.
Contents now calls the additional chapters “Refreshers & advanced lessons”;
the propensity-score primer and assumptions experiments are labeled refreshers.

## Entry assessment

Eleven authored scenarios supply a deterministic route of two to six questions.
Results summarize correct answers out of questions answered, with separate
correct, review, and unsure states. The score describes this attempt; it does
not assign an ability tier or determine recommendations. The full path is:

1. E: distinguish a raw comparison from a causal effect.
2. G: choose adjustment for a total effect.
3. C: recognize that a pre-treatment variable can be a collider.
4. H: choose information that addresses an omitted common cause.
5. O: recognize unsupported extrapolation behind a precise effect estimate.
6. D: identify which estimators retain consistency with a correct outcome model.

| Question | Correct response               | Incorrect or unsure                                                   |
| -------- | ------------------------------ | --------------------------------------------------------------------- |
| E        | G                              | F: random assignment                                                  |
| F        | B: observational adjustment    | Finish: lesson 1                                                      |
| B        | G, or C if G was already asked | Finish: confounding                                                   |
| G        | C                              | Includes M: ask M. Neither/unsure: ask B if unseen; otherwise finish. |
| M        | C                              | Finish: mediator/total effect                                         |
| C        | H                              | K: concrete scholarship-selection question                            |
| K        | H                              | Finish: collider                                                      |
| H        | O                              | Finish: hidden confounding                                            |
| O        | D                              | P: weighting intuition                                                |
| P        | Finish: overlap                | Finish: IPW, then overlap                                             |
| D        | Finish                         | Finish: double robustness                                             |

The six-answer limit stops further questions, but the sixth answer always
contributes to the result. Every question includes “I'm not sure,” recorded
separately from incorrect options. Only two misses/uncertainties on E and F
suggest starting at lesson 1. Other errors suggest particular lessons.

G distinguishes omission of C from inclusion of M. Clarification success yields
mixed evidence rather than erasing the earlier response. Suggestions put relevant
prerequisite lessons first, show at most three initial cards, and link to the
answer that prompted each recommendation. Unasked prerequisites are background
links, never inferred gaps. Only the all-correct main path emphasizes advanced
exploration; all routes remain freely available on every result.

The first implementation uses prerequisite order for review cards rather than a
statistical weighting of misconception signals. The route and questions are
authored educational judgments, not a calibrated adaptive assessment.

## Feedback, navigation, and saved progress

Sources and explanations appear at the result so that feedback cannot give away
follow-up answers. Each answered question has a separate practice form that does
not modify the assessment answers, score, or recommendations. The score overview
counts only submitted questions, including on early exits. Numbered buttons use
✓ for correct answers and × for incorrect or unsure answers. Each button opens
its question's numbered explanation below the score; selecting it again or using
Close hides it. All explanations start closed, with at most one open at a time.
No empty score is shown before any answer. Continuing or restarting
after opening explanations is labeled practice.

Previous question and browser Back restore the prior selection. Submitting an
edited answer discards the superseded branch and recomputes suggestions. “Show
suggestions now” uses submitted answers only; an unsubmitted selection is not
counted. Exiting before answering offers the learning choices without placement.

The current attempt is stored in sessionStorage under
`causal-sandbox-entry-quiz-v2`, including the stable answer IDs, current view, choice
rotation, and whether explanations have been viewed. No answers go into URLs or
analytics. History entries preserve question views. Returning from a recommended
lesson or reloading restores the current attempt. The v2 key starts a fresh attempt after the September 10 item revision; answers
to the old scenarios are not scored against the new questions. Invalid or stale stored choices
are discarded at the first unreachable step. If storage is unavailable, the active
page and its history still work; persistence across page loads is unavailable.

## Questions and attribution

Graph questions show the target and a variable key beside the graph, rather than
repeating each arrow as prose. The graph's completeness and relevant timing stay
visible. Other conditions are explicit in an Assumptions disclosure, available
before answering and during practice. Model and treatment-support questions use
short labeled rows. Later questions use familiar causal terms without redefining
each method; reaching them is not treated as evidence that every prerequisite
has been mastered.

The first question offers direct links to topics and the sandbox. The quiz is
for visitors who want help choosing a starting point; experienced visitors do
not need a quiz result to enter. The all-correct route reaches a graph on question 2. Its ordering follows prerequisites, not empirically calibrated difficulty.

`src/quiz-questions.js` holds the exact stems, choices, keys, explanations, and
per-question source metadata. Questions are original drafts or revisions of the
existing local quiz prototype. None reproduces a numbered textbook exercise.
The earlier prototype worktree, including its separate mediator prediction
experiment, was left unchanged.

- [Hernán and Robins, Causal Inference: What If](https://miguelhernan.org/whatifbook): E and B; August 19, 2026 draft, sections 3.1–3.2 and 7.1.
- [Neal, Introduction to Causal Inference](https://www.bradyneal.com/Introduction_to_Causal_Inference-Dec17_2020-Neal.pdf): F, O, P; sections 5.1–5.2, 2.3.4, 7.6.
- [DAGitty covariate roles](https://dagitty.net/learn/graphs/roles.html) and [d-separation tutorial](https://dagitty.net/learn/dsep/index.html): G, C, K.
- [Huntington-Klein, The Effect, chapter 8](https://theeffectbook.net/ch-CausalPaths.html): M.
- [Funk et al. (2011)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3070495/) and [Bang and Robins (2005)](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1541-0420.2005.00377.x): H and D.

Item construction was informed by the
[NBME Item-Writing Guide, chapter 5](https://www.nbme.org/sites/default/files/2021-02/NBME_Item%20Writing%20Guide_R_6.pdf).
Sources were checked during planning on September 9, 2026; the Bang and Robins
reference was verified at abstract level. This does not make the questions
validated assessment items.

## Validation

`src/quiz-model.test.js` enumerates 287 complete answer paths and checks branch
recovery, distinct adjustment gaps, final-answer recommendations, editing,
untrusted saved answers, and attribution metadata. `tests/quiz-browser.mjs` covers
the entry chooser, early/advanced routes, question history, result restoration,
practice isolation, source disclosures, 320px touch/dark/reduced-motion layouts,
and unavailable or corrupt storage. It runs in `npm run test:browser`.

A content audit against current main and final-quiz PR #195 is recorded in
[the item review](entry-quiz-review.md). Independent scientific item review and a
learner think-aloud pilot remain pending.
Functional checks and screenshots do not establish comprehension, item difficulty,
or accurate placement. The pilot should investigate whether E/H/O can be answered
from wording cues and whether unfamiliar notation, particularly in G/C/D, creates
unnecessary difficulty. No advertised completion-time estimate is included.
