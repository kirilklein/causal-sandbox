import { quizQuestions, unsureChoice } from "./quiz-questions.js";
import {
  questionById,
  questionLimit,
  nextQuestion,
  validAnswers,
  answerQuestion,
  isCorrect,
  recommendLessons,
} from "./quiz-model.js";
import {
  learningFrame,
  learningUrl,
  topicLesson,
  backgroundLinks,
} from "./learning.js";

const storageKey = "causal-sandbox-entry-quiz-v2";
let storageAvailable = true;
let seenExplanations = false;

function storageError(error) {
  if (
    !(error instanceof DOMException) ||
    !["SecurityError", "QuotaExceededError"].includes(error.name)
  )
    throw error;
  storageAvailable = false;
  console.warn(
    "Quiz progress is available in this page only: browser storage is unavailable.",
  );
}

function freshState() {
  return {
    answers: [],
    index: 0,
    screen: "question",
    rotation: Math.floor(Math.random() * 12),
    practice: false,
  };
}

function restore(value) {
  const answers = validAnswers(value?.answers);
  const index =
    Number.isInteger(value?.index) && value.index >= 0
      ? Math.min(value.index, answers.length)
      : answers.length;
  return {
    answers,
    index,
    screen:
      value?.screen === "results" || !nextQuestion(answers.slice(0, index))
        ? "results"
        : "question",
    rotation:
      Number.isInteger(value?.rotation) &&
      value.rotation >= 0 &&
      value.rotation < 12
        ? value.rotation
        : 0,
    practice: value?.practice === true,
  };
}

function load() {
  let raw;
  try {
    raw = sessionStorage.getItem(storageKey);
  } catch (error) {
    storageError(error);
  }
  if (!raw) return freshState();
  try {
    const value = JSON.parse(raw);
    seenExplanations = value?.seenExplanations === true;
    return restore(value);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return freshState();
  }
}

let state = load();

function save() {
  if (!storageAvailable) return;
  try {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ ...state, seenExplanations }),
    );
  } catch (error) {
    storageError(error);
  }
}

function show(push = true) {
  save();
  history[push ? "pushState" : "replaceState"]({ quiz: state }, "");
  render();
  document
    .querySelector(state.screen === "results" ? "h1" : "#quiz-question")
    .focus();
}

window.addEventListener("popstate", (event) => {
  if (!event.state?.quiz) {
    location.reload();
    return;
  }
  state = restore(event.state.quiz);
  save();
  render();
  document
    .querySelector(state.screen === "results" ? "h1" : "#quiz-question")
    .focus();
});

function graphMarkup(question) {
  if (!question.graph) return "";
  const { nodes, edges, description } = question.graph;
  return `<figure class="quiz-figure"><svg viewBox="0 0 500 290" role="img" aria-label="${description}" focusable="false"><defs><marker id="quiz-arrow-${question.id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 9 5 1 9"/></marker></defs>
    ${edges
      .map(([from, to]) => {
        const [, x1, y1] = nodes.find(([id]) => id === from);
        const [, x2, y2] = nodes.find(([id]) => id === to);
        const dx = x2 - x1,
          dy = y2 - y1,
          length = Math.hypot(dx, dy);
        return `<path d="M${x1 + (dx * 28) / length} ${y1 + (dy * 28) / length} L${x2 - (dx * 32) / length} ${y2 - (dy * 32) / length}" marker-end="url(#quiz-arrow-${question.id})"/>`;
      })
      .join("")}
    ${nodes.map(([id, x, y]) => `<circle cx="${x}" cy="${y}" r="27" fill="var(--node-${id}, var(--node-C))"/><text x="${x}" y="${y}">${id}</text>`).join("")}</svg></figure>`;
}

