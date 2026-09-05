import { overlapDiagnostics } from "./lesson-simulation.js";

export function sandboxOverlap(data, result) {
  const arms = overlapDiagnostics(data, result.propensities, result.weights);
  for (const arm of arms) arm.clipped = 0;
  data.forEach((d, i) => {
    const p = result.propensities[i];
    if (p < 0.02 || p > 0.98) arms[d.A].clipped++;
  });
  return arms;
}
