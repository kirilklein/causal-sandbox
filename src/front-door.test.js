import assert from "node:assert/strict";
import test from "node:test";
import { frontDoorPopulation, reconstructFrontDoor } from "./front-door.js";

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test("front-door reconstruction matches a hand-calculated population", () => {
  const { cells, truth } = frontDoorPopulation();
  const result = reconstructFrontDoor(cells);
  close(
    cells.reduce((sum, cell) => sum + cell.mass, 0),
    1,
  );
  assert.equal(cells.length, 8);
  assert.ok(
    cells.every((cell) => Object.keys(cell).sort().join() === "a,m,mass,y"),
  );
  [0.2, 0.7].forEach((value, a) => close(result.pM[a][1], value));
  [
    [0.16, 0.56],
    [0.34, 0.74],
  ].forEach((row, a) =>
    row.forEach((value, m) => close(result.outcome[a][m], value)),
  );
  [0.25, 0.65].forEach((value, m) => close(result.response[m], value));
  [0.33, 0.53].forEach((value, a) => {
    close(truth[a], value);
    close(result.rebuilt[a], value);
  });
  close(result.rawEffect, 0.38);
  close(result.effect, 0.2);
});

test("identification holds across hidden treatment-selection strengths", () => {
  for (let i = 0; i <= 16; i++) {
    const selection = i * 0.05;
    const population = frontDoorPopulation({ selection });
    const result = reconstructFrontDoor(population.cells);
    close(result.effect, population.effect);
    close(result.rawEffect, 0.2 + 0.3 * selection);
    close(result.response[0], 0.25);
    close(result.response[1], 0.65);
  }
});

test("direct path is omitted by the front-door functional", () => {
  for (const selection of [0, 0.4, 0.8]) {
    const population = frontDoorPopulation({ world: "direct", selection });
    const result = reconstructFrontDoor(population.cells);
    close(population.effect, 0.35);
    close(result.effect, 0.2);
  }
});

test("unmeasured mediator confounding can bias the reconstruction", () => {
  for (const selection of [0, 0.4, 0.8]) {
    const population = frontDoorPopulation({ world: "mediator", selection });
    const result = reconstructFrontDoor(population.cells);
    close(population.effect, 0.2);
    assert.ok(Math.abs(result.effect - population.effect) > 0.02);
  }
});

test("missing mediator-treatment combinations are unavailable, never imputed", () => {
  const population = frontDoorPopulation({ world: "support" });
  const result = reconstructFrontDoor(population.cells);
  assert.equal(result.supported, false);
  assert.equal(result.outcome[0][1], null);
  assert.equal(result.outcome[1][0], null);
  assert.equal(result.effect, null);
  assert.equal(result.rebuilt, null);
  close(population.effect, 0.4);
});

test("reconstruction respects observed group weights and mass rescaling", () => {
  const cells = [];
  for (const a of [0, 1])
    for (const m of [0, 1])
      for (const y of [0, 1]) {
        const pA = a ? 0.25 : 0.75;
        const pM = a ? 0.8 : 0.2;
        const pY = 0.1 + 0.4 * m + 0.2 * a;
        cells.push({
          a,
          m,
          y,
          mass: 1000 * pA * (m ? pM : 1 - pM) * (y ? pY : 1 - pY),
        });
      }
  const result = reconstructFrontDoor(cells);
  close(result.response[0], 0.15);
  close(result.response[1], 0.55);
  close(result.rebuilt[0], 0.23);
  close(result.rebuilt[1], 0.47);
});
