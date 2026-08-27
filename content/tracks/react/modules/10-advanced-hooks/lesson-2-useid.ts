import type { Lesson } from "@/content/types";

export const useIdLesson: Lesson = {
  id: "react-useid",
  slug: "useid",
  moduleSlug: "advanced-and-custom-hooks",
  title: "useId, and Ids That Survive Hydration",
  summary:
    "A hook that exists for one reason: a counter or a random string produces a different id on the server and on the client, and hydration breaks. Shown by rendering on both sides and comparing.",
  estimatedMinutes: 20,
  objectives: [
    "Say why a counter or Math.random cannot be used for an id",
    "Generate an id that matches across server and client",
    "Derive several related ids from one useId call",
    "Say what useId must not be used for",
    "Recognise when you do not need an id at all",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The problem",
      body: [
        "Accessible markup needs ids. `<label htmlFor>` pointing at an input, `aria-describedby` pointing at a hint, `aria-labelledby` pointing at a heading — all of them are id references, and a reusable component cannot take a hard-coded one because it might be rendered twice on a page.",
        "The obvious answers both fail, and they fail in the same place.",
        "**A module counter** — `let next = 0; const id = \\`field-\\${next++}\\``. Fine in a browser. On a server the module is shared between requests, so the counter continues from wherever the last request left it, and the number the client generates from zero does not match.",
        "**`Math.random()` or `crypto.randomUUID()`.** Different value on the server and on the client, by definition.",
        "Either way the server's HTML says `for=\"field-7\"` and the client's render says `for=\"field-0\"`, which is a hydration mismatch — React 19 reports it, and the label may stop being connected to its input.",
      ],
    },
    {
      id: "the-answer",
      heading: "The answer",
      body: [
        "`useId()` returns a string derived from the component's **position in the tree**. Position is the one thing the server and the client agree on, because both are rendering the same tree.",
        "Render on both sides and compare.",
      ],
      examples: [
        {
          id: "ids-across-hydration",
          title: "Server HTML, then hydration",
          lang: "tsx",
          code: `import { useId, act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

function Field({ label }: { label: string }) {
  const id = useId();
  return (
    <p>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </p>
  );
}

/* One useId, several related elements: derive the rest rather than calling
   the hook again. */
function Fieldset() {
  const id = useId();
  return (
    <fieldset aria-describedby={\`\${id}-hint\`}>
      <label htmlFor={\`\${id}-name\`}>Name</label>
      <input id={\`\${id}-name\`} aria-describedby={\`\${id}-hint\`} />
      <small id={\`\${id}-hint\`}>As it appears on your card</small>
    </fieldset>
  );
}

function Form() {
  return <form><Field label="Email" /><Field label="Postcode" /><Fieldset /></form>;
}

const server = renderToStaticMarkup(<Form />);
console.log("server-rendered HTML:");
console.log(server.replace(/></g, ">\\n<"));

/* Hydration: the client attaches to the server's HTML rather than
   re-rendering it, and useId is what makes the ids line up. */
const container = document.createElement("div");
container.innerHTML = server;
document.body.appendChild(container);
act(() => { hydrateRoot(container, <Form />); });
const ids = (html: string) => [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
console.log("\\nids in the server HTML:  ", ids(server).join(" "));
console.log("ids after hydrating:     ", ids(container.innerHTML).join(" "));
console.log("identical:", String(ids(server).join() === ids(container.innerHTML).join()));`,
          output: `server-rendered HTML:
<form>
<p>
<label for="_R_1_">Email</label>
<input id="_R_1_"/>
</p>
<p>
<label for="_R_2_">Postcode</label>
<input id="_R_2_"/>
</p>
<fieldset aria-describedby="_R_3_-hint">
<label for="_R_3_-name">Name</label>
<input id="_R_3_-name" aria-describedby="_R_3_-hint"/>
<small id="_R_3_-hint">As it appears on your card</small>
</fieldset>
</form>

ids in the server HTML:   _R_1_ _R_2_ _R_3_-name _R_3_-hint
ids after hydrating:      _R_1_ _R_2_ _R_3_-name _R_3_-hint
identical: true`,
          explanation:
            "Identical, and the format tells you why. `_R_1_` is a compact encoding of a tree position, not a counter — which is what lets a server rendering a hundred concurrent requests and a browser rendering one produce the same string. The surrounding underscores exist so the id is a valid CSS selector, since ids beginning with a digit are not.",
        },
      ],
      pitfalls: [
        {
          title: "One call, several ids — never several calls",
          body: "`Fieldset` above calls `useId` once and appends suffixes. Three separate calls would work too and would waste three slots and three ids for one logical group. The suffix version also documents the relationship: `_R_3_-hint` obviously belongs with `_R_3_-name`.",
        },
      ],
    },
    {
      id: "not-for",
      heading: "What it is not for",
      body: [
        "**Not for list keys.** A key must identify a *row of data* across renders; `useId` identifies a *position in the tree*, which is exactly the thing module 6 spent a lesson explaining is not identity. It also cannot be called in a loop.",
        "**Not for a database id, a request id or a correlation id.** It is unique within one rendered tree and means nothing outside it.",
        "**Not as a CSS class or a test selector.** The format is not part of React's public contract and has changed between versions — this output is React 19's. Use a stable class or `data-testid`.",
        "**Not when you already have an id.** Rendering a known user? `htmlFor={`email-${user.id}`}` is clearer and needs no hook.",
      ],
      pitfalls: [
        {
          title: "The best fix is often no id at all",
          body: "Wrapping the input in its label — `<label>Email <input /></label>` — associates them with no id, no hook and no hydration question. The `htmlFor` form is for when the markup or the styling will not allow nesting. Reach for `useId` when you actually need the reference, which is less often than it first appears.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What problem does useId solve?",
      answer:
        "Generating an id for accessibility attributes that matches between the server-rendered HTML and the client's first render. A module counter continues across requests on a shared server process and restarts at zero in the browser; `Math.random` differs by definition. Either produces a hydration mismatch, and a label that is no longer connected to its input. `useId` derives the string from the component's position in the tree, which is the one thing both sides agree on.",
    },
    {
      question: "How do you give several elements related ids?",
      answer:
        "Call `useId` once and append suffixes — `${id}-name`, `${id}-hint`. Calling it several times works and wastes a hook slot and an id per element, and it loses the visible relationship between them: `_R_3_-hint` obviously belongs with `_R_3_-name`, while two unrelated ids do not.",
    },
    {
      question: "Can useId be used as a list key?",
      answer:
        "No. A key must identify a row of data across renders; `useId` identifies a position in the tree, which is precisely what an index key does wrong. It also cannot be called in a loop, since hooks must be called unconditionally and in a fixed order. Keys come from the data.",
    },
  ],
  takeaways: [
    "A counter continues across requests on the server and restarts in the browser — the ids diverge",
    "`useId` derives from tree position, which server and client both agree on",
    "The `_R_1_` format is a position encoding, and the underscores make it a valid CSS selector",
    "One call plus suffixes for a group of related ids, never one call per element",
    "Never for keys, database ids, CSS classes or test selectors — the format is not a contract",
    "If you already have a real id, use it",
    "Nesting the input inside the label needs no id at all",
  ],
  status: "available",
};
