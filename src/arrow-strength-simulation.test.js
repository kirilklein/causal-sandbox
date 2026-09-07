import test from "node:test";
import assert from "node:assert/strict";
import {
  arrowStrengthSimulation,
  cancellationDirectEffect,
  meanDifference,
  populationZEffect,
} from "./arrow-strength-simulation.js";
import { makeNoise } from "./simulation.js";

test("arrow strengths change mechanisms without redrawing the background", () => {
  const noise = makeNoise(2400, 4217);
  const baseline = arrowStrengthSimulation();
  const changed = arrowStrengthSimulation({
    treatmentStrength: 1.25,
    directEffect: -0.4,
  });
  assert.deepEqual(arrowStrengthSimulation(), baseline);
  changed.data.forEach((row, index) => {
    const draw = noise[index];
    const probability = 1 / (1 + Math.exp(0.8 - 1.2 * row.C - 1.25 * row.Z));
    assert.equal(row.C, baseline.data[index].C);
    assert.equal(row.Z, baseline.data[index].Z);
    assert.equal(row.A, +(draw.a < probability));
    assert.equal(row.Y, 2 * row.A + 1.5 * row.C - 0.4 * row.Z + draw.eY);
    assert.deepEqual(Object.keys(row), ["C", "Z", "A", "Y"]);
  });
});

test("the cancellation setting has a direct effect but zero population total effect", () => {
  for (const treatmentStrength of [0.5, 1, 2, 3]) {
    const directEffect = cancellationDirectEffect(treatmentStrength);
    assert.ok(directEffect < 0);
    assert.ok(
      Math.abs(populationZEffect({ treatmentStrength, directEffect })) < 1e-12,
    );
  }
});

test("the displayed association is the binary-Z regression coefficient", () => {
  const data = [
    { Z: 0, Y: 1 },
    { Z: 0, Y: 3 },
    { Z: 1, Y: 4 },
    { Z: 1, Y: 8 },
  ];
  assert.equal(meanDifference(data, "Z", "Y"), 4);
});

test("cancellation hides the Z association but not confounding of treatment", () => {
  const treatmentStrength = 2;
  const directEffect = cancellationDirectEffect(treatmentStrength);
  const associations = [];
  const means = [
    [0, 0, 0],
    [0, 0, 0],
  ];
  const studies = 200;
  for (let seed = 100; seed < 100 + studies; seed++) {
    const result = arrowStrengthSimulation({
      seed,
      treatmentStrength,
      directEffect,
    });
    associations.push(result.zAssociation);
    result.fits.forEach((fit, adjustment) => {
      assert.equal(fit.clipped, 0);
      [3, 2, 4].forEach(
        (index, method) =>
          (means[adjustment][method] += fit.values[index] / studies),
      );
    });
  }
  const meanAssociation =
    associations.reduce((sum, value) => sum + value, 0) / studies;
  assert.ok(Math.abs(meanAssociation) < 0.02);
  for (let method = 0; method < 3; method++) {
    assert.ok(means[0][method] < 1.7);
    assert.ok(Math.abs(means[1][method] - 2) < 0.02);
  }
});
