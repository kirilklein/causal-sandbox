# Progressive education delivery

The default experience is a sequence of small experiments. Levels 1–10 implement randomization → one common cause → inverse probability
weighting → outcome regression → mediator → collider → hidden confounding → model failure → double robustness → poor overlap.
The existing advanced sandbox is available through `?sandbox` as level 11.

Topic URLs (`?lesson=mediator`, for example) follow lesson identity. Legacy
`?level=5`, `6`, `7`, `8`, and `9` still open misspecification, double robustness,
mediator, collider, and hidden confounding, at their new displayed positions.
Numeric simulator IDs retain these original identities too. The optional revisit
uses `?lesson=double-robustness&revisit=hidden-confounding`.

The core target remains the population total effect. The mediator lesson asks
which effect we want: its adjusted estimate can recover the direct contribution
under the toy world's assumptions while missing the total-effect target. Moving
from hidden confounding to misspecification explicitly removes U and restores
observed C alone; the two nonlinear experiments reset each other. AIPW first
appears after those experiments. The optional revisit then connects model
robustness to the earlier missing-information limitation.

## Review boundaries

[Selective examples](selective-examples.md) records where concrete illustrations
can help while preserving the existing graph labels (#27).

[Color conventions](color-conventions.md) defines the agreed variable palette,
adjustment captions, and method/truth styling (#20), applied to the existing
lessons and sandbox. Equation highlights and the new lesson estimate plot remain
future work.

1. **First chapter (implemented, part of #8 and #11):** isolated lesson view,
   complete baselines, levels 1–3, one actual baseline variable, paired draws,
   independent redraw, IPW disclosure and a before/after balance comparison.
   Supersedes the optional dashboard guide proposed in those issues.
2. **Model reasoning (implemented, related to #10):** level 4 introduces outcome
   regression; levels 8–9 add curvature in the same C and independent model choices. Repeated simulations check separate
   failures and all four model combinations. Learner comprehension remains to be
   assessed; automated checks do not substitute for a new-learner walkthrough.
3. **Causal limitations (remaining #8) and overlap (#9):** levels 5–7 implement
   separate mediator, collider, and hidden-confounding experiments. Level 10
   implements poor overlap. Each returns
   to a correctly specified baseline. Introduce propensity histograms, weight
   concentration and per-arm effective sample sizes at level 10.
4. **Full sandbox (level 11):** available at any time and after overlap. Entry
   starts a separate experiment and introduces its two measured covariates and
   their interaction. Lesson settings are not transferred into this world.

Only implemented lessons appear in contents. Levels 1–10 now form a continuous
sequence; “Level N of 11” includes the final sandbox. No scores, completion gates, accounts or stored
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

In levels 1–4, 8, and 9, no C2, interaction, mediator, collider or hidden cause enters lesson
records or outcomes. Every entry/restart sets n=2400, seed=4217, effect=2, the level's selection
and outcome influence. Levels 1–3 start with adjustment off; levels 4–10 have
baseline adjustment on. Levels 5–6 reset post-treatment adjustment to off. All model choices and curvature strengths reset too. Navigation resets disclosure too.
Redraw increments the seed; all other experiment changes reuse the same draws.
Reading explanations changes neither state nor estimates.

Across 40 independent samples, tests check randomization with and without C's
outcome influence, confounding bias, IPW bias, balance, and clipping. They also
check structural absence of later mechanisms and deterministic setup. Browser
checks cover entry from a modified sandbox, restart, back/forward, contents,
keyboard and touch, mobile width, and explanation invariance.

## Model-reasoning contract

Level 4 reuses the level-3 confounded world with both models correctly specified.
It shows standardized outcome regression, IPW, and the familiar unadjusted
comparison beside truth immediately, with a short explanation of the predictions.
Level 8 starts with simple relationships and reduces selection to 0.8.
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

Level 9 fixes both relationships at their more complex settings and starts with
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
predictions, which relationship each method models, why the two level-8
experiments reset one relationship, and what double robustness does and does not
protect against. This comprehension walkthrough is still pending.

## Causal-role contract

Levels 5–6 explicitly return to the level-4 baseline (selection=1.2, simple
relationships and models, baseline health always included). They show only the
true total effect and familiar standardized outcome regression, with one switch
for the new variable. Graph captions state the adjustment set; nodes and arrows never change with
the switch. The world and draws stay fixed. Level 5 introduces the true breakdown;
level 6 removes the mediator before adding the collider.

```
Level 5: M = A + eM; Y = 2A + 1.5C + M + eY
         Total ATE = 3 = 2 direct + 1 mediated
Level 6: Y = 2A + 1.5C + eY; K = A + Y + eK
         Total ATE = 2; K is a score measured after the outcome
```

All errors are independent standard normals. C and treatment assignment retain
the baseline definition above. Only M enters level-5 records; only K enters
level-6 records. There is no hidden confounder. The outcome model optionally
includes M or K and holds it fixed in both treatment predictions. For this
specific additive mediator world this leaves the direct contribution of 2;
the lesson explicitly says this is not a general direct-effect identification
method. For the collider world the adjusted population regression coefficient
is (2 − 1) / 2 = 0.5: residualizing on C, conditioning on K explains half the
outcome noise and also absorbs treatment's contribution to the score.

Over 40 independent samples (seeds 100–139, n=2400), mean outcome-regression
estimates without/with the new variable are 2.985/1.993 for level 5 and
1.988/0.496 for level 6. Tests also check treatment interventions against the
known total effect, absence of unused mechanisms, fixed samples under analyst
changes, and agreement with the existing estimator's adjustment set.

Browser checks cover the transition from outcome regression in level 4, direct
entry, restart, back/forward, keyboard/touch, help invariance, fixed graph arrows,
and desktop/mobile rendering. Learner comprehension is still untested: ask why
M carries an effect, why K does not, and why including each changes the comparison
without changing the total effect we are trying to estimate.

## Hidden common cause (level 7)

Level 7 keeps measured baseline health C and adds binary, unmeasured smoking
status U. This is a fictional teaching example, not a model of smoking's actual
prevalence or effects. U is 1 for half the population and independent of C.
One strength slider s runs from 0 to 2 and controls both pathways:

```
P(A=1 | C,U) = sigmoid(-0.8 + 1.2*C + s*(U - 0.5))
Y = 2*A + 1.5*C + s*(U - 0.5) + error
Total population ATE = 2
```

The slider changes the world, keeping the same people, smoking status, and
underlying random draws. Treatment and outcome can change as the pathways grow.
Both fitted models always include C and never receive U. At zero strength,
the generating process reduces to the familiar level-4 baseline. Only IPW and
outcome regression appear beside truth on this first visit. AIPW and double
robustness are introduced at level 9. Its optional hidden-confounding revisit
reuses this simulator with all three methods visible; entry and restart restore
zero hidden strength and seed 4217. Returning restores the fixed complex world
with both models correct. Continuing restores the simple overlap baseline.

The graph always shows C and U in fixed positions. Dashed styling identifies U
as unmeasured; its pathways fade at zero, with text explaining that they are
inactive. There are no availability or reveal checkboxes. Reading explanations
does not change the experiment; restarting restores strength zero and seed 4217.

Tests use 40 independent samples at strengths 0, 0.5, 1, 1.5, and 2. Mean bias
increases across these strengths for all three methods, from absolute bias below
0.03 at zero to about +0.86 at strength 2. No analyst probabilities are clipped.
A diagnostic fit including both C and U keeps absolute mean bias below 0.06,
supporting the missing-information mechanism. That diagnostic is never exposed
to the learner's models. Tests also verify the equations, constant total effect,
fixed covariates and draws, and exclusion of U from analysis data. These checks
support a tendency across samples, not monotonic divergence in every sample.

Browser checks cover the slider by keyboard and touch, fixed graph and result
positions, explanation invariance, redraw, restart, direct/contents entry,
history, sandbox isolation, and phone layout. Learner comprehension remains
untested. The full sandbox link continues to start a separate experiment.

## Poor-overlap contract

Level 10 resets to the level-4 simple observed-confounding baseline: n=2400,
seed=4217, effect=2, selection=1.2, outcomeInfluence=1.5, adjustment for C,
no curvature, and correct additive outcome/logistic treatment models.
Two radio choices switch selection between 1.2 and 5 using the same exogenous
draws. IPW, outcome regression, AIPW, and the true population total effect remain
visible. Redraw changes the seed; entry, restart, and back navigation reset fully.

The propensity histogram uses the actual fitted probabilities before clipping,
ten equal-width bins (the last includes 1), and percentages within each arm on
identical axes. Weight diagnostics use the exact [0.02, 0.98]-clipped estimator
weights. For each arm, ESS is `(sum w)^2 / sum(w^2)`; concentration is the share
of total arm weight carried by the highest-weight `ceil(0.01 * arm size)` people.
These are descriptive diagnostics, not uncertainty intervals or causal-validity
thresholds. ESS does not measure the precise information of outcome regression
or AIPW. Clipping is reported and its possible bias explained; it does not restore
support. The generating probabilities remain nonzero under strong selection.

Across 40 independent seeds (100–139), moderate versus strong selection gives
mean untreated/treated ESS of 1291/460 versus 281/215. The top 1% weight shares
rise from 2.9%/6.2% to 17.6%/18.6%. Mean clipping counts rise from zero to 1337.
The across-sample standard deviations of IPW, regression, and AIPW increase from
0.051/0.048/0.052 to 0.144/0.070/0.097. Strong-selection IPW has mean bias about
1.14 with clipping; regression and AIPW retain small mean biases of -0.020 and
-0.026. These checks support the teaching contrast, not guaranteed failure in an
individual sample or protection from extrapolation. The correct outcome model is
intentionally retained.

Tests reconcile diagnostics with estimator weights, check equal weights, bin
edges and empty arms, and validate the repeated-sample contrast. Browser checks
cover direct entry, contents, restart, history, return from a modified sandbox,
help invariance, keyboard and touch controls, and desktop/mobile layout.
New-learner comprehension testing remains pending.

Reference: [Austin (2021), weighting and effective sample size](https://pmc.ncbi.nlm.nih.gov/articles/PMC9293235/).
