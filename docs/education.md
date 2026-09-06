# Progressive education delivery

The default experience is a sequence of small experiments. Levels 1–11 implement randomization → one common cause → inverse probability
weighting → outcome regression → mediator → collider → hidden confounding → model failure → double robustness → TMLE targeting → poor overlap.
The existing advanced sandbox is available through `?sandbox` as level 12.

An optional [clipping chapter](clipping-experiment.md) follows Poor overlap at
`?lesson=clipping`. Compare estimates before and after probability clipping while
retaining the sample and fitted models. An optional comparison caps weights
directly, with clipping and capping mutually exclusive. It is linked from Contents and after
overlap, with a new 400-person sample and an unclipped starting point.

[Trimming](trimming-experiment.md) follows clipping at `?lesson=trimming`, also
linked from Contents. It separates everyone, retained, and excluded people and
compares each IPW estimate with its own group’s truth. The optional varying-effect
world shows how trimming can change that truth. Each chapter restores its own
baseline on entry; samples and controls are not transferred between chapters.

An optional [instruments and adjustment chapter](instruments.md) follows the
core journey at `?lesson=instrument`. It introduces Z, its precision cost when
included in adjustment, and a follow-on hidden-confounding strength experiment. The
chapter is linked from Contents and after overlap; it does not introduce an IV
estimator or change the existing lesson sequence.

