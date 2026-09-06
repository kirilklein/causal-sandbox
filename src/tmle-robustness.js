import { targetContinuousAte } from "./tmle.js";

export const truth = 2;
export const axis = Array.from({ length: 11 }, (_, i) => (i - 5) * 0.12);
const mean = (values) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;
const groups = [
  { p: 0.2, q0: 0, q1: 1 },
  { p: 0.8, q0: 3, q1: 6 },
];
const population = groups.flatMap((group, C) =>
  Array.from({ length: 100 }, (_, i) => {
    const A = Number(i < group.p * 100);
    return { C, A, Y: A ? group.q1 : group.q0 };
  }),
);

export function calculate(pattern, x, y) {
  const models = groups.map((group) => {
    const logit = Math.log(group.p / (1 - group.p));
    const p =
      1 /
      (1 + Math.exp(-(pattern === "shift" ? logit + x : Math.exp(x) * logit)));
    const distort = (q) =>
      pattern === "shift" ? q + y : 2.5 + Math.exp(y) * (q - 2.5);
    return {
      ...group,
      fittedP: p,
      m0: distort(group.q0),
      m1: distort(group.q1),
    };
  });
  const m0 = population.map((row) => models[row.C].m0);
  const m1 = population.map((row) => models[row.C].m1);
  const propensities = population.map((row) => models[row.C].fittedP);
  const target = targetContinuousAte(population, { m0, m1, propensities });
  if (target.status !== "ok")
    throw new Error(`Targeting unavailable: ${target.reason}`);
  const armMean = (arm) => {
    let weighted = 0,
      weights = 0;
    population.forEach((row, i) => {
      if (row.A !== arm) return;
      const p = target.propensities[i];
      const weight = 1 / (arm ? p : 1 - p);
      weighted += weight * row.Y;
      weights += weight;
    });
    return weighted / weights;
  };
  const ipw = armMean(1) - armMean(0);
  const remainder = mean(
    population.map((row, i) => {
      const group = groups[row.C],
        g = target.propensities[i];
      return (
        (g - group.p) *
        ((target.m1[i] - group.q1) / g + (target.m0[i] - group.q0) / (1 - g))
      );
    }),
  );
  return {
    tmle: target.estimate,
    ipw,
    remainder,
    models,
    clipped: target.clipped,
  };
}

export const grids = Object.fromEntries(
  ["shift", "scale"].map((pattern) => [
    pattern,
    axis.flatMap((y, yi) =>
      axis.map((x, xi) => ({ x, y, xi, yi, ...calculate(pattern, x, y) })),
    ),
  ]),
);
export const colorLimits = Object.fromEntries(
  Object.entries(grids).map(([pattern, grid]) => [
    pattern,
    Math.ceil(
      Math.max(
        ...grid.flatMap((cell) => [
          Math.abs(cell.tmle - truth),
          Math.abs(cell.ipw - truth),
        ]),
      ) * 4,
    ) / 4,
  ]),
);
