export function bindTrajectoryOrbit(
  canvas,
  { enabled, onStart, onRotate, onReset },
) {
  const controller = new AbortController();
  const listen = (type, handler) =>
    canvas.addEventListener(type, handler, { signal: controller.signal });
  let drag = null;
  function endDrag() {
    if (!drag) return;
    const id = drag.id;
    drag = null;
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    canvas.classList.remove("is-dragging");
  }
  listen("pointerdown", (event) => {
    if (!enabled() || event.button !== 0 || drag) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    onStart();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("is-dragging");
  });
  listen("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    onRotate(
      (event.clientX - drag.x) * 0.004,
      (event.clientY - drag.y) * 0.002,
    );
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    listen(type, (event) => {
      if (drag?.id === event.pointerId) endDrag();
    });
  listen("keydown", (event) => {
    if (!enabled()) return;
    const keys = {
      ArrowLeft: [-0.06, 0],
      ArrowRight: [0.06, 0],
      ArrowUp: [0, -0.03],
      ArrowDown: [0, 0.03],
    };
    if (keys[event.key]) {
      event.preventDefault();
      onRotate(...keys[event.key]);
    }
    if (event.key === "Home") {
      event.preventDefault();
      onReset();
    }
  });

  return {
    endDrag,
    destroy() {
      endDrag();
      controller.abort();
    },
  };
}
