# Progressive education delivery

The default experience is a sequence of small experiments. Levels 1–8 implement randomization → one common cause → inverse probability
weighting → outcome regression → model failure → double robustness → mediator → collider.
The existing advanced sandbox is available through `?sandbox`.

## Review boundaries

1. **First chapter (implemented, part of #8 and #11):** isolated lesson view,
   complete baselines, levels 1–3, one actual baseline variable, paired draws,
   independent redraw, IPW disclosure and a before/after balance comparison.
   Supersedes the optional dashboard guide proposed in those issues.
2. **Model reasoning (implemented, related to #10):** levels 4–6 add curvature in
   the same C and independent model choices. Repeated simulations check separate
   failures and all four model combinations. Learner comprehension remains to be
   assessed; automated checks do not substitute for a new-learner walkthrough.
3. **Causal limitations (remaining #8) and overlap (#9):** levels 7–8 implement
   separate mediator and collider experiments. Levels 9–10 remain: unavailable
   confounders and overlap. Each returns
   to a correctly specified baseline. Introduce propensity histograms, weight
   concentration and per-arm effective sample sizes at level 10.
4. **Final sandbox integration:** level 11, a clean baseline and exact experiment
   transfer. The current two-covariate sandbox is an early escape route, not a
   representation of a beginner lesson. Its link starts a separate experiment.

Only implemented lessons appear in contents; “Level N of 8” avoids
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

In levels 1–6, no C2, interaction, mediator, collider or hidden cause enters lesson
records or outcomes. Every entry/restart sets n=2400, seed=4217, effect=2, the level's selection
and outcome influence. Levels 1–3 start with adjustment off; levels 4–8 have
baseline adjustment on. Levels 7–8 reset post-treatment adjustment to off. All model choices and curvature strengths reset too. Navigation resets disclosure too.
Redraw increments the seed; all other experiment changes reuse the same draws.
Reading explanations changes neither state nor estimates.

Across 40 independent samples, tests check randomization with and without C's
outcome influence, confounding bias, IPW bias, balance, and clipping. They also
check structural absence of later mechanisms and deterministic setup. Browser
checks cover entry from a modified sandbox, restart, back/forward, contents,
keyboard and touch, mobile width, and explanation invariance.

## Model-reasoning contract

Level 4 reuses the level-3 confounded world with both models correctly specified.
It reveals standardized outcome regression and collapses the familiar unadjusted
comparison. Level 5 starts with simple relationships and reduces selection to 0.8.
Its radio choices change the world, keeping both analyst models simple. A compact
plot compares the true relationship with predictions from the fitted model for
the selected experiment: untreated outcome or treatment probability. Solid and
dashed lines distinguish the two; redraw refits the model without changing truth.
The two misspecification experiments use:

```
P(A=1 | C) = sigmoid(-0.8 + 0.8*C + treatmentCurve*(C² - 1))
Y = 2*A + 1.5*C + outcomeCurve*(C² - 1) + error
```

The outcome experiment sets outcomeCurve=2, treatmentCurve=0. The treatment
experiment restores outcomeCurve=0 and sets treatmentCurve=0.9. Both retain the
same C, independent noises, and true population total effect of 2.

Level 6 fixes both relationships at their more complex settings and starts with
both models correctly specified. Two always-visible checkboxes independently
include or omit C² in the outcome and treatment models. AIPW is visible immediately;
the learner simplifies either model and then both, with a short explanation of
the current combination beside the estimates. There is no clickthrough sequence.
Model changes never change the world or sample. Restarts restore both flexible
models and the initial sample.
The advanced sandbox retains its separate two-covariate interaction features.

Tests use 40 independent seeds (100–139), n=2400, for each world and each model
combination. Mean bias with a correct relevant model is below 0.06 in absolute
value. With simple models, outcome-only curvature gives outcome-regression bias
about +0.168; treatment-only curvature gives IPW bias about −0.321. With both
curves omitted, AIPW bias is about +1.393. With either model correct, its absolute
mean bias is below 0.014. No fitted probabilities were clipped in these checks.
These finite-sample checks support the lesson contrasts, not a general proof of
consistency or a guarantee about any particular sample. Clipping is reported in
the lesson and its possible bias explained in optional details.

Browser checks cover disclosure, both world experiments, independent model
switches, explanation invariance, direct entry, restart, backward/forward
navigation, keyboard controls, and mobile layout for the model chapter.

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
whether to shorten, split or clarify the interaction in either chapter.
Automated browser checks do not establish learner comprehension.

For the model chapter, ask the learner to explain how outcome regression averages
predictions, which relationship each method models, why the two level-5
experiments reset one relationship, and what double robustness does and does not
protect against. This comprehension walkthrough is still pending.

## Causal-role contract

Levels 7–8 explicitly return to the level-4 baseline (selection=1.2, simple
relationships and models, baseline health always included). They show only the
true total effect and familiar standardized outcome regression, with one switch
for the new variable. Graph outlines show adjustment; arrows never change with
the switch. The world and draws stay fixed. Level 7 introduces the true breakdown;
level 8 removes the mediator before adding the collider.

```
Level 7: M = A + eM; Y = 2A + 1.5C + M + eY
         Total ATE = 3 = 2 direct + 1 mediated
Level 8: Y = 2A + 1.5C + eY; K = A + Y + eK
         Total ATE = 2; K is a score measured after the outcome
```

All errors are independent standard normals. C and treatment assignment retain
the baseline definition above. Only M enters level-7 records; only K enters
level-8 records. There is no hidden confounder. The outcome model optionally
includes M or K and holds it fixed in both treatment predictions. For this
specific additive mediator world this leaves the direct contribution of 2;
the lesson explicitly says this is not a general direct-effect identification
method. For the collider world the adjusted population regression coefficient
is (2 − 1) / 2 = 0.5: residualizing on C, conditioning on K explains half the
outcome noise and also absorbs treatment's contribution to the score.

Over 40 independent samples (seeds 100–139, n=2400), mean outcome-regression
estimates without/with the new variable are 2.985/1.993 for level 7 and
1.988/0.496 for level 8. Tests also check treatment interventions against the
known total effect, absence of unused mechanisms, fixed samples under analyst
changes, and agreement with the existing estimator's adjustment set.

Browser checks cover the transition from both models wrong in level 6, direct
entry, restart, back/forward, keyboard/touch, help invariance, fixed graph arrows,
and desktop/mobile rendering. Learner comprehension is still untested: ask why
M carries an effect, why K does not, and why including each changes the comparison
without changing the total effect we are trying to estimate.
