import { fitPropensity } from "./simulation.js";
import {
  armLegend,
  patientMark,
  percent,
  personOptions,
} from "./propensity-view.js";
import "./propensity.css";

export function renderPropensityPreview(root, data) {
  const fit = fitPropensity(data, ["C"]);
  const people = data.flatMap((d, i) =>
    i % 20 === 0 ? [{ ...d, person: i + 1, p: fit.propensities[i] }] : [],
  );
  const x = (c) => 50 + (c / Math.sqrt(3) + 1) * 150;
  const y = (p) => 180 - p * 150;
  if (!root.querySelector("select")) {
    root.innerHTML = `<h3>From risk score to treatment probability</h3>
      <p class="sample-note">Height shows the fitted probability; the symbol shows treatment actually received. ${people.length} people shown; the model fits all ${data.length.toLocaleString("en")} people using C.</p>
      ${armLegend}<div class="ps-preview-chart"></div>
      <label class="ps-person-label">Inspect a person <select>${personOptions(people)}</select></label>
      <p class="ps-preview-reading" aria-live="polite"></p>
      <a href="?lesson=propensity-score">Where do propensity scores come from? Explore two variables →</a>`;
    const example = people.find((d) => !d.A && d.p > 0.7);
    root.querySelector("select").value = (example || people[0]).person;
  }
  const render = () => {
    const person = people.find(
      (d) => d.person === Number(root.querySelector("select").value),
    );
    const curve = Array.from({ length: 61 }, (_, i) => {
      const C = Math.sqrt(3) * (i / 30 - 1);
      return `${i ? "L" : "M"}${x(C)},${y(fit.predict({ C }))}`;
    }).join(" ");
    root.querySelector(".ps-preview-chart").innerHTML =
      `<svg class="ps-chart" viewBox="0 0 380 230" role="img" aria-label="Fitted treatment probability by risk score. Select a mark or use Inspect a person.">
      ${[0, 0.5, 1].map((p) => `<path class="ps-grid" d="M50 ${y(p)}H350"/><text x="42" y="${y(p) + 4}" text-anchor="end">${p * 100}%</text>`).join("")}
      <path class="ps-curve" d="${curve}"/>
      ${people
        .filter((d) => d !== person)
        .map((d) => patientMark(d, x(d.C), y(d.p)))
        .join("")}
      ${patientMark(person, x(person.C), y(person.p), true)}
      <text x="50" y="203">−1.7</text><text x="200" y="203" text-anchor="middle">0</text><text x="350" y="203" text-anchor="end">1.7</text>
      <text x="200" y="225" text-anchor="middle">Risk score (C)</text></svg>`;
    root.querySelector(".ps-preview-reading").textContent =
      `Person ${person.person} ${person.A ? "received treatment" : "received no treatment"}. At their risk score of ${person.C.toFixed(2)}, the model estimates a ${percent(person.p)} chance of receiving treatment. A probability describes what could happen for that profile; it need not match this person's yes/no treatment.`;
  };
  root.onchange = render;
  root.onclick = (event) => {
    const mark = event.target.closest("[data-patient]");
    if (!mark) return;
    root.querySelector("select").value = mark.dataset.patient;
    render();
  };
  render();
}
