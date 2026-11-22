import "./instrument-lesson.css";
import "./uplift.css";
import { themeControl } from "./theme.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import {
  upliftWorlds,
  upliftRules,
  upliftPopulation,
  upliftStudy,
  fitUplift,
  allocateContacts,
  campaignTruth,
  evaluateCampaign,
} from "./uplift.js";
import icon from "./brand.svg?raw";

const steps = [
  "What is uplift?",
  "Who should we contact?",
  "Estimate the difference",
  "Test the rule",
];
const el = (id) => document.getElementById(id);
const number = (n) => Number(n.toFixed(1)).toLocaleString("en-US");
const signed = (n) => `${n > 0 ? "+" : ""}${number(n)}`;
const percent = (p) => `${number(100 * p)}%`;
let step = 0;
let world = "different";
let budget = 100;
let rule = "conversion";
let trainingSeed = 4217;
let holdoutSeed = 90123;
let prediction = null;
let practice = null;
let fitted = false;
let evaluated = false;
let population;
let estimates;
let holdout;

function drawStudies() {
  population = upliftPopulation(world);
  const training = upliftStudy(population, trainingSeed);
  estimates = fitUplift(training);
  holdout = upliftStudy(population, holdoutSeed);
}
drawStudies();

document.title = "Uplift modelling · Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page uplift-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main>${lessonNavigation({ currentOptional: "uplift" })}
    <p class="eyebrow">OPTIONAL TRACK · FROM EFFECTS TO DECISIONS</p>
    <h1>Uplift modelling</h1>
    <p class="intro">Uplift modelling estimates how an intervention changes an outcome for different groups. It helps us decide whom to treat or contact.</p>
    <nav class="uplift-steps" aria-label="Uplift track">${steps.map((title, i) => `<button data-step="${i}"><span>${i + 1}</span>${title}</button>`).join("")}</nav>
    <section class="panel uplift-experiment" aria-labelledby="uplift-title">
      <p class="eyebrow">FICTIONAL CAMPAIGN · TARGET POPULATION: 400 CUSTOMERS</p>
      <h2 id="uplift-title" tabindex="-1"></h2>
      <p id="uplift-intro"></p>
      <div id="uplift-controls"></div>
      <div id="uplift-evidence"></div>
      <div id="uplift-action"></div>
      <div id="uplift-result" role="status"></div>
    </section>
    <div id="uplift-details"></div>
    <nav class="uplift-actions" aria-label="Continue uplift track"><button id="uplift-back">← Back</button><button id="uplift-reset">Restart track</button><button id="uplift-next" class="primary"></button></nav>
    <details class="uplift-details"><summary>References and inspiration</summary>
      <ul>
        <li><a href="https://proceedings.mlr.press/v67/gutierrez17a.html">Gutierrez & Gérardy (2017)</a> — uplift modelling and its causal interpretation.</li>
        <li><a href="https://doi.org/10.1073/pnas.1804597116">Künzel et al. (2019)</a> — S-, T-, and X-learners. No learner is uniformly best.</li>
        <li><a href="https://doi.org/10.1080/01621459.2017.1319839">Wager & Athey (2018)</a> — causal forests and inference.</li>
        <li><a href="https://doi.org/10.3982/ECTA15732">Athey & Wager (2021)</a> — learning treatment policies under constraints.</li>
        <li><a href="https://arxiv.org/abs/2111.07966">Yadlowsky et al.</a> — evaluating treatment prioritization, including Qini, with uncertainty.</li>
        <li><a href="https://doi.org/10.3982/ECTA12423">Blake, Nosko & Tadelis (2015)</a> — a paid-search field experiment separating attributed purchases from advertising effects.</li>
      </ul><p class="small">Inspired by Sandip D.</p>
    </details>
    <p class="small">Helpful background: <a href="?lesson=what-if">Potential outcomes</a> · <a href="?lesson=randomization">Randomization</a> · <a href="?lesson=uncertainty">Uncertainty</a> · <a href="?lesson=outcome-regression">Outcome models</a> · <a href="?lesson=overlap">Overlap</a></p>
    <a href="?lesson=topics">← Return to all topics</a>
  </main></div>`;
setupLessonNavigation();

function groupChart(values, contacts = null, observed = false) {
  return `<figure class="uplift-cohort"><figcaption>${observed ? "Fitted purchase chances · randomized training study" : "Simulator truth · purchase chances in each group"}</figcaption>
    <p class="small uplift-legend"><span>○ No contact</span><span>▲ Contact</span><span>pp = percentage points</span></p>
    <div class="uplift-axis"><span>Purchase chance</span><div><span>0%</span><span>50%</span><span>100%</span></div><span>Uplift</span></div>
    ${population
      .map((group, i) => {
        const { p0, p1 } = values[i];
        const change = p1 - p0;
        return `<div class="uplift-group" ${contacts ? `data-contacted="${contacts[i] > 0}"` : ""}>
        <div><strong>${group.name}</strong><small>${observed ? "400 per study arm" : contacts ? `${number(contacts[i])} of 100 contacted` : "100 customers"}</small></div>
        <div><div class="uplift-probability" aria-hidden="true"><svg viewBox="0 0 100 32" preserveAspectRatio="none"><path class="uplift-grid" d="M0 8V24 M50 8V24 M100 8V24"/><path class="uplift-connector" d="M${p0 * 100} 16 H${p1 * 100}"/></svg><span class="uplift-no-contact" style="left:${p0 * 100}%"></span><span class="uplift-contact" style="left:${p1 * 100}%"></span></div>
        <span class="small">${percent(p0)} without → ${percent(p1)} with contact</span></div>
        <strong class="uplift-difference">${signed(change * 100)}<small>pp</small></strong>
      </div>`;
      })
      .join(
        "",
      )}<p class="small">The horizontal gap is uplift. Equal chances share one position.</p></figure>`;
}

function renderEvidence() {
  const counts = allocateContacts(
    population,
    step < 2 ? population : estimates,
    rule,
    budget,
  );
  if (step < 3) {
    el("uplift-evidence").innerHTML = groupChart(
      step === 0 ? upliftPopulation() : step === 2 ? estimates : population,
      step === 1 && prediction !== null ? counts : null,
      step === 2,
    );
    el("uplift-evidence").hidden = step === 2 && !fitted;
  } else {
    el("uplift-evidence").hidden = !evaluated;
    el("uplift-evidence").innerHTML = evaluated ? evaluationChart() : "";
  }
  if (step === 0) {
    el("uplift-result").innerHTML =
      `<p class="uplift-takeaway"><strong>Browsing: 35 → 65 purchases per 100, on average.</strong><br>Contact adds 30 purchases. That difference is uplift. Frequent buyers are more likely to buy, but contact lowers their purchase chance in this example.</p>`;
  } else if (step === 1) {
    if (prediction !== null)
      el("uplift-intro").textContent =
        `Our goal: use ${budget} contacts to create as many extra purchases as possible, compared with contacting nobody. Compare the three rules below. Highlighted groups receive contact.`;
    el("uplift-rule-note").textContent = {
      conversion:
        "Highest purchase chance chooses people most likely to buy without contact. It ignores whether contact helps, so it can select people whose purchase chance goes down.",
      uplift:
        "Highest uplift chooses the largest increase in purchase chance caused by contact. It ranks groups by the difference between contact and no contact.",
      random:
        "Random contacts gives everyone the same chance of being contacted. Use it as a baseline to see whether targeting creates more extra purchases.",
    }[rule];
    const result = campaignTruth(population, counts);
    el("uplift-result").innerHTML =
      prediction === null
        ? ""
        : `<p class="uplift-takeaway">The campaign ${result.effect < -1e-8 ? "prevents" : "adds"} <strong>${number(Math.abs(result.effect))} purchases</strong> compared with no contact.<br>${number(result.withContact)} expected purchases among ${budget} contacts. ${number(result.without)} would happen without contact.</p><p class="small">${world === "different" ? "Switch targeting rules while keeping the same budget. Compare the purchases each rule adds, not just the purchases among its contacts." : world === "aligned" ? "Here, high purchase chance and high uplift point to the same groups. Their relationship depends on the world." : "Every rule has zero true uplift here. Purchase predictions can still be accurate."} Random contacts allocates the same fraction to every group, representing its expected allocation.</p>${budget > 200 && world === "different" ? '<p class="small">This comparison spends the full contact budget, even on zero or negative effects. In practice, a budget can be a ceiling: leave harmful contacts unused.</p>' : ""}`;
  } else if (step === 2) {
    el("uplift-result").innerHTML = fitted
      ? `<p class="uplift-takeaway">For Browsing, the no-contact model predicts <strong>${percent(estimates[1].p0)}</strong> and the contact model predicts <strong>${percent(estimates[1].p1)}</strong>. Subtract them to estimate <strong>${signed(estimates[1].effect * 100)} pp</strong> of uplift.</p><p class="small">These are fitted group averages, not known effects for individual customers. Redraw the study to see sampling error. The underlying world stays fixed.</p>`
      : "";
  } else {
    el("uplift-result").innerHTML = evaluated
      ? `<p class="uplift-takeaway">The holdout asks how many purchases each fixed rule adds compared with contacting nobody. The intervals show sampling uncertainty, not uncertainty from hidden confounding.</p><p class="small">${budget} contacts from a new population with the same four equally sized groups. Training and evaluation use separate people. Intervals are approximate 95% intervals for each policy's incremental value, not tests of differences between policies.</p>`
      : "";
  }
}

