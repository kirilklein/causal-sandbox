import { makeNoise } from "./simulation.js";

export function longitudinalSample({
  seed = 4217,
  n = 2400,
  confounded = false,
} = {}) {
  const data = makeNoise(n, seed).map(({ a, C1, jitter, eY }) => {
    const A1 = +(a < 0.5);
    const L = +((C1 / Math.sqrt(3) + 1) / 2 < 0.7 - 0.4 * A1);
    const p2 = confounded ? 0.2 + 0.6 * L : 0.5;
    const A2 = +(jitter < p2);
    return { A1, L, A2, Y: 6 - A1 - A2 + 2 * L + eY };
  });
  return { data, truth: -2.8, ...longitudinalEstimates(data, confounded) };
}

export function longitudinalEstimates(data, confounded = false) {
  // Binary histories allow saturated fits by cell means, without regularization.
  const cells = Array.from({ length: 8 }, () => ({ n: 0, sum: 0 }));
  const index = (A1, L, A2) => 4 * A1 + 2 * L + A2;
  for (const d of data) {
    const cell = cells[index(d.A1, d.L, d.A2)];
    cell.n++;
    cell.sum += d.Y;
  }
  const mean = (A1, L, A2) => {
    const cell = cells[index(A1, L, A2)];
    return cell.n ? cell.sum / cell.n : NaN;
  };
  const pooledSeverity = data.length
    ? data.reduce((s, d) => s + d.L, 0) / data.length
    : NaN;
  const groups = [0, 1].map((a) => {
    const low = cells[index(a, 0, a)];
    const high = cells[index(a, 1, a)];
    return (low.sum + high.sum) / (low.n + high.n);
  });
  const unadjusted = groups[1] - groups[0];
  // Ordinary standardization holds the same pooled L distribution in both arms.
  const adjusted = [0, 1].reduce(
    (s, L) =>
      s +
      (L ? pooledSeverity : 1 - pooledSeverity) *
        (mean(1, L, 1) - mean(0, L, 0)),
    0,
  );
  const supported = cells.every((cell) => cell.n > 0);
  const weighted = [0, 0];
  const totals = [0, 0];
  const weights = data.map((d) => {
    const low = cells[index(d.A1, d.L, 0)].n;
    const high = cells[index(d.A1, d.L, 1)].n;
    const p2 = confounded ? high / (low + high) : 0.5;
    const observedP2 = d.A2 ? p2 : 1 - p2;
    const weight = 1 / (0.5 * observedP2);
    if (d.A1 === d.A2) {
      weighted[d.A1] += weight * d.Y;
      totals[d.A1] += weight;
    }
    return { p1: 0.5, p2, observedP2, weight };
  });
  return {
    unadjusted,
    adjusted,
    ipw: supported ? weighted[1] / totals[1] - weighted[0] / totals[0] : NaN,
    weights,
    supported,
  };
}
