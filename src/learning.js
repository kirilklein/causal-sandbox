import {
  coreLessons,
  optionalChapters,
  lessonHref,
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { themeControl } from "./theme.js";
import icon from "./brand.svg?raw";
import "./lessons.css";
import "./learning.css";

export const learningUrl = (topic) =>
  `${import.meta.env.BASE_URL}?lesson=${topic}`;

export function topicLesson(slug) {
  const core = coreLessons.find(([, topic]) => topic === slug);
  if (core)
    return {
      title: core[2],
      href: `${import.meta.env.BASE_URL}${lessonHref(core)}`,
    };
  const chapter = optionalChapters.find(({ id }) => id === slug);
  if (!chapter) throw new Error(`Unknown learning topic: ${slug}`);
  return {
    title: chapter.title,
    href: `${import.meta.env.BASE_URL}${chapter.href}`,
  };
}

export function learningFrame(title, current, body) {
  document.title = `${title} — Causal Sandbox`;
  document.querySelector("#app").innerHTML =
    `<header class="lesson-header"><a class="brand" href="${learningUrl("introduction")}">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
    <main class="learning learning-entry">${lessonNavigation({ learningPage: current })}
    <p class="eyebrow">YOUR LEARNING PATH</p><h1 tabindex="-1">${title}</h1>${body}</main>`;
  setupLessonNavigation();
}

const background = {
  "propensity-score": ["confounding", "ipw"],
  "outcome-regression": ["confounding"],
  mediator: ["confounding", "outcome-regression"],
  collider: ["confounding"],
  "hidden-confounding": ["confounding", "outcome-regression"],
  timing: ["mediator", "collider", "hidden-confounding"],
  instrument: [
    "ipw",
    "outcome-regression",
    "hidden-confounding",
    "double-robustness",
  ],
  "arrow-strength": ["mediator", "instrument"],
  "time-varying-confounding": ["ipw", "outcome-regression", "mediator"],
  misspecification: ["ipw", "outcome-regression"],
  "double-robustness": [
    "ipw",
    "outcome-regression",
    "misspecification",
    "hidden-confounding",
  ],
  tmle: ["outcome-regression", "propensity-score", "double-robustness"],
  overlap: ["ipw", "propensity-score"],
  clipping: ["ipw", "overlap"],
  trimming: ["ipw", "overlap", "clipping"],
};

export function backgroundLinks(topic) {
  if (!background[topic]) return "";
  return `<details class="learning-background"><summary>Helpful background</summary><ul>${background[
    topic
  ]
    .map((slug) => {
      const lesson = topicLesson(slug);
      return `<li><a href="${lesson.href}">${lesson.title}</a></li>`;
    })
    .join("")}</ul></details>`;
}

const groups = [
  {
    title: "What should I adjust for?",
    summary: "Common causes, causal pathways, and harmful adjustment.",
    refreshers: ["confounding", "mediator", "collider"],
    advanced: [
      "timing",
      "instrument",
      "arrow-strength",
      "time-varying-confounding",
    ],
  },
  {
    title: "What can these methods establish?",
    summary: "How adjustment works, what it assumes, and where it fails.",
    refreshers: [
      "ipw",
      "propensity-score",
      "outcome-regression",
      "hidden-confounding",
      "assumptions",
    ],
    advanced: [
      "misspecification",
      "double-robustness",
      "tmle",
      "leaving-the-sandbox",
    ],
  },
  {
    title: "What if the groups barely overlap?",
    summary:
      "Sparse comparisons, extreme weights, and changing the target population.",
    refreshers: ["ipw", "overlap"],
    advanced: ["clipping", "trimming"],
  },
];

function topicList(slugs) {
  return `<ul class="learning-topic-list">${slugs
    .map((slug) => {
      const lesson = topicLesson(slug);
      return `<li><a href="${lesson.href}">${lesson.title} <span aria-hidden="true">→</span></a>${backgroundLinks(slug)}</li>`;
    })
    .join("")}</ul>`;
}

export function renderLearning(mode) {
  if (mode === "topics") {
    learningFrame(
      "Refresh & go deeper",
      "topics",
      `<p class="learning-lead">Choose the question you want to explore. Open a topic to find refreshers and advanced lessons.</p>
      <div class="learning-topics">${groups
        .map(
          (
            group,
          ) => `<details class="panel learning-topic-group"><summary><span>${group.title}<small>${group.summary}</small></span></summary>
        <div class="learning-topic-columns"><section><h2>Refreshers</h2>${topicList(group.refreshers)}</section><section><h2>Advanced lessons</h2>${topicList(group.advanced)}</section></div></details>`,
        )
        .join("")}</div>
      <nav class="learning-actions" aria-label="Learning choices"><a href="${learningUrl("learn")}">← Learning choices</a><a href="${learningUrl("quiz")}">Find my starting point</a></nav>`,
    );
  } else {
    learningFrame(
      "Where would you like to begin?",
      "learn",
      `<p class="learning-lead">Start with the basics, revisit a topic, or let a few questions suggest a starting point.</p>
      <nav class="learning-choices" aria-label="Choose how to learn">
        <a class="panel learning-choice" href="${topicLesson("randomization").href}"><span class="learning-choice-number" aria-hidden="true">01</span><h2>Start from scratch</h2><p>Build your intuition through the guided lessons, starting with a randomized experiment.</p><span class="learning-choice-action">Begin lesson 1 →</span></a>
        <a class="panel learning-choice" href="${learningUrl("topics")}"><span class="learning-choice-number" aria-hidden="true">02</span><h2>Refresh & go deeper</h2><p>Pick a topic to revisit, then explore its nuances and advanced lessons.</p><span class="learning-choice-action">Browse topics →</span></a>
        <a class="panel learning-choice" href="${learningUrl("quiz")}"><span class="learning-choice-number" aria-hidden="true">03</span><h2>Find my starting point</h2><p>Answer up to six questions for suggestions based on the ideas you want to review.</p><span class="learning-choice-action">Take the short quiz →</span></a>
      </nav><p class="learning-note">Every lesson is open to you. You can choose a different route at any time.</p>
      <a href="${learningUrl("introduction")}">← Introduction</a>`,
    );
  }
}
