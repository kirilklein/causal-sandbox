/* empty css                          */import{f as u,i as z,o as R,r as E,b as I,a as W,c as B}from"./uncertainty-view-3ZI8jWfc.js";import{t as H,k as D}from"./theme-Vjupx5_i.js";import{i as _}from"./brand--vQh_tom.js";import{c as l}from"./events-B779v5TJ.js";import{l as F,s as O,r as N,a as P,b as U}from"./lesson-navigation-D3qgvbW9.js";import{u as g,c as A,a as q,b as j,d as G}from"./uncertainty-WO1XxuBT.js";import"./glossary-Cn9xhfdQ.js";import"./simulation-BOxkiD6q.js";import"./foundations-progress-CLDiwUAt.js";import"./lesson-simulation-DgNFmLuF.js";document.title="How uncertain is this estimate? — Causal Sandbox";document.querySelector("#app").innerHTML=`<div class="instrument-page inference-page">
  <header class="lesson-header"><a class="brand" href="./">${_}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${H()}</header>
  <main class="learning">
    ${F({position:D.findIndex(([,t])=>t==="uncertainty")})}
    <p class="eyebrow">ONE STUDY · REPEATED STUDIES · LIMITS</p>
    <h1 tabindex="-1">How uncertain is this estimate?</h1>
    <p class="intro">A study estimates an effect—but is it distinguishable from zero?</p>
    <section id="opening-section" class="panel" aria-labelledby="opening-title">
      <div class="experiment-heading"><h2 id="opening-title">Is there an effect?</h2><span class="experiment-tag">Illustrative study summaries</span></div>
      <div id="opening-plot"></div>
      <p id="opening-prompt" class="inference-prompt" role="status"></p>
      <div class="actions"><button id="opening-next">Compare a larger estimate →</button></div>
      <div id="opening-conclusion" hidden>
        <p><strong>A excludes zero. B is compatible with zero.</strong> Distance from zero alone was not enough; we needed the uncertainty interval.</p>
        <p class="small">Including zero does not prove no effect. These interpretations depend on the analysis assumptions.</p>
        <a href="#single-title">What does 95% confidence mean? ↓</a>
      </div>
    </section>
    <section id="single-section" class="panel" aria-labelledby="single-title" hidden>
      <div class="experiment-heading"><h2 id="single-title" tabindex="-1">What does 95% confidence mean?</h2><span id="sampling-world" class="experiment-tag">Randomized · 200 people per study</span></div>
      <div class="plot-legend"><span>● Estimate + 95% interval</span><span class="legend-truth">┊ True effect: 2</span><span class="legend-miss">╌ Misses the true effect</span></div>
      <div class="inference-controls">
        <div><label for="uncertainty-n">People per study <output id="uncertainty-n-value" for="uncertainty-n">200</output></label><input id="uncertainty-n" type="range" min="200" max="3200" step="200" value="200" aria-describedby="precision-summary"></div>
        <div id="confounding-control" hidden><label><input id="uncertainty-confounded" type="checkbox"> Add confounding: risk score also affects treatment</label></div>
      </div>
      <p id="precision-summary" class="small" role="status"></p>
      <div class="sampling-stage">
        <div id="single-plot"></div>
        <p id="sampling-prompt"><span>New sample. New estimate.<br>Does its interval cross the line?</span></p>
      </div>
      <div class="actions"><button id="reveal-coverage" class="primary">Repeat to 100 samples →</button><button id="uncertainty-redraw">Start with a new sample</button></div>
      <p id="sampling-progress" class="small"></p>
      <div id="coverage-section" hidden>
        <div id="coverage-summary" role="status"></div>
        <p id="coverage-takeaway" class="inference-prompt"></p>
        <p id="precision-takeaway" class="small"></p>
      </div>
      <details><summary>What changes—and what stays fixed?</summary>
        <div id="precision-dag"></div><p id="precision-world" class="small"></p>
        <p>Move the slider to change the number of people in every plotted study. Study seeds, the axis, and the true effect of 2 stay fixed. Larger samples usually narrow intervals; they do not remove confounding.</p>
        <p>Under confounding, these intervals describe the population association and can miss the causal effect. The analysis remains an unadjusted mean difference.</p>
      </details>
      <details><summary>Where does the interval come from?</summary>
        <p>A <a href="glossary/#standard-error">standard error</a> estimates how much this estimate would vary across samples. It uses outcome variation and the number of people in each group.</p>
        <p><strong>95% interval ≈ estimate ± 1.96 × standard error.</strong> This is a large-sample normal approximation. <code>SE = √(s₁²/n₁ + s₀²/n₀)</code>, where s is each group's outcome SD and n its size.</p>
        <p>Outcome SD describes differences among people; SE describes sampling uncertainty in an estimate. A <a href="glossary/#confidence-interval">confidence interval</a> is not a range of individual outcomes or treatment effects.</p>
        <p id="single-result" class="small"></p><p id="uncertainty-sample" class="small"></p>
      </details>
      <details><summary>Why not exactly 95%?</summary>
        <p>The percentage varies from batch to batch. The 95% describes the interval procedure's long-run coverage, not the probability that the fixed effect lies inside one observed interval.</p>
        <p>Each row is a fresh population sample with its own standard error. All 100 intervals remain on the graph. Arrows mark bounds beyond the fixed axis. We know the true effect here because this is a simulation.</p>
      </details>
    </section>
    <details id="bootstrap" class="panel"><summary>Optional: reuse the people you already have</summary>
      <h2>One study → resample → estimate</h2>
      <p class="small">A <a href="glossary/#bootstrap">bootstrap</a> redraws people with replacement. This separate experiment keeps its source study at 200 people.</p>
      <div class="inference-controls"><label><input id="bootstrap-confounded" type="checkbox"> Use a confounded study</label></div>
      <p id="bootstrap-source" class="small"></p>
      <div class="plot-legend"><span>Original → resample</span><span>First 6 of 200 people</span><span class="arm-key-0">○ Untreated</span><span class="arm-key-1">□ Treated</span></div>
      <div id="bootstrap-trace"></div>
      <div class="actions"><button id="draw-bootstrap">Draw one resample</button><button id="run-bootstrap" class="primary" disabled>Show 10 resamples →</button><button id="finish-bootstrap" hidden>Build to 1,000</button></div>
      <p id="bootstrap-counts" class="small" role="status"></p><p id="bootstrap-error" role="status"></p>
      <div id="bootstrap-results" hidden>
        <div id="bootstrap-plot"></div>
        <div class="plot-legend"><span>│ Observed estimate</span><span class="legend-truth">┊ Causal effect: 2</span><span>● First resample</span></div>
        <div id="bootstrap-summary" aria-live="polite"></div>
        <h3>Does the SE estimate settle down?</h3>
        <div id="bootstrap-se-plot"></div>
        <div class="plot-legend"><span>─ Running bootstrap SE</span><span>╌ Formula SE reference</span></div>
        <p class="small">Each point uses all resamples so far. More resamples stabilize the SE estimate; they do not make this study more precise.</p>
        <p id="bootstrap-takeaway" class="inference-prompt"></p>
      </div>
      <details><summary>What the bootstrap tells us</summary>
        <ul>
          <li>The spread estimates sampling uncertainty. More resamples stabilize that estimate; they add no new people.</li>
          <li>The formula SE is a reference, not an exact convergence target. Resampling the finite observed groups can give a slightly different limiting SE. The running estimate can rise or fall as resamples are added.</li>
          <li>Resampling does not repair confounding or selection bias. It must preserve dependence, such as clusters or repeated observations.</li>
          <li>This distribution follows the observed estimate. The <a href="?lesson=p-values">p-value lesson</a> uses a zero-effect null distribution.</li>
        </ul>
        <p><a href="https://arxiv.org/abs/1411.5279">Hesterberg: What Teachers Should Know about the Bootstrap</a>.</p>
      </details>
    </details>
    <details id="uncertainty-caveats"><summary>What this interval does—and does not—tell us</summary>
      <p>Its width measures precision for this target and method. It does not automatically account for unmeasured confounding, selection bias, measurement error, or choosing an analysis after seeing its results. A narrow interval does not establish causality.</p>
      <p>It is not an interval containing 95% of future study estimates, nor 95% of people's treatment effects. A Bayesian credible interval answers a different probability question using a model and prior distribution.</p>
      <p>Including zero does not establish no effect. For example, an estimate of +2 with an interval from −1 to +5 leaves room for a small negative effect and a substantial positive one under the analysis assumptions. Excluding zero does not establish practical importance. Values just outside a boundary are not suddenly impossible.</p>
      <p>These intervals assume independent people, adequate group sizes, and finite outcome variances. Clustered or repeated observations need an analysis that accounts for their dependence. Other causal estimators need their own uncertainty calculations.</p>
    </details>
    <section id="uncertainty-check" class="panel inference-check" aria-labelledby="uncertainty-check-title" hidden>
      <h2 id="uncertainty-check-title">Check your interpretation</h2>
      <p>A large observational study reports an effect of +2.0, with a narrow interval from +1.9 to +2.1. A common cause was not measured. What does the interval establish?</p>
      <button data-answer="0" aria-pressed="false">There is a 95% chance the causal effect is between 1.9 and 2.1.</button>
      <button data-answer="1" aria-pressed="false">The estimate is precise under the analysis assumptions; confounding can still distort it.</button>
      <button data-answer="2" aria-pressed="false">The large sample has removed the confounding.</button>
      <p id="uncertainty-feedback" role="status"></p>
    </section>
    <details><summary>Sources and simulation details</summary>
      <p>This reuses the common-cause lesson's world: C is a bounded risk score with variance 1; Y = 2A + 1.5C + independent noise. Treatment probability is logistic(−0.8 + selection × C), with selection 0 or 1.2. Everyone's treatment effect is 2. The analysis uses only treatment and observed outcome.</p>
      <ul><li><a href="https://miguelhernan.org/whatifbook">Hernán & Robins, Causal Inference: What If, Chapter 10: Random variability</a></li>
      <li><a href="https://link.springer.com/article/10.1007/s10654-016-0149-3">Greenland et al. (2016), A guide to statistical misinterpretations</a></li>
      <li><a href="https://www.bmj.com/content/331/7521/903">Altman & Bland (2005), Standard deviations and standard errors</a></li>
      <li><a href="https://link.springer.com/article/10.1186/s12874-020-01105-9">Rafi & Greenland (2020), Compatibility and surprise</a></li></ul>
    </details>
    <nav class="actions" aria-label="Continue learning"><a id="back" href="?lesson=confounding">← Back</a><button id="restart">Restart lesson</button><a id="continue" class="primary" href="inverse-probability-weighting/">Continue: Adjustment with IPW →</a></nav>
    <aside class="panel" aria-label="Optional exploration"><p class="small">Optional exploration</p><h2><a id="p-values-link" href="?lesson=p-values">What does a p-value tell us? →</a></h2><p>Compare an observed result with a zero-effect world, then connect the tail probability to its interval.</p></aside>
    <aside class="panel" aria-label="Optional ratio exploration"><h2><a href="?lesson=delta-method">How uncertain is revenue per order? →</a></h2><p>See why an A/B test needs uncertainty for a ratio, then compare Delta and bootstrap intervals.</p></aside>
  </main>
</div>`;O();N("uncertainty");l("lesson_started",{lesson:"uncertainty"});const e=t=>document.getElementById(t),v=t=>Math.max(230,e(t).clientWidth);let s={...q},r=g(s),n=[r],w,m=!1,Y=12e3;const K=window.matchMedia("(prefers-reduced-motion: reduce)");let d=0;function x(){e("opening-plot").innerHTML=R(d,v("opening-plot")),e("opening-prompt").textContent=["Close to zero. Is that enough to say there is no effect?","Farther from zero. Is that enough to say there is an effect?","Now include uncertainty: which interval crosses zero?"][d],e("opening-next").textContent=d===0?"Compare a larger estimate →":"Reveal 95% intervals →",e("opening-next").hidden=d===2,e("opening-conclusion").hidden=d!==2,e("single-section").hidden=d!==2}e("opening-next").addEventListener("click",()=>{d++,x(),c(),l("simulation_run",{lesson:"uncertainty",action:d===1?"compare-estimates":"reveal-intervals"})});function c(){e("single-result").textContent=r.status==="ok"?`Estimate ${u(r.estimate)} · SE ${u(r.se)} · outcome units`:`Unavailable: ${r.reason}`,e("single-plot").innerHTML=z(n,{truth:!0,width:v("single-plot"),rowGap:3.5,maxRows:100,fixedRows:100});const t=A(n);e("sampling-progress").textContent=`${n.length} / 100 samples · ${t.covered} ${t.covered===1?"crosses":"cross"} the line${t.unavailable?` · ${t.unavailable} unavailable`:""}`,e("sampling-prompt").hidden=n.length>1||m,e("sampling-progress").hidden=n.length===100&&!m,e("single-plot").setAttribute("aria-busy",String(m)),e("uncertainty-sample").textContent=`${s.n} people · sample seed ${r.seed}`,e("sampling-world").textContent=`${s.selection?"Confounded":"Randomized"} · ${s.n} people per study`;const a=n.filter(h=>h.status==="ok"),o=a.reduce((h,b)=>h+b.upper-b.lower,0)/a.length;e("precision-summary").textContent=a.length?`${a.length===1?"Interval width":"Average interval width"}: ${u(o)} outcome units`:"Interval width unavailable."}function $(){const t=A(n),a=t.valid?Math.round(100*t.covered/t.valid):0;e("coverage-summary").innerHTML=`<div class="coverage-readout"><strong>${a}%</strong><span>${t.covered} of ${t.valid} intervals crossed the line${t.unavailable?` · ${t.unavailable} unavailable`:""}.</span><div class="coverage-bar" aria-hidden="true"><span style="width:${a}%"></span></div></div>`,e("coverage-takeaway").textContent=s.selection?"Narrow intervals can miss the causal effect when treatment is confounded.":"About 95% in the long run—under the assumptions.",e("precision-takeaway").textContent="Move the sample-size slider: more people usually narrow the intervals, but do not remove confounding."}function V(){m=!1,cancelAnimationFrame(w),c(),$(),e("coverage-section").hidden=!1,e("confounding-control").hidden=!1,e("uncertainty-check").hidden=!1,e("uncertainty-n").disabled=!1,e("uncertainty-confounded").disabled=!1,e("reveal-coverage").textContent="Run another 100 samples",e("reveal-coverage").disabled=!1,e("uncertainty-redraw").disabled=!1}function J(){if(m)return;n=[r];const t=[r,...Array.from({length:99},()=>g({...s,seed:Y++}))];m=!0,e("uncertainty-n").disabled=!0,e("uncertainty-confounded").disabled=!0,e("coverage-section").hidden=!0,e("reveal-coverage").hidden=!1,e("reveal-coverage").disabled=!0,e("reveal-coverage").textContent="Drawing samples…",e("uncertainty-redraw").disabled=!0,c();const a=performance.now();function o(h){const b=Math.max(0,Math.min(1,(h-a)/2800)),y=K.matches?100:1+Math.floor(99*b**3);y!==n.length&&(n=t.slice(0,y),c()),y===100?V():w=requestAnimationFrame(o)}w=requestAnimationFrame(o),l("simulation_run",{lesson:"uncertainty",action:"repeat-studies"})}function L(){e("precision-dag").innerHTML=B(!!s.selection),e("precision-world").textContent=s.selection?"C confounds the comparison. Analysis: no adjustment.":"Randomized treatment. Analysis: no adjustment."}function M(){s.n=Number(e("uncertainty-n").value),s.selection=e("uncertainty-confounded").checked?1.2:0,e("uncertainty-n-value").textContent=s.n,n=n.map(t=>g({...s,seed:t.seed})),r=n[0],L(),c(),n.length===100&&$()}let f,p,i=0,S=7300;function C(){const t=e("bootstrap-confounded").checked?1.2:0;f=j({selection:t,seed:s.seed}),p=null,i=0,S=7300,e("bootstrap-results").hidden=!0,e("bootstrap-error").textContent="",e("bootstrap-counts").textContent="",e("draw-bootstrap").textContent="Draw one resample",e("run-bootstrap").disabled=!0,e("run-bootstrap").textContent="Show 10 resamples →",e("finish-bootstrap").hidden=!0;const a=f.filter(o=>o.A===1).length;e("bootstrap-source").textContent=`200 people · ${a} treated · ${200-a} untreated`,e("bootstrap-trace").innerHTML=E(f)}function k(){if(!p)return;const t=p;e("bootstrap-trace").innerHTML=E(f,t.firstCounts);const a=t.firstCounts.filter(o=>o>0).length;e("bootstrap-counts").textContent=`First resample: 200 draws · ${a} different people · ${200-a} omitted · estimate ${u(t.estimates[0])}.`,e("bootstrap-results").hidden=i<10,e("run-bootstrap").disabled=i>=1e3,e("run-bootstrap").textContent=i<10?"Show 10 resamples →":i>=1e3?"1,000 resamples complete":"Add 10 resamples",e("finish-bootstrap").hidden=i<20||i>=1e3,!(i<10)&&(e("bootstrap-plot").innerHTML=I(t,v("bootstrap-plot")),e("bootstrap-se-plot").innerHTML=W(t,v("bootstrap-se-plot")),e("bootstrap-summary").innerHTML=`<div class="inference-result"><div><span>Spread of ${i.toLocaleString("en-US")} estimates<br>Bootstrap SE</span><strong>${u(t.se)}</strong></div><div><span>Formula SE<br>Same observed study</span><strong>${u(t.observed.se)}</strong></div></div><p class="small">Same 200 people · fixed −1 to 5 axis</p>`,e("bootstrap-takeaway").textContent=e("bootstrap-confounded").checked?"Resampling reuses the imbalance.":"More resamples stabilize the shape. They do not add new people.")}function T(t){if(p=G(f,{seed:S,repetitions:t}),p.status!=="ok"){e("bootstrap-error").textContent=`Unavailable: ${p.reason}`,p=null;return}i=t,e("draw-bootstrap").textContent="Start with a new resample",e("run-bootstrap").disabled=!1,k()}e("bootstrap-confounded").addEventListener("change",C);e("draw-bootstrap").addEventListener("click",()=>{i&&S++,T(1),l("simulation_run",{lesson:"uncertainty",action:"bootstrap-draw"})});e("run-bootstrap").addEventListener("click",()=>{T(Math.min(1e3,i<10?10:i+10)),l("simulation_run",{lesson:"uncertainty",action:"bootstrap-add-ten"})});e("finish-bootstrap").addEventListener("click",()=>{T(1e3),l("simulation_run",{lesson:"uncertainty",action:"bootstrap",confounded:e("bootstrap-confounded").checked})});e("bootstrap").addEventListener("toggle",()=>{e("bootstrap").open&&k()});location.hash==="#bootstrap"&&(e("bootstrap").open=!0,e("bootstrap").querySelector("summary").focus());C();e("uncertainty-redraw").addEventListener("click",()=>{r=g({...s,seed:++s.seed}),n=[r],e("coverage-section").hidden=!0,e("reveal-coverage").textContent="Repeat to 100 samples →",c(),C(),l("simulation_run",{lesson:"uncertainty",action:"redraw"})});e("reveal-coverage").addEventListener("click",J);e("uncertainty-n").addEventListener("input",M);e("uncertainty-confounded").addEventListener("change",M);e("restart").addEventListener("click",()=>location.reload());for(const t of["continue","p-values-link"])e(t).addEventListener("click",()=>{P("uncertainty"),l("lesson_advanced",{lesson:"uncertainty"},{transport:"sendBeacon"})});for(const t of document.querySelectorAll("[data-answer]"))t.addEventListener("click",()=>{const a=Number(t.dataset.answer);for(const o of document.querySelectorAll("[data-answer]"))o.setAttribute("aria-pressed",String(o===t));e("uncertainty-feedback").textContent=["The 95% refers to coverage across repeated studies under the assumptions, not a probability for this fixed interval. Unmeasured confounding can also invalidate its causal interpretation. Try again.","Yes. Small sampling uncertainty can coexist with systematic bias. The causal interpretation still needs a defensible adjustment set.","More people reduce sampling uncertainty, but do not make the treatment groups comparable on an unmeasured common cause. Try again."][a],U("uncertainty-interpretation","uncertainty",a,a===1),l("lesson_prediction_submitted",{lesson:"uncertainty",selected_choice_index:a,is_correct:a===1})});window.addEventListener("resize",()=>{x(),c(),k()});x();c();L();
