import test from "node:test";
import assert from "node:assert/strict";
import {
  patients,
  position,
  progress,
  cameraAt,
  project,
  TREATMENT,
  sceneTime,
  DURATION,
  SOCIAL_DURATION,
} from "./model.js";

test("one scene clock decelerates continuously without a late speed burst", () => {
  assert.equal(sceneTime(0), 2);
  const h = 0.001;
  let previousSpeed = 2.2;
  let previousYaw = cameraAt(sceneTime(0)).yaw;
  for (let t = h; t < DURATION - h; t += 0.025) {
    const speed = (sceneTime(t + h) - sceneTime(t - h)) / (2 * h);
    assert.ok(speed >= 1 - 1e-9 && speed <= 2.2 + 1e-9);
    assert.ok(
      speed <= previousSpeed + 1e-9,
      "the scene must not accelerate again",
    );
    const yaw = cameraAt(sceneTime(t)).yaw;
    assert.ok(yaw >= previousYaw, "the camera must not reverse direction");
    previousSpeed = speed;
    previousYaw = yaw;
  }
  for (const t of [3, 11]) {
    const before = (sceneTime(t) - sceneTime(t - h)) / h;
    const after = (sceneTime(t + h) - sceneTime(t)) / h;
    assert.ok(Math.abs(before - after) < 1e-6);
  }
});

test("the final camera move has five seconds and both exports end on the same view", () => {
  assert.ok(Math.abs(sceneTime(11.6) - 22) < 1e-12);
  assert.ok(Math.abs(sceneTime(15.6) - 26) < 1e-12);
  assert.ok(sceneTime(10.6) < 21.01);
  assert.ok(cameraAt(sceneTime(12.2)).flatten < 0.05);
  assert.equal(cameraAt(sceneTime(16.2)).flatten, 1);
  assert.equal(SOCIAL_DURATION, 20);
  assert.equal(DURATION, 22);
  for (const duration of [SOCIAL_DURATION, DURATION]) {
    assert.ok(sceneTime(duration) > 29);
    const camera = cameraAt(sceneTime(duration));
    for (const patient of patients) {
      assert.equal(progress(sceneTime(duration), patient), 1);
      const a = project(position(patient, 1, 0), camera);
      const b = project(position(patient, 1, 1), camera);
      assert.ok(Math.abs(a.y - b.y - patient.effect * 72) < 1e-10);
    }
  }
});

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
