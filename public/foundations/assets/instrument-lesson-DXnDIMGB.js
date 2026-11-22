/* empty css                          */import{t as E}from"./theme-Vjupx5_i.js";import{e as H}from"./effect-comparison-D_sRXFX7.js";import{i as P}from"./brand--vQh_tom.js";import{l as R,s as D}from"./lesson-navigation-D3qgvbW9.js";import{i as U,s as Y}from"./instrument-simulation-FFlhfKBs.js";import"./glossary-Cn9xhfdQ.js";import"./simulation-BOxkiD6q.js";import"./foundations-progress-CLDiwUAt.js";function z(s){const a=s.filter(Number.isFinite).sort((d,l)=>d-l);if(!a.length)return null;const p=d=>{const l=(a.length-1)*d,c=Math.floor(l);return a[c]+(a[Math.ceil(l)]-a[c])*(l-c)};return[p(.05),p(.95)]}function B(s){const a=Math.max(.25,...s.flat(2).filter(Number.isFinite).map(d=>Math.abs(d-2))),p=Math.ceil(a/.25)*.25;return[2-p,2+p]}function O(s,[a,p]){const d=s.map(()=>null),l=[],c=5.5,n=s.map((i,f)=>({value:i,index:f})).filter(({value:i})=>Number.isFinite(i)).sort((i,f)=>i.value-f.value);for(const{value:i,index:f}of n){const y=552*(i-a)/(p-a),u=l.filter(r=>y-r.x<c),m=[0];for(const r of u){const o=Math.sqrt(c**2-(y-r.x)**2);m.push(r.y-o,r.y+o)}m.sort((r,o)=>Math.abs(r)-Math.abs(o));const h=m.find(r=>u.every(o=>(y-o.x)**2+(r-o.y)**2>=c**2-1e-8));if(h===void 0)throw new Error("Could not place study dot");d[f]=h,l.push({x:y,y:h})}return d}function q(s,a,p,d){const[l,c]=B(s),n=r=>4+92*(r-l)/(c-l),i=s.map(r=>r.map(o=>O(o,[l,c]))),f=Math.max(1,...i.flat(2).filter(Number.isFinite).map(Math.abs)),y=Math.min(1,26/f),u=r=>{const o=a[0][r].sd,g=a[1][r].sd;if(!Number.isFinite(o)||!Number.isFinite(g)||o<=0)return"Spread comparison unavailable.";const v=Math.round(100*(g/o-1));return v===0?"Nearly the same spread (SD).":`${Math.abs(v)}% ${v>0?"more":"less"} spread with Z (SD).`},m=`<svg class="study-axis" height="40" aria-hidden="true">${Array.from({length:5},(r,o)=>{const g=l+o*(c-l)/4;return`<line x1="${n(g)}%" x2="${n(g)}%" y1="0" y2="5"/><text x="${n(g)}%" y="21" text-anchor="${o===0?"start":o===4?"end":"middle"}">${Number(g.toFixed(3))}</text>`}).join("")}<text x="50%" y="38" text-anchor="middle">Estimated treatment effect</text></svg>`,h=p.map((r,o)=>`<section class="study-method" aria-label="${r} study estimates">
    <h4>${r}</h4>
    <p class="study-spread-change study-summary">${u(o)}</p>
    ${["Without Z","With Z"].map((g,v)=>{const j=s[v][o],k=a[v][o],b=z(j),F=b?`${b[0].toFixed(3)} to ${b[1].toFixed(3)}`:"unavailable";return`<div class="study-row ${v?"with-z":"without-z"}">
        <div class="study-row-label"><span>${g}</span><span class="study-sd">SD ${Number.isFinite(k.sd)?k.sd.toFixed(3):"unavailable"}</span></div>
        <svg class="study-cloud" height="90" role="img" aria-label="${r}, ${g}: ${k.count} study estimates; middle 90% ${F}; true effect 2." data-min="${l}" data-max="${c}">
          <line class="study-truth" x1="${n(2)}%" x2="${n(2)}%" y1="0" y2="90"/>
          ${j.map((C,A)=>{if(!Number.isFinite(C))return"";const I=35+i[v][o][A]*y;return`<circle class="study-dot" cx="${n(C)}%" cy="${I}" r="2.5" style="--study-order:${A}" data-estimate="${C}"><title>Study ${d+A}: ${C.toFixed(3)}</title></circle>`}).join("")}
          ${b?`<g class="study-range" data-low="${b[0]}" data-high="${b[1]}"><title>Middle 90% of study estimates: ${F}</title><line x1="${n(b[0])}%" x2="${n(b[1])}%" y1="79" y2="79"/><line x1="${n(b[0])}%" x2="${n(b[0])}%" y1="74" y2="84"/><line x1="${n(b[1])}%" x2="${n(b[1])}%" y1="74" y2="84"/></g>`:""}
        </svg>
      </div>`}).join("")}
    ${m}
  </section>`);return`<div class="study-distributions">${h[0]}${h.length>1?`<details id="study-other-methods" class="study-summary"><summary>Compare other estimators</summary>${h.slice(1).join("")}</details>`:""}</div>`}document.querySelector("#app").innerHTML=`<div class="instrument-page"><header><a class="brand" href="./">${P}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${E()}</header>
    <main>
      ${R({currentOptional:"instrument"})}
      <p class="eyebrow" id="step"></p>
      <h1 id="title" tabindex="-1"></h1>
      <p class="intro" id="intro"></p>
      <section class="panel" aria-label="Instrument and adjustment experiment">
        <svg class="graph" viewBox="0 0 590 225" role="img" id="graph">
          <defs>
            <marker
              id="arrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0,7 3.5,0 7" fill="var(--causal-path)" />
            </marker>
          </defs>
          <path id="instrument-path" d="M150 128H237" marker-end="url(#arrow)" />
          <path d="M345 128H470" marker-end="url(#arrow)" />
          <path d="M380 55L302 103" marker-end="url(#arrow)" />
          <path d="M402 55L513 103" marker-end="url(#arrow)" />
          <rect
            x="10"
            y="106"
            width="140"
            height="44"
            rx="10"
            fill="var(--surface-subtle)"
          />
          <text x="80" y="134" text-anchor="middle">Instrument Z</text>
          <rect
            x="240"
            y="106"
            width="105"
            height="44"
            rx="10"
            fill="var(--node-A)"
          />
          <text x="292" y="134" text-anchor="middle">Treatment A</text>
          <rect
            x="473"
            y="106"
            width="105"
            height="44"
            rx="10"
            fill="var(--node-Y)"
          />
          <text x="525" y="134" text-anchor="middle">Outcome Y</text>
          <rect
            x="330"
            y="10"
            width="130"
            height="44"
            rx="10"
            fill="var(--node-C)"
          />
          <text x="395" y="38" text-anchor="middle">Measured C</text>
          <g id="hidden-node" stroke-dasharray="5 4">
            <path d="M380 180L302 152" marker-end="url(#arrow)" />
            <path d="M402 180L513 152" marker-end="url(#arrow)" />
            <rect
              x="325"
              y="181"
              width="140"
              height="40"
              rx="10"
              fill="var(--node-U)"
              stroke-dasharray="5 4"
            />
            <text x="395" y="206" text-anchor="middle">Unmeasured U</text>
          </g>
        </svg>
        <h2 id="question"></h2>
        <p id="instruction"></p>
        <label class="adjust" id="adjust-control"
          ><input type="checkbox" id="adjust" />Also adjust for instrument
          Z</label
        >
        <div id="hidden-control" hidden>
          <label for="hidden-strength">Hidden confounding strength <output id="hidden-value" for="hidden-strength">0.0</output></label>
          <input id="hidden-strength" type="range" min="0" max="2" step="0.1" value="0" aria-describedby="hidden-help" />
          <p class="small" id="hidden-help">Strengthens both U → A and U → Y. The same people and random draws are retained; treatment and outcomes can change. The true effect stays at 2.</p>
        </div>
        <p class="small" id="model-note"></p>
        <div aria-live="polite" aria-atomic="true">
          <div class="results" id="single-results">
            <div class="result truth">
              <span>True total effect</span><strong>2.000</strong>
            </div>
            <div class="result">
              <span>IPW estimate</span><strong id="ipw"></strong>
            </div>
            <div class="result">
              <span>Outcome regression</span><strong id="regression"></strong>
            </div>
            <div class="result">
              <span>AIPW estimate</span><strong id="aipw"></strong>
            </div>
          </div>
          <div id="paired-results" hidden>
            <p class="truth paired-truth">True total effect <strong>2.000</strong></p>
            <table class="paired-table">
              <caption>Same sample, two adjustment choices</caption>
              <thead><tr><th scope="col">Estimate</th><th scope="col">C only</th><th scope="col">C + Z</th></tr></thead>
              <tbody id="paired-values"></tbody>
            </table>
            <p class="small color-key">Red shows distance from truth (full tint at 2 units). The darker strip highlights extra error versus the other estimate, on a 0–0.5 unit scale.</p>
          </div>
          <p id="interpretation" class="note"></p>
          <p class="small" id="clipping"></p>
        </div>
        <div id="uptake">
          <h2>What does Z change?</h2>
          <div class="bar-row">
            <span>Treatment, Z = 0</span>
            <div class="track"><div class="fill" id="bar0"></div></div>
            <span id="uptake0"></span>
          </div>
          <div class="bar-row">
            <span>Treatment, Z = 1</span>
            <div class="track"><div class="fill blue" id="bar1"></div></div>
            <span id="uptake1"></span>
          </div>
          <p class="small" id="uptake-note">
            Z changes how many people receive treatment. The treatment effect
            itself stays at 2.
          </p>
        </div>
        <div class="actions">
          <button id="redraw">Redraw sample</button
          ><button id="reset">Restart section</button
          ><span class="small" id="sample"></span>
        </div>
        <section id="study-detail" aria-labelledby="study-title">
          <h2 id="study-title">Next: compare variability across studies</h2>
          <p id="study-explanation"></p>
          <div id="instrument-control">
            <label for="instrument-strength">Z → treatment strength <output id="instrument-value" for="instrument-strength">2.8</output></label>
            <input id="instrument-strength" type="range" min="0" max="2.8" step="0.1" value="2.8" aria-describedby="instrument-help instrument-status" />
            <p class="small" id="instrument-help">Lower the strength, then rerun the studies. The same people and random draws are retained; treatment and outcomes can change. The true effect stays at 2.</p>
            <p class="small" id="instrument-status" role="status"></p>
          </div>
          <p>
            Run 200 independent studies of 2,400 people. Compare adjustment for
            C alone with C + Z using the same people in each paired comparison.
          </p>
          <button id="repeat">Run 200 studies</button>
          <p id="study-progress" class="study-progress" role="status"></p>
          <p id="study-warning" class="small"></p>
          <div id="study-results"></div>
          <details id="study-reason">
            <summary id="study-reason-title"></summary>
            <p id="study-mechanism"></p>
          </details>
        </section>
      </section>
      <details>
        <summary id="detail-title"></summary>
        <div id="detail"></div>
      </details>
      <nav class="actions" aria-label="Lesson sections">
        <a id="back">← Back</a
        ><a id="next" class="primary"></a>
      </nav>
      <p class="small" id="next-note"></p>
      <nav class="actions" aria-label="Chapter navigation"><a href="?lesson=double-robustness">← Back to double robustness</a><a href="?lesson=tmle">Resume core: targeting with TMLE →</a></nav>
      <footer>
        Point estimates only; fictional effect values.
      </footer>
    </main></div>`;D();const e=s=>document.getElementById(s),L=new URLSearchParams(location.search).get("lesson")==="instrument-hidden-confounding"?2:1,t={step:L,seed:4217,adjust:!1,strength:L===1?2.8:2,hidden:0};let Z=100,x=0;const $=s=>Number.isFinite(s)?s.toFixed(3):"Unavailable",S=s=>Number.isFinite(s)?`${s>0?"+":""}${$(s)}`:"Unavailable";function T(s,a,p=!1){const d=H(s,2),l=Number.isFinite(s)&&Number.isFinite(a)?Math.max(0,Math.abs(s-2)-Math.abs(a-2)):0;return`<td><span class="comparison-value" style="--error-tint:${d.tint}%;--extra-width:${Math.min(l/.5,1)*100}%" title="${Number.isFinite(s)&&Number.isFinite(a)?`${l.toFixed(3)} extra absolute error versus the other estimate`:"Comparison unavailable"}"><strong class="estimate-value">${$(s)}</strong>${p?`<small>${d.difference}</small>`:""}<span class="extra-error" aria-hidden="true"></span></span></td>`}const N=[["IPW",3],["Outcome regression",2],["AIPW",4]],G=[{title:"Instruments",intro:"An instrument Z influences treatment A, affects outcome Y only through treatment, and is independent of the underlying causes of treatment and outcome. The measured risk score C is still adjusted for.",question:"Should we also adjust for Z?",instruction:"Add Z to the adjustment set, then remove it. The people, outcomes, and treatment uptake below stay fixed.",interpretation:"Z is not a confounder. Here, adjusting for C already controls confounding, so adding Z does not introduce confounding bias. It can reduce precision: estimates vary more across studies. One estimate cannot show that difference—compare repeated studies below.",detailTitle:"An example of an instrument",detail:"<p>Imagine randomly assigning an invitation to take treatment. The invitation is Z; receiving treatment is A. For the invitation to be an instrument, it must change uptake and affect Y only through receiving treatment. Random assignment makes it independent of baseline causes.</p><p>In a real study these conditions need justification. Here they are built into the simulation.</p><p>The checkbox adds Z to the IPW treatment model, the outcome-regression model, and both AIPW models. C remains included. This example uses a binary measured baseline factor C, so both treatment models are correctly specified when U is absent.</p>",next:"What happens when there is hidden confounding?"},{title:"Instruments",intro:"An unmeasured cause U can affect both treatment and outcome. Explore what happens to the two adjustment choices as its influence grows.",question:"What happens when there is hidden confounding?",instruction:"Start at zero, then increase the strength and compare the two columns.",interpretation:"",detailTitle:"Why can adjustment make things worse?",detail:'<p>Imagine Z is a randomly assigned invitation to take treatment. After adjusting for measured C, people still differ in treatment partly because of U, partly because of the invitation, and partly by chance. Because U also affects outcomes, the C-only estimate can mistake some of U’s effect for a treatment effect.</p><p>Adjusting for Z compares treated and untreated people with the same invitation status. Within those comparisons, the invitation can no longer explain treatment differences, so U may account for a larger share of the differences that remain. This can amplify the existing hidden-confounding bias.</p><p>Adjustment changes the comparison; it does not change anyone’s treatment or outcome. The path A ← U → Y remains open. IV estimation is different: it uses the treatment variation created by Z.</p><p>Amplification depends on the causal model and may not appear in every sample. The pattern across many independent studies is more informative than one estimate moving toward or away from the truth.</p><p><a href="https://arxiv.org/abs/1701.04177">Read more: when instruments amplify bias</a></p>',next:"How strong is a causal arrow?"}];function w(){const s=G[t.step-1];for(const n of["title","intro","question","instruction","interpretation"])e(n).textContent=s[n];e("step").textContent=`CAUSAL ROLES · ${t.step} OF 2`,e("detail-title").textContent=s.detailTitle,e("detail").innerHTML=s.detail,e("next").textContent=s.next,e("next").href=t.step===1?"?lesson=instrument-hidden-confounding":"?lesson=arrow-strength",e("back").href="?lesson=instrument",document.title=`${s.title} · Causal Sandbox`,e("back").hidden=t.step===1,e("next-note").textContent=t.step===2?"Next: what changes when the exclusion restriction is only approximately true?":"";const a=t.step===2;e("hidden-control").hidden=!a,e("instrument-control").hidden=a,e("instrument-strength").value=t.strength,e("instrument-strength").style.setProperty("--fill",`${100*t.strength/2.8}%`),e("instrument-value").textContent=t.strength.toFixed(1),e("instrument-status").textContent=t.strength===0?"Z has no effect on treatment at zero; it is no longer an instrument.":"Changing strength clears study results. Compare with and without Z at each strength.",e("instrument-path").classList.toggle("inactive",t.strength===0),e("uptake-note").textContent=t.strength===0?"Any uptake difference at zero is due to chance. The treatment effect stays at 2.":"Z changes how many people receive treatment. The treatment effect itself stays at 2.",e("paired-results").hidden=!a,e("single-results").hidden=a,e("adjust-control").hidden=a,e("uptake").hidden=a,e("hidden-strength").value=t.hidden,e("hidden-strength").style.setProperty("--fill",`${50*t.hidden}%`),e("hidden-value").textContent=t.hidden.toFixed(1),e("hidden-node").classList.toggle("inactive",t.hidden===0),a&&(e("interpretation").textContent=t.hidden===0?"At zero, U has no effect on treatment or outcome. Both analyses are centered near truth across studies; adding Z can increase their spread.":"U already biases the C-only comparison. Adjusting for Z accounts for treatment differences unrelated to U, so U can have more influence over the remaining comparison. Check across studies: a single sample can move differently."),e("hidden-node").style.visibility=t.step===2?"visible":"hidden",e("graph").setAttribute("aria-label",`Z ${t.strength===0?"has no effect on A":"causes A"}, A causes Y, and measured C causes both A and Y.${t.step===2?t.hidden?" Unmeasured U also causes A and Y.":" Unmeasured U is shown with both paths inactive at zero strength.":""}`),e("adjust").checked=t.adjust,e("study-title").textContent=t.step===1?"Next: compare variability across studies":"Compare bias and spread across studies",e("study-explanation").textContent=a?"Mean estimate minus truth estimates bias across studies. The C-only bias is already present; the change in bias after adding Z shows whether it is amplified. SD measures spread, not bias.":"The mean estimate shows where estimates are centered. Their standard deviation (SD) shows how much they vary between studies. Larger SD means less precision; it does not mean the average estimate is shifted away from truth.",e("study-reason-title").textContent=a?"Which hidden-confounding strength is used?":"Why can adjusting for Z increase variability?",e("study-mechanism").textContent=t.step===1?t.strength===0?"At zero, Z predicts neither treatment nor outcome. Adding it can still change a finite-sample fit by chance, but there is no treatment variation supplied by Z to remove.":"Z predicts treatment but adds no outcome information once A and C are known. Adjusting for Z can leave less independent treatment variation and make IPW weights more uneven.":`Both analyses use hidden confounding strength ${t.hidden.toFixed(1)}. Changing strength clears these results.`,e("model-note").textContent=a?"IPW, outcome regression, and AIPW each compare C only with C + Z. U stays unavailable to their models.":`All three methods adjust for ${t.adjust?"C and Z":"C"}.`;const{data:p,fits:d}=U({seed:t.seed,strength:t.strength,hidden:t.hidden});e("paired-values").innerHTML=N.map(([n,i])=>`<tr><th scope="row">${n}</th>${d.map((f,y)=>T(f.values[i],d[1-y].values[i],!0)).join("")}</tr>`).join("");const l=d[+t.adjust];for(const[n,i]of[["ipw",3],["regression",2],["aipw",4]])e(n).textContent=$(l.values[i]);const c=a?d.reduce((n,i)=>n+i.clipped,0):l.clipped;e("clipping").textContent=c?`${c} fitted probabilities clipped${a?" across both fits":""}; clipping may affect weighting estimates.`:"",e("sample").textContent=`2,400 people · sample ${t.seed}`;for(const n of[0,1]){const i=p.filter(y=>y.Z===n),f=i.reduce((y,u)=>y+u.A,0)/i.length;e(`bar${n}`).style.width=`${100*f}%`,e(`uptake${n}`).textContent=`${(100*f).toFixed(1)}%`}}function M(){x++,Z=100,e("repeat").disabled=!1,e("repeat").textContent="Run 200 studies",e("study-progress").textContent="",e("study-warning").textContent="",e("study-results").classList.remove("studies-animating"),e("study-results").setAttribute("aria-busy","false"),e("study-results").innerHTML=""}function W(s){M(),t.hidden=0,t.strength=s===1?2.8:2,t.step=s,t.adjust=!1,t.seed=4217,e("study-reason").open=!1,e("detail").parentElement.open=!1,w(),e("title").focus()}e("instrument-strength").addEventListener("input",s=>{t.strength=Number(s.target.value),M(),w()});e("hidden-strength").addEventListener("input",s=>{t.hidden=Number(s.target.value),M(),w()});e("adjust").addEventListener("change",s=>{t.adjust=s.target.checked,w()});e("redraw").addEventListener("click",()=>{t.seed++,w()});e("reset").addEventListener("click",()=>W(t.step));e("repeat").addEventListener("click",async()=>{const s=++x,a=t.hidden,p=t.strength,d=Z,l=Array.from({length:2},()=>Array.from({length:3},()=>[])),c=N.map(([i])=>i);let n=0;e("repeat").disabled=!0,e("repeat").textContent="Running studies…",e("study-warning").textContent="",e("study-results").setAttribute("aria-busy","true"),e("study-results").innerHTML="";try{for(let u=0;u<200;u++){if(s!==x)return;const{fits:m}=U({seed:d+u,hidden:a,strength:p});m.forEach((h,r)=>{n+=h.clipped,[3,2,4].forEach((o,g)=>l[r][g].push(h.values[o]))}),(u+1)%10===0&&(e("study-progress").textContent=`${u+1} of 200 studies`,await new Promise(h=>setTimeout(h,0)))}if(s!==x)return;const i=l.map(u=>u.map(m=>Y(m))),f=`<h3>How much do estimates vary?</h3><p class="small">Each dot is one study’s estimate. Compare the widths with and without Z: a wider cloud means less precision.</p><p class="study-key"><span><span class="study-truth-key"></span> True effect: 2</span><span class="study-summary"><span class="study-range-key"></span> Middle 90% of estimates</span></p>${q(l,i,c,d)}<p class="small study-summary">The ranges span the 5th–95th percentiles across studies, not confidence intervals. Dots stack where estimates concentrate. All plots share the same effect axis.</p><p class="small study-summary">200 studies · Z → treatment strength ${p.toFixed(1)} · Seeds ${d}–${d+199}.</p>`+(t.step===1?`<details id="study-means" class="study-summary"><summary>Are estimates still centered near truth?</summary><p>The mean shows where estimates are centered; the true total effect is 2. ${a?"Here U creates bias, so greater spread is only part of the error.":"With confounding controlled and correctly specified models, both analyses are centered near truth across repeated studies. Compare the observed spread above; adding Z need not increase it in every batch or at every strength."}</p><table><thead><tr><th>Mean estimate</th><th>Without Z</th><th>With Z</th></tr></thead><tbody>${c.map((u,m)=>`<tr><th scope="row">${u}</th><td>${$(i[0][m].mean)}</td><td>${$(i[1][m].mean)}</td></tr>`).join("")}</tbody></table></details>`:"")+`<p class="small study-summary">${t.step===1?"Greater spread means estimates are typically farther from truth, even though adding Z may bring an individual estimate closer.":"With hidden confounding, error reflects both spread and systematic bias."}</p>`;if(t.step===2)e("study-results").innerHTML=`<div id="bias-comparison"><h3>Where are estimates centered?</h3><p class="small">True effect: 2 · Strength: ${a.toFixed(1)} · 200 studies · Seeds ${d}–${d+199}</p>${c.map((u,m)=>{const h=i[0][m].mean,r=i[1][m].mean,o=v=>Number.isFinite(v)?S(v-2):"Unavailable",g=Number.isFinite(h)&&Number.isFinite(r)?S(r-h):"Unavailable";return`<section class="bias-method" aria-label="${u} bias"><h4>${u}</h4><table><thead><tr><th scope="col">Adjustment</th><th scope="col">Mean estimate</th><th scope="col">Mean − truth</th></tr></thead><tbody><tr><th scope="row">C only</th>${T(h,r)}<td>${o(h)}</td></tr><tr><th scope="row">C + Z</th>${T(r,h)}<td>${o(r)}</td></tr></tbody></table><p class="small">Change in bias after adding Z: <strong>${g}</strong></p></section>`}).join("")}<p class="small">The same red tint and darker strip now compare mean errors across studies. Bias is amplified when the mean moves farther from 2. The signed change is C + Z minus C only; a positive change alone does not establish amplification. A new batch can differ, and the pattern need not hold in every causal world.</p></div><details><summary>Sampling spread and other summaries</summary>${f}</details>`;else if(e("study-results").innerHTML=f,!window.matchMedia("(prefers-reduced-motion: reduce)").matches){if(e("repeat").textContent="Showing study estimates…",e("study-progress").textContent="Showing paired estimates from 200 studies.",e("study-results").classList.add("studies-animating"),await new Promise(u=>setTimeout(u,4e3)),s!==x)return;e("study-results").classList.remove("studies-animating")}const y=i.flat().reduce((u,m)=>u+m.unavailable,0);e("study-progress").textContent="200 studies complete.",e("study-warning").textContent=`${y?y+" estimates unavailable; summaries use available estimates only. ":""}${n?n+" probabilities clipped across fits.":""}`,Z+=200,e("repeat").textContent="Run another 200 studies"}finally{s===x&&(e("repeat").disabled=!1,e("study-results").setAttribute("aria-busy","false"))}});window.addEventListener("pageshow",s=>{s.persisted&&W(t.step)});w();e("title").focus();