function choiceMarkup(question, selected, name = "answer") {
  const offset =
    (state.rotation + quizQuestions.indexOf(question)) %
    question.choices.length;
  const ordered = [
    ...question.choices.slice(offset),
    ...question.choices.slice(0, offset),
    unsureChoice,
  ];
  return ordered
    .map(
      ({ id, text }) =>
        `<label class="quiz-choice"><input type="radio" name="${name}" value="${id}" ${id === selected ? "checked" : ""} required><span>${text}</span></label>`,
    )
    .join("");
}

function questionSetup(question) {
  const facts = question.facts
    ? `<dl class="quiz-facts">${question.facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`
    : "";
  return `${question.context.map((paragraph) => `<p>${paragraph}</p>`).join("")}
    <div class="${question.graph && facts ? "quiz-diagram" : ""}">${graphMarkup(question)}${facts}</div>
    ${question.assumptions ? `<details class="quiz-assumptions"><summary>Assumptions</summary><p>${question.assumptions}</p></details>` : ""}`;
}

function renderQuestion() {
  const question = questionById(
    nextQuestion(state.answers.slice(0, state.index)),
  );
  const selected = state.answers[state.index]?.choice;
  learningFrame(
    "Find my starting point",
    "quiz",
    `${state.index === 0 ? `<p class="learning-lead">Up to six questions, adapting to your answers. Feedback at the end.</p><p class="quiz-skip">Know where you want to go? <a href="${learningUrl("topics")}">Browse topics</a> or <a href="${import.meta.env.BASE_URL}?sandbox">open the sandbox</a>.</p>` : ""}
    ${state.practice ? '<p class="learning-note">Practice attempt: you’ve already seen the explanations.</p>' : ""}
    <p class="quiz-progress">${state.index + 1}/${questionLimit}</p>
    <section class="panel quiz-card" data-question="${question.id}"><h2 id="quiz-question" tabindex="-1">${question.title}</h2>
      ${questionSetup(question)}
      <form id="quiz-form"><fieldset class="quiz-choices"><legend>${question.prompt}</legend>${choiceMarkup(question, selected)}</fieldset>
      <button id="quiz-submit" class="primary" ${selected ? "" : "disabled"}>Continue →</button></form>
    </section><nav class="quiz-actions" aria-label="Quiz navigation">${state.index ? '<button id="quiz-back">← Previous question</button>' : `<a href="${learningUrl("learn")}">← Learning choices</a>`}<button id="quiz-finish">Show suggestions now</button></nav>`,
  );
  const form = document.querySelector("#quiz-form");
  form.addEventListener("change", () => {
    document.querySelector("#quiz-submit").disabled = false;
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const chosen = form.querySelector("input:checked");
    if (!chosen) return;
    const answers = answerQuestion(state.answers, state.index, chosen.value);
    // Keep the submitted selection when browser Back revisits this question.
    history.replaceState({ quiz: { ...state, answers } }, "");
    state = {
      ...state,
      answers,
      index: answers.length,
      screen: nextQuestion(answers) ? "question" : "results",
      practice: state.practice || seenExplanations,
    };
    show();
  });
  document.querySelector("#quiz-back")?.addEventListener("click", () => {
    state = { ...state, index: state.index - 1 };
    show();
  });
  document.querySelector("#quiz-finish").addEventListener("click", () => {
    // An unsubmitted selection is not an answer. Going back and exiting drops its later branch.
    state = {
      ...state,
      answers: state.answers.slice(0, state.index),
      screen: "results",
    };
    show();
  });
}

function answerStatus(answer) {
  return answer.choice === unsureChoice.id
    ? "Unsure"
    : isCorrect(answer)
      ? "Correct"
      : "Review";
}

