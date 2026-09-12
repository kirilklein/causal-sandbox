import { graphMarkup } from "./quiz-graph.js";
import {
  adjustmentChoice,
  adjustmentLabel,
  selectedNodes,
} from "./adjustment-model.js";
import "./adjustment-input.css";

export function adjustmentMarkup(question) {
  const facts = `<dl class="quiz-facts">${(question.facts || []).map(([id, label]) => `<div><dt>${id}</dt><dd>${label}</dd></div>`).join("")}</dl>`;
  return `<div class="adjustment-input"><div class="quiz-diagram">${graphMarkup(question, { interactive: true })}${facts}</div><p class="sample-note">Click or tap nodes to select variables; click again to remove them. A and Y are fixed.${question.unmeasured?.length ? " Dashed nodes are unmeasured." : ""}</p><p class="adjustment-summary" aria-live="polite">Adjusting for: none selected</p><div class="quiz-choices">${[
    ["none", "No adjustment needed"],
    ["impossible", "No valid measured adjustment set exists"],
    ["unsure", "I’m not sure"],
  ]
    .map(
      ([value, label]) =>
        `<label class="quiz-choice"><input type="radio" name="answer" value="${value}"><span>${label}</span></label>`,
    )
    .join("")}</div></div>`;
}

export function bindAdjustment(root, choice = null, onChange = () => {}) {
  let current = choice,
    locked = false;
  const nodes = root.querySelectorAll("[data-adjust-node]");
  const radios = root.querySelectorAll('input[name="answer"]');
  function paint() {
    const selected = selectedNodes(current);
    nodes.forEach((node) => {
      node.setAttribute(
        "aria-pressed",
        String(selected.includes(node.dataset.adjustNode)),
      );
      node.setAttribute("aria-disabled", String(locked));
      node.setAttribute("tabindex", locked ? "-1" : "0");
    });
    radios.forEach((input) => {
      input.checked = input.value === current;
      input.disabled = locked;
    });
    root.querySelector(".adjustment-summary").textContent = current?.startsWith(
      "set:",
    )
      ? `Adjusting for: ${selected.join(", ")}`
      : current
        ? adjustmentLabel(current)
        : "Adjusting for: none selected";
  }
  function toggle(node) {
    if (locked) return;
    const selected = new Set(selectedNodes(current));
    const id = node.dataset.adjustNode;
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    current = selected.size ? adjustmentChoice([...selected]) : null;
    paint();
    onChange(current);
  }
  nodes.forEach((node) => {
    node.addEventListener("click", () => toggle(node));
    node.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      toggle(node);
    });
  });
  radios.forEach((input) =>
    input.addEventListener("change", () => {
      current = input.value;
      paint();
      onChange(current);
    }),
  );
  paint();
  return {
    choice: () => current,
    lock: () => {
      locked = true;
      paint();
    },
    highlight: (path) => {
      root.querySelectorAll("[data-path]").forEach((edge) => {
        const [a, b] = edge.dataset.path.split(":");
        edge.classList.toggle(
          "adjustment-path",
          path.some(
            (id, i) =>
              i &&
              ((path[i - 1] === a && id === b) ||
                (path[i - 1] === b && id === a)),
          ),
        );
      });
    },
  };
}
