const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST;
export const posthogEnabled = import.meta.env.PROD && Boolean(key && host);
let clientPromise;

function getClient() {
  clientPromise ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host,
      persistence: "localStorage",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_exceptions: false,
      capture_performance: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_product_tours: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      person_profiles: "identified_only",
      property_denylist: [
        "$current_url",
        "$pathname",
        "$referrer",
        "$referring_domain",
        "$initial_current_url",
        "$initial_referrer",
        "$initial_referring_domain",
        "$session_entry_url",
        "$session_entry_host",
        "$session_entry_pathname",
        "$session_entry_referrer",
        "$session_entry_referring_domain",
      ],
      save_campaign_params: false,
      save_referrer: false,
      request_batching: false,
      respect_dnt: true,
    });
    return posthog;
  });
  return clientPromise;
}

const arrival = new URLSearchParams(location.search);
const campaign = Object.fromEntries(
  Object.entries({
    utm_source: [
      "linkedin",
      "github",
      "youtube",
      "google",
      "newsletter",
      "reddit",
    ],
    utm_medium: ["social", "organic", "email", "referral", "video", "cpc"],
  }).flatMap(([name, allowed]) => {
    const value = arrival.get(name)?.toLowerCase();
    return allowed.includes(value) ? [[name, value]] : [];
  }),
);
const content = arrival.get("utm_content")?.toLowerCase();
if (content && /^[a-z0-9_-]{1,64}$/.test(content)) {
  campaign.utm_content = content;
}

export function campaignHref(href) {
  const url = new URL(href, location.href);
  for (const [name, value] of Object.entries(campaign)) {
    url.searchParams.set(name, value);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function capture(event, properties = {}, options) {
  if (!posthogEnabled) return Promise.resolve();
  const eventProperties = {
    ...campaign,
    ...properties,
    $geoip_disable: true,
  };
  return getClient()
    .then((posthog) => posthog.capture(event, eventProperties, options))
    .catch((error) => console.warn("Analytics unavailable:", error));
}
