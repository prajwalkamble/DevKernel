import posthog from "posthog-js";

// Runs after the document loads but before React hydrates, so a pageview is
// recorded even if the visitor leaves before the page becomes interactive.

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Only for pointing links back at the PostHog UI; ingest goes through /ingest.
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// Analytics is opt-in per environment. With no key in the environment — a
// local checkout, CI, a fork — posthog never initialises and nothing is sent,
// so nobody has to remember to turn it off. Set the key in the hosting
// provider's environment for production; put it in .env.local only when you
// deliberately want to watch your own local events land.
if (key) {
  posthog.init(key, {
    // Same-origin, proxied to PostHog by the rewrites in next.config.ts.
    // A blocked request is an uncounted reader, and this audience blocks.
    api_host: "/ingest",
    // The proxy hides the real host, so links from the SDK back into PostHog
    // (the toolbar, mostly) need to be told where the app actually is.
    ui_host: POSTHOG_HOST,

    // PostHog's own paths end in a slash (/e/, /flags/), and Next answers a
    // trailing slash with a 308 to the slash-less form — which for a POST
    // means the body is dropped and the events vanish. The usual fix is
    // `skipTrailingSlashRedirect`, but that turns off canonical redirects for
    // the whole site and leaves every lesson reachable at two URLs. PostHog
    // serves the slash-less paths identically (`POST /e` answers `{"status":
    // "Ok"}` exactly as `/e/` does), so ask for those instead and leave the
    // site's own URLs alone.
    rewriteRequestPath: (url) => {
      url.pathname = url.pathname.replace(/\/+$/, "");
      return url;
    },

    // Pins the behaviour this file was written against. posthog-js ships
    // breaking default changes under dated keys, so without this an upgrade
    // could quietly change what gets captured.
    defaults: "2026-08-29",

    // The site is a single App Router application: after the first load,
    // moving between lessons only pushes history state, so the default
    // load-time-only pageview would record one visit per session no matter how
    // much of the curriculum someone read. 'history_change' captures a
    // pageview on every client-side navigation as well.
    capture_pageview: "history_change",

    // Session replay. The project settings decide whether it runs at all;
    // this decides what it is allowed to see if it does.
    session_recording: {
      // The playground, the practice console and every lesson code block are
      // Monaco, and Monaco renders what you type as ordinary DOM text. Without
      // this, replay would quietly ship half-written interview solutions —
      // and whatever someone pasted into the playground to try — off this
      // machine. Blocked rather than masked: a grey box is enough to see that
      // someone was editing, and that is all the replay needs to show.
      blockSelector: ".monaco-editor, [data-ph-no-capture]",
      maskAllInputs: true,
    },
  });
}
