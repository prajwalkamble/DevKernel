import type { Lesson } from "@/content/types";

export const staticGenerationLesson: Lesson = {
  id: "react-static-generation",
  slug: "static-generation",
  moduleSlug: "client-and-server-rendering",
  title: "Static Generation & Revalidation",
  summary:
    "Server rendering done once, in advance, and served as a file. Why it is the fastest option available, the two problems it creates — stale content and long builds — and what incremental regeneration actually does about them.",
  estimatedMinutes: 26,
  objectives: [
    "Say what static generation is in terms of when the render happens",
    "Explain why it is faster than server rendering per request",
    "Describe incremental regeneration and the staleness it accepts",
    "Recognise when a build time becomes the constraint",
    "Combine static shells with per-user content",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "The same render, earlier",
      body: [
        "Server rendering runs your components once per request. But if the output does not depend on the request — the same HTML for every visitor — then running it per request is doing identical work over and over.",
        "So run it once, at build time, and write the result to a file. A request is now a file being served from a CDN edge, which is the cheapest and fastest thing the web does.",
        "The component code is unchanged. `renderToString` is still what runs. The only difference is *when*, and the whole of static generation follows from that one change.",
      ],
      visual: {
        id: "ssg-timeline-visual",
        kind: "react-server",
        algorithm: "ssg-timeline",
        title: "Request to content, statically generated",
      },
    },
    {
      id: "why-fast",
      heading: "Why it wins on every metric that is not freshness",
      body: [
        "**No origin round trip.** The file is on a CDN node near the user, so time to first byte is one short hop rather than a trip to your server's region.",
        "**No server work.** Nothing is rendered, nothing is queried. A traffic spike is bandwidth, not compute — and a CDN is very good at bandwidth.",
        "**Nothing to fall over.** The database being down does not stop a file from being served. Neither does your server being redeployed.",
        "**It caches properly.** A static HTML file has an ETag and can be cached at every layer between you and the user. A server-rendered response usually cannot, because it might be personalised.",
        "Compare the two timelines in this lesson and the previous one: the SSG line reaches real content at one round trip, and the SSR line adds the server's own work to it. From hydration onwards they are identical, because from hydration onwards they *are* identical — same HTML, same bundle, same everything.",
      ],
    },
    {
      id: "the-cost",
      heading: "The two things it costs",
      body: [
        "**Staleness.** The HTML is a photograph taken at build time. If the price changed an hour ago, the page still says the old price until something rebuilds it.",
        "**Build time.** The render happens once per page, at build, so ten thousand pages is ten thousand renders before you can deploy. Blogs do not care. A shop with a hundred thousand products cares a great deal — a twenty-minute build is a twenty-minute wait to fix a typo.",
        "Everything called *ISR*, *on-demand revalidation* or *stale-while-revalidate* is an attack on one or both of those.",
      ],
    },
    {
      id: "isr",
      heading: "Incremental regeneration",
      body: [
        "The idea is to keep serving the file and rebuild it in the background, on a schedule or on a signal.",
        "**Time-based.** Give the page a lifetime. After it expires, the *next* request is still served the old file — immediately — and triggers a regeneration behind it. The visitor who paid the cost of the rebuild is nobody: everyone gets a cached file, and one of them gets a slightly stale one.",
        "**On-demand.** Your CMS calls a webhook when an editor publishes, and that path is regenerated. This is the version worth wanting, because the staleness window becomes the length of the rebuild rather than the length of a guess.",
        "**Deferred generation.** Build the thousand pages that matter and leave the rest unbuilt. The first request for an unbuilt path renders it on the server, stores it, and serves the file to everyone after. The long tail costs one slow request each instead of a longer build for everybody.",
      ],
      examples: [
        {
          id: "next-shapes",
          title: "The three shapes, as one framework spells them",
          lang: "tsx",
          code: `/* Build-time only. Rendered once when you deploy, never again. */
export const dynamic = "force-static";

/* Time-based: this page may be up to an hour old. The request after the
   hour is served the stale file and starts the rebuild behind it. */
export const revalidate = 3600;

/* Which paths to build. Return the ones worth pre-building; the rest are
   rendered on first request and cached from then on. */
export async function generateStaticParams() {
  const posts = await db.posts.mostRead(1000);
  return posts.map((post) => ({ slug: post.slug }));
}

/* On-demand, from a webhook route: rebuild exactly this path, now. */
export async function POST(request: Request) {
  const { slug } = await request.json();
  revalidatePath(\`/blog/\${slug}\`);
  return Response.json({ revalidated: true });
}`,
          explanation:
            "The names are Next.js's; the ideas are not, and Astro, SvelteKit, Nuxt and TanStack Start all have their own spelling of the same four. What is worth carrying between them is the shape: *is this page allowed to be old, and if so, for how long, and what makes it young again?*",
        },
      ],
      pitfalls: [
        {
          title: "The first visitor after expiry sees the old page",
          body: "That is the design, not a bug — the alternative is making one unlucky visitor wait for a render. It does mean the effective staleness window is your revalidation period *plus* the gap until the next request, so a page nobody visits stays stale indefinitely, then serves one stale response to the person who finally does.",
        },
      ],
    },
    {
      id: "personalisation",
      heading: "What to do about the parts that differ per user",
      body: [
        "The obvious objection to static generation is that half the page is personalised — a name in the header, a cart count, a *saved* state on each item — and a file cannot contain those.",
        "The answer is not to abandon the file. It is to notice that the personalised parts are usually **small, late and uninteresting**, and the rest of the page is the reason the user is here.",
        "**Serve the static page and fill the small parts in after mount.** A header that says nothing for 200ms and then says your name is a much better page than one that took 600ms to arrive.",
        "**Or split the response.** Stream the static shell immediately and the personalised region behind a Suspense boundary, which is module 11's lesson 6 doing exactly what it was designed for.",
        "**Or move the personalisation to the edge.** A middleware that rewrites a single element, or sets a cookie the static page reads, keeps the file cacheable while making it feel bespoke.",
        "What none of these is: rendering the whole page per request because the header has a name in it.",
      ],
    },
    {
      id: "choosing",
      heading: "How to tell which one a page is",
      body: [
        "One question, and it is not about the technology: **can this page's HTML be identical for two different visitors at the same moment?**",
        "If yes, it is a static page, however dynamic the data behind it is. A news homepage changes every ten minutes and is still identical for everyone who loads it in the same ten minutes — that is `revalidate`, not server rendering.",
        "If no — a dashboard, a cart, anything behind a login — it is server-rendered or client-rendered, and lesson 8 is about choosing between those.",
        "The mistake worth avoiding is answering *no* because part of the page differs. Most pages are a static document with a personalised trim, and the trim does not get to decide how the document is served.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is static generation and how does it differ from SSR?",
      answer:
        "Only in when the render happens. The same components run through the same server renderer, but at build time rather than per request, and the output is written to a file. A request is then a CDN serving a file: no origin round trip, no server work, nothing to fall over, and it caches at every layer — which is why it beats server rendering on every metric except freshness.",
    },
    {
      question: "What does static generation cost?",
      answer:
        "Staleness and build time. The HTML is a photograph taken when you deployed, so it is wrong the moment the underlying data changes; and the render happens once per page, so a hundred thousand pages is a hundred thousand renders before you can ship a typo fix. Incremental regeneration — time-based, on-demand, or deferred to first request — is the set of answers to those two.",
    },
    {
      question: "How does incremental static regeneration work?",
      answer:
        "The page keeps being served from the existing file after its lifetime expires; the request that arrives after expiry gets the stale file immediately and triggers a regeneration behind it, so nobody waits for a render. On-demand revalidation is the better version — a webhook rebuilds exactly the path that changed — because the staleness window becomes the length of the rebuild rather than the length of a guess.",
    },
    {
      question: "Can a page with personalised content be static?",
      answer:
        "Usually yes, because the personalised parts are small and late. Serve the static document and fill the name or the cart count in after mount, or stream the personalised region behind a Suspense boundary, or handle it at the edge with a middleware rewrite. The mistake is letting a name in the header decide that the whole page must be rendered per request.",
    },
  ],
  takeaways: [
    "Static generation is server rendering moved to build time and written to a file",
    "One CDN hop, no origin work, no database dependency, and it caches everywhere",
    "From hydration onwards it is identical to SSR — same HTML, same bundle",
    "It costs staleness and build time, and every regeneration feature attacks one of those",
    "Time-based revalidation serves the stale file and rebuilds behind it, so nobody waits",
    "On-demand revalidation via a webhook is the version worth wanting",
    "Deferred generation trades a long build for one slow first request per rare path",
    "The test: can two visitors at the same moment be sent identical HTML?",
    "A personalised header does not make a page dynamic — fill it in after mount",
  ],
  status: "available",
};
