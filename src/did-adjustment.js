const mean = (values) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;
const change = (hospital) => hospital.after - hospital.before;

// Exact hospital population risks; sampling is deliberately a separate lesson.
export function hospitalWorld({
  capacityTrends = false,
  shock = 0,
  gap = 0.2,
  common = 0.1,
} = {}) {
  if (![shock, gap, common].every(Number.isFinite))
    throw new Error("World parameters must be finite.");
  const observed = [];
  const untreated = [];
  for (const D of [1, 0]) {
    for (let i = 0; i < 6; i++) {
      const capacity = i < (D ? 4 : 2) ? "high" : "low";
      const before = 0.6 - D * gap;
      const improvement = capacityTrends
        ? capacity === "high"
          ? 0.2
          : 0.05
        : common;
      const withoutProgram = before + improvement + D * shock;
      const after = withoutProgram + D * 0.15;
      if (
        [before, withoutProgram, after].some((rate) => rate < 0 || rate > 1)
      ) {
        throw new Error("Recovery rates must remain between 0 and 1.");
      }
      const id = `${D ? "T" : "C"}${i + 1}`;
      observed.push({ id, D, capacity, before, after, size: 1000 });
      untreated.push({ id, after: withoutProgram });
    }
  }
  return { observed, truth: { effect: 0.15, untreated } };
}

function validate(hospitals) {
  if (!Array.isArray(hospitals) || hospitals.length === 0)
    throw new Error("Hospital records are required.");
  const ids = new Set();
  for (const h of hospitals) {
    if (typeof h.id !== "string" || !h.id || ids.has(h.id))
      throw new Error("Hospital IDs must be unique.");
    ids.add(h.id);
    if (![0, 1].includes(h.D) || !["high", "low"].includes(h.capacity))
      throw new Error("Invalid adoption or capacity profile.");
    if (
      ![h.before, h.after].every((x) => Number.isFinite(x) && x >= 0 && x <= 1)
    )
      throw new Error("Observed recovery rates must be finite risks.");
  }
  if (![0, 1].every((D) => hospitals.some((h) => h.D === D)))
    throw new Error("Both treated and comparison hospitals are required.");
}

// Estimators accept observed records only. Equal hospital weights define the ATT target.
export function estimateHospitalDid(hospitals) {
  validate(hospitals);
  const treated = hospitals.filter((h) => h.D === 1);
  const comparison = hospitals.filter((h) => h.D === 0);
  const treatedChange = mean(treated.map(change));
  const comparisonChange = mean(comparison.map(change));
  return {
    treatedChange,
    comparisonChange,
    effect: treatedChange - comparisonChange,
    association:
      mean(treated.map((h) => h.after)) - mean(comparison.map((h) => h.after)),
  };
}

export function stratifiedHospitalDid(hospitals) {
  validate(hospitals);
  const treated = hospitals.filter((h) => h.D === 1);
  const comparison = hospitals.filter((h) => h.D === 0);
  const strata = [...new Set(treated.map((h) => h.capacity))].map(
    (capacity) => {
      const t = treated.filter((h) => h.capacity === capacity);
      const c = comparison.filter((h) => h.capacity === capacity);
      if (!c.length)
        throw new Error(
          `No comparison hospitals with ${capacity} capacity: the target requires extrapolation.`,
        );
      const share = t.length / treated.length;
      const treatedChange = mean(t.map(change));
      const comparisonChange = mean(c.map(change));
      return {
        capacity,
        treatedCount: t.length,
        comparisonCount: c.length,
        share,
        treatedChange,
        comparisonChange,
        effect: treatedChange - comparisonChange,
      };
    },
  );
  return {
    strata,
    effect: strata.reduce((sum, s) => sum + s.share * s.effect, 0),
    comparisonChange: strata.reduce(
      (sum, s) => sum + s.share * s.comparisonChange,
      0,
    ),
    contributions: hospitals.map((h) => ({
      id: h.id,
      weight: h.D
        ? 1 / treated.length
        : (strata.find((s) => s.capacity === h.capacity)?.share ?? 0) /
          comparison.filter((c) => c.capacity === h.capacity).length,
    })),
  };
}
