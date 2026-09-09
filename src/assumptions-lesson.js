import "./instrument-lesson.css";
import "./assumptions-lesson.css";
import { themeControl } from "./theme.js";
import icon from "./brand.svg?raw";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { glossary } from "./glossary.js";
import {
  exchangeabilityWorld,
  armDistribution,
  armMean,
  treatmentComparison,
  supportWorld,
  coachingOutcome,
  coachingPolicy,
  peerOutcome,
} from "./assumption-experiments.js";

const topics = [
  [
    "exchangeability",
    "Comparable futures",
    "Would the groups have similar outcomes under the same treatment?",
  ],
  [
    "positivity",
    "Both options possible",
    "Is there a comparison for every group we want to learn about?",
  ],
  [
    "consistency",
    "A treatment with a meaning",
    "Does “treated” describe the intervention we actually mean?",
  ],
  [
    "no-interference",
    "When effects spill over",
    "Can someone else’s treatment change your outcome?",
  ],
];
const href = (key) => `?lesson=assumptions&assumption=${key}`;
const fmt = (number) => number.toFixed(1);

const experiments = {
  exchangeability: `
    <p>Imagine giving <em>the same treatment</em> to both groups. Exchangeability asks whether their outcome distributions would match.</p>
    <div class="exchange-workspace"><div>
    <label class="control-label" for="assignment">Who receives treatment?</label>
    <select id="assignment">
      <option value="randomized">Random assignment</option>
      <option value="measured">Selection by measured baseline C</option>
      <option value="hidden">Selection by unmeasured U</option>
    </select>
    <label class="adjust"><input type="checkbox" id="condition" />Compare within baseline groups C</label>
    <div class="assumption-toolbar"><label for="potential">Compare futures under</label><select id="potential"><option value="y0">No treatment · Y(0)</option><option value="y1">Treatment · Y(1)</option></select></div>
    <p class="small">Simulator view: both potential outcomes are known here. Real studies observe only the outcome under the treatment received.</p>
    </div><div>
    <div id="distributions"></div>
    <div class="results assumption-results"><div class="result"><span id="comparison-label">Observed treatment-group difference</span><strong id="comparison"></strong></div><div class="result assumption-truth"><span>True treatment effect</span><strong>2.0</strong></div></div>
    <p class="note" id="feedback" role="status"></p>
    </div></div>
    <details><summary>What stays fixed, and what does adjustment do?</summary><p>The population has four equally common types: C and U are independent binary baseline causes. Y(0) = 2 + 4C + 4U; Y(1) = Y(0) + 2. These futures stay fixed as treatment assignment changes.</p><p>Random assignment gives everyone a 50% chance of treatment. Selection gives C = 0 (or U = 0) a 20% chance and C = 1 (or U = 1) an 80% chance. Comparing within C leaves assignment untouched; it averages the two within-C outcome differences with equal population weights.</p><p>These are exact population distributions. Randomization establishes independence in the assignment process; finite randomized samples can still differ by chance. Matching means alone would not establish exchangeability: the full potential-outcome distributions matter.</p></details>`,
  positivity: `
    <p>To learn what treatment changes within a baseline group, we need a chance to observe people receiving either option.</p>
    <label class="control-label" for="support">Treatment availability</label>
    <select id="support"><option value="good">Both options common</option><option value="weak">One option rare</option><option value="absent">One option impossible</option></select>
    <div id="support-groups" class="support-groups"></div>
    <label class="adjust"><input type="checkbox" id="clip" />Clip probabilities to [0.10, 0.90]</label>
    <div id="support-weights"></div>
    <p class="note" id="feedback" role="status"></p>
    <details><summary>Where do the propensity scores sit?</summary><p class="small">Share within each treatment arm at each known score, before clipping. Each arm totals 100%; changing weights leaves these distributions unchanged.</p><div id="support-scores"></div></details>
    <details><summary>Population support versus the sample we happen to see</summary><p>The bars show expected counts per 100 people in each baseline group, using known treatment probabilities. A real sample may contain no one in a rare arm even when its probability is positive. More data can help with that scarcity; they cannot change a structural zero.</p><p>Weights are 1/p for treated people and 1/(1 − p) for untreated people. A weight of 20 lets one person represent 20 people before normalization. Clipping changes these contributions and can introduce bias; it does not recruit anyone into a missing comparison. The 0.10 bound is an illustration, not a recommended cutoff.</p><p>These two score values form a discrete propensity-score distribution. In real data scores are usually fitted: good-looking overlap cannot prove positivity or rule out hidden confounding. Extrapolating into a structural gap needs additional assumptions; excluding the group changes the target population.</p><a href="positivity/">Explore fitted scores and estimator behavior →</a></details>`,
  consistency: `
    <p>A record says “received coaching.” Was that one short session or a twelve-session course? If versions matter, the label leaves the causal question unfinished.</p>
    <label class="control-label" for="version">Define the intervention</label><select id="version"><option value="bundle">“Coaching” · version unspecified</option><option value="brief">One 30-minute session</option><option value="intensive">Twelve weekly 30-minute sessions</option><option value="policy">A specified random mix of the two</option></select>
    <div id="version-cards" class="version-cards"></div>
    <div id="mix-control" hidden><label class="control-label" for="mix">Chance of the twelve-session course <output id="mix-value" for="mix"></output></label><input id="mix" type="range" min="0" max="100" step="10" value="50" /></div>
    <p class="note" id="feedback" role="status"></p>
    <details><summary>Where does consistency enter?</summary><p>For this fictional person, no coaching gives a score of 50, one session gives 54, and twelve sessions give 62. If they receive one session, consistency links their observed score to Y(one session) = 54. It does not link that score to Y(twelve sessions).</p><p>Different versions do not automatically make a study unusable. Specify the relevant version, justify why version differences do not matter for the outcome, or define a policy that assigns versions with stated probabilities. A policy’s mean averages over its random assignment; it is not a single person’s guaranteed outcome. Defining the intervention does not by itself establish exchangeability or positivity.</p></details>`,
  "no-interference": `
    <p>Two study partners can share what they learn. Keep Alex’s treatment fixed, then give Sam tutoring: does Alex’s score change?</p>
    <div class="peer-controls"><label><input id="own" type="checkbox" />Alex receives tutoring</label><label><input id="peer" type="checkbox" />Sam receives tutoring</label><label><input id="spillover" type="checkbox" />Allow learning to spill over</label></div>
    <div id="peer-picture"></div>
    <div id="peer-futures" class="version-cards"></div>
    <p class="note" id="feedback" role="status"></p>
    <details><summary>An individual effect or an allocation strategy?</summary><p>Alex’s score is 50 + 10 × Alex’s tutoring + 8 × Sam’s tutoring when spillover is enabled. With spillover off, Sam’s treatment drops out. These are fictional scores from a simple additive example.</p><p>Changing Alex’s treatment while holding Sam’s fixed has a direct effect of 10 points here. Moving from neither tutored to both tutored raises Alex’s score by 18 with spillover, because two treatments changed. That allocation contrast answers a different question. In other worlds, the direct effect can also depend on the partner’s treatment.</p><p>Under interference, write potential outcomes as Y(Alex’s treatment, Sam’s treatment). Causal inference is still possible, but the design and analysis must represent who can affect whom and which allocation is being compared.</p></details>`,
};

