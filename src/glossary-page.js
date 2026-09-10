import { coreAssumptionKeys, glossary } from "./glossary.js";

const terms = Object.entries(glossary).sort(([, a], [, b]) =>
  a.title.localeCompare(b.title),
);

document.querySelector("#glossary-contents-list").innerHTML = terms
  .map(([key, term]) => `<a href="glossary/#${key}">${term.title}</a>`)
  .join("");

document.querySelector("#glossary-assumptions-list").innerHTML =
  coreAssumptionKeys
    .map(
      (key) =>
        `<a href="glossary/#${key}"><span>${glossary[key].title}</span><p>${glossary[key].formal}</p></a>`,
    )
    .join("");

document.querySelector("#glossary-entries").innerHTML = terms
  .map(
    ([key, term], index) => `
      <section id="${key}" class="glossary-entry">
        <p class="section-number">${String(index + 1).padStart(2, "0")} · TERM</p>
        <h2>${term.title}</h2>
        ${term.aliases?.length ? `<p class="glossary-aliases"><span>Related names</span>${term.aliases.join(" · ")}</p>` : ""}
        <p class="glossary-summary">${term.summary}</p>
        <div class="glossary-detail">${term.detail.map((paragraph) => `<p>${paragraph}</p>`).join("")}</div>
        ${term.sources?.length ? `<p class="glossary-sources"><span>${term.sources.length === 1 ? "Reference" : "References"}</span>${term.sources.map((source) => `<a href="${source.href}">${source.label}</a>`).join(" · ")}</p>` : ""}
        <a class="glossary-related" href="${term.related.href}">${term.related.label} →</a>
        <a class="glossary-back" href="glossary/#glossary-title">Back to terms ↑</a>
      </section>`,
  )
  .join("");

// Entries are rendered after the browser first tries to follow the fragment.
document.getElementById(location.hash.slice(1))?.scrollIntoView();
