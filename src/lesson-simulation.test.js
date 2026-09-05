import test from "node:test";
import assert from "node:assert/strict";
import { makeNoise, estimate } from "./simulation.js";
import {
  lessonBaseline,
  simulateLesson,
  lessonResult,
  overlapDiagnostics,
} from "./lesson-simulation.js";

test("beginner worlds contain only the stated variables and mechanisms", () => {
  const noise = makeNoise();
  const baseline = lessonBaseline(1);
  const random = simulateLesson(baseline, noise);
  assert.deepEqual(Object.keys(random[0]).sort(), ["A", "Y"]);
  const changed = simulateLesson({ ...baseline, effect: 3 }, noise);
  random.forEach((d, i) => {
    assert.equal(changed[i].A, d.A);
    assert.ok(Math.abs(changed[i].Y - d.Y - d.A) < 1e-12);
  });
  const health = simulateLesson(lessonBaseline(2), noise);
  assert.deepEqual(Object.keys(health[0]).sort(), ["A", "C", "Y"]);
  health.forEach((d, i) => {
    assert.equal(d.C, noise[i].C1);
    assert.equal(d.A, random[i].A);
    assert.ok(Math.abs(d.Y - random[i].Y - 1.5 * d.C) < 1e-12);
  });
  const alternativeNoise = noise.map((e) => ({
    ...e,
    C2: 1e6,
    U: 1e6,
    eM: 1e6,
    eK: 1e6,
  }));
  assert.deepEqual(
    simulateLesson(lessonBaseline(3), alternativeNoise),
    simulateLesson(lessonBaseline(3), noise),
  );
});

test("baseline, adjustment, and redraw do not leak state or alter the world", () => {
  const baseline = lessonBaseline(3);
  const before = simulateLesson(baseline);
  assert.deepEqual(before, simulateLesson({ ...baseline, adjusted: true }));
  assert.notDeepEqual(before, simulateLesson({ ...baseline, seed: 4218 }));
  baseline.effect = -1;
  baseline.adjusted = true;
  assert.deepEqual(lessonBaseline(3), {
    level: 3,
    seed: 4217,
    n: 2400,
    effect: 2,
    selection: 1.2,
    outcomeInfluence: 1.5,
    adjusted: false,
    outcomeCurve: 0,
    treatmentCurve: 0,
    outcomeQuadratic: false,
    treatmentQuadratic: false,
  });
  assert.throws(() => lessonBaseline(7), /Unknown lesson/);
});

test("randomization, confounding, and weighting contrasts hold across 40 samples", () => {
  const sums = { random: 0, health: 0, raw: 0, ipw: 0, before: 0, after: 0 };
  let improved = 0;
  for (let seed = 100; seed < 140; seed++) {
    const r1 = lessonResult({ ...lessonBaseline(1), seed });
    const r2 = lessonResult({ ...lessonBaseline(2), seed });
    const baseline = { ...lessonBaseline(3), seed };
    const off = lessonResult(baseline);
    const on = lessonResult({ ...baseline, adjusted: true });
    assert.ok(Math.abs(off.ipw - off.unadjusted) < 1e-10);
    assert.deepEqual(off.before, on.before);
    assert.equal(off.unadjusted, on.unadjusted);
    assert.equal(on.clipped, 0);
    sums.random += r1.unadjusted - 2;
    sums.health += r2.unadjusted - 2;
    sums.raw += on.unadjusted - 2;
    sums.ipw += on.ipw - 2;
    sums.before += Math.abs(on.before[1] - on.before[0]);
    sums.after += Math.abs(on.after[1] - on.after[0]);
    if (Math.abs(on.ipw - 2) < Math.abs(on.unadjusted - 2)) improved++;
  }
  for (const key of ["random", "health", "ipw"])
    assert.ok(Math.abs(sums[key] / 40) < 0.06, `${key}: ${sums[key] / 40}`);
  assert.ok(sums.raw / 40 > 1);
  assert.ok(sums.after / 40 < 0.06);
  assert.ok(sums.before / 40 > 0.7);
  assert.ok(improved >= 36);
  console.log(
    "Lesson validation, mean bias and balance over 40 samples:",
    Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, v / 40])),
  );
});

