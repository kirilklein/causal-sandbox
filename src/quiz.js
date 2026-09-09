import { quizQuestions, recordAttempt } from "./quiz-questions.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { themeControl } from "./theme.js";
import icon from "./brand.svg?raw";
import "./lessons.css";
import "./quiz.css";

const app = document.querySelector("#app");
const attempts = new Map();
let position = 0;

app.innerHTML = `<header class="lesson-header"><a class="brand" href="?lesson=introduction">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main class="learning quiz-learning">${lessonNavigation({ currentOptional: "quiz" })}
  <div class="eyebrow">PUT THE IDEAS TO WORK</div><h1>Test your causal intuition</h1>
  <p>Six new challenges, about 5–8 minutes. Each first answer earns up to one point; retries help you learn. Leaving or reloading starts a fresh quiz.</p>
  <div id="quiz-content"></div></main>`;
setupLessonNavigation();
const content = document.querySelector("#quiz-content");

function graphMarkup(question) {
  if (!question.graph) return "";
  const { nodes, edges, description } = question.graph;
  return `<figure class="quiz-figure"><div class="quiz-graph">
    <svg viewBox="0 0 500 300" aria-hidden="true"><defs><marker id="quiz-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 9 5 1 9" fill="none" stroke="currentColor" stroke-width="1.5"/></marker></defs>
    ${edges
      .map(([from, to]) => {
        const [, x1, y1] = nodes.find(([id]) => id === from);
        const [, x2, y2] = nodes.find(([id]) => id === to);
        const dx = (x2 - x1) * 5,
          dy = (y2 - y1) * 3,
          length = Math.hypot(dx, dy);
        return `<path data-edge="${from}-${to}" d="M${x1 * 5 + (dx * 30) / length} ${y1 * 3 + (dy * 30) / length} L${x2 * 5 - (dx * 34) / length} ${y2 * 3 - (dy * 34) / length}" marker-end="url(#quiz-arrow)"/>`;
      })
      .join("")}</svg>
    ${nodes
      .map(([id, x, y]) => {
        const choice =
          question.kind === "graph" &&
          question.choices.find(([value]) => value === id);
        return choice
          ? `<button type="button" class="quiz-node" data-node="${id}" style="--node-fill:var(--node-${id});left:${x}%;top:${y}%" aria-label="Adjust for ${choice[1]}" aria-pressed="false">${id}</button>`
          : `<span class="quiz-node" style="--node-fill:var(--node-${id});left:${x}%;top:${y}%">${id}</span>`;
      })
      .join("")}</div><figcaption>${description}</figcaption></figure>`;
}