function evaluationChart() {
  const rows = Object.entries(upliftRules).map(([id, name]) => {
    const contacts = allocateContacts(population, estimates, id, budget);
    return { name, ...evaluateCampaign(holdout, contacts) };
  });
  const lo =
    Math.floor(Math.min(-5, ...rows.map((row) => row.lower)) / 10) * 10;
  const hi = Math.ceil(Math.max(5, ...rows.map((row) => row.upper)) / 10) * 10;
  const x = (value) => 10 + (280 * (value - lo)) / (hi - lo);
  return `<figure class="uplift-evaluation"><figcaption>Independent randomized holdout · estimated extra purchases</figcaption>
    ${rows.map(({ name, effect, lower, upper }) => `<div class="uplift-policy"><strong>${name}</strong><svg viewBox="0 0 300 38" aria-hidden="true"><path class="uplift-zero" d="M${x(0)} 0v38"/><path class="uplift-interval" d="M${x(lower)} 19H${x(upper)} M${x(lower)} 13v12 M${x(upper)} 13v12"/><circle cx="${x(effect)}" cy="19" r="4"/></svg><span>${signed(effect)}<small>95% interval ${signed(lower)} to ${signed(upper)}</small></span></div>`).join("")}
    <p class="small">● Estimate · line: 95% interval · dashed line: zero extra purchases. All rows share one scale (${lo} to ${hi}).</p></figure>`;
}

