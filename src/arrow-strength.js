// Scale within each control's range; widths are not comparable effect sizes.
export function arrowStrength(value, maximum) {
  const strength = Math.min(Math.abs(value) / maximum, 1);
  return `stroke-width="${1 + 2 * strength}" opacity="${0.25 + 0.75 * strength}"`;
}
