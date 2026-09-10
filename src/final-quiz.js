import { finalQuestions, recordFinalAnswer } from "./final-quiz-questions.js";
import { graphMarkup } from "./quiz-graph.js";
import { learningFrame, learningUrl, topicLesson } from "./learning.js";
import "./final-quiz.css";

const attempts = new Map();
let position = 0;
let practice = false;
let reviewing = false;

learningFrame(
  "Final quiz",
  "final-quiz",
  `
  <p class="learning-lead">Eight challenges for after the core course. Your first answer to each question counts; retries are practice. No optional chapters required.</p>
  <p class="sample-note">This attempt stays in this page. Leaving or reloading starts a new attempt.</p>
  <div id="final-quiz-content"></div>`,
);
const content = document.querySelector("#final-quiz-content");

function setupMarkup(question) {
  const facts = question.facts
    ? `<dl class="quiz-facts">${question.facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`
    : "";
  const graph = graphMarkup(question);
  const graphs = question.graphs
    ? `<div class="final-quiz-graphs">${question.graphs.map((item, index) => `<div><h3>${item.label}</h3>${graphMarkup({ id: `${question.id}-${index}`, graph: item })}</div>`).join("")}</div>`
    : "";
  const table = question.table
    ? `<table class="final-quiz-table"><caption>Model predictions and target population</caption><thead><tr>${question.table.headings.map((heading) => `<th scope="col">${heading}</th>`).join("")}</tr></thead><tbody>${question.table.rows.map(([label, ...cells]) => `<tr><th scope="row">${label}</th>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`
    : "";
  return `<p>${question.context}</p>${table}<div class="${graph && facts ? "quiz-diagram" : ""}">${graph}${facts}</div>${graphs}<details class="quiz-assumptions"><summary>Assumptions</summary><p>${question.assumptions}</p></details>`;
}

function explanation(question, choice) {
  const specific =
    choice === "unsure"
      ? "Start with the target and the supplied information."
      : question.choices.find(([id]) => id === choice)[2];
  const lesson = topicLesson(
    question.reviewLessons?.[choice] || question.lesson,
  );
  return `<p>${specific}</p><p>${question.explanation}</p>
    <a href="${lesson.href}" target="_blank" rel="noopener">Review: ${lesson.title} (new tab) ↗</a>
    <details class="quiz-assumptions"><summary>Sources and attribution</summary><p>Original scenario, applying concepts from:</p><ul>${question.sources.map(([title, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${title} ↗</a></li>`).join("")}</ul></details>`;
}

function renderQuestion({ retry = false, focus = false } = {}) {
  const question = finalQuestions[position];
  const first = attempts.get(question.id);
  const locked = first && !retry;
  content.innerHTML = `<p class="sample-note">${practice || reviewing || retry ? "Practice · " : ""}Question ${position + 1} of ${finalQuestions.length}</p>
    <section class="panel quiz-card" aria-labelledby="final-question"><h2 id="final-question" tabindex="-1">${question.title}</h2>
      ${setupMarkup(question)}
      <form id="final-answer"><fieldset class="quiz-choices" ${locked ? "disabled" : ""}><legend>${question.prompt}</legend>
      ${[...question.choices, ["unsure", "I’m not sure"]].map(([id, label]) => `<label class="quiz-choice"><input type="radio" name="answer" value="${id}" ${first?.choice === id && !retry ? "checked" : ""} required><span>${label}</span></label>`).join("")}
      </fieldset><button id="final-submit" ${locked ? "hidden" : "disabled"}>Check answer</button></form>
      <div id="final-feedback" class="quiz-practice-feedback" tabindex="-1" role="region" aria-label="Answer feedback" hidden></div>
      <nav class="lesson-actions" aria-label="Quiz questions"><button id="final-back" ${position ? "" : "hidden"}>← Previous question</button><button id="final-retry" hidden>Try again for practice</button><button id="final-next" class="primary" hidden>${position === finalQuestions.length - 1 ? "See my results" : "Next question →"}</button><button id="final-results" ${reviewing ? "" : "hidden"}>Back to results</button></nav>
    </section>`;
  const form = content.querySelector("form");
  const feedback = content.querySelector("#final-feedback");
  function showFeedback(choice, correct, isPractice) {
    feedback.innerHTML = `<h3>${choice === "unsure" ? "Let’s work through it." : correct ? "That’s right." : "Not quite."}</h3>${explanation(question, choice)}<p class="sample-note">${isPractice ? "Practice: your first-answer score stays the same." : `${correct ? "1 point" : "0 points"} recorded for your first answer.`}</p>`;
    feedback.hidden = false;
    content.querySelector("fieldset").disabled = true;
    content.querySelector("#final-submit").hidden = true;
    content.querySelector("#final-retry").hidden = false;
    content.querySelector("#final-next").hidden = false;
  }
  form.addEventListener("change", () => {
    content.querySelector("#final-submit").disabled = false;
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (content.querySelector("fieldset").disabled) return;
    const choice = new FormData(form).get("answer");
    if (!choice) return;
    const isPractice = attempts.has(question.id);
    const correct = recordFinalAnswer(attempts, question, choice);
    showFeedback(choice, correct, isPractice);
    feedback.focus();
  });
  content.querySelector("#final-back").addEventListener("click", () => {
    position -= 1;
    renderQuestion({ focus: true });
  });
  content
    .querySelector("#final-retry")
    .addEventListener("click", () =>
      renderQuestion({ retry: true, focus: true }),
    );
  content.querySelector("#final-next").addEventListener("click", () => {
    position += 1;
    if (position === finalQuestions.length) renderResults();
    else renderQuestion({ focus: true });
  });
  content
    .querySelector("#final-results")
    .addEventListener("click", renderResults);
  if (locked) showFeedback(first.choice, first.correct, false);
  if (focus) content.querySelector("h2").focus();
}

function renderResults() {
  reviewing = false;
  const score = [...attempts.values()].filter(({ correct }) => correct).length;
  const missedLessons = [
    ...new Set(
      finalQuestions
        .filter((question) => !attempts.get(question.id).correct)
        .map(
          (question) =>
            question.reviewLessons?.[attempts.get(question.id).choice] ||
            question.lesson,
        ),
    ),
  ];
  content.innerHTML = `<section class="panel quiz-summary"><h2 tabindex="-1">${practice ? "Practice results" : "Your results"}: ${score}/${finalQuestions.length}</h2>
    <p>Based on first answers in this attempt. This is a sample of causal reasoning, not a certification of mastery.</p>
    ${
      missedLessons.length
        ? `<h3>Suggested review</h3><ul>${missedLessons
            .map((slug) => {
              const lesson = topicLesson(slug);
              return `<li><a href="${lesson.href}" target="_blank" rel="noopener">${lesson.title} (new tab) ↗</a></li>`;
            })
            .join("")}</ul>`
        : "<p>You answered all eight correctly. Explore a new scenario and explain which assumptions make its estimate meaningful.</p>"
    }
    <h3>Your first answers</h3><div class="final-quiz-review">${finalQuestions
      .map((question, index) => {
        const answer = attempts.get(question.id);
        const label =
          answer.choice === "unsure"
            ? "I’m not sure"
            : question.choices.find(([id]) => id === answer.choice)[1];
        return `<details name="final-review"><summary>${index + 1}. ${question.title} · ${answer.correct ? "Correct" : answer.choice === "unsure" ? "Unsure" : "Review"}</summary><p><strong>Your first answer:</strong> ${label}</p>${setupMarkup(question)}<p><strong>${question.prompt}</strong></p><p><strong>Correct answer:</strong> ${question.choices.find(([id]) => id === question.answer)[1]}</p>${explanation(question, answer.choice)}<button data-practice="${index}">Practice question ${index + 1}</button></details>`;
      })
      .join("")}</div>
    <nav class="lesson-actions" aria-label="After the quiz"><button id="final-restart">Start a new practice attempt</button><a href="${learningUrl("leaving-the-sandbox")}">Back to the recap</a><a class="primary" href="?sandbox">Explore scenarios ↗</a></nav></section>`;
  content.querySelectorAll("[data-practice]").forEach((button) =>
    button.addEventListener("click", () => {
      position = Number(button.dataset.practice);
      reviewing = true;
      renderQuestion({ retry: true, focus: true });
    }),
  );
  content.querySelector("#final-restart").addEventListener("click", () => {
    attempts.clear();
    position = 0;
    practice = true;
    renderQuestion({ focus: true });
  });
  content.querySelector("h2").focus();
}

renderQuestion();
