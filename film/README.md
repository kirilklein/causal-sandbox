# Two possible futures

A standalone 32-second Causal Sandbox film. The browser renderer uses a 3D coordinate system and a continuous camera
orbit, drawing to a Canvas 2D surface. It has no runtime dependencies, remote assets,
or tracking. This first visual cut is silent.

From the repository root, with the existing npm dependencies installed:

```sh
node node_modules/vite/bin/vite.js film --host 127.0.0.1 --port 5198 --strictPort
```

Open <http://127.0.0.1:5198/>. Space toggles playback; the slider and arrow keys seek.
“The reveal” shows the final composition. Reduced-motion preferences start on the
final still. `?t=12` opens paused at a specific second.

## Creative timing

| Seconds | Image                                                                                     |
| ------- | ----------------------------------------------------------------------------------------- |
| 0–7     | Silver patients; the camera begins revealing time and their shared history.               |
| 8–12    | Patients cross the treatment plane. Colour emerges; the alternative future peels away.    |
| 12–22   | The orbit reveals heterogeneous responses in the two worlds.                              |
| 22–26.5 | The camera settles into an orthographic endpoint view. Trails recede; paired gaps appear. |
| 26.5–32 | Identity and tagline arrive; the endpoint composition holds.                              |

## Visual and causal contract

- Coral always means treated; blue always means untreated. This film-specific
  palette follows the creative brief and does not modify the website palette.
- A solid pearl and continuous trail identify the factual world. A glass-like
  sphere and faint segmented trail identify the counterfactual world.
- Fourteen synthetic patients have a baseline confounder C that affects outcome
  and treatment probability. Horizontal position stays fixed at baseline C;
  outcome is vertical; time is depth. Fixed patient-specific variation is shared
  across both potential outcomes.
- The worlds share position and tangent at treatment. Treatment then adds a
  smooth, heterogeneous, positive response. There is no anticipatory effect.
- The final gap is Y(1) − Y(0) for the same patient at the same time. These are
  simulation truths, not fitted predictions or effects recovered from real data.
  The camera uses a shared orthographic scale for the final comparison.

`model.js` defines the cohort, trajectories and camera. `render.js` draws one frame
from a time in seconds; `player.js` provides playback. This separation allows a
future website mount to reuse the same renderer without the preview controls.

## Checks and export

Keep the preview server running for capture. Chrome and ffmpeg must be installed.

```sh
node --test film/model.test.js
node film/capture.mjs
node film/capture.mjs --video
node node_modules/vite/bin/vite.js build film --base ./ --outDir dist
```

Capture checks playback, pausing, keyboard seeking, narrow-screen overflow,
reduced-motion behavior and browser errors. It saves six full-resolution film
stills plus desktop/mobile player screenshots to ignored `film/exports/`.
`--video` renders every frame from its exact timestamp and encodes a 1920×1080,
30 fps H.264 MP4 with fast-start metadata. It does not record the preview controls.
The output is `film/exports/causal-sandbox-two-futures.mp4`; the final still is
`film/exports/thumbnail.png`. Re-running capture replaces these generated files.

The standalone production build is written to ignored `film/dist/`.

## Website use and preserved master

The source, full-resolution `exports/thumbnail.png`, and 1080p
`exports/causal-sandbox-two-futures.mp4` are tracked in Git. The small
`exports/poster.webp` is tracked too; other capture outputs stay ignored.
Capture regenerates the poster from the same renderer at 960×540.

The first lesson offers a compact watch card via `src/film-preview.js`. Its native
video player opens in a dialog on request. No video source is attached until the
user opens it; playback pauses on close, and lesson values are preserved.
The regular site build bundles the poster and MP4 with hashed URLs. It does not
bundle or run the animation renderer. The original standalone preview is still
available through the command above.
