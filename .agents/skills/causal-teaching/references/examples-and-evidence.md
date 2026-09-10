# Examples and evidence

These examples capture the September 2026 entry-quiz decisions. Check the current
source and routing before applying them elsewhere.

## A supplied graph

A long insulation story can repeat C → A, C → Y, A → Y, and A → M → Y
before displaying the same graph. For an adjustment question, a compact setup is:

> Target: the total effect of A on Y. Treat the graph as complete.

Display the graph with a variable key: A = insulation; Y = heating bill;
C = home size; M = heating use after insulation.

> Which variables should we adjust for?
>
> C only / C and M / M only / Neither

Keep support, measurement, intervention consistency, no interference, and outcome
observation conditions in an accessible Assumptions disclosure. The feedback
explains why C blocks a noncausal path and why M carries part of the total effect.
Do not require a learner to reconstruct the graph from prose to answer this item.

## A later model question

Instead of reintroducing each estimator and embedding its assumptions in a long
study narrative:

> Assume confounding is controlled and overlap holds.

| Component              | Specification       |
| ---------------------- | ------------------- |
| Propensity-score model | Misspecified        |
| Outcome model          | Correctly specified |

> Which methods are guaranteed to remain consistent?
>
> IPW and AIPW / Outcome regression and AIPW / Outcome regression only

The key is outcome regression and AIPW. Retain well-defined treatment, no
interference, consistent estimation of the correct model, estimation regularity,
and no clipping in the assumptions. Explain after the assessment that consistency
is a large-sample property, not a promise of the closest estimate in one sample.
Do not silently extend this exact key to other estimators or conditions.

## Entry and feedback decisions

The entry quiz helps visitors unsure where their gaps are. Visitors who already
know where to go can browse topics or open the sandbox directly. A short quiz
cannot establish expertise across the curriculum. Keep the entry and final
assessment conceptually related without treating them as independent pre/post
measurements when the entry explanations may teach related answers.

End-of-attempt feedback protects the intended interpretation of adaptive
follow-ups: explaining a missed collider item can supply the reasoning needed for
the next collider item. This is a design argument, not a result directly tested
in the studies below. A more exciting final reveal is an engagement hypothesis.

## Research used in these decisions

- [NBME Item-Writing Guide](https://www.nbme.org/sites/default/files/2021-02/NBME_Item%20Writing%20Guide_R_6.pdf): chapters 3 and 5 address irrelevant difficulty, focused lead-ins, application of knowledge, and plausible homogeneous options. These principles support removing reading burden that is unrelated to the intended skill.
- [Kandemir et al., 2026](https://doi.org/10.1007/s10648-026-10117-8): a meta-analysis of 51 studies found no significant average timing difference (g = 0.03, 95% CI −0.08 to 0.13), with substantial heterogeneity. The publisher abstract supports this summary; it does not establish universal equivalence or optimal timing for this quiz.
- [Ryan et al., 2024](https://doi.org/10.1111/medu.15287): 41 medical students received conceptual feedback after each item or after nine-item blocks. No timing difference was detected in subsequent near/far transfer performance, including one-week follow-up. Its small sample and specific setting limit generalization.

The sources support separating feedback timing from assumptions about learning
or excitement. They do not justify withholding feedback indefinitely. Preserve
end-of-quiz explanations for placement and choose practice feedback according to
the learning activity.
