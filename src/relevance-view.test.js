import test from "node:test";
import assert from "node:assert/strict";
import { relevanceSample } from "./relevance-simulation.js";
import {
  relevanceScenes,
  relevanceGraph,
  relevancePlot,
  relevanceSummaries,
} from "./relevance-view.js";

test("the storyboard's graphs match the two specified mechanisms", () => {
  const [proxy, collider] = relevanceScenes;
  assert.deepEqual(
    new Set(proxy.edges.map((e) => e.join(""))),
    new Set(["UA", "UY", "UV", "AY"]),
  );
  assert.deepEqual(
    new Set(collider.edges.map((e) => e.join(""))),
    new Set(["PA", "PV", "RV", "RY", "AY"]),
  );
  for (const scene of relevanceScenes) {
    const graph = relevanceGraph(scene);
    assert.equal(
      scene.edges.some(([from]) => from === "V"),
      false,
    );
    assert.match(graph, /role="img"/);
    assert.ok(!graph.includes("NaN") && !graph.includes("Infinity"));
    assert.equal((graph.match(/data-edge=/g) || []).length, scene.edges.length);
  }
});

test("paired plots retain actual estimates and a shared truth axis", () => {
  for (const scene of relevanceScenes) {
    const studies = Array.from({ length: 60 }, (_, i) =>
      relevanceSample({ world: scene.world, seed: 100 + i }),
    );
    const before = relevancePlot(studies, false);
    const after = relevancePlot(studies, true);
    assert.equal((before.match(/class="study-dot"/g) || []).length, 60);
    assert.equal((after.match(/class="study-dot"/g) || []).length, 120);
    assert.equal(
      before.includes('class="study-dot" data-study="0" data-arm="1"'),
      false,
    );
    for (let i = 0; i < 60; i++)
      for (let arm = 0; arm < 2; arm++) {
        assert.ok(
          after.includes(
            `data-study="${i}" data-arm="${arm}" data-estimate="${studies[i].fits[arm].effect}"`,
          ),
        );
      }
    assert.match(before, /x1="148\.8" x2="148\.8"/);
    assert.match(after, /x1="148\.8" x2="148\.8"/);
    const summary = relevanceSummaries(studies);
    assert.ok(after.includes(summary[1].effect.mean.toFixed(2)));
    assert.ok(summary[1].prediction.mean < summary[0].prediction.mean);
    assert.equal(
      Math.abs(summary[1].effect.mean - 2) <
        Math.abs(summary[0].effect.mean - 2),
      scene.world === "proxy",
    );
  }
});

test("off-scale estimates keep their actual value and are marked as triangles", () => {
  const svg = relevancePlot(
    [
      {
        truth: 2,
        fits: [
          { effect: -1, rmse: 1 },
          { effect: 6, rmse: 1 },
        ],
      },
    ],
    true,
  );
  assert.match(svg, /<path class="study-dot"[^>]+data-estimate="-1"/);
  assert.match(svg, /<path class="study-dot"[^>]+data-estimate="6"/);
  assert.match(svg, /-1.00 mobility points/);
  assert.match(svg, /6.00 mobility points/);
});
