import test from "node:test";
import assert from "node:assert/strict";
import { bindTrajectoryOrbit } from "./trajectory-orbit.js";

const key = (canvas, value) =>
  canvas.dispatchEvent(
    Object.assign(new Event("keydown", { cancelable: true }), { key: value }),
  );

test("orbit controls respect availability and can be removed independently", () => {
  const first = new EventTarget();
  const second = new EventTarget();
  const rotations = [];
  let enabled = false;
  let resets = 0;
  const options = {
    enabled: () => enabled,
    onStart() {},
    onRotate: (...delta) => rotations.push(delta),
    onReset: () => resets++,
  };
  const firstOrbit = bindTrajectoryOrbit(first, options);
  const secondOrbit = bindTrajectoryOrbit(second, options);
  assert.equal(key(first, "ArrowRight"), true);
  assert.deepEqual(rotations, []);
  enabled = true;
  assert.equal(key(first, "ArrowRight"), false);
  assert.deepEqual(rotations, [[0.06, 0]]);
  assert.equal(key(first, "Home"), false);
  assert.equal(resets, 1);
  assert.equal(key(first, "Tab"), true);
  firstOrbit.destroy();
  assert.equal(key(first, "ArrowRight"), true);
  assert.equal(key(second, "ArrowUp"), false);
  assert.deepEqual(rotations, [
    [0.06, 0],
    [0, -0.03],
  ]);
  secondOrbit.destroy();
  assert.equal(key(second, "Home"), true);
  assert.equal(resets, 1);
});
