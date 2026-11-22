/* empty css                          */import{t as k}from"./theme-Vjupx5_i.js";import{e as M}from"./effect-comparison-D_sRXFX7.js";import{s as x}from"./instrument-simulation-FFlhfKBs.js";import{m as $,e as b}from"./simulation-BOxkiD6q.js";import{i as T}from"./brand--vQh_tom.js";import{l as L,s as Y}from"./lesson-navigation-D3qgvbW9.js";import"./glossary-Cn9xhfdQ.js";import"./foundations-progress-CLDiwUAt.js";const m=a=>1/(1+Math.exp(-a));function w(a=2){return[m(-.8-1.2+a)-m(-.8-1.2),m(-.8+1.2+a)-m(-.8+1.2)].reduce((s,r)=>s+r,0)/2*2}function C(a=2){return-w(a)}function E({treatmentStrength:a=2,directEffect:s=0}={}){return s+w(a)}function R(a,s,r){const i=[0,1].map(c=>{const l=a.filter(d=>d[s]===c);return l.reduce((d,n)=>d+n[r],0)/l.length});return i[1]-i[0]}function S({seed:a=4217,treatmentStrength:s=2,directEffect:r=0}={}){const i=$(2400,a).map(({C1:c,Z:l,a:d,eY:n})=>{const o=c>0?1:-1,f=m(-.8+1.2*o+s*l),g=+(d<f);return{C:o,Z:l,A:g,Y:2*g+1.5*o+r*l+n}});return{data:i,fits:[b(i,["C"]),b(i,["C","Z"])],zAssociation:R(i,"Z","Y"),totalZEffect:E({treatmentStrength:s,directEffect:r})}}document.querySelector("#app").innerHTML=`
  <div class="instrument-page arrow-strength-page">
    <header><a class="brand" href="./">${T}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${k()}</header>
    <main>
      ${L({currentOptional:"arrow-strength"})}
      <p class="eyebrow">OPTIONAL · CAUSAL ROLES</p>
      <h1 tabindex="-1">How strong is a causal arrow?</h1>
      <p class="intro">A graph shows whether a causal path is assumed to exist, but not how large its effect is. A <a href="https://stacks.cdc.gov/view/cdc/229116/cdc_229116_DS1.pdf">missing arrow is a causal claim</a>, not a conclusion from a small coefficient. Meanwhile, <a href="https://doi.org/10.1214/12-AOS1080">causal paths can cancel</a> so that an observed association is close to zero.</p>

      <section class="panel" aria-labelledby="question">
        <h2 id="question">Can Z cause Y when regression finds no association?</h2>
        <p>Start with a valid instrument. Change either arrow, or select <strong>Paths cancel</strong> to see a nonzero direct effect hidden by the path through treatment.</p>
        <svg class="graph strength-graph" viewBox="0 0 590 245" role="img" id="graph">
          <defs>
            <marker id="strength-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0,7 3.5,0 7" fill="var(--causal-path)" />
            </marker>
          </defs>
          <path id="za-path" d="M150 128H237" marker-end="url(#strength-arrow)" />
          <path d="M345 128H470" marker-end="url(#strength-arrow)" />
          <path d="M380 55L302 103" marker-end="url(#strength-arrow)" />
          <path d="M402 55L513 103" marker-end="url(#strength-arrow)" />
          <path id="zy-path" d="M145 150C245 222 402 222 487 152" marker-end="url(#strength-arrow)" />
          <text id="za-label" x="194" y="116" text-anchor="middle"></text>
          <text id="zy-label" x="315" y="226" text-anchor="middle"></text>
          <rect x="10" y="106" width="140" height="44" rx="10" fill="var(--surface-subtle)" />
          <text x="80" y="134" text-anchor="middle">Candidate Z</text>
          <rect x="240" y="106" width="105" height="44" rx="10" fill="var(--node-A)" />
          <text x="292" y="134" text-anchor="middle">Treatment A</text>
          <rect x="473" y="106" width="105" height="44" rx="10" fill="var(--node-Y)" />
          <text x="525" y="134" text-anchor="middle">Outcome Y</text>
          <rect x="330" y="10" width="130" height="44" rx="10" fill="var(--node-C)" />
          <text x="395" y="38" text-anchor="middle">Measured C</text>
        </svg>

        <div class="strength-presets" aria-label="Examples">
          <button id="pure">Pure instrument</button>
          <button id="cancel" class="primary">Paths cancel</button>
        </div>
        <div class="strength-controls">
          <label for="treatment-strength">Z → A strength <output id="treatment-value" for="treatment-strength">2.00</output></label>
          <input id="treatment-strength" type="range" min="0" max="3" step="0.05" value="2" />
          <p class="small">How strongly Z changes treatment uptake.</p>
          <label for="direct-effect">Z → Y direct effect <output id="direct-value" for="direct-effect">0.00</output></label>
          <input id="direct-effect" type="range" min="-1.5" max="1.5" step="0.01" value="0" />
          <p class="small">Any nonzero value violates the instrument exclusion restriction.</p>
        </div>

        <div class="results strength-evidence" aria-live="polite" aria-atomic="true">
          <div class="result truth"><span>True A → Y effect</span><strong>2.000</strong></div>
          <div class="result"><span>True direct Z → Y</span><strong id="direct-truth"></strong></div>
          <div class="result"><span>True total effect of Z</span><strong id="z-total"></strong></div>
          <div class="result" id="association-card"><span>Marginal regression of Y on Z</span><strong id="z-association"></strong></div>
        </div>
        <p id="interpretation" class="note" aria-live="polite"></p>

        <h2>What happens to the treatment-effect estimate?</h2>
        <div class="table-wrap">
          <table class="paired-table">
            <caption>Same sample, two adjustment choices</caption>
            <thead><tr><th scope="col">Estimate</th><th scope="col">C only</th><th scope="col">C + Z</th></tr></thead>
            <tbody id="effect-estimates"></tbody>
          </table>
        </div>
        <p class="small color-key">Truth is 2. Red shows distance from truth on the same fixed 0–2 outcome-unit scale used in other lessons.</p>

        <div class="actions">
          <button id="redraw">Redraw sample</button>
          <button id="reset">Restart lesson</button>
          <span class="small" id="sample"></span>
        </div>

        <details id="study-detail">
          <summary>Is the near-zero association just this sample?</summary>
          <p>Run 200 independent studies. A sample association may miss zero, so the mean across studies is the clearer comparison.</p>
          <button id="repeat">Run 200 studies</button>
          <p id="study-progress" class="small" role="status"></p>
          <div id="study-results"></div>
        </details>
      </section>

      <details>
        <summary>What is cancelling?</summary>
        <p>Z changes treatment, and treatment raises Y. Under <strong>Paths cancel</strong>, Z also lowers Y directly by the same amount in the opposite direction. The two causal contributions sum to zero in the population.</p>
        <p>The zero marginal association does not make Z irrelevant. Because its direct path makes Z a common cause of A and Y, omitting Z leaves confounding in the treatment comparison.</p>
      </details>
      <details>
        <summary>Sources and further reading</summary>
        <ul class="reading-list">
          <li><a href="https://stacks.cdc.gov/view/cdc/229116/cdc_229116_DS1.pdf">Greenland, Pearl & Robins (1999), Causal Diagrams for Epidemiologic Research</a></li>
          <li><a href="https://doi.org/10.1214/12-AOS1080">Uhler et al. (2013), Geometry of the Faithfulness Assumption</a></li>
          <li><a href="https://ideas.repec.org/a/tpr/restat/v94y2012i1p260-272.html">Conley, Hansen & Rossi (2012), Plausibly Exogenous</a></li>
          <li><a href="https://arxiv.org/abs/1302.4976">Pearl (2013), On the Testability of Causal Models with Latent and Instrumental Variables</a></li>
          <li><a href="https://doi.org/10.1093/aje/kwr323">Glymour, Tchetgen Tchetgen & Robins (2012), Credible Mendelian Randomization Studies</a></li>
        </ul>
      </details>
      <nav class="actions" aria-label="Lesson navigation">
        <a href="?lesson=instrument-hidden-confounding">← Instruments and adjustment</a>
        <a class="primary" href="./">Return to guided lessons</a>
      </nav>
      <footer>Point estimates only; fictional effect values.</footer>
    </main>
  </div>`;Y();const t=a=>document.getElementById(a),Z=[["IPW",3],["Outcome regression",2],["AIPW",4]],e={seed:4217,treatmentStrength:2,directEffect:0};let p=0,v=100;const h=a=>Number.isFinite(a)?a.toFixed(3):"Unavailable";function P(a){const s=M(a,2);return`<td><span class="comparison-value" style="--error-tint:${s.tint}%"><strong>${h(a)}</strong><small>${s.difference}</small></span></td>`}function y(){p++,v=100,t("repeat").disabled=!1,t("repeat").textContent="Run 200 studies",t("study-progress").textContent="",t("study-results").innerHTML=""}function u(){const a=S(e);t("treatment-strength").value=e.treatmentStrength,t("direct-effect").value=e.directEffect,t("treatment-value").textContent=e.treatmentStrength.toFixed(2),t("direct-value").textContent=e.directEffect.toFixed(2),t("direct-truth").textContent=h(e.directEffect),t("z-total").textContent=h(a.totalZEffect),t("z-association").textContent=h(a.zAssociation),t("sample").textContent=`2,400 people · sample ${e.seed}`,t("za-label").textContent=`strength ${e.treatmentStrength.toFixed(2)}`,t("zy-label").textContent=`direct effect ${e.directEffect.toFixed(2)}`,t("za-path").style.opacity=.12+.88*(e.treatmentStrength/3),t("zy-path").style.opacity=e.directEffect===0?0:.2+.8*(Math.abs(e.directEffect)/1.5),t("graph").setAttribute("aria-label",`The Z to A path has strength ${e.treatmentStrength.toFixed(2)}. A causes Y with effect 2. C causes A and Y. The direct Z to Y path has effect ${e.directEffect.toFixed(2)}.`),t("pure").setAttribute("aria-pressed",e.treatmentStrength===2&&e.directEffect===0);const s=Math.abs(a.totalZEffect)<.005&&Math.abs(e.directEffect)>.05;t("cancel").setAttribute("aria-pressed",s),t("association-card").classList.toggle("near-zero",Math.abs(a.zAssociation)<.15),e.treatmentStrength===0?t("interpretation").textContent="At zero Z → A strength, Z does not predict treatment, so it is not an instrument. Instrument relevance also has a magnitude.":e.directEffect===0?t("interpretation").textContent="At zero, Z affects Y only through treatment. Z can be a valid instrument in this simulated world.":s?t("interpretation").textContent=`Z has a direct effect of ${e.directEffect.toFixed(2)}, but its direct and treatment-mediated effects cancel in the population. Regression of Y on Z is therefore near zero even though the Z → Y arrow is real.`:t("interpretation").textContent="Z now affects Y both directly and through treatment. The direct effect violates the exclusion restriction, and its direction determines whether the two paths reinforce or offset each other.",t("effect-estimates").innerHTML=Z.map(([r,i])=>`<tr><th scope="row">${r}</th>${a.fits.map(c=>P(c.values[i])).join("")}</tr>`).join("")}for(const[a,s]of[["treatment-strength","treatmentStrength"],["direct-effect","directEffect"]])t(a).addEventListener("input",r=>{e[s]=Number(r.target.value),y(),u()});t("pure").addEventListener("click",()=>{e.treatmentStrength=2,e.directEffect=0,y(),u()});t("cancel").addEventListener("click",()=>{e.directEffect=C(e.treatmentStrength),y(),u()});t("redraw").addEventListener("click",()=>{e.seed++,u()});t("reset").addEventListener("click",()=>{e.seed=4217,e.treatmentStrength=2,e.directEffect=0,y(),t("study-detail").open=!1,u()});t("repeat").addEventListener("click",async()=>{const a=++p,s={treatmentStrength:e.treatmentStrength,directEffect:e.directEffect},r=v,i=[],c=Array.from({length:2},()=>Array.from({length:3},()=>[]));t("repeat").disabled=!0,t("study-results").innerHTML="";try{for(let n=0;n<200;n++){if(a!==p)return;const o=S({seed:r+n,...s});i.push(o.zAssociation),o.fits.forEach((f,g)=>[3,2,4].forEach((A,z)=>c[g][z].push(f.values[A]))),(n+1)%10===0&&(t("study-progress").textContent=`${n+1} of 200 studies`,await new Promise(f=>setTimeout(f,0)))}if(a!==p)return;const l=x(i),d=c.map(n=>n.map(o=>x(o).mean));t("study-results").innerHTML=`
      <div class="study-association"><span>Mean regression of Y on Z</span><strong>${h(l.mean)}</strong><small>True total effect of Z: ${h(E(s))}</small></div>
      <table><caption>Mean treatment-effect estimate across 200 studies</caption><thead><tr><th scope="col">Estimate</th><th scope="col">C only</th><th scope="col">C + Z</th></tr></thead><tbody>${Z.map(([n],o)=>`<tr><th scope="row">${n}</th><td>${h(d[0][o])}</td><td>${h(d[1][o])}</td></tr>`).join("")}</tbody></table>
      <p class="small">Seeds ${r}–${r+199}. The mean association estimates the total effect of randomized Z, not its direct effect. Mean treatment-effect estimates should be compared with truth: 2.</p>`,t("study-progress").textContent="200 studies complete.",v+=200,t("repeat").textContent="Run another 200 studies"}finally{a===p&&(t("repeat").disabled=!1)}});document.title="How strong is a causal arrow? · Causal Sandbox";new URLSearchParams(location.search).get("example")==="paths-cancel"&&(e.directEffect=C(e.treatmentStrength));u();document.querySelector("h1").focus();
