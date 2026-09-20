import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { setTimeout } from "node:timers/promises";

export const SOURCE = "https://ckirkle.goatcounter.com/counter/TOTAL.json";
const START = "2026-09-06";
const DAY = 86400000;
const isoDate = (time) => new Date(time).toISOString().slice(0, 10);
const dateLabel = (date) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const number = (value) => value.toLocaleString("en-US");

export function parseCount(data) {
  // GoatCounter returns formatted strings, including narrow no-break spaces.
  const value = data?.count;
  if (
    typeof value !== "string" ||
    !/^(?:\d+|\d{1,3}(?:[,\s]\d{3})+)$/.test(value)
  ) {
    throw new Error("GoatCounter returned an invalid count");
  }
  const count = Number(value.replace(/[,\s]/g, ""));
  if (!Number.isSafeInteger(count))
    throw new Error("Count exceeds safe integer range");
  return count;
}

function validateHistory(history) {
  if (history.source !== SOURCE || !Array.isArray(history.points)) {
    throw new Error("Unexpected site-views history format or source");
  }
  history.points.forEach((point, i) => {
    if (
      point.date !== isoDate(Date.parse(START) + i * DAY) ||
      !Number.isSafeInteger(point.views) ||
      point.views < 0 ||
      (i > 0 && point.views < history.points[i - 1].views)
    ) {
      throw new Error(
        "Site-views history must contain consecutive dates and cumulative counts",
      );
    }
  });
}

