import { observedPatients, observedComparison } from "./foundations-study.js";
import {
  weightPatients,
  supportStudy,
  hiddenStudy,
  curvedStudy,
  trainingGroups,
  predictedMeans,
} from "./foundations-analysis.js";

const patients = observedPatients(1);
const { arms, strata } = observedComparison(patients);
const targetMeans = [0, 1].map((arm) =>
  strata.reduce((total, cell) => total + cell[arm].mean / strata.length, 0),
);
const format = (value) => value.toFixed(2);
function means(values) {
  return `<div class="pilot-means">${["Untreated", "Treated", "Difference"].map((label, i) => `<div><span>${label}</span><strong>${format([...values, values[1] - values[0]][i])}</strong></div>`).join("")}</div><small>Mean day-12 health, in points</small>`;
}
export const settings = {
  predict: ["Nobody treated", "Everyone treated"],
  within: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  standardize: ["Observed arm mix", "All 100 patients"],
  weight: ["Original counts", "Inverse probability weights"],
  support: ["Equal shares", "Weak overlap", "Missing untreated group"],
  hidden: ["Measured severity only", "Reveal and adjust for frailty"],
  curve: ["Straight line", "Add a quadratic term"],
};
const labels = {
  predict: "Set treatment for prediction",
  within: "Baseline severity",
  standardize: "Severity mix for averaging",
  weight: "Contribution per patient",
  support: "Assignment at high severity",
  hidden: "Available adjustment",
  curve: "Outcome model",
};
export function experimentControl(id, index, severity = 9) {
  if (!settings[id]) return "";
  return `<label for="course-setting">${labels[id]}</label><select id="course-setting">${settings[id].map((label, i) => `<option value="${i}" ${i === index ? "selected" : ""}>${label}</option>`).join("")}</select>${id === "curve" ? `<label for="inspect-fit">Inspect severity</label><select id="inspect-fit">${strata.map((_, i) => `<option value="${i}" ${i === severity ? "selected" : ""}>${i}</option>`).join("")}</select>` : ""}`;
}
function distribution(weighted) {
  return (
    [1, 0]
      .map(
        (a) =>
          `<div class="pilot-strip"><span>${a ? "Treated" : "Untreated"}</span><div class="pilot-bars" aria-hidden="true">${strata.map((cell) => `<i class="arm-${a}" style="height:${(weighted ? 10 : cell[a].count) * 10}%"></i>`).join("")}</div></div>`,
      )
      .join("") +
    '<div class="pilot-axis"><span>Milder</span><span>More severe</span></div>'
  );
}
function fitPlot(points, severity) {
  const x = (i) => 32 + i * 26,
    y = (v) => 118 - v * 1.32;
  const line = points.map((p, i) => x(i) + "," + y(p.predicted)).join(" ");
  return `<figure class="course-fit"><figcaption>Untreated health by baseline severity</figcaption>
  <svg viewBox="0 0 298 146" role="img" aria-label="Dots are observed group means. The line is the fitted model. At severity ${severity} the mean is ${format(points[severity].observed)} and the prediction is ${format(points[severity].predicted)}.">
  ${[0, 40, 80].map((v) => `<path d="M26 ${y(v)}H275"/><text x="21" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
  <polyline points="${line}"/>${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.observed)}" r="${i === severity ? 5 : 3}"/>`).join("")}
  <text x="28" y="139">0 · mild</text><text x="275" y="139" text-anchor="end">9 · severe</text></svg>
  <small>Dots: observed mean health · Line: fitted untreated health</small></figure>`;
}
export function experimentResult(id, setting, severity = 9) {
  switch (id) {
    case "predict": {
      const values = predictedMeans();
      return `<div class="course-readout"><strong>Predicted mean: ${format(values[setting])} health points</strong><p>100 predictions, one per patient if ${setting ? "everyone received" : "nobody received"} treatment.</p></div>`;
    }
    case "within": {
      const cell = strata[setting];
      return `<p>Severity ${setting} includes ${cell[1].count} treated and ${cell[0].count} untreated patients.</p>${means(cell.map((c) => c.mean))}`;
    }
    case "standardize":
      return (
        means(setting ? targetMeans : arms.map((a) => a.mean)) +
        (setting
          ? "<p>Each severity contributes 10% to each average. Compare 66 with 54 for the same target mix.</p>"
          : "<p>The treated mean puts more weight on severe patients. The untreated mean puts more weight on mild patients.</p>")
      );
    case "weight": {
      const weights = weightPatients(patients);
      return (
        distribution(setting) +
        means(setting ? weights.means : arms.map((a) => a.mean)) +
        (setting
          ? "<p>Both weighted arms have total weight 100, with 10 units per severity. These are contributions from the original patients.</p>"
          : "<p>Each bar counts the patients in one arm at a given severity. Each arm contains 50 patients.</p>")
      );
    }
    case "support": {
      const rows = supportStudy(["balanced", "weak", "empty"][setting]),
        summary = observedComparison(rows),
        weights = weightPatients(rows);
      return `<div class="course-readout"><strong>Severity 9</strong><p>${summary.strata[9][1].count} treated · ${summary.strata[9][0].count} untreated</p>${weights ? `Largest weight: ${weights.maximum.toFixed(0)}. Standardized difference: ${format(summary.standardized)} points.` : "The untreated cell is empty. Its observed mean, and hence the full-population standardized difference, are unavailable."}</div>`;
    }
    case "hidden": {
      const result = hiddenStudy();
      return `<div class="course-readout"><strong>Adjusted difference: ${format(setting ? result.withFrailty : result.adjusted)} points</strong><p>${setting ? "Within each severity, four of five treated patients are frail versus one of five untreated. Comparing within both severity and frailty recovers the simulated effect." : "Each severity has five treated and five untreated patients. On measured severity the groups look perfectly balanced."}</p></div>`;
    }
    case "curve": {
      const result = curvedStudy(Boolean(setting));
      return `${fitPlot(result.points, severity)}<div class="course-readout"><strong>Adjusted difference: ${format(result.effect)} points</strong><p>At severity ${severity}, observed untreated health averages ${format(result.points[severity].observed)}. The model predicts ${format(result.points[severity].predicted)} points.</p></div>`;
    }
    case "employment":
      return trainingGroups
        .map(
          (group) =>
            `<section class="course-readout"><strong>${group.name}</strong><p>Employed after an offer: ${group.offer.join(" of ")}.<br>Employed without an offer: ${group.usual.join(" of ")}.</p></section>`,
        )
        .join("");
    default:
      return "";
  }
}

export function explored(id, seen = []) {
  if (!settings[id]) return true;
  return id === "support"
    ? [0, 1, 2].every((i) => seen.includes(i))
    : seen.length >= 2;
}
