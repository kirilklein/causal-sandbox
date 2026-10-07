export const didDefaults = { gap: 20, common: 10, extra: 0 };

// Exact population percentages, with no sampling error. The program adds 15 pp.
export function didWorld({ gap = 20, common = 10, extra = 0 } = {}) {
  const comparisonBefore = 60;
  const treatedBefore = comparisonBefore - gap;
  const comparisonAfter = comparisonBefore + common;
  const untreatedAfter = treatedBefore + common + extra;
  const treatedAfter = untreatedAfter + 15;
  return {
    observed: {
      treatedBefore,
      treatedAfter,
      comparisonBefore,
      comparisonAfter,
    },
    truth: { untreatedAfter, effect: 15 },
  };
}

// Only observed means enter the estimator, never simulator counterfactuals.
export function estimateDid({
  treatedBefore,
  treatedAfter,
  comparisonBefore,
  comparisonAfter,
}) {
  const treatedChange = treatedAfter - treatedBefore;
  const comparisonChange = comparisonAfter - comparisonBefore;
  const counterfactual = treatedBefore + comparisonChange;
  return {
    treatedChange,
    comparisonChange,
    counterfactual,
    effect: treatedChange - comparisonChange,
  };
}

export function didHistory(scenario = "parallel") {
  const drift = scenario === "drift";
  const world = didWorld({ extra: scenario === "parallel" ? 0 : 10 });
  return {
    ...world,
    treated: drift ? [10, 25, 40] : [30, 35, 40],
    comparison: [50, 55, 60],
  };
}

// Algebraic reconstruction of a saturated two-group, two-period OLS model.
export function didRegression(observed) {
  const alpha = observed.comparisonBefore;
  const beta = observed.treatedBefore - alpha;
  const gamma = observed.comparisonAfter - alpha;
  const delta = estimateDid(observed).effect;
  return {
    alpha,
    beta,
    gamma,
    delta,
    cells: {
      comparisonBefore: alpha,
      comparisonAfter: alpha + gamma,
      treatedBefore: alpha + beta,
      treatedAfter: alpha + beta + gamma + delta,
    },
    counterfactual: alpha + beta + gamma,
  };
}
