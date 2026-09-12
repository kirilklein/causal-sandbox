import { clamp, ease, mix } from "../film/model.js";
export { clamp, ease, mix };
export const TREATMENT_DAY = 4;
export const FINAL_DAY = 12;
export const BENEFIT = 12;
export const SLICE_COUNT = 10;
export const PATIENTS_PER_SLICE = 10;
export const SEVERITIES = Array.from({ length: SLICE_COUNT }, (_, i) => i);
// One fixed patient from each ten-person group; IDs survive unfolding and pooling.
const PROFILE_RANKS = [4, 6, 1, 7, 8, 9, 4, 5, 6, 4];

export function treatmentProbability(severity, selection = 1) {
  const centered = (2 * severity) / (SLICE_COUNT - 1) - 1;
  return (
    (5 + Math.sign(centered) * Math.round(4 * selection * Math.abs(centered))) /
    10
  );
}

export function isProfile(patient) {
  return patient.rank === PROFILE_RANKS[patient.severity];
}

export function profiles(selection = 1) {
  return cohort(selection).filter(isProfile);
}

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
    const count =
      PATIENTS_PER_SLICE * treatmentProbability(severity, selection);
    return { id, severity, rank, treatment: Number(rank < count) };
  });
}

export function comparison(
  selection = 1,
  prognosis = 1,
  people = cohort(selection),
) {
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
