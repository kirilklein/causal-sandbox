import "./feedback.css";

export function setupFeedback(footer) {
  const endpoint = import.meta.env.VITE_FEEDBACK_ENDPOINT?.trim();
  if (!endpoint) return;
  if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) {
    throw new Error("VITE_FEEDBACK_ENDPOINT must be a Formspree form ID URL");
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "feedback-open";
  button.textContent = "Give feedback";
  button.setAttribute("aria-haspopup", "dialog");
  footer.querySelector(".site-footer-links").prepend(button);

  let openDialog;
  button.addEventListener("click", () => {
    openDialog ??= createFeedbackDialog(button, endpoint);
    openDialog();
  });
}

function createFeedbackDialog(button, endpoint) {
  const dialog = document.createElement("dialog");
  dialog.className = "feedback-dialog";
  dialog.setAttribute("aria-labelledby", "feedback-title");
  dialog.innerHTML = `
    <div class="feedback-heading">
      <h2 id="feedback-title">Give feedback</h2>
      <button type="button" class="feedback-close" aria-label="Close feedback">Close</button>
    </div>
    <p>Something confusing? Found a bug? Have an idea? Tell me anything.</p>
    <form>
      <fieldset>
        <label for="feedback-message">Your message</label>
        <textarea id="feedback-message" name="message" rows="5" maxlength="5000" required autofocus aria-describedby="feedback-limit"></textarea>
        <small id="feedback-limit">Up to 5,000 characters.</small>
        <label for="feedback-email">Email <span>— optional, only if you’d like a reply</span></label>
        <input id="feedback-email" name="email" type="email" maxlength="254" autocomplete="email" />
        <input name="_gotcha" type="text" tabindex="-1" autocomplete="off" class="feedback-honeypot" aria-hidden="true" />
        <p class="feedback-context">Included context: <span></span></p>
        <p class="feedback-privacy">No account or email required. Feedback goes privately to Kiril through Formspree, which processes technical data such as your IP address. Please don’t include sensitive personal information. <a href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">Formspree privacy policy</a>.</p>
        <button type="submit" class="feedback-send">Send feedback</button>
      </fieldset>
      <p class="feedback-status" role="status" aria-live="polite" aria-atomic="true"></p>
    </form>`;
  document.body.append(dialog);

  const form = dialog.querySelector("form");
  const fields = dialog.querySelector("fieldset");
  const message = form.elements.message;
  const send = dialog.querySelector(".feedback-send");
  const status = dialog.querySelector(".feedback-status");
  const context = dialog.querySelector(".feedback-context span");
  let pending = false;
  let sent = false;

  function openDialog() {
    if (sent) {
      status.textContent = "";
      fields.disabled = false;
      sent = false;
    }
    context.textContent =
      document.querySelector("h1")?.textContent.trim() || "Causal Sandbox";
    dialog.showModal();
  }
  dialog
    .querySelector(".feedback-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => button.focus());
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [
      ...dialog.querySelectorAll(
        "button, textarea, input:not(.feedback-honeypot), a",
      ),
    ].filter((control) => !control.matches(":disabled"));
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  message.addEventListener("input", () => message.setCustomValidity(""));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending || sent) return;
    message.setCustomValidity(
      message.value.trim() ? "" : "Please write a message.",
    );
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    data.set("message", message.value.trim());
    if (!data.get("email")) data.delete("email");
    data.set("context", context.textContent);
    pending = true;
    fields.disabled = true;
    send.textContent = "Sending…";
    status.textContent = "";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        sent = true;
        form.reset();
        status.textContent = "Thanks! Your feedback has been sent.";
        dialog.querySelector(".feedback-close").focus();
      } else {
        status.textContent =
          response.status === 429
            ? "Feedback is temporarily busy. Your message is still here; please try again later."
            : "Your feedback couldn’t be sent. Your message is still here; please try again later.";
      }
    } catch (error) {
      status.textContent =
        "Delivery couldn’t be confirmed. Your message is still here. Check your connection before trying again.";
      if (
        !(error instanceof TypeError) &&
        error.name !== "TimeoutError" &&
        error.name !== "AbortError"
      )
        throw error;
    } finally {
      pending = false;
      fields.disabled = sent;
      send.textContent = "Send feedback";
    }
  });
  return openDialog;
}
