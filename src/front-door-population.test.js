import test from "node:test";
import assert from "node:assert/strict";
import { frontDoorPopulation, reconstructFrontDoor } from "./front-door.js";
import {
  frontDoorStudents,
  studentPanels,
  studentLayout,
} from "./front-door-population.js";

const { cells } = frontDoorPopulation();
const result = reconstructFrontDoor(cells);
const students = frontDoorStudents(cells);
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test("the observed teaching population represents every cell exactly", () => {
  assert.equal(students.length, 1000);
  assert.equal(new Set(students.map(({ id }) => id)).size, 1000);
  for (const cell of cells)
    close(
      students.filter(
        ({ a, m, y }) => a === cell.a && m === cell.m && y === cell.y,
      ).length / 1000,
      cell.mass,
    );
  assert.deepEqual(Object.keys(students[0]), ["id", "a", "m", "y"]);
  const panels = studentPanels(students, result, 0);
  panels.forEach((panel, a) => {
    assert.equal(panel.count, 500);
    close(panel.rate, result.observed[a]);
  });
});

test("regrouping preserves each observed person and exposes the practice mix", () => {
  const panels = studentPanels(students, result, 1);
  assert.deepEqual(
    panels.map(({ groups }) => groups.map(({ rows }) => rows.length)),
    [
      [400, 100],
      [150, 350],
    ],
  );
  const records = panels.flatMap(({ groups }) =>
    groups.flatMap(({ rows }) => rows.map(({ person }) => person)),
  );
  assert.equal(new Set(records).size, 1000);
  assert.ok(records.every((person) => students.includes(person)));
});

test("standardizing the tutoring mix identifies the practice response", () => {
  const original = studentPanels(students, result, 2);
  close(original[0].rate, 115 / 550);
  close(original[1].rate, 315 / 450);
  const balanced = studentPanels(students, result, 2, true);
  balanced.forEach((panel, m) => {
    close(panel.rate, result.response[m]);
    panel.groups.forEach((group) => close(group.mass / panel.mass, 0.5));
    close(panel.mass, panel.count);
  });
});

test("reusing observed records in two weighted populations recovers both risks", () => {
  const panels = studentPanels(students, result, 3);
  panels.forEach((panel, a) => {
    close(panel.mass, 1000);
    close(panel.rate, result.rebuilt[a]);
    panel.groups.forEach((group, m) =>
      close(group.mass / panel.mass, result.pM[a][m]),
    );
    const records = panel.groups.flatMap(({ rows }) =>
      rows.map(({ person }) => person),
    );
    assert.equal(new Set(records).size, 1000);
    assert.ok(records.every((person) => person === students[person.id - 1]));
  });
  close(panels[1].rate - panels[0].rate, 0.2);
});

test("marks fit narrow and wide scenes, with area proportional to weight", () => {
  for (const width of [248, 360, 1000])
    for (const stage of [0, 1, 2, 3]) {
      const panels = studentPanels(students, result, stage, true);
      const layout = studentLayout(panels, width);
      for (const panel of panels) {
        const marks = layout.marks.filter((mark) => mark.panel === panel.panel);
        const areaScale = marks[0].radius ** 2 / marks[0].weight;
        for (const mark of marks) {
          close(mark.radius ** 2 / mark.weight, areaScale);
          assert.ok(
            mark.x - 1.56 * mark.radius > 0 &&
              mark.x + 1.56 * mark.radius < width,
          );
          assert.ok(
            mark.y - 1.56 * mark.radius > 0 &&
              mark.y + 1.56 * mark.radius < layout.height,
          );
        }
      }
    }
});
