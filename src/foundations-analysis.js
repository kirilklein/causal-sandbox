import { observedPatients, observedComparison } from "./foundations-study.js";
import { health, FINAL_DAY } from "./trajectory-model.js";
import { estimate } from "./simulation.js";

// In this finite cohort the assignment shares are known exactly within severity.
export function weightPatients(rows) {
  const { strata } = observedComparison(rows);
  const totals = [0, 0],
    mass = [0, 0];
  let maximum = 0;
  for (const { severity, treatment, score } of rows) {
    const cell = strata[severity];
    if (!cell[0].count || !cell[1].count) return null;
    const weight = (cell[0].count + cell[1].count) / cell[treatment].count;
    maximum = Math.max(maximum, weight);
    totals[treatment] += score * weight;
    mass[treatment] += weight;
  }
  const means = totals.map((total, a) => total / mass[a]);
  return { means, mass, maximum, effect: means[1] - means[0] };
}

export function supportStudy(setting) {
  const rows = observedPatients(setting === "balanced" ? 0 : 1);
  if (setting !== "empty") return rows;
  return rows.map((row) =>
    row.severity === 9
      ? { ...row, treatment: 1, score: health(9, FINAL_DAY, 1) }
      : row,
  );
}

export function hiddenStudy() {
  // Four frail and one robust patient treated per ten at each severity.
  const rows = observedPatients(0).map((row) => {
    const rank = row.id % 10,
      frail = Number(rank < 5),
      treatment = Number(rank < 4 || rank === 5);
    return {
      ...row,
      treatment,
      frail,
      score: health(row.severity, FINAL_DAY, treatment) - 20 * frail,
    };
  });
  const adjusted = observedComparison(rows).standardized;
  const withinFrailty = [0, 1].map(
    (f) =>
      observedComparison(rows.filter((row) => row.frail === f)).standardized,
  );
  return { adjusted, withFrailty: (withinFrailty[0] + withinFrailty[1]) / 2 };
}

export function curvedStudy(flexible) {
  // Both extreme severity groups receive treatment more often; support remains in every cell.
  const rows = observedPatients(0).map((row) => {
    const C = (row.severity - 4.5) / 4.5;
    const A = Number(row.id % 10 < 2 + Math.round(6 * C * C));
    return { C, A, Y: health(row.severity, FINAL_DAY, A) - 20 * C * C };
  });
  const fit = estimate(rows, ["C"], {
    outcomeQuadratic: flexible,
    outcomeDetails: true,
  });
  const untreated = rows.filter((row) => !row.A);
  const points = [...new Set(untreated.map((row) => row.C))].map((C) => ({
    observed: untreated.find((row) => row.C === C).Y,
    predicted: fit.outcomePredictions.find((row) => row.C === C).m0,
  }));
  const { observed, predicted } = points.at(-1);
  return {
    effect: fit.values[2],
    observed,
    predicted,
    points,
  };
}

// Employment in tenths without and with an offer; the same for both offer groups.
const experienceGroups = [
  { name: "Less work experience", counts: [80, 40], tenths: [3, 5] },
  { name: "More work experience", counts: [20, 60], tenths: [7, 8] },
];
export const applicants = experienceGroups.flatMap((group, experience) =>
  group.counts.flatMap((n, offer) =>
    Array.from({ length: n }, (_, i) => ({
      experience,
      offer,
      employed: group.tenths.map((t) => Number(10 * i < t * n)),
    })),
  ),
);
const observed = (rows, offer) => {
  const arm = rows.filter((a) => a.offer === offer);
  return [arm.reduce((n, a) => n + a.employed[offer], 0), arm.length];
};
export const trainingGroups = experienceGroups.map(({ name }, experience) => {
  const rows = applicants.filter((a) => a.experience === experience);
  return { name, offer: observed(rows, 1), usual: observed(rows, 0) };
});
export const trueTrainingEffect =
  (100 * applicants.reduce((n, a) => n + a.employed[1] - a.employed[0], 0)) /
  applicants.length;
export function trainingResult() {
  const total = trainingGroups.reduce((n, g) => n + g.offer[1] + g.usual[1], 0);
  const means = ["offer", "usual"].map((arm) =>
    trainingGroups.reduce(
      (sum, g) =>
        sum + (((g.offer[1] + g.usual[1]) / total) * g[arm][0]) / g[arm][1],
      0,
    ),
  );
  return { means, points: 100 * (means[0] - means[1]) };
}

export function predictedMeans() {
  const rows = observedPatients(1).map((p) => ({
    A: p.treatment,
    C: p.severity,
    Y: p.score,
  }));
  const { outcomePredictions } = estimate(rows, ["C"], {
    outcomeDetails: true,
  });
  return [0, 1].map(
    (a) =>
      outcomePredictions.reduce((sum, p) => sum + p["m" + a], 0) / rows.length,
  );
}
