# Double ML: orthogonal scores and cross-fitting (#304)

Optional chapter at `?lesson=double-ml`, after TMLE. It separates three ideas
that the AIPW and TMLE lessons leave implicit: double robustness, orthogonality,
and cross-fitting. Code: `src/double-ml.js` (estimation), `src/double-ml-view.js`
(SVG), `src/double-ml-lesson.js` (page).

## Statistical contract

- **Target.** The average treatment effect `E[Y(1) − Y(0)]`, identified by
  `E[m1(C) − m0(C)]` under consistency, no interference, exchangeability given C,
  and positivity. No partially linear model is assumed; the residual-on-residual
  coefficient is not used.
- **World.** The curved AIPW world (`lessonBaseline(6)`) at n = 600:
  `Y = 2A + 1.5C + 2(C² − 1) + e`, `logit P(A = 1 | C) = −0.8 + 0.8C + 0.9(C² − 1)`,
  C uniform on ±√3. True ATE = 2. There is no hidden confounding, and every C has
  both arms.
- **Learners.** `m̂a`: mean outcome of the k nearest same-arm people on C
  (k = 1–40). `p̂`: share treated among the 60 nearest people,
  clipped to `[0.02, 0.98]`. Ties keep the earlier row.
- **Estimators.**
  1. Plug-in: `mean(m̂1 − m̂0)`, with nuisances fitted on all rows. It gets no
     interval.
  2. AIPW score without cross-fitting: nuisances fitted and evaluated on all rows.
  3. AIPW score with 5-fold cross-fitting: each row's nuisances come from the
     other four folds.

  For both scores,
  `ψ = m̂1 − m̂0 + A(Y − m̂1)/p̂ − (1 − A)(Y − m̂0)/(1 − p̂)`, the estimate is
  `mean(ψ)`, and the SE is `SD(ψ)/√n` with a normal 95% interval.

- **Failure paths.** Shape errors (k < 1, k above the training size, fewer than
  two folds) throw. Too few people in an arm or training set returns
  `status: "unavailable"` with a reason and no fallback.

## Teaching claims and evidence

| Claim in the lesson                                                  | Evidence                           |
| -------------------------------------------------------------------- | ---------------------------------- |
| Smoothing biases the plug-in; the score removes most of it           | k = 40 row below                   |
| Without cross-fitting, a flexible learner's intervals are too narrow | k = 1–3 rows                       |
| Cross-fitting restores near-nominal coverage across k                | crossFit columns                   |
| A cross-fitted prediction never uses its own outcome                 | Unit test that perturbs Y_i        |
| Orthogonality is not a guarantee                                     | Last row: both models oversmoothed |

## Validation

400 studies per row (seeds 31000–31399). Bias is shown with its MCSE in
parentheses. "SE / SD" compares the average reported SE with the spread of the
estimates.

| Setting                | Plug-in bias   | No-CF bias     | No-CF coverage | No-CF SE / SD | CF bias        | CF coverage | CF SE / SD    |
| ---------------------- | -------------- | -------------- | -------------- | ------------- | -------------- | ----------- | ------------- |
| k = 1                  | +0.001 (0.006) | +0.001 (0.006) | 64.8%          | 0.058 / 0.123 | −0.014 (0.008) | 93.3%       | 0.149 / 0.155 |
| k = 2                  | +0.007 (0.006) | +0.002 (0.006) | 81.5%          | 0.085 / 0.117 | −0.010 (0.007) | 95.5%       | 0.134 / 0.134 |
| k = 3                  | +0.014 (0.005) | +0.006 (0.006) | 88.3%          | 0.092 / 0.111 | −0.006 (0.006) | 96.5%       | 0.128 / 0.127 |
| k = 5                  | +0.031 (0.005) | +0.010 (0.005) | 91.3%          | 0.098 / 0.109 | −0.004 (0.006) | 95.5%       | 0.124 / 0.120 |
| k = 10                 | +0.086 (0.005) | +0.018 (0.005) | 94.0%          | 0.104 / 0.107 | −0.001 (0.006) | 95.8%       | 0.124 / 0.120 |
| k = 20                 | +0.218 (0.006) | +0.031 (0.005) | 94.5%          | 0.113 / 0.108 | +0.003 (0.006) | 96.8%       | 0.133 / 0.124 |
| k = 40                 | +0.490 (0.007) | +0.054 (0.005) | 95.8%          | 0.135 / 0.110 | +0.014 (0.007) | 98.8%       | 0.162 / 0.132 |
| k = 40, propensity 120 | +0.490 (0.007) | +0.155 (0.006) | 75.3%          | 0.119 / 0.111 | +0.214 (0.006) | 64.8%       | 0.134 / 0.117 |

How to read it:

- **k = 1 without cross-fitting.** Every residual is exactly zero, so the score
  equals the plug-in. Its bias is small here because 1-NN is nearly unbiased, but
  the reported SE is under half the true spread.
- **Large k.** Cross-fitted SEs are conservative (coverage 97–99%).
- **The last row.** Both nuisances are oversmoothed, so the product of errors is
  no longer small. Every estimator is biased, which is why the lesson says
  orthogonality bounds bias by a product of errors rather than removing it.

The lesson shows 200 studies per setting (seeds 31000–31199).
`src/double-ml.test.js` checks these claims on 300 seeds, with MCSE-based
tolerances.

## Presentation

- **Order.** Prediction, then plug-in vs score (orthogonality). Section 2
  ("Can a model grade its own homework?") follows, in three steps that share one
  cross-fitting toggle: a five-block fold schematic (train vs predict, or one model
  that trains on and predicts everyone); a zoomed outcome-vs-C plot of one fixed,
  typical person's 1-neighbour fit and residual (30 nearest untreated people, 15
  on phones); and everyone's residuals (spread 0.00 without cross-fitting). The
  toggle is the only control: every person shows the same pattern, so a person
  selector would add movement without teaching anything. Then repeated intervals,
  and one static chart of coverage against k: without cross-fitting coverage
  falls as the learner gets more flexible; cross-fitted stays near 95%. A card separates double robustness, orthogonality and
  cross-fitting, and a limits paragraph covers hidden confounding and overlap.
  Equations and learner settings sit in a closing `<details>`.
- **Charts.** Estimates sit on a fixed 1–3.2 axis with one dashed truth line.
  Each row shows only the method and its bias; a bias over max(0.1, 3 MCSE)
  turns red with a red gap from truth to the mean. SD sits in the tooltip. Intervals use the shared `intervalPlot` zoomed to 1.2–2.8, so their widths are comparable; each readout shows only the coverage, red below 90%, with SE against spread in the details. Arms
  follow `--arm-0` circles and `--arm-1` triangles. Off-scale estimates use
  `--error-mark`.
- **Interaction.** Repeated studies run only on request and are cached per k.
  The cross-fitting toggle works from the keyboard.

## References

- Chernozhukov, V. et al. (2018). Double/debiased machine learning for treatment
  and structural parameters. _The Econometrics Journal_ 21(1), C1–C68.
- DoubleML documentation, “The basics of double machine learning”.
- Kennedy, E. H. (2023). Semiparametric doubly robust targeted double machine
  learning: a review. arXiv:2203.06469.
- Causal Wizard, “Double ML” (topic inventory only; claims checked against the
  sources above).
