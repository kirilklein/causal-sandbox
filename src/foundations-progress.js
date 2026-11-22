import { modules, moduleById } from "./foundations-catalog.js";
export const pilotUrl = "?lesson=observed-difference";
export const openingUrl = "?lesson=what-if&course=foundations";
const key = "causal-sandbox-foundations-v1";

export function readPilot() {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value?.version === 1 ? value : {};
  } catch {
    return {};
  }
}

export function savePilot(changes) {
  try {
    const previous = readPilot();
    localStorage.setItem(
      key,
      JSON.stringify({
        ...previous,
        completedModules: completedModules(previous),
        ...changes,
        version: 1,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearPilot() {
  try {
    localStorage.removeItem(key);
  } catch {
    /* Storage may be disabled. */
  }
}

export function pilotDestination(saved) {
  const active = moduleById[saved.current];
  if (!active) return openingUrl;
  const atEnd =
    active.id === "pilot"
      ? saved.stage === "done"
      : saved.activities?.[active.id]?.step === "summary";
  if (atEnd && active.id !== "capstone")
    return modules[modules.indexOf(active) + 1].href;
  return active.href;
}

export function completedModules(saved = readPilot()) {
  const ids = Array.isArray(saved.completedModules)
    ? saved.completedModules
    : [];
  return [
    ...new Set([...ids, ...(saved.stage === "done" ? ["pilot"] : [])]),
  ].filter((id) => Object.hasOwn(moduleById, id));
}
export function completeModule(id) {
  return savePilot({
    completedModules: [...new Set([...completedModules(), id])],
  });
}
export function saveActivity(module, changes) {
  const { activities = {} } = readPilot();
  return savePilot({
    current: module,
    activities: {
      ...activities,
      [module]: { ...activities[module], ...changes },
    },
  });
}
