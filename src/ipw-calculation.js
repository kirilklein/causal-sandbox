const number = (value) => value.toFixed(3);

function fraction(top, bottom) {
  return `<mfrac><mn>${number(top)}</mn><mn>${number(bottom)}</mn></mfrac>`;
}

export function renderIpwCalculation(groups) {
  document.querySelector("#weight-examples").innerHTML = `
    <p>Let p be the chance of treatment given baseline health. Weight by the inverse chance of the assignment actually received:</p>
    <table class="ipw-weight-table"><caption>Illustrative probabilities, not this sample</caption>
      <thead><tr><th scope="col">Treatment chance<br>p</th>
      <th scope="col">Treated weight<br><math aria-label="one divided by p"><mfrac><mn>1</mn><mi>p</mi></mfrac></math></th>
      <th scope="col">Untreated weight<br><math aria-label="one divided by one minus p"><mfrac><mn>1</mn><mrow><mn>1</mn><mo>−</mo><mi>p</mi></mrow></mfrac></math></th></tr></thead>
      <tbody>${[0.1, 0.5, 0.9].map((p) => `<tr><th scope="row">${p.toFixed(1)}</th><td>${Number((1 / p).toFixed(2))}</td><td>${Number((1 / (1 - p)).toFixed(2))}</td></tr>`).join("")}</tbody></table>
    <p class="sample-note">At p = 0.9, treatment is common: a treated person gets weight 1.11, but an untreated person gets weight 10. At p = 0.1, the weights reverse.</p>`;
  document.querySelector("#ipw-arithmetic").innerHTML = `
    <p>For each group, multiply every outcome by its weight and add them up. Divide by that group’s total weight:</p>
    <math display="block" aria-label="Weighted average equals the sum of weight times outcome divided by the sum of weights, within one treatment group"><mrow><mover><mi>Y</mi><mo>¯</mo></mover><mo>=</mo><mfrac><mrow><mo>∑</mo><msub><mi>w</mi><mi>i</mi></msub><msub><mi>Y</mi><mi>i</mi></msub></mrow><mrow><mo>∑</mo><msub><mi>w</mi><mi>i</mi></msub></mrow></mfrac></mrow></math>
    <p class="sample-note">Y is outcome, w is weight, and ∑ means add over all people i in that group.</p>
    <div class="ipw-examples">${groups
      .map(
        ({ weightedSum, totalWeight, mean }, arm) =>
          `<div><strong>${arm ? "Treated" : "Untreated"} average</strong>${mean === null ? "<p>Unavailable: no people in this group.</p>" : `<p><math aria-label="${number(weightedSum)} divided by ${number(totalWeight)}, approximately ${number(mean)}"><mrow>${fraction(weightedSum, totalWeight)}<mo>≈</mo><mn>${number(mean)}</mn></mrow></math></p>`}</div>`,
      )
      .join("")}</div>
    <p><strong>IPW effect:</strong> treated average − untreated average.</p>
    <p id="ipw-worked-effect">${groups.some(({ mean }) => mean === null) ? "Unavailable: both treatment groups are needed." : `${number(groups[1].mean)} − (${number(groups[0].mean)}) ≈ ${(groups[1].mean - groups[0].mean).toFixed(2)}`}</p>
    <p class="sample-note">These totals use the current sample and its fitted probabilities, not the illustrative numbers above. Displayed numbers are rounded; calculations use full precision. Treatment probabilities are clipped to [0.02, 0.98] before computing weights; clipping can introduce bias.</p>`;
}
