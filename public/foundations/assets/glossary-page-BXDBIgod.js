import{g as l,c as t}from"./glossary-Cn9xhfdQ.js";const o=Object.entries(l).sort(([,a],[,s])=>a.title.localeCompare(s.title));document.querySelector("#glossary-contents-list").innerHTML=o.map(([a,s])=>`<a href="glossary/#${a}">${s.title}</a>`).join("");document.querySelector("#glossary-assumptions-list").innerHTML=t.map(a=>`<a href="glossary/#${a}"><span>${l[a].title}</span><p>${l[a].formal}</p></a>`).join("");document.querySelector("#glossary-entries").innerHTML=o.map(([a,s],r)=>`
      <section id="${a}" class="glossary-entry">
        <p class="section-number">${String(r+1).padStart(2,"0")} · TERM</p>
        <h2>${s.title}</h2>
        ${s.aliases?.length?`<p class="glossary-aliases"><span>Related names</span>${s.aliases.join(" · ")}</p>`:""}
        <p class="glossary-summary">${s.summary}</p>
        <div class="glossary-detail">${s.detail.map(e=>`<p>${e}</p>`).join("")}</div>
        ${s.sources?.length?`<p class="glossary-sources"><span>${s.sources.length===1?"Reference":"References"}</span>${s.sources.map(e=>`<a href="${e.href}">${e.label}</a>`).join(" · ")}</p>`:""}
        <a class="glossary-related" href="${s.related.href}">${s.related.label} →</a>
        <a class="glossary-back" href="glossary/#glossary-title">Back to terms ↑</a>
      </section>`).join("");document.getElementById(location.hash.slice(1))?.scrollIntoView();
