import test from "node:test";
import assert from "node:assert/strict";
import { observedPatients, observedComparison } from "./foundations-study.js";
import {
  weightPatients,
  supportStudy,
  hiddenStudy,
  curvedStudy,
  trainingResult,
  predictedMeans,
} from "./foundations-analysis.js";
import { activities } from "./foundations-activities.js";
import { gradeAdjustment } from "./adjustment-model.js";
import { moduleForTopic, modules } from "./foundations-catalog.js";
import {
  readPilot,
  savePilot,
  completeModule,
  completedModules,
  saveActivity,
  pilotDestination,
} from "./foundations-progress.js";

const close = (actual, wanted) =>
  assert.ok(Math.abs(actual - wanted) < 1e-4, `${actual} vs ${wanted}`);
test("standardization, weighting and outcome regression use the same target", () => {
  const rows = observedPatients(1);
  const weighted = weightPatients(rows);
  weighted.means.forEach((value, i) => close(value, [54, 66][i]));
  predictedMeans().forEach((value, i) => close(value, [54, 66][i]));
  weighted.mass.forEach((m) => close(m, 100));
  close(weighted.maximum, 10);
  close(weighted.effect, observedComparison(rows).standardized);
});
test("three failure experiments isolate their intended mechanisms", () => {
  close(weightPatients(supportStudy("balanced")).maximum, 2);
  close(weightPatients(supportStudy("weak")).maximum, 10);
  const empty = supportStudy("empty");
  assert.equal(observedComparison(empty).strata[9][0].count, 0);
  assert.equal(weightPatients(empty), null);
  assert.equal(observedComparison(empty).standardized, null);
  close(hiddenStudy().adjusted, 0);
  close(hiddenStudy().withFrailty, 12);
  const simple = curvedStudy(false),
    flexible = curvedStudy(true);
  close(simple.observed, flexible.observed);
  assert.ok(simple.predicted - simple.observed > 10);
  close(flexible.observed, flexible.predicted);
  close(flexible.effect, 12);
});
test("graph decisions and the job training estimate grade the intended contrasts", () => {
  const [common, mediator, collider] = activities.adjustment;
  for (const q of [common, mediator, activities.capstone[1]])
    assert.ok(gradeAdjustment(q.graph, "set:C").correct);
  assert.ok(!gradeAdjustment(mediator.graph, "set:C,M").correct);
  assert.ok(!gradeAdjustment(collider.graph, "set:K").correct);
  assert.ok(gradeAdjustment(collider.graph, "none").correct);
  close(trainingResult().points, 16);
  assert.equal(
    modules.reduce((n, m) => n + m.minutes, 0),
    240,
  );
  assert.equal(moduleForTopic("ipw").id, "estimation");
});
test("pilot bookmarks survive new course activity and direct capstone entry", (t) => {
  const store = new Map();
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k) => store.get(k) || null,
      setItem: (k, v) => store.set(k, v),
    },
  });
  t.after(() => {
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  savePilot({ current: "pilot", stage: "assign", assignment: 25 });
  assert.equal(pilotDestination(readPilot()), "?lesson=observed-difference");
  savePilot({ current: "adjustment", stage: "done" });
  saveActivity("capstone", {
    step: "design",
    records: { target: { first: { correct: true } } },
  });
  assert.equal(readPilot().assignment, 25);
  assert.deepEqual(completedModules(), ["pilot"]);
  completeModule("capstone");
  completeModule("capstone");
  saveActivity("capstone", { step: "summary" });
  assert.deepEqual(completedModules(), ["pilot", "capstone"]);
  assert.equal(
    readPilot().activities.capstone.records.target.first.correct,
    true,
  );
  assert.equal(pilotDestination(readPilot()), "?lesson=foundations-capstone");
});
