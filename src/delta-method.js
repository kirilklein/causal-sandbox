import { random } from "./simulation.js";
import { normalCritical } from "./uncertainty.js";

export const ratioBaseline = {
  n: 200,
  active: 0.8,
  skew: 0.5,
  association: 0,
  seed: 4217,
};
export const ratioTruth = 2;

// A scaled Beta(4, 4) bell has mean `mean`, SD `sd`, and positive bounded
// support here. This illustrative sampling distribution is separate from ratioStudy.
export function orderRatioApproximation(mean, sd) {
  if (
    !Number.isFinite(mean) ||
    !Number.isFinite(sd) ||
    sd <= 0 ||
    mean <= 3 * sd
  )
    throw new RangeError(
      "Expected positive SD and mean greater than three SDs",
    );
  const lo = mean - 3 * sd;
  const hi = mean + 3 * sd;
  const inputDensity = (x) => {
    const z = (x - mean) / (3 * sd);
    return Math.abs(z) < 1 ? (35 / (96 * sd)) * (1 - z * z) ** 3 : 0;
  };
  const center = 20 / mean;
  const slope = -20 / mean ** 2;
  const tangent = (x) => center + slope * (x - mean);
  // Integrate over the bounded input support; no reciprocal-normal singularity.
  const steps = 2048;
  const dx = (hi - lo) / steps;
  let exactMean = 0;
  let secondMoment = 0;
  for (let i = 0; i < steps; i++) {
    const x = lo + (i + 0.5) * dx;
    const weight = inputDensity(x) * dx;
    const y = 20 / x;
    exactMean += weight * y;
    secondMoment += weight * y * y;
  }
  return {
    lo,
    hi,
    center,
    slope,
    sd: Math.abs(slope) * sd,
    exactMean,
    exactSD: Math.sqrt(Math.max(0, secondMoment - exactMean ** 2)),
    transform: (x) => 20 / x,
    tangent,
    inputDensity,
    density: (y) => (y > 0 ? (inputDensity(20 / y) * 20) / y ** 2 : 0),
    tangentDensity: (y) =>
      inputDensity(mean + (y - center) / slope) / Math.abs(slope),
  };
}

// A covariance contour at radius two in standardized coordinates. Marginal
// SEs are fixed at 2 euros and 0.2 orders per visitor, centered at (20, 2).
export function jointRatioApproximation(rho) {
  if (!Number.isFinite(rho) || Math.abs(rho) > 1)
    throw new RangeError("Expected correlation between -1 and 1");
  const revenueContribution = 1;
  const ordersContribution = 1;
  const covarianceContribution = -2 * rho;
  return {
    se: Math.sqrt(
      revenueContribution + ordersContribution + covarianceContribution,
    ),
    contour: (angle) => ({
      orders: 2 + 0.4 * Math.cos(angle),
      revenue:
        20 +
        4 * (rho * Math.cos(angle) + Math.sqrt(1 - rho ** 2) * Math.sin(angle)),
    }),
  };
}

// Fixed arm sizes represent independent users randomized to each variant.
// Non-buyers remain in the data as (revenue, orders) = (0, 0).
export function ratioStudy(settings = {}) {
  const state = { ...ratioBaseline, ...settings };
  if (
    !Number.isInteger(state.n) ||
    state.n < 2 ||
    !Number.isInteger(state.seed) ||
    !Number.isFinite(state.active) ||
    state.active <= 0 ||
    state.active > 1 ||
    !Number.isFinite(state.skew) ||
    state.skew < 0 ||
    state.skew > 2 ||
    !Number.isFinite(state.association) ||
    state.association < 0 ||
    state.association > 2
  )
    throw new RangeError("Invalid ratio study settings");
  const rng = random(state.seed);
  return [0, 1].map((arm) =>
    Array.from({ length: state.n }, () => {
      const active = rng() < state.active;
      const orders = active ? (rng() < 0.5 ? 1 : 5) : 0;
      const z =
        Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
      const multiplier = Math.exp(state.skew * z - state.skew ** 2 / 2);
      const rate = 10 + ratioTruth * arm + state.association * (orders - 1);
      return { revenue: orders * rate * multiplier, orders };
    }),
  );
}