export function renderChart(history) {
  validateHistory(history);
  const { points } = history;
  if (points.length < 2)
    throw new Error("At least two dates are needed for a history chart");
  const last = points.at(-1);
  const max = Math.max(10, Math.ceil(last.views / 4 / 10) * 40);
  const left = 64,
    right = 744,
    top = 126,
    bottom = 314;
  const xy = points.map((point, i) => ({
    x: left + ((right - left) * i) / (points.length - 1),
    y: bottom - ((bottom - top) * point.views) / max,
  }));
  // Monotone cubic interpolation: pass through daily observations without overshoot.
  const slopes = xy.slice(1).map((p, i) => (p.y - xy[i].y) / (p.x - xy[i].x));
  const tangents = xy.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === xy.length - 1) return slopes.at(-1);
    const a = slopes[i - 1],
      b = slopes[i];
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  });
  const f = (v) => v.toFixed(2);
  let path = `M ${f(xy[0].x)} ${f(xy[0].y)}`;
  xy.slice(1).forEach((p, i) => {
    const prev = xy[i],
      dx = (p.x - prev.x) / 3;
    path += ` C ${f(prev.x + dx)} ${f(prev.y + tangents[i] * dx)}, ${f(p.x - dx)} ${f(p.y - tangents[i + 1] * dx)}, ${f(p.x)} ${f(p.y)}`;
  });
  const endpoint = xy.at(-1);
  const grid = Array.from({ length: 5 }, (_, i) => {
    const y = bottom - ((bottom - top) * i) / 4;
    return `<path d="M ${left} ${y} H ${right}" stroke="#394e60" stroke-opacity=".45"/>
    <text class="tick" x="${left - 14}" y="${y + 5}" text-anchor="end" font-size="14" fill="#afbecc">${((max * i) / 4).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}</text>`;
  }).join("\n    ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400" role="img" aria-labelledby="title description">
  <title id="title">Causal Sandbox · Site views</title>
  <desc id="description">${number(last.views)} cumulative site views at the ${dateLabel(last.date)} UTC cutoff (including the midnight hour). Daily snapshots from ${dateLabel(START)}, connected with a monotone curve. GoatCounter counts site visits, not lifetime unique people.</desc>
  <style>
    @media (max-width: 480px) {
      .secondary { display: none; }
      .heading { font-size: 30px; }
      .total { font-size: 48px; }
      .tick, .cumulative { font-size: 26px; }
      .date, .footer { font-size: 24px; }
    }
  </style>
  <defs>
    <!-- Palette and endpoint lighting follow film/render.js. -->
    <radialGradient id="background" cx="50%" cy="45%" r="75%">
      <stop stop-color="#1c2c3a"/><stop offset=".58" stop-color="#101c28"/><stop offset="1" stop-color="#080f18"/>
    </radialGradient>
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#ff8174" stop-opacity=".13"/><stop offset="1" stop-color="#ff8174" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="pearl" cx="32%" cy="28%" r="80%">
      <stop stop-color="#ffeae7"/><stop offset=".3" stop-color="#ffa79e"/><stop offset=".7" stop-color="#ff8174"/><stop offset="1" stop-color="#702f32"/>
    </radialGradient>
  </defs>
  <rect width="800" height="400" rx="16" fill="url(#background)"/>
  <g font-family="Avenir Next, Avenir, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" fill="#dee8f0">
    <text class="heading" x="40" y="43" font-size="18" font-weight="500">Site views</text>
    <text class="total" x="40" y="88" font-size="36" font-weight="500">${number(last.views)}<tspan class="cumulative" dx="12" font-size="15" fill="#afbecc">cumulative</tspan></text>
    <text class="secondary" x="760" y="43" text-anchor="end" font-size="14" fill="#afbecc">Causal Sandbox</text>
    ${grid}
    <path d="${path} L ${right} ${bottom} L ${left} ${bottom} Z" fill="url(#area)"/>
    <path d="${path}" fill="none" stroke="#ff8174" stroke-width="8" stroke-opacity=".06" stroke-linecap="round"/>
    <path d="${path}" fill="none" stroke="#ff8174" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="${f(endpoint.x)}" cy="${f(endpoint.y)}" r="13" fill="#ff8174" fill-opacity=".08"/>
    <circle cx="${f(endpoint.x)}" cy="${f(endpoint.y)}" r="5" fill="url(#pearl)"/>
    <text class="date" x="${left}" y="342" font-size="14" fill="#afbecc">${dateLabel(START)}</text>
    <text class="date" x="${right}" y="342" text-anchor="end" font-size="14" fill="#afbecc">${dateLabel(last.date)}</text>
    <text class="footer" x="40" y="378" font-size="13" fill="#afbecc">GoatCounter<tspan class="secondary"> · daily snapshots</tspan></text>
    <text class="footer" x="760" y="378" text-anchor="end" font-size="13" fill="#afbecc">Updated ${dateLabel(last.date)}</text>
  </g>
</svg>
`;
}

export async function updateSiteViews({
  directory = new URL("../docs/", import.meta.url),
  now = new Date(),
  fetchImpl = fetch,
  pause = () => setTimeout(300),
} = {}) {
  const historyFile = new URL("site-views.json", directory);
  let history;
  try {
    history = JSON.parse(await readFile(historyFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    history = { source: SOURCE, points: [] };
  }
  validateHistory(history);
  // GoatCounter includes the midnight UTC hour. Wait until 06:00 UTC so that
  // bucket is complete and beyond the counter's four-hour cache window.
  const cutoff = isoDate(now.getTime() - 6 * 3600000);
  if (history.points.at(-1)?.date > cutoff)
    throw new Error("History is ahead of the update date");
  const points = history.points.slice(
    0,
    Math.max(0, history.points.length - 7),
  );
  for (
    let time = Date.parse(START) + points.length * DAY;
    isoDate(time) <= cutoff;
    time += DAY
  ) {
    const date = isoDate(time);
    const url = new URL(SOURCE);
    url.searchParams.set("end", date);
    const response = await fetchImpl(url, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(
        `GoatCounter returned HTTP ${response.status} for ${date}`,
      );
    const views = parseCount(await response.json());
    const previous = history.points.find((point) => point.date === date);
    if (previous && views < previous.views)
      throw new Error(
        `GoatCounter count decreased for ${date}; inspect before replacing history`,
      );
    points.push({ date, views });
    await pause();
  }
  const updated = { source: SOURCE, points };
  const svg = renderChart(updated);
  // No files are touched until every fetch and validation succeeds.
  await writeFile(historyFile, JSON.stringify(updated, null, 2) + "\n");
  await writeFile(new URL("site-views.svg", directory), svg);
  return updated;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const directory = process.argv[2]
    ? pathToFileURL(resolve(process.argv[2]) + "/")
    : undefined;
  const history = await updateSiteViews({ directory });
  console.log(
    `Updated site views: ${number(history.points.at(-1).views)} as of ${history.points.at(-1).date}`,
  );
}
