export async function createClient(key, host) {
  const { default: posthog } = await import("posthog-js");
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
}
