import "./clipping-lesson.css";
import "./timing-lesson.css";
import icon from "./brand.svg?raw";
import { themeControl } from "./theme.js";
import { baselineCollider } from "./timing-simulation.js";
import { effectComparison } from "./effect-comparison.js";

document.title = "What timing tells us · Causal Sandbox";

const windows = {
  before: {
    label: "Before treatment",
    short: "Before A",
    exclusion: "V cannot mediate A’s effect: it existed before treatment.",
    examples: ["confounder", "instrument", "predictor", "collider"],
  },
  between: {
    label: "Between treatment and outcome",
    short: "Between A and Y",
    exclusion:
      "V cannot cause the earlier treatment decision. It could carry part of A’s effect to Y.",
    examples: ["mediator", "predictor", "treatment", "collider"],
  },
  after: {
    label: "After outcome",
    short: "After Y",
    exclusion:
      "V cannot cause either earlier A or Y. It could be a consequence of either.",
    examples: ["treatment", "outcome", "collider"],
  },
};
const examples = {
  confounder: {
    label: "Confounder",
    edges: ["VA", "VY"],
    text: "V causes both A and Y. The backdoor path A ← V → Y can confound the treatment effect. Accounting for V blocks it in this world.",
  },
  instrument: {
    label: "Instrument",
    edges: ["VA"],
    text: "V affects Y only through A and shares no common cause with Y in this stipulated world. Timing alone cannot establish these instrument conditions.",
  },
  predictor: {
    label: "Outcome predictor",
    edges: ["VY"],
    text: "V causes Y but does not influence A or share a cause with it here. V predicts the outcome without confounding treatment; an outcome model may gain precision by including it.",
  },
  mediator: {
    label: "Mediator",
    edges: ["AV", "VY"],
    text: "A changes V, which changes Y. Holding V fixed would block part of the total treatment effect we want to count.",
  },
  treatment: {
    label: "Affected by A only",
    edges: ["AV"],
    text: "A changes V, but V does not affect Y. Adjusting for V would add no bias here, only lose precision by absorbing part of A’s variation.",
  },
  outcome: {
    label: "Affected by Y only",
    edges: ["YV"],
    text: "Y changes V. V is a marker of the outcome, not a cause of it. Adjusting for V would condition on a proxy of Y and distort the effect.",
  },
  collider: { label: "Collider" },
};
const $ = (id) => document.getElementById(id);
const lower = (text) => text[0].toLowerCase() + text.slice(1);
let windowKey = "before";
let exampleKey = null;
let drag = null;
let sampleSeed = 4217;
let colliderSample;

const node = (name, x, y, fill = "C") =>
  `<g><rect x="${x - 27}" y="${y - 22}" width="54" height="44" rx="12" fill="var(--node-${fill})" ${name === "U" ? 'stroke="var(--causal-path)" stroke-dasharray="4 3"' : ""}/><text x="${x}" y="${y + 6}" text-anchor="middle">${name}</text></g>`;
const arrow = (edge, path) =>
  `<path data-edge="${edge}" d="${path}" fill="none" stroke="var(--causal-path)" stroke-width="2" ${edge.includes("U") ? 'stroke-dasharray="4 3"' : ""} marker-end="url(#timing-arrow)"/>`;

function graphMarkup(key, time) {
  if (key === "collider" && time === "before") {
    return (
      arrow("PV", "M94 75L153 121") +
      arrow("RV", "M266 75L207 121") +
      arrow("PA", "M70 86V208") +
      arrow("RY", "M290 86V208") +
      arrow("AY", "M98 231H260") +
      node("P", 70, 62) +
      node("R", 290, 62) +
      node("V", 180, 132) +
      node("A", 70, 231, "A") +
      node("Y", 290, 231, "Y")
    );
  }
  if (key === "collider" && time === "between") {
    return (
      arrow("AV", "M91 209L157 150") +
      arrow("UV", "M266 75L207 121") +
      arrow("UY", "M290 86V208") +
      arrow("AY", "M98 231H260") +
      node("U", 290, 62, "U") +
      node("V", 180, 132) +
      node("A", 70, 231, "A") +
      node("Y", 290, 231, "Y") +
      '<text class="dag-note" x="290" y="22" text-anchor="middle">Unmeasured</text>'
    );
  }
  const paths = {
    VA: "M162 92L91 208",
    VY: "M198 92L269 208",
    AV: "M91 208L162 92",
    YV: "M269 208L198 92",
  };
  const edges = key === "collider" ? ["AV", "YV"] : examples[key].edges;
  return (
    arrow("AY", "M98 231H260") +
    edges.map((edge) => arrow(edge, paths[edge])).join("") +
    node("V", 180, 68) +
    node("A", 70, 231, "A") +
    node("Y", 290, 231, "Y")
  );
}

