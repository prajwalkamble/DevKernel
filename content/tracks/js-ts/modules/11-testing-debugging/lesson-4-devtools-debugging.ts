import type { Lesson } from "@/content/types";

export const devtoolsDebuggingLesson: Lesson = {
  id: "testing-devtools",
  slug: "devtools-and-node-inspector",
  moduleSlug: "testing-debugging",
  title: "Debugging with DevTools & the Node Inspector",
  summary:
    "Replacing console.log with a debugger: conditional breakpoints, logpoints, breaking on the thing you cannot find in source, and attaching the same tooling to Node.",
  estimatedMinutes: 35,
  objectives: [
    "Set breakpoints, including conditional ones and logpoints",
    "Read the call stack and move between frames",
    "Break on a DOM change, an event, or a thrown exception",
    "Attach a debugger to a Node process, including a test run",
    "Use console methods beyond `log` where logging is genuinely right",
  ],
  sections: [
    {
      id: "why-debugger",
      heading: "Why a debugger beats console.log",
      body: [
        "`console.log` is not shameful and this lesson is not going to tell you to stop. But it has a specific cost: **each question requires an edit, a save and a reload**, and you can only see what you thought to print.",
        "A breakpoint pauses the program with **everything** available — every variable in every frame of the call stack, not just the ones you predicted. Questions you did not anticipate can be answered without changing the code, which is exactly the situation you are in when you do not yet understand the bug.",
        "The practical rule: reach for logging when you want to observe a *sequence* over time, and for the debugger when you want to inspect a *moment* in detail.",
      ],
    },
    {
      id: "breakpoints",
      heading: "The four kinds of breakpoint",
      body: [
        "**A line breakpoint** — click the gutter in the Sources panel. Pauses every time that line runs.",
        "**A conditional breakpoint** — right-click the gutter, add an expression. Pauses only when it is true, which is the difference between usable and useless inside a loop over ten thousand rows.",
        "**A logpoint** — right-click, choose Log. Prints an expression and carries on without pausing. This is `console.log` with no code change and no redeploy, and it is the most under-used feature in the panel.",
        "**A `debugger` statement** — a line in your source that pauses when DevTools is open. Useful for code that is hard to find in the Sources tree, such as a bundled or dynamically-evaluated module.",
      ],
      examples: [
        {
          id: "conditional-breakpoint",
          title: "Conditions and logpoints in practice",
          js: `function processOrders(orders) {
  for (const order of orders) {
    // A line breakpoint here pauses 10,000 times.
    //
    // Conditional:  order.total < 0
    //   -> pauses only on the one that is wrong.
    //
    // Conditional:  order.id === "ord_8842"
    //   -> pauses on the one the bug report named.
    //
    // Logpoint:     order.id, order.total, order.items.length
    //   -> prints every iteration, pauses none, and needs no edit.
    const invoice = buildInvoice(order);
    send(invoice);
  }
}

// A hit-count condition, when you know it fails "after a while":
//   Conditional:  ++window.__n > 500`,
          explanation:
            "The hit-count trick works because the condition is ordinary JavaScript evaluated in scope — anything goes, including assignment and calling functions. `console.count()` and `console.trace()` are also available from a logpoint, which makes \"how many times, and from where\" a question you can answer without touching the file.",
        },
      ],
      pitfalls: [
        {
          title: "A breakpoint that never hits is usually on the wrong file",
          body: "With a bundler, the Sources panel shows both the original file (via source maps, under `webpack://` or similar) and the generated bundle. A breakpoint set in one does not necessarily bind in the other. If it never pauses, check that the line has the solid marker rather than a hollow one, and look for the same file listed twice.",
        },
      ],
    },
    {
      id: "call-stack",
      heading: "The call stack is the most useful panel",
      body: [
        "When execution pauses, **Call Stack** shows how you got there — and clicking any frame moves the whole inspector into that frame's scope. Variables, the console, and the highlighted line all follow.",
        "This answers the question that logging cannot: *which caller passed this bad value?* You do not have to guess where to add the next log; you walk up the stack until the value is correct, and the bug is between those two frames.",
        "Two features make it more usable. **Async stack traces** are on by default in modern DevTools, so the stack continues through `await`, timers and promises rather than stopping at the event-loop boundary. And **Ignore List** (formerly blackboxing) hides framework and `node_modules` frames, which turns a forty-frame React stack into the four frames that are yours.",
      ],
      examples: [
        {
          id: "stepping",
          title: "The stepping controls, and which to use",
          lang: "bash",
          code: `# Resume (F8)          run until the next breakpoint
# Step over (F10)      run this line, do not descend into calls
# Step into (F11)      descend into the call on this line
# Step out (Shift+F11) finish this function and pause in the caller
# Step (F9)            the next statement, wherever it is

# The one people miss:
#   right-click a line -> "Continue to here"
# Runs until that line without setting a breakpoint at all.
#
# And in the Console while paused, \`$0\` is the selected element,
# \`copy(value)\` puts anything on the clipboard.`,
          explanation:
            "\"Continue to here\" is worth adopting: most stepping is really \"get me to that line\", and doing it by pressing F10 forty times through a loop is how debugging gets a reputation for being slow. Step out is the other one — after accidentally stepping into a library, it returns you to your own code in one keystroke.",
        },
      ],
    },
    {
      id: "other-breakpoints",
      heading: "Breaking on things that are not lines",
      body: [
        "The hardest debugging question is \"what changed this?\" when you cannot find the code that did. DevTools can break on the *event* rather than the source line, which finds it for you.",
        "**Break on DOM change** — right-click an element in Elements → Break on → attribute modifications / subtree modifications / node removal. Execution pauses at the exact line that changed it, wherever that line is. This is the single fastest way to find which script is fighting your styles.",
        "**Event listener breakpoints** — in the Sources sidebar, break on any `click`, any `keydown`, any `fetch`. Right when a click does something and you do not know what is listening.",
        "**Pause on exceptions** — the ⏸ button, with a checkbox for caught exceptions too. Turning on \"caught\" is noisy but invaluable when something is swallowing an error and you want to know where.",
        "**XHR/fetch breakpoints** — pause when a request whose URL contains a string is made, which finds the code that issued a mystery request.",
      ],
    },
    {
      id: "node",
      heading: "Debugging Node",
      body: [
        "The same DevTools debug a Node process. `--inspect` opens the debugging port; `--inspect-brk` also pauses before the first line, which is what you want when the interesting code runs at startup.",
        "Connect by opening `chrome://inspect` and clicking the target, or — more conveniently — from your editor. VS Code's `Auto Attach` setting makes any `node` command started in its terminal attach automatically, which removes the ceremony entirely.",
      ],
      examples: [
        {
          id: "node-inspect",
          title: "Attaching to a script, a server and a test run",
          lang: "bash",
          code: `# Pause before the first line, then open chrome://inspect
node --inspect-brk app.js

# Attach to a running server without pausing it
node --inspect server.js

# Through a package script
NODE_OPTIONS="--inspect-brk" npm start

# Debug a Vitest run — note \`--no-file-parallelism\`, without which the
# tests run in worker threads and the breakpoints never bind.
node --inspect-brk ./node_modules/vitest/vitest.mjs run --no-file-parallelism

# Or with the built-in terminal debugger, when there is no browser:
node inspect app.js
#   sb(42)   set breakpoint on line 42
#   c        continue
#   repl     inspect variables`,
          explanation:
            "The `--no-file-parallelism` flag is the detail that makes debugging tests actually work. By default Vitest runs each file in a worker thread, and the inspector attaches to the main process — so breakpoints inside tests are simply never reached, and it looks as though the debugger is broken.",
        },
      ],
      pitfalls: [
        {
          title: "Never expose the inspector port publicly",
          body: "`--inspect` binds to 127.0.0.1 by default, which is correct. `--inspect=0.0.0.0:9229` on a server exposes full code execution in that process to anyone who can reach the port — it is a debugger, so it can evaluate arbitrary expressions. Use an SSH tunnel to reach a remote inspector, never an open port.",
        },
      ],
    },
    {
      id: "console-methods",
      heading: "The console methods worth knowing",
      body: [
        "When logging *is* the right tool — observing a sequence, or in production where no debugger is attached — there is more than `log`.",
      ],
      examples: [
        {
          id: "console-methods",
          title: "Eight that are better than log",
          js: `// A table, for arrays of objects. Far more readable than a dump.
console.table(orders, ["id", "total", "status"]);

// Grouping, collapsed by default.
console.groupCollapsed("processing batch 4");
console.log(items);
console.groupEnd();

// How many times did this run?
console.count("render");        // render: 1, render: 2, …

// How long did it take?
console.time("query");
await runQuery();
console.timeEnd("query");       // query: 142.3ms

// How did we get here? Prints a stack without pausing.
console.trace("unexpected call");

// Log only when something is wrong.
console.assert(total >= 0, "negative total", { order });

// The shorthand that avoids naming things twice:
console.log({ userId, total, items });   // logs { userId: 1, total: 20, … }

// And the one that is not a console method at all:
//   debugger;   pauses when DevTools is open, no-op otherwise`,
          explanation:
            "`console.log({ userId, total })` using shorthand object syntax is the single highest-value habit here — it labels every value automatically, so you never again get four unlabelled numbers in a row and have to count which is which. `console.table` is the second: it turns an array of objects into something you can actually read.",
        },
      ],
      pitfalls: [
        {
          title: "Logging an object logs a live reference, not a snapshot",
          body: "In browser DevTools, `console.log(obj)` stores a reference — expanding it later shows the object's state *now*, not when it was logged. A property that looks wrong may have been correct at that moment and mutated afterwards. Log a snapshot when it matters: `console.log(structuredClone(obj))` or `console.log(JSON.stringify(obj))`. This is responsible for a genuinely large share of confusing debugging sessions.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When would you use a debugger instead of console.log?",
      answer:
        "When you need to inspect a moment in detail rather than observe a sequence over time. A breakpoint gives you every variable in every stack frame, including ones you did not think to print, with no edit-save-reload cycle. Logging is still right for tracing a sequence, for production where no debugger is attached, and for anything you want a record of.",
    },
    {
      question: "What is a conditional breakpoint, and what is a logpoint?",
      answer:
        "A conditional breakpoint pauses only when an expression is true, which makes breakpoints usable inside loops — `order.id === \"ord_8842\"` rather than pausing ten thousand times. A logpoint prints an expression and continues without pausing, giving you `console.log` behaviour with no code change and no redeploy. Both are set by right-clicking the gutter.",
    },
    {
      question: "How would you find what is modifying a DOM element?",
      answer:
        "Right-click the element in the Elements panel and choose Break on → attribute modifications, subtree modifications, or node removal. Execution pauses at the exact line responsible, wherever it lives — including inside a bundle or a third-party script. It is far faster than searching for code that might be doing it.",
    },
    {
      question: "How do you attach a debugger to a Node process?",
      answer:
        "`node --inspect` opens the debugging port, and `--inspect-brk` also pauses before the first line for code that runs at startup. Connect via `chrome://inspect` or from your editor. Keep the port on localhost — exposing it publicly grants arbitrary code execution, because a debugger can evaluate any expression.",
    },
    {
      question: "Why might a logged object show different values than expected?",
      answer:
        "Browser consoles store a live reference rather than a snapshot, so expanding the object later shows its current state, not its state when logged. Code that mutates the object afterwards makes the log appear wrong. Log `structuredClone(obj)` or a JSON string when the value at that instant is what matters.",
    },
  ],
  takeaways: [
    "Debugger for inspecting a moment, logging for observing a sequence",
    "Conditional breakpoints make loops debuggable; logpoints give you logging with no code change",
    "The call stack answers \"which caller passed this?\" — click a frame to move the whole inspector into it",
    "Ignore List hides framework frames; async stack traces continue through await and timers",
    "\"Continue to here\" and Step out are the two controls that save the most time",
    "Break on DOM modification, on events, or on exceptions when you cannot find the code responsible",
    "`node --inspect-brk` for startup code, and Vitest needs `--no-file-parallelism` or breakpoints never bind",
    "Never expose the inspector port — it is arbitrary code execution",
    "`console.log({ value })` labels automatically; logged objects are live references, not snapshots",
  ],
  status: "available",
};