function scoreSummary(answers) {
  if (!answers.length) return "";
  const correct = answers.filter(isCorrect).length;
  const unsure = answers.filter(
    ({ choice }) => choice === unsureChoice.id,
  ).length;
  const review = answers.length - correct - unsure;
  return `<section class="panel quiz-summary" aria-label="Answer summary">
    <div class="quiz-summary-heading"><p class="quiz-score"><strong>${correct}<span>/${answers.length}</span></strong> correct</p>
      <div><p class="eyebrow">${state.practice ? "PRACTICE RESULTS" : "YOUR RESULTS"}</p><p class="quiz-score-counts">${review} to review · ${unsure} unsure</p><p class="quiz-score-hint">Select a question to see why.</p></div></div>
    <ol class="quiz-score-items">${answers
      .map((answer, index) => {
        const status = answerStatus(answer);
        const symbol = isCorrect(answer) ? "✓" : "×";
        return `<li><button type="button" id="quiz-toggle-${answer.question}" data-review="${answer.question}" data-status="${status.toLowerCase()}" aria-expanded="false" aria-controls="quiz-review-${answer.question}" aria-label="Question ${index + 1}: ${questionById(answer.question).title}. ${status}."><span class="quiz-score-number">${index + 1}</span><span class="quiz-score-symbol" aria-hidden="true">${symbol}</span></button></li>`;
      })
      .join("")}</ol>
    ${answers.map(reviewMarkup).join("")}
  </section>`;
}

function reviewMarkup(answer, index) {
  const question = questionById(answer.question);
  const selected =
    answer.choice === unsureChoice.id
      ? unsureChoice.text
      : question.choices.find(({ id }) => id === answer.choice).text;
  const correct = question.choices.find(
    ({ id }) => id === question.correct,
  ).text;
  return `<article class="quiz-answer-review" id="quiz-review-${question.id}" tabindex="-1" aria-labelledby="quiz-review-title-${question.id}" hidden><div class="quiz-review-heading"><h3 id="quiz-review-title-${question.id}">Question ${index + 1} · ${question.title}</h3><button type="button" data-close-review="${question.id}" aria-label="Close explanation for question ${index + 1}">Close</button></div>
    <p class="quiz-evidence">${answerStatus(answer)}</p>
    <p><strong>Your answer:</strong> ${selected}</p>${isCorrect(answer) ? "" : `<p><strong>Best answer:</strong> ${correct}</p>`}<p>${question.explanation}</p>
    <details class="quiz-source"><summary>Sources and question attribution</summary><p>${question.provenance}</p><ul>${question.sources.map(({ citation, url, section }) => `<li><a href="${url}" target="_blank" rel="noopener">${citation}</a> — ${section}.</li>`).join("")}</ul></details>
    <details><summary>Try this question again for practice</summary><p>This practice answer won’t change your suggested lessons.</p>
      ${questionSetup(question)}
      <form class="quiz-practice" data-question="${question.id}"><fieldset class="quiz-choices"><legend>${question.prompt}</legend>${choiceMarkup(question, null, `practice-${question.id}`)}</fieldset><button>Check practice answer</button><p class="quiz-practice-feedback" role="status" hidden></p></form></details>
  </article>`;
}

function suggestionMarkup(item, index) {
  const lesson = topicLesson(item.topic);
  const qualifier =
    item.status === "mixed"
      ? "Your answers were mixed; a brief refresher may help."
      : item.status === "unsure"
        ? "You marked this idea as uncertain."
        : "Based on the reasoning in your answers.";
  return `<article class="panel quiz-suggestion" data-topic="${item.topic}"><p class="eyebrow">${index ? "ALSO USEFUL" : item.status === "mixed" ? "BRIEF REFRESHER" : "START HERE"}</p><h3><a href="${lesson.href}">${lesson.title} →</a></h3><p>${item.reason}</p><p class="quiz-evidence">${qualifier} <a href="#quiz-review-${item.evidence[0].question}" data-review="${item.evidence[0].question}">Why this suggestion?</a></p>${backgroundLinks(item.topic)}</article>`;
}

