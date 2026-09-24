import { mapRegions } from "./concept-map-data.js";
import { mapIllustration } from "./concept-map-art.js";
import { topicLesson, learningUrl } from "./learning.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { themeControl } from "./theme.js";
import icon from "./brand.svg?raw";
import "./concept-map.css";

document.title = "How the pieces fit together — Causal Sandbox";
document.querySelector("#app").innerHTML = `
  <header class="lesson-header map-header"><a class="brand" href="${learningUrl("introduction")}">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main class="learning concept-map">
    ${lessonNavigation({ learningPage: "concept-map" })}
    <header class="map-intro">
      <p class="map-kicker">The causal inference atlas</p>
      <h1>How the pieces<br> <em>fit together.</em></h1>
      <p>What would change if we intervened?<br>Four questions connect the ideas you’ll explore.</p>
      <a class="map-start" href="${topicLesson("what-if").href}">Start the journey <span aria-hidden="true">↗</span></a>
    </header>
    <section class="map-landscape" aria-label="Four connected questions">
      <div class="map-landscape-heading"><span class="map-kicker">Explore a region</span><span>Select a question to unfold its concepts</span></div>
      <svg class="map-route" viewBox="0 0 1000 690" preserveAspectRatio="none" aria-hidden="true"><path class="map-route-halo" d="M200 177H720Q975 177 975 352T720 527H200"/><path d="M200 177H720Q975 177 975 352T720 527H200"/></svg>
      <div class="map-route-wide" aria-hidden="true"></div>
      <div class="map-regions">${mapRegions
        .map(
          (region, i) => `
        <button type="button" class="map-region" data-region="${region.id}" aria-expanded="false" aria-controls="map-detail">
          <span class="map-region-heading"><span class="map-number">0${i + 1}</span><span class="map-region-name">${region.name}</span><span class="map-region-open" aria-hidden="true">↗</span></span>
          ${mapIllustration(region.id)}
          <span class="map-region-question">${region.question}</span>
          <span class="map-region-summary">${region.summary}</span>
          <span class="map-region-terms">${region.terms}</span>
        </button>`,
        )
        .join("")}</div>
      <div class="map-legend"><span><i aria-hidden="true"></i> A route through the reasoning</span><span>Conceptual connections, not causal arrows between regions.</span></div>
    </section>
    <p class="map-schematic-note">Illustrations are schematic, not study results. The guided lessons revisit these questions in teaching order.</p>
    <section class="map-detail" id="map-detail" aria-labelledby="map-detail-title" hidden></section>
    <nav class="map-bottom" aria-label="Continue exploring"><a href="${learningUrl("introduction")}">← Homepage</a><a href="${learningUrl("topics")}">Browse all topics →</a></nav>
  </main>`;
setupLessonNavigation();

const detail = document.querySelector("#map-detail");
const regions = document.querySelectorAll("[data-region]");

function selectRegion(id) {
  const region = mapRegions.find((item) => item.id === id);
  regions.forEach((button) => {
    button.setAttribute("aria-expanded", String(button.dataset.region === id));
    button.removeAttribute("data-connected");
  });
  detail.hidden = false;
  detail.innerHTML = `<div class="map-detail-heading"><div><p class="map-kicker">Inside ${region.name.toLowerCase()}</p><h2 id="map-detail-title" tabindex="-1">${region.question}</h2></div><button type="button" class="map-close" aria-label="Close region">Back to the whole map ↑</button></div>
    <div class="map-detail-grid"><div class="map-concepts" role="group" aria-label="Concepts in ${region.name.toLowerCase()}">${region.concepts.map((concept) => `<button type="button" data-concept="${concept.id}" aria-pressed="false" aria-controls="map-insight">${concept.name}<span aria-hidden="true">↗</span></button>`).join("")}</div><div id="map-insight" aria-live="polite" aria-atomic="true"></div></div>`;
  detail.querySelectorAll("[data-concept]").forEach((button) => {
    button.addEventListener("click", () =>
      selectConcept(region, button.dataset.concept),
    );
  });
  detail
    .querySelector(".map-close")
    .addEventListener("click", () => closeRegion(id));
  selectConcept(region, region.concepts[0].id);
  detail.querySelector("h2").focus();
}

function selectConcept(region, id) {
  const concept = region.concepts.find((item) => item.id === id);
  const [targetId, explanation] = concept.connection;
  const target = mapRegions.find((item) => item.id === targetId);
  detail.querySelectorAll("[data-concept]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.concept === id));
  });
  regions.forEach((button) => {
    button.toggleAttribute(
      "data-connected",
      button.dataset.region === targetId,
    );
  });
  document.querySelector("#map-insight").innerHTML = `
    <h3>${concept.name}</h3><p>${concept.description}</p>
    <div class="map-connection"><p class="map-kicker">Why the pieces connect</p>
      <div class="map-connection-route"><span>${region.name}</span><span class="map-connection-line" aria-hidden="true"></span><button type="button" data-target="${targetId}">${target.name} ↗</button></div>
      <p>${explanation}</p>
    </div>
    <nav class="map-lesson-links" aria-label="Explore ${concept.name}"><span class="map-kicker">See it in an experiment</span>${concept.lessons
      .map((slug) => {
        const lesson = topicLesson(slug);
        return `<a href="${lesson.href}">${lesson.title}<span aria-hidden="true">→</span></a>`;
      })
      .join("")}</nav>`;
  detail
    .querySelector("[data-target]")
    .addEventListener("click", () => selectRegion(targetId));
}

function closeRegion(id) {
  detail.hidden = true;
  regions.forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    button.removeAttribute("data-connected");
  });
  document.querySelector(`[data-region="${id}"]`).focus();
}

regions.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.getAttribute("aria-expanded") === "true")
      closeRegion(button.dataset.region);
    else selectRegion(button.dataset.region);
  });
});
detail.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const selected = document.querySelector(
    '[data-region][aria-expanded="true"]',
  );
  closeRegion(selected.dataset.region);
});