test("model lessons keep one cause, the total effect, and paired world draws", () => {
  const baseline = lessonBaseline(5);
  const noise = makeNoise(baseline.n, baseline.seed);
  const simple = simulateLesson(baseline, noise);
  const curved = simulateLesson({ ...baseline, outcomeCurve: 2 }, noise);
  const treatment = simulateLesson({ ...baseline, treatmentCurve: 0.9 }, noise);
  simple.forEach((d, i) => {
    assert.deepEqual(Object.keys(curved[i]).sort(), ["A", "C", "Y"]);
    assert.equal(curved[i].A, d.A);
    assert.ok(Math.abs(curved[i].Y - d.Y - 2 * (d.C ** 2 - 1)) < 1e-12);
    assert.ok(
      Math.abs(treatment[i].Y - d.Y - 2 * (treatment[i].A - d.A)) < 1e-12,
    );
  });
  assert.ok(treatment.some((d, i) => d.A !== simple[i].A));
  for (const level of [4, 5, 6]) {
    const state = lessonBaseline(level);
    assert.equal(state.adjusted, true);
    assert.equal(state.outcomeCurve, level === 6 ? 2 : 0);
    assert.equal(state.treatmentCurve, level === 6 ? 0.9 : 0);
    assert.deepEqual(
      simulateLesson(state, noise),
      simulateLesson(
        { ...state, outcomeQuadratic: true, treatmentQuadratic: true },
        noise,
      ),
    );
    const world = { ...state, outcomeCurve: 2, treatmentCurve: 0.9 };
    const untreated = simulateLesson(
      world,
      noise.map((e) => ({ ...e, a: 1 })),
    );
    const treated = simulateLesson(
      world,
      noise.map((e) => ({ ...e, a: 0 })),
    );
    treated.forEach((d, i) =>
      assert.ok(Math.abs(d.Y - untreated[i].Y - state.effect) < 1e-12),
    );
    state.seed++;
    state.outcomeQuadratic = true;
    assert.equal(lessonBaseline(level).seed, 4217);
    assert.equal(lessonBaseline(level).outcomeQuadratic, level === 6);
  }
});

test("quadratic model choices are independent and require observed C", () => {
  const state = {
    ...lessonBaseline(6),
    outcomeQuadratic: false,
    treatmentQuadratic: false,
  };
  const basic = lessonResult(state);
  const outcome = lessonResult({ ...state, outcomeQuadratic: true });
  const treatment = lessonResult({ ...state, treatmentQuadratic: true });
  assert.equal(basic.ipw, outcome.ipw);
  assert.equal(basic.regression, treatment.regression);
  assert.equal(basic.unadjusted, outcome.unadjusted);
  assert.equal(basic.unadjusted, treatment.unadjusted);
  assert.ok(Math.abs(basic.regression - outcome.regression) > 1);
  assert.ok(Math.abs(basic.ipw - treatment.ipw) > 0.5);
  const data = simulateLesson(state);
  assert.deepEqual(
    estimate(data, [], { outcomeQuadratic: true, treatmentQuadratic: true }),
    estimate(data, []),
  );
});

test("model failures and all four specifications hold across 40 independent samples", () => {
  for (const [name, curves] of Object.entries({
    simple: {},
    outcome: { outcomeCurve: 2 },
    treatment: { treatmentCurve: 0.9 },
    both: { outcomeCurve: 2, treatmentCurve: 0.9 },
  })) {
    for (const outcomeQuadratic of [false, true]) {
      for (const treatmentQuadratic of [false, true]) {
        const biases = { regression: 0, ipw: 0, aipw: 0 };
        for (let seed = 100; seed < 140; seed++) {
          const r = lessonResult({
            ...lessonBaseline(5),
            ...curves,
            outcomeQuadratic,
            treatmentQuadratic,
            seed,
          });
          assert.equal(
            r.clipped,
            0,
            `${name}: clipping would obscure double robustness`,
          );
          for (const method in biases) biases[method] += (r[method] - 2) / 40;
        }
        const correctOutcome = !curves.outcomeCurve || outcomeQuadratic;
        const correctTreatment = !curves.treatmentCurve || treatmentQuadratic;
        const context = `${name}, outcome curve ${outcomeQuadratic}, treatment curve ${treatmentQuadratic}: ${JSON.stringify(biases)}`;
        assert.ok(
          correctOutcome
            ? Math.abs(biases.regression) < 0.06
            : Math.abs(biases.regression) > 0.12,
          context,
        );
        assert.ok(
          correctTreatment
            ? Math.abs(biases.ipw) < 0.06
            : Math.abs(biases.ipw) > 0.2,
          context,
        );
        assert.ok(
          correctOutcome || correctTreatment
            ? Math.abs(biases.aipw) < 0.06
            : Math.abs(biases.aipw) > 1,
          context,
        );
      }
    }
  }
});

test("model preview uses the fitted models and the same generating relationships", () => {
  const state = {
    ...lessonBaseline(5),
    outcomeCurve: 2,
    outcomeQuadratic: true,
  };
  const noise = makeNoise(state.n, state.seed).map((e) => ({ ...e, eY: 0 }));
  const result = lessonResult(state, noise);
  assert.equal(result.preview.length, 41);
  for (const point of result.preview) {
    assert.ok(Math.abs(point.fitted.outcome - point.outcome) < 1e-7);
    assert.ok(point.fitted.treatment > 0 && point.fitted.treatment < 1);
  }
  const simple = lessonResult({ ...state, outcomeQuadratic: false }, noise);
  assert.ok(
    simple.preview.some((p) => Math.abs(p.fitted.outcome - p.outcome) > 1),
  );
  const redraw = lessonResult({ ...state, seed: 999 });
  assert.deepEqual(
    result.preview.map((p) => p.outcome),
    redraw.preview.map((p) => p.outcome),
  );
  assert.notDeepEqual(
    result.preview.map((p) => p.fitted),
    redraw.preview.map((p) => p.fitted),
  );
});

