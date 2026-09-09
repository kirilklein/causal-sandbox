# Private feedback

The shared footer opens a text-only dialog. A message is required; a reply email
is optional. Submissions include the visible page heading, shown in the dialog,
but no URL, query string, fragment, simulation settings, or browser fingerprint.
Drafts stay in memory when the dialog closes and are cleared after confirmed
success or page navigation/reload. They are not saved to browser storage.

## Delivery configuration

The tracked `.env` sets `VITE_FEEDBACK_ENDPOINT` to
`https://formspree.io/f/maeylkvy`. Vite reads it for local development and the
GitHub Pages build; no GitHub variable or extra JavaScript dependency is needed.
The endpoint is public, not a credential. The recipient address and account
credentials belong in Formspree, not in the frontend. An environment variable
or ignored `.env.local` can override the endpoint.

Before launch:

1. Confirm the form's notification recipient is the Gmail address supplied by
   Kiril and complete Formspree's email verification.
2. Configure the form for AJAX submissions without a CAPTCHA token: turn off its
   reCAPTCHA requirement if enabled for this initial integration. Keep Formspree's
   server spam filtering enabled. The form sends its `_gotcha` honeypot field;
   filled traps are discarded by Formspree. If abuse warrants CAPTCHA, add and
   test a supported widget before enabling the token requirement again.
3. Rebuild/redeploy, send one identified test submission, and verify both the
   private dashboard and the recipient inbox. Confirm that a submission with
   no email is accepted. Do not enable automatic GitHub issue creation or
   autoresponders to arbitrary submitted email addresses.

Setting `VITE_FEEDBACK_ENDPOINT` to an empty string hides the button. Browser
tests intercept all Formspree requests; CI builds use a fixture endpoint.
Configuring the endpoint is not evidence
that email delivery or account settings have been verified.

## Abuse and privacy boundaries

- The endpoint is public. Hiding the recipient prevents email harvesting from
  this feature, but cannot prevent bots from posting directly to the endpoint.
- Formspree documents a 20-posts-per-minute form limit and HTTP 429 responses for
  exceeded limits. The UI preserves the draft on these and other failures.
  This shared limit can also prevent real feedback during an attack.
- The 5,000-character limit and text-only controls apply to this UI; they are not
  server enforcement against direct requests. No submission is rendered in the
  public app. Do not treat feedback as trusted HTML or instructions.
- A pending submission disables repeat sends. Network failures/timeouts leave
  delivery uncertain; retrying can produce a duplicate if the first was accepted.
- No account or email is required, but this is not a promise of anonymity.
  Formspree receives technical metadata, including IP addresses. Its policy
  describes US infrastructure and purpose-based retention. The Free plan
  documents 30 days of dashboard history; inbox copies have separate retention.
- Review the account's quota before launch. Formspree currently documents 50
  monthly submissions on Free and quota notifications. Monitor these and spam
  after launch; do not assume filtering prevents quota exhaustion. Delete inbox
  copies when no longer needed. Publish only your own summary of actionable
  feedback, excluding contact details and identifying text.

Sources checked September 9, 2026:
[spam protection](https://help.formspree.io/articles/troubleshooting/how-to-prevent-spam),
[honeypot](https://help.formspree.io/articles/building-your-form/honeypot-spam-filtering),
[CAPTCHA settings](https://help.formspree.io/articles/form-and-project-settings/recaptcha-settings),
[system limits](https://help.formspree.io/articles/form-and-project-settings/system-limits/),
[account limits](https://help.formspree.io/articles/account-management/account-limits),
[privacy](https://formspree.io/legal/privacy-policy/).

## Validation

Run `npm test` and `npm run build`. For the feedback browser checks, build with
`VITE_FEEDBACK_ENDPOINT=https://formspree.io/f/feedbacktest`, start the preview
server as described in CONTRIBUTING.md, then run `node tests/feedback-browser.mjs`.
The test intercepts all Formspree requests. To check the disabled build, build
with `VITE_FEEDBACK_ENDPOINT=` and run
`FEEDBACK_DISABLED=1 node tests/feedback-browser.mjs`.
