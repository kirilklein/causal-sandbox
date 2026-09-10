const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST;
export const posthogEnabled = import.meta.env.PROD && Boolean(key && host);
let clientPromise;

function getClient() {
  // A blocked analytics module must not prevent the app from starting.
  clientPromise ??= import("./posthog.js").then(({ createClient }) =>
    createClient(key, host),
  );
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
