import "./trajectory-landscape.css";
import icon from "./brand.svg?raw";
import { createTrajectoryRenderer } from "./trajectory-render.js";
import {
  comparison,
  cohort,
  profiles,
  treatmentProbability,
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
    action: "Meet ten patients like this",
    time: 3800,
  },
  {
    label: "Treatment frequency",
    title: "Same severity.<em>Different treatment decisions.</em>",
    kicker: "TEN PATIENTS · ONE SEVERITY",
    copy: "These ten patients have the same baseline severity and the same two possible health courses in our model. But they do not all receive treatment. Each small chart is one patient; the solid path shows what they receive.",
    action: "Return to the highlighted patient",
    time: 2200,
  },
  {
    label: "One profile",
    title: "One patient again.<em>Keep the treatment chance.</em>",
    kicker: "ONE HIGHLIGHTED PATIENT · NOT A GROUP AVERAGE",
    copy: "Keep the highlighted patient and their treatment chance. Move severity to visit another profile: both possible health courses worsen as severity rises, and treatment becomes more likely. The benefit stays +12 points.",
    action: "Unfold the severity slider",
    time: 1800,
  },
  {
    label: "Unfold",
    title: "One slider becomes <em>a landscape.</em>",
    kicker: "TEN PATIENTS · TEN EQUALLY SPACED SEVERITIES",
    copy: "One patient at each severity is now visible. Solid paths show their actual treatment; dashed paths show their alternatives. Higher severity makes treatment more likely, not certain. Will the treated patients have better average health?",
    action: "Hide alternatives & pool these ten",
    time: 2200,
  },
  {
    label: "Pool",
    title: "A helpful treatment.<em>A harmful-looking comparison.</em>",
    kicker: "SEVERITY OMITTED · OBSERVED OUTCOMES ONLY",
    copy: "The same ten patients now gather by treatment at day 12. Their outcomes did not change. The treated group contains more severe patients, making its average health worse—even though treatment helped each person.",
    action: "Restore the severity slices",
    time: 2300,
  },
  {
    label: "Compare",
    title: "The comparison changes.<em>The patients do not.</em>",
    kicker: "RESTORE EACH PATIENT · REVEAL THEIR OTHER FUTURE",
    copy: "Return each patient to their severity and reveal their other possible course. Treatment adds 12 points for every patient. We can show this because we built the simulator; one observed patient per severity cannot supply both outcomes in real data.",
    action: "Replay from one patient",
    time: 2200,
  },
];
const $ = (id) => document.getElementById(id);
const initial = {
  step: 0,
  severity: 7,
  selection: 1,
  prognosis: 1,
  orbitYaw: 0,
  orbitPitch: 0,
  showCounterfactuals: 0,
};
let state = { ...initial };
let view = {
  step: 0,
  severity: 7,
  selection: 1,
  prognosis: 1,
  unfold: 0,
  pool: 0,
  twins: 0,
  frequency: 0,
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
    <div id="trajectory-orbit-controls" hidden><span id="trajectory-orbit-hint">Drag the scene to rotate · arrow keys also work</span><button id="trajectory-reset-view">Reset view</button><label id="trajectory-counterfactual-control"><input id="trajectory-show-counterfactuals" type="checkbox"/> Show counterfactuals</label></div>
      <p id="trajectory-receipt" hidden><strong id="trajectory-receipt-count"></strong></p>
      <canvas id="trajectory-canvas" role="img" aria-describedby="trajectory-description trajectory-reading">An animated health trajectory branches into treated and untreated futures, unfolds across severity, then pools observed outcomes.</canvas>
      <div class="trajectory-playback"><span id="trajectory-frame-label"></span><button id="trajectory-pause" aria-label="Pause animation">Ⅱ Pause</button><button id="trajectory-replay" aria-label="Replay this scene">↻ Replay scene</button></div>
    </section>
    <p id="trajectory-probability" role="status" hidden></p>
    <div class="trajectory-controls">
      <div id="trajectory-severity-control" class="trajectory-control" hidden><label for="trajectory-severity">BASELINE SEVERITY <output id="trajectory-severity-value"></output></label><input type="range" id="trajectory-severity" min="0" max="9" step="1" value="7"/><div class="trajectory-control-ends"><span>Lower</span><span>Higher</span></div></div>
      <div id="trajectory-selection-control" class="trajectory-control" hidden><label for="trajectory-selection">SEVERITY → TREATMENT <output id="trajectory-selection-value"></output></label><input type="range" id="trajectory-selection" min="0" max="100" step="25" value="100"/><div class="trajectory-control-ends"><span>Equal treatment rates</span><span>Favor higher severity</span></div></div>
      <div id="trajectory-prognosis-control" class="trajectory-control" hidden><label for="trajectory-prognosis">SEVERITY → OUTCOME <output id="trajectory-prognosis-value"></output></label><input type="range" id="trajectory-prognosis" min="0" max="100" step="25" value="100" aria-describedby="trajectory-prognosis-note"/><div class="trajectory-control-ends"><span>No severity effect</span><span>Worse health</span></div><p id="trajectory-prognosis-note" class="trajectory-control-note">Changes both health paths. Treatment benefit stays +12.</p></div>
    </div>
    <div class="trajectory-story"><div class="trajectory-caption"><p id="trajectory-description"></p><p id="trajectory-reading" role="status"></p></div><div class="trajectory-navigation"><button id="trajectory-back" aria-label="Previous scene">←</button><button id="trajectory-next"></button></div></div>
    <footer class="trajectory-footnote"><span>FICTIONAL PATIENTS · COUNTERFACTUALS ARE KNOWN ONLY INSIDE THIS MODEL</span><details><summary>Read the model & assumptions</summary><p>Baseline severity C takes ten equally spaced values, 0–9. The frequency scene shows ten patients at one severity in separate charts with identical health and time scales. Patients at the same severity share both potential health courses. We then retain one fixed patient per severity and follow those same ten into the pooled comparison.</p><p>Let r be the Severity → Outcome slider value divided by 100. Initial health is 90 − 20rC/9. Untreated day-12 health is 78 − 48rC/9. At zero, severity no longer changes either potential health course. This slider changes prognosis, not the treatment benefit or treatment assignments. A smooth curve and a shared time fluctuation join them. Treatment begins on day 4 and smoothly adds 12 points by day 12, with no effect before treatment. This is an illustrative health score, not a clinical prediction or a risk of a binary event.</p><p>At full selection, treated counts rise from 1, 2, 3, 4, 5, 5, 6, 7, 8, and 9 across the slices. The slider moves these symmetrically toward 5, rounded to whole people. Dividing these teaching counts by ten defines the model treatment probabilities. Assignments are fixed examples, not a fresh random sample: ten independent draws would not always reproduce these exact counts. Treatment probability can be nonzero for both arms even though the landscape contains only one observed patient per severity.</p><p>The pooled difference compares observed group averages for the ten retained patients at day 12. Their assignment ranks stay fixed when selection changes. Even at equal treatment probabilities, this small example can have different severity mixes by chance. The final comparison pairs each patient with their own simulated counterfactual; it is not an adjusted estimate from observed groups. Severity is the only common cause here. In real data, comparable groups and adequate overlap require substantive assumptions; missing individual counterfactuals generally cannot be recovered. <a href="https://arxiv.org/abs/2301.09031">Counterfactual identifiability ↗</a></p><p><a href="?lesson=ipw">Continue with adjustment using IPW →</a></p></details></footer>
  </main>
</div>`;
const renderer = createTrajectoryRenderer($("trajectory-canvas"));
function target() {
  return {
    ...state,
    day: 12,
    twins:
      state.step >= 1 && state.step <= 4
        ? 1
        : state.step === 6
          ? state.showCounterfactuals
          : 0,
    unfold: state.step >= 4 ? 1 : 0,
    frequency: state.step === 2 ? 1 : 0,
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
function canRotate() {
  return state.step === 4 || state.step === 6;
}
function updateCopy() {
  const scene = scenes[state.step];
  $("trajectory-kicker").textContent = scene.kicker;
  $("trajectory-heading").innerHTML = scene.title;
  $("trajectory-description").textContent = scene.copy;
  $("trajectory-next").textContent = scene.action + " →";
  $("trajectory-back").disabled = state.step === 0;
  $("trajectory-severity-control").hidden = state.step < 2 || state.step === 5;
  $("trajectory-selection-control").hidden = state.step < 2;
  $("trajectory-prognosis-control").hidden = state.step < 3;
  $("trajectory-canvas").classList.toggle("is-frequency", state.step === 2);
  $("trajectory-ghost").hidden =
    state.step === 0 ||
    state.step === 5 ||
    (state.step === 6 && !state.showCounterfactuals);
  $("trajectory-receipt").hidden = state.step !== 2;
  $("trajectory-orbit-controls").hidden = !canRotate();
  $("trajectory-counterfactual-control").hidden = state.step !== 6;
  $("trajectory-canvas").classList.toggle("is-rotatable", canRotate());
  $("trajectory-canvas").tabIndex = canRotate() ? 0 : -1;
  $("trajectory-canvas").setAttribute(
    "aria-describedby",
    "trajectory-description trajectory-reading" +
      (canRotate() ? " trajectory-orbit-hint" : ""),
  );
  $("trajectory-untreated").hidden = state.step === 0;
  $("trajectory-severity-value").textContent =
    `${state.severity} / ${SLICE_COUNT - 1}`;
  for (const key of ["selection", "prognosis"]) {
    $("trajectory-" + key + "-value").textContent =
      `${Math.round(state[key] * 100)}%`;
    $("trajectory-" + key).style.setProperty("--fill", `${state[key] * 100}%`);
  }
  $("trajectory-severity").style.setProperty(
    "--fill",
    `${(state.severity / (SLICE_COUNT - 1)) * 100}%`,
  );

  document.querySelectorAll("[data-chapter]").forEach((button) => {
    if (Number(button.dataset.chapter) === state.step)
      button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  const summary = comparison(
    state.selection,
    state.prognosis,
    profiles(state.selection),
  );
  const people = cohort(state.selection);
  const selected = people.filter((p) => p.severity === state.severity);
  $("trajectory-receipt-count").textContent =
    `Severity ${state.severity} · ${selected.filter((p) => p.treatment).length} of these 10 treated`;
  const focal = profiles(state.selection).find(
    (p) => p.severity === state.severity,
  );
  $("trajectory-probability").hidden = state.step < 2 || state.step === 5;
  $("trajectory-probability").textContent =
    `Severity ${state.severity} · Treatment probability: ${Math.round(100 * treatmentProbability(state.severity, state.selection))}%`;
  if (state.step === 0 && !focal.treatment) {
    $("trajectory-description").textContent =
      "Follow this patient's health over 12 days. At day 4, they do not receive treatment. The solid blue path is their observed course. What would have happened with treatment?";
  }
  if (state.step === 1 && !focal.treatment) {
    $("trajectory-description").textContent =
      "Rewind to day 4. The dashed coral path shows this patient's treated future in our model: 12 points better at day 12. The solid blue path remains their observed course. In real data, only one is observed.";
  }
  $("trajectory-reading").textContent =
    state.step === 0
      ? ""
      : state.step === 2
        ? "The counts illustrate the model probability. A fresh random group of ten need not have the same count. The outlined chart is the patient we keep."
        : state.step < 5
          ? `Selected severity ${state.severity} · observed: ${focal.treatment ? "treated" : "untreated"} · day-12 benefit: +12 points.`
          : state.step === 5
            ? `Observed difference for these ten: ${summary.difference > 0 ? "+" : "−"}${Math.abs(summary.difference).toFixed(1)} points. Simulated treatment benefit: +12 points.`
            : state.showCounterfactuals
              ? "Each +12 gap compares the same patient's two simulated outcomes, not two observed patients."
              : "Only factual paths are visible. Reveal counterfactuals to compare each patient's two possible outcomes.";
  if (state.step === 3) {
    $("trajectory-description").textContent =
      `Keep the highlighted patient and their treatment chance. Move severity to visit another profile. ${state.prognosis === 0 ? "Severity currently has no effect on either health path." : "Higher severity worsens both health paths."} Use Severity → Outcome to change this relationship; the treatment gap stays +12.`;
  }
  if (state.step === 4) {
    $("trajectory-description").textContent =
      `One patient at each severity is now visible. Solid paths show their actual treatment; dashed paths show their alternatives. ${state.selection === 0 ? "Treatment probability is the same at every severity." : "Higher severity makes treatment more likely, not certain."} ${state.prognosis === 0 ? "Severity currently has no effect on health." : "Severity also worsens health under either treatment."} What happens when we pool these ten?`;
  }
  if (state.step === 5 && state.prognosis === 0) {
    $("trajectory-heading").innerHTML =
      "Remove severity’s effect.<em>The comparison agrees.</em>";
    $("trajectory-description").textContent =
      "With severity’s outcome effect switched off, all profiles have the same two health courses. The pooled difference is +12, regardless of who receives treatment. Restore both severity connections to see the misleading comparison return.";
  } else if (state.step === 5 && summary.difference >= 0) {
    $("trajectory-heading").innerHTML =
      "Change the connections.<em>Change the comparison.</em>";
    $("trajectory-description").textContent =
      `The pooled comparison now favors treatment. ${state.selection === 0 ? "Treatment probability is 50% at every severity, but ten patients can still have different severity mixes in the two groups." : "The severity connections change the observed comparison; the benefit for each patient remains +12."} Increase both severity connections to see the reversal return.`;
  }
  $("trajectory-canvas").setAttribute(
    "aria-label",
    `${scene.label}. ${$("trajectory-description").textContent} ${$("trajectory-reading").textContent}${state.step === 2 ? ` ${$("trajectory-receipt-count").textContent}.` : ""}`,
  );
}
function enter(step, focus = true) {
  const previous = state.step;
  endDrag();
  state.step = step;
  state.orbitYaw = 0;
  state.orbitPitch = 0;
  state.showCounterfactuals = Number(step === 6);
  $("trajectory-show-counterfactuals").checked = step === 6;
  if (step === 0) {
    state = { ...initial };
    view = { ...target(), day: 0 };
    $("trajectory-severity").value = initial.severity;
    $("trajectory-selection").value = 100;
    $("trajectory-prognosis").value = 100;
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
          unfold: state.step === 4 ? 0 : target().unfold,
          frequency:
            state.step === 2 ? 0 : state.step === 3 ? 1 : target().frequency,
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
for (const key of ["severity", "selection", "prognosis"])
  $("trajectory-" + key).addEventListener("input", (event) => {
    state[key] = Number(event.target.value) / (key === "severity" ? 1 : 100);
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
  state.orbitYaw = clamp(state.orbitYaw + dx, -1.2, 1.2);
  state.orbitPitch = clamp(state.orbitPitch + dy, -0.22, 0.55);
  animate(0);
}
canvas.addEventListener("pointerdown", (event) => {
  if (!canRotate() || event.button !== 0 || drag) return;
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
  if (!canRotate()) return;
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
