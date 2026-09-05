# Progressive education delivery

The default experience is a sequence of small experiments. The first chapter
implements randomization → one common cause → inverse probability weighting.
The existing advanced sandbox is available through `?sandbox`.

## Review boundaries

1. **First chapter (this change, part of #8 and #11):** isolated lesson view,
   complete baselines, levels 1–3, one actual baseline variable, paired draws,
   independent redraw, IPW disclosure and a before/after balance comparison.
   Supersedes the optional dashboard guide proposed in those issues.
2. **Model reasoning (#10):** levels 4–6, after a new learner tries this chapter.
   Add curvature in the same C and independent model choices. Validate outcome-only
   failure, treatment-only failure, and all four model combinations before writing
   explanations. An overlap dashboard is not a prerequisite.
3. **Causal limitations (remaining #8) and overlap (#9):** levels 7–10 with separate
   mediator, collider, unavailable-confounder and overlap experiments. Each returns
   to a correctly specified baseline. Introduce propensity histograms, weight
   concentration and per-arm effective sample sizes at level 10.
4. **Final sandbox integration:** level 11, a clean baseline and exact experiment
   transfer. The current two-covariate sandbox is an early escape route, not a
   representation of a beginner lesson. Its link starts a separate experiment.

Only implemented lessons appear in contents; “Level N of 3 · First chapter” avoids
advertising unavailable navigation. No scores, completion gates, accounts or stored
progress. Later chapters and uncertainty are separate changes.

## Statistical audit and first-chapter contract

The existing outcome estimator already standardizes pooled outcome-model
predictions under both treatments. Existing sandbox worlds use two covariates and
interactions; they are unsuitable as beginner presets. The lesson simulator uses:

```
C ~ Uniform(-sqrt(3), sqrt(3))
P(A=1 | C) = sigmoid(-0.8 + selection*C)
Y = effect*A + outcomeInfluence*C + error
error ~ Normal(0,1), independent of C and the treatment draw
Total population ATE = effect
```

Level 1 sets selection and outcomeInfluence to zero and exposes only A and Y.
Level 2 sets outcomeInfluence to 1.5 and lets selection switch from 0 to 1.2.
Level 3 starts with selection 1.2 and fits logistic treatment assignment using C
when adjustment is enabled. Without C, IPW uses an intercept-only model and equals
the unadjusted difference. Weighted balance uses the exact weights from the
estimator, including its [0.02, 0.98] clipping policy.

No C2, interaction, mediator, collider or hidden cause enters lesson records or
outcomes. Every entry/restart sets n=2400, seed=4217, effect=2, the level's selection
and outcome influence, and adjustment off. Navigation resets disclosure too.
Redraw increments the seed; all other experiment changes reuse the same draws.
Reading explanations changes neither state nor estimates.

Across 40 independent samples, tests check randomization with and without C's
outcome influence, confounding bias, IPW bias, balance, and clipping. They also
check structural absence of later mechanisms and deterministic setup. Browser
checks cover entry from a modified sandbox, restart, back/forward, contents,
keyboard and touch, mobile width, and explanation invariance.

## New-learner walkthrough (pending)

Ask a learner with no causal-inference training to use the default page on their
usual device. Avoid explaining controls before they try them. Record where they
pause, ask for help, or interpret a result differently from the intended lesson.

After each level, ask:

1. Why can the randomized groups' outcome difference estimate the treatment effect?
   Why does redrawing change the answer?
2. What changed when baseline health started influencing treatment assignment?
   Why is the outcome difference now mixing two influences?
3. What is weighting trying to repair? Does it guarantee an exact answer in every
   sample? What does the balance comparison tell you?

Verify they can restart, return to a previous lesson, and open an explanation
without expecting the experiment to change. Use their explanations to decide
whether to shorten, split or clarify the interaction before adding levels 4–6.
Automated browser checks do not establish learner comprehension.
