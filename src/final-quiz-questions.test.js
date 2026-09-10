import test from "node:test";
import assert from "node:assert/strict";
import { finalQuestions, recordFinalAnswer } from "./final-quiz-questions.js";
import { coreLessons } from "./lesson-catalog.js";

test("final quiz items have one key, explained alternatives, core review links, and complete graphs", () => {
  assert.equal(finalQuestions.length, 8);
  assert.equal(new Set(finalQuestions.map(({ id }) => id)).size, 8);
  for (const question of finalQuestions) {
    assert.equal(
      question.choices.filter(([id]) => id === question.answer).length,
      1,
    );
    assert.equal(
      new Set(question.choices.map(([id]) => id)).size,
      question.choices.length,
    );
    assert.ok(question.choices.length >= 3);
    assert.ok(
      question.choices.every(
        (choice) => choice.length === 3 && choice.every(Boolean),
      ),
    );
    assert.ok(coreLessons.some(([, slug]) => slug === question.lesson));
    assert.ok(
      question.sources.every(
        ([title, href]) => title && new URL(href).protocol === "https:",
      ),
    );
    for (const graph of [question.graph, ...(question.graphs || [])].filter(
      Boolean,
    )) {
      const ids = graph.nodes.map(([id]) => id);
      assert.equal(new Set(ids).size, ids.length);
      assert.ok(graph.description);
      for (const [from, to] of graph.edges)
        assert.ok(ids.includes(from) && ids.includes(to) && from !== to);
    }
  }
});

test("first answers stay immutable through wrong, correct, and unsure practice submissions", () => {
  for (const question of finalQuestions) {
    for (const choice of [...question.choices.map(([id]) => id), "unsure"]) {
      const attempts = new Map();
      assert.equal(
        recordFinalAnswer(attempts, question, choice),
        choice === question.answer,
      );
      const original = { ...attempts.get(question.id) };
      for (const retry of [...question.choices.map(([id]) => id), "unsure"]) {
        assert.equal(
          recordFinalAnswer(attempts, question, retry),
          retry === question.answer,
        );
        assert.deepEqual(attempts.get(question.id), original);
        assert.equal(attempts.size, 1);
      }
      assert.throws(
        () => recordFinalAnswer(attempts, question, "missing"),
        /Unknown answer/,
      );
      assert.deepEqual(attempts.get(question.id), original);
    }
  }
});

test("standardization example distinguishes population from treated-group averaging", () => {
  const question = finalQuestions.find(({ id }) => id === "standardization");
  const differences = question.table.rows.map(
    ([group, treated, untreated]) => ({
      share: Number(group.match(/(\d+)%/)[1]) / 100,
      effect: Number(treated) - Number(untreated),
    }),
  );
  assert.equal(
    differences.reduce((sum, { share, effect }) => sum + share * effect, 0),
    2.5,
  );
  assert.equal(
    differences.reduce((sum, { effect }) => sum + 0.5 * effect, 0),
    3,
  );
  assert.equal(
    question.choices.find(([id]) => id === question.answer)[1],
    "2.5 recovery-score points",
  );
});
