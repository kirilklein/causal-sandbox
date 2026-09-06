# Simulation methods

The guided lessons use simplified data-generating processes described in the
[curriculum and learner walkthrough](education.md). This page describes the full
sandbox available through `?sandbox`.

## The causal world

C₁ and C₂ are independent uniform variables on [-√3, √3]. U and the error
terms are standard normal.

```
S = 0.8*C1 + 0.6*C2
I = C1*C2
P(A=1) = sigmoid(-0.8 + ca*(S + ta*I) + ua*U)
M = am*A + eM
Y = direct*A + cy*(S + oy*I) + uy*U + my*M + eY
K = 0.9*A + 0.9*Y + eK
ATE = direct + am*my
```

| World                  |  ta |  oy |
| ---------------------- | --: | --: |
| Additive relationships |   0 |   0 |
| Outcome interaction    |   0 | 1.5 |
| Treatment interaction  | 0.7 |   0 |
| Interactions in both   | 0.7 | 1.5 |

## Estimators

The full-sandbox estimators live in `src/simulation.js` and use no statistics
dependencies.

| Estimator       | Method                                                   |
| --------------- | -------------------------------------------------------- |
| Raw association | Difference in arm means                                  |
| Naive           | OLS on A alone                                           |
| Regression      | Pooled OLS outcome model, standardized over the sample   |
| IPW             | Logistic propensity, Hájek-normalized weights            |
| AIPW            | Regression outcome model + IPW propensity, doubly robust |

## Limitations

- The truth marker is the **total effect**. Adjusting for M or K is a
  post-treatment mistake, and the app lets you make it.
- Estimates are finite-sample point estimates on one fixed draw, with no
  confidence intervals. The 0.15 "close" threshold is a visual aid, not a test.
- Propensities are clipped to [0.02, 0.98]. The interface reports clipping and
  effective sample size.
- Double robustness protects against misspecifying _one_ of the two models. It
  does not protect against hidden confounding (U) or poor overlap.

The standalone [TMLE model-error preview](tmle-robustness.md) compares TMLE and
IPW under shifted and scaled model predictions.
