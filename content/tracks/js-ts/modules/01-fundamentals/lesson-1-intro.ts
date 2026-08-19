import type { Lesson } from "@/content/types";

export const introLesson: Lesson = {
  id: "fundamentals-intro",
  slug: "intro-js-vs-ts",
  moduleSlug: "fundamentals",
  title: "What Are JavaScript & TypeScript?",
  summary:
    "The relationship between JavaScript and TypeScript, how code gets from your editor to the browser, and why this whole course teaches them side by side.",
  estimatedMinutes: 20,
  objectives: [
    "Explain what JavaScript is and where it runs",
    "Explain what TypeScript is and how it relates to JavaScript",
    "Understand the compile step TypeScript adds",
    "Know what a tsconfig.json controls at a high level",
  ],
  sections: [
    {
      id: "what-is-js",
      heading: "JavaScript: the language the browser understands",
      body: [
        "JavaScript (JS) is a dynamically-typed, interpreted programming language. Every browser ships a JavaScript engine (V8 in Chrome/Node, SpiderMonkey in Firefox, JavaScriptCore in Safari) that reads your `.js` file and runs it directly — no separate build step is required for the language to execute.",
        "Because JS is *dynamically typed*, a variable can hold a string today and a number tomorrow, and the engine won't stop you. Type mistakes are only caught **at runtime**, often as a crash in production, in a code path nobody tested.",
        "JS also runs outside the browser. Node.js and Deno embed the same kind of engine so you can run JavaScript on a server, in a CLI tool, or in a build script.",
      ],
      examples: [
        {
          id: "js-dynamic-typing",
          title: "Dynamic typing in action",
          js: `let value = "hello";
console.log(typeof value); // "string"

value = 42; // totally legal, JS does not care
console.log(typeof value); // "number"

function add(a, b) {
  return a + b;
}

console.log(add(2, 3));      // 5
console.log(add("2", 3));    // "23"  <-- silently does the "wrong" thing`,
          explanation:
            "Nothing here is a syntax error. The `add` function will happily concatenate strings when you meant to add numbers, and you only find out when the output looks wrong.",
        },
      ],
    },
    {
      id: "what-is-ts",
      heading: "TypeScript: JavaScript plus a type system",
      body: [
        "TypeScript (TS) is a **superset** of JavaScript created by Microsoft. Every valid `.js` file is (almost) valid TypeScript — TS adds an optional static type system on top: type annotations, interfaces, generics, and compile-time checks.",
        "Browsers and Node.js **cannot run `.ts` files directly**. TypeScript code must first be *compiled* (more precisely, transpiled) down to plain JavaScript by the TypeScript compiler, `tsc`, or by a build tool (Vite, esbuild, SWC, Babel) that understands TS syntax. That output `.js` is what actually ships and runs.",
        "The core value proposition: TypeScript catches an entire category of bugs — wrong argument types, typos in property names, forgetting to handle `null` — **while you're typing**, in your editor, instead of after a user hits them in production.",
      ],
      examples: [
        {
          id: "ts-static-typing",
          title: "The same bug, caught before it runs",
          ts: `function add(a: number, b: number): number {
  return a + b;
}

console.log(add(2, 3));     // 5
console.log(add("2", 3));   // Compile-time error:
// Argument of type 'string' is not assignable to parameter of type 'number'.`,
          explanation:
            "The second call never even produces a `.js` file if you run `tsc` with strict settings on — the compiler stops you at the source. In an editor with TypeScript support (VS Code), you see the red squiggle the instant you type it.",
        },
      ],
      pitfalls: [
        {
          title: "\"TypeScript is a different language\" — not quite",
          body: "TypeScript doesn't invent new runtime behavior. `1 + \"1\"` still equals `\"11\"` in TypeScript, because at runtime it *is* JavaScript — the exact same engine runs it. TypeScript's job ends at compile time; it erases all types and ships plain JS.",
        },
      ],
    },
    {
      id: "the-pipeline",
      heading: "From source to running code",
      body: [
        "For plain JavaScript, the pipeline is short: you write `.js`, the engine parses and runs it (browsers/Node may also do their own internal JIT compilation, but that's invisible to you as the author).",
        "For TypeScript, there's an extra step: **Write `.ts`/`.tsx` → TypeScript compiler checks types and strips them → plain `.js` is emitted → the JS engine runs that output.** If type-checking fails, compilation can still emit JS (TypeScript is somewhat forgiving by default), but your build tooling is usually configured to fail the build on type errors.",
        "This is why you'll hear TypeScript described as a **build-time tool**, not a runtime one. There is no 'TypeScript engine' living inside Chrome — by the time code reaches the browser, every type annotation is gone.",
      ],
      examples: [
        {
          id: "tsconfig-preview",
          title: "A minimal tsconfig.json",
          ts: `{
  "compilerOptions": {
    "target": "ES2020",      // which JS version to output
    "module": "ESNext",      // which module system to output
    "strict": true,          // turn on all strict type-checking options
    "jsx": "react-jsx",      // how to compile JSX (for React/TSX)
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}`,
          explanation:
            "You'll see `tsconfig.json` in every TypeScript project — it's the compiler's settings file. `\"strict\": true` is the single most important flag: it's what makes TypeScript actually catch the bugs it's famous for. We cover this file in depth in the Modules & Tooling unit.",
        },
      ],
    },
    {
      id: "why-both",
      heading: "Why this course teaches them together",
      body: [
        "TypeScript doesn't replace JavaScript — it sits on top of it. Every closure, every array method, every `this` quirk, every async pattern you learn in JavaScript is **exactly the same** in TypeScript, because they share one runtime.",
        "The only genuinely new material TypeScript adds is the *type system* itself: how to describe shapes of data so the compiler can verify your code before it runs. That's a learnable, bounded skill — not a second programming language to master from scratch.",
        "So throughout this course, every lesson shows you a JavaScript example first, then the same idea in TypeScript. By the end you'll be fluent in both, and — just as importantly — you'll know exactly how to take an existing JavaScript file and incrementally convert it to TypeScript (covered fully in the Design Patterns & Architecture module).",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Is TypeScript a completely different language from JavaScript?",
      answer:
        "No. TypeScript is a strict syntactical superset of JavaScript — valid JS is (almost always) valid TS. TypeScript adds optional static types and compiles down to plain JavaScript; it introduces no new runtime behavior of its own.",
    },
    {
      question: "Can a browser run a .ts file directly?",
      answer:
        "No. Browsers and Node.js only execute JavaScript. TypeScript files must be compiled/transpiled to `.js` first, by `tsc` or a build tool (esbuild, SWC, Babel, Vite), before they can run.",
    },
    {
      question: "Does TypeScript make JavaScript code run faster?",
      answer:
        "Not directly. TypeScript's types are erased at compile time and have zero runtime cost or benefit — the emitted JavaScript performs identically to hand-written JavaScript. TypeScript's benefit is catching bugs earlier (compile time vs runtime), not runtime performance.",
    },
    {
      question: "What does `\"strict\": true` in tsconfig.json actually do?",
      answer:
        "It's a shortcut that enables a bundle of stricter type-checking flags at once (noImplicitAny, strictNullChecks, strictFunctionTypes, and more). Without it, TypeScript is much more permissive and misses many bugs it's capable of catching.",
    },
    {
      question: "If I have a working JavaScript codebase, do I have to rewrite it to use TypeScript?",
      answer:
        "No. TypeScript supports incremental adoption: you can rename files from .js to .ts one at a time, start with loose settings (allowJs, checkJs off), and tighten strictness gradually. This migration path is covered in depth later in the course.",
    },
  ],
  takeaways: [
    "JavaScript runs directly in engines (browsers, Node, Deno); TypeScript must be compiled to JavaScript first.",
    "TypeScript is a superset: same runtime, same language semantics, plus an optional type system checked at compile time.",
    "Type errors in TypeScript are caught before code runs; type-related bugs in plain JS only surface at runtime.",
    "All TypeScript types are erased during compilation — they have zero effect on runtime behavior or performance.",
    "Every JavaScript concept you learn (closures, `this`, async, prototypes) applies unchanged in TypeScript.",
  ],
  status: "available",
};
