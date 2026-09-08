import {
  patients,
  position,
  progress,
  cameraAt,
  project,
  ease,
  mix,
  clamp,
  TREATMENT,
  sceneTime,
} from "./model.js";

const SILVER = [188, 203, 216];
const CORAL = [255, 129, 116];
const BLUE = [105, 178, 247];
const INK = [222, 232, 240];
const rgb = (c, alpha = 1) =>
  `rgba(${c.map(Math.round).join(",")},${clamp(alpha)})`;
const blend = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
const windowFade = (t, start, end) =>
  ease(start, start + 1.3, t) * (1 - ease(end - 1.2, end, t));
const highlighted = new Set([3, 8, 11]);

function text(ctx, value, x, y, size, alpha = 1, options = {}) {
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.fillStyle = options.color || "#dee8f0";
  ctx.textAlign = options.align || "center";
  ctx.font = `${options.weight || 400} ${size}px ${options.serif ? "Georgia, serif" : '"Avenir Next", Avenir, sans-serif'}`;
  ctx.letterSpacing = options.spacing || "0px";
  ctx.fillText(value, x, y);
  ctx.restore();
}

function segment(ctx, a, b, color, alpha, width = 1) {
  ctx.strokeStyle = rgb(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function sphere(ctx, p, color, opacity, ghost = false) {
  if (opacity < 0.001) return;
  const r = p.scale * 0.116;
  ctx.save();
  ctx.globalAlpha = opacity;
  const halo = ctx.createRadialGradient(p.x, p.y, r * 0.5, p.x, p.y, r * 3.2);
  halo.addColorStop(0, rgb(color, ghost ? 0.045 : 0.15));
  halo.addColorStop(1, rgb(color, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
  ctx.fill();
  const pearl = ctx.createRadialGradient(
    p.x - r * 0.32,
    p.y - r * 0.36,
    r * 0.02,
    p.x + r * 0.12,
    p.y + r * 0.12,
    r * 1.14,
  );
  pearl.addColorStop(
    0,
    rgb(blend(color, [255, 255, 255], 0.83), ghost ? 0.58 : 1),
  );
  pearl.addColorStop(
    0.24,
    rgb(blend(color, [255, 255, 255], 0.3), ghost ? 0.3 : 1),
  );
  pearl.addColorStop(0.68, rgb(color, ghost ? 0.18 : 1));
  pearl.addColorStop(
    1,
    rgb(blend(color, [10, 20, 31], 0.73), ghost ? 0.17 : 1),
  );
  ctx.fillStyle = pearl;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  if (ghost) {
    ctx.lineWidth = 0.85;
    ctx.strokeStyle = rgb(color, 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.83, Math.PI * 1.1, Math.PI * 1.65);
    ctx.strokeStyle = rgb(INK, 0.55);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpace(ctx, camera, seconds) {
  const visibility = ease(3, 7, seconds) * (1 - ease(21, 26, seconds));
  if (!visibility) return;
  const p = (x, y, z) => project({ x, y, z }, camera);
  for (let x = -8; x <= 8; x += 2)
    segment(ctx, p(x, -3.2, -8), p(x, -3.2, 8), SILVER, 0.055 * visibility);
  for (let z = -8; z <= 8; z += 2)
    segment(ctx, p(-8, -3.2, z), p(8, -3.2, z), SILVER, 0.055 * visibility);
  segment(ctx, p(-8, -3.2, -8), p(-8, 4.8, -8), SILVER, 0.18 * visibility);
  const yLabel = p(-8, 4.9, -8);
  text(ctx, "OUTCOME  Y", yLabel.x, yLabel.y - 14, 13, visibility * 0.6, {
    spacing: "2px",
  });
  const timeLabel = p(7.8, -3.4, 4);
  text(ctx, "TIME →", timeLabel.x, timeLabel.y + 16, 13, visibility * 0.65, {
    spacing: "3px",
  });

  const planeAlpha = visibility * (0.65 + 0.35 * windowFade(seconds, 8.2, 12));
  const z = mix(-8, 8, TREATMENT);
  const corners = [
    p(-7.5, -3.2, z),
    p(7.5, -3.2, z),
    p(7.5, 4.5, z),
    p(-7.5, 4.5, z),
  ];
  ctx.beginPath();
  corners.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)));
  ctx.closePath();
  ctx.fillStyle = rgb(SILVER, 0.018 * planeAlpha);
  ctx.fill();
  ctx.strokeStyle = rgb(SILVER, 0.14 * planeAlpha);
  ctx.lineWidth = 1;
  ctx.stroke();
  const label = p(0, -3.5, z);
  text(ctx, "TREATMENT", label.x, label.y + 24, 12, planeAlpha * 0.75, {
    spacing: "3px",
  });
}

function drawTrail(ctx, patient, world, t, camera, seconds, ghost) {
  const start = world === null ? 0 : TREATMENT;
  const end = world === null ? Math.min(t, TREATMENT) : t;
  if (end <= start) return;
  const fade = mix(1, 0.012, ease(22, 26, seconds));
  const reveal = world === null ? 1 : ease(TREATMENT, TREATMENT + 0.11, t);
  const color = world === null ? SILVER : world ? CORAL : BLUE;
  let previous = project(position(patient, start, world || 0), camera);
  const steps = Math.ceil((end - start) * 230);
  for (let i = 1; i <= steps; i++) {
    const at = mix(start, end, i / steps);
    const current = project(position(patient, at, world || 0), camera);
    const tail = mix(0.25, 1, ease(0, 1, i / steps));
    // Dashes are anchored to world time, so segments do not slide as trails grow.
    const phase = ((at - TREATMENT) * 55) % 1;
    const dash = ghost
      ? ease(0.04, 0.17, phase) * (1 - ease(0.56, 0.78, phase))
      : 1;
    const alpha = fade * reveal * tail * dash * (ghost ? 0.46 : 0.75);
    segment(
      ctx,
      previous,
      current,
      color,
      alpha * 0.065,
      (ghost ? 4 : 7) * tail,
    );
    segment(ctx, previous, current, color, alpha, (ghost ? 1.05 : 1.8) * tail);
    previous = current;
  }
}

function legend(ctx, seconds) {
  const alpha = ease(10, 12, seconds);
  if (!alpha) return;
  const y = 315;
  sphere(ctx, { x: 639, y: y - 6, scale: 58 }, CORAL, alpha);
  text(ctx, "Treated", 659, y, 17, alpha * 0.8, { align: "left" });
  sphere(ctx, { x: 788, y: y - 6, scale: 58 }, BLUE, alpha);
  text(ctx, "Untreated", 808, y, 17, alpha * 0.8, { align: "left" });
  segment(
    ctx,
    { x: 948, y: y - 6 },
    { x: 978, y: y - 6 },
    INK,
    alpha * 0.85,
    1.8,
  );
  text(ctx, "Observed", 990, y, 17, alpha * 0.8, { align: "left" });
  for (let x = 1125; x < 1155; x += 11)
    segment(ctx, { x, y: y - 6 }, { x: x + 6, y: y - 6 }, INK, alpha * 0.38, 1);
  text(ctx, "Counterfactual", 1167, y, 17, alpha * 0.65, { align: "left" });
}

export function renderFilm(canvas, seconds) {
  const playback = seconds;
  seconds = sceneTime(seconds);
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(canvas.width / 1920, canvas.height / 1080);
  ctx.fillStyle = "#0b141e";
  ctx.fillRect(0, 0, 1920, 1080);
  const atmosphere = ctx.createRadialGradient(950, 530, 60, 950, 530, 990);
  atmosphere.addColorStop(0, "#1c2c3a");
  atmosphere.addColorStop(0.58, "#101c28");
  atmosphere.addColorStop(1, "#080f18");
  ctx.fillStyle = atmosphere;
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.lineCap = "round";
  const camera = cameraAt(seconds);
  const final = ease(22.5, 26.5, seconds);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 340, 1920, 640);
  ctx.clip();
  drawSpace(ctx, camera, seconds);
  ctx.restore();

  const particles = [];
  for (const patient of patients) {
    const t = progress(seconds, patient);
    const reveal = ease(TREATMENT, TREATMENT + 0.11, t);
    drawTrail(ctx, patient, null, t, camera, seconds, false);
    if (t > TREATMENT) {
      drawTrail(ctx, patient, 0, t, camera, seconds, patient.treated);
      drawTrail(ctx, patient, 1, t, camera, seconds, !patient.treated);
    }
    const factual = Number(patient.treated);
    particles.push({
      p: project(position(patient, t, factual), camera),
      color: blend(SILVER, factual ? CORAL : BLUE, reveal),
      opacity: 1,
      ghost: false,
    });
    if (reveal > 0)
      particles.push({
        p: project(position(patient, t, 1 - factual), camera),
        color: factual ? BLUE : CORAL,
        opacity: reveal * 0.85,
        ghost: true,
      });
    if (final > 0) {
      const a = project(position(patient, 1, 0), camera);
      const b = project(position(patient, 1, 1), camera);
      const strong = highlighted.has(patient.id);
      const endpoint = { x: mix(a.x, b.x, final), y: mix(a.y, b.y, final) };
      segment(
        ctx,
        a,
        endpoint,
        INK,
        final * (strong ? 0.7 : 0.18),
        strong ? 1.25 : 0.8,
      );
      if (strong) {
        const offset = 21;
        segment(
          ctx,
          { x: a.x + offset, y: a.y },
          { x: b.x + offset, y: b.y },
          INK,
          final * 0.5,
          1,
        );
        for (const p of [a, b])
          segment(
            ctx,
            { x: p.x + offset - 4, y: p.y },
            { x: p.x + offset + 4, y: p.y },
            INK,
            final * 0.5,
            1,
          );
        text(
          ctx,
          "ΔY",
          a.x + offset + 12,
          (a.y + b.y) / 2 + 4,
          15,
          final * 0.75,
          { align: "left", serif: true },
        );
      }
    }
  }
  particles.sort((a, b) => b.p.depth - a.p.depth);
  for (const particle of particles)
    sphere(ctx, particle.p, particle.color, particle.opacity, particle.ghost);

  text(ctx, "CAUSAL SANDBOX", 76, 72, 16, 0.83, {
    align: "left",
    weight: 500,
    spacing: "4px",
  });
  text(
    ctx,
    seconds < 8
      ? "01 / OBSERVATION"
      : seconds < 23
        ? "02 / POSSIBLE FUTURES"
        : "03 / CAUSAL CONTRAST",
    1844,
    72,
    13,
    0.48,
    { align: "right", spacing: "2px" },
  );

  // Reading time is independent of the scene clock and shared by both exports.
  const opening = 1 - ease(1.55, 2.4, playback);
  text(ctx, "We only see", 960, 191, 59, opening);
  text(ctx, "one future.", 960, 259, 65, opening, { serif: true });
  const split = ease(2.15, 3, playback) * (1 - ease(6.4, 7.6, playback));
  text(ctx, "What if we could see both?", 960, 211, 53, split);
  const ending = ease(12.2, 16.2, playback);
  text(ctx, "The causal effect", 960, 192, 57, ending);
  text(ctx, "lives in the gap.", 960, 258, 64, ending, { serif: true });
  legend(ctx, seconds);

  const baselineLabel = (1 - ease(4, 7, seconds)) * ease(0, 2, seconds);
  text(ctx, "BASELINE  C", 960, 877, 12, baselineLabel * 0.52, {
    spacing: "3px",
  });
  segment(
    ctx,
    { x: 478, y: 846 },
    { x: 1442, y: 846 },
    SILVER,
    baselineLabel * 0.1,
  );
  const brand = ease(16.4, 18.2, playback);
  text(ctx, "CAUSAL SANDBOX", 960, 904, 29, brand, {
    weight: 500,
    spacing: "7px",
  });
  text(ctx, "Change the world. See the truth.", 960, 945, 22, brand * 0.78);
  text(
    ctx,
    "SIMULATED PATIENTS · BOTH POTENTIAL OUTCOMES ARE KNOWN HERE",
    960,
    1030,
    11,
    0.47,
    { spacing: "2px" },
  );
  ctx.restore();
}
