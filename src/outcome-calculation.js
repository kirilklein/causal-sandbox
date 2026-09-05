const number = (value) => value.toFixed(3);

export function renderOutcomeCalculation({ person, count, sum }) {
  const { C, m0, m1 } = person;
  document.querySelector("#outcome-example").innerHTML = `
    <p>For the first person in this sample, hold baseline health C = ${number(C)} fixed:</p>
    <div class="outcome-predictions">
      <div><span>Predicted with treatment</span><strong id="outcome-prediction-1">${number(m1)}</strong></div>
      <div><span>Predicted without treatment</span><strong id="outcome-prediction-0">${number(m0)}</strong></div>
    </div>
    <p id="outcome-worked-difference"><strong>Predicted difference:</strong> ${number(m1)} − (${number(m0)}) ≈ ${number(m1 - m0)}.</p>
    <p class="sample-note">These are fitted predictions, not two observed outcomes for this person. Values are in outcome units and rounded; calculations use full precision.</p>`;
  document.querySelector("#outcome-arithmetic").innerHTML = `
    <p>Predict both outcomes for everyone, regardless of which treatment they received. Add their predicted differences and divide by the number of people.</p>
    <p>Let m₁(Cᵢ) and m₀(Cᵢ) be the fitted predictions with and without treatment for person i, whose baseline health is Cᵢ. With n people:</p>
    <math display="block" aria-label="Outcome regression estimate equals one divided by n, times the sum over all people of predicted outcome with treatment minus predicted outcome without treatment"><mrow><mfrac><mn>1</mn><mi>n</mi></mfrac><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mo>[</mo><msub><mi>m</mi><mn>1</mn></msub><mo>(</mo><msub><mi>C</mi><mi>i</mi></msub><mo>)</mo><mo>−</mo><msub><mi>m</mi><mn>0</mn></msub><mo>(</mo><msub><mi>C</mi><mi>i</mi></msub><mo>)</mo><mo>]</mo></mrow></math>
    <p><strong>Sum of all ${count.toLocaleString("en-US")} predicted differences:</strong> <span id="outcome-difference-sum">${number(sum)}</span>.</p>
    <p id="outcome-worked-effect"><strong>Outcome-regression estimate:</strong>
      <math aria-label="${number(sum)} divided by ${count}, approximately ${(sum / count).toFixed(2)}"><mrow><mfrac><mn>${number(sum)}</mn><mn>${count}</mn></mfrac><mo>≈</mo><mn>${(sum / count).toFixed(2)}</mn></mrow></math></p>
    <p class="sample-note">This additive model predicts the same treatment difference for everyone, so the average matches the example above. That is a feature of this model, not a general rule.</p>`;
}
