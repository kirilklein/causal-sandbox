# Reusing patient trajectories

The rotatable ten-patient landscape remains live in the optional chapter after
**A common cause**. These bookmarks open it immediately:

- `?lesson=trajectory-landscape#unfold`: ten trajectories across severity, with counterfactuals.
- `?lesson=trajectory-landscape#compare`: each trajectory and its counterfactual.
- `?lesson=trajectory-landscape`: the complete seven-scene explanation.

Append these to the site's base URL (`/causal-sandbox/`, or
`/causal-sandbox/dev/` on the development site). Drag or use arrow keys to rotate;
Home resets the camera. Rotation changes perspective, never outcomes or assignments.
These scenes are maintained in the chapter, not copied into an archive.

## Components and boundaries

| Module                                          | Responsibility                                                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/trajectory-model.js`                       | Pure simulation: `health`, `cohort`, `profiles`, `comparison`, and shared constants. No DOM or random sampling.                                                     |
| `src/trajectory-render.js`                      | `createTrajectoryRenderer(canvas)` creates independent drawing state; exposes `draw(view)` and `resize()`. No navigation, event listeners, or animation loop.       |
| `src/trajectory-orbit.js`                       | `bindTrajectoryOrbit(canvas, callbacks)` binds pointer and keyboard input; exposes `endDrag()` and `destroy()`. The caller owns camera angles, limits, and redraws. |
| `src/what-if-population.js`                     | Paired endpoint dotplots for the opening, using the same profiles and health function.                                                                              |
| `src/trajectory-landscape.js`, `src/what-if.js` | Lesson-specific text, controls, transitions, routing, and accessibility descriptions. Importing these starts the whole lesson.                                      |

Reuse the model and renderer directly; do not import a lesson controller into a
new visualization. The opening and optional chapter already share them.

This is one fixed teaching model, not an arbitrary patient-data renderer. Its
100 patients occupy ten severity levels; `profiles()` retains one fixed patient
per level. Patients at the same severity have identical potential outcomes.
Treatment starts on day 4 and adds 12 health points by day 12 for everyone.
`selection` changes assignment; `prognosis` changes severity's effect on health.
Neither changes the treatment benefit. Counts are constructed, not sampled.

`comparison().standardized` averages simulator-known potential outcomes across
severity. It is not an estimator fitted to observed data. Revealing a dashed
trajectory is possible because this is a simulation; it does not recover a real
patient's unobserved outcome. See [the model details](education.md) and its tests.

## Minimal embedding

The following two blocks can be placed in a temporary HTML file at the repository
root, with the JavaScript inside `<script type="module">`, and opened through
Vite. Existing lesson pages already load the base theme styles.

```html
<section class="trajectory-experience">
  <p id="trajectory-caption">
    Ten simulated patients across severity. Higher health is better. Solid paths
    are observed; dashed paths are simulator-known counterfactuals. Everyone has
    a 12-point benefit at day 12. Drag or use arrow keys to rotate; Home resets.
  </p>
  <canvas
    id="example-trajectories"
    tabindex="0"
    role="img"
    aria-label="Patient trajectories by time, health, and severity"
    aria-describedby="trajectory-caption"
    style="display: block; width: 100%; height: 440px; touch-action: none"
  ></canvas>
</section>
```

```js
import "./src/style.css";
import "./src/trajectory-landscape.css";
import { clamp } from "./src/trajectory-model.js";
import { createTrajectoryRenderer } from "./src/trajectory-render.js";
import { bindTrajectoryOrbit } from "./src/trajectory-orbit.js";

function mountTrajectories(canvas) {
  const renderer = createTrajectoryRenderer(canvas);
  const view = { unfold: 1, twins: 1, orbitYaw: 0, orbitPitch: 0 };
  const draw = () => renderer.draw(view);
  const orbit = bindTrajectoryOrbit(canvas, {
    enabled: () => true,
    onStart: draw,
    onRotate(dx, dy) {
      view.orbitYaw = clamp(view.orbitYaw + dx, -1.2, 1.2);
      view.orbitPitch = clamp(view.orbitPitch + dy, -0.22, 0.55);
      draw();
    },
    onReset() {
      view.orbitYaw = view.orbitPitch = 0;
      draw();
    },
  });
  const resize = new ResizeObserver(() => {
    renderer.resize();
    draw();
  });
  resize.observe(canvas);
  window.addEventListener("themechange", draw);
  draw();
  return () => {
    orbit.destroy();
    resize.disconnect();
    window.removeEventListener("themechange", draw);
  };
}

const unmount = mountTrajectories(
  document.querySelector("#example-trajectories"),
);
// Call unmount() before removing or replacing this view.
```

Each mounted canvas has its own renderer and input listeners. Keep the canvas
focusable, provide a visible explanation and an accessible description, and use
the shared theme palette. If adding animation, the caller must also own its
animation frame and respect reduced motion. Call `endDrag()` when disabling
rotation during a scene change, and `destroy()` when removing the component.

`draw()` defaults to the completed observed trajectory of the retained patient at
severity 7. Override only what the view needs:

| Option                   | Default | Meaning                                                                 |
| ------------------------ | ------- | ----------------------------------------------------------------------- |
| `severity`               | `7`     | Focal severity, an integer from 0 to 9.                                 |
| `day`                    | `12`    | Reveal through this day, from 0 to 12.                                  |
| `selection`, `prognosis` | `1`     | Assignment and severity-outcome strengths, each from 0 to 1.            |
| `twins`                  | `0`     | Counterfactual visibility, from 0 to 1.                                 |
| `frequency`              | `0`     | Expand one patient into ten at the same severity, from 0 to 1.          |
| `unfold`                 | `0`     | Unfold the ten retained profiles across severity, from 0 to 1.          |
| `pool`                   | `0`     | Collapse retained factual endpoints into treatment groups, from 0 to 1. |
| `orbitYaw`, `orbitPitch` | `0`     | Camera offsets; use the limits in the example to keep labels visible.   |

Composition options support interpolation between the chapter's scenes; they
are not independent switches for every possible layout. Follow `target()` in
the chapter controller when reusing those transitions. `draw()` returns
`{ endpoints: [untreated, treated] }`, the focal patient's day-12 projected
coordinates in canvas CSS pixels. The opening uses these at `unfold = pool = 0`
to connect its two curves to the population dotplot.

## Possible future uses

- Confounding by indication: use unfolding to expose severity and pooling to
  show how differently composed treatment groups can reverse the comparison.
- Potential outcomes and average effects: preserve patient identities while
  moving from paired curves to endpoints, as the opening already does.
- Treatment-effect heterogeneity or changing treatment over time would require
  extending the model and its tests first; the current model supports neither.

Choose a learner question before adding another destination. New published
lessons still need catalogue, topic, search, prerequisite, and return links.
