import {
  completeModule,
  completedModules,
  pilotUrl,
  readPilot,
  savePilot,
} from "./foundations-progress.js";
import { campaignHref } from "./events.js";
import "./trajectory-landscape.css";
import "./what-if.css";
import icon from "./brand.svg?raw";
import { themeControl } from "./theme.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { createTrajectoryRenderer } from "./trajectory-render.js";
import { ease, mix } from "./trajectory-model.js";
import { populationMarkup } from "./what-if-population.js";

const scenes = [
  {
    label: "What happened?",
    title: "Did treatment <em>help this patient?</em>",
    copy: "Treatment starts on day 4. We observe what happens afterward. But improvement—or deterioration—alone cannot tell us whether treatment helped.",
    action: "Reveal the other future",
    reading: "Patient 08 · one observed course · higher health is better",
  },
  {
    label: "What if?",
    title: "One patient.<em>Two possible futures.</em>",
    copy: "What would have happened without treatment? The dashed path is this patient’s simulated counterfactual. Compare the two outcomes at day 12: treatment helps by 12 points, even though health declines.",
    action: "Ask about a population",
    reading:
      "We can reveal both futures because we built this fictional world. Real data give us only one.",
  },
  {
    label: "The average effect",
    title: "The same people.<em>Two treatment choices.</em>",
    copy: "For each person, the effect is the gap between their two day-12 outcomes. The average treatment effect averages these individual gaps. Equivalently, compare average health for the same people if everyone received treatment versus if nobody did.",
    action: "Show only what we observe",
    reading:
      "This example gives everyone a +12 benefit. In reality, treatment effects can differ between people.",
  },
  {
    label: "The missing comparison",
    title: "One outcome each.<em>Half the comparison is missing.</em>",
    copy: "We cannot observe both futures for anyone. In a new study, random assignment lets the treated group estimate the population’s average outcome with treatment, and the untreated group estimate its average without treatment.",
    reading:
      "Randomization does not reveal individual counterfactuals or guarantee an exact answer. How close will the comparison be in one study?",
  },
];
const $ = (id) => document.getElementById(id);
const courseOpening =
  new URLSearchParams(location.search).get("course") === "foundations";
const openingSaved = courseOpening ? readPilot() : {};
let trialNumber =
  Number.isSafeInteger(openingSaved.trialNumber) && openingSaved.trialNumber > 0
    ? openingSaved.trialNumber
    : 0;
