# Analytics

Causal Sandbox uses GoatCounter for aggregate visit counts and PostHog Cloud EU
for a small set of manual product events. In production, the PostHog SDK loads
after the first named interaction when both `VITE_POSTHOG_KEY` and
`VITE_POSTHOG_HOST` are configured. Opening the introduction page alone does
not initialize PostHog or create its anonymous identifier.

The integration disables autocapture, automatic page views, page-leave events,
session replay, user identification, and automatic exception capture. Manual
events include lesson starts and completions, prediction submissions,
simulation runs, sandbox changes, graph changes, sharing, GitHub visits, and
successful feedback submissions. Event properties use bounded identifiers such
as lesson slugs, scenario IDs, and control IDs. They do not include simulation
data, graph labels, feedback text, email addresses, full URLs, referrers, or
other free text. Only the standard `utm_source`, `utm_medium`, `utm_campaign`,
`utm_term`, and `utm_content` campaign fields are retained, each capped at 100
characters.

PostHog assigns an anonymous browser identifier so return use can be measured
across sessions. The integration respects Do Not Track and disables GeoIP
enrichment on every manual event. It does not show a separate analytics consent
prompt. Revisit this choice if the site's audience, data use, or legal basis
changes.

For GitHub Pages, set the project key as the `VITE_POSTHOG_KEY` Actions secret.
The EU ingestion host is set in the deployment workflow. The project key is
embedded in the built browser bundle and is therefore public at runtime; using
a secret keeps it out of source history and pull-request diffs, but cannot make
it confidential.

The Vite development server does not initialize PostHog, even when the
variables are present. CI uses a dummy key in its production build and
intercepts the request to check the event payload without sending it to
PostHog. `.env.example` documents the variables without a real project key.
