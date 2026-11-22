/* empty css                          */import{n as v,p as u,f as n,e as y}from"./uncertainty-view-3ZI8jWfc.js";import{t as w}from"./theme-Vjupx5_i.js";import{i as T}from"./brand--vQh_tom.js";import{c as o}from"./events-B779v5TJ.js";import{l as x,s as z,b as E}from"./lesson-navigation-D3qgvbW9.js";import{a as l,u as c,n as S}from"./uncertainty-WO1XxuBT.js";import"./glossary-Cn9xhfdQ.js";import"./simulation-BOxkiD6q.js";import"./foundations-progress-CLDiwUAt.js";import"./lesson-simulation-DgNFmLuF.js";document.title="What does a p-value tell us? — Causal Sandbox";document.querySelector("#app").innerHTML=`<div class="instrument-page inference-page">
  <header class="lesson-header"><a class="brand" href="./">${T}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${w()}</header>
  <main class="learning">
    ${x({currentOptional:"p-values"})}
    <p class="eyebrow">OPTIONAL · AFTER UNCERTAINTY</p>
    <h1 tabindex="-1">What does a p-value tell us?</h1>
    <section class="panel" aria-labelledby="null-title">
      <div class="experiment-heading"><h2 id="null-title">1. How unusual if the effect were zero?</h2><span class="experiment-tag">Randomized · 200 people</span></div>
      <div id="observed-result" aria-live="polite"></div>
      <div class="actions"><button id="compare-observed" class="primary">Place this result on the curve</button><button id="redraw-observed">Draw a new observed study</button></div>
      <div id="null-plot"></div>
      <div id="observed-p" class="p-readout" role="status" hidden></div>
      <div class="actions"><button id="repeat-null">Draw 100 zero-effect studies</button></div>
      <p id="null-summary" class="small" role="status"></p>
      <div id="p-interpretation" hidden><p class="inference-prompt">Both tails: results at least this far from zero.</p><p id="observed-interval-note" class="small"></p></div>
      <details><summary>Read the curve and dots</summary>
        <p>The curve approximates the distribution of z under a zero mean difference. <strong>z = estimate ÷ standard error</strong>: distance from zero in standard-error units. Dots are simulated zero-effect studies; their height just separates them.</p>
        <p>The <a href="glossary/#p-value">two-sided p-value</a> is the combined area beyond ±|observed z|. It comes from the normal curve, not the small batch of dots. Values beyond ±4 sit at the edge; the calculation includes the full tails.</p>
        <p>A batch need not put exactly 5 of 100 dots beyond the p = 0.05 cutoff. Its long-run rate is approximately 5% under the assumptions.</p>
      </details>
    </section>
    <section class="panel" aria-labelledby="precision-title">
      <div class="experiment-heading"><h2 id="precision-title">2. Same estimate. Smaller p-value?</h2><span class="experiment-tag">Illustrative study summaries</span></div>
      <div class="inference-controls">
        <div><label for="p-n">People per study <output id="p-n-value" for="p-n"></output></label><input id="p-n" type="range" min="200" max="3200" step="50" value="200"></div>
        <div><label for="p-estimate">Estimated difference <output id="p-estimate-value" for="p-estimate"></output></label><input id="p-estimate" type="range" min="-1" max="1" step="0.01" value="0.35"></div>
      </div>
      <div class="paired-inference">
        <div><p class="plot-heading">Outcome units</p><div id="precision-interval"></div></div>
        <div><p class="plot-heading">Distance from zero in SE units</p><div id="precision-null-plot"></div></div>
      </div>
      <div id="precision-result" class="p-readout" aria-live="polite"></div>
      <p id="precision-note" class="small" role="status"></p>
      <p class="inference-prompt">The interval narrows. The effect need not grow.</p>
      <details><summary>What is held fixed?</summary>
        <p>This compares illustrative study summaries, not newly simulated datasets. Outcome spread and treatment proportions stay fixed; the standard error scales as 1/√n. Moving the second slider changes the estimated difference.</p>
        <p>Zero sits on the matching 95% interval boundary at p = 0.05. Moving past it changes neither the effect's magnitude nor its practical importance abruptly.</p>
        <p><a href="glossary/#confidence-interval">Confidence intervals</a> and <a href="glossary/#standard-error">standard errors</a> are explored in the <a href="?lesson=uncertainty">uncertainty lesson</a>.</p>
      </details>
    </section>
    <details id="p-caveats"><summary>What a p-value does not mean</summary>
      <ul><li>It is not the probability that the null hypothesis is true.</li><li>It is not the probability that the result happened “by chance.” It is a probability of results at least as extreme under a specified model.</li><li>A small p-value does not establish causality, practical importance, or which assumption is wrong.</li><li>A large p-value does not establish no effect. An imprecise study can leave substantial effects compatible with its data.</li><li>Trying many analyses and reporting the smallest p-value undermines its usual interpretation. The analysis and reporting choices matter.</li></ul>
    </details>
    <section class="panel inference-check" aria-labelledby="p-check-title">
      <h2 id="p-check-title">Check your interpretation</h2>
      <p>Two studies both estimate +0.35 outcome units. The larger study has a narrower interval and a smaller p-value. What changed?</p>
      <button data-answer="0" aria-pressed="false">The larger study estimated a bigger treatment effect.</button>
      <button data-answer="1" aria-pressed="false">The estimated magnitude stayed the same; the larger study estimated it more precisely.</button>
      <button data-answer="2" aria-pressed="false">The smaller p-value proves the result is causal.</button>
      <p id="p-feedback" role="status"></p>
    </section>
    <details><summary>Assumptions, calculation, and sources</summary>
      <p>The test is z = (mean treated − mean untreated) / SE, with SE = √(s₁²/n₁ + s₀²/n₀). Its two-sided p-value is P(|Z| ≥ |z|) for a standard normal Z. The matching 95% interval is estimate ± 1.96 × SE. Both are large-sample approximations, requiring independent people and adequate group sizes.</p>
      <p>The null studies set the causal effect to zero. The observed-study generator sets it to 0.1; this value is not used in its estimate, SE, or p-value. Randomization makes the population outcome difference equal the causal effect here. With confounding, a test of zero outcome difference need not test zero causal effect.</p>
      <p>Exactly at p = 0.05, zero lies on the matching 95% interval boundary. The relation need not hold for an interval and test based on different methods or assumptions.</p>
      <ul><li><a href="https://link.springer.com/article/10.1007/s10654-016-0149-3">Greenland et al. (2016), Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations</a></li><li><a href="https://link.springer.com/article/10.1186/s12874-020-01105-9">Rafi & Greenland (2020), Compatibility and surprise</a></li></ul>
    </details>
    <nav class="actions" aria-label="Continue learning"><a href="?lesson=uncertainty">← Return to uncertainty</a><button id="restart">Restart lesson</button><a class="primary" href="inverse-probability-weighting/">Continue: Adjustment with IPW →</a></nav>
  </main>
</div>`;z();o("lesson_started",{lesson:"p-values"});const t=e=>document.getElementById(e),d=e=>Math.max(230,t(e).clientWidth);let p=[],h=0,k=l.seed,i=c({...l,effect:.1});const C=i.se;let f=!1;function L(e){return e.status==="ok"?`<div class="observed-chain"><div><span>Observed estimate</span><strong>${n(e.estimate)}</strong></div><span aria-hidden="true">÷</span><div><span>Standard error</span><strong>${n(e.se)}</strong></div><span aria-label="approximately">≈</span><div><span>SEs from zero (z)</span><strong>${n(e.z)}</strong></div></div>`:`<p>Unavailable: ${e.reason}</p>`}function b(e){return`95% interval ${e.lower<=0&&e.upper>=0?"includes":"excludes"} zero · p ${u(e.p)}.`}function r(){const e=f&&i.status==="ok"?i:null;t("null-plot").innerHTML=v(p,e,d("null-plot")),t("observed-result").innerHTML=L(i),t("compare-observed").disabled=i.status!=="ok",t("p-interpretation").hidden=!e,t("observed-p").hidden=!e,e&&(t("observed-p").innerHTML=`<strong>p ${u(i.p)}</strong><span>Combined shaded tails</span>`,t("observed-interval-note").textContent=b(i))}function m(){const e=Number(t("p-n").value),s=Number(t("p-estimate").value),a=S(s,C*Math.sqrt(200/e));t("p-n-value").textContent=e,t("p-estimate-value").textContent=n(s),t("precision-interval").innerHTML=y(a,{domain:[-1.6,1.6],width:d("precision-interval")}),t("precision-result").innerHTML=`<strong>p ${u(a.p)}</strong><span>Estimate ${n(s)} · SE ${n(a.se)}</span>`,t("precision-null-plot").innerHTML=v([],a,d("precision-null-plot")),t("precision-note").textContent=b(a)+(Math.abs(a.z)>4?" The observed statistic is beyond the plotted range; the p-value includes the full tails.":"")}t("repeat-null").addEventListener("click",()=>{p=Array.from({length:100},(a,g)=>c({...l,effect:0,seed:2e4+h*100+g})),h+=1;const e=p.filter(a=>a.status==="ok"),s=e.filter(a=>a.p<.05).length;t("null-summary").textContent=`${s} of ${e.length} zero-effect studies have p < 0.05.${100-e.length?` ${100-e.length} unavailable.`:""}`,t("repeat-null").textContent="Run another 100 null studies",r(),o("simulation_run",{lesson:"p-values",action:"repeat-null"})});t("compare-observed").addEventListener("click",()=>{f=!0,r()});t("redraw-observed").addEventListener("click",()=>{i=c({...l,effect:.1,seed:++k}),r(),o("simulation_run",{lesson:"p-values",action:"redraw"})});for(const e of["p-n","p-estimate"])t(e).addEventListener("input",m);t("restart").addEventListener("click",()=>location.reload());for(const e of document.querySelectorAll("[data-answer]"))e.addEventListener("click",()=>{const s=Number(e.dataset.answer);for(const a of document.querySelectorAll("[data-answer]"))a.setAttribute("aria-pressed",String(a===e));t("p-feedback").textContent=["Both estimates are +0.35. A smaller p-value can result from a smaller standard error without a larger estimated effect. Try again.","Yes. The effect estimates are identical, while precision differs. Neither the p-value nor the interval width determines practical importance.","The p-value describes compatibility with a statistical model. It does not establish that confounding or other biases are absent. Try again."][s],E("p-values-precision","p-values",s,s===1),o("lesson_prediction_submitted",{lesson:"p-values",selected_choice_index:s,is_correct:s===1})});window.addEventListener("resize",()=>{r(),m()});r();m();
