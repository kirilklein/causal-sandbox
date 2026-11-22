/* empty css                        */import{i as E}from"./brand--vQh_tom.js";import{m as F}from"./simulation-BOxkiD6q.js";import{l as R,i as W,s as j}from"./lesson-simulation-DgNFmLuF.js";import{f as H}from"./clipping-experiment-DJtYHRCk.js";import{e as P}from"./effect-comparison-D_sRXFX7.js";import{t as U}from"./theme-Vjupx5_i.js";import{l as B,s as O}from"./lesson-navigation-D3qgvbW9.js";import"./glossary-Cn9xhfdQ.js";import"./foundations-progress-CLDiwUAt.js";function S({n:e=400,seed:i=4217,selection:r=3,heterogeneous:s=!1}={}){const o={...R(10),n:e,seed:i,selection:r},p=F(e,i),d=a=>j(o,a).map(u=>({...u,Y:u.Y+(s?u.A*(u.C**2-1):0)})),t=d(p),l=d(p.map(a=>({...a,a:1}))),c=d(p.map(a=>({...a,a:-1})));return{rows:H(t),effects:c.map((a,u)=>a.Y-l[u].Y)}}function w(e,i,r){const s=r.map(n=>e[n]),o=s.length,p=[0,1].map(n=>s.filter(({A:m})=>m===n).length),d=o?r.reduce((n,m)=>n+i[m]/o,0):null,t={n:o,counts:p,truth:d},l=n=>({...t,available:!1,reason:n,ipw:null});if(!o)return l("No people in this group.");if(p.includes(0))return l("Both treatment arms are required.");if(s.some(({Y:n})=>!Number.isFinite(n)))return l("Finite observed outcomes are required.");if(s.some(({p:n})=>n===0||n===1))return l("Unclipped scores must be strictly between 0 and 1.");const c=s.map(({A:n,p:m})=>1/(n?m:1-m)),a=W(s,c),u=a[1].mean-a[0].mean;return!c.every(Number.isFinite)||!a.every(({mean:n,weightedSum:m,totalWeight:f})=>[n,m,f].every(Number.isFinite))||!Number.isFinite(u)?l("Weight calculations exceeded the finite numeric range."):{...t,available:!0,ipw:u}}function C(e,i,r=0){if(!Number.isFinite(r)||r<0||r>.5)throw new RangeError("Trimming threshold must be between 0 and 0.5.");if(e.some(({A:d,p:t})=>d!==0&&d!==1||!Number.isFinite(t)||t<0||t>1))throw new RangeError("Valid treatment arms and propensity scores are required.");if(i.length!==e.length||!i.every(Number.isFinite))throw new RangeError("One finite potential-outcome difference per person is required.");const s=[],o=[],p=[0,1].map(()=>({count:0,retained:Array(10).fill(0),excluded:Array(10).fill(0)}));return e.forEach(({A:d,p:t},l)=>{const c=t>=r&&t<=1-r;(c?s:o).push(l),p[d].count++,p[d][c?"retained":"excluded"][Math.min(9,Math.floor(t*10))]++}),{threshold:r,retained:s,excluded:o,histogram:p,groups:{everyone:w(e,i,e.map((d,t)=>t)),retained:w(e,i,s),excluded:w(e,i,o)}}}document.title="Who remains after trimming? · Causal Sandbox";document.querySelector("#app").innerHTML=`<div class="clipping-page trimming-page">
<main>
  <header>
    <a class="brand" href="./">${E}<span>Causal Sandbox</span></a>${U()}
  </header>
  ${B({currentOptional:"trimming"})}
  <div class="eyebrow">Overlap · Trimming</div>
  <h1 tabindex="-1">Who remains after trimming?</h1>
  <p class="lede">
    Clipping changes weights while keeping everyone. Trimming removes people
    with extreme fitted treatment probabilities. Move the threshold and
    compare the people who remain.
  </p>
  <section class="experiment" aria-labelledby="experiment-title">
    <h2 id="experiment-title">Change overlap, then trim the sample</h2>
    <div class="controls">
      <div class="control">
        <label for="selection"><b>Treatment selection strength</b></label>
        <output id="selection-value" for="selection">3.0</output>
        <input
          id="selection"
          type="range"
          min="0"
          max="5"
          step="0.1"
          value="3"
          aria-describedby="selection-help"
        />
        <div class="ends">
          <span>0 · more overlap</span><span>5 · poorer overlap</span>
        </div>
        <p class="help" id="selection-help">
          Stronger selection makes the opposite treatment rarer for some
          baseline profiles.
        </p>
      </div>
      <div class="control">
        <label for="threshold"><b>Trimming threshold</b></label>
        <output id="threshold-value" for="threshold"
          >0.000 · keep everyone</output
        >
        <input
          id="threshold"
          type="range"
          min="0"
          max="0.5"
          step="0.001"
          value="0"
          aria-describedby="threshold-help"
        />
        <div class="ends">
          <span>0 · keep everyone</span><span>0.50 · only score 0.50</span>
        </div>
        <p class="help" id="threshold-help">
          Keep scores inside the displayed range, including its endpoints.
          The fitted scores and remaining weights stay fixed.
        </p>
      </div>
    </div>
    <div class="comparison">
      <figure aria-labelledby="histogram-title">
        <figcaption id="histogram-title">
          Who falls outside the range?
        </figcaption>
        <div class="legend">
          <span><i class="swatch"></i>Untreated</span
          ><span><i class="swatch treated"></i>Treated</span
          ><span><i class="swatch excluded"></i>Hatched = excluded</span>
        </div>
        <svg
          id="histogram"
          viewBox="0 0 420 230"
          role="img"
          aria-label="Raw fitted propensity scores by treatment arm"
        >
          <defs>
            <pattern
              id="excluded-0"
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
            >
              <rect width="5" height="5" fill="var(--surface)" />
              <path d="M-1 1L1 -1M0 5L5 0M4 6L6 4" stroke="var(--arm-0)" />
            </pattern>
            <pattern
              id="excluded-1"
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
            >
              <rect width="5" height="5" fill="var(--surface)" />
              <path d="M-1 1L1 -1M0 5L5 0M4 6L6 4" stroke="var(--arm-1)" />
            </pattern>
          </defs>
          <text x="40" y="17">People in each original arm (%)</text>
          <g stroke="var(--grid)">
            <path d="M40 30H400 M40 105H400 M40 180H400" />
          </g>
          <g text-anchor="end">
            <text x="34" y="34">100</text>
            <text x="34" y="109">50</text>
            <text x="34" y="184">0</text>
          </g>
          <g id="histogram-bars"></g>
          <g
            id="trim-guides"
            stroke="var(--warning)"
            stroke-dasharray="4 3"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path id="lower-guide" d="M40 30V180" />
            <path id="upper-guide" d="M400 30V180" />
          </g>
          <text x="40" y="199">0</text>
          <text x="220" y="199" text-anchor="middle">0.5</text>
          <text x="400" y="199" text-anchor="end">1</text>
          <text x="220" y="223" text-anchor="middle">
            Fitted chance of treatment
          </text>
        </svg>
        <p class="help">
          Solid bars are retained; hatched portions are excluded. Dashed
          lines mark the bounds. Total bar heights stay fixed as you trim.
        </p>
      </figure>
      <div class="retained-result" aria-live="polite" aria-atomic="true">
        <h2>Effect among retained people</h2>
        <p id="retained-size"></p>
        <div class="values">
          <div class="value estimate" id="retained-estimate">
            <span>IPW estimate</span><strong id="retained-ipw"></strong
            ><small id="retained-error"></small>
          </div>
          <div class="value truth">
            <span>Retained-group truth</span
            ><strong id="retained-truth"></strong>
          </div>
        </div>
        <p class="help" id="retained-status"></p>
        <p class="help">
          Treatment adds 2 to every person’s outcome, so every nonempty group has truth 2.
        </p>
        <p class="help">
          Redder estimates are farther from this group’s truth in this
          sample.
        </p>
      </div>
    </div>
    <div class="group-summary">
      <table aria-label="Constant-effect comparison for everyone, retained and excluded people">
        <caption>
          1. Constant effect · compare each estimate with its group’s truth
        </caption>
        <thead>
          <tr>
            <th scope="col">People</th>
            <th scope="col">Count</th>
            <th scope="col">IPW</th>
            <th scope="col">Group truth</th>
          </tr>
        </thead>
        <tbody id="groups"></tbody>
      </table>
      <p class="help">
        Counts show untreated / treated. Removing people does not improve
        information about those excluded, even when their estimate is
        calculable.
      </p>
      <p id="group-status" class="help"></p>
    </div>
    <div class="group-summary varying-comparison">
      <h2>2. When treatment effects vary</h2>
      <p class="help">Treatment helps people near the extremes of C more. The same threshold retains the same people, whose effects now differ.</p>
      <table aria-label="Varying-effect comparison for everyone, retained and excluded people">
        <caption>Compare each estimate with its group’s truth</caption>
        <thead>
          <tr>
            <th scope="col">People</th>
            <th scope="col">Count</th>
            <th scope="col">IPW</th>
            <th scope="col">Group truth</th>
          </tr>
        </thead>
        <tbody id="varying-groups"></tbody>
      </table>
      <p id="varying-note" class="help"></p>
      <p id="varying-status" class="help"></p>
    </div>
    <div class="actions">
      <button id="redraw">Draw another sample</button
      ><button id="restart">Restart</button
      ><span class="sample" id="sample"></span>
    </div>
  </section>
  <p class="note">
    Trimming trades fewer extreme weights for fewer people. It can help or
    hurt accuracy; one sample cannot establish a better threshold.
  </p>
  <details id="estimand-details">
    <summary>What is being estimated?</summary>
    <p class="note">
      Each row targets the average treatment effect among the people it contains.
      Because these groups are defined within this sample, the displayed truths
      are sample-specific. When treatment effects vary, trimming changes which
      effects are averaged.
    </p>
    <p class="note">
      For each group, IPW subtracts the weighted untreated mean from the
      weighted treated mean, dividing each arm by its own weight sum. No
      probability clipping is applied. Both arms and finite weights are
      needed for an estimate.
    </p>
    <p class="note">
      There are 400 people and one measured common cause, the risk score C.
      The treatment model correctly adjusts for C. Moving the threshold
      reuses the full-sample fit. Changing selection or redrawing refits;
      redraw keeps the threshold, while restart restores the original sample
      and controls.
    </p>
    <p class="note">
      Simulation truth uses each person’s two potential outcomes. Those
      values are unavailable in real data and never enter the fitted model
      or trimming rule.
      <a href="https://github.com/kirilklein/causal-sandbox/blob/main/docs/trimming-experiment.md">Calculation and validation notes</a
      >.
    </p>
  </details>
<p class="note">What can we say about all treated people when some have no controls? <a href="?lesson=positivity-sensitivity">Beyond trimming →</a></p>
<nav class="chapter-nav" aria-label="Chapter navigation"><a href="propensity-score-clipping-trimming/">← Probability clipping</a><a href="positivity/">← Back to overlap</a><a href="?sandbox">Explore scenarios ↗</a></nav>
</main>
</div>`;O();const g=document.querySelector("#threshold"),b=document.querySelector("#selection");let v=4217,h,$;const N={everyone:"Everyone",retained:"Retained",excluded:"Excluded"},y=e=>Number.isFinite(e)?e.toFixed(2):"Unavailable";function q(e){return Object.entries(e).map(([i,r])=>`<tr data-group="${i}"><th scope="row">${N[i]}</th><td class="count"><span>${r.n}</span><small>${r.counts.join(" / ")}</small></td><td class="ipw">${y(r.ipw)}</td><td class="group-truth">${y(r.truth)}</td></tr>`).join("")}function k(e,i=!1){return Object.entries(e).filter(([r,s])=>(i||r!=="retained")&&!s.available).map(([r,s])=>`${N[r]}: ${s.reason}`).join(" ")}function M(){const e=Number(g.value);for(const t of[g,b])t.style.setProperty("--fill",`${100*(Number(t.value)-Number(t.min))/(Number(t.max)-Number(t.min))}%`);const i=C(h.rows,h.effects,e),r=C($.rows,$.effects,e),s=`[${e.toFixed(3)}, ${(1-e).toFixed(3)}]`;document.querySelector("#threshold-value").textContent=e===0?"0.000 · keep everyone":`Keep ${s}`,g.setAttribute("aria-valuetext",e===0?"No trimming; keep everyone":`Keep scores from ${e.toFixed(3)} to ${(1-e).toFixed(3)}, including endpoints`),document.querySelector("#lower-guide").setAttribute("d",`M${40+360*e} 30V180`),document.querySelector("#upper-guide").setAttribute("d",`M${400-360*e} 30V180`),document.querySelector("#trim-guides").style.display=e===0?"none":"";const o=i.groups.retained,p=P(o.ipw??NaN,o.truth??NaN);document.querySelector("#retained-size").textContent=`${o.n} of ${h.rows.length} people retained · ${i.groups.excluded.n} excluded`,document.querySelector("#retained-ipw").textContent=y(o.ipw),document.querySelector("#retained-truth").textContent=y(o.truth),document.querySelector("#retained-error").textContent=o.available?p.difference:"",document.querySelector("#retained-estimate").style.setProperty("--error-tint",`${p.tint}%`),document.querySelector("#retained-status").textContent=o.reason??"",document.querySelector("#groups").innerHTML=q(i.groups),document.querySelector("#group-status").textContent=k(i.groups),document.querySelector("#varying-groups").innerHTML=q(r.groups),document.querySelector("#varying-status").textContent=k(r.groups,!0),document.querySelector("#varying-note").textContent=e===0?"Everyone is still retained. Move the trimming threshold above zero to see how the group’s truth changes.":"The retained group’s truth can differ from everyone’s: trimming changes the target population. Excluded people have their own truth, but trimming cannot recover information about them.";const d=["Untreated","Treated"];document.querySelector("#histogram-bars").innerHTML=i.histogram.map((t,l)=>t.retained.map((c,a)=>{const u=t.count?150*c/t.count:0,n=t.excluded[a],m=t.count?150*n/t.count:0,f=42+a*36+l*16,L=`${d[l]}, ${a/10} to ${(a+1)/10}${a===9?" inclusive":" (upper edge excluded)"}: ${c} retained, ${n} excluded`;return`<g data-arm="${l}" data-bin="${a}" data-retained="${c}" data-excluded="${n}" data-count="${c+n}"><title>${L}</title><rect x="${f}" y="${180-u}" width="14" height="${u}" fill="var(--arm-${l})"/><rect x="${f}" y="${180-u-m}" width="14" height="${m}" fill="url(#excluded-${l})" stroke="var(--arm-${l})" stroke-width="${n?1:0}"/></g>`}).join("")).join(""),document.querySelector("#histogram").setAttribute("aria-label",`Raw fitted scores; retained range ${s}, inclusive. `+i.histogram.map((t,l)=>`${d[l]}: ${t.count} people. `+t.retained.map((c,a)=>`${a/10} to ${(a+1)/10}${a===9?" inclusive":" upper edge excluded"}: ${c} retained, ${t.excluded[a]} excluded`).join("; ")).join(". ")),document.querySelector("#sample").textContent=`${h.rows.length} people · sample seed ${v}`}function x(){const e=Number(b.value);document.querySelector("#selection-value").textContent=e.toFixed(1),h=S({selection:e,seed:v}),$=S({selection:e,seed:v,heterogeneous:!0}),M()}g.addEventListener("input",M);b.addEventListener("input",x);document.querySelector("#redraw").addEventListener("click",()=>{v++,x()});function T(){v=4217,b.value="3",g.value="0",document.querySelectorAll(".trimming-page details").forEach(e=>{e.open=!1}),x()}document.querySelector("#restart").addEventListener("click",T);window.addEventListener("pageshow",e=>{e.persisted&&T()});x();document.querySelector("h1").focus();
