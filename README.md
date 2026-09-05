# Causal sandbox

**Change the world. Question the evidence.**

An interactive causal inference playground that runs entirely in your browser. Turn a causal dial, watch a fixed population of 2,400 people respond, and see which estimators recover the true effect — and which are fooled by confounders, colliders, and mediators.

**▶ Live demo: https://kirilklein.github.io/causal-sandbox/**

[![Causal sandbox screenshot](docs/screenshot.png)](https://kirilklein.github.io/causal-sandbox/)

## What you can do

- **Edit the causal world.** Sliders set every arrow strength in a DAG with treatment A, outcome Y, observed covariate block C (C₁, C₂), hidden confounder U, mediator M, and collider K.
- **Watch the data.** A scatter of outcomes by treatment arm updates live as the world changes.
- **Play analyst.** Choose which variables the analyst can see and which to adjust for.
- **Compare five estimators against the truth.** Raw association, naive regression, regression adjustment, IPW, and AIPW — with animated estimates and a truth marker.
- **Switch worlds:** Additive relationships · Outcome interaction · Treatment interaction · Interactions in both.
- **Choose model terms independently:** include main effects or add C₁ × C₂ to the outcome and/or propensity model.
- **Start from a preset:** Randomized · Observed confounding · Hidden confounding · Collider bias · Mediator adjustment.

The ground-truth effect is always known, so every estimate can be judged honestly. There is no backend and no data collection — the whole thing is a static page.

## Run locally

```sh
npm install
npm run dev
```

Open the address Vite prints. Other scripts:

| Command                | What it does                                                |
| ---------------------- | ----------------------------------------------------------- |
| `npm run build`        | Static site in `dist/`                                      |
| `npm run preview`      | Serve the built site                                        |
| `npm test`             | Statistical behavior checks (Node's built-in test runner)   |
| `npm run test:browser` | Playwright smoke test against a running dev server (Chrome) |

Pushes to `main` build and deploy to GitHub Pages via `.github/workflows/deploy.yml`.

## The causal world

C₁ and C₂ are independent uniform covariates on [-√3, √3] (mean zero, variance one). U and outcome/mediator/collider errors are independent standard normals. A fixed uniform draw assigns binary treatment:

```
S = 0.8*C1 + 0.6*C2
I = C1*C2
P(A=1) = sigmoid(-0.8 + ca*(S + ta*I) + ua*U)
M = am*A + eM
Y = direct*A + cy*(S + oy*I) + uy*U + my*M + eY
K = 0.9*A + 0.9*Y + eK
ATE = direct + am*my
```

| World                  | ta (treatment interaction) | oy (outcome interaction) |
| ---------------------- | -------------------------: | -----------------------: |
| Additive relationships |                          0 |                        0 |
| Outcome interaction    |                          0 |                      1.5 |
| Treatment interaction  |                        0.7 |                        0 |
| Interactions in both   |                        0.7 |                      1.5 |

The nonzero treatment intercept prevents symmetry from masking the effect of an omitted interaction. Bounded covariates reduce overlap problems at the default strengths; extreme sliders can still produce poor overlap. Setting `ca` or `cy` to zero disables that entire C path, including its interaction. Thus randomized and post-treatment presets still work in every world.

Switching worlds preserves the noise, causal strengths, visibility, adjustment, and model choices. Presets change causal strengths and adjustment while preserving the selected world and model choices. Reset restores the additive world and main-effects models.

C groups C₁ and C₂; both are observed or hidden together. C, M, and K can be hidden from the analyst. Hiding a selected variable removes it from adjustment. U is always unavailable to estimation, including when causal truth is revealed. Hiding truth conceals U and its graph paths; the total-effect reference remains visible.

## Estimators and limitations

`src/simulation.js` contains the equations and estimators, without statistics dependencies. Raw mean difference equals the naive OLS treatment coefficient for binary A; both ignore selected covariates by design. Regression uses a pooled OLS outcome model and averages predicted outcomes under treatment versus no treatment (standardization). IPW uses logistic propensity estimates and normalized (Hájek) weights. AIPW uses the same outcome predictions as regression and the standard augmented inverse-probability formula.

Each model has its own main-effects/interaction setting. Main effects include both C₁ and C₂ when C is adjusted for; the richer option additionally includes their product. Selected M and K enter as main effects. If C is absent from the adjustment set, neither model can use its members or product, regardless of the retained model preference. Only the outcome setting affects regression; only the treatment setting affects IPW; both affect AIPW. Raw and naive baselines ignore both settings.

These are low-dimensional parametric models fitted on the displayed sample, without cross-fitting or flexible machine learning. "Interaction included" describes a feature choice, not a guarantee of correct specification. Double robustness requires valid observed adjustment and sufficient overlap; it does not repair hidden confounding, post-treatment adjustment, or arbitrary propensity clipping. AIPW need not be closest in a particular finite sample.

Propensities are clipped to [0.02, 0.98]; clipping is disclosed in the interface along with weighted effective sample size. All results are finite-sample point estimates, not confidence intervals. A fixed 0.15 distance threshold provides descriptive coloring, not a statistical significance test. At strong confounding, limited overlap and clipping can leave substantial error even with a valid adjustment set.

The reference is always the total effect. With M adjusted for, regression can recover the direct effect when the outcome model represents the remaining relationships correctly. IPW/AIPW using post-treatment variables are invalid total-effect analyses and are not general direct-effect estimators. K is a post-outcome collider. The population plot uses a fixed outcome range [-14,18] and clamps rare values outside its bounds.

Built with Vite, vanilla JavaScript, SVG, and Canvas. Web fonts are optional; system fonts work offline.

## License

MIT

## Validation and inspiration

The tests compare all 16 world/model combinations across 40 independent seeds (100–139), separately from the displayed seed 4217. They verify average recovery when the relevant model is specified, nonzero bias when terms are omitted, hidden-confounding and post-treatment failures, and finite results at supported slider extremes. Independent samples are used to assess average bias; the test is not a bootstrap of one fitted population.

The browser test exercises all 20 world/scenario combinations, model-specific changes, C visibility, world-switch invariance, reset, and responsive layouts. To check a preview on another port:

```sh
APP_URL=http://127.0.0.1:5174/causal-sandbox/ npm run test:browser
```

The interaction experiment is inspired by [the binary TMLE notebook](https://github.com/kirilklein/corebehrt_phair/blob/core/notebooks/scripts/tmle_binary.py) and [the causal-estimation experiments](https://github.com/kirilklein/corebehrt_phair/blob/core/notebooks/scripts/causal_estimate_experiments.py). This app retains a continuous outcome and calculates its truth from the complete structural outcome equation. TMLE and flexible learner integrations remain separate future work.
