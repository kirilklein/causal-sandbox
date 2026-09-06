import assert from "node:assert/strict";
import test from "node:test";
import { calculate, grids, truth, colorLimits } from "./tmle-robustness.js";

for (const [pattern, cells] of Object.entries(grids)) {
  test(`${pattern}: both correct-model axes recover the population ATE`, () => {
    assert.equal(cells.length, 121);
    for (const cell of cells) {
      assert.ok(Number.isFinite(cell.tmle) && Number.isFinite(cell.ipw));
      assert.equal(cell.clipped, 0);
      if (cell.x === 0 || cell.y === 0)
        assert.ok(Math.abs(cell.tmle - truth) < 1e-10);
      if (cell.x === 0) assert.ok(Math.abs(cell.ipw - truth) < 1e-10);
      assert.ok(
        Math.max(Math.abs(cell.tmle - truth), Math.abs(cell.ipw - truth)) <=
          colorLimits[pattern],
      );
    }
  });

  test(`${pattern}: outcome distortion leaves IPW unchanged`, () => {
    for (const cell of cells)
      assert.ok(Math.abs(cell.ipw - calculate(pattern, cell.x, 0).ipw) < 1e-12);
  });

  test(`${pattern}: targeting error agrees with the population remainder`, () => {
    for (const cell of cells)
      assert.ok(Math.abs(cell.remainder - (cell.tmle - truth)) < 1e-10);
    assert.ok(cells.some((cell) => Math.abs(cell.tmle - truth) > 0.1));
    assert.ok(
      cells.some(
        (cell) =>
          Math.abs(cell.tmle - truth) > Math.abs(cell.ipw - truth) + 0.01,
      ),
    );
  });
}

test("distortions use the specified scales and fixed outcome reference", () => {
  const shift = calculate("shift", Math.log(2), 0.4);
  // Hand-normalized means: treated 4, untreated 1.8.
  assert.ok(Math.abs(shift.ipw - 2.2) < 1e-12);
  assert.ok(Math.abs(shift.models[0].fittedP - 1 / 3) < 1e-12);
  assert.ok(Math.abs(shift.models[1].fittedP - 8 / 9) < 1e-12);
  assert.deepEqual(
    shift.models.map(({ m0, m1 }) => [m0, m1]),
    [
      [0.4, 1.4],
      [3.4, 6.4],
    ],
  );
  const scale = calculate("scale", Math.log(2), Math.log(2));
  assert.ok(Math.abs(scale.models[0].fittedP - 1 / 17) < 1e-12);
  assert.ok(Math.abs(scale.models[1].fittedP - 16 / 17) < 1e-12);
  assert.deepEqual(
    scale.models.map(({ m0, m1 }) => [m0, m1]),
    [
      [-2.5, -0.5],
      [3.5, 9.5],
    ],
  );
});
