export function setupHelp() {
  let activeTrigger, openTimer, closeTimer;

  function positionHelp() {
    const panel = activeTrigger?.popoverTargetElement;
    if (!panel?.matches(":popover-open")) return;
    const trigger = activeTrigger.getBoundingClientRect();
    const { width, height } = panel.getBoundingClientRect();
    const left = Math.max(16, Math.min(trigger.left, innerWidth - width - 16));
    const top =
      trigger.bottom + height + 24 <= innerHeight
        ? trigger.bottom + 8
        : Math.max(16, trigger.top - height - 8);
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function scheduleClose() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    // Leave time to cross the small gap from the term to its explanation.
    closeTimer = setTimeout(() => {
      const panel = activeTrigger?.popoverTargetElement;
      if (
        panel?.matches(":popover-open") &&
        !panel.matches(":hover") &&
        !activeTrigger.matches(":hover") &&
        !panel.contains(document.activeElement) &&
        activeTrigger !== document.activeElement
      )
        panel.hidePopover();
    }, 200);
  }

  document.querySelectorAll(".help-button").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      activeTrigger = trigger;
      requestAnimationFrame(positionHelp);
    });
    trigger.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      openTimer = setTimeout(() => {
        if (!trigger.popoverTargetElement.matches(":popover-open")) {
          // Retain native popover keyboard navigation and dismissal semantics.
          trigger.click();
        }
      }, 500);
    });
    trigger.addEventListener("pointerleave", scheduleClose);
    trigger.addEventListener("blur", scheduleClose);
  });
  document.querySelectorAll(".term-help").forEach((panel) => {
    panel.addEventListener("pointerenter", () => clearTimeout(closeTimer));
    panel.addEventListener("pointerleave", scheduleClose);
    panel.addEventListener("focusout", scheduleClose);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") clearTimeout(openTimer);
  });
  window.addEventListener("resize", positionHelp);
  window.addEventListener("scroll", positionHelp, true);
}
