import "./search.css";
import { searchTopics } from "./search-index.js";

export function searchButton() {
  return `<button type="button" class="search-open" aria-haspopup="dialog"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><span>Search</span></button>`;
}

export function setupSearch() {
  let openSearch;
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".search-open");
    if (!button) return;
    openSearch ??= createSearchDialog();
    document
      .querySelector("#lesson-menu-toggle")
      ?.setAttribute("aria-expanded", "false");
    openSearch(button);
  });
}

function createSearchDialog() {
  const dialog = document.createElement("dialog");
  dialog.className = "search-dialog";
  dialog.setAttribute("aria-labelledby", "search-title");
  dialog.innerHTML = `
    <div class="search-heading"><h2 id="search-title">Search topics</h2><button type="button" class="search-close" aria-label="Close search">Close</button></div>
    <label for="topic-search">Find a lesson or concept</label>
    <input id="topic-search" type="search" placeholder="Try AIPW, collider, or extreme weights" autocomplete="off" maxlength="200" autofocus aria-controls="search-results" />
    <p class="search-status" role="status" aria-live="polite" aria-atomic="true"></p>
    <ul id="search-results" aria-label="Search results"></ul>`;
  document.body.append(dialog);
  const input = dialog.querySelector("input");
  const results = dialog.querySelector("ul");
  const status = dialog.querySelector(".search-status");
  const close = dialog.querySelector(".search-close");
  let opener;

  function renderResults() {
    const matches = searchTopics(input.value);
    const shown = matches.slice(0, 8);
    status.textContent = !input.value.trim()
      ? "Search lessons, glossary terms, guides, and sandboxes."
      : !matches.length
        ? "No matching topics. Try a broader term, such as weights or confounding."
        : matches.length > shown.length
          ? `Showing ${shown.length} of ${matches.length} results. Refine your search for more specific matches.`
          : `${matches.length} ${matches.length === 1 ? "result" : "results"}.`;
    results.replaceChildren(
      ...shown.map((entry) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `${import.meta.env.BASE_URL}${entry.href}`;
        const title = document.createElement("strong");
        title.textContent = entry.title;
        const type = document.createElement("span");
        type.className = "search-result-type";
        type.textContent = entry.type;
        const description = document.createElement("p");
        description.textContent = entry.description;
        link.append(type, title, description);
        item.append(link);
        return item;
      }),
    );
  }

  input.addEventListener("input", renderResults);
  close.addEventListener("click", () => dialog.close());
  results.addEventListener("click", (event) => {
    if (
      event.target.closest("a") &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => opener.focus({ preventScroll: true }));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
      return;
    }
    const links = [...results.querySelectorAll("a")];
    const active = document.activeElement;
    if (
      ["ArrowDown", "ArrowUp"].includes(event.key) &&
      (active === input || links.includes(active))
    ) {
      event.preventDefault();
      const index = links.indexOf(active);
      if (event.key === "ArrowDown") (links[index + 1] || input).focus();
      else (index <= 0 ? input : links[index - 1]).focus();
    } else if (
      event.key === "Enter" &&
      active === input &&
      !event.isComposing
    ) {
      event.preventDefault();
      links[0]?.click();
    } else if (event.key === "Tab") {
      const last = links.at(-1) || input;
      if (event.shiftKey && active === close) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        close.focus();
      }
    }
  });
  return (button) => {
    opener = button;
    renderResults();
    dialog.showModal();
    input.focus();
    input.select();
  };
}
