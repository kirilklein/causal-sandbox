export const progressStorageKey = "causal-sandbox-progress";
const version = 1;

const emptyProgress = () => ({
  version,
  completedLessons: [],
  answers: {},
  currentLesson: null,
});

function browserStorage(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage;
  } catch (error) {
    if (error?.name === "SecurityError") return null;
    throw error;
  }
}

function unavailableStorage(error) {
  return ["SecurityError", "QuotaExceededError"].includes(error?.name);
}

function normalizeProgress(value) {
  if (!value || value.version !== version) return emptyProgress();
  const completedLessons = Array.isArray(value.completedLessons)
    ? [
        ...new Set(
          value.completedLessons.filter((slug) => typeof slug === "string"),
        ),
      ]
    : [];
  const answers =
    value.answers &&
    typeof value.answers === "object" &&
    !Array.isArray(value.answers)
      ? value.answers
      : {};
  return {
    version,
    completedLessons,
    answers,
    currentLesson:
      typeof value.currentLesson === "string" ? value.currentLesson : null,
  };
}

export function readProgress(storage) {
  const target = browserStorage(storage);
  if (!target) return emptyProgress();
  try {
    const saved = target.getItem(progressStorageKey);
    return saved ? normalizeProgress(JSON.parse(saved)) : emptyProgress();
  } catch (error) {
    if (error instanceof SyntaxError || unavailableStorage(error))
      return emptyProgress();
    throw error;
  }
}

function updateProgress(change, storage) {
  const target = browserStorage(storage);
  if (!target) return false;
  const progress = change(readProgress(target));
  try {
    target.setItem(progressStorageKey, JSON.stringify(progress));
    return true;
  } catch (error) {
    if (unavailableStorage(error)) return false;
    throw error;
  }
}

export function recordLessonStarted(slug, storage) {
  return updateProgress(
    (progress) => ({ ...progress, currentLesson: slug }),
    storage,
  );
}

export function recordLessonCompleted(slug, storage) {
  return updateProgress(
    (progress) => ({
      ...progress,
      completedLessons: [...new Set([...progress.completedLessons, slug])],
    }),
    storage,
  );
}

export function recordPredictionAnswer(
  questionId,
  lesson,
  answerIndex,
  correct,
  storage,
) {
  return updateProgress((progress) => {
    const previous = progress.answers[questionId];
    return {
      ...progress,
      answers: {
        ...progress.answers,
        [questionId]: {
          lesson,
          firstAnswerIndex: previous?.firstAnswerIndex ?? answerIndex,
          firstCorrect: previous?.firstCorrect ?? correct,
          attempts: (previous?.attempts ?? 0) + 1,
          lastAnswerIndex: answerIndex,
          lastCorrect: correct,
          eventuallyCorrect: Boolean(previous?.eventuallyCorrect || correct),
        },
      },
    };
  }, storage);
}

export function clearProgress(storage) {
  const target = browserStorage(storage);
  if (!target) return false;
  try {
    target.removeItem(progressStorageKey);
    return true;
  } catch (error) {
    if (unavailableStorage(error)) return false;
    throw error;
  }
}
