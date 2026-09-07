// Exact population proportions, not a random sample or fitted model.
export function exchangeabilityWorld(mechanism = "randomized") {
  return [0, 1].flatMap((c) =>
    [0, 1].map((u) => ({
      c,
      u,
      mass: 0.25,
      p:
        mechanism === "randomized"
          ? 0.5
          : 0.2 + 0.6 * (mechanism === "hidden" ? u : c),
      y0: 2 + 4 * c + 4 * u,
      y1: 4 + 4 * c + 4 * u,
    })),
  );
}

export function armDistribution(rows, arm, outcome) {
  const mass = (row) => row.mass * (arm ? row.p : 1 - row.p);
  const total = rows.reduce((sum, row) => sum + mass(row), 0);
  const values = [...new Set(rows.map((row) => row[outcome]))].sort(
    (a, b) => a - b,
  );
  return values.map((value) => ({
    value,
    share:
      rows
        .filter((row) => row[outcome] === value)
        .reduce((sum, row) => sum + mass(row), 0) / total,
  }));
}

export function armMean(rows, arm, outcome) {
  return armDistribution(rows, arm, outcome).reduce(
    (sum, bin) => sum + bin.value * bin.share,
    0,
  );
}

export function treatmentComparison(rows, conditional = false) {
  const difference = (group) =>
    armMean(group, 1, "y1") - armMean(group, 0, "y0");
  return conditional
    ? [0, 1].reduce(
        (sum, c) => sum + 0.5 * difference(rows.filter((row) => row.c === c)),
        0,
      )
    : difference(rows);
}

export function supportWorld(support = "good", clip = false) {
  const probabilities = {
    good: [0.5, 0.5],
    weak: [0.05, 0.95],
    absent: [0.5, 1],
  }[support];
  return probabilities.map((p, c) => ({
    c,
    p,
    arms: [0, 1].map((arm) => {
      const chance = arm ? p : 1 - p;
      const count = Math.round(100 * chance);
      return {
        arm,
        count,
        weight:
          count === 0
            ? null
            : 1 / (clip ? Math.max(0.1, Math.min(0.9, chance)) : chance),
      };
    }),
  }));
}

export function coachingOutcome(version) {
  return { none: 50, brief: 54, intensive: 62 }[version];
}

export function coachingPolicy(intensiveShare) {
  return (
    (1 - intensiveShare) * coachingOutcome("brief") +
    intensiveShare * coachingOutcome("intensive")
  );
}

export function peerOutcome(ownTreatment, peerTreatment, spillover) {
  return (
    50 +
    10 * Number(ownTreatment) +
    8 * Number(peerTreatment) * Number(spillover)
  );
}
