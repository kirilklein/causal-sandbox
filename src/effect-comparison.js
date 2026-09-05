export function effectComparison(estimate, truth) {
  if (!Number.isFinite(estimate) || !Number.isFinite(truth)) {
    return {
      value: "Unavailable",
      difference: "Cannot compare with truth",
      tint: 0,
    };
  }
  const error = estimate - truth;
  const rounded = Number(error.toFixed(2));
  return {
    value: estimate.toFixed(2),
    difference: `${rounded > 0 ? "+" : ""}${rounded.toFixed(2)} from truth`,
    // The same 0–2 outcome-unit scale applies to every lesson and sample.
    tint: Math.min(Math.abs(error) / 2, 1) * 100,
  };
}