function renderQuestion(focus = false) {
  const question = quizQuestions[position];
  content.innerHTML = `<p class="sample-note">Question ${position + 1} of ${quizQuestions.length}</p>
    <section class="panel quiz-card" aria-labelledby="quiz-question"><h2 id="quiz-question" tabindex="-1">${question.title}</h2>
    <p>${question.context}</p>${question.assumptions ? `<details class="quiz-assumptions" open><summary>Assumptions and target</summary><p>${question.assumptions}</p></details>` : ""}
    ${graphMarkup(question)}
    <form id="quiz-form"><fieldset class="quiz-choices"><legend>${question.kind === "graph" ? "Select the variables to adjust for. Click the graph or use the checkboxes." : "Choose the most defensible answer."}</legend>
      ${question.choices.map(([id, label]) => `<label class="lesson-switch"><input type="${question.kind === "graph" ? "checkbox" : "radio"}" name="answer" value="${id}">${label}</label>`).join("")}
    </fieldset>${question.kind === "graph" ? '<p id="quiz-adjustment" aria-live="polite">Selected adjustment set: none. Submit with no selections if no adjustment is needed.</p>' : ""}
    <button id="quiz-submit" ${question.kind === "graph" ? "" : "disabled"}>Check answer</button></form>
    <div id="quiz-feedback" tabindex="-1" role="region" aria-label="Answer feedback" hidden></div>
    <div class="quiz-actions"><button id="quiz-retry" type="button" hidden>Try again for practice</button><button id="quiz-next" type="button" hidden>${position === quizQuestions.length - 1 ? "See my score" : "Next question →"}</button></div></section>`;
  const form = content.querySelector("form");
  const selected = () =>
    [...form.querySelectorAll("input:checked")].map((input) => input.value);
  function syncSelection() {
    if (question.kind !== "graph") {
      form.querySelector("button").disabled = false;
      return;
    }
    const values = selected();
    content.querySelector("#quiz-adjustment").textContent =
      `Selected adjustment set: ${values.join(" and ") || "none"}.`;
    content
      .querySelectorAll("[data-node]")
      .forEach((node) =>
        node.setAttribute(
          "aria-pressed",
          String(values.includes(node.dataset.node)),
        ),
      );
  }
  form.addEventListener("change", syncSelection);
  content.querySelectorAll("[data-node]").forEach((node) =>
    node.addEventListener("click", () => {
      const input = form.querySelector(`input[value="${node.dataset.node}"]`);
      input.checked = !input.checked;
      syncSelection();
    }),
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.querySelector("#quiz-submit").disabled) return;
    const values = selected();
    const first = !attempts.has(question.id);
    const correct = recordAttempt(attempts, question, values);
    const feedback = content.querySelector("#quiz-feedback");
    const specific =
      question.kind === "graph"
        ? `${values.includes("C") ? "Including C blocks the common-cause path." : "Leaving C out leaves the common-cause path open."} ${values.includes("M") ? "Including M removes a contribution we wanted to include." : "Leaving M out preserves the mediated contribution."}`
        : question.choices.find(([id]) => id === values[0])[2];
    feedback.innerHTML = `<h3>${correct ? "That’s right." : "Not quite."}</h3><p>${specific}</p><p>${question.explanation}</p><p class="sample-note">${first ? `${correct ? "1 point" : "0 points"} recorded for your first answer.` : "Practice attempt: your first-answer score stays the same."}</p><a href="?lesson=${question.lesson}" target="_blank" rel="noopener">Revisit this concept (new tab) ↗</a>`;
    feedback.hidden = false;
    form
      .querySelectorAll("input, button")
      .forEach((el) => (el.disabled = true));
    content
      .querySelectorAll("[data-node]")
      .forEach((node) => (node.disabled = true));
    for (const [from, to] of question.paths || [])
      content
        .querySelector(`[data-edge="${from}-${to}"]`)
        .classList.add("quiz-path-explained");
    content.querySelector("#quiz-retry").hidden = correct;
    content.querySelector("#quiz-next").hidden = false;
    feedback.focus();
  });
  content
    .querySelector("#quiz-retry")
    .addEventListener("click", () => renderQuestion(true));
  content.querySelector("#quiz-next").addEventListener("click", () => {
    position += 1;
    if (position === quizQuestions.length) renderScore();
    else renderQuestion(true);
  });
  if (focus) content.querySelector("h2").focus();
}

function renderScore() {
  const score = [...attempts.values()].filter(({ correct }) => correct).length;
  content.innerHTML = `<section class="panel quiz-card"><h2 tabindex="-1">Your score: ${score}/${quizQuestions.length}</h2><p>Based on your first answer to each question. This is feedback on these six challenges, not a certification of mastery.</p>
    <ul class="quiz-review">${quizQuestions
      .map((question) => {
        const attempt = attempts.get(question.id);
        return `<li><strong>${attempt.correct ? "✓ Understood" : "Revisit"}: ${question.concept}</strong><p>Your first answer: ${attempt.selected.map((id) => question.choices.find(([value]) => value === id)[1]).join("; ") || "No adjustment"}.</p>${!attempt.correct ? `<p>${question.explanation}</p><a href="?lesson=${question.lesson}" target="_blank" rel="noopener">Review lesson (new tab) ↗</a>` : ""}</li>`;
      })
      .join(
        "",
      )}</ul><div class="quiz-actions"><button id="quiz-restart">Start a fresh quiz</button><a href="?sandbox">Explore the full sandbox ↗</a></div></section>`;
  content.querySelector("#quiz-restart").addEventListener("click", () => {
    attempts.clear();
    position = 0;
    renderQuestion(true);
  });
  content.querySelector("h2").focus();
}

renderQuestion();