function validateArms(arms) {
  if (
    !Array.isArray(arms) ||
    arms.length !== 2 ||
    arms.some((arm) => !Array.isArray(arm) || arm.length < 2)
  )
    throw new RangeError("Expected two arms with at least two users each");
  for (const arm of arms)
    for (const row of arm)
      if (
        !Number.isFinite(row.revenue) ||
        row.revenue < 0 ||
        !Number.isFinite(row.orders) ||
        row.orders < 0 ||
        (row.orders === 0 && row.revenue !== 0)
      )
        throw new TypeError(
          "Expected finite nonnegative revenue and orders, with no revenue without orders",
        );
}

function armSummary(rows) {
  const n = rows.length;
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const orders = rows.reduce((sum, row) => sum + row.orders, 0);
  if (orders === 0) return null;
  const ratio = revenue / orders;
  // Var(X - rY) includes both marginal variances AND their covariance.
  const variance =
    rows.reduce(
      (sum, row) => sum + (row.revenue - ratio * row.orders) ** 2,
      0,
    ) /
    ((n - 1) * n * (orders / n) ** 2);
  return {
    ratio,
    variance,
    buyers: rows.filter((row) => row.orders > 0).length,
    orders,
  };
}

const unavailable = (reason) => ({ status: "unavailable", reason });

export function deltaRatioDifference(arms) {
  validateArms(arms);
  const summaries = arms.map(armSummary);
  if (summaries.some((arm) => !arm))
    return unavailable("At least one arm has no orders.");
  const estimate = summaries[1].ratio - summaries[0].ratio;
  const se = Math.sqrt(summaries[0].variance + summaries[1].variance);
  if (se === 0)
    return unavailable(
      "No estimated variation: this normal interval is unavailable.",
    );
  return {
    status: "ok",
    estimate,
    se,
    lower: estimate - normalCritical * se,
    upper: estimate + normalCritical * se,
    arms: summaries,
  };
}

function quantile(sorted, probability) {
  const position = (sorted.length - 1) * probability;
  const lo = Math.floor(position);
  return (
    sorted[lo] +
    (position - lo) * (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo])
  );
}

// Resample whole users within each arm; never independently shuffle X and Y.
export function bootstrapRatioDifference(
  arms,
  { repetitions = 499, seed = 7300 } = {},
) {
  validateArms(arms);
  if (
    !Number.isInteger(repetitions) ||
    repetitions < 2 ||
    !Number.isInteger(seed)
  )
    throw new RangeError("Expected at least two resamples and an integer seed");
  const summaries = arms.map(armSummary);
  if (summaries.some((arm) => !arm))
    return {
      ...unavailable("At least one arm has no orders."),
      invalid: repetitions,
    };
  const rng = random(seed);
  const estimates = [];
  let invalid = 0;
  for (let b = 0; b < repetitions; b++) {
    const ratios = arms.map((rows) => {
      let revenue = 0;
      let orders = 0;
      for (let j = 0; j < rows.length; j++) {
        const row = rows[Math.floor(rng() * rows.length)];
        revenue += row.revenue;
        orders += row.orders;
      }
      return orders > 0 ? revenue / orders : null;
    });
    if (ratios.some((ratio) => ratio === null)) invalid++;
    else estimates.push(ratios[1] - ratios[0]);
  }
  // Dropping undefined resamples would silently condition on a positive denominator.
  if (invalid)
    return {
      ...unavailable(
        `${invalid} of ${repetitions} resamples have an arm with no orders; no percentile interval is reported.`,
      ),
      invalid,
    };
  estimates.sort((a, b) => a - b);
  if (estimates[0] === estimates.at(-1))
    return unavailable("No resampled variation: this interval is unavailable.");
  return {
    status: "ok",
    estimate: summaries[1].ratio - summaries[0].ratio,
    lower: quantile(estimates, 0.025),
    upper: quantile(estimates, 0.975),
    estimates,
    invalid: 0,
  };
}
