import { DURATION, clamp } from "./model.js";
import { renderFilm } from "./render.js";

const canvas = document.querySelector("#film");
const play = document.querySelector("#play");
const seek = document.querySelector("#seek");
const time = document.querySelector("#time");
const params = new URLSearchParams(location.search);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let seconds = params.has("t")
  ? clamp(Number(params.get("t")) || 0, 0, DURATION)
  : reducedMotion.matches
    ? DURATION
    : 0;
let playing = !params.has("t") && !reducedMotion.matches;
let previous = null;

function draw() {
  renderFilm(canvas, seconds);
  seek.value = seconds;
  seek.setAttribute(
    "aria-valuetext",
    `${seconds.toFixed(1)} seconds of ${DURATION}`,
  );
  time.value = `00:${String(Math.floor(seconds)).padStart(2, "0")} / 00:32`;
  play.textContent = playing
    ? "Pause"
    : seconds === DURATION
      ? "Replay"
      : "Play";
  play.setAttribute(
    "aria-label",
    playing ? "Pause animation" : "Play animation",
  );
}

function setPlaying(value) {
  if (value && seconds >= DURATION) seconds = 0;
  playing = value;
  previous = null;
  draw();
}

function setTime(value) {
  seconds = clamp(value, 0, DURATION);
  playing = false;
  previous = null;
  draw();
}

play.addEventListener("click", () => setPlaying(!playing));
document.querySelector("#restart").addEventListener("click", () => {
  seconds = 0;
  setPlaying(true);
});
document
  .querySelector("#ending")
  .addEventListener("click", () => setTime(DURATION));
document.querySelector("#fullscreen").addEventListener("click", async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.querySelector(".screen").requestFullscreen();
});
seek.addEventListener("input", () => setTime(Number(seek.value)));
document.addEventListener("keydown", (event) => {
  if (event.target.matches("button, input")) return;
  if (event.code === "Space") {
    event.preventDefault();
    setPlaying(!playing);
  }
  if (event.code === "ArrowRight") {
    event.preventDefault();
    setTime(seconds + 1);
  }
  if (event.code === "ArrowLeft") {
    event.preventDefault();
    setTime(seconds - 1);
  }
});
document.addEventListener("visibilitychange", () => {
  previous = null;
});
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) setTime(DURATION);
});

// The same deterministic renderer drives playback, stills and frame-accurate export.
window.cohortFilm = {
  seek: setTime,
  render: renderFilm,
  duration: DURATION,
  get time() {
    return seconds;
  },
};
function tick(now) {
  if (playing && !document.hidden) {
    if (previous !== null)
      seconds = Math.min(DURATION, seconds + (now - previous) / 1000);
    previous = now;
    if (seconds === DURATION) playing = false;
    draw();
  }
  requestAnimationFrame(tick);
}
draw();
requestAnimationFrame(tick);
