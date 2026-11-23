import { cohort, health, FINAL_DAY, SEVERITIES } from "./trajectory-model.js";
import { random } from "./simulation.js";

export function observedPatients(selection) {
  return cohort(selection).map(({ id, severity, treatment }) => ({
    id,
    severity,
    treatment,
    score: health(severity, FINAL_DAY, treatment),
  }));
}

export function randomizedPatients(seed) {
  const draw = random(seed);
  return cohort().map(({ id, severity }) => {
    const treatment = Number(draw() < 0.5);
    return {
      id,
      severity,
      treatment,
      score: health(severity, FINAL_DAY, treatment),
    };
  });
}

export function observedComparison(rows) {
  const summarize = (patients) =>
    [0, 1].map((arm) => {
      const members = patients.filter((p) => p.treatment === arm);
      return {
        count: members.length,
        mean: members.length
          ? members.reduce((sum, p) => sum + p.score, 0) / members.length
          : null,
      };
    });
  const arms = summarize(rows);
  const strata = SEVERITIES.map((severity) =>
    summarize(rows.filter((p) => p.severity === severity)),
  );
  let standardized = 0;
  for (const [untreated, treated] of strata) {
    const count = untreated.count + treated.count;
    if (!count) continue;
    if (!untreated.count || !treated.count) {
      standardized = null;
      break;
    }
    standardized += (count / rows.length) * (treated.mean - untreated.mean);
  }
  return { arms, strata, standardized: rows.length ? standardized : null };
}

// Sample independently from the same joint distribution of severity, assignment and score.
export function repeatedDifferences(sampleSize, repetitions = 60) {
  const draw = random(4217);
  const population = observedPatients(1);
  return Array.from({ length: repetitions }, () => {
    const sums = [0, 0],
      counts = [0, 0];
    for (let i = 0; i < sampleSize; i++) {
      const patient = population[Math.floor(draw() * population.length)];
      counts[patient.treatment]++;
      sums[patient.treatment] += patient.score;
    }
    return counts.every(Boolean)
      ? sums[1] / counts[1] - sums[0] / counts[0]
      : null;
  });
}
