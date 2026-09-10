import assert from "node:assert/strict";
import test from "node:test";
import {
  clearProgress,
  progressStorageKey,
  readProgress,
  recordLessonCompleted,
  recordLessonStarted,
  recordPredictionAnswer,
} from "./progress.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("stores current and completed lessons without duplicates", () => {
  const storage = memoryStorage();
  recordLessonStarted("randomization", storage);
  recordLessonCompleted("randomization", storage);
  recordLessonCompleted("randomization", storage);

  assert.deepEqual(readProgress(storage), {
    version: 1,
    completedLessons: ["randomization"],
    answers: {},
    currentLesson: "randomization",
  });
});

test("retains the first prediction while updating later attempts", () => {
  const storage = memoryStorage();
  recordPredictionAnswer(
    "randomization-effect",
    "randomization",
    0,
    false,
    storage,
  );
  recordPredictionAnswer(
    "randomization-effect",
    "randomization",
    1,
    true,
    storage,
  );

  assert.deepEqual(readProgress(storage).answers["randomization-effect"], {
    lesson: "randomization",
    firstAnswerIndex: 0,
    firstCorrect: false,
    attempts: 2,
    lastAnswerIndex: 1,
    lastCorrect: true,
    eventuallyCorrect: true,
  });
});

test("ignores malformed or unsupported saved progress", () => {
  const malformed = memoryStorage({ [progressStorageKey]: "{" });
  const unsupported = memoryStorage({
    [progressStorageKey]: JSON.stringify({ version: 2 }),
  });

  assert.deepEqual(readProgress(malformed).completedLessons, []);
  assert.deepEqual(readProgress(unsupported).completedLessons, []);
});

test("clears saved progress", () => {
  const storage = memoryStorage();
  recordLessonCompleted("randomization", storage);
  assert.equal(clearProgress(storage), true);
  assert.deepEqual(readProgress(storage).completedLessons, []);
});
