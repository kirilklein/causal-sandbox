import { axis, grids, truth, colorLimits } from "./tmle-robustness.js";

let pattern = "shift",
  xi = 8,
  yi = 7;
const $ = (id) => document.getElementById(id);
const signed = (n) =>
  Math.abs(n) < 0.0005
    ? "0.000"
    : `${n > 0 ? "+" : "−"}${Math.abs(n).toFixed(3)}`;
const tick = (n) =>
  Math.abs(n) < 0.001 ? "0" : `${n > 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}`;
function color(error) {
  const a = [245, 245, 239],
    b = error < 0 ? [52, 103, 131] : [182, 88, 63];
  const t = Math.min(1, Math.abs(error) / colorLimits[pattern]);
  return `rgb(${a.map((value, i) => Math.round(value + (b[i] - value) * t)).join(",")})`;
}
function map(method) {
  const left = 49,
    top = 20,
    cell = 25,
    size = 275;
  const x = (i) => left + i * cell,
    y = (i) => top + (10 - i) * cell;
  return `<svg viewBox="0 0 351 350" role="img" aria-label="${method.toUpperCase()} population error map. Horizontal axis: treatment-model distortion. Vertical axis: outcome-model distortion. Use the sliders below to select a cell.">
    ${grids[pattern].map((c) => `<rect class="cell" data-x="${c.xi}" data-y="${c.yi}" x="${x(c.xi)}" y="${y(c.yi)}" width="25" height="25" fill="${color(c[method] - truth)}"><title>Treatment ${tick(c.x)}, outcome ${tick(c.y)}: ${method.toUpperCase()} ${c[method].toFixed(3)}, error ${signed(c[method] - truth)}</title></rect>`).join("")}
    <rect x="${left}" y="${top}" width="${size}" height="${size}" fill="none" stroke="#dfe4dc" stroke-width="0.7" pointer-events="none"/>
    <path d="M${x(5) + 12.5} ${top}v${size} M${left} ${y(5) + 12.5}h${size}" fill="none" stroke="#617b69" stroke-dasharray="2 3" stroke-width=".8" opacity=".65" pointer-events="none"/>
    ${[0, 2, 5, 8, 10].map((i) => `<text x="${x(i) + 12.5}" y="312" text-anchor="middle" class="${i === 5 ? "zero-label" : ""}">${tick(axis[i])}</text><text x="39" y="${y(i) + 16}" text-anchor="end" class="${i === 5 ? "zero-label" : ""}">${tick(axis[i])}</text>`).join("")}
    <text class="axis-title" x="186" y="338" text-anchor="middle">Treatment-model distortion</text><text class="axis-title" transform="translate(12 158) rotate(-90)" text-anchor="middle">Outcome-model distortion</text>
    <rect x="${x(xi) + 0.8}" y="${y(yi) + 0.8}" width="23.4" height="23.4" rx="1" fill="none" stroke="white" stroke-width="3" pointer-events="none"/><rect x="${x(xi) + 0.8}" y="${y(yi) + 0.8}" width="23.4" height="23.4" rx="1" fill="none" stroke="#193e34" stroke-width="1.5" pointer-events="none"/>
    <circle cx="${x(xi) + 12.5}" cy="${y(yi) + 12.5}" r="2.5" fill="#193e34" stroke="white" stroke-width="1" pointer-events="none"/>
  </svg>`;
}

