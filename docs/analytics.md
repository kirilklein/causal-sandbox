# Analytics

Causal Sandbox uses GoatCounter for aggregate visit counts and PostHog Cloud EU
for a small set of manual product events. In production, the PostHog SDK loads
after the first named interaction when both `VITE_POSTHOG_KEY` and
`VITE_POSTHOG_HOST` are configured. Opening the introduction page alone does
not initialize PostHog or create its anonymous identifier.

The integration disables autocapture, automatic page views, page-leave events,
session replay, user identification, and automatic exception capture. Manual
events include lesson starts and advances, prediction submissions,
simulation runs, sandbox changes, graph changes, sharing, and GitHub visits.
Feedback submissions are delivered through Formspree without an analytics event.
Event properties use bounded identifiers such
as lesson slugs, scenario IDs, and control IDs. They do not include simulation
data, graph labels, feedback text, email addresses, full URLs, referrers, or
other free text. Only allowlisted `utm_source` and `utm_medium` values are
captured on arrival and retained during in-page navigation. Unknown values,
`utm_campaign`, `utm_term`, and `utm_content` are discarded.

`lesson_started` counts lesson entries, excluding the Restart button.
`lesson_advanced` means clicking Continue or the recap's Explore link; it does
not claim that someone answered a prediction or mastered the lesson.

PostHog stores an anonymous browser identifier in localStorage, without a
PostHog cookie, so return use can be measured across sessions. The integration
respects Do Not Track and disables GeoIP enrichment on manual events. There
is no consent prompt; localStorage is still browser storage, so this choice
alone does not establish that consent is unnecessary.

For GitHub Pages, set the project key as the `VITE_POSTHOG_KEY` Actions secret.
The EU ingestion host is set in the deployment workflow. The project key is
embedded in the built browser bundle and is therefore public at runtime; using
a secret keeps it out of source history and pull-request diffs, but cannot make
it confidential.

The Vite development server does not initialize PostHog. The regular browser
suite runs without analytics credentials. CI builds a separate analytics site
with a dummy key and `https://analytics.invalid`, intercepting all its analytics
requests. It cannot send events to the production ingestion host.

To run the isolated check locally:

```sh
VITE_POSTHOG_KEY=phc_ci_test_key VITE_POSTHOG_HOST=https://analytics.invalid npm run build -- --outDir dist-analytics
npx vite preview --outDir dist-analytics --port 5174 --strictPort
# In another terminal:
APP_URL=http://127.0.0.1:5174/causal-sandbox/ node tests/analytics-browser.mjs
```

`.env.example` documents the deployment variables without a real project key.
