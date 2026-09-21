# Does better prediction mean a better causal estimate?

Optional lesson at `?lesson=causal-relevance`, after mediator, collider, and
hidden confounding. Follow-up to #82 and PR #260. Available from hidden
confounding, Timing, Contents, the concept map, topics, and search.

## Teaching objective

This is an optional synthesis after the causal-role lessons. The collider lesson
explains how adjustment opens a biasing path; this lesson asks why a model can
predict outcomes better while estimating a treatment effect less accurately.

A learner should be able to explain why predictive usefulness alone does not
justify adjustment, and why having no causal effect on the outcome does not
justify ignoring a measurement. They must separate a stipulated toy graph from
an unknown causal role in real data.

The fixed target is the population average total effect of attending a
rehabilitation program versus not attending on mobility after 12 weeks.
Higher mobility is better. All people have a program effect of +2 mobility
points. These are fictional mechanisms, not claims about rehabilitation.

## Storyboard

| Step            | Learner question and action                                                                                | Visible consequence                                                                                                                          | Intended inference                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Useful clue     | A research-only fitness test has no path to mobility. Predict what adjustment will do, then include it.    | The same 60 studies' adjusted estimates appear beside their original estimates. The average moves toward the fixed truth line but misses it. | A noisy proxy can help without causing the outcome; it leaves confounding in this model.    |
| Misleading clue | A research score combines transport access and fitness. Predict what including it will do.                 | The average effect estimate moves away from truth, while a separate prediction-error comparison improves.                                    | Being predictive and measured before treatment does not make a collider safe to adjust for. |
| Unknown role    | A wearable's baseline activity score predicts mobility. Decide whether this establishes adjustment safety. | Immediate feedback refers back to the relevant example and names the missing causal knowledge.                                               | A prediction result cannot supply a causal graph.                                           |

The known graph is visible before every experiment. The measurement is not used
to assign treatment in either story. Only regression adjustment changes when
Include/Remove is selected; the graph, people, outcomes, studies, and true effect
stay fixed. The predictor and unrelated-variable cases remain concise supporting
background. Mediator and cancellation lessons supply the direct/total-effect
extensions without adding more main experiments.

## Visual contract

Graph nodes name the story's variables. Dashed outlines and edges denote hidden
causes; geometry encodes neither time nor strength. The measured node retains
its identity and appearance under adjustment.

Each dot is an estimate from one simulated study, with one row per adjustment
choice. The horizontal axis is the estimated program effect in mobility points,
fixed at 0–5 across steps. Vertical offsets only separate dots. A dashed line
marks truth (+2) in revealed rows, diamonds below the dots mark means, and error
tint uses the shared 0–2 scale.
Off-scale estimates are triangles with exact values in their titles. Individual
marks have value tooltips; SVG descriptions include mean, SD, truth, and scale.
Only the unadjusted row appears initially. Including the measurement adds the
second row on the same scale; each row labels its own mean. There is
no table of individual studies and no confidence interval claim.

Both examples reveal a separate prediction comparison after adjustment. Its
bars show actual mean held-out RMSE over the same studies,
on a common 0–2 mobility-point scale with exact numeric labels. Prediction is
under the same observational distribution, not under intervention.

## Statistical contract and state

`relevance-simulation.js` is unchanged. `makeNoise` produces independent
background draws. Each study uses 1,200 people for outcome regression and a
separate 1,200 for prediction. Only A, V, Y enter the fits.

- Proxy: U = underlying fitness; V = U + measurement noise;
  Pr(A=1)=sigmoid(1.5U); Y=2A+1.5U+outcome noise.
- Collider: P = transport access and R = fitness, independent standardized
  uniform variables; V=P+R+0.5×score noise;
  Pr(A=1)=sigmoid(1.5P); Y=2A+1.5R+outcome noise.

A is program attendance, V is the measured score, and Y is mobility.
All noise terms and U are standard normal. The proxy’s improvement is specific
to these equations; it is not guaranteed by a noisy-proxy graph alone. No
measurement is a sufficient adjustment set in the proxy example. In the
collider example, no adjustment is needed and conditioning on V introduces bias.

Sixty paired studies use seeds 100–159. Computation yields between batches and
is abandoned when changing steps. Cache only estimates and truth, not patient
records. Revisiting a step retains its prediction and adjustment selection;
Restart clears those and the transfer answer. There are no progress/mastery
writes. Theme and explanatory disclosures do not redraw data.

## Validation

The unchanged statistical tests independently reconstruct OLS and held-out RMSE,
and check prediction, bias, and precision across 100 additional seeds. View and
browser checks verify actual plotted estimates, common axes/truth, absence of
adjusted marks before the action, graph invariance, paired means, prediction
errors, step changes during loading, replay/reset, targeted feedback, navigation,
keyboard/touch, and desktop/phone light/dark layouts.

Functional tests and screenshots do not establish comprehension. A learner
walkthrough should check whether they can explain why changing a recorded score
need not change mobility, and why lower prediction error cannot certify a causal
adjustment. Screen-reader listening remains a separate check.

Sources: Hernán and Robins, [Causal Inference: What If](https://miguelhernan.org/whatifbook),
chapters 6–8; Hernán, Hsu and Healy,
[Description, prediction, and counterfactual prediction](https://arxiv.org/abs/1804.10846).
