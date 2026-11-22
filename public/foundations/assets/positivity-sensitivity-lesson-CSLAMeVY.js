/* empty css                          */import{i as $}from"./brand--vQh_tom.js";import{t as A}from"./theme-Vjupx5_i.js";import{l as S,s as E}from"./lesson-navigation-D3qgvbW9.js";import"./glossary-Cn9xhfdQ.js";import"./simulation-BOxkiD6q.js";import"./foundations-progress-CLDiwUAt.js";const m=Object.freeze({retainedShare:.6,retainedTreated:.7,retainedUntreated:.5,excludedTreated:.55});function M(){const e=[.15,.25,.35,.45,.55,.65],t=e.reduce((n,c)=>n+c,0)/e.length,a=m.retainedShare,i=a/(a+(1-a)*t),l=i*t+1-i,h=[...e.map(n=>({score:n,populationShare:i/e.length,retained:!0})),{score:1,populationShare:1-i,retained:!1}].map(n=>({...n,treatedShare:n.populationShare*n.score/l,controlShare:n.populationShare*(1-n.score)/(1-l)})),f=Array.from({length:10},(n,c)=>({lower:c/10,upper:(c+1)/10,treated:0,control:0,excluded:0}));for(const n of h){const c=f[Math.min(9,Math.floor(n.score*10))];c.treated+=n.treatedShare,c.control+=n.controlShare,n.retained||(c.excluded+=n.treatedShare)}return{profiles:h,bins:f,treatedProbability:l}}function x(e){if(!Number.isFinite(e)||e<0||e>1)throw new RangeError("The outcome probability without treatment must be between 0 and 1.");const{retainedShare:t,retainedTreated:a,retainedUntreated:i,excludedTreated:l}=m,h=a-i,f=l-e;return{excludedUntreated:e,retainedEffect:h,excludedEffect:f,overallEffect:t*h+(1-t)*f}}function u(e){return[e,0].map(t=>x(t).overallEffect)}const k=m.excludedTreated+m.retainedShare*x(0).retainedEffect/(1-m.retainedShare),d=Object.freeze(x(.75)),w="Beyond trimming: bounds and sensitivity",o=e=>document.getElementById(e),r=e=>{const t=Math.round(e*1e3)/10;return`${t>0?"+":t<0?"−":""}${Math.abs(t)} pp`},T=([e,t])=>`${r(e)} to ${r(t)}`,v=e=>String(e).replace("-","−"),s=e=>`${Math.round(e*100)}%`,p=m,b=Math.round((1-p.retainedShare)*100)/100,g=.8;document.title=`${w} · Causal Sandbox`;document.querySelector("#app").innerHTML=`
<div class="instrument-page positivity-page">
  <header><a class="brand" href="./">${$}<span>Causal Sandbox</span></a>${A()}</header>
  <main>
    ${S({currentOptional:"positivity-sensitivity"})}
    <p class="eyebrow">ADVANCED · POSITIVITY</p>
    <h1 tabindex="-1">${w}</h1>
    <p class="intro">Trimming changes the population we study. What can we still conclude about everyone who was treated?</p>
    <p class="small">Binary treatment A, binary outcome Y. Target: the <a href="glossary/#att">ATT</a>, the average effect among treated people. Their outcomes under treatment are observed, so only their outcomes without treatment can be missing. Builds on <a href="?lesson=trimming">trimming</a>, which averaged over everyone.</p>
    <section class="panel ps-experiment" aria-labelledby="ps-study-title">
      <p class="eyebrow">TOY POPULATION · EXACT PROPORTIONS</p>
      <h2 id="ps-study-title">Start from the missing comparison</h2>
      <div id="ps-observed">
        ${C()}
        <p class="small">Assume valid adjustment in the retained group. These quantities stay fixed:</p>
        <ul class="ps-evidence">
          <li><strong>Retained · ${s(p.retainedShare)} of treated people:</strong> under treatment, ${s(p.retainedTreated)} would have Y=1; without treatment, ${s(p.retainedUntreated)} would. For these same people, the ATT is ${s(p.retainedTreated)} − ${s(p.retainedUntreated)} = <strong>${r(d.retainedEffect)}</strong>.</li>
          <li><strong>Excluded · ${s(b)}:</strong> ${s(p.excludedTreated)} have Y=1 under treatment. Their outcome probability without treatment is unknown from the observed data.</li>
        </ul>
      </div>
    </section>
    <section class="panel ps-experiment" aria-labelledby="ps-method-title">
      <p class="eyebrow">METHOD · BOUNDS AND SENSITIVITY ANALYSIS</p>
      <h2 id="ps-method-title">From missing outcomes to ATT bounds</h2>
      <p class="small">Allow the excluded group’s outcome probability without treatment to range from 0% to 100%. Combining their possible effects with the retained effect gives ATT bounds of ${T(u(1))}.</p>
      <p class="small">Now explore an additional assumption: an upper limit on that unknown probability. The plot shows the ATT values compatible with the data and your restriction.</p>
      <div id="ps-exploration">
        <p class="ps-task"><strong>Try it:</strong> lower the limit and find where the ATT lower bound reaches zero.</p>
        <label class="ps-limit-label" for="ps-limit"><span>Assumed maximum P(Y=1 without treatment) · excluded group</span><output id="ps-limit-value" for="ps-limit"></output></label>
        <input id="ps-limit" type="range" min="0" max="100" step="5" value="100" aria-label="Upper limit on outcome probability without treatment in the excluded group" aria-describedby="ps-limit-help">
        <p id="ps-limit-help" class="small">Zero remains allowed. Only the assumed maximum changes.</p>
        <label class="ps-truth-toggle"><input id="ps-show-truth" type="checkbox" aria-controls="ps-truth-explanation"> Show simulation truth</label>
        <figure class="ps-bound-figure" aria-labelledby="ps-bound-title">
          <figcaption><span id="ps-bound-title">ATT bounds</span><strong id="ps-result"></strong></figcaption>
          <div id="ps-bound-plot"></div>
          <p class="ps-plot-key"><span>● Lower bound</span><span>Interval: compatible effects</span><span>Dashed line: zero</span></p>
        </figure>
        <div id="ps-truth-explanation" hidden>
          <p class="small">In this simulated population, ${s(d.excludedUntreated)} of excluded people would have Y=1 without treatment, versus ${s(p.excludedTreated)} under treatment: an ATT of ${r(d.excludedEffect)}. <strong>True overall ATT: ${s(p.retainedShare)} × (${r(d.retainedEffect)}) + ${s(b)} × (${r(d.excludedEffect)}) = ${r(d.overallEffect)}.</strong> This is simulator knowledge, unavailable from the observed data.</p>
          <p id="ps-truth-status" class="small" role="status"></p>
        </div>
        <p id="ps-interpretation" class="small" role="status"></p>
        <p class="small">These are identification bounds, not confidence intervals: sampling uncertainty is omitted. Whether a restriction is credible requires external evidence or subject knowledge.</p>
      </div>
    </section>
    <section class="panel" id="ps-practice" aria-labelledby="ps-practice-title">
      <h2 id="ps-practice-title">What does the restriction establish?</h2>
      <fieldset class="ps-question"><legend>External evidence supports an upper limit of ${s(g)} for the excluded group’s outcome probability without treatment. Using the observed data and that restriction, what can you conclude?</legend>
        <button data-practice="point">The ATT is exactly ${r(u(g)[0])}.</button>
        <button data-practice="bounds">The ATT lies between ${u(g).map(r).join(" and ")}, conditional on the restriction.</button>
        <button data-practice="positivity">Positivity is restored, so the ATT is point identified.</button>
      </fieldset>
      <p id="ps-practice-feedback" role="status"></p>
    </section>
    <details class="ps-detail" id="ps-calculation">
      <summary>How the two groups combine</summary>
      <p>Weight each group’s effect by its share of treated people.</p>
      <div class="ps-equation" role="math" aria-label="Overall ATT equals retained share times retained ATT plus excluded share times excluded ATT">
        <math aria-hidden="true"><msub><mi>τ</mi><mtext>all</mtext></msub><mo>=</mo></math>
        <math aria-hidden="true"><mi>p</mi><mo>·</mo><msub><mi>τ</mi><mtext>retained</mtext></msub></math>
        <math aria-hidden="true"><mo>+</mo><mo>(</mo><mn>1</mn><mo>−</mo><mi>p</mi><mo>)</mo><mo>·</mo><msub><mi>τ</mi><mtext>excluded</mtext></msub></math>
      </div>
      <p class="small">Each <math><mi>τ</mi></math> is a group’s ATT. <math><mi>p</mi></math> is the retained share, here ${s(p.retainedShare)}.</p>
      <p>The ATT lower bound uses your upper limit on the outcome probability without treatment:</p>
      <div id="ps-arithmetic" class="ps-equation ps-arithmetic" role="math"></div>
      <p>An upper limit of ${s(k)} gives an ATT lower bound of zero. A stricter limit implies a positive ATT.</p>
      <p>Without the added restriction, overall bounds are ${T(u(1))}. The upper bound stays ${r(u(1)[1])} because an outcome probability of zero without treatment remains allowed in the excluded group.</p>
    </details>
    <details class="ps-detail">
      <summary>Other routes: change the target or the evidence</summary>
      <ul>
        <li><strong>Find relevant controls.</strong> More data can help when controls are rare. If a profile is always treated, enlarging the same study cannot supply them.</li>
        <li><strong>Narrow the target.</strong> Report the retained-group ATT and describe who was excluded. Similar baseline summaries do not establish equal effects.</li>
        <li><strong>State the extrapolation assumptions.</strong> Predictions for excluded people need assumptions beyond the observed comparisons. Show how plausible alternatives change the conclusion.</li>
      </ul>
      <p>Clipping or double robustness cannot replace missing controls. Overlap weighting changes the target population.</p>
    </details>
    <details class="ps-detail">
      <summary>Can controls come from another calendar period?</summary>
      <p>Only if they represent outcomes without treatment in the target period after valid adjustment.</p>
      <p>Changes in measurement or population composition can make calendar time a confounder. Dropping it may hide bias. If time only predicts treatment and is unnecessary for adjustment, including it may worsen precision.</p>
      <p>A period with both treatment groups may support a narrower comparison. Align eligibility and follow-up across groups.</p>
    </details>
    <details class="ps-detail">
      <summary>Assumptions and sources</summary>
      <p>We assume consistency, no interference, and valid adjustment with support in the retained group. Exact population rates omit sampling uncertainty. Baseline groups, treated shares, and follow-up stay fixed.</p>
      <p>The plot uses known treatment probabilities for six retained profiles (0.15–0.65) and one always-treated profile (1). Each arm is normalized separately. The final bin’s treated mass is all at score 1. In real data, an empty region of fitted scores can also reflect a small sample or model misspecification.</p>
      <p>Excluded people are always treated. The slider restricts their outcome probability without treatment to a range from zero to your chosen maximum. This assumption is not testable from these data and must be justified externally.</p>
      <ul>
        <li><a href="https://academic.oup.com/biomet/article/105/2/487/4930690">Yang & Ding (2018)</a>: trimming targets and inference after estimated selection.</li>
        <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4107929/">Petersen et al. (2012)</a>: diagnosing and responding to positivity violations.</li>
        <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3659185/">Mack et al. (2013)</a>: calendar-time-specific propensity scores.</li>
        <li><a href="https://pubmed.ncbi.nlm.nih.gov/39246144/">Liu et al. (2024)</a>: further reading on OWATT.</li>
      </ul>
    </details>
    <nav class="ps-footer" aria-label="Continue learning"><button id="ps-restart">Restart lesson</button><a href="?lesson=trimming">← Trimming</a><a href="?lesson=topics">All topics</a><a href="?lesson=leaving-the-sandbox">Leaving the sandbox →</a></nav>
  </main>
</div>`;E();function C(){const{bins:e}=M(),t=a=>`${a.lower.toFixed(1)}–${a.upper.toFixed(1)}: ${(a.control*100).toFixed(1)}% of untreated, ${(a.treated*100).toFixed(1)}% of treated${a.excluded?", excluded, all at score 1":""}`;return`<figure class="ps-propensity" aria-labelledby="ps-propensity-title">
    <figcaption id="ps-propensity-title">Propensity score distributions</figcaption>
    <p class="small">Known treatment probabilities in this toy population.</p>
    <div class="ps-histogram-key"><span><i class="ps-control-swatch"></i>Untreated</span><span><i class="ps-treated-swatch"></i>Treated</span><span><i class="ps-excluded-swatch"></i>Excluded</span></div>
    <p class="ps-axis-label">Percent of each treatment group</p>
    <svg id="ps-propensity-chart" viewBox="0 0 420 232" role="img" aria-label="Known propensity score distributions, normalized within each treatment group. ${e.map(t).join(". ")}">
      <defs><pattern id="ps-excluded-hatch" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="var(--node-Y)"/><path d="M-1 1L1 -1M0 6L6 0M5 7L7 5" stroke="var(--arm-1)" stroke-width="2"/></pattern></defs>
      <g stroke="var(--grid)"><path d="M40 20H400M40 105H400M40 190H400"/></g>
      <g text-anchor="end"><text x="32" y="25">40</text><text x="32" y="110">20</text><text x="32" y="195">0</text></g>
      ${e.map((a,i)=>`<g data-bin="${i}"><title>${t(a)}</title><rect class="ps-control-bar" x="${42+i*36}" y="${190-a.control*425}" width="14" height="${a.control*425}" data-share="${a.control}"/><rect class="ps-treated-bar${a.excluded?" ps-excluded-bar":""}" x="${58+i*36}" y="${190-a.treated*425}" width="14" height="${a.treated*425}" data-share="${a.treated}"/></g>`).join("")}
      <path d="M40 190H400" stroke="var(--text-secondary)"/>
      <text x="40" y="219" text-anchor="middle">0</text><text x="220" y="219" text-anchor="middle">0.5</text><text x="400" y="219" text-anchor="middle">1</text>
    </svg>
    <p class="ps-axis-label ps-x-label">Propensity score · probability of treatment</p>
    <p class="ps-support-note"><strong>Hatched: the excluded ${s(b)} of treated people.</strong> Always treated (score 1), with no controls.</p>
  </figure>`}function L(e,t,a){const i=l=>4+(l*100+10)/50*92;return`<svg id="ps-att-chart" role="img" aria-label="ATT identification bounds ${r(e)} to ${r(t)}. Dot: lower bound. Dashed reference: zero. ${a?`Simulation truth: ${r(d.overallEffect)}, fixed.`:"Simulation truth hidden."}" data-domain-min="-10" data-domain-max="40">
    <line class="ps-effect-axis" x1="4%" x2="96%" y1="72" y2="72"/>
    <line class="ps-effect-zero" x1="${i(0)}%" x2="${i(0)}%" y1="12" y2="72"/>
    ${a?`<line class="ps-effect-truth" x1="${i(d.overallEffect)}%" x2="${i(d.overallEffect)}%" y1="20" y2="72"/><text class="ps-truth-label" x="${i(d.overallEffect)}%" y="12" text-anchor="middle">Truth ${r(d.overallEffect)}</text>`:""}
    <line class="ps-effect-interval" x1="${i(e)}%" x2="${i(t)}%" y1="40" y2="40"/>
    <line class="ps-effect-cap" x1="${i(t)}%" x2="${i(t)}%" y1="33" y2="47"/>
    <circle class="ps-effect-bound" cx="${i(e)}%" cy="40" r="5" data-effect="${e}"/>
    ${[-10,0,10,20,30,40].map(l=>`<text x="${i(l/100)}%" y="94" text-anchor="middle">${l>0?"+":""}${v(l)}</text>`).join("")}
  </svg><p class="ps-effect-axis-title">ATT (percentage points)</p>`}function y(){const e=Number(o("ps-limit").value)/100,t=x(e),[a,i]=u(e);o("ps-limit-value").textContent=`At most ${s(e)}`,o("ps-limit").setAttribute("aria-valuetext",`At most ${s(e)} outcome probability without treatment, assumed upper limit`),o("ps-result").textContent=T([a,i]);const l=o("ps-show-truth").checked;o("ps-bound-plot").innerHTML=L(a,i,l),o("ps-truth-explanation").hidden=!l,o("ps-truth-status").textContent=e<d.excludedUntreated?"This restriction is false in the simulated population: the narrower bounds exclude the true ATT. The truth stays fixed.":`These bounds include the true ATT. Try a limit below ${s(d.excludedUntreated)}: a false restriction can exclude it.`,o("ps-interpretation").textContent=e===1?"Without an additional restriction, the ATT can be negative or positive.":Math.abs(a)<1e-10?`${s(e)} is the tipping point: the ATT lower bound is zero, conditional on this restriction.`:a<0?"This upper limit still allows a negative ATT.":`The ATT is at least ${r(a)}, conditional on this upper limit.`,o("ps-arithmetic").setAttribute("aria-label",`Lower bound: ${p.retainedShare*100} percent times ${r(t.retainedEffect)} plus ${b*100} percent times ${r(t.excludedEffect)} equals ${r(t.overallEffect)}`),o("ps-arithmetic").innerHTML=`
    <math aria-hidden="true"><mn>${p.retainedShare}</mn><mo>×</mo><mn>${Math.round(t.retainedEffect*100)}</mn></math>
    <math aria-hidden="true"><mo>+</mo><mn>${b}</mn><mo>×</mo><mo>(</mo><mn>${v(Math.round(t.excludedEffect*100))}</mn><mo>)</mo></math>
    <math aria-hidden="true"><mo>=</mo><mn>${v(Math.round(t.overallEffect*1e3)/10)}</mn><mspace width="0.3em"/><mtext>pp</mtext></math>`}document.querySelectorAll("[data-practice]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-practice]").forEach(t=>t.setAttribute("aria-pressed",String(t===e))),o("ps-practice-feedback").textContent=`${e.dataset.practice==="bounds"?"✓ Correct.":"! Not quite."} The restriction narrows the ATT to between ${u(g).map(r).join(" and ")}. It supplies no missing controls and does not identify a single effect.`})});o("ps-limit").addEventListener("input",y);o("ps-show-truth").addEventListener("change",y);o("ps-restart").addEventListener("click",()=>{o("ps-limit").value=100,o("ps-show-truth").checked=!1,o("ps-practice-feedback").textContent="",document.querySelectorAll("[data-practice]").forEach(e=>e.removeAttribute("aria-pressed")),document.querySelectorAll(".ps-detail").forEach(e=>{e.open=!1}),y(),document.querySelector("h1").focus()});y();document.querySelector("h1").focus({preventScroll:!0});
