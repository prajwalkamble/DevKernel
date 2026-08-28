/**
 * Where the rendering happens: client, server, hydration, Server Components.
 *
 * Two kinds of generator live here, and they are honest in two different ways.
 *
 * The tree ones — hydration, the mismatch, the client boundary — walk *real*
 * element trees and run the real rule: match by position and type, adopt the
 * DOM node when they agree, throw the subtree away when they do not. Change the
 * trees and the outcome changes, which is the property that stops a picture
 * drifting from the prose beside it.
 *
 * The timeline ones are a *model*, and say so. Nobody can measure a network
 * from inside a lesson page, so `COSTS` below is a set of stated assumptions and
 * every milestone in the animation is arithmetic over them — not a measurement,
 * and not a remembered number either. The ordering the animation shows is
 * therefore a consequence of those inputs: raise the server's think time above
 * the browser's fetch and server rendering stops winning, on screen, with no
 * caption to correct.
 */
import type { ReactNode } from "react";
import { layout, read, type ElNode } from "./react";
import {
  Recorder,
  type Role,
  type SequenceFrame,
  type TreeFrame,
  type Visualisation,
} from "./types";

/* --------------------------------------------------------- 1. the timelines -- */

/**
 * The stated assumptions. Every number in the three timelines comes from here.
 *
 * These are ordinary numbers for a mid-range phone on a decent connection, and
 * they are inputs rather than findings: the lesson's claim is about the *shape*
 * of the three curves, which holds across any plausible set of them.
 */
const COSTS = {
  /** One network round trip. */
  latency: 50,
  /** The server's own work: query the database, render to HTML. */
  serverWork: 120,
  /** Downloading a document. An empty shell is small; a filled one is not. */
  emptyHtml: 5,
  fullHtml: 25,
  /** The JavaScript bundle: download, then parse and execute. */
  jsTransfer: 120,
  jsExecute: 90,
  /** Fetching the page's data from the browser, once the bundle is running. */
  browserFetch: 150,
  /** Attaching React to server-rendered HTML. */
  hydrate: 60,
};

type Strategy = "csr" | "ssr" | "ssg";

interface Milestone {
  id: string;
  label: string;
  at: number;
  /** What the user can see and do from this moment on. */
  screen: string;
  note: string;
}

/** Runs the model for one strategy and returns its milestones, in time order. */
function timelineFor(strategy: Strategy): Milestone[] {
  const c = COSTS;
  const out: Milestone[] = [];
  const add = (id: string, label: string, at: number, screen: string, note: string) =>
    out.push({ id, label, at: Math.round(at), screen, note });

  if (strategy === "csr") {
    const html = c.latency + c.emptyHtml;
    add("html", "HTML", html, "blank", "The document arrives almost immediately — because it is almost empty. <div id=\"root\"></div> and a script tag.");
    add("blank", "paint", html + 5, "blank", "The browser paints. There is nothing to paint: a white screen, and the user has no idea whether anything is happening.");
    const js = html + c.latency + c.jsTransfer;
    add("js", "bundle", js, "blank", "The bundle finishes downloading. Still white.");
    const ready = js + c.jsExecute;
    add("exec", "execute", ready, "shell", "React starts, renders the shell, and only now can it know that it needs data — because the code that asks for it is in the bundle that just arrived.");
    const data = ready + c.latency + c.browserFetch;
    add("data", "data", data, "content", "The data arrives, React renders it, and the page finally has content. Everything after the first line waited on a chain of round trips that the server could have collapsed.");
    return out;
  }

  if (strategy === "ssr") {
    const ttfb = c.latency + c.serverWork;
    add("think", "server", ttfb, "blank", "The server queries and renders first, so the browser has been waiting. Time to first byte is worse than client rendering's — this is the trade.");
    const html = ttfb + c.fullHtml;
    add("html", "HTML", html, "content", "The HTML arrives with the content already in it, and the browser paints it. The user is reading the page.");
    const js = html + c.jsTransfer;
    add("js", "bundle", js, "content (dead)", "The bundle downloads in the background. The page looks finished and is not: buttons do nothing, because no handler is attached yet.");
    const ready = js + c.jsExecute + c.hydrate;
    add("hydrate", "hydrate", ready, "interactive", "React walks the server's DOM, adopts it, and attaches the handlers. Now the page does what it looks like it does.");
    return out;
  }

  /* Static generation: the same HTML as SSR, but built earlier, so the request
     costs a CDN round trip and nothing else. */
  const html = c.latency + c.fullHtml;
  add("html", "HTML", html, "content", "The document was rendered at build time and is sitting on a CDN. No query, no render, no origin server — just a file, and it already has the content in it.");
  add("paint", "paint", html + 5, "content", "The browser paints real content, at the cost of one round trip. This is the fastest first paint any of the three can produce.");
  const js = html + c.jsTransfer;
  add("js", "bundle", js, "content (dead)", "The bundle downloads. As with server rendering, the page is readable before it is usable.");
  const ready = js + c.jsExecute + c.hydrate;
  add("hydrate", "hydrate", ready, "interactive", "Hydration finishes. Identical to the server-rendered case from here on — the only difference between them was who ran the render, and when.");
  return out;
}