let targetAnswer = openingSaved.targetAnswer || "";
let openingComplete = completedModules(openingSaved).includes("opening");
let prediction = openingSaved.openingPrediction || "";
let step = 0;
let frame = 0;
let animation = null;
let pausedAt = null;
let populationAnimations = [];
const motion = matchMedia("(prefers-reduced-motion: reduce)");
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
};
document.title = "What if? — Causal Sandbox";
document.body.classList.add("trajectory-mode");
document.querySelector("#app").innerHTML =
  `<div class="trajectory-experience what-if-experience">
  <header class="trajectory-header"><a class="trajectory-brand" href="?lesson=introduction">${icon}<span>CAUSAL SANDBOX</span></a>${themeControl()}</header>
  <main>
    ${lessonNavigation({ learningPage: "what-if" })}
    ${courseOpening ? `<p class="trajectory-course-link"><a href="?lesson=learn">Course modules</a> · Module 1 of 6</p>` : ""}
    <nav class="trajectory-chapters" aria-label="Opening chapters">${scenes.map((scene, i) => `<button type="button" data-chapter="${i}" aria-label="${i + 1}. ${scene.label}"><span>${String(i + 1).padStart(2, "0")}</span><span class="chapter-name">${scene.label}</span></button>`).join("")}</nav>
    <div class="trajectory-title"><p id="trajectory-kicker">WHAT IF? · THE QUESTION BEHIND CAUSAL INFERENCE</p><h1 id="trajectory-heading" tabindex="-1"></h1></div>
    <p id="trajectory-description"></p>
    <section class="trajectory-stage" aria-label="Two possible futures">
      <div class="trajectory-legend"><span class="world-treated">● Treated</span><span id="trajectory-untreated" class="world-untreated">● Untreated</span><span>● Observed</span><span id="what-if-ghost">○ Simulated counterfactual</span></div>
      <canvas id="trajectory-canvas" role="img" aria-describedby="trajectory-description trajectory-reading">One patient’s health over twelve days, with treatment starting on day four.</canvas>
      <div id="what-if-population" hidden></div>
      <div class="trajectory-playback" id="what-if-playback"><span id="trajectory-frame-label"></span><button id="trajectory-pause" aria-label="Pause animation">Ⅱ Pause</button><button id="trajectory-replay">↻ Replay scene</button></div>
    </section>
    ${
      courseOpening
        ? `<div id="opening-prediction" class="opening-trial"><label for="patient-prediction">Does declining health after treatment show that treatment harmed this patient?</label>
      <select id="patient-prediction"><option value="">Make a prediction</option><option value="harm">Yes, their health declined</option><option value="unknown">We need their health without treatment</option><option value="unsure">I’m unsure</option></select><p id="prediction-feedback" role="status"></p></div><section id="opening-trial" class="opening-trial" hidden><h2>What would a randomized comparison show?</h2>
      <p>Give each of the 100 patients an independent coin flip for treatment. Predict how close the treated and untreated group difference will be to +12 points.</p>
      <button id="run-trial">Randomly assign treatment</button><p role="status" id="trial-result"></p>
      <fieldset id="target-answer"><legend>Which effect does this trial estimate?</legend>
        <label><input type="radio" name="target" value="before">Change since day 4 among treated patients</label>
        <label><input type="radio" name="target" value="total">Mean day-12 health if all 100 received treatment on day 4 versus none</label>
        <label><input type="radio" name="target" value="individual">The missing outcome for each patient</label>
      </fieldset>
      <p id="target-feedback" role="status"></p>
      <button id="opening-next-locked" class="opening-next" disabled>Continue to module 2 →</button>
      <a id="opening-next" class="opening-next" href="${campaignHref(pilotUrl)}" hidden>Continue to module 2 →</a></section>
      <p id="opening-save" role="status"></p><details class="opening-trial"><summary>Optional reading and practice</summary><p><a href="?lesson=randomization">Repeat a randomized experiment</a> · <a href="https://ctml.berkeley.edu/introduction-causal-inference">Berkeley Roadmap steps 0–2 and Lab 1B</a> · <a href="https://miguelhernan.org/whatifbook">What If, chapters 1–2</a></p></details>`
        : ""
    }
    <div class="trajectory-story"><p id="trajectory-reading"></p><nav class="trajectory-navigation" aria-label="Continue learning"><button id="trajectory-back" aria-label="Previous scene">←</button><button id="trajectory-next"></button>${courseOpening ? "" : `<a id="what-if-continue" href="${campaignHref("?lesson=randomization")}" hidden>Start with a randomized experiment →</a>`}</nav></div>
    <footer class="trajectory-footnote"><span>FICTIONAL PATIENTS · COUNTERFACTUALS ARE KNOWN ONLY INSIDE THIS MODEL</span>
      <details><summary>What assumptions make this possible?</summary><p>We need well-defined treatment choices and outcomes that match those choices (consistency), both choices to be possible for the people we compare (positivity), and comparable groups with respect to their potential outcomes (exchangeability, possibly after adjustment). Here we also assume that treating one person does not change another person’s outcome.</p><p>Randomization supports comparability. In observational studies, we must justify which variables to adjust for and whether important common causes remain unmeasured. Averaging alone does not establish these conditions.</p><p>Under these conditions, population-average potential outcomes can be identified from observed data. Finite-sample estimates still have uncertainty. Predicting a person’s outcome does not recover their individual counterfactual.</p><a href="?lesson=assumptions">Explore these assumptions later →</a></details>
      <details><summary>About this fictional world</summary><p>The curves illustrate a health score over twelve days; they are not clinical predictions. Treatment begins on day 4 and adds 12 points by day 12. The ten people have different baseline severities, with fixed illustrative treatment assignments. Their individual effects are equal here only to keep the first comparison simple.</p><p>Both population plots retain the same ten people in the same order and use identical health scales. Hollow marks reveal simulator-known counterfactuals. Hiding them removes both their positions and values. The average effect shown is simulator truth, not an estimate fitted from observed data.</p></details>
    </footer>
  </main>
</div>`;
setupLessonNavigation();
const renderer = createTrajectoryRenderer($("trajectory-canvas"));

function draw() {
  if (step >= 2) return;
  renderer.draw(view);
  $("trajectory-frame-label").textContent =
    `DAY ${Math.floor(view.day)} / 12 · PATIENT 08`;
}

