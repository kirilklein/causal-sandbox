import { trimmingSample, trimmingResult } from "./trimming-experiment.js";
import { effectComparison } from "./effect-comparison.js";
import { setupTheme, themeControl } from "./theme.js";

document.querySelector("#theme-control").innerHTML = themeControl();
setupTheme();
const slider = document.querySelector("#threshold");
const selectionSlider = document.querySelector("#selection");
let seed = 4217;
let sample;
const labels = {
  everyone: "Everyone",
  retained: "Retained",
  excluded: "Excluded",
};
const number = (value) =>
  Number.isFinite(value) ? value.toFixed(2) : "Unavailable";

function update() {
  const threshold = Number(slider.value);
  const result = trimmingResult(sample.rows, sample.effects, threshold);
  const range = `[${threshold.toFixed(3)}, ${(1 - threshold).toFixed(3)}]`;
  document.querySelector("#threshold-value").textContent =
    threshold === 0 ? "0.000 · keep everyone" : `Keep ${range}`;
  slider.setAttribute(
    "aria-valuetext",
    threshold === 0
      ? "No trimming; keep everyone"
      : `Keep scores from ${threshold.toFixed(3)} to ${(1 - threshold).toFixed(3)}, including endpoints`,
  );
  document
    .querySelector("#lower-guide")
    .setAttribute("d", `M${40 + 360 * threshold} 30V180`);
  document
    .querySelector("#upper-guide")
    .setAttribute("d", `M${400 - 360 * threshold} 30V180`);
  document.querySelector("#trim-guides").style.display =
    threshold === 0 ? "none" : "";
  const retained = result.groups.retained;
  const comparison = effectComparison(
    retained.ipw ?? NaN,
    retained.truth ?? NaN,
  );
  document.querySelector("#retained-size").textContent =
    `${retained.n} of ${sample.rows.length} people retained · ${result.groups.excluded.n} excluded`;
  document.querySelector("#retained-ipw").textContent = number(retained.ipw);
  document.querySelector("#retained-truth").textContent = number(
    retained.truth,
  );
  document.querySelector("#retained-error").textContent = retained.available
    ? comparison.difference
    : "";
  document
    .querySelector("#retained-estimate")
    .style.setProperty("--error-tint", `${comparison.tint}%`);
  document.querySelector("#retained-status").textContent =
    retained.reason ?? "";
  document.querySelector("#groups").innerHTML = Object.entries(result.groups)
    .map(
      ([key, group]) =>
        `<tr data-group="${key}"><th scope="row">${labels[key]}</th><td class="count"><span>${group.n}</span><small>${group.counts.join(" / ")}</small></td><td class="ipw">${number(group.ipw)}</td><td class="group-truth">${number(group.truth)}</td></tr>`,
    )
    .join("");
  document.querySelector("#group-status").textContent = Object.entries(
    result.groups,
  )
    .filter(([key, group]) => key !== "retained" && !group.available)
    .map(([key, group]) => `${labels[key]}: ${group.reason}`)
    .join(" ");

  const armLabels = ["Untreated", "Treated"];
  document.querySelector("#histogram-bars").innerHTML = result.histogram
    .map((arm, A) =>
      arm.retained
        .map((count, bin) => {
          const keptHeight = arm.count ? (150 * count) / arm.count : 0;
          const excludedCount = arm.excluded[bin];
          const excludedHeight = arm.count
            ? (150 * excludedCount) / arm.count
            : 0;
          const x = 42 + bin * 36 + A * 16;
          const title = `${armLabels[A]}, ${bin / 10} to ${(bin + 1) / 10}${bin === 9 ? " inclusive" : " (upper edge excluded)"}: ${count} retained, ${excludedCount} excluded`;
          return `<g data-arm="${A}" data-bin="${bin}" data-retained="${count}" data-excluded="${excludedCount}" data-count="${count + excludedCount}"><title>${title}</title><rect x="${x}" y="${180 - keptHeight}" width="14" height="${keptHeight}" fill="var(--arm-${A})"/><rect x="${x}" y="${180 - keptHeight - excludedHeight}" width="14" height="${excludedHeight}" fill="url(#excluded-${A})" stroke="var(--arm-${A})" stroke-width="${excludedCount ? 1 : 0}"/></g>`;
        })
        .join(""),
    )
    .join("");
  document
    .querySelector("#histogram")
    .setAttribute(
      "aria-label",
      `Raw fitted scores; retained range ${range}, inclusive. ` +
        result.histogram
          .map(
            (arm, A) =>
              `${armLabels[A]}: ${arm.count} people. ` +
              arm.retained
                .map(
                  (count, bin) =>
                    `${bin / 10} to ${(bin + 1) / 10}${bin === 9 ? " inclusive" : " upper edge excluded"}: ${count} retained, ${arm.excluded[bin]} excluded`,
                )
                .join("; "),
          )
          .join(". "),
    );
  document.querySelector("#sample").textContent =
    `${sample.rows.length} people · sample seed ${seed}`;
}

function draw() {
  const selection = Number(selectionSlider.value);
  document.querySelector("#selection-value").textContent = selection.toFixed(1);
  sample = trimmingSample({ selection, seed });
  update();
}
slider.addEventListener("input", update);
selectionSlider.addEventListener("input", draw);
document.querySelector("#redraw").addEventListener("click", () => {
  seed++;
  draw();
});
document.querySelector("#restart").addEventListener("click", () => {
  seed = 4217;
  selectionSlider.value = "3";
  slider.value = "0";
  draw();
});
draw();
