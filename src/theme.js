const root = document.documentElement;
const systemTheme = matchMedia("(prefers-color-scheme: dark)");

export function themeControl() {
  return `<label class="theme-control">Theme <select id="theme" aria-label="Color theme">${["system", "light", "dark"].map((value) => `<option value="${value}"${root.dataset.themePreference === value ? " selected" : ""}>${value[0].toUpperCase() + value.slice(1)}</option>`).join("")}</select></label>`;
}

function applyTheme() {
  const preference = root.dataset.themePreference;
  root.dataset.theme =
    preference === "system"
      ? systemTheme.matches
        ? "dark"
        : "light"
      : preference;
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
    root.dataset.themePreference = event.target.value;
    try {
      localStorage.setItem("causal-sandbox-theme", event.target.value);
    } catch (error) {
      // Theme switching still works when browser storage is unavailable or full.
      if (!["SecurityError", "QuotaExceededError"].includes(error.name))
        throw error;
    }
    applyTheme();
  });
}
