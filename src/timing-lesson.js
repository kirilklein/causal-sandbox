import "./clipping-lesson.css";
import "./timing-lesson.css";
import icon from "./brand.svg?raw";
import { themeControl } from "./theme.js";
import { timingSample } from "./timing-simulation.js";
import { studySummary } from "./instrument-simulation.js";
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
    text: "V causes both A and Y. The backdoor path A ← V → Y can confound the treatment effect.",
  },
  instrument: {
    label: "Instrument",
    edges: ["VA"],
    text: "V affects Y only through A and shares no cause with Y. Timing alone cannot establish these instrument conditions.",
  },
  predictor: {
    label: "Outcome predictor",
    edges: ["VY"],
    text: "V causes Y but does not influence A or share a cause with it here. V predicts the outcome without confounding treatment.",
  },
  mediator: {
    label: "Mediator",
    edges: ["AV", "VY"],
    text: "A changes V, which changes Y.",
  },
  treatment: {
    label: "Affected by A only",
    edges: ["AV"],
    text: "A changes V, but V does not affect Y.",
  },
  outcome: {
    label: "Affected by Y only",
    edges: ["YV"],
    text: "Y changes V. V is a marker of the outcome, not a cause of it.",
  },
  collider: { label: "Collider" },
};
const $ = (id) => document.getElementById(id);
const lower = (text) => text[0].toLowerCase() + text.slice(1);
let windowKey = "before";
let exampleKey = null;
let drag = null;
let sampleSeed = 4217;
let sample;
let studyRun = 0;

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
    "P and R independently influence a referral score V before treatment. P also causes A, and R causes Y. V is a collider on A ← P → V ← R → Y, even though it is before A.",
  between:
    "V sits between A and Y in time, yet it carries none of A’s effect: A and an unmeasured U both shape V, and U also drives Y.",
  after: "A and Y both affect V. It is a collider on A → V ← Y.",
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
    <p class="help" id="timeline-help">Drag V or select a region. A is one treatment decision and Y is its later outcome.</p>
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
      <section id="adjustment-detail" hidden aria-labelledby="adjustment-title">
        <h3 id="adjustment-title">Try adjusting for V</h3>
        <p>Compare the same people with and without V in the outcome model.</p>
        <label class="timing-adjust"><input type="checkbox" id="condition-V"> Adjust for V</label>
        <p class="help" id="adjustment-caption"></p>
        <div class="timing-estimates" aria-live="polite" aria-atomic="true">
          <div class="timing-truth"><span>True total effect</span><strong id="timing-truth"></strong></div>
          <div id="timing-estimate-card"><span id="estimate-label">Unadjusted estimate</span><strong id="timing-estimate"></strong><small id="timing-error"></small></div>
        </div>
        <p id="timing-comparison" class="help"></p>
        <p class="timing-result" id="timing-result" aria-live="polite" aria-atomic="true"></p>
        <div class="actions"><button type="button" id="timing-redraw">Draw another sample</button><span class="help" id="timing-sample"></span></div>
        <details id="repeated-studies"><summary>Compare across repeated samples</summary>
          <p>Both fits use the same people in each study. The standard deviation (SD) measures how much estimates vary across studies; smaller means more precision.</p>
          <button type="button" id="timing-repeat">Run 60 studies</button>
          <p id="studies-status" class="help" role="status"></p>
          <table id="studies-table" hidden><caption>Repeated estimates · true total effect 2.00</caption><thead><tr><th scope="col">Adjustment</th><th scope="col">Mean</th><th scope="col">SD</th></tr></thead><tbody id="studies-rows"></tbody></table>
        </details>
        <details id="world-model"><summary>How this world is simulated</summary><p id="world-equations"></p><p>P and R are independent standardized uniform variables. U and all noise terms are independent standard normal variables. Unless stated otherwise, A is assigned with probability 0.5 independently of these variables. Every world has total effect 2; the mediator world splits it into direct and mediated contributions of 1 each.</p></details>
        <details id="baseline-explanation" hidden><summary>Why does adjusting for the score connect P and R?</summary>
          <p>Imagine V = P + R. At V = 1, a larger P means a smaller R. Our simulation adds independent noise to this score, but adjusting still connects prescribing preference and illness risk.</p>
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
  $("condition-V").checked = false;
  resetStudies();
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
  $("adjustment-detail").hidden = false;
  $("baseline-explanation").hidden =
    exampleKey !== "collider" || windowKey !== "before";
  $("world-equations").textContent = worldEquations[worldKey()];
  sample = timingSample({
    example: exampleKey,
    window: windowKey,
    seed: sampleSeed,
  });
  renderEstimate();
}

function worldKey() {
  return exampleKey === "collider" ? `collider-${windowKey}` : exampleKey;
}

