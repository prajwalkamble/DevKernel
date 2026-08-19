import type { Lesson } from "@/content/types";

export const selectingManipulatingLesson: Lesson = {
  id: "dom-selecting-manipulating",
  slug: "selecting-and-manipulating",
  moduleSlug: "dom-browser",
  title: "Selecting & Manipulating DOM Nodes",
  summary:
    "Finding elements, changing them safely, and the three distinctions that cause most DOM bugs: textContent against innerHTML, attributes against properties, and live collections against static ones.",
  estimatedMinutes: 35,
  objectives: [
    "Select elements with querySelector and querySelectorAll, and know what each returns",
    "Explain why a NodeList is not an array and how to treat it as one",
    "Choose correctly between textContent, innerText and innerHTML",
    "Distinguish an HTML attribute from a DOM property",
    "Create, insert, move and remove nodes",
    "Know when a collection is live and why that matters in a loop",
  ],
  sections: [
    {
      id: "selecting",
      heading: "Finding elements",
      body: [
        "There are two families of selector method, and in modern code you almost always want the first.",
        "**`querySelector` and `querySelectorAll`** take any CSS selector. `querySelector` returns the first match or `null`; `querySelectorAll` returns a **static** `NodeList` of every match, empty if there are none. These two cover essentially everything.",
        "**`getElementById`, `getElementsByClassName` and `getElementsByTagName`** are the older family. `getElementById` is still worth using — it is the fastest lookup there is and its intent is unmistakable. The other two return **live** collections, which is a genuine trap and gets its own section below.",
        "Both families exist on any element, not just `document`. `container.querySelector(\".item\")` searches only inside `container`, which is how you avoid accidentally grabbing a matching element from somewhere else on the page.",
      ],
      examples: [
        {
          id: "selecting-basics",
          title: "Selecting, and what comes back",
          js: `// First match, or null.
const first = document.querySelector(".item");
console.log(first.textContent);

// Every match, as a static NodeList.
const all = document.querySelectorAll(".item");
console.log(all.length);

// A NodeList is not an array.
console.log(Array.isArray(all));
console.log(typeof all.map);       // no map, no filter, no reduce
console.log(typeof all.forEach);   // but forEach does exist

// Convert when you need real array methods.
const texts = [...all].map((el) => el.textContent);
const done = Array.from(all).filter((el) => el.classList.contains("done"));`,
          output: `One
2
false
undefined
function`,
          explanation:
            "`forEach` exists on a `NodeList` but nothing else does, which is exactly confusing enough to catch people. Spread it or use `Array.from` and you have a real array. Note that `querySelector` returning `null` is the single most common source of \"Cannot read properties of null\" — the element was not in the DOM yet, or the selector had a typo.",
        },
      ],
      pitfalls: [
        {
          title: "The script ran before the element existed",
          body: "A `<script>` in the `<head>`, or anywhere above the markup it queries, runs before that markup is parsed — so `querySelector` returns `null`. Put the script at the end of `<body>`, or give it the `defer` attribute, which delays execution until the document has been parsed. `type=\"module\"` scripts are deferred automatically.",
        },
      ],
    },
    {
      id: "live-collections",
      heading: "Live collections: the one that bites",
      body: [
        "`querySelectorAll` returns a **static** list: a snapshot taken at the moment you called it. `getElementsByClassName` and `getElementsByTagName` return a **live** `HTMLCollection`, which updates itself as the document changes.",
        "Live sounds useful and is occasionally exactly what you want. It is also how you write an infinite loop by accident: iterate a live collection while adding elements that match it, and the collection grows as fast as you consume it.",
      ],
      examples: [
        {
          id: "live-vs-static",
          title: "The same selector, two behaviours",
          js: `const live = document.getElementsByClassName("item");   // HTMLCollection, live
const snapshot = document.querySelectorAll(".item");     // NodeList, static

// Add a third matching element to the list.
const li = document.createElement("li");
li.className = "item";
document.querySelector("#list").append(li);

console.log(live.length, snapshot.length);

// The classic accident:
//   for (let i = 0; i < live.length; i++) {
//     document.body.append(makeAnotherItem());   // live.length grows every pass
//   }`,
          output: `3 2`,
          explanation:
            "Same selector, same document, different answers — because the snapshot was taken before the insert. Prefer `querySelectorAll` unless you specifically want the live behaviour, and if you must loop over a live collection, take a copy first with `[...live]`.",
        },
      ],
    },
    {
      id: "text-vs-html",
      heading: "textContent, innerText and innerHTML",
      body: [
        "Three properties that look interchangeable and are not.",
        "**`textContent`** is all the text in the element and its descendants, including elements that are hidden with CSS. It does not parse HTML — assigning to it sets literal text. It is the fastest of the three and the one you should reach for by default.",
        "**`innerText`** is *rendered* text: it respects CSS, so hidden elements are excluded and line breaks reflect layout. Getting it forces the browser to compute layout, which makes it measurably slower. Use it only when you specifically want what the user can actually see.",
        "**`innerHTML`** parses its input as HTML. Reading it serialises the subtree; assigning to it replaces the subtree with newly parsed nodes.",
        "**Never assign untrusted data to `innerHTML`.** A string containing `<img src=x onerror=…>` executes. This is the most common cross-site scripting vector on the web, and the fix is nearly always to use `textContent` instead — which cannot execute anything, because it never parses.",
      ],
      examples: [
        {
          id: "text-vs-html-example",
          title: "The same element, three readings",
          js: `// <p id="p">Hello <b>world</b><span style="display:none">hidden</span></p>
const p = document.querySelector("#p");

console.log(JSON.stringify(p.textContent));
console.log(JSON.stringify(p.innerHTML));
// innerText would give "Hello world" in a browser — the hidden span is excluded,
// because innerText reflects what is actually rendered.

// Setting text is safe with either, but only one is safe with user input:
const userInput = '<img src=x onerror="alert(1)">';

p.textContent = userInput;   // shows the characters; nothing executes
p.innerHTML = userInput;     // parses it; the onerror handler runs`,
          output: `"Hello worldhidden"
"Hello <b>world</b><span style=\\"display:none\\">hidden</span>"`,
          explanation:
            "`textContent` included the hidden span's text because it does not consult CSS at all. That difference is the whole reason both exist. Note also that `textContent` gives no spacing between `world` and `hidden` — it concatenates text nodes exactly as they appear in the tree.",
        },
      ],
      pitfalls: [
        {
          title: "`innerHTML +=` is not an append",
          body: "`el.innerHTML += \"<li>x</li>\"` serialises the entire subtree to a string, concatenates, then re-parses and rebuilds all of it. Every existing child is destroyed and replaced — losing event listeners, form input values, focus and scroll position. It is also O(n) per call, so building a list in a loop is quadratic. Use `append` or `insertAdjacentHTML` instead.",
        },
      ],
    },
    {
      id: "attributes-vs-properties",
      heading: "Attributes are not properties",
      body: [
        "An HTML attribute is what is written in the markup. A DOM property is a field on the JavaScript object the browser created from that markup. They are initialised from each other and then, for several important cases, go their separate ways.",
        "For most attributes they stay in sync — set `id` either way and both change. But for form fields the attribute means **the initial value** and the property means **the current value**. Type into an input and its `value` property changes while its `value` attribute does not, which is precisely how a browser knows what to restore when you reset a form.",
        "This also explains a common confusion: `getAttribute(\"value\")` returning something stale, and `outerHTML` not reflecting what is on screen.",
      ],
      examples: [
        {
          id: "attr-vs-prop",
          title: "Where they diverge",
          js: `// <input id="inp" value="initial">
const input = document.querySelector("#inp");

input.value = "typed";              // property: the current value

console.log(input.value);           // the live value
console.log(input.getAttribute("value"));   // the initial value, unchanged
console.log(input.outerHTML);       // serialises attributes, not properties`,
          output: `typed
initial
<input id="inp" value="initial">`,
          explanation:
            "The rule of thumb: **use properties for reading and writing state** (`input.value`, `input.checked`, `input.disabled`), and attributes for things that only exist in markup (`data-*`, `aria-*`, `href`, custom attributes). `checked` catches people the same way — the attribute is `defaultChecked`, the property is the current state.",
        },
        {
          id: "classlist-dataset",
          title: "classList and dataset, the two APIs worth knowing well",
          js: `const box = document.querySelector("#box");   // <div data-user-id="42" data-role="admin">

// classList beats string-munging className in every way.
box.classList.add("a", "b");
box.classList.toggle("a");                 // present -> removed
box.classList.replace("b", "c");           // if b is present
box.classList.toggle("d", someCondition);  // force on or off
console.log(box.classList.contains("c"));

// dataset exposes every data-* attribute, camelCased.
console.log(box.dataset.userId);   // from data-user-id
console.log(box.dataset.role);     // from data-role
box.dataset.state = "open";        // writes data-state="open"`,
          output: `true
42
admin`,
          explanation:
            "The `data-user-id` to `dataset.userId` conversion is automatic: dashes become camelCase. Everything in `dataset` is a **string** — `data-count=\"3\"` gives you `\"3\"`, so remember to convert it. It is the correct place to attach small pieces of state to an element, and delegation (next lesson) leans on it heavily.",
        },
      ],
    },
    {
      id: "creating",
      heading: "Creating, inserting and removing",
      body: [
        "The modern insertion API is small and consistent, and it replaced a much clumsier one. `appendChild` and `insertBefore` still work and you will meet them; you rarely need to write them.",
        "**`append` and `prepend`** add children at the end or start, accept **several arguments**, and accept **strings as well as nodes** (strings become text nodes, safely). **`before` and `after`** insert siblings. **`replaceWith`** swaps an element out. **`remove`** takes an element out of the document with no reference to its parent.",
        "For inserting a chunk of markup there is **`insertAdjacentHTML`**, which parses without destroying existing siblings — the four positions are `beforebegin`, `afterbegin`, `beforeend` and `afterend`. It carries the same XSS warning as `innerHTML`.",
      ],
      examples: [
        {
          id: "insertion-api",
          title: "Building and placing nodes",
          js: `// Build an element.
const li = document.createElement("li");
li.className = "item";
li.textContent = "Three";           // safe: never parses
li.dataset.id = "3";

const list = document.querySelector("#list");

list.append(li);                    // as the last child
list.prepend("First!", li);         // several arguments; strings allowed
li.before(document.createElement("hr"));
li.after("trailing text");
li.replaceWith(li.cloneNode(true)); // swap for a deep copy
li.remove();                        // detach, no parent needed

// Inserting markup without disturbing siblings:
list.insertAdjacentHTML("beforeend", "<li class='item'>Four</li>");`,
          explanation:
            "`append` accepting strings is the small convenience that removes most `createTextNode` calls from real code — and because it creates a text node rather than parsing, it is safe with user input. `cloneNode(true)` copies descendants; `cloneNode()` alone copies only the element itself, and neither copies event listeners.",
        },
        {
          id: "fragment",
          title: "Batching inserts with a DocumentFragment",
          js: `const items = ["One", "Two", "Three", "Four", "Five"];

// Each append can trigger layout work. For a handful it does not matter;
// for hundreds it does.
const fragment = document.createDocumentFragment();

for (const text of items) {
  const li = document.createElement("li");
  li.textContent = text;
  fragment.append(li);
}

// One insertion, one layout pass. The fragment itself is not inserted —
// appending it moves its children and leaves it empty.
document.querySelector("#list").append(fragment);
console.log(fragment.childNodes.length);`,
          output: `0`,
          explanation:
            "A `DocumentFragment` is a lightweight container that is not part of the document, so building inside it costs nothing. When you append it, its children move across and the fragment is left empty — which the `0` above confirms. Modern browsers batch layout well enough that this matters less than it used to, but it is still the right shape for building a large list.",
        },
      ],
      pitfalls: [
        {
          title: "Reading layout inside a write loop forces synchronous reflow",
          body: "Browsers queue style changes and apply them together. Reading a layout property — `offsetWidth`, `getBoundingClientRect()`, `scrollTop` — forces the browser to flush that queue *now* so it can answer. Alternating a write and a read in a loop (\"layout thrashing\") turns one reflow into hundreds. Batch your reads, then batch your writes.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between a NodeList and an HTMLCollection?",
      answer:
        "A `NodeList` from `querySelectorAll` is static — a snapshot taken when you called it — and has `forEach` but no other array methods. An `HTMLCollection` from `getElementsByClassName` or `getElementsByTagName` is live: it reflects the document as it changes, so its length can change while you are iterating it. Convert either to a real array with spread or `Array.from`.",
    },
    {
      question: "When would you use textContent rather than innerHTML?",
      answer:
        "Almost always. `textContent` does not parse, so it cannot execute injected markup — assigning user input to `innerHTML` is a cross-site scripting vulnerability. It is also faster, because `innerHTML` has to run the HTML parser and rebuild the subtree. Use `innerHTML` only for trusted markup you control, and prefer `insertAdjacentHTML` even then so existing siblings survive.",
    },
    {
      question: "Why does `input.getAttribute(\"value\")` not change when the user types?",
      answer:
        "For form fields the attribute holds the *initial* value and the property holds the *current* one. Typing updates `input.value`, the property, while the `value` attribute keeps the value the markup started with — which is what a form reset restores. The same split applies to `checked` and `defaultChecked`.",
    },
    {
      question: "What does `innerHTML +=` actually do, and why is it a problem?",
      answer:
        "It serialises the whole subtree to a string, concatenates, then re-parses it and replaces every child. All existing children are destroyed and rebuilt, so event listeners, input values, focus and scroll position are lost, and repeated use in a loop is quadratic. Use `append` or `insertAdjacentHTML` instead.",
    },
  ],
  takeaways: [
    "`querySelector`/`querySelectorAll` handle almost everything; `getElementById` is still worth using for its speed and clarity",
    "A NodeList is static and has only `forEach`; an HTMLCollection is live and can change under an iterating loop",
    "`textContent` is the safe default, `innerText` reflects rendering and forces layout, `innerHTML` parses and can execute injected markup",
    "Attributes are the markup's initial values; properties are current state — they diverge for form fields",
    "`classList` and `dataset` replace string manipulation of `className` and repeated `getAttribute` calls; everything in `dataset` is a string",
    "`append`, `prepend`, `before`, `after`, `replaceWith` and `remove` are the modern insertion API, and `append` accepts strings safely",
    "`innerHTML +=` destroys and rebuilds every child — use `append` or `insertAdjacentHTML`",
  ],
  status: "available",
};
