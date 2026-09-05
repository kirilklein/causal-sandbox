const number = (value) => value.toFixed(3);
const sub = (symbol, index = "i") =>
  `<msub><mi>${symbol}</mi><mi>${index}</mi></msub>`;
const prediction = (arm) =>
  `<msub><mover><mi>m</mi><mo>^</mo></mover><${arm === "0" || arm === "1" ? "mn" : "mrow"}>${arm}</${arm === "0" || arm === "1" ? "mn" : "mrow"}></msub><mo>(</mo>${sub("C")}<mo>)</mo>`;
const math = (body, label) =>
  `<math display="block" aria-label="${label}">${body}</math>`;

export function aipwFormula() {
  const contrast = `${prediction("1")}<mo>−</mo>${prediction("0")}`;
  return `
    <p>Outcome predictions give a starting estimate. IPW-weighted regression errors supply the correction.</p>
    <div class="aipw-formula" role="group" aria-label="AIPW: average the predicted contrasts plus signed, weighted regression errors over all people">
      <div class="aipw-average">
        ${math("<mover><mi>τ</mi><mo>^</mo></mover><mo>=</mo><mfrac><mn>1</mn><mi>n</mi></mfrac><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover>", "AIPW estimate equals the average over all n people")}
        <span>Average over people</span>
      </div>
      <div class="aipw-summand">
        <div class="aipw-contrast">
          ${math(contrast, "Predicted outcome with treatment minus predicted outcome without treatment, at person i's baseline health")}
          <span>Predicted contrast</span>
        </div>
        <span class="aipw-plus" aria-label="plus">+</span>
        <div class="aipw-correction">
          <div class="aipw-factors">
            <span class="aipw-sign">${math(sub("s"), "s i: direction")}</span>
            <span class="aipw-weight">${math(sub("w"), "w i: IPW weight")}</span>
            <span class="aipw-residual">${math(sub("r"), "r i: regression error")}</span>
          </div>
          <span>Weighted correction</span>
        </div>
      </div>
    </div>
    <p class="aipw-prediction-note">${math(prediction("1"), "m hat one at C i")} and ${math(prediction("0"), "m hat zero at C i")} are fitted outcomes with and without treatment, at the same baseline health.</p>
    <div class="aipw-definitions">
      <section class="aipw-residual" aria-labelledby="aipw-residual-title">
        <h3 id="aipw-residual-title">Regression error</h3>
        ${math(`${sub("r")}<mo>=</mo>${sub("Y")}<mo>−</mo>${prediction(sub("A"))}`, "r i equals observed outcome minus the prediction for the treatment actually received")}
        <p>Observed minus predicted, for the treatment actually received.</p>
      </section>
      <section class="aipw-weight" aria-labelledby="aipw-weight-title">
        <h3 id="aipw-weight-title">IPW weight</h3>
        ${math(`${sub("w")}<mo>=</mo><mrow><mo>{</mo><mtable columnalign="left left"><mtr><mtd><mfrac><mn>1</mn>${sub("p")}</mfrac></mtd><mtd><mtext>treated</mtext></mtd></mtr><mtr><mtd><mfrac><mn>1</mn><mrow><mn>1</mn><mo>−</mo>${sub("p")}</mrow></mfrac></mtd><mtd><mtext>untreated</mtext></mtd></mtr></mtable></mrow>`, "w i equals one divided by p i if treated, or one divided by one minus p i if untreated")}
        <p>Inverse chance of the treatment received; p is the fitted chance of treatment.</p>
      </section>
      <section class="aipw-sign" aria-labelledby="aipw-sign-title">
        <h3 id="aipw-sign-title">Direction</h3>
        ${math(`${sub("s")}<mo>=</mo><mrow><mo>{</mo><mtable columnalign="left left"><mtr><mtd><mo>+</mo><mn>1</mn></mtd><mtd><mtext>treated</mtext></mtd></mtr><mtr><mtd><mo>−</mo><mn>1</mn></mtd><mtd><mtext>untreated</mtext></mtd></mtr></mtable></mrow>`, "s i equals plus one if treated and minus one if untreated")}
        <p>Add treated errors; subtract untreated errors. The contrast is treated minus untreated.</p>
      </section>
    </div>
    <p class="sample-note">A is 1 for treated and 0 for untreated. The correction need not move a sample’s estimate closer to truth; it cannot repair hidden confounding or absent overlap.</p>
    <details class="aipw-numbers"><summary>Check with this sample</summary><div id="aipw-arithmetic"></div></details>
    <details class="aipw-normalization"><summary>Averaging and clipping</summary><p>These weights use treatment probabilities clipped to [0.02, 0.98]; clipping can introduce bias. AIPW averages over n people. The displayed IPW divides each group’s weighted outcome sum by its own total weight (Hájek normalization), so AIPW is not that IPW estimate plus this correction.</p></details>`;
}

export function aipwCalculation(contributions) {
  if (
    !contributions.length ||
    contributions.some((row) =>
      Object.values(row).some((value) => !Number.isFinite(value)),
    )
  )
    return "<p>AIPW calculation unavailable: finite fitted values are needed for every person.</p>";

  const examples = [1, 0].map((arm) =>
    contributions.find(({ A }) => A === arm),
  );
  if (examples.some((row) => !row))
    return "<p>AIPW calculation unavailable: both treatment groups are needed.</p>";
  const average = (key) =>
    contributions.reduce((sum, row) => sum + row[key], 0) /
    contributions.length;
  const row = (label, key) =>
    `<tr><th scope="row">${label}</th>${examples.map((d) => `<td>${number(d[key])}</td>`).join("")}</tr>`;
  const table = (caption, rows) =>
    `<table><caption>${caption}</caption><thead><tr><th scope="col">Quantity</th>${examples.map((d) => `<th scope="col">Person ${d.person}<br>${d.A ? "Treated" : "Untreated"}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;

  return `
    <p class="sample-note">The first treated and first untreated person in this sample. The averages use all ${contributions.length.toLocaleString("en-US")} people. Values are rounded; calculations use full precision.</p>
    ${table("Current fitted values and contributions", row("Prediction with treatment", "m1") + row("Prediction without treatment", "m0") + row("Observed outcome", "Y") + row("Predicted contrast", "contrast") + row("Regression error, r", "residual") + row("IPW weight, w", "weight") + row("Signed correction, s × w × r", "correction") + row("Total contribution", "contribution"))}
    <dl class="aipw-totals">
      <div><dt>Average predicted contrast</dt><dd>${number(average("contrast"))}</dd></div>
      <div><dt>Average signed correction</dt><dd>${number(average("correction"))}</dd></div>
      <div><dt>AIPW estimate</dt><dd id="aipw-worked-effect">${average("contribution").toFixed(2)}</dd></div>
    </dl>`;
}
