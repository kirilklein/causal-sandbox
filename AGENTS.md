# Repository instructions

## Finding the current work

- Check `git status --short --branch` and `git worktree list` before editing. The checkout named `causal-sandbox` may be an older feature branch; use the task's worktree, or start new work from freshly fetched `origin/main`.
- Read the relevant existing decisions: [curriculum](docs/education.md), [color conventions](docs/color-conventions.md), and [sandbox behavior](docs/sandbox.md). Verify implementation status against the current code before treating a planned item as implemented.
- Lesson display order differs from legacy numeric IDs. Use topic URLs (`?lesson=mediator`, for example) when referring to lessons; preserve existing URL compatibility when reordering.

## Educational content: no voda

- Every sentence must explain a concept, guide an action, interpret a result, or state a necessary limitation. Remove filler and repetition.
- Keep wording concise and natural without sacrificing scientific precision. Shorten long sentences when no meaning is lost.
- Limit visible text to the current learning objective. Put deeper explanations, equations, and assumptions in optional detail.
- Apply these rules to the app, documentation, and plans. Useful text can still overwhelm when too much is shown at once.
- Match explanation length to conceptual difficulty. State intuitive operations briefly; repeated text and examples can make a simple idea seem complicated and divert attention from harder ideas.
- Add examples when they resolve a likely misconception or explain a counterintuitive step, such as collider adjustment or TMLE targeting. Do not give every method the same amount of explanation or a worked example by default.
- Optional detail must add meaning too. Remove redundant explanation rather than merely moving it behind another disclosure.

## Work order

- Settle lesson order, objectives, prerequisites, and general flow before polishing wording or visuals.
- During structural work, change copy only where needed for correct transitions or scientific meaning.
- Reuse implemented lessons and existing PR work. Once the structure is settled, address wording, equations, colors, spacing, and result styling.

## Validation

- Use the existing npm commands and [browser setup](README.md#browser-checks). Browser tests need a separately running server from the worktree being tested.
- For statistical changes, check the estimand and identification assumptions separately from model specification. Reuse repeated-sample tests for claims about estimator behavior; one seeded example cannot establish a general ranking.
- For UI changes, inspect the affected lesson or sandbox on desktop and a narrow screen, including keyboard interaction. Automated smoke tests do not establish that the teaching flow is clear.
