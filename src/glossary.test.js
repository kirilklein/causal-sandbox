import test from "node:test";
import assert from "node:assert/strict";
import { coreAssumptionKeys, glossary } from "./glossary.js";

const contextualTerms = [
  "adjustment",
  "aipw",
  "ate",
  "collider",
  "confounder",
  "error",
  "ess",
  "hidden",
  "ipw",
  "mediator",
  "modelForm",
  "overlap",
  "propensity",
  "regression",
];

test("glossary terms provide summaries, details, and an internal next step", () => {
  assert.ok(Object.keys(glossary).length >= 30);
  for (const [key, term] of Object.entries(glossary)) {
    assert.ok(term.title.length > 0, `${key} needs a title`);
    assert.ok(term.summary.length > 0, `${key} needs a summary`);
    assert.ok(term.detail.length > 0, `${key} needs page detail`);
    assert.ok(
      term.detail.every((paragraph) => paragraph.length > 0),
      `${key} has an empty detail paragraph`,
    );
    assert.ok(term.related.label.length > 0, `${key} needs a related label`);
    assert.match(
      term.related.href,
      /^(\?|[a-z])/,
      `${key} needs an internal link`,
    );
  }
});

test("sandbox help remains limited to its original contextual terms", () => {
  assert.deepEqual(
    Object.entries(glossary)
      .filter(([, term]) => term.contextual)
      .map(([key]) => key)
      .sort(),
    contextualTerms,
  );
});

test("the glossary separates effect and overlap concepts", () => {
  assert.match(glossary.ate.detail.join(" "), /Average describes aggregation/);
  assert.match(glossary["total-effect"].summary, /every causal pathway/);
  assert.match(glossary.positivity.summary, /requires every covariate pattern/);
  assert.match(
    glossary.overlap.detail.join(" "),
    /cannot prove the positivity/,
  );
});

test("core causal assumptions are distinct and cite supporting sources", () => {
  assert.deepEqual(coreAssumptionKeys, [
    "consistency",
    "exchangeability",
    "positivity",
    "no-interference",
  ]);
  for (const key of coreAssumptionKeys) {
    const term = glossary[key];
    assert.ok(term, `${key} needs a glossary entry`);
    assert.ok(term.sources.length > 0, `${key} needs a reference`);
    for (const source of term.sources) {
      assert.ok(source.label.length > 0, `${key} has an unnamed reference`);
      assert.match(
        source.href,
        /^https:\/\//,
        `${key} needs an HTTPS reference`,
      );
    }
  }
  assert.match(glossary.consistency.summary, /observed outcome equals/);
  assert.match(glossary.exchangeability.summary, /potential outcomes/);
  assert.match(glossary.positivity.summary, /positive chance/);
  assert.match(glossary["no-interference"].summary, /other people/);
});
