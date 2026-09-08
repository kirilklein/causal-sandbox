import poster from "../film/exports/poster.webp";
import film from "../film/exports/causal-sandbox-two-futures.mp4";
import "./film-preview.css";

export function filmPreview() {
  return `<section class="film-preview" aria-label="An introduction to causal effects">
    <button class="film-open" type="button" aria-haspopup="dialog" aria-controls="intro-film">
      <span class="film-poster"><img src="${poster}" width="960" height="540" alt="" /><span class="film-play-mark" aria-hidden="true">▶</span></span>
      <span class="film-invitation"><strong>Two possible futures.</strong><span>Watch the film <span aria-hidden="true">↗</span><small>32 seconds</small></span></span>
    </button>
    <dialog id="intro-film" aria-labelledby="intro-film-title" aria-describedby="intro-film-caption">
      <div class="film-heading"><h2 id="intro-film-title">Two possible futures</h2><button class="film-close" type="button" aria-label="Close film" autofocus>Close <span aria-hidden="true">×</span></button></div>
      <video controls playsinline preload="none" poster="${poster}" aria-label="Causal Sandbox: Two possible futures. A silent 32-second film."></video>
      <p id="intro-film-caption">Simulated patients. The gap between each person’s treated and untreated outcomes is their causal effect.</p>
      <details class="film-description"><summary>Film description</summary><p>Fourteen silver spheres represent patients. The camera turns to reveal their movement through time. At treatment, each branches into a coral treated future and a blue untreated future. Solid spheres and continuous trails show the factual path; translucent spheres and broken trails show the counterfactual path. The camera aligns the endpoint pairs, revealing each patient’s causal effect. In real data, only one of these outcomes is observed for each person.</p></details>
      <p class="film-status" role="status" hidden></p>
    </dialog>
  </section>`;
}

export function setupFilmPreview() {
  const open = document.querySelector(".film-open");
  if (!open) return;
  const dialog = document.querySelector("#intro-film");
  const video = dialog.querySelector("video");
  const status = dialog.querySelector(".film-status");
  open.addEventListener("click", async () => {
    dialog.showModal();
    status.hidden = true;
    // Attaching the source only on request keeps the film off the lesson's network path.
    if (!video.getAttribute("src")) video.src = film;
    else if (video.error) video.load();
    if (video.ended) video.currentTime = 0;
    try {
      await video.play();
    } catch (error) {
      if (
        !["AbortError", "NotAllowedError", "NotSupportedError"].includes(
          error.name,
        )
      )
        throw error;
      status.textContent =
        error.name === "NotSupportedError"
          ? "The film could not load. Please try again."
          : "Press play to watch the film.";
      status.hidden = false;
    }
  });
  const close = () => {
    video.pause();
    dialog.close();
  };
  dialog.querySelector(".film-close").addEventListener("click", close);
  dialog.addEventListener("cancel", () => video.pause());
  dialog.addEventListener("close", () => video.pause());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      close();
  });
  video.addEventListener("error", () => {
    status.textContent = "The film could not load. Please try again.";
    status.hidden = false;
  });
}
