import type { TrackDefinition } from "@/content/types";
import { createComingSoonModule } from "@/content/comingSoon";

/**
 * Next.js on the App Router, assuming the React track (or equivalent React
 * knowledge) but not assuming any Next.js.
 *
 * The spine of the track is the question that decides everything else in a
 * Next.js app: *where does this code run?* Server and Client Components are
 * module 4, immediately after routing, because every later decision — data
 * fetching, caching, mutations, streaming — is downstream of that boundary.
 */
export const nextTrack: TrackDefinition = {
  id: "next",
  slug: "nextjs",
  title: "Next.js",
  shortTitle: "Next",
  tagline: "The App Router, Server Components, and every rendering strategy in one place",
  description:
    "Next.js from `create-next-app` to production, built around the one question that decides everything in a Next.js codebase: where does this code run? You start with file-based routing and layouts, then meet the Server/Client Component boundary and learn what may cross it. From there, every rendering strategy — static, server-rendered, incrementally regenerated, partially prerendered and client-only — with the caching model that drives them, then data fetching, Server Actions, route handlers, streaming, metadata, authentication, testing and deployment.",
  order: 5,
  status: "coming-soon",
  accent: "next",
  mode: "learn",
  lessonMinutes: [25, 40],
  interviewPrep: true,
  runnable: false,
  modules: [
    createComingSoonModule({
      id: "next-foundations",
      slug: "foundations",
      title: "What Next.js Is & Your First App",
      order: 1,
      description:
        "What Next.js adds to React and why, then a running application: the project layout, the dev server, and your first pages.",
      topics: [
        "What Next.js is, what problems it solves, and what it costs you",
        "The App Router against the Pages Router, and which one you are reading about",
        "Creating an app with create-next-app, and what each answer changes",
        "The project structure, and the files with special meaning",
        "Your first page, and how a folder becomes a URL",
        "The dev server, Fast Refresh, and the production build",
        "next.config, environment variables, and what is public",
        "Where the React you know still applies, and where it does not",
      ],
    }),
    createComingSoonModule({
      id: "next-routing",
      slug: "app-router",
      title: "Routing with the App Router",
      order: 2,
      description:
        "Everything the file system means: segments, dynamic routes, groups, parallel routes and intercepting routes.",
      topics: [
        "Folders as segments, and page.tsx as the thing that renders",
        "Dynamic segments, and reading params",
        "Catch-all and optional catch-all segments",
        "Route groups, and organising files without changing URLs",
        "Private folders, colocation, and what does not become a route",
        "Parallel routes, and rendering two things in one layout",
        "Intercepting routes, and the modal-over-a-page pattern",
        "generateStaticParams, and pre-rendering dynamic routes",
      ],
    }),
    createComingSoonModule({
      id: "next-layouts",
      slug: "layouts-and-ui-files",
      title: "Layouts, Templates, Loading & Error UI",
      order: 3,
      description:
        "The special files that wrap a route: shared shells that survive navigation, instant loading states, and error boundaries that are actually reachable.",
      topics: [
        "layout.tsx, nesting, and state that survives navigation",
        "The root layout, html and body, and what must live there",
        "template.tsx, and when you want a fresh instance instead",
        "loading.tsx, and the Suspense boundary it creates for you",
        "Designing a skeleton that matches the content behind it",
        "error.tsx, reset, and why it must be a Client Component",
        "global-error.tsx, not-found.tsx and notFound()",
        "Composing the special files: what wraps what, in what order",
      ],
    }),
    createComingSoonModule({
      id: "next-components",
      slug: "server-and-client-components",
      title: "Server Components & Client Components",
      order: 4,
      description:
        "The boundary the whole framework is organised around: what runs on the server, what ships to the browser, and the rules for passing things between them.",
      topics: [
        "Server Components by default, and what that changes",
        "What a Server Component may do that a Client Component may not",
        "'use client', and what the directive actually marks",
        "The boundary is a graph, not a file: what gets pulled in with you",
        "Passing props across the boundary, and the serialisation rules",
        "Passing Server Components as children to Client Components",
        "'use server', and functions that only ever run on the server",
        "Reading the bundle to see what actually shipped",
      ],
    }),
    createComingSoonModule({
      id: "next-rendering",
      slug: "rendering-strategies",
      title: "Rendering Strategies: Static, Server, ISR, PPR & Client",
      order: 5,
      description:
        "Every way Next.js can produce a page, what each one costs, and how to tell which one you actually got.",
      topics: [
        "Client-side rendering, and when it is still the right answer",
        "Server-side rendering, and the request-time HTML path",
        "Static generation, and building HTML ahead of time",
        "Incremental Static Regeneration, and revalidating without a rebuild",
        "Partial Prerendering: a static shell with dynamic holes",
        "Dynamic APIs, and how one call opts a whole route out of static",
        "Reading the build output to see what each route became",
        "Choosing a strategy per route, with a decision table",
      ],
    }),
    createComingSoonModule({
      id: "next-data",
      slug: "data-fetching-and-caching",
      title: "Data Fetching & Caching",
      order: 6,
      description:
        "Fetching on the server, and the caching layers that make the same code fast or stale depending on what you asked for.",
      topics: [
        "async Server Components, and awaiting data during render",
        "The extended fetch API, and its caching options",
        "Request memoisation, and deduplicating within one render",
        "The Data Cache, the Full Route Cache, and the Router Cache",
        "revalidatePath and revalidateTag",
        "cacheComponents and the modern caching directives",
        "Sequential against parallel fetching, and waterfalls",
        "Databases and ORMs from a Server Component, done safely",
      ],
    }),
    createComingSoonModule({
      id: "next-actions",
      slug: "server-actions",
      title: "Server Actions & Mutations",
      order: 7,
      description:
        "Writing data without writing an API: functions that run on the server, called straight from a form or a Client Component.",
      topics: [
        "What a Server Action is, and the request it really makes",
        "Progressive enhancement: forms that work before JavaScript loads",
        "useActionState, and rendering the result of an action",
        "useFormStatus, pending states, and disabling a submit button",
        "Optimistic updates with useOptimistic",
        "Validation, error handling, and returning typed results",
        "Revalidating and redirecting after a mutation",
        "Security: actions are public endpoints, and must be treated as such",
      ],
    }),
    createComingSoonModule({
      id: "next-handlers",
      slug: "route-handlers",
      title: "Route Handlers & the Backend Layer",
      order: 8,
      description:
        "When you do need an HTTP endpoint: route handlers, the Web Request and Response APIs, and the runtimes they can run on.",
      topics: [
        "route.ts, and the HTTP methods it exports",
        "Request and Response, and leaving Node-specific APIs behind",
        "Reading params, search params, headers and cookies",
        "Streaming a response, and server-sent events",
        "Webhooks, and verifying that a request is genuine",
        "The Node runtime against the Edge runtime",
        "CORS, rate limiting, and input validation",
        "Route handlers against Server Actions: choosing correctly",
      ],
    }),
    createComingSoonModule({
      id: "next-navigation",
      slug: "navigation-and-streaming",
      title: "Navigation, Streaming & Suspense",
      order: 9,
      description:
        "How moving between routes actually works, and how to make a slow page usable before it has finished loading.",
      topics: [
        "Link, prefetching, and what is fetched before you click",
        "useRouter, redirect, and programmatic navigation",
        "Soft navigation, the Router Cache, and stale segments",
        "Streaming with Suspense, and choosing boundary placement",
        "Loading states that do not cause layout shift",
        "useSearchParams, usePathname, and the client hooks",
        "Scroll restoration and focus management on navigation",
        "Measuring navigation, and what a slow route usually means",
      ],
    }),
    createComingSoonModule({
      id: "next-styling",
      slug: "styling-assets-fonts",
      title: "Styling, Assets, Fonts & Images",
      order: 10,
      description:
        "The built-in optimisations that are easy to leave switched off, and the styling options that work with Server Components.",
      topics: [
        "CSS Modules, global CSS, and where each may be imported",
        "Tailwind in a Next.js app, end to end",
        "CSS-in-JS, and why most libraries need a client boundary",
        "next/font, and eliminating layout shift from web fonts",
        "next/image: sizing, priority, placeholders and remote patterns",
        "The public directory, static assets and caching headers",
        "Dark mode without a flash of the wrong theme",
        "Auditing what your styling choice costs at runtime",
      ],
    }),
    createComingSoonModule({
      id: "next-metadata",
      slug: "metadata-seo",
      title: "Metadata, SEO & Accessibility",
      order: 11,
      description:
        "Making pages that search engines, social cards and screen readers all understand.",
      topics: [
        "The metadata object, and generateMetadata for dynamic routes",
        "Titles, templates, and canonical URLs",
        "Open Graph, Twitter cards, and generated OG images",
        "sitemap.ts, robots.ts, and manifest.ts",
        "Structured data and JSON-LD",
        "The viewport export, and theme colour",
        "Semantic HTML, landmarks and heading order",
        "Auditing with Lighthouse and axe, and fixing what they find",
      ],
    }),
    createComingSoonModule({
      id: "next-auth",
      slug: "auth-middleware-security",
      title: "Authentication, Middleware & Security",
      order: 12,
      description:
        "Sessions, protected routes, and the security model of a framework where some of your code runs on a server and some does not.",
      topics: [
        "Sessions and cookies, and the cookies() API",
        "Authentication patterns, and where to check them",
        "Middleware: what it can do, what it cannot, and where it runs",
        "Protecting routes properly — and why middleware alone is not enough",
        "Authorisation in layouts, pages and actions",
        "Environment variables, secrets, and the NEXT_PUBLIC boundary",
        "Preventing data leaks across the server/client boundary",
        "CSRF, XSS and the security headers worth setting",
      ],
    }),
    createComingSoonModule({
      id: "next-production",
      slug: "testing-performance-deployment",
      title: "Testing, Performance & Deployment",
      order: 13,
      description:
        "Getting it live and keeping it fast: what to test at which layer, what to measure, and what deployment actually requires.",
      topics: [
        "Testing Server Components, and what that even means",
        "Component tests with Testing Library, end-to-end with Playwright",
        "Testing Server Actions and route handlers",
        "Core Web Vitals, and which Next.js feature moves each one",
        "Bundle analysis, and finding what dragged code to the client",
        "Deploying to Vercel, and deploying anywhere else",
        "Self-hosting: the Node server, standalone output and Docker",
        "Logging, error tracking and observability in production",
      ],
    }),
    createComingSoonModule({
      id: "next-mastery",
      slug: "advanced-and-mastery",
      title: "Advanced Patterns & Interview Mastery",
      order: 14,
      description:
        "The consolidation pass: architecture decisions in a real Next.js codebase, migration realities, and the questions interviews actually ask.",
      topics: [
        "Structuring a large App Router codebase",
        "Monorepos, shared packages and internal component libraries",
        "Internationalisation and localised routing",
        "Migrating from the Pages Router, incrementally",
        "Draft mode, previews, and content management systems",
        "Reading unfamiliar Next.js code and spotting the boundary mistakes",
        "The classic interview questions, answered properly",
        "An architecture walkthrough: from requirements to route layout",
      ],
    }),
  ],
};