function renderResults() {
  const result = recommendLessons(state.answers);
  const title =
    result.kind === "foundations"
      ? "Start with the foundations"
      : result.kind === "advanced"
        ? "Looks like we have an expert here."
        : result.kind === "choose"
          ? "Choose where to begin"
          : "Your suggested lessons";
  const introduction =
    result.kind === "foundations"
      ? "Begin with a randomized experiment, then follow the guided lessons at your own pace."
      : result.kind === "advanced"
        ? `You can <a href="${learningUrl("topics")}">explore deeper topics</a> or go directly to the <a href="${import.meta.env.BASE_URL}?sandbox">causal sandbox</a>.`
        : !result.items.length
          ? "No review topic emerged from the answers so far. You can browse topics or start with the guided lessons."
          : "These lessons may be useful based on your answers. You can choose any other route.";
  learningFrame(
    title,
    "quiz",
    `<p class="learning-lead">${result.kind === "choose" ? "Start with the basics, browse topics, or return to the quiz." : introduction}</p>
    ${state.practice ? '<p class="learning-note">Practice attempt.</p>' : ""}
    ${scoreSummary(state.answers)}
    <div class="quiz-suggestions">${result.items.slice(0, 3).map(suggestionMarkup).join("")}</div>
    ${
      result.items.length > 3
        ? `<details><summary>See all suggested topics</summary>${result.items
            .slice(3)
            .map((item, i) => suggestionMarkup(item, i + 3))
            .join("")}</details>`
        : ""
    }
    <nav class="learning-actions" aria-label="Choose your next step">${result.kind === "advanced" ? "" : `<a class="${result.items.length ? "" : "primary"}" href="${learningUrl("topics")}">Browse all topics →</a>`}<a href="${topicLesson("randomization").href}">Start from scratch</a><a href="${learningUrl("learn")}">Learning choices</a>${nextQuestion(state.answers) ? '<button id="quiz-resume">Continue the quiz</button>' : ""}<button id="quiz-restart">${seenExplanations ? "Start a new practice attempt" : "Start a new attempt"}</button></nav>
    ${state.answers.length ? `<p class="learning-note">Based on ${state.answers.length} answered questions. Topics we didn’t ask about weren’t assessed.</p>` : ""}`,
  );
  function setReview(id, open) {
    document.querySelectorAll(".quiz-answer-review").forEach((panel) => {
      panel.hidden = !open || panel.id !== `quiz-review-${id}`;
    });
    document.querySelectorAll(".quiz-score-items button").forEach((button) => {
      button.setAttribute(
        "aria-expanded",
        String(open && button.dataset.review === id),
      );
    });
    if (open) {
      seenExplanations = true;
      document.querySelector("#quiz-restart").textContent =
        "Start a new practice attempt";
      save();
    }
    document
      .querySelector(open ? `#quiz-review-${id}` : `#quiz-toggle-${id}`)
      .focus();
  }
  document.querySelectorAll("[data-review]").forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setReview(
        link.dataset.review,
        link.getAttribute("aria-expanded") !== "true",
      );
    }),
  );
  document
    .querySelectorAll("[data-close-review]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        setReview(button.dataset.closeReview, false),
      ),
    );
  document.querySelectorAll(".quiz-practice").forEach((form) =>
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const selected = form.querySelector("input:checked");
      if (!selected) return;
      const question = questionById(form.dataset.question);
      const feedback = form.querySelector("[role=status]");
      feedback.hidden = false;
      feedback.textContent = `${selected.value === question.correct ? "That’s right. " : "Review the reasoning: "}${question.explanation}`;
    }),
  );
  document.querySelector("#quiz-resume")?.addEventListener("click", () => {
    state = {
      ...state,
      screen: "question",
      index: state.answers.length,
      practice: state.practice || seenExplanations,
    };
    show();
  });
  document.querySelector("#quiz-restart").addEventListener("click", () => {
    state = { ...freshState(), practice: seenExplanations };
    show();
  });
}

function render() {
  if (state.screen === "results") renderResults();
  else renderQuestion();
}

history.replaceState({ quiz: state }, "");
render();
