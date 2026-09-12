import {
  health,
  cohort,
  profiles,
  isProfile,
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
      frequency,
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
    const rawProject = (c, outcome, time) => {
      const x = (c / (SLICE_COUNT - 1) - 0.5) * 9;
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
    const project = (c, outcome, time) => {
      const p = rawProject(c, outcome, time);
      return {
        x: 54 + ((p.x - minX) / (maxX - minX)) * (width - 94),
        y: 74 + ((maxY - p.y) / (maxY - minY)) * (height - 146),
      };
    };
    const card = (rank) => {
      const cols = small ? 2 : 5;
      const rows = 10 / cols;
      const w = (width - 24) / cols;
      const h = (height - 48) / rows;
      return {
        x: 12 + (rank % cols) * w,
        y: 30 + Math.floor(rank / cols) * h,
        w,
        h,
      };
    };
    const point = (p, d, a) => {
      const outcome = health(p.severity, d, a, prognosis);
      const base = project(p.severity, outcome, d);
      const box = card(p.rank);
      return {
        x: mix(base.x, box.x + 14 + (d / 12) * (box.w - 38), frequency),
        y: mix(
          base.y,
          box.y + 32 + ((95 - outcome) / 75) * (box.h - 62),
          frequency,
        ),
      };
    };
    const plotAlpha = 1 - pool;
    const axisAlpha = plotAlpha * (1 - frequency);
    if (frequency > 0.001) {
      label(
        "Same severity · same health and time scales",
        { x: width / 2, y: 18 },
        frequency,
        "center",
        colors.silver,
        small ? 11 : 12,
      );
      for (const patient of cohort(selection).filter(
        (p) => p.severity === severity,
      )) {
        const box = card(patient.rank);
        const selected = isProfile(patient);
        const color = patient.treatment ? colors.treated : colors.untreated;
        line(
          [
            { x: box.x + 3, y: box.y },
            { x: box.x + box.w - 6, y: box.y },
            { x: box.x + box.w - 6, y: box.y + box.h - 7 },
            { x: box.x + 3, y: box.y + box.h - 7 },
            { x: box.x + 3, y: box.y },
          ],
          colors.silver,
          frequency * (selected ? 0.8 : 0.12),
          selected ? 1.5 : 0.7,
        );
        label(
          `Patient ${patient.rank + 1}${selected ? " · keep" : ""}`,
          { x: box.x + 12, y: box.y + 18 },
          frequency,
          "left",
          colors.ink,
          small ? 10 : 11,
        );
        label(
          patient.treatment ? "Treated" : "Untreated",
          { x: box.x + 12, y: box.y + box.h - 18 },
          frequency,
          "left",
          color,
          10,
        );
        label(
          "0 → 12 days",
          { x: box.x + box.w - 14, y: box.y + box.h - 18 },
          frequency * 0.7,
          "right",
          colors.silver,
          9,
        );
      }
    }
    // Ground grid and treatment plane turn with the same coordinate system as patients.
    for (const c of SEVERITIES) {
      line(
        [project(c, 20, 0), project(c, 20, 12)],
        colors.silver,
        0.1 * unfold * axisAlpha,
      );
    }
    for (const t of [0, 4, 8, 12]) {
      line(
        [project(0, 20, t), project(SLICE_COUNT - 1, 20, t)],
        colors.silver,
        0.1 * unfold * axisAlpha,
      );
    }
    const axisC = mix(severity, 0, unfold);
    line(
      [project(severity, 20, 12 * unfold), project(severity, 95, 12 * unfold)],
      colors.silver,
      0.3 * axisAlpha,
    );
    line(
      [project(axisC, 20, 0), project(axisC, 20, 12)],
      colors.silver,
      0.35 * axisAlpha,
    );
    for (const h of [20, 40, 60, 80]) {
      const p = project(severity, h, 12 * unfold);
      line([{ x: p.x - 3, y: p.y }, p], colors.silver, 0.5 * axisAlpha);
      label(
        String(h),
        { x: p.x - 8, y: p.y + 4 },
        0.65 * axisAlpha,
        "right",
        colors.silver,
        small ? 10 : 11,
      );
    }
    label(
      unfold > 0.8 ? "Day-12 health ↑ · selected patient" : "Health score ↑",
      { x: 22, y: 26 },
      axisAlpha * 0.8,
    );
    label(
      "Higher is better",
      { x: 22, y: 44 },
      axisAlpha * 0.5,
      "left",
      colors.silver,
      11,
    );
    for (const t of [0, 4, 12]) {
      const p = project(axisC, 20, t);
      label(
        `Day ${t}`,
        { x: p.x - 14 * unfold, y: p.y + 20 },
        axisAlpha * 0.65,
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
          unfold * axisAlpha * 0.8,
          "center",
        );
      }
      const p = project((SLICE_COUNT - 1) / 2, 20, 12);
      label(
        "Baseline severity →",
        { x: p.x, y: p.y + 38 },
        unfold * axisAlpha * 0.8,
        "center",
      );
      const corners = [
        project(severity, 20, 0),
        project(severity, 95, 0),
        project(severity, 95, 12),
        project(severity, 20, 12),
      ];
      ctx.save();
      ctx.globalAlpha = 0.035 * unfold * axisAlpha;
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
        0.13 * unfold * axisAlpha,
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
      0.22 * axisAlpha,
      1,
      true,
    );
    if (unfold < 0.8)
      label(
        "Treatment starts",
        { x: treatmentPoint.x + 10, y: treatmentPoint.y - 29 },
        (1 - unfold) * axisAlpha * 0.8,
        "left",
        colors.silver,
        small ? 11 : 12,
      );

    const data = cohort(selection);
    const retained = profiles(selection);
    const summary = comparison(selection, prognosis, retained);
    const endpoints = [];
    const ordinals = new Map();
    for (const arm of [0, 1])
      retained
        .filter((p) => p.treatment === arm)
        .forEach((p, i) => ordinals.set(p.id, i));
    // Paint counterfactuals first so faint alternatives never obscure factual paths.
    for (const factual of [false, true])
      for (const patient of data) {
        const representative = isProfile(patient);
        const focal = patient.severity === severity && representative;
        const visibility = focal
          ? 1
          : representative
            ? Math.max(unfold, patient.severity === severity ? frequency : 0)
            : patient.severity === severity
              ? frequency
              : 0;
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
            alpha * 0.65 * plotAlpha,
            focal ? 1.6 : 0.7,
          );
        }
        const a = factual ? patient.treatment : 1 - patient.treatment;
        const opacity = alpha * (factual ? 1 : twins * (isSlice ? 0.35 : 0.24));
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
        const ordinal = ordinals.get(patient.id) ?? 0;
        const groupX = width * (a ? 0.69 : 0.31);
        const pooledPoint = {
          x:
            groupX +
            (ordinal - (summary.armCounts[a] - 1) / 2) * (small ? 14 : 23),
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
          radius: focal
            ? mix(5.5, 4, Math.max(pool, frequency))
            : factual
              ? mix(3, 4, pool)
              : 2,
        });
      }
    endpoints.forEach(({ target, color, alpha, ghost, radius }) =>
      pearl(target, color, alpha, ghost, radius),
    );
    const focal = retained.find((p) => p.severity === severity);
    if (day >= 11.99 && frequency < 0.01 && pool < 0.01) {
      for (const a of [0, 1]) {
        if (a !== focal.treatment && twins < 0.8) continue;
        const p = point(focal, 12, a);
        const text = `${a ? "Treated" : "Untreated"} · ${health(severity, 12, a, prognosis).toFixed(1)}`;
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
      if (twins > 0.8) {
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
