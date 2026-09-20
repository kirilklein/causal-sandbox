import { profiles, health, FINAL_DAY } from "./trajectory-model.js";

// Keep the landscape's ten people and their assignments, including the focal patient.
export const openingPeople = profiles().map((person, index) => ({
  ...person,
  label: `Patient ${String(index + 1).padStart(2, "0")}`,
  outcomes: [0, 1].map((a) => health(person.severity, FINAL_DAY, a)),
}));

export function populationMarkup(observedOnly) {
  const mean = (a) =>
    openingPeople.reduce((sum, person) => sum + person.outcomes[a], 0) /
    openingPeople.length;
  const y = (value) => 224 - ((value - 20) / 80) * 192;
  const world = (a) => {
    const marks = openingPeople
      .map((person, index) => {
        const x = 48 + index * 32;
        const observed = person.treatment === a;
        const missing = observedOnly && !observed;
        // A missing outcome has no mark or value at its simulator-known position.
        const description = `${person.label}: ${missing ? "unobserved" : `${person.outcomes[a].toFixed(1)} health points, ${observed ? "observed" : "simulated counterfactual"}`}`;
        return `<g class="what-if-person" data-person="${person.id}" tabindex="0" role="img" aria-label="${description}">
        ${missing ? `<text class="what-if-missing" x="${x}" y="258" text-anchor="middle">?</text>` : `<circle data-outcome="${a}" data-observed="${observed}" cx="${x}" cy="${y(person.outcomes[a])}" r="5" fill="${observed ? "currentColor" : "var(--film-background)"}"/><text class="what-if-value" x="${x}" y="${y(person.outcomes[a]) - 12}" text-anchor="middle">${person.outcomes[a].toFixed(1)}</text>`}
        <text class="what-if-person-label" x="${x}" y="242" text-anchor="middle">${String(index + 1).padStart(2, "0")}</text>
      </g>`;
      })
      .join("");
    return `<section class="what-if-world ${a ? "world-treated" : "world-untreated"}" aria-label="${a ? "If all treated" : "If none treated"}">
      <h2>${a ? "If all treated" : "If none treated"}</h2>
      <svg viewBox="0 0 360 280" role="group" aria-label="Day-12 health for the same ten people; higher is better">
        <text class="what-if-axis-label" x="24" y="15">Day-12 health ↑</text>
        <rect class="what-if-focal" x="260" y="24" width="24" height="224"/>
        ${[20, 40, 60, 80, 100].map((value) => `<path class="what-if-grid" d="M40 ${y(value)}H344"/><text class="what-if-axis-label" x="32" y="${y(value) + 4}" text-anchor="end">${value}</text>`).join("")}
        ${observedOnly ? "" : `<path class="what-if-mean" d="M40 ${y(mean(a))}H344"/>`}
        ${marks}
        <text class="what-if-axis-label" x="192" y="276" text-anchor="middle">Same people →</text>
      </svg>
      <p class="what-if-world-mean" data-mean="${a}">${observedOnly ? `Average unknown<span>${openingPeople.filter((person) => person.treatment === a).length} of ${openingPeople.length} outcomes observed</span>` : `Average: <strong>${mean(a).toFixed(1)}</strong><span>Dashed line · all ten people</span>`}</p>
    </section>`;
  };
  return `<p class="what-if-population-note">Keep day 12. Add nine people. <strong>Patient 08</strong> is highlighted in both worlds.</p>
    <div class="what-if-worlds">${world(1)}${world(0)}</div>
    <p class="what-if-inspect">Hover or focus a person to read their outcome.${observedOnly ? " A ? marks an unobserved outcome; its position does not indicate health." : " Both plots use the same health scale."}</p>
    <p class="what-if-effect" role="status">${observedOnly ? "The average effect is unknown from these outcomes alone." : `Average treatment effect: ${mean(1).toFixed(1)} − ${mean(0).toFixed(1)} = <strong>+${(mean(1) - mean(0)).toFixed(1)} health points</strong>`}</p>`;
}
