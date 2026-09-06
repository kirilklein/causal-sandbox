import { makeNoise, estimate } from "./simulation.js";

export function instrumentAdjustment({
  seed = 4217,
  strength = 2,
  hidden = 0,
} = {}) {
  const data = makeNoise(2400, seed).map(({ C1, U, a, eY, jitter }) => {
    // Binary C makes the treatment model without Z saturated when U is absent.
    const C = C1 > 0 ? 1 : -1;
    const Z = +(jitter < 0.5);
    const A = +(
      a <
      1 / (1 + Math.exp(0.8 - 1.2 * C - strength * Z - hidden * U))
    );
    return { C, Z, A, Y: 2 * A + 1.5 * C + 1.5 * hidden * U + eY };
  });
  const fits = [estimate(data, ["C"]), estimate(data, ["C", "Z"])];
  return { data, fits };
}

export function studySummary(values, truth = 2) {
  const finite = values.filter(Number.isFinite);
  const mean = finite.length
    ? finite.reduce((s, x) => s + x, 0) / finite.length
    : null;
  return {
    count: finite.length,
    unavailable: values.length - finite.length,
    mean,
    sd:
      finite.length > 1
        ? Math.sqrt(
            finite.reduce((s, x) => s + (x - mean) ** 2, 0) /
              (finite.length - 1),
          )
        : null,
    rmse: finite.length
      ? Math.sqrt(
          finite.reduce((s, x) => s + (x - truth) ** 2, 0) / finite.length,
        )
      : null,
  };
}