const colliderTexts = {
  before:
    "P and R independently influence a referral score V before treatment. P also causes A; R causes Y. V is a collider on A ← P → V ← R → Y, even though it is before A.",
  between:
    "A and an unmeasured cause U both affect V; U also affects Y. V is a collider on A → V ← U → Y. A variable between treatment and outcome need not be a mediator.",
  after:
    "A and Y both affect V. It is a collider on A → V ← Y. Conditioning on their common consequence can introduce a noncausal association.",
};

document.querySelector("#app").innerHTML =
  `<div class="clipping-page timing-page"><main>
  <svg class="timing-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><marker id="timing-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--causal-path)"/></marker></defs></svg>
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <div class="eyebrow">Optional · Causal roles</div>
  <h1>What timing tells us</h1>
  <p class="lede">Move V through time. Discover which causal roles are possible, and which timing rules out.</p>
  <section class="experiment" aria-labelledby="explorer-title">
    <h2 id="explorer-title" tabindex="-1">Where could V exist?</h2>
    <p class="help" id="timeline-help">Drag V or select a region. A is one treatment decision; Y is its later outcome.</p>
    <fieldset class="timeline" id="timeline" aria-describedby="timeline-help">
      <legend class="visually-hidden">When V exists</legend>
      <div class="time-track" aria-hidden="true"></div>
      ${Object.entries(windows)
        .map(
          ([key, win], index) =>
            `${index ? `<div class="time-landmark" id="fixed-${index === 1 ? "A" : "Y"}"><strong>${index === 1 ? "A" : "Y"}</strong><span>${index === 1 ? "Treatment" : "Outcome"}</span></div>` : ""}<label class="time-region" data-window="${key}"><input type="radio" name="time-window" value="${key}" aria-label="${win.label}" ${key === "before" ? "checked" : ""}><span>${win.short}</span></label>`,
        )
        .join("")}
      <button type="button" id="variable-handle" aria-label="Move V: before treatment" aria-describedby="drag-help">V</button>
    </fieldset>
    <p class="help time-direction" aria-hidden="true">Time →</p>
    <span id="drag-help" class="visually-hidden">Drag to a region, or use the Left and Right arrow keys. Escape cancels a drag. The three region choices also work by keyboard.</span>
    <p id="temporal-result" class="timing-result" aria-live="polite" aria-atomic="true"></p>
    <fieldset class="role-choices"><legend>Could be… <span>choose an example</span></legend><div id="example-choices"></div></fieldset>
    <p class="help" id="possibility-note">Timing alone establishes no role. These are possible examples, not an exhaustive list.</p>
    <div id="example-panel" hidden>
      <p id="example-caption" class="example-caption"></p>
      <figure>
        <svg class="timing-dag" viewBox="0 0 360 280" role="img" aria-labelledby="example-caption example-description"><desc id="example-description"></desc><g id="example-graph"></g></svg>
      </figure>
      <p id="example-text" aria-live="polite" aria-atomic="true"></p>
      <details id="instrument-detail" hidden><summary>What makes an instrument valid?</summary><p>It must affect treatment, have no route to Y outside treatment, and share no unblocked common cause with Y. These conditions are stipulated here; a real pretreatment predictor of treatment need not satisfy them.</p><a href="?lesson=instrument">Explore instruments and adjustment →</a></details>
      <section id="baseline-detail" hidden aria-labelledby="collider-simulation-title">
        <h3 id="collider-simulation-title">Try adjusting for the baseline score</h3>
        <p>V is the referral score K. Compare the same simulated people with and without K in the outcome model.</p>
        <label class="timing-adjust"><input type="checkbox" id="condition-K"> Adjust for referral score K</label>
        <p class="help" id="adjustment-caption"></p>
        <div class="collider-estimates" aria-live="polite" aria-atomic="true">
          <div class="collider-truth"><span>True total effect</span><strong id="collider-truth"></strong></div>
          <div id="collider-estimate-card"><span>Outcome regression</span><strong id="collider-estimate"></strong><small id="collider-error"></small></div>
        </div>
        <p id="collider-comparison" class="help"></p>
        <p class="timing-result" id="collider-result" aria-live="polite" aria-atomic="true"></p>
        <div class="actions"><button type="button" id="collider-redraw">Draw another sample</button><span class="help" id="collider-sample"></span></div>
        <details><summary>Why does holding the score fixed connect P and R?</summary>
          <p>Imagine K = P + R. At K = 10, a larger P means a smaller R. Our simulation adds independent measurement noise to this score, but conditioning still connects prescribing preference and illness risk.</p>
          <p>P and R are independent, standardized uniform variables. K = P + R + 0.5 × score noise. Treatment has probability sigmoid(1.5P), and Y = 2A + 1.5R + outcome noise. Both noises are independent standard normal variables.</p>
          <p>We compare outcome regression using A alone with A and K, on the same 2,400 people. The target stays 2. A redraw changes the sample; adjusting changes neither people nor causal arrows. One sample cannot establish a general ranking.</p>
        </details>
      </section>
    </div>
  </section>
  <div class="actions"><button type="button" id="timing-restart">Restart chapter</button></div>
  <details id="timing-overview"><summary>Compare all three time windows</summary><div class="timing-overview">${Object.values(
    windows,
  )
    .map(
      (win) =>
        `<section><h3>${win.label}</h3><p>${win.exclusion}</p><p class="help">Possible examples: ${win.examples.map((key) => lower(examples[key].label)).join(", ")}.</p></section>`,
    )
    .join(
      "",
    )}</div><p class="help">Roles can overlap. Dates do not tell us which causal arrows actually exist.</p></details>
  <details><summary>When a condition existed versus when it was recorded</summary><p>A diagnosis recorded after treatment may describe an earlier condition. The timeline places the health state itself, not its recording date.</p><p>A measurement before today’s dose may already reflect earlier treatment. States recorded in the same visit need a clearer order before timing can rule out an arrow.</p></details>
  <details><summary>What are we assuming?</summary><p>Causes do not act backward in time, and the relevant states are correctly ordered. We want the total effect of this one treatment decision. These illustrative worlds contain only the arrows and common causes shown; moving V does not infer a graph from real data.</p><p>Timing does not establish a sufficient adjustment set or remove hidden confounding.</p><p><a href="https://dagitty.net/learn/graphs/roles.html">DAGitty: causal roles</a> · <a href="https://miguelhernan.org/whatifbook">Hernán and Robins: Causal Inference: What If</a></p></details>
  <nav class="chapter-nav" aria-label="Chapter navigation"><a href="?lesson=collider">← Return to the collider lesson</a><a href="?lesson=hidden-confounding">Continue the core lessons →</a></nav>
</main></div>`;

