import test from "node:test";
import assert from "node:assert/strict";
import { mapRegions } from "./concept-map-data.js";
import {
  openingLesson,
  coreLessons,
  optionalChapters,
  lessonExperiments,
} from "./lesson-catalog.js";
import { searchEntries } from "./search-index.js";

test("the map connects regions and covers the current curriculum with known destinations", () => {
  const available = new Set([
    openingLesson.id,
    ...coreLessons.map(([, slug]) => slug),
    ...optionalChapters.map(({ id }) => id),
    ...lessonExperiments.map(({ id }) => id),
  ]);
  const linked = new Set();
  const regions = new Set(mapRegions.map(({ id }) => id));
  for (const region of mapRegions) {
    assert.equal(
      new Set(region.concepts.map(({ id }) => id)).size,
      region.concepts.length,
    );
    for (const concept of region.concepts) {
      assert.ok(regions.has(concept.connection[0]));
      assert.notEqual(concept.connection[0], region.id);
      for (const slug of concept.lessons) {
        assert.ok(available.has(slug), `Unknown map destination: ${slug}`);
        linked.add(slug);
      }
    }
  }
  assert.deepEqual([...linked].sort(), [...available].sort());
  assert.ok(
    searchEntries.some(
      ({ href, keywords }) =>
        href === "?lesson=concept-map" && keywords.includes("overview"),
    ),
  );
});
