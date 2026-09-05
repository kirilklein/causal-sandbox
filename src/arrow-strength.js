// Scale within each control's range; opacity does not compare effect sizes across paths.
export function arrowStrength(value, maximum) {
  const strength = Math.min(Math.abs(value) / maximum, 1);
  return `stroke-width="2" opacity="${0.25 + 0.75 * strength}"`;
}
