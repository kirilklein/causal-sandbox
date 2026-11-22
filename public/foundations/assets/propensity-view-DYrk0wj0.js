const n=e=>`${(100*e).toFixed(e<.001||e>.999?3:1)}%`;function r(e,t,a,s=!1){return`<g class="ps-patient" data-patient="${e.person}" transform="translate(${t.toFixed(2)} ${a.toFixed(2)})">
    <title>Person ${e.person}: ${e.A?"treated":"untreated"}${e.p===void 0?"":`; estimated treatment probability ${n(e.p)}`}</title>
    ${s?'<circle class="ps-selection" r="9"/>':""}
    ${e.A?'<path class="ps-treated" d="M0 -4.5L4.5 3.5H-4.5Z"/>':'<circle class="ps-untreated" r="3.5"/>'}
  </g>`}const i='<span class="ps-legend"><span><svg viewBox="0 0 16 16" aria-hidden="true"><circle class="ps-untreated" cx="8" cy="8" r="4"/></svg>Untreated</span><span><svg viewBox="0 0 16 16" aria-hidden="true"><path class="ps-treated" d="M8 3L13 12H3Z"/></svg>Treated</span></span>';function p(e){return e.map(t=>`<option value="${t.person}">Person ${t.person}</option>`).join("")}export{i as a,r as b,n as c,p};
