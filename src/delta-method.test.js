import test from "node:test";
import assert from "node:assert/strict";
import {
  orderRatioApproximation,
  jointRatioApproximation,
  ratioStudy,
  deltaRatioDifference,
  bootstrapRatioDifference,
} from "./delta-method.js";
import { searchTopics } from "./search-index.js";

const close = (a, b, tolerance = 1e-10) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);

test("order-ratio tangent maps checkout units and approaches the actual SE locally", () => {
  const narrow = orderRatioApproximation(2, 0.1);
  const wide = orderRatioApproximation(2, 0.45);
  close(narrow.center, 10);
  close(narrow.slope, -5);
  close(narrow.tangent(2.1), 9.5);
  close(narrow.sd, 0.5);
  assert.ok(Math.abs(narrow.sd / narrow.exactSD - 1) < 0.02);
  assert.ok(wide.exactSD > wide.sd * 1.1);
  assert.ok(wide.exactMean > wide.center);
  close(wide.density(-1), 0);
  close(
    wide.tangentDensity(wide.center - 1),
    wide.tangentDensity(wide.center + 1),
  );
  assert.throws(() => orderRatioApproximation(2, 0), RangeError);
  assert.throws(() => orderRatioApproximation(1.5, 0.5), RangeError);
});

test("positive sampling bell and ratio density retain probability and moments", () => {
  const integrate = (fn, lo, hi) => {
    const n = 20000;
    const dx = (hi - lo) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += fn(lo + (i + 0.5) * dx) * dx;
    return sum;
  };
  for (const [mean, sd] of [
    [2, 0.1],
    [2, 0.45],
    [1.5, 0.45],
    [3, 0.1],
  ]) {
    const m = orderRatioApproximation(mean, sd);
    close(integrate(m.inputDensity, m.lo, m.hi), 1, 1e-8);
    close(
      integrate((x) => x * m.inputDensity(x), m.lo, m.hi),
      mean,
      1e-8,
    );
    close(
      integrate((x) => (x - mean) ** 2 * m.inputDensity(x), m.lo, m.hi),
      sd ** 2,
      1e-8,
    );
    const lo = m.transform(m.hi),
      hi = m.transform(m.lo);
    close(integrate(m.density, lo, hi), 1, 1e-8);
    close(
      integrate((y) => y * m.density(y), lo, hi),
      m.exactMean,
      1e-7,
    );
    close(
      Math.sqrt(
        integrate((y) => (y - m.exactMean) ** 2 * m.density(y), lo, hi),
      ),
      m.exactSD,
      1e-7,
    );
    close(
      integrate(m.tangentDensity, m.tangent(m.hi), m.tangent(m.lo)),
      1,
      1e-8,
    );
  }
});

test("Delta ratio variance includes covariance and estimates ratios of totals", () => {
  const arms = [
    [
      { revenue: 1, orders: 1 },
      { revenue: 9, orders: 3 },
      { revenue: 0, orders: 0 },
    ],
    [
      { revenue: 4, orders: 1 },
      { revenue: 12, orders: 3 },
      { revenue: 10, orders: 2 },
    ],
  ];
  const result = deltaRatioDifference(arms);
  close(result.estimate, 26 / 6 - 10 / 4);
  const variances = arms.map((rows) => {
    const n = rows.length;
    const mx = rows.reduce((s, r) => s + r.revenue, 0) / n;
    const my = rows.reduce((s, r) => s + r.orders, 0) / n;
    const vx = rows.reduce((s, r) => s + (r.revenue - mx) ** 2, 0) / (n - 1);
    const vy = rows.reduce((s, r) => s + (r.orders - my) ** 2, 0) / (n - 1);
    const cov =
      rows.reduce((s, r) => s + (r.revenue - mx) * (r.orders - my), 0) /
      (n - 1);
    const ratio = mx / my;
    return (vx + ratio ** 2 * vy - 2 * ratio * cov) / (n * my ** 2);
  });
  close(result.se ** 2, variances[0] + variances[1]);
  const scaled = deltaRatioDifference(
    arms.map((rows) =>
      rows.map((r) => ({ revenue: r.revenue * 10, orders: r.orders * 10 })),
    ),
  );
  close(scaled.se, result.se);
  close(scaled.estimate, result.estimate);
});

