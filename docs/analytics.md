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
other free text. Allowlisted `utm_source` and `utm_medium` values and validated
`utm_content` labels are captured on arrival and retained during in-page
navigation. Learning-chooser and topic links also carry these allowed fields
across page loads; they do not copy other arrival parameters. Sources include
`reddit` and `linkedin`. Content labels accept
1–64 letters, numbers, underscores, or hyphens and are normalized to lowercase.
Use labels such as `causal_inference`, `r_projects`, `r_stats`, or
`linkedin_post_2` to distinguish communities or individual posts without a code
change. Labels are sent to PostHog: use campaign identifiers, never personal or
sensitive information. Break down events by `utm_content` to compare posts,
optionally filtering by `utm_source`. Unknown sources or media, invalid content
labels, `utm_campaign`, and `utm_term` are discarded.

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

## README site views

The chart at the bottom of the README uses the existing public
[GoatCounter counter](https://www.goatcounter.com/help/visitor-counter), with no
API key or additional tracking. Only cumulative counts and date cutoffs are
stored in `docs/site-views.json`; the README embeds `docs/site-views.svg` from
the dedicated `site-views` branch, which contains only these two generated files.
These are site views, not lifetime unique visitors or learning outcomes.
The owner confirmed that this GoatCounter site covers Causal Sandbox and its
subpages. The `TOTAL` counter includes all of them; visiting several pages can
contribute several views. Referrers describe where visits came from; they are
neither added to the total separately nor exported with the chart.

Run `node scripts/update-site-views.mjs` to generate a local preview in `docs/`
(ignored by Git), or pass an output directory containing the existing history:
`node scripts/update-site-views.mjs traffic-data/docs`.
The daily GitHub Actions workflow runs at 06:23 UTC using the generator from the
default branch and commits only the two assets to `site-views`. This keeps
scheduled data updates separate from the reviewed changes required on `main`.
It needs repository contents write permission and a `site-views` branch that
permits bot commits. The schedule becomes active after merging the workflow to
the default branch. A manual workflow run can also refresh the chart.

Each observation is the cumulative `TOTAL` count with an `end=YYYY-MM-DD`
cutoff, starting on 6 September 2026 when tracking was introduced. GoatCounter
parses this as midnight UTC and includes that hour's bucket. These are daily
snapshots, not calendar-day totals: a 12 September point includes the 00:00–01:00
UTC hour on 12 September. Before 06:00 UTC, the updater uses the preceding date
to allow that bucket to finish and the four-hour cache window to pass. The total
may be lower than the live footer count. The curve passes through daily
observations without overshoot; its shape within a day is interpolation, not
measured intraday activity.

Updates refetch the latest seven cutoffs to pick up delayed counts. HTTP errors,
invalid data, or decreases in stored counts fail the job before replacing files,
leaving the last successful chart visible with its date. A legitimate historical
correction requires inspecting and updating the stored history before rerunning.
The public counter may cache results for up to four hours, and GitHub may also
cache the image. Validate changes with `node --test scripts/site-views.test.mjs`.
