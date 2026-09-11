export const glossary = {
  association: {
    title: "Association",
    summary:
      "An association is an observed relationship between variables. It does not by itself show what would happen if treatment were changed.",
    detail: [
      "Treated and untreated groups can differ because treatment has an effect, because common causes influence both treatment and outcome, or because selection creates a relationship. Causal Sandbox compares associations with a known intervention effect so those explanations can be separated.",
    ],
    related: { label: "Explore confounding", href: "confounding/" },
  },
  modelForm: {
    title: "Model flexibility and specification",
    aliases: ["Functional form"],
    contextual: true,
    summary:
      "The simple sandbox model includes C₁ + C₂; the more flexible model also includes C₁ × C₂, so one covariate’s influence can depend on the other.",
    detail: [
      "For treatment assignment, the terms describe log odds that are converted to probabilities.",
      "The sandbox feedback checks only whether a model can capture the world’s measured C relationships. Extra flexibility is unnecessary when the interaction is absent or inactive. It cannot repair hidden confounding or invalid adjustment, and it does not guarantee an estimate equal to truth.",
    ],
    related: {
      label: "Explore model misspecification",
      href: "?lesson=misspecification",
    },
  },
  "causal-effect": {
    title: "Causal effect",
    summary:
      "A causal effect compares outcomes under different interventions, not merely between groups that happened to receive different treatments.",
    detail: [
      "For one person, this asks how the outcome would differ under treatment versus no treatment while keeping the underlying person the same. Only one of those outcomes is normally observed. The simulator can calculate both because it specifies the complete data-generating process.",
    ],
    related: {
      label: "Start with randomization",
      href: "?lesson=randomization",
    },
  },
  counterfactual: {
    title: "Counterfactual / potential outcome",
    summary:
      "A potential outcome is the outcome a person would have under a specified treatment, whether or not that treatment was actually received.",
    detail: [
      "Y(1) and Y(0) denote the outcomes under treatment and no treatment. Their difference is an individual causal effect, but the two cannot both be observed for the same person. Causal estimators use design and assumptions to identify averages of these unobserved contrasts.",
    ],
    related: { label: "Read about the target", href: "methodology/#target" },
  },
  estimand: {
    title: "Estimand and target population",
    aliases: ["Target quantity"],
    summary:
      "An estimand states exactly which causal contrast is being averaged, for whom, and on what outcome scale.",
    detail: [
      "The main sandbox targets the population average total effect. Changing from all people to a trimmed subset changes the target population and therefore the estimand when effects differ between people. An estimation method should be judged against the estimand it actually targets.",
    ],
    related: {
      label: "See how trimming changes the target",
      href: "?lesson=trimming",
    },
  },
  ate: {
    title: "Average treatment effect (ATE)",
    contextual: true,
    summary:
      "The ATE is the population average of each person’s outcome under treatment minus their outcome under no treatment.",
    detail: [
      "The effect may vary between people even though the ATE is one number. In the main sandbox, the truth marker is the population ATE and includes every causal pathway from treatment to outcome. Average describes aggregation across people; total describes which pathways are included.",
    ],
    related: { label: "Read about the target", href: "methodology/#target" },
  },
  "total-effect": {
    title: "Total and direct effects",
    summary:
      "A total effect includes every causal pathway from treatment to outcome. A direct-effect estimand excludes a specified mediated pathway and must define how the mediator is handled.",
    detail: [
      "These pathway labels are separate from whether an effect is averaged over a population. Causal Sandbox targets the total population ATE: its truth includes A → Y and A → M → Y. Simply adjusting for M is not a general method for identifying a direct effect.",
    ],
    related: {
      label: "Explore mediator adjustment",
      href: "mediator-adjustment/",
    },
  },
  randomization: {
    title: "Randomization",
    aliases: ["Random assignment"],
    summary:
      "Randomization assigns treatment independently of participants’ baseline causes of the outcome.",
    detail: [
      "In expectation, this makes treatment groups comparable before treatment and supports an unadjusted causal comparison. A finite randomized sample can still have chance imbalances, so its estimate need not equal the true effect exactly.",
    ],
    related: {
      label: "Try the randomized lesson",
      href: "?lesson=randomization",
    },
  },
  "causal-diagram": {
    title: "Causal diagram and paths",
    aliases: ["Directed acyclic graph (DAG)"],
    summary:
      "A causal diagram uses nodes for variables and arrows for assumed direct causal relationships.",
    detail: [
      "A path is a sequence of connected arrows. A backdoor path enters treatment through an incoming arrow and can create confounding; an appropriate pre-treatment adjustment set blocks such paths without opening new ones. The diagram records causal assumptions and cannot be established from associations alone.",
    ],
    related: { label: "Explore scenarios", href: "?sandbox" },
  },
  timing: {
    title: "Temporal ordering",
    aliases: ["Temporality"],
    summary:
      "A cause must occur before its effect, relative to the treatment decision and outcome being studied.",
    detail: [
      "A pre-treatment variable can be a confounder, instrument, or collider, but it cannot mediate the effect of that treatment. A post-treatment variable is not automatically safe to adjust for. Recording time also need not equal the time a causal process began.",
    ],
    related: { label: "Explore causal timing", href: "?lesson=timing" },
  },
  adjustment: {
    title: "Adjustment",
    aliases: ["Covariate adjustment", "Conditioning"],
    contextual: true,
    summary:
      "Adjustment uses selected variables to make treatment comparisons conditional on measured differences.",
    detail: [
      "In the sandbox, the selected variables enter regression adjustment, IPW, and AIPW; the unadjusted comparison ignores them. Valid adjustment depends on causal role and timing. Including a mediator or collider can make a total-effect comparison misleading, and diagram display settings do not change the adjustment set.",
    ],
    related: { label: "Learn adjustment with IPW", href: "?lesson=ipw" },
  },
  confounder: {
    title: "Confounder",
    aliases: ["Common cause"],
    contextual: true,
    summary:
      "A confounder is a cause of both treatment and outcome that can make treatment groups differ before treatment.",
    detail: [
      "Here C represents two measured baseline variables, C₁ and C₂, and selecting C adjusts for both. Confounding through C requires active paths from C to treatment and from C to outcome. A variable associated with both is not necessarily a confounder; the shared-cause structure matters.",
    ],
    related: { label: "Explore confounding", href: "confounding/" },
  },
  hidden: {
    title: "Unmeasured confounder",
    aliases: ["Hidden confounder", "Unobserved confounder"],
    contextual: true,
    summary:
      "An unmeasured confounder is a common cause of treatment and outcome that the analysis cannot use.",
    detail: [
      "Here U is shown so the learner can see the true causal structure, but it is unavailable to every fitted model. Adjusting for measured C cannot remove confounding through U. More flexible models also cannot recover information that was never measured.",
    ],
    related: {
      label: "Explore hidden confounding",
      href: "?lesson=hidden-confounding",
    },
  },
  mediator: {
    title: "Mediator",
    aliases: ["Intermediate variable"],
    contextual: true,
    summary:
      "A mediator lies on a causal pathway through which treatment changes the outcome.",
    detail: [
      "Here M lies on A → M → Y, so adjusting for M blocks part of the total effect. With the sandbox’s simple correctly specified outcome model, regression can recover its direct-effect component. That example does not make mediator adjustment a general direct-effect estimator for regression, IPW, or AIPW.",
    ],
    related: {
      label: "Explore mediator adjustment",
      href: "mediator-adjustment/",
    },
  },
  collider: {
    title: "Collider",
    contextual: true,
    summary:
      "A collider is a common effect of two variables: two causal arrows meet at it.",
    detail: [
      "Here treatment A and outcome Y both cause K, which is measured after the outcome. Conditioning on K can create a relationship between its causes and open a non-causal path. Measuring a variable does not make it appropriate for adjustment.",
    ],
    related: { label: "Explore collider bias", href: "collider-bias/" },
  },
  exchangeability: {
    title: "Exchangeability",
    aliases: ["Conditional exchangeability", "No unmeasured confounding"],
    formal:
      "For each treatment a, the potential outcome Y(a) is independent of received treatment A, either marginally or conditional on sufficient pre-treatment covariates L.",
    summary:
      "The treatment groups being compared have the same distribution of potential outcomes, either marginally or within adjusted covariate groups.",
    detail: [
      "Randomization can establish exchangeability without conditioning. In an observational analysis, conditional exchangeability means that all common causes needed for the treatment–outcome comparison have been measured and handled correctly. This claim requires causal knowledge and cannot be verified from fitted data alone.",
      "For example, if baseline disease severity affects both treatment choice and the outcome, leaving severity unmeasured breaks conditional exchangeability. Similar measured covariates or good balance after weighting cannot rule out this hidden difference.",
    ],
    sources: [
      {
        label: "Hernán & Robins (2020), Causal Inference: What If, Chapter 3",
        href: "https://miguelhernan.org/whatifbook",
      },
    ],
    related: {
      label: "Compare the groups’ potential outcomes",
      href: "?lesson=assumptions&assumption=exchangeability",
    },
  },
  positivity: {
    title: "Positivity",
    formal:
      "For every relevant covariate pattern L = l, each treatment a has nonzero probability: P(A = a | L = l) > 0.",
    summary:
      "Every covariate pattern in the target population has a positive chance of receiving each treatment being compared.",
    detail: [
      "A structural zero means the missing treatment outcome cannot be learned for that group from the observed comparison. For example, if every patient with a particular contraindication remains untreated, the effect of treatment in that group is unsupported by the observed data. Larger samples, more flexible models, and clipping cannot create this absent support.",
      "In practice, propensity scores concentrated near 0 or 1, little overlap between treatment groups, and very large inverse-probability weights warn about weak support. These are diagnostics under a fitted treatment model, not proof that theoretical positivity holds, and there is no universal cutoff that separates adequate from inadequate support.",
    ],
    sources: [
      {
        label:
          "Petersen et al. (2012), Diagnosing and responding to violations in the positivity assumption",
        href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4107929/",
      },
    ],
    related: {
      label: "See common, rare, and missing comparisons",
      href: "?lesson=assumptions&assumption=positivity",
    },
  },
  overlap: {
    title: "Overlap",
    contextual: true,
    summary:
      "Overlap describes whether people with comparable measured characteristics are observed in each treatment group.",
    detail: [
      "Propensity-score distributions and extreme weights are diagnostics for practical overlap in the observed data. They depend on the fitted treatment model and cannot prove the positivity assumption or show that all confounders were measured. Scores near zero or one can make a few observations dominate a weighted comparison.",
    ],
    related: { label: "Explore overlap", href: "positivity/" },
  },
  consistency: {
    title: "Consistency",
    formal:
      "If a person receives treatment A = a, their observed outcome Y equals their potential outcome Y(a).",
    summary:
      "A person’s observed outcome equals their potential outcome under the treatment they actually received.",
    detail: [
      "The treatment must be defined well enough that the intervention in the causal question matches what was observed. For example, if “surgery” combines techniques with different effects, the potential outcome under surgery is ambiguous unless the relevant version is specified. The simulator defines one version of each treatment and builds consistency into its data-generating process.",
    ],
    sources: [
      {
        label:
          "Cole & Frangakis (2009), The consistency statement in causal inference",
        href: "https://pubmed.ncbi.nlm.nih.gov/19234395/",
      },
    ],
    related: {
      label: "Unpack the treatment label",
      href: "?lesson=assumptions&assumption=consistency",
    },
  },
  "no-interference": {
    title: "No interference",
    formal:
      "Two treatment assignments that give person i the same treatment give person i the same potential outcome.",
    summary:
      "One person’s potential outcome does not depend on the treatments received by other people.",
    detail: [
      "This assumption can fail when treatment has spillover effects, such as vaccination changing another person’s infection risk. Causal effects can still be defined when interference is present, but the treatment strategies, potential outcomes, and analysis must represent it. SUTVA commonly bundles no interference with no relevant hidden versions of treatment. The core lesson simulator generates each person independently; the optional assumptions chapter explores spillover separately.",
    ],
    sources: [
      {
        label:
          "Tchetgen Tchetgen & VanderWeele (2012), On causal inference in the presence of interference",
        href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4216807/",
      },
    ],
    related: {
      label: "Try the study-partner spillover experiment",
      href: "?lesson=assumptions&assumption=no-interference",
    },
  },
  models: {
    title: "Outcome and treatment models",
    aliases: ["Nuisance models"],
    summary:
      "An outcome model predicts outcomes from treatment and covariates; a treatment model predicts the probability of treatment from covariates.",
    detail: [
      "Regression adjustment uses the outcome model, IPW uses the treatment model, and AIPW and TMLE use both. In those combined methods the two fits are often called nuisance models because they support estimation of the treatment effect rather than being the final target themselves. Correct models do not repair unmeasured confounding or invalid adjustment.",
    ],
    related: {
      label: "Compare the two models",
      href: "?lesson=misspecification",
    },
  },
  misspecification: {
    title: "Model misspecification",
    aliases: ["Model mismatch"],
    summary:
      "A model is misspecified when the relationships it can represent do not include the relevant relationship in the data-generating process.",
    detail: [
      "For example, a model with only a straight-line term cannot represent a curved relationship. Outcome regression is vulnerable to a wrong outcome model and IPW to a wrong treatment model. Misspecification is distinct from random sampling error and from missing confounders.",
    ],
    related: {
      label: "Make a model too simple",
      href: "?lesson=misspecification",
    },
  },
  regression: {
    title: "Regression adjustment",
    aliases: ["Outcome regression", "G-computation", "Standardization"],
    contextual: true,
    summary:
      "Regression adjustment predicts each person’s outcome under treatment and no treatment, then averages the predicted differences.",
    detail: [
      "This prediction-and-average step is standardization, often described as the parametric g-formula or g-computation. Here one pooled linear outcome model uses the selected variables and an optional C₁ × C₂ interaction. Recovering the total effect requires valid adjustment and an adequate outcome model.",
    ],
    related: {
      label: "Try outcome regression",
      href: "?lesson=outcome-regression",
    },
  },
  propensity: {
    title: "Propensity score",
    aliases: ["Treatment probability"],
    contextual: true,
    summary:
      "A propensity score is the probability of receiving treatment conditional on the covariates used in the treatment model.",
    detail: [
      "An estimated propensity score need not equal the probability that generated treatment, especially when the model omits a relevant relationship. IPW, AIPW, and TMLE use these fitted scores. Most sandbox estimators clip them to [0.02, 0.98], which is a numerical policy rather than evidence of causal validity.",
    ],
    related: {
      label: "Learn how propensity scores are used",
      href: "inverse-probability-weighting/",
    },
  },
  ipw: {
    title: "Inverse probability weighting (IPW)",
    contextual: true,
    summary:
      "IPW gives more weight to people whose received treatment was less likely given their measured covariates.",
    detail: [
      "The sandbox compares weighted outcome means and normalizes weights within each treatment arm, a Hájek form of IPW. Identification requires appropriate pre-treatment adjustment and positivity; estimation also requires an adequate propensity model. Extreme weights and clipping can materially affect the result.",
    ],
    related: {
      label: "Explore IPW",
      href: "inverse-probability-weighting/",
    },
  },
  aipw: {
    title: "Augmented inverse probability weighting (AIPW)",
    aliases: ["Augmented IPW"],
    contextual: true,
    summary:
      "AIPW combines standardized outcome predictions with a propensity-weighted correction based on prediction errors.",
    detail: [
      "With valid adjustment and positivity, AIPW can be consistent when either the outcome model or treatment model is correctly specified. That protection does not cover hidden confounding, inappropriate post-treatment adjustment, or arbitrary clipping. It also does not promise the closest estimate in one finite sample.",
    ],
    related: {
      label: "Explore AIPW",
      href: "aipw-double-robustness/",
    },
  },
  "double-robustness": {
    title: "Double robustness",
    summary:
      "A doubly robust estimator can remain consistent if either of its two nuisance models is correctly specified, under the required causal assumptions.",
    detail: [
      "For AIPW and the TMLE used here, one adequate outcome or treatment model can protect against misspecification of the other. If both are wrong, that protection is lost. Double robustness is model protection, not protection against unmeasured confounding, positivity violations, or a poorly defined causal target.",
    ],
    related: {
      label: "Test double robustness",
      href: "aipw-double-robustness/",
    },
  },
  tmle: {
    title: "Targeted maximum likelihood estimation (TMLE)",
    summary:
      "TMLE updates initial outcome predictions using information from the treatment model, then averages the targeted treatment contrast.",
    detail: [
      "The targeting step is chosen for the causal quantity being estimated. In this app it moves a continuous-outcome regression along a propensity-weighted direction until the average signed weighted residual is zero. Targeting does not repair hidden confounding, absent positivity, or two inadequate nuisance models.",
    ],
    related: { label: "Explore TMLE", href: "tmle/" },
  },
  balance: {
    title: "Covariate balance",
    aliases: ["Baseline balance"],
    summary:
      "Covariate balance describes how similar the measured pre-treatment variables are between treatment groups, before or after weighting.",
    detail: [
      "Improved balance can show that a weighting procedure reduced observed group differences. It does not prove conditional exchangeability, because unmeasured causes cannot be checked. Balance should be assessed on the weighted covariates themselves, not inferred only from propensity-score distributions.",
    ],
    related: {
      label: "See balance before and after IPW",
      href: "?lesson=ipw",
    },
  },
  ess: {
    title: "Effective sample size",
    contextual: true,
    summary:
      "Effective sample size summarizes weight concentration: a few large weights make a weighted sample behave like a smaller one.",
    detail: [
      "The sandbox reports ESS separately for treated and untreated people using the actual estimation weights. It is not the number of retained people, a confidence interval, or a guarantee that a causal estimate is valid. Different estimators can also have different precision even with the same weights.",
    ],
    related: {
      label: "Explore weight concentration",
      href: "?lesson=overlap",
    },
  },
  clipping: {
    title: "Propensity-score clipping",
    aliases: ["Probability truncation"],
    summary:
      "Clipping replaces fitted propensity scores outside chosen bounds with the nearest boundary value while retaining every person.",
    detail: [
      "Clipping limits extreme inverse weights and can reduce variability, but it changes the estimator and can introduce bias. It does not create support where a treatment is impossible. Causal Sandbox makes the clipping bounds explicit so stability and distortion can be compared.",
    ],
    related: {
      label: "Compare clipping and trimming",
      href: "propensity-score-clipping-trimming/",
    },
  },
  trimming: {
    title: "Trimming",
    summary:
      "Trimming excludes people outside a chosen propensity-score range instead of changing their scores or weights.",
    detail: [
      "Removing regions with poor empirical overlap can make estimation more stable. It also changes the analyzed population and may change the causal estimand when treatment effects vary. Trimming therefore needs a target-population interpretation, not only a numerical threshold.",
    ],
    related: { label: "Explore trimming", href: "?lesson=trimming" },
  },
  instrument: {
    title: "Instrumental variable",
    aliases: ["Instrument", "IV"],
    summary:
      "An instrument changes treatment, affects the outcome only through treatment, and is independent of the underlying causes of the outcome.",
    detail: [
      "These relevance, exclusion, and independence conditions require substantive justification. The current instrument chapter studies what happens when a valid instrument Z is added to ordinary covariate adjustment; it does not implement an instrumental-variable effect estimator. Under hidden confounding, such adjustment can amplify bias.",
    ],
    related: { label: "Explore instruments", href: "?lesson=instrument" },
  },
  error: {
    title: "Sampling variation and bias",
    aliases: ["Random error", "Sampling variability"],
    contextual: true,
    summary:
      "Sampling variation moves estimates between repeated samples; bias is systematic average error relative to the target.",
    detail: [
      "The difference from truth in one sample is not itself a measurement of statistical bias. Causal Sandbox uses repeated studies to separate random spread from persistent displacement. The uncertainty lesson adds confidence intervals for an unadjusted mean difference; the estimator sandbox shows point estimates.",
    ],
    related: {
      label: "Compare repeated randomized studies",
      href: "?lesson=randomization",
    },
  },
};

export const coreAssumptionKeys = [
  "consistency",
  "exchangeability",
  "positivity",
  "no-interference",
];
