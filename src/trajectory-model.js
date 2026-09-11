import { clamp, ease, mix } from "../film/model.js";
export { clamp, ease, mix };
export const TREATMENT_DAY = 4;
export const FINAL_DAY = 12;
export const BENEFIT = 12;
export const SLICE_COUNT = 10;
export const PATIENTS_PER_SLICE = 10;
export const SEVERITIES = Array.from({ length: SLICE_COUNT }, (_, i) => i);

export function health(severity, day, treatment, prognosis = 1) {
  const t = clamp(day / FINAL_DAY);
  const scaledSeverity = (severity * 4) / (SLICE_COUNT - 1);
  const baseline = 90 - 5 * scaledSeverity * prognosis;
  const untreated = 78 - 12 * scaledSeverity * prognosis;
  const sharedFluctuation =
    1.4 * Math.sin(2 * Math.PI * t) * Math.sin(Math.PI * t);
  return (
    mix(baseline, untreated, ease(0, 1, t)) +
    sharedFluctuation +
    treatment * BENEFIT * ease(TREATMENT_DAY, FINAL_DAY, day)
  );
}

// Exact teaching counts preserve overlap. No fitted probabilities or sampling noise.
export function cohort(selection = 1) {
  return Array.from({ length: SLICE_COUNT * PATIENTS_PER_SLICE }, (_, id) => {
    const severity = Math.floor(id / PATIENTS_PER_SLICE);
    const rank = id % PATIENTS_PER_SLICE;
    const centered = (2 * severity) / (SLICE_COUNT - 1) - 1;
    const count =
      PATIENTS_PER_SLICE / 2 +
      Math.sign(centered) * Math.round(4 * selection * Math.abs(centered));
    return { id, severity, rank, treatment: Number(rank < count) };
  });
}

export function comparison(selection = 1, prognosis = 1) {
  const people = cohort(selection);
  const mean = (rows) =>
    rows.reduce(
      (sum, p) => sum + health(p.severity, FINAL_DAY, p.treatment, prognosis),
      0,
    ) / rows.length;
  const arms = [0, 1].map((a) => people.filter((p) => p.treatment === a));
  const means = arms.map(mean);
  return {
    means,
    armCounts: arms.map((rows) => rows.length),
    difference: means[1] - means[0],
    counts: SEVERITIES.map(
      (c) => people.filter((p) => p.severity === c && p.treatment).length,
    ),
    severe: arms.map((rows) => rows.filter((p) => p.severity >= 7).length),
    standardized: [0, 1].map(
      (a) =>
        SEVERITIES.reduce(
          (sum, c) => sum + health(c, FINAL_DAY, a, prognosis),
          0,
        ) / SLICE_COUNT,
    ),
  };
}
