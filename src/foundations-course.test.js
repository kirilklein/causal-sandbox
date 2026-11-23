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
  applicants,
  trainingGroups,
  trueTrainingEffect,
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
test("job training applicants reproduce the counts and the simulator truth", () => {
  assert.equal(applicants.length, 200);
  assert.deepEqual(trainingGroups, [
    { name: "Less work experience", offer: [20, 40], usual: [24, 80] },
    { name: "More work experience", offer: [48, 60], usual: [14, 20] },
  ]);
  for (const [experience, rates] of [
    [0, [0.3, 0.5]],
    [1, [0.7, 0.8]],
  ])
    for (const offer of [0, 1]) {
      const rows = applicants.filter(
        (a) => a.experience === experience && a.offer === offer,
      );
      [0, 1].forEach((choice) =>
        close(
          rows.reduce((n, a) => n + a.employed[choice], 0) / rows.length,
          rates[choice],
        ),
      );
    }
  assert.equal(trueTrainingEffect, 16);
  close(trainingResult().points, trueTrainingEffect);
});
test("home resumes a completed opening at module 2 even before its onward link is used", () => {
  const saved = { current: "opening", openingStep: 3, trialNumber: 1 };
  assert.equal(pilotDestination(saved), modules[0].href);
  assert.equal(pilotDestination({ ...saved, completedModules: ["opening"] }), modules[1].href);
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