function update() {
  const colorLimit = colorLimits[pattern];
  $("legend-numbers").innerHTML =
    `<span>−${colorLimit.toFixed(2)}</span><span>0</span><span>+${colorLimit.toFixed(2)}</span>`;
  const c = grids[pattern].find((c) => c.xi === xi && c.yi === yi);
  $("tmle-map").innerHTML = map("tmle");
  $("ipw-map").innerHTML = map("ipw");
  $("treatment").value = xi;
  $("outcome").value = yi;
  for (const [name, value] of [
    ["treatment", c.x],
    ["outcome", c.y],
  ]) {
    const label =
      pattern === "scale" ? `${Math.exp(value).toFixed(2)}×` : tick(value);
    $(`${name}-value`).textContent = label;
    $(name).setAttribute(
      "aria-valuetext",
      pattern === "scale"
        ? `Distortion ${tick(value)}, multiplier ${Math.exp(value).toFixed(2)}`
        : `Distortion ${tick(value)}`,
    );
  }
  for (const method of ["tmle", "ipw"]) {
    $(`${method}-value`).textContent = c[method].toFixed(3);
    $(`${method}-error`).textContent =
      `${signed(c[method] - truth)} from truth`;
  }
  const zeroX = xi === 5,
    zeroY = yi === 5;
  let heading, copy;
  if (zeroX && zeroY) {
    heading = "Both models match the population.";
    copy =
      "Both methods recover the true effect here. Move one slider to introduce a model error.";
  } else if (zeroX) {
    heading = "One correct model is enough here.";
    copy =
      "The treatment model is correct. TMLE recovers the effect despite wrong outcome predictions; IPW also recovers it.";
  } else if (zeroY) {
    heading = "The outcome model protects TMLE.";
    copy =
      "TMLE stays at truth with correct outcome predictions. IPW depends on the distorted treatment model.";
  } else {
    heading = "Two errors can leave a residual error.";
    const difference = Math.abs(c.tmle - truth) - Math.abs(c.ipw - truth);
    const comparison =
      Math.abs(difference) < 0.001
        ? "Their absolute errors are similar at this point."
        : difference < 0
          ? "TMLE is closer to truth at this point."
          : "IPW is closer to truth at this point.";
    copy = `${comparison} Move toward either zero axis to see what happens when one model becomes correct.`;
  }
  $("result-heading").textContent = heading;
  $("interpretation").textContent = copy;
  $("pattern-description").textContent =
    pattern === "shift"
      ? "Move predictions up or down."
      : "Stretch or compress model predictions.";
  const labels =
    pattern === "shift"
      ? [
          "Lower log odds",
          "Higher log odds",
          "Lower predictions",
          "Higher predictions",
        ]
      : ["Less extreme", "More extreme", "Compressed", "Stretched"];
  ["treatment-low", "treatment-high", "outcome-low", "outcome-high"].forEach(
    (id, i) => ($(id).textContent = labels[i]),
  );
  document
    .querySelectorAll("[data-pattern]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", button.dataset.pattern === pattern),
    );
  $("model-description").textContent =
    pattern === "shift"
      ? "Shift adds the selected treatment distortion to true log odds and adds the outcome distortion to both true outcome means, in outcome units. A log-odds shift multiplies the odds."
      : "Scale multiplies true treatment logits by the displayed factor. Outcome means are stretched around a fixed reference of 2.5, the average of the four true outcome means. A multiplier of one leaves a model correct.";
  $("model-rows").innerHTML = c.models
    .map(
      (g, i) =>
        `<tr><td>Group ${i + 1}</td><td>${(100 * g.p).toFixed(0)}%</td><td>${(100 * g.fittedP).toFixed(1)}%</td><td>${g.q0.toFixed(2)} / ${g.q1.toFixed(2)}</td><td>${g.m0.toFixed(2)} / ${g.m1.toFixed(2)}</td></tr>`,
    )
    .join("");
}
document.querySelectorAll("[data-pattern]").forEach((button) =>
  button.addEventListener("click", () => {
    pattern = button.dataset.pattern;
    update();
  }),
);
for (const id of ["treatment", "outcome"])
  $(id).addEventListener("input", (event) => {
    if (id === "treatment") xi = Number(event.target.value);
    else yi = Number(event.target.value);
    update();
  });
document.querySelector(".maps").addEventListener("click", (event) => {
  const cell = event.target.closest("[data-x]");
  if (!cell) return;
  xi = Number(cell.dataset.x);
  yi = Number(cell.dataset.y);
  update();
});
$("reset").addEventListener("click", () => {
  pattern = "shift";
  xi = 8;
  yi = 7;
  update();
});
update();