An optional [What timing tells us chapter](timing.md) is available at
`?lesson=timing`, linked from Contents and the collider lesson. It follows the
mediator/collider material without interrupting Continue through the core lessons.
A movable V explores three time windows with fixed A/Y and selectable example
graphs. The baseline-collider example adds a simulation comparing outcome
regression before and after adjusting for the referral score K.
Repeated treatment is deferred to [#79](https://github.com/kirilklein/causal-sandbox/issues/79).

Topic URLs (`?lesson=mediator`, for example) follow lesson identity. Legacy
`?level=5`, `6`, `7`, `8`, and `9` still open misspecification, double robustness,
mediator, collider, and hidden confounding, at their new displayed positions.
Numeric simulator IDs retain these original identities too. TMLE uses the new
ID 11 at displayed position 10; overlap retains ID 10 at position 11. The optional revisit
uses `?lesson=double-robustness&revisit=hidden-confounding`.

Linear progression through Continue is the default. A quiet Contents toggle stays
closed on every screen size. When opened, it groups lesson links into Foundations
(1–4), Causal roles (5–7), and Models and limitations (8–11), followed by the
sandbox. The Contents control sits in the left margin, aligned with its panel, and uses
a panel icon whose chevron indicates opening/closing. The panel opens without
moving the lesson, and
scrolls independently on smaller screens. The current lesson is marked for
orientation; the menu supports deliberate skipping and reference.
Selecting a lesson resets its baseline and focuses its heading. Opening Contents
preserves the experiment. Clicking outside closes it; Escape closes it and
returns focus to the toggle.

The core target remains the population total effect. The mediator lesson teaches
that M must stay out of the adjustment set to retain its contribution to that
effect. Optional model details explain the separate controlled-direct-effect
question and the assumptions needed to identify it. Moving
from hidden confounding to misspecification explicitly removes U and restores
observed C alone; the two nonlinear experiments reset each other. AIPW first
appears after those experiments. The optional revisit then connects model
robustness to the earlier missing-information limitation.

## Review boundaries

Match explanation length to conceptual difficulty. Keep intuitive operations
brief; examples should resolve a likely misunderstanding, not make every method
equally elaborate. Collider adjustment and TMLE targeting warrant more explanation
than predicting outcomes and averaging differences. Remove repetition from optional
details as well as the initial screen.

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
   separate mediator, collider, and hidden-confounding experiments. Level 11
   implements poor overlap. Each returns
   to a correctly specified baseline. Introduce propensity histograms, weight
   concentration and per-arm effective sample sizes at level 11.
4. **Full sandbox (level 12):** available at any time and after overlap. Entry
   starts a separate experiment and introduces its two measured covariates and
   their interaction. Lesson settings are not transferred into this world.

Only implemented lessons appear in contents. Levels 1–11 now form a continuous
sequence; “Level N of 12” includes the final sandbox. No scores, completion gates, accounts or stored
progress. Later chapters and confidence intervals are separate changes.

## Sampling variation (IV prerequisite, PR A)

Placement in levels 1–2 is provisional. Keep the current presentation while final
curriculum placement and visibility remain a later decision.

Levels 1 and 2 offer an optional “Compare repeated studies” view, closed on
entry. It reuses the existing unadjusted difference and independent seeded draws
at n=2400. Both “Repeat study” and “Redraw sample” add one study, including when
the view is closed. Opening explanations or study values preserves the series.
Changing the effect or selection slider clears it and records the current sample
under the new world. Restart and lesson/history navigation restore the initial
sample and a single-study series. No batch or asynchronous computation remains
to cancel when leaving.

Each row plots one study's estimate minus the true effect on a fixed -0.5 to 2
outcome-unit axis. Zero is the truth line in both lessons, including after effect
changes. Filled dots identify the latest study. The summary shows the mean
estimate and known effect; an optional table retains every seed, estimate, and
difference. Off-scale estimates use boundary triangles and keep their exact
values. Unavailable estimates remain in the study count and table; their
exclusion from the mean is explicit. These are repeated-sample estimates, not
confidence intervals.

The randomized lesson introduces sampling spread. The confounding lesson then
shows why repeated estimates can remain systematically away from truth; repeating
the comparison does not repair confounding. No estimator, lesson order, or default
world changes. IV estimation and validated confidence sets remain PRs B–D.

Across 80 independent seeds (200–279), randomized estimates average 2.008 with
SD 0.047, compared with approximately 0.044 from the known treatment probability
and unit outcome-noise variance. The confounded estimates average 3.498 against
truth 2. Tests also check the estimate against direct treatment-arm means,
reproducibility, unavailable estimates, and off-scale rendering. Browser checks
cover accumulation, disclosure invariance, slider resets, restart/history,
keyboard/touch, and desktop/320px layouts. Learner comprehension remains pending:
ask what the dots represent, what changes between studies, and why a tightly
grouped set of estimates can still miss truth.

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
Level 2 sets outcomeInfluence to 1.5 and lets selection vary from 0 to 1.2 in steps of 0.1, starting at zero.
The slider preserves covariates and random draws; redraw is separate. Returning
to zero restores random assignment, and entry/restart restores zero and the initial sample.
Level 3 starts with selection 1.2 and shows truth and the unadjusted difference.
One “Try IPW” action fits treatment probabilities using baseline health (C) and
reveals the adjusted estimate alongside before/after balance for the same sample.
There is no adjustment checkbox or intermediate unadjusted IPW result. Redraw
updates both estimates; restart restores the initial view. Weighted balance uses
the estimator’s exact weights, including its [0.02, 0.98] clipping policy.

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

## AIPW formula and optional calculation (level 9)

A closed “How is AIPW calculated?” section follows the general explanation.
It leads with a large annotated formula: average the predicted treatment contrast
plus s × w × r over people. Matching boxes define r as the observed regression
error, w as the IPW weight for the treatment received, and s as +1 for treated or
−1 for untreated. Predictions use a treatment subscript and explicit C argument,
avoiding crowded treatment/person double subscripts. Native MathML supplies
fractions, hats, and text equivalents; the formula stacks at phone widths.

“Check with this sample” holds one optional table for the first treated and first
untreated person. The mean contrast, mean correction, and AIPW estimate use every
record. Averaging and clipping have a separate optional explanation. These
disclosures preserve their open state during model changes and redraws.

The optional `aipwDetails` estimator output exposes the fitted values already used
in its calculation, including clipped probabilities and received-treatment weights.
It does not change estimation. Only stable lesson ID 6 (display position 9) requests
these records. Restart and navigation close the disclosures. Opening an explanation
leaves the sample, model choices, and estimates unchanged.

AIPW averages contributions over n. The displayed IPW uses within-group Hájek
normalization, so the explanation starts from outcome regression plus a correction,
not the displayed IPW plus a correction. Rounding affects presentation only.
Tests reconstruct the estimate across all four model combinations and both clipping
tails, check unchanged estimator results, and cover keyboard/touch, resets, history,
and light/dark layouts at desktop and 320px widths. Screen-reader use and learner
comprehension remain pending. Ask why the untreated error is subtracted and whether
the correction must move an estimate closer to truth. The IPW and outcome-regression
explanations from #46/#47 are integrated; comprehension of the connected sequence
still needs a learner walkthrough.

## TMLE targeting (level 10)

`?lesson=tmle` follows AIPW and precedes overlap. It resets to the same nonlinear
world, with a correct treatment model and an initial outcome model missing C².
The true population total effect is 2. Both models adjust for C; there are no
hidden causes or post-treatment variables. The same 2,400 people and fitted
models remain fixed while the learner applies 0–100% of the targeting update.

The experiment shows truth, initial outcome regression, and the current average
predicted contrast. Only the 100% result is labeled TMLE. A before/current
readout shows the actual average signed weighted residual approaching zero.
Two plots show fitted predictions with and without treatment. They draw up to
81 actual sample rows ordered by C; axes cover all initial and final predictions
and stay fixed while the slider moves. The plots contain no simulation truth.
The slider sits immediately above the curves. Each plot has a visible y-axis
labeled “Predicted outcome”; a short description below explains the panels and
the original versus targeted predictions. Captions below each curve explain the
update's direction and where it is largest, using the fitted epsilon and clipped
probabilities for the current sample. They describe the fitted update even at
0% progress and handle an effectively zero update explicitly.

“How does targeting work?” uses a large MathML update formula and matching
labeled components for the initial prediction, direction H, fitted amount ε,
and targeted prediction. Separate optional details introduce the influence
function, two observed-prediction examples, assumptions, and clipping. Formulas
stack on phones. Intermediate predictions are for illustrating the fitted update;
they are not separate fully targeted estimators.

The lesson reuses the estimator's fitted AIPW contributions and joins baseline
health by row. `tmle-lesson.js` applies the independently validated calculation
in `tmle.js`; see [the estimator contract](tmle.md). Initial regression and AIPW
remain unchanged. Reading explanations preserves the experiment and nested
open disclosures. Redraw retains the update fraction with a new sample and fit;
restart, history, and direct lesson entry restore 0% and seed 4217.

Unit checks reconcile the preview with the full estimator and AIPW correction,
and verify that targeting does not change the sample or initial fits. Browser
checks cover keyboard/touch, direct entry, AIPW → TMLE → overlap, back/history,
redraw/restart, explanation invariance, and desktop/320px light/dark layouts.
Learner comprehension and screen-reader listening remain untested.

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

Level 11 (stable numeric ID 10) resets to the level-4 simple observed-confounding baseline: n=2400,
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

### IPW calculation at first introduction

Before Try IPW in lesson 3, a two-sentence health example explains which people
receive more weight and why. Applying IPW keeps focus on the button and reveals
results and balance without inserting explanatory text above them. Below that
comparison, “Why these weights?” opens a table of illustrative treatment probabilities
(0.1, 0.5, 0.9), connecting that intuition to treated weights 1/p and untreated
weights 1/(1 − p). These examples are explicitly separate from the current sample.
A nested optional calculation shows the within-group weighted-average formula, actual full-sample
weighted outcome sums and weight totals, and their difference. Displayed numbers
are rounded; estimates use full precision. Redraw refreshes sample totals; illustrative weights remain fixed.
Native MathML supplies fractions and sums with equivalent text descriptions; no
external rendering assets are needed. This focused #46 implementation does not
migrate the other formulas tracked by #19 or add AIPW/TMLE explanations.

### Outcome predictions at first introduction

Lesson 4 briefly distinguishes the observed outcome from the counterfactual
outcome under the alternative treatment. It then states the operation once:
predict each person under both treatments at the same baseline health, and
average the predicted differences to estimate the average treatment effect.
One optional explanation contains the averaging formula, symbol definitions,
the distinction between predictions and observations, and why both methods work
in this world. There are no prediction cards, worked arithmetic, or separate
model-details disclosure. The estimator and its outputs are unchanged.

Browser checks cover explanation state, redraw/reset, keyboard/touch, and phone
layouts. New-learner comprehension and screen-reader listening remain untested.
