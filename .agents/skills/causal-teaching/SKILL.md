---
name: causal-teaching
description: Review and refine Causal Sandbox quiz questions and learner-facing explanations for causal clarity and unnecessary reading burden. Use for assessment wording, graph presentation, progressive terminology, or feedback design; not unrelated UI styling or estimator implementation.
---

# Causal teaching

Make causal reasoning the work the learner does. Keep the explanation needed to
understand the mechanism; remove reading and navigation that do not serve it.

Use the requested mode: give findings and proposed wording for a review; make
scoped edits when implementation is requested. Do not turn a wording pass into a
new curriculum, assessment route, or visual system.

## Establish the intended inference

Read the current question or lesson and its nearby flow. Use the repository's
`AGENTS.md` and relevant curriculum decisions in `docs/education.md`.

Identify the learner's question, the concept or misconception being tested,
the target effect/population, and what a correct answer would actually show.
Distinguish reasoning from a supplied graph from constructing a graph from a
story. Do not accidentally test the latter when the former is the objective.

For quiz work, inspect the answer key, distractors, follow-up routing, and related
lesson/final-quiz items. Similar concepts are useful; repeating the same scenario
and decision weakens the transfer check.

## Reduce burden without removing meaning

- For a supplied graph, show the target, graph, and short variable key. Let arrows
  carry relationships rather than repeating every arrow in a paragraph. Preserve
  accessible graph descriptions and any timing needed to interpret the question.
- Use short labeled rows for model specifications, probabilities, or treatment
  support. Keep the actual decision in one focused question.
- Keep conditions that distinguish the answer visible: for example, the total
  effect, graph completeness, an unmeasured common cause, or missing support.
  Put supporting conditions in an Assumptions disclosure available before the
  answer. Familiarity with causal terms is not permission to omit assumptions.
- Use ordinary language on early and recovery routes. Later questions can use
  established terms such as confounding, overlap, and consistency without
  redefining every method. Check the actual path; question number alone does not
  establish knowledge.
- Keep choices parallel and plausible. Avoid making the correct option the only
  long, cautious, or qualified answer. Preserve distinct misconception signals
  when shortening choices; check that the key remains uniquely defensible.
- Keep concrete mechanisms and necessary reasoning bridges. There is no universal
  word limit. Fewer words are useful only if the question is easier to comprehend.

## Fit feedback and entry to the purpose

For the entry assessment, preserve end-of-attempt explanations so feedback does
not teach the answer to a diagnostic follow-up. Keep practice distinct from the
original attempt. For lesson practice, immediate explanatory feedback can serve
learning; do not impose one feedback schedule on every activity.

Recommend specific topics from observed answers. Do not infer gaps in unasked
prerequisites or validated mastery from a short quiz. Keep experienced visitors'
direct routes to topics and the sandbox available. Do not assume experts will
complete placement; prerequisite order is not calibrated difficulty.

Use warm, direct result copy with clear next actions and a quiet practice marker.
Preserve the user's chosen tone without presenting a playful result as an
empirically validated ability classification.

## Check the revision

Explain the material changes with exact locations and replacement wording.
If editing, follow repository validation instructions, inspect desktop and narrow
layouts, and check keyboard access. Reuse the same question setup in assessment
and practice. When a key, choice meaning, or branch changes, check recommendation
and saved-attempt behavior; a wording-only edit need not reset progress.

Separate scientific correctness, functional checks, and evidence of learner
comprehension. Screenshots and reduced word counts do not validate placement or
prove an engagement benefit.

For concrete rewrites or feedback-timing evidence, read
[examples and evidence](references/examples-and-evidence.md). Treat those examples
as patterns, not mandatory wording or a frozen implementation.
