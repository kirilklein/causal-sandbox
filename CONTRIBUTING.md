# Contributing

Ideas, corrections, and code are all welcome. Open an [issue](https://github.com/kirilklein/causal-sandbox/issues/new/choose) first for anything larger than a small fix, so we can agree on scope.

## Setup

```sh
npm install
npm run dev
```

Before opening a PR:

```sh
npx prettier --write .
npm test
npm run test:browser   # needs a running dev server, see README
```

CI runs the same checks, plus a build.

## What a good PR looks like

- One topic per PR. A wording fix and a new lesson are two PRs.
- Lesson text is short. Every sentence should explain a concept, guide an action, interpret a result, or state a limitation. Put derivations and assumptions in optional detail.
- Statistical changes come with a test. One seeded sample cannot show that an estimator behaves a certain way; use the repeated-sample tests in `src/*.test.js`.
- UI changes are checked on a narrow screen and with the keyboard.

## Where things live

| Area                       | Files                                               |
| -------------------------- | --------------------------------------------------- |
| Lesson text and flow       | `src/lessons.js`, `docs/education.md`               |
| Simulation and estimators  | `src/simulation.js`, `src/lesson-simulation.js`     |
| TMLE                       | `src/tmle.js`, `src/tmle-lesson.js`, `docs/tmle.md` |
| Full sandbox               | `src/sandbox.js`, `docs/sandbox.md`                 |
| Glossary                   | `src/glossary.js`                                   |
| Colors and visual language | `docs/color-conventions.md`                         |
