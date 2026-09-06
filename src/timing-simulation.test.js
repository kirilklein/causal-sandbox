import test from "node:test";
import assert from "node:assert/strict";
import { baselineCollider } from "./timing-simulation.js";

const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
function cov(rows, x, y) {
  const mx = mean(rows.map((row) => row[x]));
  const my = mean(rows.map((row) => row[y]));
  return mean(rows.map((row) => (row[x] - mx) * (row[y] - my)));
}

test("baseline collider fits match independent centered-covariance OLS calculations", () => {
  const { data, withoutK, withK, truth } = baselineCollider();
  const aa = cov(data, "A", "A"),
    kk = cov(data, "K", "K");
  const ay = cov(data, "A", "Y"),
    ak = cov(data, "A", "K"),
    ky = cov(data, "K", "Y");
  assert.ok(Math.abs(withoutK - ay / aa) < 1e-7);
  assert.ok(Math.abs(withK - (ay * kk - ak * ky) / (aa * kk - ak * ak)) < 1e-7);
  assert.equal(truth, 2);
  assert.deepEqual(baselineCollider(), { data, withoutK, withK, truth });
  assert.notDeepEqual(baselineCollider({ seed: 4218 }).data, data);
});

test("adjusting for baseline K induces the bias predicted by the population covariance formula", () => {
  // P has unit variance; K=P+R+0.5e has variance 2.25. Symmetry gives P(A=1)=0.5.
  // q=Cov(A,P) is integrated independently from the simulation and fitting code.
  const steps = 10000,
    bound = Math.sqrt(3);
  let q = 0;
  for (let i = 0; i < steps; i++) {
    const p = -bound + (2 * bound * (i + 0.5)) / steps;
    q += p / (1 + Math.exp(-1.5 * p)) / steps;
  }
  const expectedAdjusted = 2 - (1.5 * q) / (0.25 * 2.25 - q * q);
  const studies = Array.from({ length: 40 }, (_, i) =>
    baselineCollider({ seed: 100 + i }),
  );
  const unadjusted = mean(studies.map((s) => s.withoutK));
  const adjusted = mean(studies.map((s) => s.withK));
  assert.ok(Math.abs(unadjusted - 2) < 0.04);
  assert.ok(Math.abs(adjusted - expectedAdjusted) < 0.04);
  assert.ok(Math.abs(adjusted - 2) > 0.7);
  assert.ok(Math.abs(mean(studies.map((s) => cov(s.data, "P", "R")))) < 0.02);
  console.log({ unadjusted, adjusted, expectedAdjusted });
});