function tick(now) {
  if (!animation || pausedAt !== null) return;
  const t = Math.min(1, (now - animation.start) / animation.duration);
  view.day =
    step === 0
      ? mix(0, 12, ease(0, 1, t))
      : t < 0.25
        ? mix(12, 4, ease(0, 0.25, t))
        : mix(4, 12, ease(0.25, 1, t));
  view.twins = step === 1 ? ease(0.2, 0.38, t) : 0;
  draw();
  if (t < 1) frame = requestAnimationFrame(tick);
  else {
    animation = null;
    $("trajectory-pause").hidden = true;
  }
}

function replay() {
  cancelAnimationFrame(frame);
  animation = null;
  pausedAt = null;
  $("trajectory-pause").textContent = "Ⅱ Pause";
  $("trajectory-pause").setAttribute("aria-label", "Pause animation");
  $("trajectory-pause").hidden = motion.matches || step >= 2;
  view = { ...view, step, day: 12, twins: Number(step === 1) };
  if (step >= 2 || motion.matches) return draw();
  animation = { start: performance.now(), duration: step === 0 ? 4500 : 3500 };
  frame = requestAnimationFrame(tick);
}

function finishPopulationTransition() {
  populationAnimations.forEach((animation) => animation.cancel());
  populationAnimations = [];
}

function moveEndpoints(origins) {
  // Convert the old canvas positions into each destination SVG's coordinates.
  for (const circle of document.querySelectorAll(
    '[data-focal="true"] circle',
  )) {
    const a = Number(circle.dataset.outcome);
    const origin = new DOMPoint(origins[a].x, origins[a].y).matrixTransform(
      circle.getScreenCTM().inverse(),
    );
    populationAnimations.push(
      circle.animate(
        [
          {
            transform: `translate(${origin.x - circle.cx.baseVal.value}px, ${origin.y - circle.cy.baseVal.value}px)`,
          },
          { transform: "translate(0, 0)" },
        ],
        { duration: 1000, easing: "ease-in-out" },
      ),
    );
  }
  for (const element of document.querySelectorAll(
    '[data-focal="false"], .what-if-mean, .what-if-world-mean, .what-if-effect',
  )) {
    populationAnimations.push(
      element.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 300,
        delay: 1000,
        fill: "backwards",
      }),
    );
  }
}

