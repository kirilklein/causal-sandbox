import { makeNoise } from "./simulation.js";

export const extent = Math.sqrt(3);
export const propensityBaseline = { seed: 4217, age: 0.8, severity: 0.8 };

// Separate fictional cohort; neither these controls nor its two C variables
// enter the single-C IPW lesson. The outcome is never used to fit propensity.
export function propensityCohort({ seed, age, severity }) {
  return makeNoise(400, seed).map((e, i) => {
    const probability = 1 / (1 + Math.exp(0.4 - age * e.C1 - severity * e.C2));
    const A = +(e.a < probability);
    return {
      person: i + 1,
      C1: e.C1,
      C2: e.C2,
      age: 60 + (20 * e.C1) / extent,
      severity: 5 + (5 * e.C2) / extent,
      A,
      Y: 2 * A + 0.8 * e.C1 + 1.2 * e.C2 + e.eY,
      jitter: e.jitter,
    };
  });
}

// An additive logistic model has straight equal-probability contours.
// Intersect each contour with the fixed covariate rectangle.
export function propensityContours(beta) {
  const [intercept, b1, b2] = beta;
  return [0.2, 0.5, 0.8].flatMap((p) => {
    const target = Math.log(p / (1 - p)) - intercept;
    const points = [];
    const add = (C1, C2) => {
      if (Math.abs(C1) > extent + 1e-9 || Math.abs(C2) > extent + 1e-9) return;
      if (!points.some((q) => Math.hypot(q.C1 - C1, q.C2 - C2) < 1e-8))
        points.push({ C1, C2 });
    };
    for (const edge of [-extent, extent]) {
      if (Math.abs(b2) > 1e-10) add(edge, (target - b1 * edge) / b2);
      if (Math.abs(b1) > 1e-10) add((target - b2 * edge) / b1, edge);
    }
    return points.length === 2 ? [{ p, points }] : [];
  });
}
