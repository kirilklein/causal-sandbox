import test from "node:test";
import assert from "node:assert/strict";
import { openingPeople, populationMarkup } from "./what-if-population.js";
import { profiles } from "./trajectory-model.js";

test("the opening retains the landscape's people and compares the same ten under each treatment", () => {
  assert.deepEqual(
    openingPeople.map((p) => p.id),
    profiles().map((p) => p.id),
  );
  assert.equal(new Set(openingPeople.map((p) => p.id)).size, 10);
  assert.equal(openingPeople[7].severity, 7);
  assert.equal(openingPeople[7].treatment, 1);
  const means = [0, 1].map(
    (a) => openingPeople.reduce((sum, p) => sum + p.outcomes[a], 0) / 10,
  );
  assert.deepEqual(means, [54, 66]);
  const html = populationMarkup(false);
  assert.equal((html.match(/data-outcome=/g) || []).length, 20);
  assert.match(html, /66.0 − 54.0/);
  assert.match(html, /\+12.0 health points/);
});

test("observed-only view preserves identities but removes every missing outcome's value and position", () => {
  const html = populationMarkup(true);
  const rows = html.match(/<g class="what-if-person"[\s\S]*?<\/g>/g);
  assert.equal(rows.length, 20);
  rows.forEach((row, index) => {
    const person = openingPeople[index % 10];
    const treatment = index < 10 ? 1 : 0;
    assert.match(row, new RegExp(person.label));
    if (person.treatment === treatment) {
      assert.match(
        row,
        new RegExp(`data-outcome="${treatment}" data-observed="true"`),
      );
      assert.ok(row.includes(person.outcomes[treatment].toFixed(1)));
    } else {
      assert.match(row, /class="what-if-missing"/);
      assert.ok(!row.includes("<circle"));
      assert.ok(!row.includes(person.outcomes[treatment].toFixed(1)));
    }
  });
  assert.equal((html.match(/Average unknown/g) || []).length, 2);
  assert.ok(!html.includes('class="what-if-mean"'));
  assert.ok(!html.includes("+12.0"));
});
