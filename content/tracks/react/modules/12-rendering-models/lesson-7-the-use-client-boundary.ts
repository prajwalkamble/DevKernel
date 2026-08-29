import type { Lesson } from "@/content/types";

export const useClientBoundaryLesson: Lesson = {
  id: "react-use-client-boundary",
  slug: "the-use-client-boundary",
  moduleSlug: "client-and-server-rendering",
  title: "The 'use client' Boundary",
  summary:
    "What the directive actually marks — a boundary, not a file — what may cross it and what React throws about, why children is the escape hatch that makes the model work, and where in the tree to put it.",
  estimatedMinutes: 30,
  objectives: [
    "Say what 'use client' marks and what it does not",
    "Predict which components end up in the bundle",
    "Say which props can cross and why",
    "Use children to keep server content inside a client component",
    "Push the boundary down without breaking the interaction",
  ],
  sections: [
    {
      id: "not-a-file",
      heading: "It marks a boundary, not a file",
      body: [
        "`\"use client\"` at the top of a file means: *this is where the client half of the tree begins.* Everything in this file goes into the browser bundle — and so does everything it imports, and everything rendered inside it, whether or not those files say anything at all.",
        "That is the sentence people get wrong, and it costs whole megabytes. A component with no directive is not \"a Server Component\"; it is a component that runs on **whichever side it was rendered from**. Put it under a client boundary and it is a client component, permanently, with all its imports.",
        "So the mental picture is not a per-file label. It is a line drawn across the tree, with the server above it and the browser below.",
      ],
      pitfalls: [
        {
          title: "One directive at the top of a shared file pulls everything down with it",
          body: "The classic version is a barrel: `components/index.ts` re-exports forty components, one of them needs interactivity, someone adds the directive to the barrel, and all forty are now in the bundle. This is the folder-structure argument from module 3 with a bundle-size consequence attached.",
        },
      ],
    },
    {
      id: "what-crosses",
      heading: "What may cross",
      body: [
        "A Server Component rendering a Client Component writes that element's props into the payload, so the rule is simply: **can this value be written down?**",
        "Strings, numbers, booleans, `null`, `undefined`, plain objects and arrays of those. Dates, Maps, Sets, typed arrays, and promises — React's format handles more than JSON does. And JSX, which is the interesting case in the next section.",
        "Not functions. Not class instances. Not symbols other than registered ones.",
      ],
      examples: [
        {
          id: "the-error",
          title: "What a function prop gets you",
          lang: "bash",
          code: `Error: Event handlers cannot be passed to Client Component props.
  {label: "Likes", onSave: function onSave}
                           ^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.`,
          explanation:
            "That is a real build failure from passing `onSave={() => …}` from a Server Component to a Client one. It is a good error: it names the prop, points at it, and says what to do. And the reason is not a rule React invented — there is genuinely nothing to write into the payload that the browser could turn back into that closure.",
          requires: "a Next.js build (this is its error output, not a program's)",
        },
      ],
      pitfalls: [
        {
          title: "Server Actions are the deliberate exception",
          body: "A function marked `\"use server\"` *can* be passed across, because it is not serialised as a function — it is serialised as an id, and calling it in the browser is an HTTP request to that id. In a real payload it looks like `onSave: \"$he\"` pointing at an entry `{\"id\":\"0032…\",\"bound\":null}`. That is worth knowing precisely, because it explains both why it works and why every Server Action is a public endpoint that must authorise its own caller.",
        },
      ],
    },
    {
      id: "children",
      heading: "The escape hatch that makes the model work",
      body: [
        "The rule about the boundary — everything rendered inside a Client Component is a Client Component — sounds fatal. A layout with a collapsible sidebar would drag the entire page into the browser.",
        "It does not, because of one exception: **JSX passed as a prop is rendered where it was written, not where it is used.**",
        "A Server Component can render a Client Component and hand it server-rendered content as `children`. That content was already turned into payload before it crossed; the client component receives finished output and puts it in a slot. It cannot re-render it, which is precisely why this is safe.",
        "This inverts the usual advice about composition. Module 8 recommended `children` over prop drilling for readability; here it is the difference between shipping a component and not shipping it.",
      ],
      examples: [
        {
          id: "children-slot",
          title: "The same tree, two ways",
          lang: "jsx",
          code: `/* ---- Wrong: Post is rendered *inside* the client component ------------ */
"use client";
export function Collapsible({ postId }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button onClick={() => setOpen(!open)}>Toggle</button>
      {/* Post is now a Client Component. So is everything it imports —
         including the 40kB markdown parser. */}
      {open && <Post id={postId} />}
    </section>
  );
}

/* ---- Right: Post is rendered on the server and passed in -------------- */
"use client";
export function Collapsible({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button onClick={() => setOpen(!open)}>Toggle</button>
      {open && children}
    </section>
  );
}

/* ---- page.jsx, a Server Component ------------------------------------- */
export default async function Page({ id }) {
  return (
    <Collapsible>
      {/* Rendered here, on the server. It arrives at Collapsible as
         finished output — data in the payload, not code in the bundle. */}
      <Post id={id} />
    </Collapsible>
  );
}`,
          explanation:
            "The two `Collapsible`s have identical behaviour and completely different bundles. In the second, `Collapsible` knows nothing about `Post` — it has a slot, and the slot happens to contain something the server made. The interactivity is one `useState` and one button, which is all that needed to be in the browser in the first place.",
          alternates: [
            {
              lang: "tsx",
              code: `/* ---- Wrong: Post is rendered *inside* the client component ------------ */
"use client";
export function Collapsible({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button onClick={() => setOpen(!open)}>Toggle</button>
      {/* Post is now a Client Component. So is everything it imports —
         including the 40kB markdown parser. */}
      {open && <Post id={postId} />}
    </section>
  );
}

/* ---- Right: Post is rendered on the server and passed in -------------- */
"use client";
export function Collapsible({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button onClick={() => setOpen(!open)}>Toggle</button>
      {open && children}
    </section>
  );
}

/* ---- page.tsx, a Server Component ------------------------------------- */
export default async function Page({ id }: { id: string }) {
  return (
    <Collapsible>
      {/* Rendered here, on the server. It arrives at Collapsible as
         finished output — data in the payload, not code in the bundle. */}
      <Post id={id} />
    </Collapsible>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`{open && children}` still sends the content",
          body: "The children were rendered on the server regardless of whether the client decides to display them, so a collapsed section still costs its payload. That is usually the right trade — the content is data, and it is already there when the user opens it — but if it is large and rarely opened, the right shape is a Server Component fetched on demand rather than one rendered up front.",
        },
      ],
    },
    {
      id: "pushing-down",
      heading: "Pushing the boundary down",
      body: [
        "The whole skill is this: find the smallest thing that actually needs to be interactive, and put the directive there.",
        "A common shape is a page where one button needs state. The instinct is to mark the page. The right move is to mark the button.",
        "The three questions that place a boundary correctly: **Does this component use state, an effect, an event handler, or a browser API?** If not, it does not need to be a client component. **Is it rendered inside one?** If so, it already is, whatever you intended. **Can what it renders be passed in as `children` instead?** If so, it does not have to be.",
      ],
      examples: [
        {
          id: "leaf",
          title: "Marking the leaf instead of the page",
          lang: "jsx",
          code: `/* ---- like-button.tsx: the only file with the directive --------------- */
"use client";
import { useState } from "react";

export function LikeButton({ postId, initial }) {
  const [likes, setLikes] = useState(initial);
  return (
    <button onClick={() => { setLikes(likes + 1); like(postId); }}>
      ♥ {likes}
    </button>
  );
}

/* ---- page.tsx: no directive, so all of this runs on the server -------- */
export default async function PostPage({ params }) {
  const post = await db.posts.find(params.id);
  const html = await marked.parse(post.body);   // parser stays on the server

  return (
    <article>
      <h1>{post.title}</h1>
      <Byline author={post.author} />           {/* server */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <LikeButton postId={post.id} initial={post.likes} />   {/* the only client code */}
      <Comments postId={post.id} />             {/* server, awaits its own query */}
    </article>
  );
}`,
          explanation:
            "One directive, in a file that contains one button. Everything else — the query, the markdown parser, the byline, the comments — runs on the server and reaches the browser as data. The interactive part is genuinely small, which is the usual case once you look.",
          alternates: [
            {
              lang: "tsx",
              code: `/* ---- like-button.tsx: the only file with the directive --------------- */
"use client";
import { useState } from "react";

export function LikeButton({ postId, initial }: { postId: string; initial: number }) {
  const [likes, setLikes] = useState(initial);
  return (
    <button onClick={() => { setLikes(likes + 1); like(postId); }}>
      ♥ {likes}
    </button>
  );
}

/* ---- page.tsx: no directive, so all of this runs on the server -------- */
export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await db.posts.find(params.id);
  const html = await marked.parse(post.body);   // parser stays on the server

  return (
    <article>
      <h1>{post.title}</h1>
      <Byline author={post.author} />           {/* server */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <LikeButton postId={post.id} initial={post.likes} />   {/* the only client code */}
      <Comments postId={post.id} />             {/* server, awaits its own query */}
    </article>
  );
}`,
            },
          ],
        },
      ],
    },
    {
      id: "going-the-other-way",
      heading: "Going the other way",
      body: [
        "A Client Component cannot import a Server Component. Not a rule, a consequence: importing it means bundling it, and bundling it means it is not a Server Component any more. The bundler enforces this because the alternative is silently shipping your database code.",
        "So the only route from client back to server is **through a prop** — `children`, or any other JSX prop, rendered by an ancestor that is itself on the server.",
        "The practical consequence is that the tree is server-above, client-below, with server content *slotted into* client components rather than imported by them. That shape takes a while to feel natural, and once it does, most of the confusion about \"can I use X here\" answers itself.",
      ],
      pitfalls: [
        {
          title: "`server-only` and `client-only` are worth installing",
          body: "Import `server-only` at the top of a module that must never reach the browser — a database client, a module reading a secret — and the build fails if a client file ever imports it, rather than shipping the secret. `client-only` does the reverse for a module that touches `window`. Both are three-line packages whose entire job is to turn a silent leak into a build error.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does 'use client' do?",
      answer:
        "It marks where the client half of the tree begins. The file it is in goes into the browser bundle, and so does everything that file imports and everything rendered inside it — whether or not those files say anything themselves. It is a boundary drawn across the tree, not a per-file label, which is why a directive added to a barrel file can pull forty components into the bundle at once.",
    },
    {
      question: "Which props can cross from a Server Component to a Client Component?",
      answer:
        "Whatever can be serialised into the payload: strings, numbers, booleans, null, plain objects and arrays, plus dates, Maps, Sets and promises, which React's format handles beyond JSON. And JSX, which arrives as already-rendered output. Functions and class instances cannot — a build passing an `onClick` fails with \"Event handlers cannot be passed to Client Component props\", because there is nothing to write down that the browser could turn back into that closure.",
    },
    {
      question: "How can a Client Component render server-rendered content?",
      answer:
        "By receiving it as a prop rather than importing it. JSX is rendered where it is written, so a Server Component can render a Client Component and pass server content as `children` — that content became payload before it crossed, and the client component simply places it in a slot without being able to re-render it. This is what stops a collapsible sidebar from dragging the whole page into the bundle.",
    },
    {
      question: "Why can a Client Component not import a Server Component?",
      answer:
        "Because importing it means bundling it, and a bundled component is not a Server Component any more. The bundler enforces it rather than letting you silently ship database code to the browser. The only route back to the server is through a JSX prop rendered by a server ancestor, which is why the tree ends up server-above, client-below, with server content slotted into client components.",
    },
    {
      question: "How do you decide where to put the boundary?",
      answer:
        "As far down as it will go. Ask whether the component actually uses state, an effect, an event handler or a browser API — if not, it does not need to be a client component. Ask whether it is already rendered inside one, because then it already is. And ask whether what it renders could be passed in as `children` instead. In practice the interactive part is usually one button, and that is the file the directive belongs in.",
    },
  ],
  takeaways: [
    "`\"use client\"` marks a boundary: the file, its imports, and everything rendered inside it",
    "A component with no directive runs on whichever side it was rendered from",
    "One directive on a barrel file pulls every re-export into the bundle",
    "Props must be serialisable — functions and class instances fail the build",
    "A Server Action crosses as an id, not a function, which is why it is a public endpoint",
    "JSX passed as a prop is rendered where it was written, so `children` keeps content on the server",
    "`{open && children}` still ships the payload, whether or not it is shown",
    "A Client Component cannot import a Server Component — only receive one as a prop",
    "`server-only` and `client-only` turn a silent leak into a build error",
  ],
  status: "available",
};