function enter(next, focus = true) {
  finishPopulationTransition();
  let origins;
  if (step === 1 && next === 2 && !motion.matches) {
    view = { ...view, day: 12, twins: 1 };
    const { endpoints } = renderer.draw(view);
    const rect = $("trajectory-canvas").getBoundingClientRect();
    origins = endpoints.map(({ x, y }) => ({
      x: rect.left + x,
      y: rect.top + y,
    }));
  }
  step = next;
  if (courseOpening) {
    $("opening-trial").hidden = step !== 3;
    if (!savePilot({ current: "opening", openingStep: step })) {
      $("opening-save").textContent =
        "Progress is available for this visit. Browser storage is unavailable.";
    }
  }
  const scene = scenes[step];
  $("trajectory-heading").innerHTML = scene.title;
  $("trajectory-description").textContent =
    courseOpening && step === 0
      ? "Treatment begins on day 4. Follow the observed health score through day 12, then make a prediction."
      : scene.copy;
  $("trajectory-reading").textContent = scene.reading;
  $("trajectory-back").disabled = step === 0;
  $("trajectory-next").hidden = step === 3;
  $("trajectory-next").textContent = `${scene.action || ""} →`;
  if (!courseOpening) $("what-if-continue").hidden = step !== 3;
  if (courseOpening) {
    $("opening-prediction").hidden = step !== 0;
    $("trajectory-next").disabled = step === 0 && !prediction;
  }
  $("trajectory-untreated").hidden = step === 0;
  $("what-if-ghost").hidden = step === 0 || step === 3;
  $("trajectory-canvas").hidden = step >= 2;
  $("what-if-population").hidden = step < 2;
  $("what-if-population").innerHTML =
    step >= 2 ? populationMarkup(step === 3) : "";
  $("what-if-playback").hidden = step >= 2;
  $("trajectory-canvas").setAttribute(
    "aria-label",
    step === 0
      ? "Patient 08 receives treatment on day 4. Their observed health declines to 52.7 on day 12. This course alone cannot tell us the treatment effect."
      : "Patient 08 has health 52.7 with treatment and 40.7 without treatment on day 12. The simulated counterfactual is dashed. The same-time difference is +12.",
  );
  document.querySelectorAll("[data-chapter]").forEach((button) => {
    if (Number(button.dataset.chapter) === step)
      button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  renderer.resize();
  replay();
  if (focus) $("trajectory-heading").focus({ preventScroll: true });
  if (origins) moveEndpoints(origins);
}
$("trajectory-next").addEventListener("click", () =>
  enter(Math.min(3, step + 1)),
);
$("trajectory-back").addEventListener("click", () =>
  enter(Math.max(0, step - 1)),
);
document
  .querySelectorAll("[data-chapter]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      enter(Number(button.dataset.chapter)),
    ),
  );
$("trajectory-replay").addEventListener("click", replay);
$("trajectory-pause").addEventListener("click", () => {
  if (!animation) return;
  if (pausedAt === null) {
    pausedAt = performance.now();
    cancelAnimationFrame(frame);
  } else {
    animation.start += performance.now() - pausedAt;
    pausedAt = null;
    frame = requestAnimationFrame(tick);
  }
  $("trajectory-pause").textContent =
    pausedAt === null ? "Ⅱ Pause" : "▷ Resume";
  $("trajectory-pause").setAttribute(
    "aria-label",
    pausedAt === null ? "Pause animation" : "Resume animation",
  );
});
const resize = new ResizeObserver(() => {
  renderer.resize();
  draw();
});
resize.observe($("trajectory-canvas"));
window.addEventListener("themechange", draw);
window.addEventListener("resize", finishPopulationTransition);
$("what-if-population").addEventListener("focusin", finishPopulationTransition);
motion.addEventListener("change", () => {
  finishPopulationTransition();
  replay();
});
window.addEventListener("pagehide", () => {
  finishPopulationTransition();
  cancelAnimationFrame(frame);
  resize.disconnect();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    resize.observe($("trajectory-canvas"));
    renderer.resize();
    replay();
  }
});
if (courseOpening) {
  const { randomizedPatients, observedComparison } =
    await import("./foundations-study.js");
  const updateTarget = () => {
    if (trialNumber && targetAnswer === "total" && !openingComplete) {
      openingComplete = true;
      completeModule("opening");
      const count = document.querySelector("[data-course-count]");
      if (count) count.textContent = completedModules().length;
    }
    const feedback = {
      before: "Try again. A before-and-after change includes what would have happened over time anyway. Which answer compares two treatment choices on day 12?",
      individual: "Try again. Each patient has only one observed outcome. Which answer compares average health across the whole group?",
      total: "Yes. The difference between the randomized groups estimates how much treating everyone would change average day-12 health.",
    };
    const instruction = trialNumber ? "" : "Run the randomized trial.";
    $("target-feedback").textContent = [
      feedback[targetAnswer] || "Choose the effect that the two group means estimate.",
      instruction,
      openingComplete ? "Module 1 complete." : "",
    ].filter(Boolean).join(" ");
    $("opening-next-locked").hidden = openingComplete;
    $("opening-next").hidden = !openingComplete;
  };
  $("patient-prediction").value = prediction;
  $("patient-prediction").addEventListener("change", (event) => {
    prediction = event.target.value;
    savePilot({
      openingPrediction: prediction,
      firstOpeningPrediction: readPilot().firstOpeningPrediction || prediction,
    });
    $("prediction-feedback").textContent = prediction
      ? "Reveal the patient’s other possible future to check your reasoning."
      : "";
    $("trajectory-next").disabled = !prediction;
  });
  for (const option of $("target-answer").querySelectorAll("input"))
    option.checked = option.value === targetAnswer;
  $("target-answer").addEventListener("change", (event) => {
    targetAnswer = event.target.value;
    savePilot({
      targetAnswer,
      firstTargetAnswer: readPilot().firstTargetAnswer || targetAnswer,
    });
    updateTarget();
  });
  updateTarget();
  function showTrial() {
    const { arms } = observedComparison(randomizedPatients(4217 + trialNumber));
    const difference = arms[1].mean - arms[0].mean;
    $("trial-result").textContent =
      `Day-12 means: ${arms[1].mean.toFixed(2)} treated, ${arms[0].mean.toFixed(2)} untreated. Difference: ${difference.toFixed(2)} points. Random assignment can leave groups imbalanced by chance.`;
  }
  if (trialNumber) showTrial();
  $("run-trial").addEventListener("click", () => {
    trialNumber++;
    showTrial();
    savePilot({ trialNumber });
    updateTarget();
  });
  $("opening-next").addEventListener("click", () => {
    savePilot({ current: "pilot" });
  });
}
$("what-if-population").addEventListener("click", (event) => {
  event.target.closest(".what-if-person")?.focus();
});
const bookmark = openingSaved.openingStep;
enter(Number.isInteger(bookmark) && scenes[bookmark] ? bookmark : 0, false);
