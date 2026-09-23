# Proxies for hidden confounders

Optional lesson at `?lesson=causal-relevance`, after hidden confounding.
Follow-up to #82 and PR #260. Available from hidden confounding, Timing, Contents,
the concept map, topics, and search. The topic URL remains compatible.

## Teaching objective

A learner should explain that an unobserved confounder can influence an observed
variable, making that variable a proxy for the confounder. Adjusting for a proxy
can reduce confounding in some models without eliminating it. The proxy need
not itself cause treatment or outcome. Ordinary proxy adjustment does not
necessarily help in every setting.

Teach the general mechanism before the concrete example. The main lesson is
about partial information on hidden confounders; prediction versus causal
estimation and collider bias are optional comparisons.

The example targets the population average total effect of attending a
rehabilitation program versus not attending on mobility after 12 weeks.
Higher mobility is better. All people have a program effect of +2 mobility
points. These are fictional mechanisms, not claims about rehabilitation.

## Storyboard

1. Show U causing treatment, outcome, and observed V. Explain the hidden
   confounder, its observed proxy, and why a noisy proxy can leave confounding.
2. Map the roles to a concrete example: hidden fitness and an observed fitness
   test. Include the proxy in the regression and compare the same 60 studies.
   Mean estimates move toward truth but retain a systematic gap.
3. Ask what the result demonstrates: reduced confounding, complete removal, or
   an effect of the proxy itself. Feedback explains the remaining bias.
4. State the real-data limit: a changed estimate alone cannot establish that a
   proxy helped when the graph and true effect are unknown.

The optional collider experiment is reached through a collapsed disclosure,
not the main Next path. Its prediction comparison shows why predictive value
alone cannot establish a useful proxy role. Proxy prediction errors, other
variable roles, and direct/total-effect extensions are optional background.

Only regression adjustment changes when Include/Remove is selected; the graph,
people, outcomes, studies, and true effect stay fixed. The measurement is not
used to assign treatment in either experiment.

## Visual contract

Graph nodes name the story's variables. Dashed outlines and edges denote hidden
causes; geometry encodes neither time nor strength. The measured node retains
its identity and appearance under adjustment.

Each dot is an estimate from one simulated study, with one row per adjustment
choice. The horizontal axis is the estimated program effect in mobility points,
fixed at 0–5 across steps. Vertical offsets only separate dots. A dashed line
marks the true effect (2) in revealed rows, dashed vertical estimate lines mark means, and error
tint uses the shared 0–2 scale.
Off-scale estimates are triangles with exact values in their titles. Individual
marks have value tooltips; SVG descriptions include mean, SD, truth, and scale.
Only the unadjusted row appears initially. Including the measurement adds the
second row on the same scale. A compact legend identifies study dots and mean
lines; exact means appear in marker titles and the accessible description. There is
no table of individual studies and no confidence interval claim.

Prediction comparisons are optional: the proxy's is in a disclosure, and the
collider experiment is itself optional. Their
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
walkthrough should check whether they can identify the hidden confounder and its
proxy, explain the partial reduction in bias, and distinguish the known toy
mechanism from an assumed proxy relationship in real data. Screen-reader listening remains a separate check.

Sources: Hernán and Robins, [Causal Inference: What If](https://miguelhernan.org/whatifbook),
chapters 6–8; Hernán, Hsu and Healy,
[Description, prediction, and counterfactual prediction](https://arxiv.org/abs/1804.10846).
