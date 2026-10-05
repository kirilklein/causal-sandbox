// Exact proportions in a fictional population, not fitted sample estimates.
export const recoveryPopulation = Object.freeze({
  retainedShare: 0.6,
  retainedTreated: 0.7,
  retainedUntreated: 0.5,
  excludedTreated: 0.55,
});

// Six equally common retained profiles, plus a profile that is always treated.
// Their population shares imply the same 60/40 split among treated patients.
export function propensityDistribution() {
  const scores = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65];
  const meanScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const retained = recoveryPopulation.retainedShare;
  const retainedPopulation = retained / (retained + (1 - retained) * meanScore);
  const treatedProbability =
    retainedPopulation * meanScore + 1 - retainedPopulation;
  const profiles = [
    ...scores.map((score) => ({
      score,
      populationShare: retainedPopulation / scores.length,
      retained: true,
    })),
    { score: 1, populationShare: 1 - retainedPopulation, retained: false },
  ].map((profile) => ({
    ...profile,
    treatedShare:
      (profile.populationShare * profile.score) / treatedProbability,
    controlShare:
      (profile.populationShare * (1 - profile.score)) /
      (1 - treatedProbability),
  }));
  const bins = Array.from({ length: 10 }, (_, bin) => ({
    lower: bin / 10,
    upper: (bin + 1) / 10,
    treated: 0,
    control: 0,
    excluded: 0,
  }));
  for (const profile of profiles) {
    const bin = bins[Math.min(9, Math.floor(profile.score * 10))];
    bin.treated += profile.treatedShare;
    bin.control += profile.controlShare;
    if (!profile.retained) bin.excluded += profile.treatedShare;
  }
  return { profiles, bins, treatedProbability };
}

// ATT among all treated people, given E[Y(0) | A=1, excluded].
export function positivitySensitivity(excludedUntreated) {
  if (
    !Number.isFinite(excludedUntreated) ||
    excludedUntreated < 0 ||
    excludedUntreated > 1
  ) {
    throw new RangeError(
      "The outcome probability without treatment must be between 0 and 1.",
    );
  }
  const { retainedShare, retainedTreated, retainedUntreated, excludedTreated } =
    recoveryPopulation;
  const retainedEffect = retainedTreated - retainedUntreated;
  const excludedEffect = excludedTreated - excludedUntreated;
  return {
    excludedUntreated,
    retainedEffect,
    excludedEffect,
    overallEffect:
      retainedShare * retainedEffect + (1 - retainedShare) * excludedEffect,
  };
}

// Bound E[Y(0) | A=1, excluded] from above, leaving its lower bound at zero.
export function positivityBounds(maxExcludedUntreated) {
  return [maxExcludedUntreated, 0].map(
    (q) => positivitySensitivity(q).overallEffect,
  );
}

// Upper limit at which the ATT lower bound reaches zero.
export const tippingLimit =
  recoveryPopulation.excludedTreated +
  (recoveryPopulation.retainedShare * positivitySensitivity(0).retainedEffect) /
    (1 - recoveryPopulation.retainedShare);

// One fixed counterfactual world for the optional reveal; never an input to bounds.
export const simulationTruth = Object.freeze(positivitySensitivity(0.75));
