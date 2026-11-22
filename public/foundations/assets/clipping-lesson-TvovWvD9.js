/* empty css                        */import{i as S}from"./brand--vQh_tom.js";import{s as q,l as C}from"./lesson-simulation-DgNFmLuF.js";import{c as M,a as x,f as k}from"./clipping-experiment-DJtYHRCk.js";import{e as E}from"./effect-comparison-D_sRXFX7.js";import{t as L}from"./theme-Vjupx5_i.js";import{l as W,s as P}from"./lesson-navigation-D3qgvbW9.js";import"./simulation-BOxkiD6q.js";import"./glossary-Cn9xhfdQ.js";import"./foundations-progress-CLDiwUAt.js";document.body.dataset.lesson||(document.title="What changes when we clip? · Causal Sandbox");document.querySelector("#app").innerHTML=`<div class="clipping-page">
<main>
  <header>
    <a class="brand" href="./">${S}<span>Causal Sandbox</span></a>${L()}
  </header>
  ${W({currentOptional:"clipping"})}
  <p class="eyebrow">Overlap · optional chapter</p>
  <h1 tabindex="-1">What changes when we clip?</h1>
  <p class="lede">
    Make treatment choice more predictable to create extreme weights. Then
    try modest clipping and see what happens if you push it further.
  </p>
  <p class="help">Start a new 400-person study with clipping off. Earlier lessons use 2,400 people and clip probabilities to [0.02, 0.98].</p>
  <section class="experiment" aria-labelledby="experiment-title">
    <div class="heading">
      <h2 id="experiment-title">Change overlap, then try clipping</h2>
      <span class="truth">True effect <b>2.00</b></span>
    </div>
    <div class="controls">
      <div class="control">
        <label class="control-label" for="selection"
          ><b>Treatment selection strength</b
          ><output id="selection-value" for="selection">3.0</output></label
        >
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
          baseline profiles. Rare treatment choices can receive large
          weights.
        </p>
      </div>
      <div class="control">
        <label class="control-label" for="threshold"
          ><b>Probability-clipping threshold</b
          ><output id="threshold-value" for="threshold"
            >0.000 · no clipping</output
          ></label
        >
        <input
          id="threshold"
          type="range"
          min="0"
          max="0.1"
          step="0.001"
          value="0"
          aria-describedby="threshold-help"
        />
        <div class="ends">
          <span>0 · no clipping</span><span>0.10</span>
        </div>
        <p class="help" id="threshold-help">
          Move probabilities to these bounds without changing people or
          fitted models. Start with a small threshold such as 0.005.
        </p>
      </div>
    </div>
    <details id="cap-options">
      <summary>Try capping weights instead</summary>
      <p class="help">Capping limits only large weights. Probability clipping can also increase small weights. Both retain everyone.</p>
      <label class="cap-switch"><input type="checkbox" id="cap-enabled"> Use a weight cap instead of probability clipping</label>
      <label for="weight-cap">Maximum weight <output id="cap-value" for="weight-cap">50</output></label>
      <input id="weight-cap" type="range" min="1" max="300" step="1" value="50" disabled aria-describedby="cap-help">
      <p id="cap-help" class="help">Weights above this limit become the limit; smaller weights stay unchanged. IPW and the AIPW residual correction use these capped weights.</p>
    </details>
    <p id="active-operation" class="help" aria-live="polite"></p>
    <div class="comparisons">
      <figure aria-labelledby="histogram-title">
        <figcaption id="histogram-title">
          Raw propensity scores
        </figcaption>
        <div class="legend"><span>Untreated</span><span>Treated</span></div>
        <svg
          id="histogram"
          viewBox="0 0 420 230"
          role="img"
          aria-label="Fitted treatment probabilities by treatment arm"
        >
          <text x="40" y="17">People in each arm (%)</text>
          <rect
            id="lower-tail"
            x="40"
            y="30"
            width="0"
            height="150"
            fill="var(--note-surface)"
          />
          <rect
            id="upper-tail"
            x="400"
            y="30"
            width="0"
            height="150"
            fill="var(--note-surface)"
          />
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
            id="clip-guides"
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
          Dashed lines mark active probability-clipping bounds. Bars stay fixed when you clip probabilities or cap weights.
        </p>
      </figure>
      <div class="results" aria-live="polite" aria-atomic="true">
        <p id="unavailable" hidden></p>
        <table aria-label="Estimates with and without clipping">
          <thead>
            <tr>
              <th scope="col">Method</th>
              <th scope="col">Original</th>
              <th scope="col" id="selected-label">Selected threshold</th>
            </tr>
          </thead>
          <tbody id="estimates"></tbody>
        </table>
        <p class="help">
          Stronger red means farther from truth in this sample, not
          statistical significance.
        </p>
      </div>
    </div>
    <div class="actions">
      <button id="redraw">Draw another sample</button
      ><button id="restart">Restart</button
      ><span class="sample" id="sample"></span>
    </div>
    <details id="weights">
      <summary>What happened to the weights?</summary>
      <table>
        <caption>
          Original → selected operation
        </caption>
        <thead>
          <tr>
            <th scope="col">Diagnostic</th>
            <th scope="col">Untreated</th>
            <th scope="col">Treated</th>
          </tr>
        </thead>
        <tbody id="diagnostics"></tbody>
      </table>
      <p class="help">
        Effective sample size describes weight concentration, not retained
        people or a guarantee of precision. Clipping does not change the
        underlying treatment overlap.
      </p>
    </details>
  </section>
  <p class="note">
    Limiting weights can reduce variation across studies while introducing
    bias. A single sample cannot show that tradeoff; moving closer to truth
    here does not establish a better threshold.
  </p>
  <details>
    <summary>What stays fixed in this experiment?</summary>
    <p class="note">
      There are 400 people and one measured baseline variable C. Both models
      correctly adjust for C. The total effect is 2, with no hidden
      confounding or post-treatment adjustment.
    </p>
    <p class="note">
      Selection strength changes treatment assignment and outcomes, keeping
      the sample’s risk scores and background random draws fixed. Both models are
      refitted for that world.
    </p>
    <p class="note">
      Moving the threshold reuses the same fitted probabilities and outcome
      predictions. Outcome regression is unchanged. AIPW may respond less
      because its outcome model is correct here. Clipping is no guarantee
      against model misspecification and cannot supply missing comparisons.
    </p>
    <p class="note">
      IPW normalizes weights separately in each treatment group. AIPW
      averages predicted contrasts plus signed weighted errors over
      everyone.
      <a href="https://github.com/kirilklein/causal-sandbox/blob/main/docs/clipping-experiment.md">Calculation and validation notes</a
      >.
    </p>
  </details>
<aside class="trimming-preview" aria-label="Optional exploration"><small>Optional exploration</small><h2><a href="?lesson=trimming">Next: who remains after trimming? →</a></h2><p>See how excluding people changes the target population.</p></aside>
<nav class="chapter-nav" aria-label="Chapter navigation"><a href="positivity/">← Back to overlap</a><a href="?sandbox">Explore scenarios ↗</a></nav>
</main>
</div>`;P();const h=document.querySelector("#threshold"),g=document.querySelector("#selection"),f=document.querySelector("#cap-enabled"),u=document.querySelector("#weight-cap"),w=400;let b=4217,d,c;const T=[["regression","Outcome regression"],["ipw","IPW"],["aipw","AIPW"]];function v(){const t=f.checked,a=t?0:Number(h.value),l=Number(u.value);h.disabled=t,u.disabled=!t,document.querySelector("#cap-value").textContent=l,document.querySelector("#selected-label").textContent=t?"Capped weights":"Selected threshold",document.querySelector("#active-operation").textContent=t?`Weight cap: ${l}. Probability clipping is off; everyone stays in the study.`:"Probability clipping keeps everyone in the study.";for(const e of[h,g,u])e.style.setProperty("--fill",`${100*(Number(e.value)-Number(e.min))/(Number(e.max)-Number(e.min))}%`);document.querySelector("#threshold-value").textContent=t?"Inactive while capping weights":a===0?"0.000 · no clipping":`${a.toFixed(3)} → [${a.toFixed(3)}, ${(1-a).toFixed(3)}]`,document.querySelector("#lower-tail").setAttribute("width",360*a),document.querySelector("#upper-tail").setAttribute("x",400-360*a),document.querySelector("#upper-tail").setAttribute("width",360*a),document.querySelector("#lower-guide").setAttribute("d",`M${40+360*a} 30V180`),document.querySelector("#upper-guide").setAttribute("d",`M${400-360*a} 30V180`),document.querySelector("#clip-guides").style.display=a===0?"none":"";const r=t?M(d,l):x(d,a),s=document.querySelector("#unavailable");s.hidden=r.available&&c.available,s.textContent=[c,r].filter(e=>!e.available).map(e=>e.reason).join(" ");const i=(e,o,m)=>{const p=E(e.available?e[o]:NaN,2);return`<td${m?` class="selected" style="--error-tint:${p.tint}%"`:""}><strong>${p.value}</strong><small>${p.difference}</small></td>`};document.querySelector("#estimates").innerHTML=T.map(([e,o])=>`<tr data-method="${e}"><th scope="row">${o}</th>${i(c,e,!1)}${i(r,e,!0)}</tr>`).join("");const n=[["People","count",0],[t?"Capped weights":"Clipped probabilities",t?"capped":"clipped",0],["Largest weight","maxWeight",1],["Effective sample size","ess",0]];document.querySelector("#diagnostics").innerHTML=n.map(([e,o,m])=>`<tr><th scope="row">${e}</th>${[0,1].map(p=>`<td>${c.available?c.overlap[p][o].toFixed(m):"Unavailable"} → ${r.available?r.overlap[p][o].toFixed(m):"Unavailable"}</td>`).join("")}</tr>`).join(""),document.querySelector("#sample").textContent=`${w} people · sample seed ${b}`}function y(){const t=Number(g.value);document.querySelector("#selection-value").textContent=t.toFixed(1),d=k(q({...C(10),n:w,selection:t,seed:b})),c=x(d,0);const a=[0,1].map(s=>({count:d.filter(i=>i.A===s).length,bins:Array(10).fill(0)}));d.forEach(({A:s,p:i})=>a[s].bins[Math.min(9,Math.floor(i*10))]++);const l=["Untreated","Treated"],r=a.map((s,i)=>`${l[i]}: ${s.count} people; ${s.bins.map((n,e)=>`${e/10} to ${(e+1)/10}${e===9?" inclusive":" exclusive"}: ${n}`).join("; ")}`).join(". ");document.querySelector("#histogram").setAttribute("aria-label",`Raw fitted propensity scores. ${r}`),document.querySelector("#histogram-bars").innerHTML=a.map((s,i)=>s.bins.map((n,e)=>{const o=s.count?100*n/s.count:0;return`<rect data-arm="${i}" data-bin="${e}" data-count="${n}" x="${42+e*36+i*16}" y="${180-1.5*o}" width="14" height="${1.5*o}" fill="var(--arm-${i})" ${i===0?'fill-opacity="0.18" stroke="var(--arm-0)"':""}><title>${l[i]}, ${e/10}–${(e+1)/10}: ${n} people (${o.toFixed(1)}% of this arm)</title></rect>`}).join("")).join(""),v()}h.addEventListener("input",v);f.addEventListener("change",v);u.addEventListener("input",v);g.addEventListener("input",y);document.querySelector("#redraw").addEventListener("click",()=>{b++,y()});function $(){b=4217,g.value="3",h.value="0",f.checked=!1,u.value="50",document.querySelectorAll(".clipping-page details").forEach(t=>{t.open=!1}),y()}document.querySelector("#restart").addEventListener("click",$);window.addEventListener("pageshow",t=>{t.persisted&&$()});y();document.querySelector("h1").focus();
