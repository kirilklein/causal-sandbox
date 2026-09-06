import "./style.css";
import { setupTheme } from "./theme.js";

setupTheme();

const params = new URLSearchParams(location.search);
if (params.has("sandbox")) {
  await import("./sandbox.js");
} else if (
  ["instrument", "instrument-hidden-confounding"].includes(params.get("lesson"))
) {
  await import("./instrument-lesson.js");
} else if (params.get("lesson") === "clipping") {
  await import("./clipping-lesson.js");
} else if (params.get("lesson") === "trimming") {
  await import("./trimming-lesson.js");
} else if (params.get("lesson") === "timing") {
  await import("./timing-lesson.js");
} else {
  await import("./lessons.js");
}

const references = [
  [
    "Randomization and outcome regression",
    "Hernán & Robins (2020), Causal Inference: What If",
    "https://miguelhernan.org/whatifbook",
  ],
  [
    "Causal diagrams and confounding",
    "Greenland, Pearl & Robins (1999)",
    "https://pubmed.ncbi.nlm.nih.gov/9888278/",
  ],
  [
    "Propensity scores",
    "Rosenbaum & Rubin (1983)",
    "https://academic.oup.com/biomet/article-abstract/70/1/41/240879",
  ],
  [
    "IPW and clipping",
    "Cole & Hernán (2008)",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC2732954/",
  ],
  [
    "AIPW and double robustness",
    "Bang & Robins (2005)",
    "https://pubmed.ncbi.nlm.nih.gov/16401269/",
  ],
  [
    "Mediation and total effects",
    "VanderWeele (2016)",
    "https://pubmed.ncbi.nlm.nih.gov/26653405/",
  ],
  [
    "Collider bias",
    "Cole et al. (2010)",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC2846442/",
  ],
  [
    "Positivity, overlap, and trimming",
    "Petersen et al. (2012)",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC4107929/",
  ],
  [
    "TMLE",
    "van der Laan & Rubin (2006)",
    "https://doi.org/10.2202/1557-4679.1043",
  ],
  [
    "Instrumental variables",
    "Hernán & Robins (2006)",
    "https://pubmed.ncbi.nlm.nih.gov/16755261/",
  ],
];

const footer = document.createElement("footer");
footer.className = "site-footer";
footer.innerHTML = `
  <div class="site-footer-links">
    <span class="site-author">Created by Kiril Klein, PhD</span>
    <a href="https://github.com/kirilklein/causal-sandbox">GitHub source</a>
    <a href="https://github.com/kirilklein/causal-sandbox#the-causal-world">Methodology notes</a>
    <span id="site-visits" hidden></span>
  </div>
  <details class="site-references">
    <summary>References</summary>
    <ul>${references
      .map(
        ([concept, citation, url]) =>
          `<li><span>${concept}</span><a href="${url}">${citation}</a></li>`,
      )
      .join("")}</ul>
  </details>`;
document.body.append(footer);

async function showSiteVisits() {
  const tracking = document.querySelector("script[data-goatcounter]");
  const url = new URL("/counter/TOTAL.json", tracking.dataset.goatcounter);
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    console.warn("Site visits unavailable:", error);
    return;
  }
  if (!response.ok) {
    console.warn("Site visits unavailable:", response.status);
    return;
  }
  const { count } = await response.json();
  if (typeof count !== "string") {
    throw new TypeError("GoatCounter returned an invalid visit count");
  }
  const visits = document.querySelector("#site-visits");
  visits.textContent = `Site visits: ${count}`;
  visits.hidden = false;
}

void showSiteVisits();
