import "./trajectory-landscape.css";
import icon from "./brand.svg?raw";
import { createTrajectoryRenderer } from "./trajectory-render.js";
import {
  comparison,
  cohort,
  ease,
  mix,
  clamp,
  SLICE_COUNT,
} from "./trajectory-model.js";

const scenes = [
  {
    label: "One patient",
    title: "The story <em>we see.</em>",
    kicker: "ONE PATIENT · ONE OBSERVED COURSE",
    copy: "Follow a patient's health over 12 days. Treatment starts on day 4. The solid coral path is what happened afterward. But what would have happened without treatment?",
    action: "Reveal the other future",
    time: 6500,
  },
  {
    label: "Two futures",
    title: "The difference <em>we cannot observe.</em>",
    kicker: "SAME PATIENT · SAME HISTORY",
    copy: "Rewind to day 4. The dashed blue path shows this patient's untreated future in our model. At day 12, treatment leaves them 12 health points better off. In real data, we would observe only one path.",
    action: "Introduce severity",
    time: 3800,
  },
  {
    label: "Severity",
    title: "Change the profile.<em>Keep the benefit.</em>",
    kicker: "A SLIDER THROUGH NEARBY PATIENT PROFILES",
    copy: "Move baseline severity. Each position is a different patient profile, with a different health course. The gap remains +12 points. Color means treatment; solid versus dashed means observed versus counterfactual.",
    action: "Unfold the slider",
    time: 0,
  },
  {
    label: "Unfold",
    title: "One slider becomes <em>a landscape.</em>",
    kicker: "SEVERITY ACROSS · HEALTH UP · TIME INTO DEPTH",
    copy: "Every slider position is now visible. The lit slice is the profile you selected. Each pair shares a history, then separates at treatment. Compare the gap within a slice, at the same day.",
    action: "Reveal who is treated",
    time: 2200,
  },
  {
    label: "Selection",
    title: "Who gets treatment <em>is not random.</em>",
    kicker: "THE SAME BENEFIT · DIFFERENT TREATMENT RATES",
    copy: "Each severity slice now contains 10 patients. More severe patients are treated more often. Solid paths show their observed courses. Will the treated group have better or worse average health on day 12?",
    action: "Hide alternatives & pool",
    time: 1400,
  },
  {
    label: "Pool",
    title: "A helpful treatment.<em>A harmful-looking comparison.</em>",
    kicker: "SEVERITY OMITTED · OBSERVED OUTCOMES ONLY",
    copy: "The same patients now gather by treatment at day 12. Their outcomes did not change. The treated group contains more severe patients, making its average health worse—even though treatment helped each person.",
    action: "Restore the severity slices",
    time: 2300,
  },
  {
    label: "Compare",
    title: "The comparison changes.<em>The patients do not.</em>",
    kicker: "RESTORE SEVERITY · COMPARE WITHIN SLICES",
    copy: "Return the same observed patients to their severity slices. Within each slice, treated patients do better. Give all ten slices the same 10% share in both group averages: the difference is +12 points.",
    action: "Replay from one patient",
    time: 2200,
  },
];
const $ = (id) => document.getElementById(id);
const initial = {
  step: 0,
  severity: 5,
  selection: 1,
  orbitYaw: 0,
  orbitPitch: 0,
  showCounterfactuals: 0,
};
let state = { ...initial };
let view = {
  step: 0,
  severity: 5,
  selection: 1,
  prognosis: 1,
  unfold: 0,
  pool: 0,
  twins: 0,
  population: 0,
  day: 0,
  orbitYaw: 0,
  orbitPitch: 0,
  showCounterfactuals: 0,
};
let animation = null;
let frame = 0;
let paused = false;
let pausedAt = 0;
const motion = matchMedia("(prefers-reduced-motion: reduce)");
document.title = "One patient, a whole landscape — Causal Sandbox";
document.body.classList.add("trajectory-mode");
document.querySelector("#app").innerHTML = `<div class="trajectory-experience">
  <header class="trajectory-header"><a class="trajectory-brand" href="?lesson=introduction">${icon}<span>CAUSAL SANDBOX</span></a><span class="trajectory-header-note">AN INTERACTIVE CAUSAL STORY</span><a href="?lesson=confounding">Back to lessons ↗</a></header>
  <main>
    <nav class="trajectory-chapters" aria-label="Story chapters">${scenes.map((scene, i) => `<button type="button" data-chapter="${i}" aria-label="${i + 1}. ${scene.label}"><span>${String(i + 1).padStart(2, "0")}</span><span class="chapter-name">${scene.label}</span></button>`).join("")}</nav>
    <div class="trajectory-title"><p id="trajectory-kicker"></p><h1 id="trajectory-heading" tabindex="-1"></h1></div>
    <section class="trajectory-stage" aria-label="Patient trajectories">
      <div class="trajectory-legend"><span class="world-treated">● Treated</span><span class="world-untreated" id="trajectory-untreated">● Untreated</span><span id="trajectory-observed"><i class="trajectory-style-key factual-key" aria-hidden="true"></i>Factual (observed)</span><span id="trajectory-ghost"><i class="trajectory-style-key counterfactual-key" aria-hidden="true"></i>Counterfactual</span></div>
      <canvas id="trajectory-canvas" role="img" aria-describedby="trajectory-description trajectory-reading">An animated health trajectory branches into treated and untreated futures, unfolds across severity, then pools observed outcomes.</canvas>
      <div class="trajectory-playback"><span id="trajectory-frame-label"></span><button id="trajectory-pause" aria-label="Pause animation">Ⅱ Pause</button><button id="trajectory-replay" aria-label="Replay this scene">↻ Replay scene</button></div>
    </section>
    <div class="trajectory-controls">
      <div id="trajectory-severity-control" class="trajectory-control" hidden><label for="trajectory-severity">BASELINE SEVERITY <output id="trajectory-severity-value"></output></label><input type="range" id="trajectory-severity" min="0" max="9" step="1" value="5"/><div class="trajectory-control-ends"><span>Lower</span><span>Higher</span></div></div>
      <div id="trajectory-selection-control" class="trajectory-control" hidden><label for="trajectory-selection">SEVERITY → TREATMENT <output id="trajectory-selection-value"></output></label><input type="range" id="trajectory-selection" min="0" max="100" step="25" value="100"/><div class="trajectory-control-ends"><span>Equal treatment rates</span><span>Favor higher severity</span></div></div>
    </div>
    <section id="trajectory-receipt" aria-label="Treatment received in the selected slice" hidden>
      <div class="trajectory-receipt-heading"><strong id="trajectory-receipt-count"></strong><span id="trajectory-receipt-note">Each column is one patient · filled = factual</span></div>
      <div id="trajectory-receipt-patients"></div>
    </section>
    <div id="trajectory-orbit-controls" hidden><span id="trajectory-orbit-hint">Drag the scene to rotate · arrow keys also work</span><button id="trajectory-reset-view">Reset view</button><label><input id="trajectory-show-counterfactuals" type="checkbox"/> Show counterfactuals</label></div>
    <div class="trajectory-story"><div class="trajectory-caption"><p id="trajectory-description"></p><p id="trajectory-reading" role="status"></p></div><div class="trajectory-navigation"><button id="trajectory-back" aria-label="Previous scene">←</button><button id="trajectory-next"></button></div></div>
    <footer class="trajectory-footnote"><span>FICTIONAL PATIENTS · COUNTERFACTUALS ARE KNOWN ONLY INSIDE THIS MODEL</span><details><summary>Read the model & assumptions</summary><p>Baseline severity C takes ten values, 0–9, with ten people at each value. All patients at the same severity have identical potential health trajectories. Horizontal spread within a slice only separates people; it is not another variable.</p><p>Initial health is 90 − 20C/9. Untreated day-12 health is 78 − 48C/9. A smooth curve and a shared time fluctuation join them. Treatment begins on day 4 and smoothly adds 12 points by day 12, with no effect before treatment. This is an illustrative health score, not a clinical prediction or a risk of a binary event.</p><p>At full selection, treated counts rise from 1, 2, 3, 4, 5, 5, 6, 7, 8, and 9 across the slices. The slider moves these symmetrically toward 5, rounded to whole people. These are constructed counts, not fitted treatment probabilities. Each arm contains 50 patients and every slice contains both treatments.</p><p>The pooled difference compares observed group averages at day 12. Equal-slice standardization uses a 10% share for each severity level in both groups, targeting this whole population. Severity is the only common cause here. In real data, comparable groups and adequate overlap require substantive assumptions; missing individual counterfactuals generally cannot be recovered. <a href="https://arxiv.org/abs/2301.09031">Counterfactual identifiability ↗</a></p><p><a href="?lesson=ipw">Continue with adjustment using IPW →</a></p></details></footer>
  </main>
</div>`;
const renderer = createTrajectoryRenderer($("trajectory-canvas"));
function target() {
  return {
    ...state,
    prognosis: 1,
    day: 12,
    twins:
      state.step >= 1 && state.step <= 4
        ? 1
        : state.step === 6
          ? state.showCounterfactuals
          : 0,
    unfold: state.step >= 3 ? 1 : 0,
    population: state.step >= 4 ? 1 : 0,
    pool: state.step === 5 ? 1 : 0,
  };
}
function draw() {
  renderer.draw(view);
  $("trajectory-frame-label").textContent =
    view.pool > 0.5
      ? "DAY 12 · GROUP COMPARISON"
      : `DAY ${Math.min(12, Math.floor(view.day)).toString().padStart(2, "0")} / 12`;
}
function tick(now) {
  if (!animation || paused) return;
  const t = Math.min(1, (now - animation.start) / animation.duration);
  const eased = ease(0, 1, t);
  for (const key of Object.keys(animation.to))
    view[key] = mix(animation.from[key], animation.to[key], eased);
  // The counterfactual reveal first rewinds, then replays the shared treatment fork.
  if (animation.scene === 1) {
    view.day =
      t < 0.25 ? mix(12, 4, ease(0, 0.25, t)) : mix(4, 12, ease(0.25, 1, t));
    view.twins = ease(0.2, 0.38, t);
  }
  view.step = state.step;
  draw();
  if (t < 1) frame = requestAnimationFrame(tick);
  else {
    animation = null;
    $("trajectory-pause").hidden = true;
  }
}
function animate(duration, scene = null) {
  cancelAnimationFrame(frame);
  paused = false;
  $("trajectory-pause").textContent = "Ⅱ Pause";
  $("trajectory-pause").setAttribute("aria-label", "Pause animation");
  const to = target();
  if (motion.matches || duration === 0) {
    view = to;
    animation = null;
    $("trajectory-pause").hidden = true;
    draw();
    return;
  }
  animation = {
    from: { ...view },
    to,
    duration,
    scene,
    start: performance.now(),
  };
  $("trajectory-pause").hidden = false;
  frame = requestAnimationFrame(tick);
}
function updateCopy() {
  const scene = scenes[state.step];
  $("trajectory-kicker").textContent = scene.kicker;
  $("trajectory-heading").innerHTML = scene.title;
  $("trajectory-description").textContent = scene.copy;
  $("trajectory-next").textContent = scene.action + " →";
  $("trajectory-back").disabled = state.step === 0;
  $("trajectory-severity-control").hidden = state.step < 2 || state.step === 5;
  $("trajectory-selection-control").hidden = state.step < 4;
  $("trajectory-ghost").hidden =
    state.step === 0 ||
    state.step === 5 ||
    (state.step === 6 && !state.showCounterfactuals);
  $("trajectory-receipt").hidden = state.step !== 4 && state.step !== 6;
  $("trajectory-orbit-controls").hidden = state.step !== 6;
  $("trajectory-canvas").classList.toggle("is-rotatable", state.step === 6);
  $("trajectory-canvas").tabIndex = state.step === 6 ? 0 : -1;
  $("trajectory-canvas").setAttribute(
    "aria-describedby",
    "trajectory-description trajectory-reading" +
      (state.step === 6 ? " trajectory-orbit-hint" : ""),
  );
  $("trajectory-untreated").hidden = state.step === 0;
  $("trajectory-severity-value").textContent =
    `${state.severity} / ${SLICE_COUNT - 1}`;
  $("trajectory-selection-value").textContent =
    `${Math.round(state.selection * 100)}%`;
  $("trajectory-severity").style.setProperty(
    "--fill",
    `${(state.severity / (SLICE_COUNT - 1)) * 100}%`,
  );
  $("trajectory-selection").style.setProperty(
    "--fill",
    `${state.selection * 100}%`,
  );
  document.querySelectorAll("[data-chapter]").forEach((button) => {
    if (Number(button.dataset.chapter) === state.step)
      button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  const summary = comparison(state.selection);
  const people = cohort(state.selection);
  const selected = people.filter((p) => p.severity === state.severity);
  $("trajectory-receipt-count").textContent =
    `Severity ${state.severity} · ${summary.counts[state.severity]} of 10 treated`;
  const showTwins = state.step === 4 || Boolean(state.showCounterfactuals);
  $("trajectory-receipt-patients").innerHTML =
    `<div class="trajectory-receipt-labels"><span class="world-treated">Treated</span><span class="world-untreated">Untreated</span></div>` +
    selected
      .map(
        (p) =>
          `<div class="trajectory-receipt-person" role="img" aria-label="Patient ${p.rank + 1}: ${p.treatment ? "treated" : "untreated"}">${[1, 0].map((a) => `<span class="receipt-dot ${a ? "world-treated" : "world-untreated"} ${p.treatment === a ? "is-factual" : showTwins ? "is-counterfactual" : "is-unobserved"}" aria-hidden="true"></span>`).join("")}</div>`,
      )
      .join("");
  $("trajectory-receipt-note").textContent = showTwins
    ? "Each column is one patient · filled = factual"
    : "Each column is one patient · observed treatment only";
  const focal = people.find(
    (p) => p.severity === state.severity && p.rank === 4,
  );
  $("trajectory-reading").textContent =
    state.step === 0
      ? ""
      : state.step < 4
        ? `Selected severity ${state.severity} · observed: ${focal.treatment ? "treated" : "untreated"} · day-12 benefit: +12 points.`
        : state.step === 4
          ? `Change selection: the same patients switch which branch is bright and solid. Their two possible health courses stay fixed.`
          : state.step === 5
            ? `Observed difference: ${summary.difference > 0 ? "+" : "−"}${Math.abs(summary.difference).toFixed(1)} points. True treatment benefit: +12 points.`
            : `Same severity mix: ${summary.standardized[1].toFixed(0)} treated − ${summary.standardized[0].toFixed(0)} untreated = +12 points.`;
  if (state.step === 5 && summary.difference >= 0) {
    $("trajectory-heading").innerHTML =
      "Change selection.<em>Change the comparison.</em>";
    $("trajectory-description").textContent =
      `The pooled comparison now favors treatment. ${state.selection === 0 ? "With equal treatment rates, both groups have the same severity mix and the difference equals the benefit." : "Selection still distorts the comparison, but does not reverse it at this setting."} Increase severity-based selection to see the reversal return.`;
  }
  if (state.step === 4 && state.selection === 0) {
    $("trajectory-heading").innerHTML =
      "Equal treatment rates.<em>The same severity mix.</em>";
    $("trajectory-description").textContent =
      "Five patients in every slice are treated. Both observed groups now have the same severity mix. Increase severity-based selection, or pool them to see how this changes the comparison.";
  }
  $("trajectory-canvas").setAttribute(
    "aria-label",
    `${scene.label}. ${$("trajectory-description").textContent} ${$("trajectory-reading").textContent}`,
  );
}
function enter(step, focus = true) {
  const previous = state.step;
  endDrag();
  state.step = step;
  state.orbitYaw = 0;
  state.orbitPitch = 0;
  state.showCounterfactuals = 0;
  $("trajectory-show-counterfactuals").checked = false;
  if (step === 0) {
    state = { ...initial };
    view = { ...target(), day: 0 };
    $("trajectory-severity").value = initial.severity;
    $("trajectory-selection").value = 100;
  }
  updateCopy();
  animate(scenes[step].time, step === 1 && previous <= 1 ? 1 : null);
  if (focus) $("trajectory-heading").focus({ preventScroll: true });
}
$("trajectory-next").addEventListener("click", () =>
  enter((state.step + 1) % scenes.length),
);
$("trajectory-back").addEventListener("click", () =>
  enter(Math.max(0, state.step - 1)),
);
document
  .querySelectorAll("[data-chapter]")
  .forEach((b) =>
    b.addEventListener("click", () => enter(Number(b.dataset.chapter))),
  );
$("trajectory-replay").addEventListener("click", () => {
  if (state.step === 0) return enter(0);
  view =
    state.step === 1
      ? { ...target(), twins: 0 }
      : {
          ...target(),
          unfold: state.step === 3 ? 0 : target().unfold,
          population: state.step === 4 ? 0 : target().population,
          pool: state.step === 5 ? 0 : state.step === 6 ? 1 : target().pool,
        };
  animate(scenes[state.step].time || 1500, state.step === 1 ? 1 : null);
});
$("trajectory-pause").addEventListener("click", () => {
  if (!animation) return;
  paused = !paused;
  if (paused) {
    pausedAt = performance.now();
    cancelAnimationFrame(frame);
  } else {
    animation.start += performance.now() - pausedAt;
    frame = requestAnimationFrame(tick);
  }
  $("trajectory-pause").textContent = paused ? "▷ Resume" : "Ⅱ Pause";
  $("trajectory-pause").setAttribute(
    "aria-label",
    paused ? "Resume animation" : "Pause animation",
  );
});
for (const key of ["severity", "selection"])
  $("trajectory-" + key).addEventListener("input", (event) => {
    state[key] = Number(event.target.value) / (key === "selection" ? 100 : 1);
    updateCopy();
    // Severity changes select discrete profiles, not intermediate invented patients.
    view[key] = state[key];
    animate(0);
  });
let drag = null;
const canvas = $("trajectory-canvas");
function endDrag() {
  if (!drag) return;
  const id = drag.id;
  drag = null;
  if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  canvas.classList.remove("is-dragging");
}
function rotate(dx, dy) {
  state.orbitYaw = clamp(state.orbitYaw + dx, -0.65, 0.65);
  state.orbitPitch = clamp(state.orbitPitch + dy, -0.16, 0.18);
  animate(0);
}
canvas.addEventListener("pointerdown", (event) => {
  if (state.step !== 6 || event.button !== 0 || drag) return;
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  animate(0);
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add("is-dragging");
});
canvas.addEventListener("pointermove", (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  rotate((event.clientX - drag.x) * 0.004, (event.clientY - drag.y) * 0.002);
  drag.x = event.clientX;
  drag.y = event.clientY;
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  canvas.addEventListener(type, (event) => {
    if (drag?.id === event.pointerId) endDrag();
  });
canvas.addEventListener("keydown", (event) => {
  if (state.step !== 6) return;
  const keys = {
    ArrowLeft: [-0.06, 0],
    ArrowRight: [0.06, 0],
    ArrowUp: [0, -0.03],
    ArrowDown: [0, 0.03],
  };
  if (keys[event.key]) {
    event.preventDefault();
    rotate(...keys[event.key]);
  }
  if (event.key === "Home") {
    event.preventDefault();
    resetView();
  }
});
function resetView() {
  state.orbitYaw = 0;
  state.orbitPitch = 0;
  animate(280);
}
$("trajectory-reset-view").addEventListener("click", resetView);
$("trajectory-show-counterfactuals").addEventListener("change", (event) => {
  state.showCounterfactuals = Number(event.target.checked);
  updateCopy();
  animate(220);
});
const resize = new ResizeObserver(() => {
  renderer.resize();
  draw();
});
resize.observe($("trajectory-canvas"));
motion.addEventListener("change", () => {
  if (motion.matches) animate(0);
});
window.addEventListener("pagehide", () => {
  endDrag();
  cancelAnimationFrame(frame);
  resize.disconnect();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    resize.observe($("trajectory-canvas"));
    renderer.resize();
    animate(0);
  }
});
enter(0, false);