document.querySelector("#app").innerHTML =
  `<div class="instrument-page assumptions-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main>${lessonNavigation({ currentOptional: "assumptions" })}
    <p class="eyebrow">OPTIONAL · CAUSAL ASSUMPTIONS</p>
    <nav class="assumption-topics" aria-label="Assumption experiments">${topics.map(([key, label], index) => `<a href="${href(key)}"><small>${index + 1} · ${glossary[key].title}</small>${label}</a>`).join("")}</nav>
    <div id="assumption-content"></div>
  </main></div>`;
setupLessonNavigation();
const el = (id) => document.getElementById(id);

function renderTopic(focus = false) {
  const requested = new URLSearchParams(location.search).get("assumption");
  const topicIndex = Math.max(
    0,
    topics.findIndex(([key]) => key === requested),
  );
  const [topic, title, question] = topics[topicIndex];
  const term = glossary[topic];
  for (const link of document.querySelectorAll(".assumption-topics a")) {
    if (link.getAttribute("href") === href(topic))
      link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  el("assumption-content").innerHTML = `
    <h1 tabindex="-1">${title}</h1><p class="intro">${question}</p>
    <section class="panel" aria-label="${term.title} experiment">${experiments[topic]}</section>
    <details><summary>The assumption in formal terms</summary><p>${term.formal}</p><a href="glossary/#${topic}">Read the glossary entry →</a></details>
    <details><summary>Sources and scope</summary><p>These are constructed teaching examples, not empirical evidence. Each isolates one assumption; satisfying it alone does not identify a causal effect.</p><ul>${term.sources.map(({ label, href: url }) => `<li><a href="${url}">${label}</a></li>`).join("")}<li><a href="https://doi.org/10.1177/0962280211398037">Hernán (2012), Beyond exchangeability</a></li></ul></details>
    <nav class="actions" aria-label="Continue learning"><a href="?lesson=leaving-the-sandbox">← Leaving the sandbox</a>${topicIndex < topics.length - 1 ? `<a class="primary" href="${href(topics[topicIndex + 1][0])}">Next: ${glossary[topics[topicIndex + 1][0]].title} →</a>` : '<a class="primary" href="?sandbox">Explore the full sandbox →</a>'}</nav>
  `;
  const render = {
    exchangeability: renderExchangeability,
    positivity: renderSupport,
    consistency: renderConsistency,
    "no-interference": renderInterference,
  }[topic];
  document.querySelector(".panel").addEventListener("input", render);
  render();
  if (focus)
    el("assumption-content").querySelector("h1").focus({ preventScroll: true });
}

function distributionChart(rows, outcome, label) {
  const distributions = [0, 1].map((arm) =>
    armDistribution(rows, arm, outcome),
  );
  return `<section class="distribution"><h2>${label}</h2><p class="small">${outcome === "y0" ? "Untreated" : "Treated"} potential outcome · share within each treatment group (0–100%)</p>${distributions[0]
    .map(
      ({ value }, index) =>
        `<div class="distribution-bin"><span class="outcome-value">Score ${value}</span>${[
          0, 1,
        ]
          .map((arm) => {
            const share = Math.round(100 * distributions[arm][index].share);
            return `<div class="distribution-arm"><span>${arm ? "Treated" : "Untreated"}</span><span class="distribution-track"><span class="distribution-bar arm-${arm}" style="width:${share}%"></span></span><strong>${share}%</strong></div>`;
          })
          .join("")}</div>`,
    )
    .join("")}</section>`;
}

function renderExchangeability() {
  const mechanism = el("assignment").value;
  const conditional = el("condition").checked;
  const rows = exchangeabilityWorld(mechanism);
  el("distributions").innerHTML = conditional
    ? [0, 1]
        .map((c) =>
          distributionChart(
            rows.filter((row) => row.c === c),
            el("potential").value,
            `Baseline C = ${c}`,
          ),
        )
        .join("")
    : distributionChart(
        rows,
        el("potential").value,
        "Same treatment, two groups of people",
      );
  el("comparison-label").textContent = conditional
    ? "Comparison standardized over C"
    : "Observed treatment-group difference";
  el("comparison").textContent = fmt(treatmentComparison(rows, conditional));
  const gap = armMean(rows, 1, "y0") - armMean(rows, 0, "y0");
  el("feedback").textContent =
    mechanism === "randomized"
      ? "The distributions match: assignment does not select people with different futures. Exchangeability holds in this population, and the observed difference equals the effect."
      : mechanism === "measured"
        ? conditional
          ? "Within each C group, the distributions now match. Adjustment compares like with like and recovers 2.0. It changed the comparison, not anyone’s treatment or future."
          : `Even without treatment, the treated group would score ${fmt(gap)} points higher. Selection by C mixes different futures; compare within C to separate this difference from treatment’s effect.`
        : "C is perfectly balanced between treatment groups, but U is not. The potential-outcome distributions still differ within C. Measured balance cannot certify exchangeability; U is visible only because we built this world.";
}

function renderSupport() {
  const support = el("support").value;
  const clipped = el("clip").checked;
  const groups = supportWorld(support, clipped);
  const scores = [...new Set(groups.map(({ p }) => p))];
  el("support-scores").innerHTML = scores
    .map(
      (score) =>
        `<div class="distribution-bin"><span class="outcome-value">Treatment probability ${Math.round(score * 100)}%</span>${[
          0, 1,
        ]
          .map((arm) => {
            const total = groups.reduce(
              (sum, group) => sum + group.arms[arm].count,
              0,
            );
            const count = groups
              .filter(({ p }) => p === score)
              .reduce((sum, group) => sum + group.arms[arm].count, 0);
            const percentage = (100 * count) / total;
            return `<div class="distribution-arm"><span>${arm ? "Treated" : "Untreated"}</span><span class="distribution-track"><span class="distribution-bar arm-${arm}" style="width:${percentage}%"></span></span><strong>${fmt(percentage)}%</strong></div>`;
          })
          .join("")}</div>`,
    )
    .join("");
  el("support-groups").innerHTML = groups
    .map(
      ({ c, p, arms }) =>
        `<section><h2>Baseline C = ${c}</h2><p>Known treatment probability: <strong>${Math.round(p * 100)}%</strong></p><div class="support-strip" aria-hidden="true">${arms.map(({ arm, count }) => `<span class="arm-${arm}" style="width:${count}%">${count >= 10 ? count : ""}</span>`).join("")}</div><p class="small">${arms[0].count} untreated · ${arms[1].count} treated<br />Expected per 100 people</p>${arms.some(({ count }) => count === 0) ? '<p class="support-missing">No untreated comparison</p>' : ""}</section>`,
    )
    .join("");
  el("support-weights").innerHTML =
    `<div class="table-wrap"><table><caption>Weight per observed person${clipped ? " · probabilities clipped" : " · original probabilities"}</caption><thead><tr><th scope="col">Baseline</th><th scope="col">Untreated</th><th scope="col">Treated</th></tr></thead><tbody>${groups.map(({ c, arms }) => `<tr><th scope="row">C = ${c}</th>${arms.map(({ weight }) => `<td>${weight === null ? "No people" : `${fmt(weight)}×`}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  el("feedback").textContent = {
    good: "Both treatments are possible and common in each group. Every observed person has weight 2; clipping changes nothing.",
    weak: `Both probabilities are still positive, but only 5 in 100 people receive the rare option in each group. ${clipped ? "Clipping cuts their weights from 20 to 10. The same five people still carry the rare comparison." : "Each of those rare observations carries weight 20: a few people carry much of the comparison."} There is no universal probability cutoff for adequate support.`,
    absent: `Everyone with C = 1 receives treatment. No one in that group shows us the untreated outcome. ${clipped ? "Clipping changes the treated weight, but the empty comparison remains empty." : "A weight cannot stand in for a person who cannot be observed."} The full-population effect is not identified by this adjustment comparison.`,
  }[support];
}

function renderConsistency() {
  const version = el("version").value;
  const policy = version === "policy";
  const share = Number(el("mix").value) / 100;
  el("mix-control").hidden = !policy;
  el("mix-value").textContent = `${Math.round(share * 100)}%`;
  el("version-cards").innerHTML = [
    ["none", "No coaching"],
    ["brief", "One session"],
    ["intensive", "Twelve sessions"],
  ]
    .map(
      ([key, label]) =>
        `<div class="version-card ${key === version ? "chosen-version" : ""}"><span>${label}</span><strong>${coachingOutcome(key)}</strong><small>Potential score${key === version ? " · specified intervention" : ""}</small></div>`,
    )
    .join("");
  el("feedback").textContent =
    version === "bundle"
      ? "Which treated future do we mean: 54 or 62? Both fit the recorded label. “Coaching” alone does not specify the intervention in this example."
      : policy
        ? `A policy that randomly assigns ${Math.round(share * 100)}% to twelve sessions and the rest to one session has expected score ${fmt(coachingPolicy(share))}. Its expected gain over no coaching is ${fmt(coachingPolicy(share) - coachingOutcome("none"))}. Changing the mix changes the intervention.`
        : `Now “treated” means ${version === "brief" ? "one 30-minute session" : "twelve weekly 30-minute sessions"}. If this person receives that version, their observed score is the corresponding potential score: ${coachingOutcome(version)}. The gain over no coaching is ${coachingOutcome(version) - coachingOutcome("none")} points.`;
}

function renderInterference() {
  const own = el("own").checked;
  const peer = el("peer").checked;
  const spillover = el("spillover").checked;
  el("peer-picture").innerHTML =
    `<div class="peer-pair"><div class="person"><span>Sam</span><strong>${peer ? "Tutoring" : "No tutoring"}</strong></div><div class="spillover-link"><span aria-hidden="true">${spillover ? "→" : "↛"}</span><small>${spillover ? "Sharing allowed" : "No spillover"}</small></div><div class="person"><span>Alex · ${own ? "tutoring" : "no tutoring"}</span><strong>Score ${peerOutcome(own, peer, spillover)}</strong></div></div>`;
  el("peer-futures").innerHTML = [false, true]
    .map(
      (peerTreated) =>
        `<div class="version-card ${peerTreated === peer ? "chosen-version" : ""}"><span>If Sam ${peerTreated ? "receives tutoring" : "is not tutored"}</span><strong>${peerOutcome(own, peerTreated, spillover)}</strong><small>Alex’s potential score · own treatment fixed</small></div>`,
    )
    .join("");
  el("feedback").textContent = spillover
    ? "Alex’s two futures differ by 8 even though Alex’s own treatment is the same. Sam’s treatment matters too: the individual-treatment description is no longer enough."
    : "Alex’s two futures match. Changing Sam’s treatment does not change Alex’s outcome: no interference holds in this world.";
}

document.querySelector("#app").addEventListener("click", (event) => {
  const link = event.target.closest(".assumption-topics a, .actions a");
  if (
    !link ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const url = new URL(link.href);
  if (url.searchParams.get("lesson") !== "assumptions") return;
  event.preventDefault();
  if (url.href === location.href) return;
  history.pushState(null, "", url);
  renderTopic(true);
  if (link.closest(".actions"))
    document.querySelector(".assumption-topics").scrollIntoView();
});
window.addEventListener("popstate", () => renderTopic(true));
renderTopic();
