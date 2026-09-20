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
    // A gentle power curve reveals modest errors; all views saturate at 2.
    tint: Math.min(Math.abs(error) / 2, 1) ** 0.75 * 100,
  };
}
