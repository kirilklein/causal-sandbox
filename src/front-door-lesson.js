import "./instrument-lesson.css";
import "./front-door.css";
import { themeControl } from "./theme.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { frontDoorPopulation, reconstructFrontDoor } from "./front-door.js";
import {
  frontDoorGraph,
  frontDoorFormulas,
  frontDoorModel,
  frontDoorWorlds,
  effectCards,
} from "./front-door-view.js";
import { frontDoorStudents } from "./front-door-population.js";
import { mountStudentPopulation } from "./front-door-population-view.js";
import icon from "./brand.svg?raw";

const steps = [
  "Observe",
  "Group by practice",
  "Balance the groups",
  "Rebuild",
  "Test the limits",
];
let stage = 0;
let world = "valid";
let selection = 0.6;
let prediction = null;
let answer = null;
let balanced = false;
let truthRevealed = false;
const el = (id) => document.getElementById(id);

document.title = "The front-door criterion · Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page fd-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main>${lessonNavigation({ currentOptional: "front-door" })}
    <p class="eyebrow">ADVANCED · IDENTIFICATION</p>
    <h1 tabindex="-1">The front-door criterion</h1>
    <p class="intro fd-takeaway">A mediator can reveal the total effect even with hidden confounding—if it meets the front-door conditions.</p>
    <nav class="fd-steps" aria-label="Experiment steps">${steps.map((label, i) => `<button data-step="${i}"><span>${i + 1}</span>${label}</button>`).join("")}</nav>
    <section class="panel fd-experiment" aria-labelledby="fd-title">
      <div class="fd-stage"><p id="fd-step-label" class="eyebrow"></p><h2 id="fd-title" tabindex="-1"></h2><div id="fd-content"></div><details id="fd-story" class="fd-causal-story"><summary>Our assumed causal story</summary><div id="fd-graph"></div><p class="small" id="fd-story-note"></p></details><div id="fd-population"></div><div id="fd-after"></div></div>
      <nav class="fd-actions" aria-label="Move through experiment"><button id="fd-back">← Back</button><span id="fd-position"></span><button id="fd-next" class="primary"></button></nav>
    </section>
    <details class="fd-details"><summary>The four front-door conditions</summary><ol><li>Every causal path from A to Y passes through M.</li><li>There is no open back-door path from A to M.</li><li>Conditioning on A blocks every back-door path from M to Y.</li><li>The A/M combinations needed for both averages occur in the data.</li></ol><p>These conditions describe the assumed causal structure and support. An observed association or a successful fit cannot establish the graph. Consistency and no interference are also assumed.</p></details>
    <details id="fd-formulas" class="fd-details"><summary>The formula, connected to the pictures</summary>${frontDoorFormulas()}<p>Simply adjusting Y for A and M and reading off A’s coefficient does not perform this reconstruction. Holding M fixed blocks the mediated route we want to include.</p></details>
    <details id="fd-model" class="fd-details"><summary>Model and source</summary><p>This is an invented example, not evidence about tutoring. U, A, M and Y are binary with independent background randomness.</p>${frontDoorModel()}<p>Initially <math><mi>s</mi><mo>=</mo><mn>0.6</mn></math>.</p><p>The direct-path world adds <math><mn>0.15</mn><mi>A</mi></math> to the outcome probability. The hidden-mediator-cause world adds <math><mn>0.2</mn><mi>U</mi></math> to the practice probability. The no-overlap world sets <math><mi>M</mi><mo>=</mo><mi>A</mi></math>. Truth comes from intervening on A in each model. The reconstruction receives only the observed A/M/Y distribution.</p><p>Exact enumeration isolates identification. In finite studies the probabilities must be estimated, adding sampling error and possibly model error.</p><p><a href="https://bayes.cs.ucla.edu/PRIMER/primer-ch3.pdf">Pearl, Glymour & Jewell, Causal Inference in Statistics: A Primer</a>, §3.4, definition and theorem 3.4.1.</p></details>
    <nav class="fd-footer" aria-label="Continue learning"><button id="fd-restart">Restart lesson</button><a href="?lesson=hidden-confounding">← Hidden confounding</a><a href="?lesson=topics">All topics</a><a href="?lesson=misspecification">Resume core lessons →</a></nav>
  </main></div>`;
setupLessonNavigation();
const teachingPopulation = frontDoorPopulation();
const teachingResult = reconstructFrontDoor(teachingPopulation.cells);
const populationView = mountStudentPopulation(
  el("fd-population"),
  frontDoorStudents(teachingPopulation.cells),
  teachingResult,
);

function render(focus = false) {
  const population = frontDoorPopulation({
    world: stage === 4 ? world : "valid",
    selection: stage === 4 ? selection : 0.6,
  });
  const result = reconstructFrontDoor(population.cells);
  el("fd-graph").innerHTML = frontDoorGraph({
    stage,
    world: stage === 4 ? world : "valid",
    selection: stage === 4 ? selection : 0.6,
  });
  document.querySelectorAll("[data-step]").forEach((button) => {
    if (Number(button.dataset.step) === stage)
      button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  el("fd-step-label").textContent = [
    "START WITH THE CAUSAL QUESTION",
    "FIRST RELATIONSHIP · TUTORING → PRACTICE",
    "SECOND RELATIONSHIP · PRACTICE → PASSING",
    "TWO RELATIONSHIPS → ONE TOTAL EFFECT",
    "CHANGE THE ASSUMPTIONS",
  ][stage];
  el("fd-title").textContent = [
    "The groups already differ",
    "Tutoring changes the practice mix",
    "Give both practice groups the same tutoring mix",
    "Same responses. Two different practice mixes.",
    "A mediator is not enough",
  ][stage];
  el("fd-position").textContent = `${stage + 1} / ${steps.length}`;
  el("fd-back").disabled = stage === 0;
  el("fd-next").hidden = stage === 4;
  el("fd-next").textContent =
    [
      "Follow the mediator →",
      "Find the practice effect →",
      "Rebuild the total effect →",
      "Test the limits →",
    ][stage] || "";
  el("fd-population").hidden = stage === 4;
  el("fd-after").innerHTML = "";
  el("fd-story").open = stage === 4;
  el("fd-story-note").textContent =
    stage === 4
      ? "A, M and Y are measured; readiness U is hidden. Change the world below to test the reconstruction’s limits."
      : "A, M and Y are measured; readiness U is hidden. We assume tutoring affects passing only through practice.";
  el("fd-content").parentNode.insertBefore(
    el("fd-story"),
    el(stage === 4 ? "fd-content" : "fd-population"),
  );
  if (stage < 4) populationView.update(stage, balanced);
  if (stage === 0) {
    el("fd-content").innerHTML =
      `<p>Does tutoring help students pass? Readiness affects both joining tutoring and passing, so these groups already differ.</p>`;
    el("fd-after").innerHTML =
      `${effectCards(result, population)}<fieldset class="fd-question"><legend>Does that +38 pp difference tell us the total effect?</legend><button data-predict="yes">Yes</button><button data-predict="no">No</button></fieldset><p id="fd-prediction" class="fd-feedback" role="status">${prediction ? predictionText() : ""}</p>`;
    document.querySelectorAll("[data-predict]").forEach((button) =>
      button.addEventListener("click", () => {
        prediction = button.dataset.predict;
        el("fd-prediction").textContent = predictionText();
        document
          .querySelectorAll("[data-predict]")
          .forEach((choice) =>
            choice.setAttribute(
              "aria-pressed",
              String(choice.dataset.predict === prediction),
            ),
          );
      }),
    );
  } else if (stage === 1) {
    el("fd-content").innerHTML =
      `<p>Keep the same students. Separate little from regular practice: tutoring shifts the mix from <strong>20% to 70% regular practice</strong>.</p>`;
    el("fd-after").innerHTML =
      `<p class="fd-insight">Under our assumed graph, the tutoring → practice relationship is unconfounded. Next: what does practice do to passing?</p>`;
  } else if (stage === 2) {
    el("fd-content").innerHTML =
      `<p>Now group by practice. The tutoring mix differs. Compare outcomes within each tutoring group, then restore the population’s <strong>50/50 tutoring mix</strong> in both practice groups.</p><button id="fd-balance" class="primary" aria-pressed="${balanced}"></button>`;
    function updateBalance() {
      el("fd-balance").textContent = balanced
        ? "Show the observed mix"
        : "Make the tutoring mix the same";
      el("fd-balance").setAttribute("aria-pressed", String(balanced));
      el("fd-after").innerHTML =
        `<p class="fd-insight" role="status">${balanced ? "In our graph, comparing within tutoring groups blocks the hidden-readiness path from practice to passing. Only contributions change; observed pass rates stay fixed." : "The regular-practice group includes far more tutored students. Its higher pass rate also reflects their different readiness."}</p>`;
      populationView.update(stage, balanced);
    }
    el("fd-balance").addEventListener("click", () => {
      balanced = !balanced;
      updateBalance();
    });
    updateBalance();
  } else if (stage === 3) {
    el("fd-content").innerHTML =
      `<p>Reuse the balanced practice groups to rebuild two population averages. Keep their <strong>25% and 65% pass rates</strong>; change how much each practice group contributes.</p>`;
    function revealResult() {
      el("fd-after").innerHTML =
        `<p id="fd-reconstruction" class="fd-insight" tabindex="-1">53% − 33% = <strong>+20 percentage points</strong>. Changing the practice mix carries tutoring’s total effect.</p>${truthRevealed ? effectCards(result, population, true) : '<button id="fd-reveal" class="primary">Compare with simulator truth</button>'}`;
      el("fd-reveal")?.addEventListener("click", () => {
        truthRevealed = true;
        revealResult();
        el("fd-reconstruction").focus({ preventScroll: true });
      });
    }
    revealResult();
  } else {
    el("fd-content").innerHTML =
      `<label class="fd-control" for="fd-world">Which world are we in?<select id="fd-world">${Object.entries(
        frontDoorWorlds,
      )
        .map(
          ([key, item]) =>
            `<option value="${key}" ${key === world ? "selected" : ""}>${item.label}</option>`,
        )
        .join(
          "",
        )}</select></label><label class="fd-control" for="fd-selection">How strongly U selects students into tutoring <output id="fd-selection-value">${selection.toFixed(1)}</output><input id="fd-selection" type="range" min="0" max="0.8" step="0.1" value="${selection}"></label><div id="fd-limit-results"></div><details class="fd-transfer"><summary>Check your understanding</summary><fieldset class="fd-question"><legend>A learning app changes practice, but also improves exam scores through hints. Does practice identify the total effect by the front-door criterion?</legend><button data-answer="yes">Yes, practice is measured</button><button data-answer="no">No, the hints bypass practice</button></fieldset><p id="fd-answer" class="fd-feedback" role="status">${answer ? answerText() : ""}</p></details>`;
    updateLimits();
    el("fd-world").addEventListener("change", (event) => {
      world = event.target.value;
      updateLimits();
    });
    el("fd-selection").addEventListener("input", (event) => {
      selection = Number(event.target.value);
      updateLimits();
    });
    document.querySelectorAll("[data-answer]").forEach((button) =>
      button.addEventListener("click", () => {
        answer = button.dataset.answer;
        el("fd-answer").textContent = answerText();
      }),
    );
  }
  if (focus) el("fd-title").focus();
}

function updateLimits() {
  const population = frontDoorPopulation({ world, selection });
  const result = reconstructFrontDoor(population.cells);
  el("fd-selection-value").textContent = selection.toFixed(1);
  el("fd-graph").innerHTML = frontDoorGraph({ stage, world, selection });
  el("fd-limit-results").innerHTML =
    `${effectCards(result, population, true)}<p class="fd-insight" role="status">${frontDoorWorlds[world].note}${selection === 0 ? " U → A is set to zero here." : ""}</p>`;
}

function predictionText() {
  return `${prediction === "no" ? "Right." : "Not from that comparison."} The +38 pp mixes tutoring’s effect with differences in readiness. Follow M to reconstruct the effect without measuring U.`;
}
function answerText() {
  return `${answer === "no" ? "Right." : "Measuring the mediator is not enough."} The hints create an A → Y route outside M, violating the first condition. The front-door reconstruction cannot recover the total effect here.`;
}
document.querySelectorAll("[data-step]").forEach((button) =>
  button.addEventListener("click", () => {
    stage = Number(button.dataset.step);
    render(true);
  }),
);
el("fd-back").addEventListener("click", () => {
  stage--;
  render(true);
});
el("fd-next").addEventListener("click", () => {
  stage++;
  render(true);
});
el("fd-restart").addEventListener("click", () => {
  stage = 0;
  world = "valid";
  selection = 0.6;
  prediction = null;
  answer = null;
  balanced = false;
  truthRevealed = false;
  populationView.reset();
  document.querySelectorAll(".fd-details").forEach((detail) => {
    detail.open = false;
  });
  render(true);
});
render();
document.querySelector("h1").focus({ preventScroll: true });
