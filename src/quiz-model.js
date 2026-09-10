import { quizQuestions, unsureChoice } from "./quiz-questions.js";

export const questionLimit = 6;
const questions = new Map(
  quizQuestions.map((question) => [question.id, question]),
);
export const questionById = (id) => questions.get(id);
export const isCorrect = ({ question, choice }) =>
  questionById(question).correct === choice;

export function nextQuestion(answers) {
  if (!answers.length) return "E";
  if (answers.length >= questionLimit) return null;
  const last = answers.at(-1);
  const correct = isCorrect(last);
  const seen = (id) => answers.some(({ question }) => question === id);
  switch (last.question) {
    case "E":
      return correct ? "G" : "F";
    case "F":
      return correct ? "B" : null;
    case "B":
      return correct ? (seen("G") ? "C" : "G") : null;
    case "G":
      if (correct) return "C";
      if (["both", "m-only"].includes(last.choice)) return "M";
      return seen("B") ? null : "B";
    case "M":
      return correct ? "C" : null;
    case "C":
      return correct ? "H" : "K";
    case "K":
      return correct ? "H" : null;
    case "H":
      return correct ? "O" : null;
    case "O":
      return correct ? "D" : "P";
    case "P":
    case "D":
      return null;
    default:
      throw new Error(`Unknown quiz question: ${last.question}`);
  }
}

// Restore only authored choices on a reachable path, including after a version change.
export function validAnswers(value) {
  if (!Array.isArray(value)) return [];
  const answers = [];
  for (const entry of value.slice(0, questionLimit)) {
    const id = nextQuestion(answers);
    if (!id || entry?.question !== id) break;
    const question = questionById(id);
    if (
      entry.choice !== unsureChoice.id &&
      !question.choices.some(({ id }) => id === entry.choice)
    )
      break;
    answers.push({ question: id, choice: entry.choice });
  }
  return answers;
}

export function answerQuestion(answers, index, choice) {
  if (!Number.isInteger(index) || index < 0 || index > answers.length)
    throw new Error("Invalid quiz position");
  const prefix = answers.slice(0, index);
  const question = nextQuestion(prefix);
  const updated = validAnswers([...prefix, { question, choice }]);
  if (updated.length !== index + 1) throw new Error("Invalid quiz answer");
  return updated;
}

const topics = {
  E: "confounding",
  F: "randomization",
  B: "confounding",
  G: "confounding",
  M: "mediator",
  C: "collider",
  K: "collider",
  H: "hidden-confounding",
  O: "overlap",
  P: "ipw",
  D: "double-robustness",
};
const reviewOrder = [
  "randomization",
  "confounding",
  "ipw",
  "mediator",
  "collider",
  "hidden-confounding",
  "overlap",
  "double-robustness",
];
const reasons = {
  randomization:
    "Start with how a treatment comparison becomes a causal comparison.",
  confounding:
    "Review how starting differences can distort a treatment comparison and how adjustment can help.",
  ipw: "Start with whose outcomes receive more weight, then examine sparse or missing comparisons.",
  mediator: "Revisit which pathways belong in the total effect.",
  collider:
    "Explore how conditioning on a shared consequence can introduce bias, including through selection.",
  "hidden-confounding":
    "See why changing estimators cannot resolve a confounding path absent from their data.",
  overlap:
    "Explore sparse comparisons and why weighting cannot create an option that never occurs.",
  "double-robustness":
    "Review which methods can still approach the target when one model is wrong.",
};

export function recommendLessons(answers) {
  if (!answers.length) return { kind: "choose", items: [], assessed: [] };
  const passed = (id) =>
    answers.some((answer) => answer.question === id && isCorrect(answer));
  const foundations =
    answers.length === 2 &&
    answers[0].question === "E" &&
    answers[1].question === "F" &&
    answers.every((answer) => !isCorrect(answer));
  const signals = new Map();
  function add(topic, answer, mixed = false) {
    if (!signals.has(topic)) signals.set(topic, []);
    signals.get(topic).push({
      question: answer.question,
      unsure: answer.choice === unsureChoice.id,
      mixed,
    });
  }
  for (const answer of answers) {
    if (isCorrect(answer)) continue;
    if (answer.question === "G") {
      if (["m-only", "neither", "unsure"].includes(answer.choice))
        add("confounding", answer, passed("B"));
      if (["both", "m-only"].includes(answer.choice))
        add("mediator", answer, passed("M"));
    } else {
      add(
        topics[answer.question],
        answer,
        (answer.question === "E" && passed("B")) ||
          (answer.question === "C" && passed("K")),
      );
    }
  }
  if (foundations) {
    signals.clear();
    answers.forEach((answer) => add("randomization", answer));
  }
  const items = [...signals].map(([topic, evidence]) => ({
    topic,
    evidence,
    reason: reasons[topic],
    status: evidence.every(({ mixed }) => mixed)
      ? "mixed"
      : evidence.every(({ unsure }) => unsure)
        ? "unsure"
        : "review",
  }));
  // Relevant prerequisite lessons come first; unasked prerequisites are never gaps.
  items.sort(
    (a, b) => reviewOrder.indexOf(a.topic) - reviewOrder.indexOf(b.topic),
  );
  const mainPath = ["E", "G", "C", "H", "O", "D"];
  const advanced =
    answers.length === mainPath.length &&
    answers.every(
      (answer, i) => answer.question === mainPath[i] && isCorrect(answer),
    );
  return {
    kind: foundations ? "foundations" : advanced ? "advanced" : "review",
    items,
    assessed: [
      ...new Set(
        answers.flatMap(({ question }) =>
          question === "G" ? ["confounding", "mediator"] : [topics[question]],
        ),
      ),
    ],
  };
}
