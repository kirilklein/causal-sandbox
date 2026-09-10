import assert from "node:assert/strict";
import test from "node:test";
import { searchEntries, searchTopics } from "./search-index.js";
import { coreLessons, lessonHref, optionalChapters } from "./lesson-catalog.js";
import { glossary } from "./glossary.js";

test("finds concepts by abbreviation, related phrase, and word prefix", () => {
  assert.equal(searchTopics("  AiPw! ")[0].href, "glossary/#aipw");
  assert.equal(
    searchTopics("exchangeability")[0].href,
    "glossary/#exchangeability",
  );
  assert.equal(
    searchTopics("extreme weights")[0].href,
    "propensity-score-clipping-trimming/",
  );
  assert.ok(
    searchTopics("confound").some(({ href }) => href === "?lesson=confounding"),
  );
  assert.ok(
    searchTopics("DAG").some(({ href }) => href === "?sandbox=graph-lab"),
  );
  assert.ok(
    searchTopics("IV").some(({ href }) => href === "?lesson=instrument"),
  );
  assert.ok(
    !searchTopics("IV").some(({ href }) => href === "glossary/#positivity"),
  );
});

test("weight searches include weighting methods and the clipping definition", () => {
  const destinations = searchTopics("weights").map(({ href }) => href);
  for (const href of [
    "inverse-probability-weighting/",
    "glossary/#ipw",
    "glossary/#clipping",
  ]) {
    assert.ok(destinations.includes(href), href);
  }
});

test("requires every query word and handles empty or unmatched input", () => {
  for (const query of [
    "",
    "   ",
    "???",
    "notarealconcept",
    "collider notarealconcept",
  ]) {
    assert.deepEqual(searchTopics(query), []);
  }
  assert.ok(
    searchTopics("hidden confounding").some(
      ({ href }) => href === "?lesson=hidden-confounding",
    ),
  );
});

test("ranks exact titles and aliases ahead of descriptions and deduplicates destinations", () => {
  const entries = [
    {
      title: "Background",
      description: "A collider creates a selection path.",
      href: "background/",
    },
    {
      title: "Common effect",
      aliases: ["Collider"],
      description: "",
      href: "effect/",
    },
    { title: "Collider", description: "", href: "collider/" },
    { title: "Duplicate collider", description: "", href: "collider/" },
  ];
  assert.deepEqual(
    searchTopics("collider", entries).map(({ href }) => href),
    ["collider/", "effect/", "background/"],
  );
});

test("indexes every current lesson and glossary anchor with one entry per URL", () => {
  const destinations = searchEntries.map(({ href }) => href);
  assert.equal(new Set(destinations).size, destinations.length);
  for (const href of [
    ...coreLessons.map(lessonHref),
    ...optionalChapters.map((chapter) => chapter.href),
    ...Object.keys(glossary).map((key) => `glossary/#${key}`),
  ])
    assert.ok(destinations.includes(href), href);
  for (const entry of searchEntries) {
    assert.ok(entry.title && entry.type && entry.description && entry.href);
    assert.ok(!entry.href.startsWith("/"), entry.href);
  }
});