function details(summary, body) {
  return `<details class="uplift-details"><summary>${summary}</summary>${body}</details>`;
}

function renderStep(focus = false) {
  el("uplift-title").textContent = steps[step];
  document.querySelectorAll("[data-step]").forEach((button, i) => {
    if (i === step) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  el("uplift-back").hidden = step === 0;
  el("uplift-next").hidden = step === 3;
  el("uplift-next").textContent = `Next: ${steps[step + 1] || ""} →`;
  el("uplift-evidence").hidden = false;
  el("uplift-controls").innerHTML = "";
  el("uplift-action").innerHTML = "";
  if (step === 0) {
    el("uplift-intro").textContent =
      "A shop has 400 customers and a budget for 100 reminders. Its goal is to create as many extra purchases as possible, compared with sending no reminders. First, look at how a reminder changes each group’s purchase chance. These are known simulator probabilities. In real data, each person reveals only the outcome under the choice they received.";
    el("uplift-details").innerHTML =
      details(
        "Why can’t we know who was persuaded?",
        `<p>For one customer, we observe a purchase after contact or after no contact. We never observe both outcomes for the same person in the same situation.</p><p>“Persuadables” would buy only if contacted. “Sure things” would buy either way. “Lost causes” would buy neither way. “Harmed” customers would buy only without contact. These are hidden potential-outcome types, not observed labels. Group uplift measures the share helped minus the share harmed.</p>`,
      ) +
      details(
        "Uplift, CATE, and two different probabilities",
        `<p>The conditional average treatment effect (CATE) is the average effect among people with baseline characteristics X = x.</p><p class="uplift-formula">τ(x) = E[Y(1) − Y(0) | X = x]</p><p>For a purchase outcome, this is the purchase probability with contact minus the probability without contact. A 95% untreated purchase chance leaves at most 5 percentage points of positive uplift. It does not imply zero uplift.</p><p>Treatment propensity P(T = 1 | X) is the chance of receiving contact. It is not purchase probability P(Y = 1 | X). A purchase model trained on a mixture of contacted and uncontacted people does not automatically estimate the no-contact baseline.</p>`,
      );
  } else if (step === 1) {
    el("uplift-intro").textContent =
      "Our goal is to create extra purchases with 100 reminders. We will compare a rule that finds likely buyers with one that finds the greatest benefit from contact. Which rule will add more purchases compared with sending no reminders?";
    el("uplift-action").innerHTML =
      `<div id="uplift-prediction"><p><strong>Predict, then compare the rules.</strong></p><div class="uplift-actions"><button data-predict="conversion">Highest purchase chance</button><button data-predict="uplift">Highest uplift</button></div></div><p id="uplift-feedback" class="uplift-feedback" role="status"></p>`;
    el("uplift-controls").innerHTML =
      `<div id="uplift-targeting" class="uplift-controls"><label>World<select id="uplift-world">${Object.entries(
        upliftWorlds,
      )
        .map(
          ([id, name]) =>
            `<option value="${id}" ${world === id ? "selected" : ""}>${name}</option>`,
        )
        .join(
          "",
        )}</select></label><label><span>Contact budget: <output id="uplift-budget-value">${budget}</output> of 400</span><input id="uplift-budget" type="range" min="100" max="400" step="100" value="${budget}"></label><fieldset><legend>Targeting rule</legend>${Object.entries(
        upliftRules,
      )
        .map(
          ([id, name]) =>
            `<label><input type="radio" name="uplift-rule" value="${id}" ${rule === id ? "checked" : ""}>${name}</label>`,
        )
        .join(
          "",
        )}</fieldset><p id="uplift-rule-note" class="small" role="status"></p></div>`;
    updatePrediction();
    el("uplift-world").addEventListener("change", (event) => {
      world = event.target.value;
      drawStudies();
      evaluated = false;
      renderEvidence();
    });
    el("uplift-budget").addEventListener("input", (event) => {
      budget = Number(event.target.value);
      el("uplift-budget-value").textContent = budget;
      renderEvidence();
    });
    document.querySelectorAll('[name="uplift-rule"]').forEach((input) =>
      input.addEventListener("change", () => {
        rule = input.value;
        renderEvidence();
      }),
    );
    document.querySelectorAll("[data-predict]").forEach((button) =>
      button.addEventListener("click", () => {
        prediction = button.dataset.predict;
        rule = prediction;
        const selectedRule = document.querySelector(
          `[name="uplift-rule"][value="${rule}"]`,
        );
        selectedRule.checked = true;
        updatePrediction();
        renderEvidence();
        selectedRule.focus();
      }),
    );
    el("uplift-details").innerHTML = details(
      "What is known in this experiment?",
      `<p>This step ranks using known simulator probabilities so you can isolate the choice of objective. The next step estimates both purchase probabilities from data.</p><p>Each group has 100 customers. Ranking fills whole groups in order, with ties broken in the displayed group order. Random contacts represents its expected allocation, not a newly drawn random audience. All rules spend the same budget.</p><p>Contact can annoy a customer, giving negative uplift. The simulated worlds illustrate possible relationships, not a general law about frequent buyers.</p>`,
    );
  } else if (step === 2) {
    el("uplift-intro").textContent =
      `Now hide the true probabilities. In a separate study, customers in each group are randomly assigned to contact or no contact, 400 in each arm. Fit purchase chance separately in the two arms, then subtract. World: ${upliftWorlds[world].toLowerCase()}.`;
    el("uplift-action").innerHTML =
      `<button id="uplift-fit" class="primary">${fitted ? "Redraw training study" : "Fit the two outcome models"}</button>`;
    el("uplift-fit").addEventListener("click", () => {
      if (fitted) trainingSeed += 1;
      fitted = true;
      evaluated = false;
      drawStudies();
      el("uplift-fit").textContent = "Redraw training study";
      renderEvidence();
    });
    el("uplift-details").innerHTML =
      details(
        "The simplest T-learner",
        `<p>Within each customer group, the no-contact model predicts that arm’s observed purchase proportion. The contact model does the same for the other arm. Their difference estimates CATE. This is a T-learner with categorical group means, not a model of hidden customer types.</p><p>Each training arm has 400 people per group, for 3,200 study participants. A missing arm would leave a group comparison unavailable. Group membership is measured before contact.</p>`,
      ) +
      details(
        "Other learners and observational data",
        `<p>An S-learner fits one outcome model including treatment. An X-learner uses outcome models and imputed effect targets. Causal forests learn effect heterogeneity through tree-based comparisons. More flexible methods do not automatically improve targeting.</p><p>For observational data, defend conditional exchangeability, overlap, and consistency, and account for interference if one customer’s contact affects another. Changing the prediction objective does not fix selection or confounding bias. <a href="?lesson=assumptions">Explore the causal assumptions.</a></p>`,
      );
  } else {
    el("uplift-intro").textContent =
      `Freeze the rules using the training estimates, then evaluate them on 3,200 different randomized participants. Each rule gets ${budget} contacts. The holdout outcomes never choose whom a rule contacts.`;
    el("uplift-action").innerHTML =
      `<button id="uplift-evaluate" class="primary">${evaluated ? "Redraw independent holdout" : "Evaluate on the holdout"}</button>`;
    el("uplift-evaluate").addEventListener("click", () => {
      if (evaluated) holdoutSeed += 1;
      evaluated = true;
      holdout = upliftStudy(population, holdoutSeed);
      el("uplift-evaluate").textContent = "Redraw independent holdout";
      renderEvidence();
    });
    el("uplift-details").innerHTML =
      details(
        "From incremental purchases to policy value",
        `<p>For each group, multiply its held-out contact-minus-no-contact purchase rate by the number the policy would contact. Sum across groups. This estimates extra purchases in a new, equally composed 400-person campaign, relative to contacting nobody.</p><p>The intervals use independent binomial sample variances within the randomized arms and a normal approximation. They condition on the fitted rules and this population composition. They do not include uncertainty from learning another rule or guarantee coverage in very small samples.</p><p>Here each purchase has the same value and contact costs are equal. With varying margins or costs, optimize expected incremental net value instead. A budget need not be fully spent on harmful contacts.</p>`,
      ) +
      details(
        "Uplift curves, Qini, and what AUC misses",
        `<p>An uplift curve plots estimated cumulative incremental outcomes as the contacted fraction increases down a ranking. AUUC summarizes area under that curve. Qini summaries compare cumulative gain with a random-targeting baseline. Scaling conventions vary, so state which curve, normalization, and population you use.</p><p>Classification AUC measures how well purchase predictions rank buyers above non-buyers. It does not measure incremental purchases. Neither an AUC comparison nor a single simulated run proves one targeting method always wins.</p><p>A holdout only among high-purchase-chance customers answers a question about that segment. To evaluate all these policies, this holdout includes both arms in every customer group. Repeatedly using a holdout to choose the winning rule requires a fresh final evaluation.</p>`,
      ) +
      `<section class="uplift-practice" aria-labelledby="uplift-practice-title"><h2 id="uplift-practice-title">Check your reasoning</h2><p>A campaign reports a high purchase rate among contacted customers. Does that establish high uplift?</p><div class="uplift-actions"><button data-practice="yes">Yes, purchases show success</button><button data-practice="no">No, we need the no-contact comparison</button></div><p id="uplift-practice-feedback" class="uplift-feedback" role="status"></p></section>`;
    document.querySelectorAll("[data-practice]").forEach((button) =>
      button.addEventListener("click", () => {
        practice = button.dataset.practice;
        updatePractice();
      }),
    );
    updatePractice();
  }
  renderEvidence();
  if (focus) el("uplift-title").focus();
}

function updatePrediction() {
  el("uplift-prediction").hidden = prediction !== null;
  el("uplift-targeting").hidden = prediction === null;
  el("uplift-feedback").textContent =
    prediction === null
      ? ""
      : `Your opening prediction: ${prediction === "uplift" ? "✓ Correct." : "! Not quite."} In the opening world with 100 contacts, uplift selects Browsing and adds 30 purchases. Purchase chance selects Frequent buyers and prevents 5. Now compare the rules, then test other budgets and worlds.`;
  el("uplift-feedback").dataset.result =
    prediction === "uplift" ? "correct" : "review";
}

function updatePractice() {
  el("uplift-practice-feedback").textContent =
    practice === null
      ? ""
      : `${practice === "no" ? "✓ Correct." : "! Not quite."} Many of those customers might have bought anyway. Uplift needs the difference between outcomes with and without contact.`;
  el("uplift-practice-feedback").dataset.result =
    practice === "no" ? "correct" : "review";
}

document.querySelectorAll("[data-step]").forEach((button) =>
  button.addEventListener("click", () => {
    step = Number(button.dataset.step);
    renderStep(true);
  }),
);
el("uplift-next").addEventListener("click", () => {
  step += 1;
  renderStep(true);
});
el("uplift-back").addEventListener("click", () => {
  step -= 1;
  renderStep(true);
});
el("uplift-reset").addEventListener("click", () => {
  step = 0;
  world = "different";
  budget = 100;
  rule = "conversion";
  trainingSeed = 4217;
  holdoutSeed = 90123;
  prediction = practice = null;
  fitted = evaluated = false;
  drawStudies();
  renderStep(true);
});
renderStep();
