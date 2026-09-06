// One-dimensional squared-error targeting for an unbounded continuous outcome.
export function targetContinuousAte(data, { m0, m1, propensities }) {
  if (
    !Array.isArray(data) ||
    ![m0, m1, propensities].every(
      (values) => Array.isArray(values) && values.length === data.length,
    )
  ) {
    throw new TypeError("TMLE requires aligned data and prediction arrays");
  }
  const n = data.length;
  if (!n) return { status: "unavailable", reason: "empty-sample" };

  const probabilities = [],
    cleverCovariate = [];
  let treated = 0,
    clipped = 0,
    score = 0,
    sumSquares = 0,
    scoreScale = 0,
    initialContrast = 0;
  for (let i = 0; i < n; i++) {
    const { A, Y } = data[i],
      raw = propensities[i];
    if (
      (A !== 0 && A !== 1) ||
      ![Y, m0[i], m1[i], raw].every(Number.isFinite) ||
      raw < 0 ||
      raw > 1
    ) {
      return { status: "unavailable", reason: "invalid-input" };
    }
    const p = Math.max(0.02, Math.min(0.98, raw)),
      h = A === 1 ? 1 / p : -1 / (1 - p),
      residual = Y - (A === 1 ? m1[i] : m0[i]);
    probabilities.push(p);
    cleverCovariate.push(h);
    treated += A;
    clipped += +(p !== raw);
    score += h * residual;
    sumSquares += h * h;
    scoreScale += Math.abs(h * residual);
    initialContrast += m1[i] - m0[i];
  }
  if (!treated || treated === n) {
    return { status: "unavailable", reason: "missing-treatment-arm" };
  }
  const epsilon = score / sumSquares,
    updated0 = [],
    updated1 = [];
  let contrast = 0,
    updatedScore = 0;
  for (let i = 0; i < n; i++) {
    const q0 = m0[i] - epsilon / (1 - probabilities[i]),
      q1 = m1[i] + epsilon / probabilities[i];
    if (![q0, q1].every(Number.isFinite)) {
      return { status: "unavailable", reason: "non-finite-targeting" };
    }
    updated0.push(q0);
    updated1.push(q1);
    contrast += q1 - q0;
    updatedScore +=
      cleverCovariate[i] * (data[i].Y - (data[i].A === 1 ? q1 : q0));
  }
  const estimate = contrast / n,
    initialEstimate = initialContrast / n,
    correctionBefore = score / n,
    correctionAfter = updatedScore / n;
  if (
    ![
      epsilon,
      estimate,
      initialEstimate,
      correctionBefore,
      correctionAfter,
      scoreScale,
    ].every(Number.isFinite)
  ) {
    return { status: "unavailable", reason: "non-finite-targeting" };
  }
  if (Math.abs(correctionAfter) > 1e-10 * Math.max(1, scoreScale / n)) {
    return { status: "unavailable", reason: "targeting-not-solved" };
  }
  return {
    status: "ok",
    estimate,
    initialEstimate,
    epsilon,
    correctionBefore,
    correctionAfter,
    m0: updated0,
    m1: updated1,
    propensities: probabilities,
    cleverCovariate,
    clipped,
  };
}
