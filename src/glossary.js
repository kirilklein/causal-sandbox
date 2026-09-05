export const glossary = {
  confounder: {
    title: "Confounder",
    text: "A confounder is a shared cause of treatment and outcome, making the groups differ before treatment. Here C is a block of two measured variables, C₁ and C₂; selecting C adjusts for both. Confounding through C requires both its treatment and outcome pathways to be active.",
  },
  hidden: {
    title: "Hidden confounder",
    text: "A hidden confounder is a shared cause of treatment and outcome that the analyst cannot measure. Here U is always unavailable to estimation, even when you reveal causal truth. Adjusting for C cannot remove confounding through U.",
  },
  mediator: {
    title: "Mediator",
    text: "A mediator carries part of a treatment’s effect to the outcome. Here M lies on A → M → Y, so adjusting for M blocks that part of the total effect. With a correctly specified outcome model, regression can recover the direct effect in this sandbox; IPW and AIPW with M are not general direct-effect estimators.",
  },
  collider: {
    title: "Collider",
    text: "A collider is a common effect of two variables. Here treatment A and outcome Y both cause K, which is measured after the outcome. Adjusting for this post-outcome collider can create a misleading association; it is not a valid way to estimate the total effect.",
  },
  adjustment: {
    title: "Adjustment",
    text: "Adjustment uses selected variables to account for differences between treatment groups. Here the selection feeds regression adjustment, IPW, and AIPW; raw association and naive regression ignore it. Only visible variables can be selected, and including a mediator or collider can make the comparison misleading.",
  },
  ate: {
    title: "Total effect / average treatment effect (ATE)",
    text: "The average treatment effect compares the population’s average outcome if everyone were treated with its average outcome if everyone were untreated. The total effect includes both the direct A → Y path and the path through M. Here it equals the direct effect plus the two mediator-path strengths multiplied together; the truth marker always uses this total.",
  },
  regression: {
    title: "Regression adjustment",
    text: "Regression adjustment predicts each person’s outcome under treatment and under no treatment, then averages the predicted differences. Here it uses one linear outcome model with the selected variables and optional C₁ × C₂ interaction. Recovering the total effect requires appropriate adjustment and a correctly specified outcome model; hidden confounding is not fixed by a better fit.",
  },
  ipw: {
    title: "Inverse probability weighting (IPW)",
    text: "IPW gives more weight to people whose received treatment was less likely given their selected variables. Here it compares weighted outcome means, normalizing the weights within each treatment arm. It needs appropriate pre-treatment adjustment, a correctly specified propensity model, and overlap; clipping the fitted probabilities can also change the estimate.",
  },
  aipw: {
    title: "Augmented inverse probability weighting (AIPW)",
    text: "AIPW combines outcome predictions with a correction using propensity weights. With appropriate pre-treatment adjustment and overlap, it can be consistent if either the outcome model or the propensity model is correctly specified. Hidden confounding, post-treatment adjustment, or clipping can invalidate that double-robustness guarantee. A single finite sample can also miss truth.",
  },
  propensity: {
    title: "Propensity score",
    text: "A propensity score is the probability of receiving treatment given the variables used to describe a person. Here the treatment model estimates it from the selected adjustment variables, so it need not equal the probability that generated treatment. IPW and AIPW use these fitted scores, clipped to the range [0.02, 0.98].",
  },
  overlap: {
    title: "Overlap",
    text: "Overlap means that people with comparable pre-treatment characteristics can receive either treatment. When fitted scores approach zero or one, a few people can receive large weights and the comparison becomes fragile. This sandbox’s warning uses fitted scores, so it depends on the chosen model; it cannot establish that all confounding has been addressed.",
  },
  ess: {
    title: "Effective sample size",
    text: "Effective sample size summarizes how concentrated the weights are: a few large weights make the weighted sample act smaller. Here the warning reports one pooled value across both arms using the clipped inverse propensity weights, not the number of people removed. It is a weight-concentration diagnostic, not a confidence interval or a guarantee of a valid causal estimate.",
  },
  error: {
    title: "Sample error and bias",
    text: "An estimate can differ from truth because of random sampling as well as systematic problems. Statistical bias is an average error across repeated samples, so the difference in this one fixed sample is not itself a measurement of bias. The 0.15 coloring threshold is only a visual guide; it is neither a confidence interval nor a significance test.",
  },
};