function positionHandle() {
  const timeline = $("timeline").getBoundingClientRect();
  const region = document
    .querySelector(`[data-window="${windowKey}"]`)
    .getBoundingClientRect();
  $("variable-handle").style.left =
    `${region.left + region.width / 2 - timeline.left}px`;
  const landmark = $("fixed-A").querySelector("strong").getBoundingClientRect();
  $("variable-handle").style.top =
    `${landmark.top + landmark.height / 2 - timeline.top}px`;
}

function renderWindow() {
  document.querySelectorAll('[name="time-window"]').forEach((input) => {
    input.checked = input.value === windowKey;
  });
  $("variable-handle").setAttribute(
    "aria-label",
    `Move V: ${windows[windowKey].label.toLowerCase()}`,
  );
  $("temporal-result").textContent = windows[windowKey].exclusion;
  $("example-choices").innerHTML = windows[windowKey].examples
    .map(
      (key) =>
        `<label><input type="radio" name="causal-example" value="${key}"><span>${examples[key].label}</span></label>`,
    )
    .join("");
  $("example-panel").hidden = true;
  $("example-graph").innerHTML = "";
  $("instrument-detail").open = false;
  $("condition-K").checked = false;
  positionHandle();
}

function selectWindow(key) {
  if (key === windowKey) return;
  windowKey = key;
  exampleKey = null;
  renderWindow();
}

function renderExample() {
  const example = examples[exampleKey];
  const text =
    exampleKey === "collider" ? colliderTexts[windowKey] : example.text;
  $("example-panel").hidden = false;
  $("example-caption").textContent =
    `One possible world: ${lower(example.label)} · V ${windows[windowKey].label.toLowerCase()}`;
  $("example-graph").innerHTML = graphMarkup(exampleKey, windowKey);
  $("example-description").textContent = `A causes Y. ${text}`;
  $("example-text").textContent = text;
  $("instrument-detail").hidden = exampleKey !== "instrument";
  $("baseline-detail").hidden =
    exampleKey !== "collider" || windowKey !== "before";
  if (!$("baseline-detail").hidden) {
    colliderSample ??= baselineCollider({ seed: sampleSeed });
    renderCollider();
  }
}

