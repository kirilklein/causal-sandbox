/* empty css                          */import{a as L,p as k,b as M,c as $}from"./propensity-view-DYrk0wj0.js";import{t as E}from"./theme-Vjupx5_i.js";import{i as S}from"./brand--vQh_tom.js";import{l as W,s as I}from"./lesson-navigation-D3qgvbW9.js";import{m as j,f as F,E as H}from"./simulation-BOxkiD6q.js";import"./glossary-Cn9xhfdQ.js";import"./foundations-progress-CLDiwUAt.js";const l=Math.sqrt(3),A={seed:4217,age:.8,severity:.8};function O({seed:n,age:a,severity:r}){return j(400,n).map((s,d)=>{const i=1/(1+Math.exp(.4-a*s.C1-r*s.C2)),c=+(s.a<i);return{person:d+1,C1:s.C1,C2:s.C2,age:60+20*s.C1/l,severity:5+5*s.C2/l,A:c,Y:2*c+.8*s.C1+1.2*s.C2+s.eY,jitter:s.jitter}})}function N(n){const[a,r,s]=n;return[.2,.5,.8].flatMap(d=>{const i=Math.log(d/(1-d))-a,c=[],g=(o,f)=>{Math.abs(o)>l+1e-9||Math.abs(f)>l+1e-9||c.some(x=>Math.hypot(x.C1-o,x.C2-f)<1e-8)||c.push({C1:o,C2:f})};for(const o of[-l,l])Math.abs(s)>1e-10&&g(o,(i-r*o)/s),Math.abs(r)>1e-10&&g((i-s*o)/r,o);return c.length===2?[{p:d,points:c}]:[]})}document.querySelector("#app").innerHTML=`<div class="instrument-page ps-page">
  <header><a class="brand" href="./">${S}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${E()}</header>
  <main>
    ${W({currentOptional:"propensity-score"})}
    <p class="eyebrow">OPTIONAL · FOUNDATIONS</p>
    <h1 tabindex="-1">Where do propensity scores come from?</h1>
    <p class="intro">How likely was someone with these characteristics to receive treatment? A propensity score puts that chance on a scale from 0 to 100%.</p>
    <section class="panel" aria-labelledby="ps-question">
      <h2 id="ps-question">Who receives treatment?</h2>
      <p>Age and baseline severity can affect both treatment and outcome in this separate fictional cohort. Each mark is one person. Select someone to inspect their profile.</p>
      <p>Fit logistic regression using age, severity, and treatment received (yes/no) for all 400 people. It predicts a treatment probability for each profile. Outcomes are not used in this fit.</p>
      <div class="ps-fit-actions"><button id="ps-fit" class="primary">Fit treatment model</button><span id="ps-fit-status" class="small" role="status"></span></div>
      ${L}
      <div id="ps-controls" hidden>
        <h3>How treatment is assigned</h3>
        <div class="ps-controls">
          <div><label for="ps-age">Age influence <output id="ps-age-value" for="ps-age"></output></label><input id="ps-age" type="range" min="-2" max="2" step="0.1" value="0.8"/></div>
          <div><label for="ps-severity">Severity influence <output id="ps-severity-value" for="ps-severity"></output></label><input id="ps-severity" type="range" min="-2" max="2" step="0.1" value="0.8"/></div>
        </div>
        <p class="small">Positive values favor treating older or more severe patients; negative values reverse that pattern. Change either influence: patient positions stay fixed, treatment updates, and the model refits.</p>
      </div>
      <div class="ps-explore">
        <div><div id="ps-scatter"></div><p id="ps-contour-note" class="small" hidden>Dashed lines connect profiles with the same estimated treatment probability. They are fitted from this sample.</p></div>
        <aside class="ps-person" aria-label="Selected person">
          <label class="ps-person-label" for="ps-person">Inspect a person <select id="ps-person"></select></label>
          <dl><dt>Age (C₁)</dt><dd id="ps-person-age"></dd><dt>Severity (C₂)</dt><dd id="ps-person-severity"></dd><dt>Observed treatment</dt><dd id="ps-person-arm"></dd></dl>
          <div id="ps-person-prediction" class="ps-probability" aria-live="polite"></div>
        </aside>
      </div>
      <details><summary>What does fitting do?</summary>
        <p>The model learns an intercept and a coefficient for each characteristic. It chooses them to make the observed yes/no treatments more likely under the model. A logistic transformation converts their combined value into a probability between 0 and 1.</p>
        <p>The assignment sliders define this fictional world; the fitted coefficients are estimated from its data. They will usually differ slightly. With both influences at zero, the true probability is constant, but a finite sample can still give small fitted slopes.</p>
        <p><code>p̂ = 1 / (1 + exp(−(b₀ + b₁C₁ + b₂C₂)))</code></p>
        <p class="small">For fitting, age and severity are centered and scaled. This changes the coefficient units, not the profiles or probabilities. This additive logistic model matches the assignment mechanism here. If age’s influence on log odds depended on severity, it would need an age × severity interaction.</p>
      </details>
      <section id="ps-score-section" class="ps-score-section" aria-labelledby="ps-score-heading" hidden>
        <h2 id="ps-score-heading">Two characteristics → one estimated probability</h2>
        <div id="ps-scores"></div>
        <p class="small">The same 400 people, arranged by fitted score and observed treatment. Vertical spread within each row only separates the marks.</p>
        <p>Strengthen both influences to see the treatment groups separate on this scale. Where one group becomes sparse, comparable people receiving that treatment are harder to find: the overlap problem.</p>
        <div id="ps-weight" class="ps-weight" aria-live="polite"></div>
        <p class="small">This is the basic, unclipped weight. Calculating propensity scores alone has not balanced the groups or estimated a treatment effect. Similar scores also do not mean identical age and severity.</p>
      </section>
      <div class="actions"><button id="ps-redraw">Redraw sample</button><button id="ps-reset">Restart lesson</button><span id="ps-sample" class="small"></span></div>
    </section>
    <details><summary>What can this score tell us?</summary>
      <p>The score describes treatment receipt given the measured characteristics in this study. It is not a person's chance of benefiting from treatment or having a good outcome. A person can receive no treatment even when their predicted treatment probability is high.</p>
      <p>Using scores for causal adjustment requires a defensible adjustment set and adequate overlap. A fitted-score plot cannot show that confounding has been controlled. The <a href="?lesson=overlap">overlap lesson</a> examines sparse comparisons and extreme weights.</p>
      <p><a href="https://academic.oup.com/biomet/article-abstract/70/1/41/240879">Rosenbaum & Rubin (1983), The central role of the propensity score</a></p>
    </details>
    <p>Choosing the right covariates is only one step. <a href="?lesson=misspecification">When a model is too simple</a> explores what happens when a fitted model misses the shape of their relationship.</p>
    <nav class="actions" aria-label="Continue learning"><a class="primary" href="?lesson=ipw">← Return to IPW</a><a href="?lesson=outcome-regression">Continue: Outcome regression →</a></nav>
  </main>
</div>`;I();const t=n=>document.getElementById(n);let u={...A},v=!1,m,h,b="";function w(){const n=Math.max(250,t("ps-scatter").clientWidth),a=n<400?235:295,r=e=>45+(e+l)/(2*l)*(n-65),s=e=>a-(e+l)/(2*l)*(a-35),d=Number(t("ps-person").value),i=m.find(e=>e.person===d),c=e=>m.filter(p=>p!==i).map(p=>M(p,...e(p))).join("")+M(i,...e(i),!0),g=h?N(h.beta):[];if(t("ps-contour-note").textContent=g.length?"Dashed lines connect profiles with the same estimated treatment probability. They are fitted from this sample.":"The fitted probabilities do not cross the 20%, 50%, or 80% reference levels in this view. Inspect a person for their score.",t("ps-scatter").innerHTML=`<svg class="ps-chart" viewBox="0 0 ${n} ${a+55}" role="img" aria-label="Age versus baseline disease severity. Select a person using a mark or the Inspect a person selector.">
    ${[-l,0,l].map((e,p)=>`<path class="ps-grid" d="M45 ${s(e)}H${n-20}M${r(e)} 35V${a}"/><text x="35" y="${s(e)+4}" text-anchor="end">${p*5}</text><text x="${r(e)}" y="${a+22}" text-anchor="middle">${40+p*20}</text>`).join("")}
    <text x="${r(0)}" y="${a+47}" text-anchor="middle">Age (years)</text><text x="45" y="17">Baseline severity (0–10)</text>
    ${g.map(({points:[e,p]})=>`<path class="ps-curve" d="M${r(e.C1)} ${s(e.C2)}L${r(p.C1)} ${s(p.C2)}"/>`).join("")}
    ${c(e=>[r(e.C1),s(e.C2)])}
    ${g.map(({p:e,points:[p,T]})=>`<text class="ps-contour-label" x="${r(p.C1*.8+T.C1*.2)}" y="${s(p.C2*.8+T.C2*.2)-7}" text-anchor="middle">${e*100}%</text>`).join("")}
  </svg>`,t("ps-person-age").textContent=`${i.age.toFixed(1)} years`,t("ps-person-severity").textContent=`${i.severity.toFixed(1)} / 10`,t("ps-person-arm").textContent=i.A?"Treated":"Untreated",t("ps-person-prediction").innerHTML=h?`<span class="small">Estimated probability of treatment</span><strong>${$(i.p)}</strong><p class="small">For profiles like this, the model predicts about ${$(i.p)} would receive treatment. This person ${i.A?"did":"did not"}.</p>`:`<p class="small">${b||"We know what this person received. Fit the model to estimate how likely treatment was for their profile."}</p>`,!h){t("ps-scores").innerHTML="",t("ps-weight").innerHTML="";return}const o=Math.max(250,t("ps-scores").clientWidth),f=e=>80+e*(o-100),x=o<400?[0,.5,1]:[0,.25,.5,.75,1];t("ps-scores").innerHTML=`<svg class="ps-chart" viewBox="0 0 ${o} 162" role="img" aria-label="Estimated treatment probabilities for the same people, separated into untreated and treated rows.">
    <text x="5" y="44">Untreated</text><text x="5" y="100">Treated</text>
    ${x.map(e=>`<path class="ps-grid" d="M${f(e)} 18V118"/><text x="${f(e)}" y="137" text-anchor="middle">${e*100}%</text>`).join("")}
    ${c(e=>[f(e.p),40+56*e.A+(e.jitter-.5)*24])}
    <text x="${o/2}" y="159" text-anchor="middle">Estimated treatment probability</text>
  </svg>`;const C=i.A?i.p:1-i.p;t("ps-weight").innerHTML=`<strong>Person ${i.person}: from probability to weight</strong><p>This ${i.A?"treated":"untreated"} person's estimated chance of ${i.A?"receiving treatment":"receiving no treatment"} is ${$(C)}${i.A?"":` (100% − ${$(i.p)})`}. Their weight from the IPW formula is <strong>1 / ${C.toPrecision(3)} ≈ ${(1/C).toFixed(2)}</strong>.</p>`}function y(n=!1){if(m=O(u),h=void 0,b="",v)try{h=F(m,["C"]),m=m.map((a,r)=>({...a,p:h.propensities[r]}))}catch(a){if(!(a instanceof H))throw a;b="The treatment model could not be fitted. Reduce the influences or redraw the sample."}if(n){t("ps-person").innerHTML=k(m);const a=m.filter(s=>!s.A),r=a.reduce((s,d)=>d.C1+d.C2>s.C1+s.C2?d:s,a[0]||m[0]);t("ps-person").value=r.person}for(const a of["age","severity"])t(`ps-${a}`).value=u[a],t(`ps-${a}-value`).textContent=u[a].toFixed(1);t("ps-fit").textContent=b?"Model unavailable · adjust controls":v?"Model fitted · updates automatically":"Fit treatment model",t("ps-fit").setAttribute("aria-disabled",String(v)),t("ps-fit-status").textContent=b||(h?"Estimated from this sample using age and severity.":""),t("ps-controls").hidden=!v,t("ps-contour-note").hidden=!h,t("ps-score-section").hidden=!h,t("ps-sample").textContent=`400 people · Sample seed ${u.seed}`,w()}t("ps-person").addEventListener("change",w);for(const n of["ps-scatter","ps-scores"])t(n).addEventListener("click",a=>{const r=a.target.closest("[data-patient]");r&&(t("ps-person").value=r.dataset.patient,w())});t("ps-fit").addEventListener("click",()=>{v||(v=!0,y())});for(const n of["age","severity"])t(`ps-${n}`).addEventListener("input",a=>{u[n]=Number(a.target.value),y()});t("ps-redraw").addEventListener("click",()=>{u.seed++,y(!0)});t("ps-reset").addEventListener("click",()=>{u={...A},v=!1,y(!0)});y(!0);window.addEventListener("resize",w);