const STRATEGY_SUMMARY: Record<Strategy, string> = {
  csr: "Client rendering ships an empty document and a bundle. First byte is fast and useless: the user looks at white until the JavaScript has downloaded, executed, discovered it needs data, and fetched it — four sequential steps, each with its own round trip. Nothing renders on a server, which means no server, and that simplicity is a real advantage for an app behind a login where nobody is waiting on a first paint.",
  ssr: "Server rendering moves the query and the render to the server, so the HTML arrives with content in it and the first paint is real. You pay for it at the front — time to first byte now includes the server's work — and at the back, in the window where the page is readable but dead, because the handlers only exist once the bundle has hydrated. Streaming shrinks the first cost; shrinking the bundle is the only thing that shrinks the second.",
  ssg: "Static generation is server rendering done in advance. The render already happened at build time, so a request costs one CDN round trip and no server work at all — the fastest first paint of the three, and the cheapest to run. The constraint is the obvious one: the HTML is the same for everybody until hydration, so anything per-user has to arrive after it, or be a different strategy.",
};

function timelineRun(strategy: Strategy): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const milestones = timelineFor(strategy);
  const done = new Set<string>();

  const emit = (note: string, active: string | null, screen: string) =>
    rec.push({
      kind: "sequence",
      items: milestones.map((m) => ({
        id: m.id,
        label: m.label,
        role: m.id === active ? "active" : done.has(m.id) ? "mounted" : "suspended",
      })),
      pins: Object.fromEntries(milestones.map((m, i) => [i, `${m.at}ms`])),
      note: `screen: ${screen} — ${note}`,
    });

  emit("The user asks for the page. Nothing has happened yet.", null, "blank");

  for (const milestone of milestones) {
    done.add(milestone.id);
    rec.bump("round trips", milestone.id === "html" || milestone.id === "data" ? 1 : 0);
    emit(`${milestone.at}ms — ${milestone.note}`, milestone.id, milestone.screen);
  }

  const last = milestones[milestones.length - 1];
  const first = milestones.find((m) => m.screen !== "blank");
  emit(
    `Something to read at ${first ? first.at : last.at}ms, fully interactive at ${last.at}ms. Those are the two numbers a rendering strategy is chosen on.`,
    null,
    last.screen
  );

  return { frames: rec.frames, summary: STRATEGY_SUMMARY[strategy] };
}

/* ------------------------------------------------------------ 2. hydration -- */

function Title() { return null; }
Title.displayName = "h1";
function Body() { return null; }
Body.displayName = "p";
function Like() { return null; }
Like.displayName = "button";
function Card({ children }: { children?: ReactNode }) { return children; }
Card.displayName = "article";

const SERVER_HTML = (
  <Card>
    <Title />
    <Body />
    <Like />
  </Card>
);

