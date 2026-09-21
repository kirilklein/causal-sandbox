# Does this variable matter?

Optional lesson for #82 at `?lesson=causal-relevance`, after mediator, collider,
and hidden confounding. Available from the hidden-confounding lesson, Timing,
Contents, the concept map, the adjustment topic group, and search. Return links lead to Timing
and the core model-specification lesson. It does not add a timing category.

## Teaching plan and acceptance

The misconception is that a variable which does not cause the outcome can be
discarded, or that a useful predictor must be safe to adjust for. The target is
the population average total effect of A=1 versus A=0 on Y, always 2 here.

Three paired comparisons progressively introduce an unrelated variable, an
outcome cause/predictor, a noisy proxy for a hidden common cause, and a baseline
collider. Only two worlds are offered at a time. The learner first sees fitted
results, then reveals the stipulated graph, role, and true effects. Hidden truth
is absent from both the visible and accessible analyst view, including error
tints. World labels and comparison numbers do not claim inferred causal roles.

The graph explains why the same adjustment can improve prediction and harm
causal estimation. It encodes only stipulated causal paths, with dashed hidden
nodes and paths; its geometry does not encode time or effect size. Prediction
uses a separate validation sample. It is evaluated under the same observational
distribution, not under intervention or distribution shift.

Optional detail separates no direct effect, no total effect, no directed path,
no predictive information, and no adjustment benefit. An indirect-path example
and the existing cancellation experiment complete these distinctions. A transfer
question asks what a predictive baseline biomarker establishes about adjustment,
with immediate, choice-specific feedback. No automatic selection rule is taught.

## Statistical contract

Reuse `makeNoise`, `estimate`, and `studySummary`. All exogenous draws are
independent. P and R are standardized uniform variables; U and errors are
standard normal. V is measured before A in every world.

| World             | Generating equations                             |
| ----------------- | ------------------------------------------------ |
| Unrelated         | V=P; A randomized; Y=2A+eY                       |
| Outcome predictor | V=P; A randomized; Y=2A+1.5V+eY                  |
| Proxy             | V=U+eM; Pr(A=1)=sigmoid(1.5U); Y=2A+1.5U+eY      |
| Baseline collider | V=P+R+0.5eK; Pr(A=1)=sigmoid(1.5P); Y=2A+1.5R+eY |

Each sample has 2,400 people: the first 1,200 fit `Y ~ A` and `Y ~ A + V`; the other
1,200 evaluate their root mean squared prediction error at observed A and V.
Only A, V, and Y reach the fits. The shared prediction API returns fitted Y at
A=0, so validation adds the constant fitted A contrast for each treated person.
The displayed effect estimate is that same contrast, not an estimate of V's
effect. No causal truth enters a fit or a prediction.

In these worlds, predictor adjustment improves precision; noisy-proxy adjustment
reduces but does not eliminate confounding; collider adjustment introduces bias.
These are model-specific repeated-sample claims, not general guarantees for
proxies, colliders, or arbitrary regression models. V's direct and total effects
are both 1.5 in the predictor world and zero in the others. No-effect claims
come from the equations, never from a fitted coefficient.

Changing worlds keeps the seed, closes the graph, and clears repeated studies.
Redraw changes only the sample and retains graph visibility and batch results.
Restart restores comparison 1, world 1, seed 4217, and the unanswered exercise.
Sixty paired studies use seeds 100–159, yielding between studies and cancelling
on world changes or restart. Their mean effects, empirical SDs, and mean
validation RMSEs summarize sampling behavior, not confidence intervals.

## Validation

Unit checks independently reconstruct OLS and validation RMSE, and verify bias,
precision, and prediction claims over 100 independent seeds. Browser checks
cover truth disclosure, sample preservation, batch cancellation, all comparisons,
exercise feedback, navigation/search, keyboard use, and phone light/dark layouts.
Automated checks and visual inspection do not establish learner comprehension
or screen-reader usability. A learner walkthrough should ask why changing a
proxy need not change Y and why a lower prediction error cannot certify adjustment.

Sources: Hernán and Robins, [Causal Inference: What If](https://miguelhernan.org/whatifbook),
chapters 6–8; [DAGitty covariate roles](https://dagitty.net/learn/graphs/roles.html);
Hernán et al., [Description, prediction, and counterfactual prediction](https://arxiv.org/abs/1804.10846).
