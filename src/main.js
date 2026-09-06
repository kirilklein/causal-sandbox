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
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.textContent = `Site visits: ${count}`;
  document.body.append(footer);
}

void showSiteVisits();