function renderCollider() {
  const adjusted = $("condition-K").checked;
  const current = adjusted ? colliderSample.withK : colliderSample.withoutK;
  const view = effectComparison(current, colliderSample.truth);
  $("adjustment-caption").textContent = adjusted
    ? "Outcome model: adjusting for baseline K (V)."
    : "Outcome model: no adjustment.";
  $("collider-truth").textContent = colliderSample.truth.toFixed(2);
  $("collider-estimate").textContent = view.value;
  $("collider-error").textContent = view.difference;
  $("collider-estimate-card").style.setProperty(
    "--error-tint",
    `${view.tint}%`,
  );
  $("collider-comparison").textContent = adjusted
    ? `Without K: ${colliderSample.withoutK.toFixed(2)}. With K: ${colliderSample.withK.toFixed(2)}. ${Math.abs(colliderSample.withK - 2) > Math.abs(colliderSample.withoutK - 2) ? "Adjusting moves the estimate farther from truth in this sample." : "Adjusting happens to bring the estimate closer in this sample; the collider path is still open."}`
    : "Try including K. The same people and outcomes are used in both fits.";
  $("collider-result").textContent = adjusted
    ? "Conditioning on K opens A ← P → K ← R → Y, introducing collider bias despite K being before treatment."
    : "A ← P → K ← R → Y is blocked at K. There is no confounding through this path without conditioning on K or its descendants.";
  $("collider-sample").textContent = `2,400 people · Sample ${sampleSeed}`;
}

document
  .querySelectorAll('[name="time-window"]')
  .forEach((input) =>
    input.addEventListener("change", () => selectWindow(input.value)),
  );
$("example-choices").addEventListener("change", (event) => {
  exampleKey = event.target.value;
  renderExample();
});
$("condition-K").addEventListener("change", renderCollider);
$("collider-redraw").addEventListener("click", () => {
  sampleSeed += 1;
  colliderSample = baselineCollider({ seed: sampleSeed });
  renderCollider();
});

const handle = $("variable-handle");
function dropRegion(x, y) {
  return [...document.querySelectorAll("[data-window]")].find((region) => {
    const box = region.getBoundingClientRect();
    return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  });
}
function finishDrag(event, commit) {
  if (!drag || event.pointerId !== drag.id) return;
  const region = commit && dropRegion(event.clientX, event.clientY);
  const id = drag.id;
  drag = null;
  handle.classList.remove("dragging");
  document
    .querySelectorAll(".drop-target")
    .forEach((el) => el.classList.remove("drop-target"));
  if (handle.hasPointerCapture(id)) handle.releasePointerCapture(id);
  if (region) selectWindow(region.dataset.window);
  positionHandle();
}
handle.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button !== 0 || drag) return;
  const box = handle.getBoundingClientRect();
  drag = {
    id: event.pointerId,
    offsetX: event.clientX - box.left - box.width / 2,
    offsetY: event.clientY - box.top - box.height / 2,
  };
  handle.setPointerCapture(event.pointerId);
  handle.classList.add("dragging");
});
handle.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const box = $("timeline").getBoundingClientRect();
  handle.style.left = `${event.clientX - box.left - drag.offsetX}px`;
  handle.style.top = `${event.clientY - box.top - drag.offsetY}px`;
  const target = dropRegion(event.clientX, event.clientY);
  document
    .querySelectorAll("[data-window]")
    .forEach((region) =>
      region.classList.toggle("drop-target", region === target),
    );
});
handle.addEventListener("pointerup", (event) => finishDrag(event, true));
handle.addEventListener("pointercancel", (event) => finishDrag(event, false));
handle.addEventListener("lostpointercapture", (event) =>
  finishDrag(event, false),
);
handle.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && drag) {
    finishDrag({ pointerId: drag.id }, false);
    return;
  }
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key))
    return;
  event.preventDefault();
  if (drag) finishDrag({ pointerId: drag.id }, false);
  const keys = Object.keys(windows);
  const direction = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
  selectWindow(
    keys[Math.max(0, Math.min(2, keys.indexOf(windowKey) + direction))],
  );
});
new ResizeObserver(() => {
  if (!drag) positionHandle();
}).observe($("timeline"));
$("timing-restart").addEventListener("click", () => {
  if (drag) finishDrag({ pointerId: drag.id }, false);
  windowKey = "before";
  exampleKey = null;
  sampleSeed = 4217;
  colliderSample = undefined;
  document.querySelectorAll("details").forEach((detail) => {
    detail.open = false;
  });
  renderWindow();
  $("explorer-title").focus();
});
renderWindow();
