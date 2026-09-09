export const percent = (p) =>
  `${(100 * p).toFixed(p < 0.001 || p > 0.999 ? 3 : 1)}%`;

export function patientMark(person, x, y, selected = false) {
  return `<g class="ps-patient" data-patient="${person.person}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})">
    <title>Person ${person.person}: ${person.A ? "treated" : "untreated"}${person.p === undefined ? "" : `; estimated treatment probability ${percent(person.p)}`}</title>
    ${selected ? '<circle class="ps-selection" r="9"/>' : ""}
    ${person.A ? '<path class="ps-treated" d="M0 -4.5L4.5 3.5H-4.5Z"/>' : '<circle class="ps-untreated" r="3.5"/>'}
  </g>`;
}

export const armLegend = `<span class="ps-legend"><span><svg viewBox="0 0 16 16" aria-hidden="true"><circle class="ps-untreated" cx="8" cy="8" r="4"/></svg>Untreated</span><span><svg viewBox="0 0 16 16" aria-hidden="true"><path class="ps-treated" d="M8 3L13 12H3Z"/></svg>Treated</span></span>`;

export function personOptions(data) {
  return data
    .map((d) => `<option value="${d.person}">Person ${d.person}</option>`)
    .join("");
}
