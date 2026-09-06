import assert from "node:assert/strict";
import { trimmingSample, trimmingResult } from "../src/trimming-experiment.js";

// Fixed design: the simulation truth evaluates thresholds, never selects them.
const report = [];
for (const selection of [0.8, 3]) {
  const studies = Array.from({ length: 200 }, (_, i) =>
    trimmingSample({ selection, seed: 1000 + i }),
  );
  for (const threshold of [0, 0.01, 0.1, 0.2]) {
    const results = studies.map(({ rows, effects }) =>
      trimmingResult(rows, effects, threshold),
    );
    for (const key of ["retained", "excluded"]) {
      const groups = results.map((result) => result.groups[key]);
      const errors = groups
        .filter((group) => group.available)
        .map((group) => group.ipw - group.truth);
      const meanError = errors.length
        ? errors.reduce((sum, error) => sum + error, 0) / errors.length
        : null;
      const sdError =
        errors.length > 1
          ? Math.sqrt(
              errors.reduce((sum, error) => sum + (error - meanError) ** 2, 0) /
                (errors.length - 1),
            )
          : null;
      const rmse = errors.length
        ? Math.sqrt(
            errors.reduce((sum, error) => sum + error ** 2, 0) / errors.length,
          )
        : null;
      const comparable = results.filter(
        (result) =>
          result.groups[key].available && result.groups.everyone.available,
      );
      const improved = comparable.filter((result) => {
        const group = result.groups[key];
        const all = result.groups.everyone;
        return (
          Math.abs(group.ipw - group.truth) < Math.abs(all.ipw - all.truth)
        );
      }).length;
      const worsened = comparable.filter((result) => {
        const group = result.groups[key];
        const all = result.groups.everyone;
        return (
          Math.abs(group.ipw - group.truth) > Math.abs(all.ipw - all.truth)
        );
      }).length;
      report.push({
        selection,
        threshold,
        group: key,
        meanN: groups.reduce((sum, group) => sum + group.n, 0) / groups.length,
        unavailable: groups.length - errors.length,
        meanError,
        sdError,
        rmse,
        comparable: comparable.length,
        improved,
        worsened,
      });
    }
  }
}
const retained = (selection, threshold) =>
  report.find(
    (row) =>
      row.selection === selection &&
      row.threshold === threshold &&
      row.group === "retained",
  );
assert.ok(retained(0.8, 0.2).rmse > retained(0.8, 0).rmse);
assert.ok(retained(3, 0.1).rmse < retained(3, 0).rmse);
assert.ok(retained(3, 0.1).improved > 0 && retained(3, 0.1).worsened > 0);
console.log(JSON.stringify(report, null, 2));
