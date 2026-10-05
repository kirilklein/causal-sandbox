import "./theme-control.css";
import { searchButton } from "./search.js";

const root = document.documentElement;
const systemTheme = matchMedia("(prefers-color-scheme: dark)");

export function themeControl() {
  return `${searchButton()}<label class="theme-control" title="Dark mode">
    <input id="theme" type="checkbox" role="switch" aria-label="Dark mode"${root.dataset.theme === "dark" ? " checked" : ""} />
    <span class="theme-track" aria-hidden="true">
      <span class="theme-thumb"></span>
      <svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
      <svg class="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/></svg>
    </span>
  </label>`;
}

function applyTheme() {
  const preference = root.dataset.themePreference;
  root.dataset.theme =
    preference === "system"
      ? systemTheme.matches
        ? "dark"
        : "light"
      : preference;
  const control = document.querySelector("#theme");
  if (control) control.checked = root.dataset.theme === "dark";
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(
    root,
  )
    .getPropertyValue("--page")
    .trim();
  window.dispatchEvent(new Event("themechange"));
}

export function setupTheme() {
  applyTheme();
  systemTheme.addEventListener("change", () => {
    if (root.dataset.themePreference === "system") applyTheme();
  });
  // Lesson navigation rebuilds the header, so handle its control here.
  document.addEventListener("change", (event) => {
    if (event.target.id !== "theme") return;
    root.dataset.themePreference = event.target.checked ? "dark" : "light";
    try {
      localStorage.setItem(
        "causal-sandbox-theme",
        root.dataset.themePreference,
      );
    } catch (error) {
      // Theme switching still works when browser storage is unavailable or full.
      if (!["SecurityError", "QuotaExceededError"].includes(error.name))
        throw error;
    }
    applyTheme();
  });
}
