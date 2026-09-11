import {
  health,
  cohort,
  comparison,
  TREATMENT_DAY,
  FINAL_DAY,
  clamp,
  mix,
  SEVERITIES,
  SLICE_COUNT,
} from "./trajectory-model.js";

export function createTrajectoryRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error(
      "This browser does not support the patient trajectory canvas.",
    );
  let width = 0;
  let height = 0;
  const css = getComputedStyle(canvas);
  const colors = {
    ink: css.getPropertyValue("--film-ink").trim(),
    background: css.getPropertyValue("--film-background").trim(),
    silver: css.getPropertyValue("--trajectory-silver").trim(),
    treated: css.getPropertyValue("--trajectory-treated").trim(),
    untreated: css.getPropertyValue("--trajectory-untreated").trim(),
  };
  const resize = () => {
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resize();
  const line = (points, color, alpha, weight = 1, dashed = false) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = clamp(alpha);
    ctx.lineWidth = weight;
    ctx.setLineDash(dashed ? [4, 9] : []);
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    ctx.restore();
  };
  const label = (
    text,
    p,
    alpha = 1,
    align = "left",
    color = colors.ink,
    size = 12,
    backing = false,
  ) => {
    ctx.save();
    ctx.globalAlpha = clamp(alpha);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.font = `400 ${size}px "Avenir Next", system-ui, sans-serif`;
    const textWidth = ctx.measureText(text).width;
    const left =
      p.x -
      (align === "right" ? textWidth : align === "center" ? textWidth / 2 : 0);
    ctx.textAlign = "left";
    const textX = clamp(left, 8, Math.max(8, width - textWidth - 8));
    const textY = clamp(p.y, size + 3, height - 6);
    if (backing) {
      ctx.fillStyle = colors.background;
      ctx.fillRect(textX - 4, textY - size - 3, textWidth + 8, size + 8);
      ctx.fillStyle = color;
    }
    ctx.fillText(text, textX, textY);
    ctx.restore();
  };
  const pearl = (p, color, alpha, ghost = false, radius = 4) => {
    ctx.save();
    ctx.globalAlpha = clamp(alpha);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    if (!ghost) {
      ctx.shadowColor = color;
      ctx.shadowBlur = radius * 4;
      ctx.fillStyle = color;
    } else ctx.fillStyle = "transparent";
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (!ghost) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = colors.ink;
      ctx.globalAlpha *= 0.65;
      ctx.beginPath();
      ctx.arc(
        p.x - radius * 0.25,
        p.y - radius * 0.3,
        radius * 0.32,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  };

  function draw(view) {
    const {
      unfold,
      pool,
      twins,
      population,
      severity,
      selection,
      prognosis,
      day,
      step,
      orbitYaw = 0,
      orbitPitch = 0,
    } = view;
    ctx.clearRect(0, 0, width, height);
    const small = width < 600;
    const yaw = mix(-Math.PI / 2, -0.34 + orbitYaw, unfold);
    const pitch = mix(0, 0.28 + orbitPitch, unfold);
    const rawProject = (c, outcome, time, jitter = 0) => {
      const x = (c / (SLICE_COUNT - 1) - 0.5) * 9 + jitter;
      const z = (time / FINAL_DAY - 0.5) * 10;
      const y = (outcome - 58) / 10;
      const depth = Math.sin(yaw) * x + Math.cos(yaw) * z;
      return {
        x: Math.cos(yaw) * x - Math.sin(yaw) * z,
        y: Math.cos(pitch) * y - Math.sin(pitch) * depth,
      };
    };
    // Fit the entire coordinate box as the reader rotates, leaving room for labels.
    const corners = [0, SLICE_COUNT - 1].flatMap((c) =>
      [20, 95].flatMap((h) => [0, 12].map((t) => rawProject(c, h, t))),
    );
    const minX = Math.min(...corners.map((p) => p.x)),
      maxX = Math.max(...corners.map((p) => p.x));
    const minY = Math.min(...corners.map((p) => p.y)),
      maxY = Math.max(...corners.map((p) => p.y));
    const project = (c, outcome, time, jitter = 0) => {
      const p = rawProject(c, outcome, time, jitter);
      return {
        x: 54 + ((p.x - minX) / (maxX - minX)) * (width - 94),
        y: 74 + ((maxY - p.y) / (maxY - minY)) * (height - 146),
      };
    };
    const point = (p, d, a) =>
      project(
        p.severity,
        health(p.severity, d, a, prognosis),
        d,
        (p.rank - 4.5) * 0.065 * population,
      );
    const plotAlpha = 1 - pool;
    // Ground grid and treatment plane turn with the same coordinate system as patients.
    for (const c of SEVERITIES) {
      line(
        [project(c, 20, 0), project(c, 20, 12)],
        colors.silver,
        0.1 * unfold * plotAlpha,
      );
    }
    for (const t of [0, 4, 8, 12]) {
      line(
        [project(0, 20, t), project(SLICE_COUNT - 1, 20, t)],
        colors.silver,
        0.1 * unfold * plotAlpha,
      );
    }
    const axisC = mix(severity, 0, unfold);
    line(
      [project(axisC, 20, 0), project(axisC, 95, 0)],
      colors.silver,
      0.3 * plotAlpha,
    );
    line(
      [project(axisC, 20, 0), project(axisC, 20, 12)],
      colors.silver,
      0.35 * plotAlpha,
    );
    for (const h of [20, 40, 60, 80]) {
      const p = project(axisC, h, 0);
      line([{ x: p.x - 3, y: p.y }, p], colors.silver, 0.5 * plotAlpha);
      label(
        String(h),
        { x: p.x - 8, y: p.y + 4 },
        0.65 * plotAlpha,
        "right",
        colors.silver,
        small ? 10 : 11,
      );
    }
    label("Health score ↑", { x: 22, y: 26 }, plotAlpha * 0.8);
    label(
      "Higher is better",
      { x: 22, y: 44 },
      plotAlpha * 0.5,
      "left",
      colors.silver,
      11,
    );
    for (const t of [0, 4, 12]) {
      const p = project(axisC, 20, t);
      label(
        `Day ${t}`,
        { x: p.x - 14 * unfold, y: p.y + 20 },
        plotAlpha * 0.65,
        unfold > 0.5 ? "right" : "center",
        colors.silver,
        small ? 10 : 12,
      );
    }
    if (unfold > 0.01) {
      for (const c of SEVERITIES) {
        if (small && c % 2 && c !== severity && c !== SLICE_COUNT - 1) continue;
        const p = project(c, 20, 12);
        label(
          String(c),
          { x: p.x, y: p.y + 19 },
          unfold * plotAlpha * 0.8,
          "center",
        );
      }
      const p = project((SLICE_COUNT - 1) / 2, 20, 12);
      label(
        "Baseline severity →",
        { x: p.x, y: p.y + 38 },
        unfold * plotAlpha * 0.8,
        "center",
      );
      const corners = [
        project(severity, 20, 0),
        project(severity, 95, 0),
        project(severity, 95, 12),
        project(severity, 20, 12),
      ];
      ctx.save();
      ctx.globalAlpha = 0.035 * unfold * plotAlpha;
      ctx.fillStyle = colors.ink;
      ctx.beginPath();
      corners.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      line(
        corners.concat([corners[0]]),
        colors.silver,
        0.13 * unfold * plotAlpha,
      );
    }
    const treatmentPoint = project(
      severity,
      health(severity, TREATMENT_DAY, 0, prognosis),
      TREATMENT_DAY,
    );
    line(
      [project(severity, 20, 4), project(severity, 95, 4)],
      colors.silver,
      0.22 * plotAlpha,
      1,
      true,
    );
    if (unfold < 0.8)
      label(
        "Treatment starts",
        { x: treatmentPoint.x + 10, y: treatmentPoint.y - 29 },
        (1 - unfold) * plotAlpha * 0.8,
        "left",
        colors.silver,
        small ? 11 : 12,
      );

    const data = cohort(selection);
    const summary = comparison(selection, prognosis);
    const endpoints = [];
    const ordinals = new Map();
    for (const arm of [0, 1])
      data
        .filter((p) => p.treatment === arm)
        .forEach((p, i) => ordinals.set(p.id, i));
    // Paint counterfactuals first so faint alternatives never obscure factual paths.
    for (const factual of [false, true])
      for (const patient of data) {
        const focal = patient.severity === severity && patient.rank === 4;
        const representative = patient.rank === 4;
        const visibility = focal ? 1 : representative ? unfold : population;
        if (visibility < 0.001) continue;
        const isSlice = patient.severity === severity;
        const alpha = visibility * (focal ? 1 : isSlice ? 0.9 : 0.55);
        if (factual) {
          const history = [];
          for (let d = 0; d <= Math.min(day, 4) + 0.001; d += 0.1)
            history.push(point(patient, d, 0));
          line(
            history,
            colors.silver,
            alpha * (population > 0.5 ? 0.2 : 0.65) * plotAlpha,
            focal ? 1.6 : 0.7,
          );
        }
        const a = factual ? patient.treatment : 1 - patient.treatment;
        const opacity = alpha * (factual ? 1 : twins * (isSlice ? 0.22 : 0.12));
        if (opacity < 0.001 || (day < 4 && !factual)) continue;
        const color = a ? colors.treated : colors.untreated;
        if (day >= 4) {
          const trail = [];
          for (let d = 4; d < day; d += 0.08) trail.push(point(patient, d, a));
          trail.push(point(patient, day, a));
          if (factual)
            line(trail, color, opacity * 0.055 * plotAlpha, focal ? 10 : 3);
          line(
            trail,
            color,
            opacity * plotAlpha,
            factual ? (focal ? 2.7 : small ? 0.8 : 1.3) : 0.85,
            !factual,
          );
        }
        const end = point(patient, day, a);
        const ordinal = ordinals.get(patient.id);
        const groupX = width * (a ? 0.69 : 0.31);
        const pooledPoint = {
          x: groupX + ((ordinal % 10) - 4.5) * (small ? 5 : 9),
          y:
            height * 0.77 -
            ((health(patient.severity, FINAL_DAY, a, prognosis) - 20) / 80) *
              height *
              0.65,
        };
        endpoints.push({
          target: {
            x: mix(end.x, pooledPoint.x, pool),
            y: mix(end.y, pooledPoint.y, pool),
          },
          color: day < 4 ? colors.silver : color,
          alpha: opacity * (factual ? 1 : 1 - pool),
          ghost: !factual,
          radius: focal ? mix(5.5, 2.7, pool) : factual ? 2.1 : 1.7,
        });
      }
    endpoints.forEach(({ target, color, alpha, ghost, radius }) =>
      pearl(target, color, alpha, ghost, radius),
    );
    const focal = data.find((p) => p.severity === severity && p.rank === 4);
    if (day >= 11.99 && (population < 0.5 || step === 6) && pool < 0.01) {
      for (const a of [0, 1]) {
        if (step !== 6 && a !== focal.treatment && twins < 0.8) continue;
        const p = point(focal, 12, a);
        const text = `${step === 6 ? "Mean " : ""}${a ? "Treated" : "Untreated"} · ${health(severity, 12, a, prognosis).toFixed(1)}`;
        const size = small ? 11 : 13;
        ctx.font = `400 ${size}px "Avenir Next", system-ui, sans-serif`;
        const onLeft = small || p.x + ctx.measureText(text).width + 24 > width;
        label(
          text,
          { x: p.x + (onLeft ? -15 : 15), y: p.y + (a ? -13 : 20) },
          1,
          onLeft ? "right" : "left",
          a ? colors.treated : colors.untreated,
          size,
          true,
        );
      }
      if (twins > 0.8 || step === 6) {
        const a = point(focal, 12, 0),
          b = point(focal, 12, 1);
        line(
          [
            { x: a.x - 13, y: a.y },
            { x: b.x - 13, y: b.y },
          ],
          colors.silver,
          0.55,
        );
        label(
          "+12",
          { x: a.x - 19, y: (a.y + b.y) / 2 + 4 },
          1,
          "right",
          colors.ink,
          13,
        );
      }
    }
    if (pool > 0.01) {
      for (const a of [0, 1]) {
        const x = width * (a ? 0.69 : 0.31);
        const y =
          height * 0.77 - ((summary.means[a] - 20) / 80) * height * 0.65;
        const color = a ? colors.treated : colors.untreated;
        line(
          [
            { x: x - width * 0.12, y },
            { x: x + width * 0.12, y },
          ],
          color,
          pool,
          1.5,
        );
        label(
          `Mean ${summary.means[a].toFixed(1)}`,
          { x, y: y - 12 },
          pool,
          "center",
          color,
          13,
        );
        label(
          a ? "TREATED" : "UNTREATED",
          { x, y: height * 0.86 },
          pool,
          "center",
          color,
          small ? 11 : 13,
        );
        label(
          `${summary.armCounts[a]} patients`,
          { x, y: height * 0.86 + 21 },
          pool * 0.55,
          "center",
          colors.silver,
          11,
        );
      }
      label(
        "Day 12 · observed outcomes",
        { x: width * 0.5, y: 31 },
        pool * 0.8,
        "center",
      );
    }
    canvas.setAttribute("data-scene", String(step));
  }
  return { draw, resize };
}
