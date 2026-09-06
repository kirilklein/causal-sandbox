# Contributing

Ideas, corrections, and code are all welcome. Open an [issue](https://github.com/kirilklein/causal-sandbox/issues/new/choose) first for anything larger than a small fix, so we can agree on scope.

## Setup

```sh
npm install
npm run dev
```

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `npm run build`        | Build the static site in `dist/`                 |
| `npm run preview`      | Serve the built site                             |
| `npm test`             | Run statistical checks for lessons and models    |
| `npm run test:browser` | Run browser smoke tests against a running server |

Before opening a PR:

```sh
npx prettier --write .
npm test
npm run test:browser   # needs a running server; see Browser checks below
```

CI runs the same checks, plus a build.

Pushes to `main` deploy to GitHub Pages.

### Browser checks

After installing dependencies, start the server in the worktree being tested:

```sh
npm run dev -- --port 5173 --strictPort
```

In another terminal in the same worktree, run `npm run test:browser`. The tests
use `http://127.0.0.1:5173/causal-sandbox/` and local Google Chrome. `--strictPort`
prevents Vite from silently moving to another port and leaving the tests pointed
at a different checkout.

For another port, set `APP_URL` to the full base URL, including
`/causal-sandbox/`, when running the tests. To use Playwright's bundled Chromium
instead of Chrome, run `npx playwright install chromium`, then
`CI=1 npm run test:browser`. CI tests the built site; reproduce that with
`npm run build` and `npm run preview -- --port 5173 --strictPort` in place of the
development server.

## What a good PR looks like

- One topic per PR. A wording fix and a new lesson are two PRs.
- Lesson text is short. Every sentence should explain a concept, guide an action, interpret a result, or state a limitation. Put derivations and assumptions in optional detail.
- Statistical changes come with a test. One seeded sample cannot show that an estimator behaves a certain way; use the repeated-sample tests in `src/*.test.js`.
- UI changes are checked on a narrow screen and with the keyboard.

## Where things live

| Area                       | Files                                                                     |
| -------------------------- | ------------------------------------------------------------------------- |
| Lesson text and flow       | `src/lessons.js`, `docs/education.md`                                     |
| Simulation and estimators  | `src/simulation.js`, `src/lesson-simulation.js`, `methodology/index.html` |
| TMLE                       | `src/tmle.js`, `src/tmle-lesson.js`, `docs/tmle.md`                       |
| Full sandbox               | `src/sandbox.js`, `docs/sandbox.md`                                       |
| Glossary                   | `src/glossary.js`                                                         |
| Colors and visual language | `docs/color-conventions.md`                                               |