const worldEquations = {
  confounder:
    "V = P; Pr(A = 1 | V) = sigmoid(1.5V); Y = 2A + 1.5V + outcome noise.",
  instrument: "V = P; Pr(A = 1 | V) = sigmoid(1.5V); Y = 2A + outcome noise.",
  predictor: "V = P; Y = 2A + 1.5V + outcome noise.",
  mediator: "V = A + mediator noise; Y = A + V + outcome noise.",
  treatment: "V = 2A + variable noise; Y = 2A + outcome noise.",
  outcome: "Y = 2A + outcome noise; V = Y + variable noise.",
  "collider-before":
    "V = P + R + 0.5 × score noise; Pr(A = 1 | P) = sigmoid(1.5P); Y = 2A + 1.5R + outcome noise.",
  "collider-between":
    "V = A + U + 0.5 × variable noise; Y = 2A + 1.5U + outcome noise.",
  "collider-after": "Y = 2A + outcome noise; V = A + Y + variable noise.",
};
const adjustmentResults = {
  confounder: [
    "The confounding path A ← V → Y is open.",
    "Adjusting for V blocks the confounding path A ← V → Y in this world.",
  ],
  instrument: [
    "There is no confounding in this world.",
    "Adjusting for V adds no bias here but reduces precision. Compare repeated samples to see the spread.",
  ],
  predictor: [
    "There is no confounding in this world.",
    "Adjusting for V explains outcome variation and improves precision here. Compare repeated samples to see the spread.",
  ],
  mediator: [
    "The estimate includes both the direct and mediated paths.",
    "Adjusting for V removes the mediated contribution. The target remains the total effect, including that contribution.",
  ],
  treatment: [
    "V carries none of A’s effect to Y and creates no confounding here.",
    "Adjusting for V adds no bias here but reduces precision by absorbing treatment variation. Compare repeated samples to see the spread.",
  ],
  outcome: [
    "V is a consequence of Y; there is no confounding here.",
    "Adjusting for a consequence of Y distorts the treatment estimate in this world.",
  ],
  "collider-before": [
    "A ← P → V ← R → Y is blocked at V.",
    "Adjusting for V opens A ← P → V ← R → Y, introducing collider bias despite V being before treatment.",
  ],
  "collider-between": [
    "A → V ← U → Y is blocked at V.",
    "Adjusting for V opens A → V ← U → Y, introducing collider bias.",
  ],
  "collider-after": [
    "A → V ← Y is blocked at V.",
    "Adjusting for V opens A → V ← Y, introducing collider bias.",
  ],
};

function renderEstimate() {
  const adjusted = $("condition-V").checked;
  const view = effectComparison(
    adjusted ? sample.adjusted : sample.unadjusted,
    sample.truth,
  );
  $("adjustment-caption").textContent = adjusted
    ? "Outcome model: adjusting for V."
    : "Outcome model: no adjustment.";
  $("estimate-label").textContent = adjusted
    ? "Adjusted estimate"
    : "Unadjusted estimate";
  $("timing-truth").textContent = sample.truth.toFixed(2);
  $("timing-estimate").textContent = view.value;
  $("timing-error").textContent = view.difference;
  $("timing-estimate-card").style.setProperty("--error-tint", `${view.tint}%`);
  $("timing-comparison").textContent =
    `Without V: ${sample.unadjusted.toFixed(2)}. With V: ${sample.adjusted.toFixed(2)}. One sample cannot establish bias or precision.`;
  $("timing-result").textContent = adjustmentResults[worldKey()][+adjusted];
  $("timing-sample").textContent = `2,400 people · Sample ${sampleSeed}`;
}

function resetStudies() {
  studyRun += 1;
  $("repeated-studies").open = false;
  $("studies-table").hidden = true;
  $("studies-rows").innerHTML = "";
  $("studies-status").textContent = "";
  $("timing-repeat").disabled = false;
}

$("timing-repeat").addEventListener("click", async () => {
  const run = ++studyRun;
  const example = exampleKey,
    window = windowKey;
  const unadjusted = [],
    adjusted = [];
  $("timing-repeat").disabled = true;
  $("studies-table").hidden = true;
  try {
    for (let i = 0; i < 60; i++) {
      $("studies-status").textContent = `Running study ${i + 1} of 60…`;
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (run !== studyRun) return;
      const study = timingSample({ example, window, seed: 100 + i });
      unadjusted.push(study.unadjusted);
      adjusted.push(study.adjusted);
    }
    const format = (value) =>
      Number.isFinite(value) ? value.toFixed(3) : "Unavailable";
    $("studies-rows").innerHTML = [unadjusted, adjusted]
      .map((values, i) => {
        const summary = studySummary(values);
        return `<tr><th scope="row">${i ? "With V" : "Without V"}</th><td>${format(summary.mean)}</td><td>${format(summary.sd)}</td></tr>`;
      })
      .join("");
    const missing = [...unadjusted, ...adjusted].filter(
      (value) => !Number.isFinite(value),
    ).length;
    $("studies-status").textContent =
      `60 studies × 2,400 people · seeds 100–159.${missing ? ` ${missing} unavailable fits excluded from summaries.` : ""}`;
    $("studies-table").hidden = false;
  } catch (error) {
    if (run === studyRun)
      $("studies-status").textContent = "The study run failed. Try again.";
    throw error;
  } finally {
    if (run === studyRun) $("timing-repeat").disabled = false;
  }
});

document
  .querySelectorAll('[name="time-window"]')
  .forEach((input) =>
    input.addEventListener("change", () => selectWindow(input.value)),
  );
$("example-choices").addEventListener("change", (event) => {
  exampleKey = event.target.value;
  $("condition-V").checked = false;
  $("baseline-explanation").open = false;
  $("world-model").open = false;
  resetStudies();
  renderExample();
});
$("condition-V").addEventListener("change", renderEstimate);
$("timing-redraw").addEventListener("click", () => {
  sampleSeed += 1;
  sample = timingSample({
    example: exampleKey,
    window: windowKey,
    seed: sampleSeed,
  });
  renderEstimate();
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
  sample = undefined;
  document.querySelectorAll("details").forEach((detail) => {
    detail.open = false;
  });
  renderWindow();
  $("explorer-title").focus();
});
renderWindow();
