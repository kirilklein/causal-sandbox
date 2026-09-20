import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import {
  SOURCE,
  parseCount,
  renderChart,
  updateSiteViews,
} from "./update-site-views.mjs";

test("formatted public counts are parsed without turning errors into zero", () => {
  for (const count of ["1234", "1,234", "1 234", "1\u202f234"]) {
    assert.equal(parseCount({ count }), 1234);
  }
  assert.equal(parseCount({ count: "0" }), 0);
  for (const count of [
    undefined,
    123,
    "",
    "-1",
    "1.2",
    "12,34",
    "NaN",
    "9007199254740992",
  ]) {
    assert.throws(() => parseCount({ count }));
  }
});

test("backfill uses cumulative date cutoffs and is repeatable", async (t) => {
  const folder = await mkdtemp(join(tmpdir(), "site-views-"));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const directory = pathToFileURL(folder + "/");
  const requested = [];
  const options = {
    directory,
    now: new Date("2026-09-09T06:23:00Z"),
    pause: async () => {},
    fetchImpl: async (url) => {
      assert.equal(url.searchParams.get("start"), null);
      const end = url.searchParams.get("end");
      requested.push(end);
      return {
        ok: true,
        json: async () => ({ count: String((Number(end.slice(-2)) - 6) * 10) }),
      };
    },
  };
  const result = await updateSiteViews(options);
  assert.deepEqual(requested, [
    "2026-09-06",
    "2026-09-07",
    "2026-09-08",
    "2026-09-09",
  ]);
  assert.deepEqual(
    result.points.map((point) => point.views),
    [0, 10, 20, 30],
  );
  const before = await readFile(new URL("site-views.svg", directory), "utf8");
  await updateSiteViews(options);
  assert.equal(
    await readFile(new URL("site-views.svg", directory), "utf8"),
    before,
  );
  assert.match(
    before,
    /30 cumulative site views at the 9 Sept? 2026 UTC cutoff/,
  );

  const historyBefore = await readFile(
    new URL("site-views.json", directory),
    "utf8",
  );
  for (const fetchImpl of [
    async () => ({ ok: false, status: 503 }),
    async () => {
      throw new Error("network unavailable");
    },
    async () => ({ ok: true, json: async () => ({ count: "invalid" }) }),
    async () => ({ ok: true, json: async () => ({ count: "0" }) }),
  ]) {
    await assert.rejects(updateSiteViews({ ...options, fetchImpl }));
    assert.equal(
      await readFile(new URL("site-views.json", directory), "utf8"),
      historyBefore,
    );
    assert.equal(
      await readFile(new URL("site-views.svg", directory), "utf8"),
      before,
    );
  }

  await writeFile(new URL("site-views.json", directory), "not JSON");
  await assert.rejects(updateSiteViews(options), SyntaxError);
  assert.equal(
    await readFile(new URL("site-views.svg", directory), "utf8"),
    before,
  );
});

test("history rejects gaps, decreases, and unexpected sources; zero data stays finite", () => {
  const points = [
    { date: "2026-09-06", views: 0 },
    { date: "2026-09-07", views: 0 },
  ];
  const svg = renderChart({ source: SOURCE, points });
  assert.doesNotMatch(svg, /NaN|Infinity/);
  assert.match(svg, /#ff8174/);
  assert.throws(() => renderChart({ source: "https://other.example", points }));
  assert.throws(() =>
    renderChart({
      source: SOURCE,
      points: [points[0], { date: "2026-09-08", views: 5 }],
    }),
  );
  assert.throws(() =>
    renderChart({
      source: SOURCE,
      points: [{ ...points[0], views: 10 }, points[1]],
    }),
  );
});

test("updates refresh seven cutoffs and postpone an unfinished or cached midnight bucket", async (t) => {
  const folder = await mkdtemp(join(tmpdir(), "site-views-"));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const directory = pathToFileURL(folder + "/");
  const history = {
    source: SOURCE,
    points: Array.from({ length: 10 }, (_, i) => ({
      date: `2026-09-${String(i + 6).padStart(2, "0")}`,
      views: i * 10,
    })),
  };
  await writeFile(
    new URL("site-views.json", directory),
    JSON.stringify(history),
  );
  const requested = [];
  const updated = await updateSiteViews({
    directory,
    now: new Date("2026-09-16T02:00:00Z"),
    pause: async () => {},
    fetchImpl: async (url) => {
      const date = url.searchParams.get("end");
      requested.push(date);
      return {
        ok: true,
        json: async () => ({
          count: String((Number(date.slice(-2)) - 6) * 10 + 1),
        }),
      };
    },
  });
  assert.equal(requested.length, 7);
  assert.equal(requested[0], "2026-09-09");
  assert.equal(requested.at(-1), "2026-09-15");
  assert.deepEqual(updated.points.slice(0, 3), history.points.slice(0, 3));
  assert.equal(updated.points.at(-1).views, 91);
});

test("the interpolated trajectory stays inside each pair of observed counts", () => {
  const counts = [0, 0, 1, 50, 51, 51, 300];
  const svg = renderChart({
    source: SOURCE,
    points: counts.map((views, i) => ({
      date: `2026-09-${String(i + 6).padStart(2, "0")}`,
      views,
    })),
  });
  const path = svg.match(/<path d="(M [^"]+)" fill="none"/)[1];
  let y0 = Number(path.match(/^M [\d.]+ ([\d.]+)/)[1]);
  for (const match of path.matchAll(
    /C [\d.]+ ([\d.]+), [\d.]+ ([\d.]+), [\d.]+ ([\d.]+)/g,
  )) {
    const [y1, y2, y3] = match.slice(1).map(Number);
    for (let t = 0; t <= 1; t += 0.01) {
      const y =
        (1 - t) ** 3 * y0 +
        3 * (1 - t) ** 2 * t * y1 +
        3 * (1 - t) * t ** 2 * y2 +
        t ** 3 * y3;
      assert.ok(y >= Math.min(y0, y3) - 0.01 && y <= Math.max(y0, y3) + 0.01);
    }
    y0 = y3;
  }
});
