import { fitPropensity } from "./simulation.js";
import { armLegend, patientMark } from "./propensity-view.js";
import "./propensity.css";

export function renderPropensityPreview(root, data) {
  const fit = fitPropensity(data, ["C"]);
  const people = data.flatMap((d, i) =>
    i % 20 === 0 ? [{ ...d, person: i + 1, p: fit.propensities[i] }] : [],
  );
  const x = (c) => 50 + (c / Math.sqrt(3) + 1) * 150;
  const y = (p) => 180 - p * 150;
  const curve = Array.from({ length: 61 }, (_, i) => {
    const C = Math.sqrt(3) * (i / 30 - 1);
    return `${i ? "L" : "M"}${x(C)},${y(fit.predict({ C }))}`;
  }).join(" ");
  root.innerHTML = `<h3>Treatment probability by risk score</h3>
      <p class="sample-note">Fitted probability rises with risk score, yet people with similar scores can receive either treatment. The model fits all ${data.length.toLocaleString("en")} people; ${people.length} are shown.</p>
      ${armLegend}<div class="ps-preview-chart"><svg class="ps-chart" viewBox="0 0 380 230" role="img" aria-label="Fitted treatment probability by risk score">
      ${[0, 0.5, 1].map((p) => `<path class="ps-grid" d="M50 ${y(p)}H350"/><text x="42" y="${y(p) + 4}" text-anchor="end">${p * 100}%</text>`).join("")}
      <path class="ps-curve" d="${curve}"/>
      ${people.map((d) => patientMark(d, x(d.C), y(d.p))).join("")}
      <text x="50" y="203">−1.7</text><text x="200" y="203" text-anchor="middle">0</text><text x="350" y="203" text-anchor="end">1.7</text>
      <text x="200" y="225" text-anchor="middle">Risk score (C)</text></svg></div>
      <a href="?lesson=propensity-score">Where do propensity scores come from? Explore two variables →</a>`;
}
