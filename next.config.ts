import type { NextConfig } from "next";

/**
 * Where PostHog actually lives. Read here as well as in
 * instrumentation-client.ts so the proxy and the SDK cannot disagree about
 * which region the events are going to.
 */
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * Static assets — recorder.js, surveys.js, the toolbar — come off a sibling
 * host rather than the ingest host.
 */
const POSTHOG_ASSET_HOST = POSTHOG_HOST.replace(
  "://us.i.",
  "://us-assets.i."
).replace("://eu.i.", "://eu-assets.i.");

/**
 * Whether the /ingest proxy exists at all.
 *
 * This has to be the same condition `instrumentation-client.ts` uses to decide
 * whether posthog-js initialises. When the two disagree the failure is quiet
 * and one-directional: a proxy that is mounted while the SDK is off will still
 * forward anything that reaches /ingest — a stray request, a crawler, a
 * browser extension — and open outbound connections from a checkout whose
 * owner believes analytics is switched off.
 *
 * NODE_ENV is "production" while `next build` runs, which is when rewrites are
 * evaluated and baked into the route manifest, so gating on it here produces a
 * proxy in the built application and none under `next dev`.
 */
const ANALYTICS_ENABLED =
  Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) &&
  (process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_POSTHOG_DEV === "1");

const nextConfig: NextConfig = {
  // Analytics requests go out same-origin, through /ingest, and are proxied to
  // PostHog from the server. The audience for this site is developers, and
  // *.posthog.com is on every blocklist worth the name, so measuring them
  // directly would quietly under-count exactly the people the course is for.
  async rewrites() {
    if (!ANALYTICS_ENABLED) return [];
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSET_HOST}/static/:path*`,
      },
      { source: "/ingest/:path*", destination: `${POSTHOG_HOST}/:path*` },
    ];
  },

};

export default nextConfig;
