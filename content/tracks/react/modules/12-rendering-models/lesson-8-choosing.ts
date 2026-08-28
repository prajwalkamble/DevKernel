import type { Lesson } from "@/content/types";

export const choosingARenderingStrategyLesson: Lesson = {
  id: "react-choosing-a-rendering-strategy",
  slug: "choosing-a-strategy",
  moduleSlug: "client-and-server-rendering",
  title: "Choosing a Strategy, Per Screen",
  summary:
    "Putting the whole module together: the four strategies side by side, the questions that pick between them, why the choice is per route rather than per app, and the honest case for not adopting any of this.",
  estimatedMinutes: 26,
  objectives: [
    "Compare the four strategies on the axes that matter",
    "Choose a strategy from a screen's requirements",
    "Mix strategies within one application",
    "Say when a client-only app is the right answer",
    "Avoid the two failure modes at each extreme",
  ],
  sections: [
    {
      id: "four",
      heading: "The four, in one table",
      visual: {
        id: "strategy-timelines-visual",
        kind: "react-server",
        algorithm: "csr-timeline",
        title: "The four strategies, side by side",
      },
      body: [
        "Everything in this module is one of four answers to *who renders the HTML, and when*.",
      ],
      examples: [
        {
          id: "the-table",
          title: "The comparison",
          lang: "bash",
          code: `                     CSR            SSR            SSG            RSC
render happens       browser        server,        build          server,
                                    per request                   per request

first paint shows    nothing        content        content        content
needs a server       no             yes            no             yes
per-user content     yes            yes            not directly   yes
always fresh         yes            yes            no             yes
JS bundle            everything     everything     everything     client parts only
scales by            CDN            compute        CDN            compute
indexed well         poorly         yes            yes            yes`,
          explanation:
            "Read the bundle row against the others. CSR, SSR and SSG differ only in *when the HTML is made* — the JavaScript that reaches the browser is identical in all three. RSC is the only column that changes that, which is why it is a different kind of thing rather than a fourth point on the same scale.",
        },
      ],
    },
    {
      id: "questions",
      heading: "The questions, in order",
      body: [
        "**1. Does a stranger ever see this screen?** If it is behind a login, indexing and link previews do not apply, and the first-paint argument is much weaker — the user signs in once and stays. This alone settles most internal tools in favour of client rendering.",
        "**2. Can two visitors at the same moment be sent identical HTML?** If yes, static. A marketing page, a blog post, a docs page, a product listing — all static, even the ones whose data changes hourly, because *hourly* is what revalidation is for.",
        "**3. Is the content per-user or per-request?** A dashboard, a cart, a personalised feed. That is server rendering, or client rendering if nobody is waiting on the first paint.",
        "**4. Is the screen a document or an application?** An editor, a canvas, a map, a game. There is no useful HTML for a server to have produced, so render on the client and spend the effort on the loading experience instead.",
        "**5. How much JavaScript does the screen actually need?** If the answer is *a lot less than it currently ships*, and question 1 said strangers do see it, Server Components are worth the infrastructure. If your app is a login page and a dashboard, they are not.",
      ],
    },
    {
      id: "per-route",
      heading: "It is a per-route decision",
      body: [
        "The most useful thing in this module: **you do not have to pick one.** Every modern framework lets a single application answer differently per route, and a well-configured app usually does.",
        "A typical shape:",
        "`/` and `/pricing` and `/blog/*` — static. Identical for everyone, indexed, cached at the edge.",
        "`/product/[id]` — static with revalidation. Fast, cached, and stale by at most a few minutes.",
        "`/dashboard` — server-rendered, or client-rendered behind the login.",
        "`/editor` — client-rendered. There is nothing to pre-render.",
        "`/api/*` — not React at all.",
        "The mistake is choosing a strategy for the app and then fighting it on the routes where it does not fit — statically generating a dashboard and papering over it with client fetches, or server-rendering a marketing page that has not changed in six months.",
      ],
    },
    {
      id: "not-adopting",
      heading: "The case for not adopting any of this",
      body: [
        "It deserves stating plainly, because the ecosystem's enthusiasm can make client rendering feel like a mistake, and for a great many applications it is the correct engineering choice.",
        "**A server is a system you now operate.** Deploys, regions, cold starts, memory limits, a bill that scales with traffic, and a new class of incident — a render that throws on the server is a 500 rather than a broken component. Against that, a `dist/` folder on a CDN has no runtime at all.",
        "**The complexity is real and it is permanent.** Two execution environments, a boundary to reason about, a serialisation rule for props, and a set of libraries that do or do not work on the server. Every person who joins the team pays that cost.",
        "**The benefit is concentrated in one place** — public, content-shaped, first-visit-heavy pages on slow devices. If your users are signed in for six hours a day on a work laptop, you are buying an expensive answer to a question they never ask.",
        "The honest rule: adopt server rendering when you can name the screens it is for and the number it improves. \"It is the modern way\" is not a requirement.",
      ],
    },
    {
      id: "failure-modes",
      heading: "The two failure modes",
      body: [
        "**At the client end: a public page that ships an empty div.** A landing page, a docs site or a blog rendered entirely in the browser. It is slow on exactly the devices its visitors use, and it is invisible to every crawler except one. This is the case where a static build is not an upgrade, it is a fix.",
        "**At the server end: a `\"use client\"` at the top of every file.** An app on the App Router where somebody hit a `useState` error, added the directive, and moved on — until the whole tree is client-side. You are now paying for a server render, hydration, *and* the full bundle, and getting the benefit of none of it. The bundle-size row in that table is unchanged from CSR, and you have added a server.",
        "Both come from treating this as a framework choice rather than a per-screen one. The screens are what have requirements; the framework only has defaults.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you choose a rendering strategy?",
      answer:
        "Per screen, from its requirements. Does a stranger ever see it — if not, indexing and first-paint arguments mostly evaporate. Can two visitors at the same moment get identical HTML — if so it is static, even if the data changes hourly, because that is what revalidation is for. Is it per-user, which means server or client rendering. Is it a document or an application, because there is no useful HTML to pre-render for an editor or a map.",
    },
    {
      question: "Do you have to choose one strategy for the whole app?",
      answer:
        "No, and a well-configured app does not. Marketing and blog routes static, product pages static with revalidation, the dashboard server-rendered, the editor client-rendered. The common mistake is picking one for the app and then fighting it on the routes it does not suit — statically generating a dashboard and papering over it with client fetches, or server-rendering a page that has not changed in six months.",
    },
    {
      question: "When is a client-only React app the right answer?",
      answer:
        "When nothing indexes you and the first screen is an application rather than a document — internal tools, admin panels, editors, anything distributed as a static file. It also buys a real operational advantage: a folder on a CDN has no runtime, no scaling, no cold starts and no server incidents. Server rendering asks you to take all of that on, and the benefit is concentrated on public, content-shaped, first-visit-heavy pages.",
    },
    {
      question: "What goes wrong when people adopt Server Components badly?",
      answer:
        "A `\"use client\"` at the top of nearly every file, usually added one at a time in response to a `useState` error. The tree ends up entirely on the client, so you pay for a server render, for hydration, and for the full bundle, while getting the bundle-size benefit of none of it — the same JavaScript as a client-rendered app, plus a server. The fix is to push the boundary down to the components that genuinely need interactivity.",
    },
  ],
  takeaways: [
    "CSR, SSR and SSG differ only in when the HTML is produced — the bundle is identical",
    "Server Components are the only one of the four that changes what ships",
    "Behind a login, most of the argument for server rendering disappears",
    "Identical HTML for two simultaneous visitors means static, however often the data changes",
    "The choice is per route, and a healthy app uses three of the four",
    "A public page that ships an empty div is the failure mode at one end",
    "`\"use client\"` on every file is the failure mode at the other — all the cost, none of the benefit",
    "A server is a system you operate; a `dist/` folder is not",
    "Adopt server rendering when you can name the screens and the number it improves",
  ],
  status: "available",
};
