import test from "node:test";
import assert from "node:assert/strict";
import { relevanceSample, relevanceWorlds } from "./relevance-simulation.js";
import { studySummary } from "./instrument-simulation.js";

const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
const covariance = (x, y) => {
  const mx = mean(x),
    my = mean(y);
  return mean(x.map((v, i) => (v - mx) * (y[i] - my)));
};

test("both effect estimates and held-out errors match independent centered OLS", () => {
  for (const world of relevanceWorlds) {
    const result = relevanceSample({ world });
    const training = result.data.slice(0, 1200);
    const validation = result.data.slice(1200);
    const a = training.map((d) => d.A),
      v = training.map((d) => d.V),
      y = training.map((d) => d.Y);
    const aa = covariance(a, a),
      vv = covariance(v, v),
      av = covariance(a, v);
    const ay = covariance(a, y),
      vy = covariance(v, y);
    const adjustedA = (ay * vv - vy * av) / (aa * vv - av ** 2);
    const adjustedV = (vy * aa - ay * av) / (aa * vv - av ** 2);
    for (const [i, [betaA, betaV]] of [
      [ay / aa, 0],
      [adjustedA, adjustedV],
    ].entries()) {
      const intercept = mean(y) - betaA * mean(a) - betaV * mean(v);
      const rmse = Math.sqrt(
        mean(
          validation.map(
            (d) => (d.Y - intercept - betaA * d.A - betaV * d.V) ** 2,
          ),
        ),
      );
      assert.ok(Math.abs(result.fits[i].effect - betaA) < 1e-7, world);
      assert.ok(Math.abs(result.fits[i].rmse - rmse) < 1e-7, world);
    }
    assert.deepEqual(Object.keys(result.data[0]), ["A", "V", "Y"]);
    assert.equal(result.truth, 2);
  }
});

test("repeated samples distinguish prediction, bias, and precision", () => {
  const summaries = {};
  for (const world of relevanceWorlds) {
    const samples = Array.from({ length: 100 }, (_, i) =>
      relevanceSample({ world, seed: 900 + i }),
    );
    summaries[world] = [0, 1].map((j) => ({
      effect: studySummary(samples.map((s) => s.fits[j].effect)),
      prediction: mean(samples.map((s) => s.fits[j].rmse)),
    }));
  }
  for (const world of ["unrelated", "predictor"]) {
    for (const fit of summaries[world])
      assert.ok(Math.abs(fit.effect.mean - 2) < 0.03);
  }
  assert.ok(
    Math.abs(
      summaries.unrelated[0].prediction - summaries.unrelated[1].prediction,
    ) < 0.01,
  );
  assert.ok(
    summaries.predictor[1].effect.sd < 0.7 * summaries.predictor[0].effect.sd,
  );
  for (const world of ["predictor", "proxy", "collider"]) {
    assert.ok(
      summaries[world][1].prediction < summaries[world][0].prediction - 0.15,
      world,
    );
  }
  assert.ok(summaries.proxy[0].effect.mean > 3.4);
  assert.ok(
    summaries.proxy[1].effect.mean > 2.8,
    "proxy leaves residual confounding",
  );
  assert.ok(
    summaries.proxy[1].effect.mean < summaries.proxy[0].effect.mean - 0.5,
  );
  assert.ok(Math.abs(summaries.collider[0].effect.mean - 2) < 0.03);
  assert.ok(Math.abs(summaries.collider[1].effect.mean - 1.097) < 0.03);
});

test("world changes preserve background draws; redraw is reproducible", () => {
  const baseline = relevanceSample();
  assert.deepEqual(relevanceSample(), baseline);
  const predictor = relevanceSample({ world: "predictor" });
  baseline.data.forEach((d, i) => {
    assert.equal(d.A, predictor.data[i].A);
    assert.equal(d.V, predictor.data[i].V);
    assert.ok(Math.abs(predictor.data[i].Y - d.Y - 1.5 * d.V) < 1e-12);
  });
  assert.notDeepEqual(relevanceSample({ seed: 4218 }).data, baseline.data);
  assert.throws(
    () => relevanceSample({ world: "unknown" }),
    /Unknown relevance world/,
  );
});
