# Two possible futures

A standalone 22-second Causal Sandbox film. The browser renderer uses a 3D coordinate system and a continuous camera
orbit, drawing to a Canvas 2D surface. It has no runtime dependencies, remote assets,
or tracking. The website master is silent. See [launch music](launch-music.md) for
the soundtrack brief and how to mix a separate LinkedIn export.

From the repository root, with the existing npm dependencies installed:

```sh
node node_modules/vite/bin/vite.js film --host 127.0.0.1 --port 5198 --strictPort
```

Open <http://127.0.0.1:5198/>. Space toggles playback; the slider and arrow keys seek.
“The reveal” shows the final composition. Reduced-motion preferences start on the
final still. `?t=12` opens paused at a specific second.

## Creative timing

| Seconds      | Image                                                              |
| ------------ | ------------------------------------------------------------------ |
| 0–3          | Silver histories are already moving; the opening titles crossfade. |
| 3–7.6        | Treatment worlds separate while the question remains readable.     |
| 7.6–11.6     | The camera continues its orbit, gradually slowing.                 |
| 11.6–15.6    | The view flattens and the paired gaps become legible.              |
| 12.2–16.2    | The headline emerges gently as the camera settles.                 |
| 16.4–18.2    | The bottom brand and tagline appear after the headline.            |
| 18.2–20 / 22 | A short social hold, with two extra seconds on the website.        |

Both exports use one scene clock: 2.2× at the start, easing continuously to 1×
over seconds 3–11. There is no extra speed-up in the middle. The final camera
move takes about five seconds; titles use playback time independently of the
scene speed. The patient trajectories and causal contrasts are unchanged.

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

`model.js` defines the cohort, trajectories, scene clock and camera. `render.js` draws one frame
from a time in seconds; `player.js` provides playback. This separation allows a
future website mount to reuse the same renderer without the preview controls.

## Checks and export

Keep the preview server running for capture. Chrome and ffmpeg must be installed.
For long exports, use a static preview so live reload cannot interrupt capture:

```sh
node --test film/model.test.js
node node_modules/vite/bin/vite.js build film --base ./ --outDir dist
node node_modules/vite/bin/vite.js preview film --host 127.0.0.1 --port 5220 --strictPort
# In a second terminal:
FILM_URL=http://127.0.0.1:5220/ node film/capture.mjs --video
FILM_URL=http://127.0.0.1:5220/ node film/capture.mjs --social
FILM_URL=http://127.0.0.1:5220/ node film/capture.mjs --gif
```

Capture checks playback, pausing, keyboard seeking, narrow-screen overflow,
reduced-motion behavior and browser errors. It saves six full-resolution film
stills plus desktop/mobile player screenshots to ignored `film/exports/`.
`--video` renders every frame from its exact timestamp and encodes a 1920×1080,
60 fps H.264 MP4 with fast-start metadata. It does not record the preview controls.
The output is `film/exports/causal-sandbox-two-futures.mp4`; the final still is
`film/exports/thumbnail.png`. Re-running capture replaces these generated files.

The standalone production build is written to ignored `film/dist/`.

`--social` produces a separate 20-second `exports/causal-sandbox-social-silent.mp4`.
It uses the same rendered sequence as the website master; only the final hold
is shorter. It renders fresh frames at 60 fps and never replaces the website
master. The social export stays ignored; reproduce it with the command above.

`--gif` regenerates the README's `docs/intro.gif`: the 20-second social cut at
800×450 and 20 fps. It renders lossless PNG frames directly from the canvas,
then uses a single global palette with stable ordered dithering. This avoids
carrying MP4 compression noise into the GIF or adding lossy temporal streaks.

## Website use and preserved master

The source, full-resolution `exports/thumbnail.png`, and 1080p
`exports/causal-sandbox-two-futures.mp4` are tracked in Git. The small
`exports/poster.webp` and the user-selected `exports/causal-sandbox-linkedin.mp4`
are tracked too; other capture outputs stay ignored. See [launch music](launch-music.md)
for the selected export’s audio status and soundtrack instructions.
Capture regenerates the poster from the same renderer at 960×540.

The homepage offers a secondary watch link via `src/film-preview.js`. Its native
video player opens in a dialog on request. No video source is attached until the
user opens it; playback pauses on close or navigation into a lesson.
The regular site build bundles the poster and MP4 with hashed URLs. It does not
bundle or run the animation renderer. The original standalone preview is still
available through the command above.