test("paired-user bootstrap matches the exact support for a tiny study", () => {
  const arms = [
    [
      { revenue: 1, orders: 1 },
      { revenue: 9, orders: 3 },
    ],
    [
      { revenue: 4, orders: 1 },
      { revenue: 12, orders: 3 },
    ],
  ];
  const result = bootstrapRatioDifference(arms, {
    repetitions: 10000,
    seed: 51,
  });
  assert.equal(result.status, "ok");
  assert.deepEqual([...new Set(result.estimates)], [1, 1.5, 3]);
  close(result.lower, 1);
  close(result.upper, 3);
  close(result.estimate, 1.5);
});

test("undefined or degenerate intervals are explicit, not dropped", () => {
  const empty = Array.from({ length: 4 }, () => ({ revenue: 0, orders: 0 }));
  const sparse = [{ revenue: 10, orders: 1 }, ...empty];
  assert.equal(deltaRatioDifference([empty, sparse]).status, "unavailable");
  assert.equal(bootstrapRatioDifference([empty, sparse]).status, "unavailable");
  const resampled = bootstrapRatioDifference([sparse, sparse]);
  assert.equal(resampled.status, "unavailable");
  assert.ok(resampled.invalid > 0);
  assert.equal(resampled.lower, undefined);
  const constant = [
    { revenue: 2, orders: 1 },
    { revenue: 4, orders: 2 },
  ];
  assert.equal(
    deltaRatioDifference([constant, constant]).status,
    "unavailable",
  );
  assert.equal(
    bootstrapRatioDifference([constant, constant]).status,
    "unavailable",
  );
  assert.throws(() => deltaRatioDifference([[], []]), RangeError);
  assert.throws(() => ratioStudy({ active: NaN }), RangeError);
  assert.throws(
    () => bootstrapRatioDifference([constant, constant], { repetitions: 1 }),
    RangeError,
  );
});

test("regular repeated studies calibrate both intervals without assuming a winner", () => {
  const counts = { delta: 0, bootstrap: 0 };
  let mean = 0;
  const repetitions = 240;
  for (let i = 0; i < repetitions; i++) {
    const data = ratioStudy({ seed: 16000 + i, n: 200 });
    const delta = deltaRatioDifference(data);
    const bootstrap = bootstrapRatioDifference(data, { seed: 33000 + i });
    mean += delta.estimate / repetitions;
    for (const [method, result] of Object.entries({ delta, bootstrap })) {
      assert.equal(result.status, "ok");
      if (result.lower <= 2 && 2 <= result.upper) counts[method]++;
    }
  }
  close(mean, 2, 0.12);
  for (const covered of Object.values(counts))
    assert.ok(covered / repetitions > 0.89 && covered / repetitions < 0.995);
});

test("order-spend relationship changes arm ratios but preserves population contrast", () => {
  const means = [0, 0];
  for (let i = 0; i < 100; i++) {
    const result = deltaRatioDifference(
      ratioStudy({ seed: 91000 + i, n: 800, association: 2 }),
    );
    result.arms.forEach((arm, j) => {
      means[j] += arm.ratio / 100;
    });
  }
  close(means[0], 10 + 20 / 3, 0.15);
  close(means[1], 12 + 20 / 3, 0.15);
  const data = ratioStudy({ seed: 12 });
  assert.deepEqual(data, ratioStudy({ seed: 12 }));
  assert.deepEqual(
    bootstrapRatioDifference(data),
    bootstrapRatioDifference(data),
  );
});

test("Delta lesson is discoverable by method, use case, and attribution", () => {
  for (const query of [
    "delta method",
    "ratio bootstrap",
    "AOV",
    "Anton Bugaev",
  ])
    assert.ok(
      searchTopics(query).some(
        (entry) => entry.href === "?lesson=delta-method",
      ),
    );
});

test("joint ratio uncertainty cancels for proportional inputs and grows for opposing inputs", () => {
  close(jointRatioApproximation(1).se, 0);
  close(jointRatioApproximation(0).se, Math.sqrt(2));
  close(jointRatioApproximation(-1).se, 2);
  for (let i = 0; i < 32; i++) {
    const pair = jointRatioApproximation(1).contour((i * Math.PI) / 16);
    close(pair.revenue / pair.orders, 10);
  }
  assert.ok(jointRatioApproximation(0.9).se < jointRatioApproximation(0).se);
  assert.throws(() => jointRatioApproximation(1.1), RangeError);
});
