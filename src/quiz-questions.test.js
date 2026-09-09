import test from "node:test";
import assert from "node:assert/strict";
import { quizQuestions, isCorrect, recordAttempt } from "./quiz-questions.js";

test("adjustment requires blocking confounding without removing the mediated effect", () => {
  const question = quizQuestions[0];
  assert.equal(isCorrect(question, []), false);
  assert.equal(isCorrect(question, ["M"]), false);
  assert.equal(isCorrect(question, ["C", "M"]), false);
  assert.equal(isCorrect(question, ["C"]), true);
});

test("practice cannot change the first-answer score or overwrite its selections", () => {
  const attempts = new Map();
  const selection = ["M"];
  assert.equal(recordAttempt(attempts, quizQuestions[0], selection), false);
  selection.push("C");
  assert.equal(recordAttempt(attempts, quizQuestions[0], ["C"]), true);
  assert.deepEqual(attempts.get("adjustment"), {
    selected: ["M"],
    correct: false,
  });
  for (const question of quizQuestions.slice(1))
    recordAttempt(attempts, question, question.correct);
  assert.equal(attempts.size, 6);
  assert.equal(
    [...attempts.values()].filter(({ correct }) => correct).length,
    5,
  );
  attempts.clear();
  assert.equal(recordAttempt(attempts, quizQuestions[0], ["C"]), true);
  assert.equal(attempts.get("adjustment").correct, true);
});
