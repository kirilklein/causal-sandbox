import { estimate } from "./simulation.js";
import { overlapDiagnostics } from "./lesson-simulation.js";

// Fit once per sample/model change; threshold changes reuse these raw scores.
export function fitClippingSample(data, adjustment = ["C"], models = {}) {
  if (!data.length) return [];
  const fit = estimate(data, adjustment, { ...models, aipwDetails: true });
  return fit.aipwContributions.map(({ A, Y, m0, m1 }, i) => ({
    A,
    Y,
    m0,
    m1,
    p: fit.propensities[i],
  }));
}

export function clippingResult(rows, threshold = 0.02) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 0.5)
    throw new RangeError("Clipping threshold must be between 0 and 0.5.");

  const n = rows.length;
  const unavailable = (reason) => ({ available: false, reason, threshold, n });
  if (!n) return unavailable("No people in this sample.");
  if (
    rows.some(
      ({ A, Y, p, m0, m1 }) =>
        (A !== 0 && A !== 1) ||
        ![Y, p, m0, m1].every(Number.isFinite) ||
        p < 0 ||
        p > 1,
    )
  )
    return unavailable(
      "Finite outcomes, predictions, and valid probabilities are required.",
    );
  if (!rows.some(({ A }) => A === 0) || !rows.some(({ A }) => A === 1))
    return unavailable("Both treatment groups are required.");

  const propensities = rows.map(({ p }) =>
    Math.max(threshold, Math.min(1 - threshold, p)),
  );
  if (propensities.some((p) => p === 0 || p === 1))
    return unavailable(
      "Unclipped probabilities must be strictly between 0 and 1.",
    );

  const weights = rows.map(
    ({ A }, i) => 1 / (A ? propensities[i] : 1 - propensities[i]),
  );
  const weightedOutcomes = [0, 0];
  const totalWeights = [0, 0];
  let regression = 0;
  let aipw = 0;
  rows.forEach(({ A, Y, m0, m1 }, i) => {
    const contrast = m1 - m0;
    weightedOutcomes[A] += weights[i] * Y;
    totalWeights[A] += weights[i];
    regression += contrast / n;
    aipw += (contrast + (A ? 1 : -1) * weights[i] * (Y - (A ? m1 : m0))) / n;
  });
  const ipw =
    weightedOutcomes[1] / totalWeights[1] -
    weightedOutcomes[0] / totalWeights[0];
  if (![regression, ipw, aipw, ...totalWeights].every(Number.isFinite))
    return unavailable(
      "Clipping calculations exceeded the finite numeric range.",
    );

  // Bins describe the unchanged raw fit; diagnostics use the newly clipped weights.
  const overlap = overlapDiagnostics(
    rows,
    rows.map(({ p }) => p),
    weights,
  );
  for (const arm of overlap) {
    arm.clipped = 0;
    arm.maxWeight = 0;
  }
  rows.forEach(({ A, p }, i) => {
    if (p !== propensities[i]) overlap[A].clipped++;
    overlap[A].maxWeight = Math.max(overlap[A].maxWeight, weights[i]);
  });
  if (
    overlap.some(
      ({ ess, topShare }) =>
        !Number.isFinite(ess) || ess <= 0 || !Number.isFinite(topShare),
    )
  )
    return unavailable("Weight diagnostics exceeded the finite numeric range.");

  return {
    available: true,
    threshold,
    n,
    regression,
    ipw,
    aipw,
    propensities,
    weights,
    overlap,
  };
}
