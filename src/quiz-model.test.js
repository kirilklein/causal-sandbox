import test from "node:test";
import assert from "node:assert/strict";
import { quizQuestions, unsureChoice } from "./quiz-questions.js";
import {
  nextQuestion,
  questionById,
  validAnswers,
  answerQuestion,
  recommendLessons,
} from "./quiz-model.js";

const a = (question, choice = questionById(question).correct) => ({
  question,
  choice,
});
const main = () => [..."EGCHOD"].map((id) => a(id));
const topics = (answers) =>
  recommendLessons(answers).items.map(({ topic }) => topic);

test("every authored path terminates in 2–6 answers without repeating a question", () => {
  const paths = [],
    seen = new Set();
  function walk(answers) {
    const id = nextQuestion(answers);
    if (!id) {
      paths.push(answers);
      return;
    }
    assert.ok(!answers.some(({ question }) => question === id));
    assert.ok(answers.length < 6);
    seen.add(id);
    for (const choice of [...questionById(id).choices, unsureChoice])
      walk([...answers, a(id, choice.id)]);
  }
  walk([]);
  assert.equal(paths.length, 287);
  assert.equal(seen.size, 11);
  let advanced = 0;
  for (const answers of paths) {
    assert.ok(answers.length >= 2 && answers.length <= 6);
    assert.deepEqual(validAnswers(answers), answers);
    const result = recommendLessons(answers);
    assert.equal(new Set(topics(answers)).size, topics(answers).length);
    if (result.kind === "foundations") {
      assert.deepEqual(
        answers.map(({ question }) => question),
        ["E", "F"],
      );
      assert.ok(
        answers.every(
          (answer) => answer.choice !== questionById(answer.question).correct,
        ),
      );
      assert.deepEqual(topics(answers), ["randomization"]);
    }
    if (result.kind === "advanced") {
      advanced++;
      assert.deepEqual(answers, main());
      assert.deepEqual(result.items, []);
    }
    for (const item of result.items) {
      assert.ok(item.evidence.length);
      assert.ok(
        item.evidence.every(({ question }) =>
          answers.some((answer) => answer.question === question),
        ),
      );
    }
  }
  assert.equal(advanced, 1);
});

test("two foundations signals are required; uncertainty has its own wording status", () => {
  assert.equal(recommendLessons([a("E", "harm")]).kind, "review");
  const result = recommendLessons([a("E", "unsure"), a("F", "unsure")]);
  assert.equal(result.kind, "foundations");
  assert.equal(result.items[0].status, "unsure");
  assert.deepEqual(topics([a("E", "harm"), a("F"), a("B", "raw")]), [
    "confounding",
  ]);
  assert.equal(nextQuestion([a("E", "harm"), a("F"), a("B")]), "G");
});

test("adjustment alternatives retain their distinct gaps and allow clarification", () => {
  assert.equal(nextQuestion([a("E"), a("G", "both")]), "M");
  assert.equal(nextQuestion([a("E"), a("G", "neither")]), "B");
  const mixed = [a("E"), a("G", "m-only"), a("M", "direct-only")];
  assert.deepEqual(topics(mixed), ["confounding", "mediator"]);
  const recovered = recommendLessons([a("E"), a("G", "m-only"), a("M")]);
  assert.equal(
    recovered.items.find(({ topic }) => topic === "confounding").status,
    "review",
  );
  assert.equal(
    recovered.items.find(({ topic }) => topic === "mediator").status,
    "mixed",
  );
  assert.deepEqual(topics([a("E"), a("G", "unsure")]), ["confounding"]);
  assert.equal(
    nextQuestion([a("E", "harm"), a("F"), a("B"), a("G", "neither")]),
    null,
  );
});

test("concrete collider recovery does not erase the harder graph-specific refresher", () => {
  const prefix = [a("E"), a("G"), a("C", "restrict")];
  assert.equal(nextQuestion(prefix), "K");
  assert.equal(nextQuestion([...prefix, a("K")]), "H");
  assert.equal(recommendLessons([...prefix, a("K")]).items[0].status, "mixed");
  assert.equal(nextQuestion([...prefix, a("K", "causal-arrow")]), null);
});

test("the final answer counts even when the six-question limit prevents a follow-up", () => {
  const overlapGap = [...main().slice(0, 4), a("O", "remove-severity")];
  assert.equal(nextQuestion(overlapGap), "P");
  assert.deepEqual(topics([...overlapGap, a("P")]), ["overlap"]);
  assert.deepEqual(topics([...overlapGap, a("P", "low-p")]), [
    "ipw",
    "overlap",
  ]);
  assert.deepEqual(topics([...overlapGap, a("P", "unsure")]), [
    "ipw",
    "overlap",
  ]);
  assert.deepEqual(topics([...main().slice(0, 5), a("D", "ipw-aipw")]), [
    "double-robustness",
  ]);
  const recovery = [a("E", "harm"), a("F"), a("B"), a("G"), a("C"), a("H")];
  assert.equal(nextQuestion(recovery), null);
  assert.equal(recommendLessons(recovery).kind, "review");
  assert.ok(!recommendLessons(recovery).assessed.includes("overlap"));
});

test("editing an answer discards the superseded path", () => {
  const changed = answerQuestion(main(), 0, "unsure");
  assert.deepEqual(changed, [a("E", "unsure")]);
  assert.equal(nextQuestion(changed), "F");
  assert.deepEqual(topics(changed), ["confounding"]);
  assert.deepEqual(answerQuestion(main(), 2, "adjust"), [
    ...main().slice(0, 2),
    a("C", "adjust"),
  ]);
  assert.throws(
    () => answerQuestion(main(), 6, "unsure"),
    /Invalid quiz answer/,
  );
  assert.throws(() => answerQuestion([], -1, "harm"), /Invalid quiz position/);
});

test("untrusted saved progress cannot introduce options, questions, or impossible branches", () => {
  for (const value of [null, {}, "text", 1])
    assert.deepEqual(validAnswers(value), []);
  assert.deepEqual(validAnswers([a("D")]), []);
  assert.deepEqual(validAnswers([a("E"), a("F")]), [a("E")]);
  assert.deepEqual(validAnswers([a("E", "<script>"), a("G")]), []);
  assert.deepEqual(validAnswers([...main(), a("P")]), main());
  assert.equal(recommendLessons([]).kind, "choose");
});

test("each question has a single valid key, meaningful attribution, and valid graph edges", () => {
  for (const question of quizQuestions) {
    assert.equal(
      question.choices.filter(({ id }) => id === question.correct).length,
      1,
    );
    assert.equal(
      new Set(question.choices.map(({ id }) => id)).size,
      question.choices.length,
    );
    assert.ok(
      question.sources.length && question.provenance && question.explanation,
    );
    for (const source of question.sources) {
      assert.equal(new URL(source.url).protocol, "https:");
      assert.ok(source.citation && source.section);
    }
    if (question.graph)
      for (const edge of question.graph.edges) {
        assert.ok(
          edge.every((id) =>
            question.graph.nodes.some(([node]) => node === id),
          ),
        );
        assert.notEqual(edge[0], edge[1]);
      }
  }
});

test("the combined adjustment item assesses both confounding and mediation", () => {
  const result = recommendLessons([a("E"), a("G")]);
  assert.deepEqual(result.assessed, ["confounding", "mediator"]);
  assert.deepEqual(result.items, []);
  assert.ok(!result.assessed.includes("collider"));
});
