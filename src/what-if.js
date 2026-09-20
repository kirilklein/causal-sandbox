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
    <nav class="trajectory-chapters" aria-label="Opening chapters">${scenes.map((scene, i) => `<button type="button" data-chapter="${i}" aria-label="${i + 1}. ${scene.label}"><span>${String(i + 1).padStart(2, "0")}</span><span class="chapter-name">${scene.label}</span></button>`).join("")}</nav>
    <div class="trajectory-title"><p id="trajectory-kicker">WHAT IF? · THE QUESTION BEHIND CAUSAL INFERENCE</p><h1 id="trajectory-heading" tabindex="-1"></h1></div>
    <p id="trajectory-description"></p>
    <section class="trajectory-stage" aria-label="Two possible futures">
      <div class="trajectory-legend"><span class="world-treated">● Treated</span><span id="trajectory-untreated" class="world-untreated">● Untreated</span><span>● Observed</span><span id="what-if-ghost">○ Simulated counterfactual</span></div>
      <canvas id="trajectory-canvas" role="img" aria-describedby="trajectory-description trajectory-reading">One patient’s health over twelve days, with treatment starting on day four.</canvas>
      <div id="what-if-population" hidden></div>
      <div class="trajectory-playback" id="what-if-playback"><span id="trajectory-frame-label"></span><button id="trajectory-pause" aria-label="Pause animation">Ⅱ Pause</button><button id="trajectory-replay">↻ Replay scene</button></div>
    </section>
    <div class="trajectory-story"><p id="trajectory-reading"></p><nav class="trajectory-navigation" aria-label="Continue learning"><button id="trajectory-back" aria-label="Previous scene">←</button><button id="trajectory-next"></button><a id="what-if-continue" href="${campaignHref("?lesson=randomization")}" hidden>Start with a randomized experiment →</a></nav></div>
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
  const scene = scenes[step];
  $("trajectory-heading").innerHTML = scene.title;
  $("trajectory-description").textContent = scene.copy;
  $("trajectory-reading").textContent = scene.reading;
  $("trajectory-back").disabled = step === 0;
  $("trajectory-next").hidden = step === 3;
  $("trajectory-next").textContent = `${scene.action || ""} →`;
  $("what-if-continue").hidden = step !== 3;
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
enter(0, false);
