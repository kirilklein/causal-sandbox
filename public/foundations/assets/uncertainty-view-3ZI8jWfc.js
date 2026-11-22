import{n as M,e as b,f as S}from"./uncertainty-WO1XxuBT.js";const m=t=>t.toFixed(2).replace(/^-0\.00$/,"0.00"),f=t=>t!==0&&Math.abs(t)<.005?t.toPrecision(2):m(t),z=t=>t<1e-4?"< 0.0001":t.toFixed(4);function j(t,{width:a=700,domain:l=[-1,5],truth:i=!1}={}){if(t.status!=="ok")return`<p>Unavailable: ${t.reason}</p>`;const s=28,r=a-28,n=c=>s+(Math.max(l[0],Math.min(l[1],c))-l[0])/(l[1]-l[0])*(r-s),d=Math.max(68,Math.min(a-68,n(t.estimate)));return`<svg class="inference-chart estimate-chart" viewBox="0 0 ${a} 174" role="img" aria-label="Estimate ${m(t.estimate)}; 95% confidence interval ${f(t.lower)} to ${f(t.upper)} outcome units${i?`; true effect ${m(t.truth)}`:""}.">
    <path class="inference-grid" d="M${s} 82H${r}"/>
    <path class="inference-grid" d="M${n(0)} 58V98"/>
    <text x="${n(0)}" y="115" text-anchor="middle">0</text>
    ${i?`<path class="inference-truth" d="M${n(t.truth)} 42V145"/><text x="${Math.max(60,Math.min(a-60,n(t.truth)))}" y="164" text-anchor="middle">Truth: ${m(t.truth)}</text>`:""}
    <g class="inference-interval"><path d="M${n(t.lower)} 75V89M${n(t.lower)} 82H${n(t.upper)}M${n(t.upper)} 75V89"/><circle cx="${n(t.estimate)}" cy="82" r="5"/>${t.lower<l[0]?`<path d="m${s+5} 77-5 5 5 5"/>`:""}${t.upper>l[1]?`<path d="m${r-5} 77 5 5-5 5"/>`:""}</g>
    <text class="estimate-label" x="${d}" y="26" text-anchor="middle">Estimate ${m(t.estimate)}</text>
    <path class="inference-observed" d="M${n(t.estimate)} 37V69"/>
    <text x="${a/2}" y="140" text-anchor="middle">95% interval: ${f(t.lower)} to ${f(t.upper)}</text>
  </svg>`}function B(t,a){return`<div class="resample-trace" aria-label="First 6 of ${t.length} participants: original copy and copies in one resample">${t.slice(0,6).map((l,i)=>`<div class="resample-person" data-person="${i+1}" data-copies="${a?a[i]:"unknown"}"><span class="small">Person ${i+1}</span><div class="person-copies"><span class="person-token arm-${l.A}">${i+1}</span><span aria-hidden="true">→</span><span class="resampled-copies">${a?a[i]?Array.from({length:a[i]},()=>`<span class="person-token arm-${l.A}">${i+1}</span>`).join(""):'<span class="person-omitted" aria-label="Not selected">×</span>':'<span class="person-pending">?</span>'}</span></div></div>`).join("")}</div>`}function V(t){return`<svg class="inference-chart assignment-chart" viewBox="0 0 330 116" role="img" aria-label="${t?"Risk score affects both treatment and outcome: confounding.":"Risk score affects outcome, but treatment is randomized."}">
    <defs><marker id="assignment-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z"/></marker></defs>
    <g class="assignment-edges" marker-end="url(#assignment-arrow)"><path d="M78 82H245"/><path d="M181 37L250 70"/>${t?'<path d="M148 37L80 70"/>':""}</g>
    <circle class="node-c" cx="165" cy="27" r="20"/><circle class="node-a" cx="58" cy="82" r="20"/><circle class="node-y" cx="272" cy="82" r="20"/>
    <text x="165" y="31" text-anchor="middle">C</text><text x="58" y="86" text-anchor="middle">A</text><text x="272" y="86" text-anchor="middle">Y</text>
    <text x="204" y="22">Risk score</text><text x="58" y="114" text-anchor="middle">Treatment</text><text x="272" y="114" text-anchor="middle">Outcome</text>
  </svg>`}const E=[M(.2,.05),M(1,.7)];function w(t,a=700){const i=a-24,s=n=>24+(n+.5)/3*(i-24),r=t===2;return`<svg class="inference-chart opening-chart" viewBox="0 0 ${a} 244" role="img" aria-label="${r?"Study A: estimate 0.20, 95% interval 0.10 to 0.30 excludes zero. Study B: estimate 1.00, interval -0.37 to 2.37 includes zero.":`Effect estimate A: 0.20${t?"; effect estimate B: 1.00":""}. Uncertainty has not been shown.`}">
    <path class="inference-zero" d="M${s(0)} 35V208"/>
    ${E.slice(0,t?2:1).map((n,d)=>{const c=65+d*105;return`<g class="opening-study" data-study="${d}" data-zero="${r?n.lower<=0&&n.upper>=0?"included":"excluded":"unknown"}">
        <text x="${i}" y="${c-27}" text-anchor="end">Study ${d?"B":"A"} · +${m(n.estimate)}</text>
        ${r?`<path class="opening-interval" d="M${s(n.lower)} ${c-5}V${c+5}M${s(n.lower)} ${c}H${s(n.upper)}M${s(n.upper)} ${c-5}V${c+5}"/><text x="${i}" y="${c+26}" text-anchor="end">95% CI: ${f(n.lower)} to ${f(n.upper)}</text>`:""}
        <circle class="opening-estimate" cx="${s(n.estimate)}" cy="${c}" r="5"/>
      </g>`}).join("")}
    ${[0,1,2].map(n=>`<text x="${s(n)}" y="224" text-anchor="middle">${n}</text>`).join("")}
    <text x="${a/2}" y="243" text-anchor="middle">Effect estimate · 0 means no effect</text>
  </svg>`}function A(t,a=700){const s=Array(24).fill(0);let r=0;for(const e of t.estimates){if(e<-1||e>5){r++;continue}s[Math.min(23,Math.floor(24*(e- -1)/6))]++}const n=30,d=a-18,c=e=>n+(Math.max(-1,Math.min(5,e))- -1)/6*(d-n),p=e=>120*e/Math.max(1,...s);return`<svg class="inference-chart" viewBox="0 0 ${a} 250" data-count="${t.estimates.length}" role="img" aria-label="${t.estimates.length} bootstrap estimates on a fixed -1 to 5 axis. ${r} outside the axis. Solid line: observed estimate ${m(t.observed.estimate)}. Dashed line: causal effect 2.">
    ${s.map((e,x)=>`<rect class="bootstrap-bar" data-count="${e}" x="${n+x*(d-n)/24}" y="${170-p(e)}" width="${(d-n)/24-1}" height="${p(e)}"><title>${e} resamples: ${m(-1+x/4)} to ${m(-1+(x+1)/4)}</title></rect>`).join("")}
    <path class="inference-observed" d="M${c(t.observed.estimate)} 30V175"/>
    <path class="inference-truth" d="M${c(2)} 30V175"/>
    <circle class="bootstrap-first" cx="${c(t.estimates[0])}" cy="170" r="4"><title>First resample: ${m(t.estimates[0])}</title></circle>
    <text x="${n}" y="17">${t.estimates.length} resamples · tallest bar: ${Math.max(...s)}</text>
    ${[-1,0,1,2,3,4,5].map(e=>`<text x="${c(e)}" y="197" text-anchor="middle">${e}</text>`).join("")}
    <text x="${a/2}" y="224" text-anchor="middle">Resampled mean difference</text>
    ${r?`<text x="${a/2}" y="248" text-anchor="middle">${r} outside axis; included in SE</text>`:""}
  </svg>`}function H(t,a=700){const l=b(t.estimates);if(!l.length)return"<p>At least two resamples are needed to estimate SE.</p>";const i=l.at(-1),s=44,r=a-22,n=32,d=190,c=Math.max(100,i.count),p=Math.max(t.observed.se*2,...l.map(o=>o.se))*1.1,e=o=>s+o/c*(r-s),x=o=>d-o/p*(d-n),u=l.map((o,h)=>`${h?"L":"M"}${e(o.count)} ${x(o.se)}`).join(" ");return`<svg class="inference-chart" viewBox="0 0 ${a} 245" data-count="${i.count}" role="img" aria-label="Bootstrap standard error using the first 2 through ${i.count} resamples. Current SE ${m(i.se)}; formula SE reference ${m(t.observed.se)}. More resamples stabilize the SE estimate, not the study's precision.">
    <text x="${s}" y="17">SE · outcome units</text>
    ${[0,p/2,p].map(o=>`<path class="inference-grid" d="M${s} ${x(o)}H${r}"/><text x="${s-8}" y="${x(o)+4}" text-anchor="end">${m(o)}</text>`).join("")}
    <path class="bootstrap-se-reference" d="M${s} ${x(t.observed.se)}H${r}"><title>Formula SE: ${m(t.observed.se)}</title></path>
    <path class="bootstrap-se-path" d="${u}"/>
    <circle class="bootstrap-se-current" cx="${e(i.count)}" cy="${x(i.se)}" r="4" data-se="${i.se}"><title>${i.count} resamples: SE ${m(i.se)}</title></circle>
    ${[0,c/2,c].map(o=>`<text x="${e(o)}" y="214" text-anchor="middle">${o.toLocaleString("en-US")}</text>`).join("")}
    <text x="${a/2}" y="239" text-anchor="middle">Number of resamples</text>
  </svg>`}function L(t,{truth:a=!1,width:l=700,rowGap:i=9,maxRows:s=50,fixedRows:r,domain:n=[-1,5],ticks:d=[-1,0,1,2,3,4,5]}={}){const[c,p]=n,e=t.slice(-s),x=32,u=l-18,o=$=>x+(Math.max(c,Math.min(p,$))-c)/(p-c)*(u-x),h=38+(r??e.length)*i;return`<svg class="inference-chart" viewBox="0 0 ${l} ${h+50}" role="img" aria-label="${e.length===1?"Estimate and 95% confidence interval":`${e.length} study estimates and their 95% confidence intervals`}, in outcome units${a?"; dashed line is the true effect":""}. Each mark has its study values.">
    ${d.map($=>`<path class="inference-grid" d="M${o($)} 28V${h}"/><text x="${o($)}" y="${h+20}" text-anchor="middle">${$}</text>`).join("")}
    ${a?`<path class="inference-truth" d="M${o(e[0].truth)} 24V${h}"/><text x="${o(e[0].truth)}" y="16" text-anchor="middle">Truth: ${m(e[0].truth)}</text>`:""}
    ${e.map(($,v)=>{if($.status!=="ok")return"";const g=33+v*i,y=a&&($.lower>$.truth||$.upper<$.truth);return`<g class="inference-interval${y?" missed":""}" data-seed="${$.seed}" data-covered="${a?!y:"unknown"}"><title>Study ${$.seed}: ${m($.estimate)}, interval ${m($.lower)} to ${m($.upper)}${a?y?"; misses truth":"; covers truth":""}</title><path d="M${o($.lower)} ${g}H${o($.upper)}"/><circle cx="${o($.estimate)}" cy="${g}" r="${e.length===1?4:Math.min(2.5,i/2-.5)}"/>${$.lower<c?`<path d="m${x+5} ${g-4}-5 4 5 4"/>`:""}${$.upper>p?`<path d="m${u-5} ${g-4}5 4-5 4"/>`:""}</g>`}).join("")}
    <text x="${l/2}" y="${h+43}" text-anchor="middle">Outcome difference (treated − untreated)</text>
  </svg>`}function P(t,a,l=700){const s=l-18,r=e=>32+(Math.max(-4,Math.min(4,e))+4)/8*(s-32),n=e=>155-S(e)*290,d=(e,x)=>Array.from({length:101},(u,o)=>{const h=e+(x-e)*o/100;return`${o?"L":"M"}${r(h)},${n(h)}`}).join(" "),c=a?Math.min(4,Math.abs(a.z)):4,p=a?a.p*50<.01?"<0.01":(a.p*50).toFixed(2):"";return`<svg class="inference-chart" viewBox="0 0 ${l} 250" role="img" aria-label="Standard normal approximation under a zero difference. ${a?`Both shaded tails are at least as extreme as the observed z of ${m(a.z)}. Two-sided p ${z(a.p)}.`:"Dots are test statistics from repeated null studies."}">
    ${[-4,-2,0,2,4].map(e=>`<path class="inference-grid" d="M${r(e)} 25V210"/><text x="${r(e)}" y="228" text-anchor="middle">${e}</text>`).join("")}
    ${a?[[-4,-c],[c,4]].map(([e,x])=>`<path class="inference-tail" d="${d(e,x)}L${r(x)} 155H${r(e)}Z"/>`).join(""):""}
    <path class="inference-density" d="${d(-4,4)}"/>
    ${a?`<text class="tail-label" x="62" y="112" text-anchor="middle">${p}%</text><text class="tail-label" x="${s-30}" y="112" text-anchor="middle">${p}%</text>`:""}
    ${t.filter(e=>e.status==="ok").map((e,x)=>`<circle class="null-dot" cx="${r(e.z)}" cy="${177+x%5*6}" r="2.3"><title>Null study ${e.seed}: z = ${m(e.z)}</title></circle>`).join("")}
    ${a?`<path class="inference-observed" d="M${r(a.z)} 28V157"/><text x="${Math.max(82,Math.min(s-50,r(a.z)))}" y="17" text-anchor="middle">Observed z: ${m(a.z)}</text>`:""}
    ${a&&Math.abs(a.z)>4?`<path class="inference-observed" d="m38 150-6 5 6 5m${s-32-12} -10 6 5-6 5"/>`:""}
    <text x="${l/2}" y="249" text-anchor="middle">z = estimate / standard error</text>
  </svg>`}export{H as a,A as b,V as c,j as e,m as f,L as i,P as n,w as o,z as p,B as r};
