import { studentPanels, studentLayout } from "./front-door-population.js";
import { percent } from "./front-door-view.js";

const ns = "http://www.w3.org/2000/svg";
const tutoring = ["No tutoring", "Tutoring"];
const practice = ["Little practice", "Regular practice"];

export function mountStudentPopulation(container, students, result) {
  container.innerHTML = `<p class="small fd-cohort-label">Fictional population · 1,000 students · exact proportions</p><div class="fd-student-key"><span>● No tutoring &nbsp; ▲ Tutoring</span><span>Filled: passed · hollow: did not pass</span></div><svg class="fd-students" role="img" aria-labelledby="fd-population-description"><title id="fd-population-description"></title><g class="fd-population-labels"></g><g class="fd-student-marks" aria-hidden="true"></g></svg><p id="fd-population-note" class="small"></p><div class="fd-follow"><label for="fd-student">Follow student <input id="fd-student" type="number" min="1" max="1000" value="1"></label><output id="fd-journey" for="fd-student"></output></div>`;
  const svg = container.querySelector("svg");
  const labels = svg.querySelector(".fd-population-labels");
  const marks = svg.querySelector(".fd-student-marks");
  const input = container.querySelector("input");
  const journey = container.querySelector("output");
  let stage = 0;
  let balanced = false;
  let selected = 1;
  const nodes = [new Map(), new Map()];
  for (let copy = 0; copy < 2; copy++) {
    for (const person of students) {
      const node = document.createElementNS(ns, "g");
      node.classList.add("fd-student", `fd-arm-${person.a}`);
      node.dataset.student = person.id;
      node.dataset.copy = copy;
      node.dataset.record = `${person.a}/${person.m}/${person.y}`;
      node.innerHTML = `<circle class="fd-student-halo" r="2.2"/>${person.a ? '<path d="M0,-1.555 L1.347,.7775 L-1.347,.7775 Z"' : '<circle r="1"'} class="fd-student-symbol ${person.y ? "fd-passed" : ""}"/>`;
      node.style.opacity = "0";
      marks.append(node);
      nodes[copy].set(person.id, node);
    }
  }
  function select(id) {
    selected = id;
    const person = students[id - 1];
    input.value = id;
    journey.textContent = `${tutoring[person.a]} → ${practice[person.m].toLowerCase()} → ${person.y ? "passed" : "did not pass"}`;
    nodes.forEach((copy) =>
      copy.forEach((node, key) =>
        node.classList.toggle("fd-selected", key === id),
      ),
    );
  }
  input.addEventListener("input", () => {
    const id = Number(input.value);
    if (Number.isInteger(id) && id >= 1 && id <= students.length) select(id);
  });
  input.addEventListener("change", () => select(selected));
  svg.addEventListener("click", (event) => {
    const node = event.target.closest("[data-student]");
    if (node) select(Number(node.dataset.student));
  });
  function draw() {
    const width = container.clientWidth;
    if (!width) return;
    const panels = studentPanels(students, result, stage, balanced);
    const layout = studentLayout(panels, width);
    svg.setAttribute("viewBox", `0 0 ${width} ${layout.height}`);
    const description = [];
    labels.innerHTML =
      panels
        .map((panel) => {
          const x = width < 640 ? 0 : panel.panel * (layout.panelWidth + 24);
          const y = width < 640 ? panel.panel * (layout.panelHeight + 18) : 0;
          const title =
            stage < 2
              ? tutoring[panel.panel]
              : stage === 2
                ? practice[panel.panel]
                : panel.panel
                  ? "Rebuild: tutoring everyone"
                  : "Rebuild: tutoring no one";
          const rateLabel = stage === 1 ? "practice regularly" : "pass";
          const rate = stage === 1 ? result.pM[panel.panel][1] : panel.rate;
          description.push(`${title}: ${percent(rate)} ${rateLabel}.`);
          return `<rect class="fd-population-panel" x="${x}" y="${y}" width="${layout.panelWidth}" height="${layout.panelHeight}" rx="10"/><text class="fd-panel-title" x="${x + 16}" y="${y + 26}">${title}</text><text class="fd-panel-subtitle" x="${x + 16}" y="${y + 45}">${stage === 3 ? "Same 1,000 observed records, weighted" : `${panel.count} observed students`}</text><text class="fd-panel-rate" data-population-rate="${panel.panel}" x="${x + 16}" y="${y + layout.panelHeight - 19}">${percent(rate)} ${rateLabel}</text>`;
        })
        .join("") +
      layout.boxes
        .map((box) => {
          if (box.group === null) return "";
          const title = stage === 2 ? tutoring[box.group] : practice[box.group];
          const suffix =
            stage === 2
              ? ` · ${percent(result.outcome[box.group][box.panel])} pass`
              : stage === 3
                ? ` · ${percent(result.response[box.group])} pass`
                : "";
          return `<rect class="fd-population-group" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="5"/><text class="fd-group-label" x="${box.x + 6}" y="${box.y + 20}">${title} · ${percent(box.share)}${suffix}</text>`;
        })
        .join("");
    const visible = new Set();
    for (const mark of layout.marks) {
      const copy = stage === 3 ? mark.panel : 0;
      const node = nodes[copy].get(mark.id);
      visible.add(node);
      node.dataset.weight = mark.weight;
      node.dataset.panel = mark.panel;
      node.style.transform = `translate(${mark.x}px, ${mark.y}px) scale(${mark.radius})`;
      if (stage < 3)
        nodes[1].get(mark.id).style.transform = node.style.transform;
      node.style.opacity = "1";
      node.style.pointerEvents = "auto";
    }
    nodes.forEach((copy) =>
      copy.forEach((node) => {
        if (!visible.has(node)) {
          node.style.opacity = "0";
          node.style.pointerEvents = "none";
        }
      }),
    );
    const note =
      stage === 3
        ? "Each record contributes to both averages. Larger marks count more; no individual future is inferred."
        : stage === 2 && balanced
          ? "Size shows weight: each tutoring group now contributes 50% within each practice group. Outcomes stay fixed."
          : "1 mark = 1 observed student. Regrouping moves records; it does not change anyone’s outcome.";
    container.querySelector("#fd-population-note").textContent = note;
    svg.querySelector("title").textContent = description.join(" ") + " " + note;
  }
  new ResizeObserver(draw).observe(container);
  select(1);
  return {
    update(nextStage, nextBalanced = false) {
      stage = nextStage;
      balanced = nextBalanced;
      draw();
    },
    reset() {
      select(1);
    },
  };
}