/**
 * Hydration as the walk it is: the same tree, compared position by position.
 *
 * `hydrate` runs the actual rule — same position, same type, adopt the existing
 * node; anything else, throw the subtree away and build it again. The two runs
 * differ only in the client tree they are handed, so the mismatch outcome is
 * the comparison's result rather than a second drawing.
 */
function hydrateRun(mismatch: boolean): Visualisation {
  const rec = new Recorder<TreeFrame>();
  const server = read(SERVER_HTML, "srv")!;
  /* The client renders the same component. In the mismatch run, one leaf comes
     out as a different element — the shape a `typeof window` branch or a
     locale-dependent date takes by the time it reaches the renderer. */
  const CLIENT_TREE = mismatch ? (
    <Card>
      <Title />
      <Like />
      <Body />
    </Card>
  ) : SERVER_HTML;
  const client = read(CLIENT_TREE, "cli")!;

  const roles = new Map<string, Role>();
  const badges = new Map<string, string>();
  const emit = (note: string) =>
    rec.push({ kind: "tree", nodes: layout(server, roles, badges), note });

  emit("The DOM the server sent, already painted and already readable. React has not touched it yet.");

  let broke = false;
  const walk = (s: ElNode, c: ElNode | undefined): boolean => {
    if (!c || c.label !== s.label) {
      rec.bump("mismatched");
      roles.set(s.id, "unmounted");
      badges.set(s.label, "server ≠ client");
      emit(`Position mismatch: the server put <${s.label}> here and this render produced <${c ? c.label : "nothing"}>. React cannot adopt a node of the wrong type.`);
      return false;
    }
    rec.bump("adopted");
    roles.set(s.id, "mounted");
    emit(`<${s.label}> matches. React keeps the existing DOM node — no element is created, nothing is inserted — and attaches this position's props and handlers to it.`);
    for (let i = 0; i < Math.max(s.children.length, c.children.length); i++) {
      if (!walk(s.children[i], c.children[i])) return false;
    }
    return true;
  };

  broke = !walk(server, client);

  if (!broke) {
    emit("Every node matched, so hydration is finished. Not one DOM node was created: the same elements the server sent are now driven by React, which is why hydration is cheaper than rendering and why it is not free.");
    return {
      frames: rec.frames,
      summary:
        "Hydration is not a second render into the page — it is a walk over HTML that already exists, adopting each node whose type and position match what this render produced and attaching the event handlers React never sent over the wire. That is why a server-rendered page is readable before it is clickable: the markup arrives in the response, the behaviour arrives in the bundle.",
    };
  }

  /* React 19 does not patch a mismatch; it re-renders the whole tree on the
     client, which is what makes a mismatch expensive rather than cosmetic. */
  for (const node of layout(server, roles, badges)) roles.set(node.id, "unmounted");
  emit("React does not patch the difference. It gives up on the server's HTML for this root and re-renders the whole tree on the client.");
  for (const node of layout(server, roles, badges)) roles.set(node.id, "mounted");
  emit("Every node is thrown away and built again — so the work the server did was wasted, the paint the user already saw is replaced, and any DOM state in the discarded nodes (focus, scroll, a video's position) goes with it. In the console this is one warning; on the screen it is a flash.");

  return {
    frames: rec.frames,
    summary:
      "A hydration mismatch is React finding a different element at a position than the server put there. It does not reconcile the difference — it discards the server's HTML for that root and re-renders on the client, so you pay for the server render, the client render, and a visible flash between them. The causes are always the same short list: branching on `typeof window`, `Date` or `Math.random` during render, locale-dependent formatting, reading `localStorage` while rendering, and invalid nesting the HTML parser silently rearranged before React ever looked.",
  };
}

/* ------------------------------------------------- 3. the client boundary -- */

