// Exact proportions in a fictional population, not fitted sample estimates.
export const recoveryPopulation = Object.freeze({
  retainedShare: 0.6,
  retainedTreated: 0.6,
  retainedUntreated: 0.4,
  excludedTreated: 0.6,
});

export function positivitySensitivity(excludedEffect) {
  const { retainedShare, retainedTreated, retainedUntreated, excludedTreated } =
    recoveryPopulation;
  const retainedEffect = retainedTreated - retainedUntreated;
  const excludedBounds = [excludedTreated - 1, excludedTreated];
  if (
    !Number.isFinite(excludedEffect) ||
    excludedEffect < excludedBounds[0] ||
    excludedEffect > excludedBounds[1]
  ) {
    throw new RangeError(
      "The assumed effect must allow a recovery probability between 0 and 1.",
    );
  }
  const retainedContribution = retainedShare * retainedEffect;
  const excludedContribution = (1 - retainedShare) * excludedEffect;
  return {
    retainedEffect,
    excludedEffect,
    excludedUntreated: excludedTreated - excludedEffect,
    retainedContribution,
    excludedContribution,
    overallEffect: retainedContribution + excludedContribution,
    excludedBounds,
    overallBounds: excludedBounds.map(
      (effect) => retainedContribution + (1 - retainedShare) * effect,
    ),
    tippingEffect: -retainedContribution / (1 - retainedShare),
  };
}