test("overlap lesson restores observed C and correct simple models with paired draws", () => {
  const baseline = lessonBaseline(10);
  assert.deepEqual(baseline, { ...lessonBaseline(4), level: 10 });
  const noise = makeNoise(baseline.n, baseline.seed);
  const moderate = simulateLesson(baseline, noise);
  const strong = simulateLesson({ ...baseline, selection: 5 }, noise);
  moderate.forEach((d, i) => {
    assert.deepEqual(Object.keys(d).sort(), ["A", "C", "Y"]);
    assert.equal(d.C, strong[i].C);
    assert.ok(Math.abs(strong[i].Y - d.Y - 2 * (strong[i].A - d.A)) < 1e-12);
  });
  assert.ok(strong.some((d, i) => d.A !== moderate[i].A));
  const result = lessonResult({ ...baseline, selection: 5 }, noise);
  const fit = estimate(strong, ["C"], baseline);
  for (const arm of [0, 1]) {
    const summary = result.overlap[arm];
    const indices = strong.flatMap((d, i) => (d.A === arm ? [i] : []));
    const weights = indices.map(
      (i) =>
        1 /
        (arm
          ? Math.max(0.02, Math.min(0.98, fit.propensities[i]))
          : 1 - Math.max(0.02, Math.min(0.98, fit.propensities[i]))),
    );
    const total = weights.reduce((s, w) => s + w, 0);
    assert.equal(summary.count, indices.length);
    assert.equal(
      summary.bins.reduce((s, n) => s + n, 0),
      indices.length,
    );
    assert.ok(
      Math.abs(
        summary.ess - total ** 2 / weights.reduce((s, w) => s + w ** 2, 0),
      ) < 1e-9,
    );
    assert.ok(summary.ess > 0 && summary.ess <= summary.count);
    const top = weights
      .sort((a, b) => b - a)
      .slice(0, Math.ceil(indices.length / 100));
    assert.ok(
      Math.abs(summary.topShare - top.reduce((s, w) => s + w, 0) / total) <
        1e-12,
    );
  }
});

test("strong selection reduces support and increases weight concentration across samples", () => {
  const results = [1.2, 5].map((selection) =>
    Array.from({ length: 40 }, (_, i) =>
      lessonResult({ ...lessonBaseline(10), selection, seed: 100 + i }),
    ),
  );
  const average = (rs, get) => rs.reduce((s, r) => s + get(r) / rs.length, 0);
  for (const arm of [0, 1]) {
    const ess = (rs) => average(rs, (r) => r.overlap[arm].ess);
    const share = (rs) => average(rs, (r) => r.overlap[arm].topShare);
    assert.ok(ess(results[1]) < ess(results[0]) * 0.6);
    assert.ok(share(results[1]) > share(results[0]) * 2);
  }
  assert.equal(
    average(results[0], (r) => r.clipped),
    0,
  );
  assert.ok(average(results[1], (r) => r.clipped) > 1000);
  for (const method of ["ipw", "regression", "aipw"]) {
    const variance = (rs) => {
      const mean = average(rs, (r) => r[method]);
      return average(rs, (r) => (r[method] - mean) ** 2);
    };
    assert.ok(variance(results[1]) > variance(results[0]) * 1.5);
    assert.ok(results.flat().every((r) => Number.isFinite(r[method])));
  }
  // A correct outcome model can still perform well: no guaranteed failure claim.
  assert.ok(Math.abs(average(results[1], (r) => r.regression - 2)) < 0.06);
  assert.ok(Math.abs(average(results[1], (r) => r.aipw - 2)) < 0.06);
});

test("overlap summaries handle bin edges, equal weights, concentration and an empty arm", () => {
  const data = Array.from({ length: 100 }, () => ({ A: 1 }));
  const ps = data.map((_, i) => (i === 0 ? 0 : i === 99 ? 1 : 0.5));
  const equal = overlapDiagnostics(
    data,
    ps,
    data.map(() => 2),
  );
  assert.equal(equal[0].ess, null);
  assert.equal(equal[0].topShare, null);
  assert.equal(equal[1].ess, 100);
  assert.equal(equal[1].topShare, 0.01);
  assert.equal(equal[1].bins[0], 1);
  assert.equal(equal[1].bins[9], 1);
  assert.equal(equal[1].bins[5], 98);
  const concentrated = overlapDiagnostics(
    data,
    ps,
    data.map((_, i) => (i ? 1 : 50)),
  );
  assert.equal(concentrated[1].ess, 149 ** 2 / 2599);
  assert.equal(concentrated[1].topShare, 50 / 149);
});
