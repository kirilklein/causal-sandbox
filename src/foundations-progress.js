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
    localStorage.setItem(
      key,
      JSON.stringify({ ...readPilot(), ...changes, version: 1 }),
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
  if (saved.current === "adjustment") return "?lesson=mediator";
  if (saved.current === "pilot") return pilotUrl;
  return openingUrl;
}
