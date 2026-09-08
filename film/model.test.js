import test from "node:test";
import assert from "node:assert/strict";
import {
  patients,
  position,
  progress,
  cameraAt,
  project,
  TREATMENT,
} from "./model.js";

test("the two worlds share all history and a tangent at treatment", () => {
  for (const patient of patients) {
    for (const t of [0, 0.2, TREATMENT])
      assert.deepEqual(position(patient, t, 0), position(patient, t, 1));
    const h = 1e-6;
    const a = position(patient, TREATMENT + h, 0);
    const b = position(patient, TREATMENT + h, 1);
    assert.ok(Math.abs((b.y - a.y) / h) < 0.0001);
  }
});

test("the endpoint gap is the same-patient treatment contrast at the same time", () => {
  for (const patient of patients) {
    const a = position(patient, 1, 0);
    const b = position(patient, 1, 1);
    assert.equal(a.x, b.x);
    assert.equal(a.z, b.z);
    assert.ok(Math.abs(b.y - a.y - patient.effect) < 1e-12);
    assert.equal(progress(22, patient), 1);
    assert.ok(patient.effect > 0);
  }
  assert.ok(patients.some((p) => p.treated));
  assert.ok(patients.some((p) => !p.treated));
  assert.ok(new Set(patients.map((p) => p.effect)).size > 10);
});

test("final orthographic view preserves every gap on one shared outcome scale", () => {
  const camera = cameraAt(32);
  for (const patient of patients) {
    const a = project(position(patient, 1, 0), camera);
    const b = project(position(patient, 1, 1), camera);
    assert.ok(Math.abs(a.x - b.x) < 1e-10);
    assert.ok(Math.abs(a.y - b.y - patient.effect * 72) < 1e-10);
    for (const p of [a, b])
      assert.ok(p.x > 200 && p.x < 1720 && p.y > 350 && p.y < 850);
  }
});
