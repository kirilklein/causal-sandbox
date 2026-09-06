import { glossary } from "./glossary.js";

const terms = Object.entries(glossary).sort(([, a], [, b]) =>
  a.title.localeCompare(b.title),
);

document.querySelector("#glossary-contents-list").innerHTML = terms
  .map(([key, term]) => `<a href="#${key}">${term.title}</a>`)
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
        <a class="glossary-related" href="${term.related.href}">${term.related.label} →</a>
        <a class="glossary-back" href="#glossary-title">Back to terms ↑</a>
      </section>`,
  )
  .join("");
