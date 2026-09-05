// Structural causal model. All exogenous noises are mutually independent.
// C1,C2 ~ Uniform(-sqrt(3),sqrt(3)); U and errors ~ N(0,1).
// Bounded, unit-variance covariates keep overlap healthy at default settings.
// C is the observed block {C1,C2}.
// S = 0.8*C1 + 0.6*C2; I = C1*C2.
// A = 1[uniform < sigmoid(-0.8 + ca*(S + ta*I) + ua*U)].
// M = am*A + eM; Y = direct*A + cy*(S + oy*I) + uy*U + my*M + eY.
// ta and oy belong to the selected world, not the analyst's model.
// The nonzero treatment intercept avoids symmetry masking omitted-term bias.
// K = 0.9*A + 0.9*Y + eK. K is a post-outcome collider A -> K <- Y.
// Total ATE = direct + am*my. Fixed exogenous draws define paired potential
// outcomes and keep slider movement free of Monte Carlo regeneration noise.
export const defaults = {
  direct: 2,
  ca: 1.2,
  cy: 1.5,
  ua: 0,
  uy: 0,
  am: 0,
  my: 0.8,
};
export const worlds = [
  { id: "additive", name: "Additive relationships", treatment: 0, outcome: 0 },
  { id: "outcome", name: "Outcome interaction", treatment: 0, outcome: 1.5 },
  {
    id: "treatment",
    name: "Treatment interaction",
    treatment: 0.7,
    outcome: 0,
  },
  { id: "both", name: "Interactions in both", treatment: 0.7, outcome: 1.5 },
];
export const presets = [
  {
    name: "Clean randomized treatment",
    short: "Randomized",
    icon: "↝",
    p: { ...defaults, ca: 0, cy: 0 },
    adjust: [],
  },
  {
    name: "Observed confounding",
    short: "Observed confounding",
    icon: "C",
    p: { ...defaults },
    adjust: [],
  },
  {
    name: "Hidden confounding",
    short: "Hidden confounding",
    icon: "U",
    p: { ...defaults, ua: 1.4, uy: 1.6 },
    adjust: ["C"],
  },
  {
    name: "Collider bias",
    short: "Collider bias",
    icon: "K",
    p: { ...defaults, ca: 0, cy: 0 },
    adjust: ["K"],
  },
  {
    name: "Mediator adjustment",
    short: "Mediator adjustment",
    icon: "M",
    p: { ...defaults, ca: 0, cy: 0, direct: 1, am: 1.25 },
    adjust: ["M"],
  },
];
function random(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function makeNoise(n = 2400, seed = 4217) {
  const r = random(seed),
    r2 = random(seed ^ 0x51f15e),
    normal = () =>
      Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) *
      Math.cos(2 * Math.PI * r());
  return Array.from({ length: n }, () => ({
    C1: Math.sqrt(3) * (2 * r() - 1),
    C2: Math.sqrt(3) * (2 * r2() - 1),
    U: normal(),
    eM: normal(),
    eY: normal(),
    eK: normal(),
    a: r(),
    jitter: r(),
  }));
}
const sigmoid = (x) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));
// Shared outcome equation is also used by interventions: no duplicated truth model.
export function outcome(p, e, A, world = worlds[0]) {
  const M = p.am * A + e.eM;
  return (
    p.direct * A +
    p.cy * (0.8 * e.C1 + 0.6 * e.C2 + world.outcome * e.C1 * e.C2) +
    p.uy * e.U +
    p.my * M +
    e.eY
  );
}
export function simulate(p, noise, world = worlds[0]) {
  return noise.map((e) => {
    const ps = sigmoid(
      -0.8 +
        p.ca * (0.8 * e.C1 + 0.6 * e.C2 + world.treatment * e.C1 * e.C2) +
        p.ua * e.U,
    );
    const A = +(e.a < ps);
    const M = p.am * A + e.eM;
    const Y = outcome(p, e, A, world);
    return {
      C1: e.C1,
      C2: e.C2,
      U: e.U,
      A,
      M,
      Y,
      K: 0.9 * A + 0.9 * Y + e.eK,
      jitter: e.jitter,
    };
  });
}
// C is a single variable in lessons and a covariate pair in the full sandbox.
// Interaction features require the covariate pair in the adjustment set.
function features(d, adjustment, interaction, quadratic) {
  return [
    1,
    ...adjustment.flatMap((k) =>
      k === "C" && !("C" in d) ? [d.C1, d.C2] : [d[k]],
    ),
    ...(quadratic && adjustment.includes("C") && "C" in d ? [d.C ** 2] : []),
    ...(interaction && adjustment.includes("C") && !("C" in d)
      ? [d.C1 * d.C2]
      : []),
  ];
}
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
function solve(a, b) {
  const m = a.map((r, i) => [...r, b[i]]),
    n = b.length;
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++)
      if (Math.abs(m[j][i]) > Math.abs(m[pivot][i])) pivot = j;
    [m[i], m[pivot]] = [m[pivot], m[i]];
    if (Math.abs(m[i][i]) < 1e-12) throw new Error("Singular model matrix");
    const d = m[i][i];
    for (let k = i; k <= n; k++) m[i][k] /= d;
    for (let j = 0; j < n; j++)
      if (j !== i) {
        const v = m[j][i];
        for (let k = i; k <= n; k++) m[j][k] -= v * m[i][k];
      }
  }
  return m.map((r) => r[n]);
}
function fit(X, y, logistic = false) {
  let beta = Array(X[0].length).fill(0);
  for (let step = 0; step < (logistic ? 40 : 1); step++) {
    const n = beta.length,
      h = Array.from({ length: n }, () => Array(n).fill(0)),
      g = Array(n).fill(0);
    X.forEach((x, i) => {
      const pred = logistic ? sigmoid(dot(x, beta)) : 0,
        w = logistic ? Math.max(pred * (1 - pred), 1e-8) : 1;
      for (let j = 0; j < n; j++) {
        g[j] += x[j] * (y[i] - pred);
        for (let k = 0; k < n; k++) h[j][k] += x[j] * x[k] * w;
      }
    });
    // Tiny numerical regularization; no substantive shrinkage intended.
    for (let j = 0; j < n; j++) h[j][j] += 1e-7;
    const delta = solve(h, g);
    beta = beta.map((v, i) => v + delta[i]);
    if (Math.max(...delta.map(Math.abs)) < 1e-8) break;
  }
  return beta;
}
export function estimate(data, adjustment, models = {}) {
  const n = data.length,
    xs = data.map((d) =>
      features(d, adjustment, models.outcome, models.outcomeQuadratic),
    ),
    gs = data.map((d) =>
      features(d, adjustment, models.treatment, models.treatmentQuadratic),
    ),
    a = data.map((d) => d.A),
    y = data.map((d) => d.Y);
  const count = a.reduce((s, v) => s + v, 0),
    mean1 = data.reduce((s, d) => s + d.A * d.Y, 0) / count,
    mean0 = data.reduce((s, d) => s + (1 - d.A) * d.Y, 0) / (n - count);
  const propensity = fit(gs, a, true);
  const ps = gs.map((x) => sigmoid(dot(x, propensity))),
    clipped = ps.filter((p) => p < 0.02 || p > 0.98).length;
  const beta = fit(
    xs.map((x, i) => [...x, a[i]]),
    y,
  );
  const weights = [];
  const aipwContributions = models.aipwDetails ? [] : undefined;
  let s1 = 0,
    s0 = 0,
    w1 = 0,
    w0 = 0,
    aipw = 0,
    regression = 0,
    sumw2 = 0;
  xs.forEach((x, i) => {
    const p = Math.max(0.02, Math.min(0.98, ps[i])),
      t = a[i] / p,
      c = (1 - a[i]) / (1 - p),
      m0 = dot([...x, 0], beta),
      m1 = dot([...x, 1], beta);
    s1 += t * y[i];
    s0 += c * y[i];
    w1 += t;
    w0 += c;
    weights.push(t + c);
    sumw2 += (t + c) ** 2;
    regression += m1 - m0;
    aipw += m1 - m0 + t * (y[i] - m1) - c * (y[i] - m0);
    if (aipwContributions) {
      const residual = y[i] - (a[i] ? m1 : m0);
      const correction = t * (y[i] - m1) - c * (y[i] - m0);
      aipwContributions.push({
        person: i + 1,
        A: a[i],
        Y: y[i],
        m0,
        m1,
        p,
        weight: t + c,
        residual,
        contrast: m1 - m0,
        correction,
        contribution: m1 - m0 + correction,
      });
    }
  });
  return {
    values: [
      mean1 - mean0,
      mean1 - mean0,
      regression / n,
      s1 / w1 - s0 / w0,
      aipw / n,
    ],
    mean1,
    mean0,
    count,
    clipped,
    ess: (w1 + w0) ** 2 / sumw2,
    weights,
    propensities: ps,
    ...(aipwContributions ? { aipwContributions } : {}),
    ...(models.predictionPoints
      ? {
          predictions: models.predictionPoints.map((d) => ({
            outcome: dot(
              [
                ...features(
                  d,
                  adjustment,
                  models.outcome,
                  models.outcomeQuadratic,
                ),
                0,
              ],
              beta,
            ),
            treatment: sigmoid(
              dot(
                features(
                  d,
                  adjustment,
                  models.treatment,
                  models.treatmentQuadratic,
                ),
                propensity,
              ),
            ),
          })),
        }
      : {}),
  };
}