function Layout({ children }: { children?: ReactNode }) { return children; }
Layout.displayName = "Layout";
function PostList({ children }: { children?: ReactNode }) { return children; }
PostList.displayName = "Posts";
function MarkdownBody() { return null; }
MarkdownBody.displayName = "Markdn";
function LikeButton({ children }: { children?: ReactNode }) { return children; }
LikeButton.displayName = "Like";
function CommentBox() { return null; }
CommentBox.displayName = "Comment";
function Avatar() { return null; }
Avatar.displayName = "Avatar";

const RSC_TREE = (
  <Layout>
    <PostList>
      <MarkdownBody />
      <LikeButton>
        <Avatar />
      </LikeButton>
    </PostList>
    <CommentBox />
  </Layout>
);

/** The components whose file starts with "use client". Everything else is a
 *  Server Component by default — which is the part that surprises people. */
const CLIENT_ENTRY = new Set(["Like", "Comment"]);

/** How much JavaScript each component would add to the browser bundle, in kB. */
const WEIGHT: Record<string, number> = {
  Layout: 2, Posts: 3, Markdn: 42, Like: 2, Comment: 6, Avatar: 1,
};

/**
 * Which components ship, computed by the rule rather than listed.
 *
 * The rule is: a component is in the client bundle if it is a client entry
 * point or if it is *inside* one. So `Avatar` — an ordinary component that says
 * nothing about where it runs — is in the bundle purely because of where it was
 * placed, and the total below is a sum over the walk, not a number typed in.
 */
function rscRun(): Visualisation {
  const rec = new Recorder<TreeFrame>();
  const root = read(RSC_TREE, "rsc")!;
  const roles = new Map<string, Role>();
  const badges = new Map<string, string>(
    Object.entries(WEIGHT).map(([name, kb]) => [name, `${kb}kB`])
  );

  const emit = (note: string) =>
    rec.push({ kind: "tree", nodes: layout(root, roles, badges), note });

  emit("A page's component tree. Nothing here says where anything runs — and that is the point: in the Server Components model, the default is the server.");

  let shipped = 0;
  const walk = (node: ElNode, insideClient: boolean) => {
    const isEntry = CLIENT_ENTRY.has(node.label);
    const onClient = insideClient || isEntry;
    if (onClient) {
      shipped += WEIGHT[node.label] ?? 0;
      rec.bump("kB shipped", WEIGHT[node.label] ?? 0);
      roles.set(node.id, "client");
      emit(
        isEntry
          ? `${node.label} has "use client" at the top of its file. It is a client entry point: its code goes into the browser bundle, +${WEIGHT[node.label]}kB.`
          : `${node.label} says nothing about where it runs — but it is inside a client component, so it is on the client too. This is the rule people miss: "use client" marks a boundary, not a single file.`
      );
    } else {
      rec.bump("kB kept on the server", WEIGHT[node.label] ?? 0);
      roles.set(node.id, "server");
      emit(
        node.label === "Markdn"
          ? `${node.label} runs on the server. Its ${WEIGHT[node.label]}kB markdown parser runs there too — and never reaches the browser at all. Only the HTML it produced does.`
          : `${node.label} runs on the server. It can await a query directly; its code is not in the bundle.`
      );
    }
    for (const child of node.children) walk(child, onClient);
  };

  walk(root, false);

  const total = Object.values(WEIGHT).reduce((a, b) => a + b, 0);
  emit(`${shipped}kB of ${total}kB reaches the browser. The saving is not a compression trick — the other ${total - shipped}kB is code that ran somewhere else and sent its result.`);

  return {
    frames: rec.frames,
    summary:
      "In the Server Components model every component runs on the server unless something puts it on the client, and \"use client\" is what does: it marks a boundary, so the file it is in and everything rendered inside it end up in the browser bundle. Server Components can await data directly and never ship their dependencies; they cannot use state, effects or event handlers, because none of those mean anything on a server that has already sent its response. The interesting design work is pushing that boundary as far down the tree as it will go.",
  };
}

/* ------------------------------------- 4. what may cross the boundary -- */

