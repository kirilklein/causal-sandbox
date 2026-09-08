const changes = {
  2: "We add risk score C and its influence on outcome. Increasing selection adds its influence on treatment too.",
  3: "We use the same risk-score graph with treatment selection on, then try balancing the groups with IPW.",
  4: "Same causal graph; we now model outcomes as another way to account for C.",
  7: "We add M: treatment changes M, which changes outcome. This pathway contributes to the total effect.",
  8: "We replace M with K: M caused outcome, whereas K is caused by both treatment and outcome.",
  9: "We remove K and introduce unmeasured U. Its influence on treatment and outcome starts at zero.",
  5: "We remove U and return to C alone, then explore relationships that a simple model can miss.",
  6: "Same causal graph; both relationships now contain extra patterns. We combine outcome regression and IPW.",
  11: "Same causal graph; we now use the correction to update the outcome predictions themselves.",
  10: "Same causal graph; we return to simple relationships and explore stronger treatment selection.",
};

export function graphComparison(level, revisiting) {
  const change = revisiting
    ? "We return to the graph with unmeasured U, now comparing AIPW too. U’s influence starts at zero."
    : changes[level];
  return `<div class="graph-comparison">
    <button id="compare-graph" aria-expanded="false" aria-controls="graph-comparison-options">Compare with previous</button>
    <div id="graph-comparison-options" hidden>
      <p>${change}</p>
      <div class="graph-comparison-switch" role="group" aria-label="Diagram view">
        <button data-graph-view="previous" aria-pressed="false" aria-controls="lesson-graph">Previous</button>
        <button data-graph-view="current" aria-pressed="true" aria-controls="lesson-graph">Current</button>
      </div>
      <p class="sample-note">Controls and results below stay on the current lesson.</p>
    </div>
  </div>`;
}

export function setupGraphComparison(render) {
  const toggle = document.querySelector("#compare-graph");
  const options = document.querySelector("#graph-comparison-options");
  const buttons = options.querySelectorAll("[data-graph-view]");
  let view = "current";
  toggle.addEventListener("click", () => {
    options.hidden = !options.hidden;
    toggle.setAttribute("aria-expanded", String(!options.hidden));
    render(!options.hidden, view);
  });
  for (const button of buttons) {
    button.addEventListener("click", () => {
      view = button.dataset.graphView;
      for (const option of buttons)
        option.setAttribute("aria-pressed", String(option === button));
      render(true, view);
    });
  }
}
