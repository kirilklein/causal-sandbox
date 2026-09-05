# Causal sandbox

**Change the world. Question the evidence.**

An interactive causal inference playground that runs entirely in your browser. Turn a causal dial, watch a fixed population of 2,400 people respond, and see which estimators recover the true effect — and which are fooled by confounders, colliders, and mediators.

**▶ Live demo: https://kirilklein.github.io/causal-sandbox/**

[![Causal sandbox screenshot](docs/screenshot.png)](https://kirilklein.github.io/causal-sandbox/)

## What you can do

- **Edit the causal world.** Sliders set every arrow strength in a DAG with treatment A, outcome Y, observed confounder C, hidden confounder U, mediator M, and collider K.
- **Watch the data.** A scatter of outcomes by treatment arm updates live as the world changes.
- **Play analyst.** Choose which variables the analyst can see and which to adjust for.
- **Compare five estimators against the truth.** Raw association, naive regression, regression adjustment, IPW, and AIPW — with animated estimates and a truth marker.
- **Start from a preset:** Randomized · Observed confounding · Hidden confounding · Collider bias · Mediator adjustment.

The ground-truth effect is always known, so every estimate can be judged honestly. There is no backend and no data collection — the whole thing is a static page.

## Run locally

```sh
npm install
npm run dev
```

Open the address Vite prints. Other scripts:

| Command                | What it does                                                   |
| ---------------------- | -------------------------------------------------------------- |
| `npm run build`        | Static site in `dist/`                                         |
| `npm run preview`      | Serve the built site                                           |
| `npm test`             | Statistical behavior checks (Node's built-in test runner)      |
| `npm run test:browser` | Playwright smoke test against a running dev server (Chrome)    |

Pushes to `main` build and deploy to GitHub Pages via `.github/workflows/deploy.yml`.

## The causal world

Independent standard-normal C, U, and outcome/mediator/collider errors; a fixed uniform draw assigns binary treatment:

```
P(A=1) = sigmoid(ca*C + ua*U)
M = am*A + eM
Y = direct*A + cy*C + uy*U + my*M + eY
K = 0.9*A + 0.9*Y + eK
ATE = direct + am*my
```

C, M, and K can be hidden from the analyst. Hiding a selected variable removes it from adjustment. U is always unavailable to estimation, including when causal truth is revealed. Hiding truth conceals U and its graph paths; the total-effect reference remains visible.

## Estimators and limitations

`src/simulation.js` contains the equations and estimators, without statistics dependencies. Raw mean difference equals the naive OLS treatment coefficient for binary A; both ignore selected covariates by design. Adjusted regression fits an additive OLS model. IPW uses logistic propensity estimates and normalized (Hájek) weights. AIPW uses separate arm-specific OLS outcome models and the standard augmented inverse-probability formula.

Propensities are clipped to [0.02, 0.98]; clipping is disclosed in the interface along with weighted effective sample size. All results are finite-sample point estimates, not confidence intervals. A fixed 0.15 distance threshold provides descriptive coloring, not a statistical significance test. At strong confounding, limited overlap and clipping can leave substantial error even with a valid adjustment set.

The reference is always the total effect. With M adjusted for, regression recovers the direct effect in this specific linear model. IPW/AIPW using post-treatment variables are invalid total-effect analyses and are not general direct-effect estimators. K is a post-outcome collider. The population plot uses a fixed outcome range [-14,18] and clamps rare values outside its bounds.

Built with Vite, vanilla JavaScript, SVG, and Canvas. Web fonts are optional; system fonts work offline.

## License

MIT