/**
 * The serialisation check, run against real values.
 *
 * Whether a prop can cross from a Server Component into a Client one is decided
 * by whether it can be serialised — so this actually tries, with the same
 * question React asks, rather than listing what is allowed. A function fails
 * because functions have no serialised form, not because a table says so.
 */
interface Prop {
  name: string;
  value: unknown;
  display: string;
}

function crossingRun(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const props: Prop[] = [
    { name: "title", value: "Hello", display: '"Hello"' },
    { name: "count", value: 42, display: "42" },
    { name: "post", value: { id: 1, tags: ["a"] }, display: "{ id, tags }" },
    { name: "date", value: new Date(0), display: "new Date()" },
    { name: "onSave", value: () => {}, display: "() => {}" },
    { name: "children", value: "<Server/>", display: "<Server/>" },
  ];

  /* React's rule for a serialisable prop, applied. Dates, maps, sets and
     promises are handled by React's own format on top of JSON, which is why the
     check is not simply `JSON.stringify` — but a function is a function under
     either. */
  const crosses = (value: unknown): boolean => {
    if (typeof value === "function") return false;
    if (typeof value === "symbol") return false;
    if (value instanceof Date) return true;
    if (value === null || typeof value !== "object") return true;
    return Object.values(value as Record<string, unknown>).every(crosses);
  };

  const results = new Map<string, boolean>();
  const emit = (note: string, active: number | null) =>
    rec.push({
      kind: "sequence",
      items: props.map((prop, i) => ({
        id: prop.name,
        label: prop.name,
        role: i === active ? "active"
          : results.has(prop.name) ? (results.get(prop.name) ? "mounted" : "unmounted")
            : undefined,
      })),
      pins: Object.fromEntries(props.map((prop, i) => [i, prop.display])),
      note,
    });

  emit("A Server Component rendering a Client Component, with six props. Each one has to survive being written into the response and read back in the browser.", null);

  props.forEach((prop, i) => {
    const ok = crosses(prop.value);
    results.set(prop.name, ok);
    rec.bump(ok ? "crossed" : "rejected");
    emit(
      ok
        ? prop.name === "children"
          ? `${prop.name} crosses — and this is the useful one. A Server Component passed as children is rendered on the server and arrives as output, so a Client Component can wrap server-rendered content without becoming able to run it.`
          : `${prop.name} crosses: it has a serialised form, so it is written into the payload and read back in the browser.`
        : `${prop.name} does not. A function has no serialised form — there is nothing to write down that the browser could turn back into this closure — so React throws at render time rather than shipping something broken.`,
      i
    );
  });

  emit("The boundary is a network hop wearing the clothes of a prop. Everything that crosses it is data; anything that is behaviour has to already be on the side that needs it.", null);

  return {
    frames: rec.frames,
    summary:
      "Props from a Server Component to a Client Component are serialised into the response, so the rule is simply what can be written down: strings, numbers, booleans, null, plain objects and arrays of those, dates, maps, sets, promises — and JSX, which arrives as already-rendered output. Functions and class instances cannot cross, which is why an onClick has to be defined in the client file rather than passed into it. Server Actions are the deliberate exception: a function reference React knows how to turn into an endpoint.",
  };
}

/* --------------------------------------------------------------- registry -- */

export const REACT_SERVER_ALGOS = {
  "csr-timeline": { label: "Client rendering, end to end", run: () => timelineRun("csr") },
  "ssr-timeline": { label: "Server rendering, end to end", run: () => timelineRun("ssr") },
  "ssg-timeline": { label: "Static generation, end to end", run: () => timelineRun("ssg") },
  hydration: { label: "Hydration: adopting the server's DOM", run: () => hydrateRun(false) },
  "hydration-mismatch": { label: "Hydration: a mismatch", run: () => hydrateRun(true) },
  "server-components": { label: "What ships to the browser", run: rscRun },
  "client-boundary": { label: "What may cross the boundary", run: crossingRun },
} as const;

export type ReactServerAlgoName = keyof typeof REACT_SERVER_ALGOS;
