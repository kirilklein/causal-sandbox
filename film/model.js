export const DURATION = 22;
export const SOCIAL_DURATION = 20;
export const TREATMENT = 0.38;
export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const mix = (a, b, t) => a + (b - a) * t;
export function ease(a, b, value) {
  const t = clamp((value - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// One clock for both exports: start briskly, then ease from 2.2× to 1× over 3–11s.
// Integrating the speed curve prevents a second acceleration before the reveal.
export function sceneTime(seconds) {
  const t = clamp(seconds, 0, DURATION);
  const u = clamp((t - 3) / 8);
  const deceleration = 8 * (u ** 6 - 3 * u ** 5 + 2.5 * u ** 4);
  return 2 + 2.2 * t - 1.2 * (deceleration + Math.max(0, t - 11));
}

// Fixed exogenous variation is shared by each patient's two treatment worlds.
// C affects both baseline outcome and the probability of receiving treatment.
const draws = [
  0.12, 0.72, 0.18, 0.82, 0.31, 0.63, 0.23, 0.91, 0.28, 0.49, 0.88, 0.32, 0.94,
  0.42,
];
const baselines = [
  -1.4, 1.05, -0.35, 1.65, -1.1, 0.55, -1.65, 1.1, -0.6, 1.35, -0.8, 0.15, 1.15,
  -0.7,
];
const effects = [
  1.5, 0.8, 2.15, 1.1, 0.42, 1.8, 1.2, 0.2, 2.3, 0.9, 1.65, 0.65, 1.95, 1.2,
];
export const patients = baselines.map((baseline, i) => {
  const c = (i - 6.5) / 6.5;
  return {
    id: i + 1,
    c,
    x: c * 6.6,
    baseline: baseline + c * 0.35,
    slope: Math.sin(i * 2.7) * 0.9,
    curve: Math.cos(i * 1.8) * 0.26,
    effect: effects[i],
    treated: draws[i] < 1 / (1 + Math.exp(-1.1 * c)),
    offset: Math.sin(i * 2.1) * 0.013,
  };
});

export function position(patient, time, world = 0) {
  const t = clamp(time);
  const after = Math.max(0, (t - TREATMENT) / (1 - TREATMENT));
  // Zero displacement and zero derivative at treatment: the twin peels away.
  const response = after * after * (3 - 2 * after);
  return {
    x: patient.x,
    y:
      patient.baseline +
      patient.slope * t +
      patient.curve * Math.sin(t * Math.PI * 1.5) +
      world * patient.effect * response,
    z: mix(-8, 8, t),
  };
}

export function progress(seconds, patient) {
  const t = clamp((seconds - 1) / 21);
  // A shared clock with a small temporary offset; all reach the same final time.
  return clamp(t + patient.offset * Math.sin(Math.PI * t));
}

export function cameraAt(seconds) {
  const orbit = ease(2.5, 26, seconds);
  return {
    yaw: mix(
      0.16 + 0.07 * (seconds - 2),
      Math.PI * orbit,
      ease(2, 16, seconds),
    ),
    pitch: 0.13 * Math.sin(Math.PI * orbit),
    z: mix(mix(-6.8, 2, ease(1, 20, seconds)), 8, ease(21, 26, seconds)),
    y: mix(0.15, 0.55, ease(19, 26, seconds)),
    distance: 28 + 3 * Math.sin(Math.PI * orbit),
    flatten: ease(22, 26, seconds),
  };
}

export function project(point, camera) {
  const dz = point.z - camera.z;
  const dy = point.y - camera.y;
  const horizontal = Math.cos(camera.yaw) * point.x - Math.sin(camera.yaw) * dz;
  const depth = Math.sin(camera.yaw) * point.x + Math.cos(camera.yaw) * dz;
  const vertical = Math.cos(camera.pitch) * dy - Math.sin(camera.pitch) * depth;
  const distance =
    camera.distance +
    Math.cos(camera.pitch) * depth +
    Math.sin(camera.pitch) * dy;
  const scale = mix(2350 / distance, 72, camera.flatten);
  return {
    x: 960 + horizontal * scale,
    y: 632 - vertical * scale,
    scale,
    depth: distance,
  };
}
