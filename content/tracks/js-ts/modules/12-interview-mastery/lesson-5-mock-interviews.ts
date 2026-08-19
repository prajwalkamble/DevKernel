import type { Lesson } from "@/content/types";

export const mockInterviewsLesson: Lesson = {
  id: "interview-mock-walkthroughs",
  slug: "mock-interview-walkthroughs",
  moduleSlug: "interview-mastery",
  title: "Mock Interview Walkthroughs",
  summary:
    "Three interviews as they actually run — a technical screen, a live coding round and a system design discussion — written as transcripts, with commentary on what each answer bought.",
  estimatedMinutes: 40,
  objectives: [
    "Recognise the shape of each round and what it is assessing",
    "See how a follow-up chain builds from a first answer",
    "Handle a question you cannot answer",
    "Manage time and scope in a live coding round",
  ],
  sections: [
    {
      id: "screen",
      heading: "Round 1: the technical screen",
      body: [
        "Thirty minutes, usually a recruiter-adjacent engineer, working through a list. The goal is to filter, so the bar is *does this person know the language*. Answers should be short and confident; depth is for later rounds.",
      ],
      examples: [
        {
          id: "screen-transcript",
          title: "A screen, with commentary",
          lang: "bash",
          code: `I: "What happens when you type a URL and press enter?"

C: "At a high level — DNS resolves the hostname, a TCP connection is
    opened and TLS negotiated, the browser sends an HTTP request, gets
    HTML back, parses it into a DOM, requests the subresources it finds,
    builds the render tree, and paints. Which part would you like me to
    go into?"

    >> Breadth first, then offer depth. This question has no bottom, and
    >> volunteering forty minutes on TCP is the way to fail it.

I: "Tell me about the render part."

C: "The parser builds the DOM as HTML arrives. A script tag without
    async or defer blocks parsing, because the script might document.write.
    Stylesheets block rendering but not parsing. Once the DOM and CSSOM
    exist, the browser builds the render tree, does layout to compute
    geometry, then paints and composites.

    The practical consequence is that render-blocking CSS in the head and
    synchronous scripts are the two biggest levers on first paint."

    >> Mechanism, then consequence. The last sentence is what makes it
    >> sound like experience rather than reading.

I: "What's the difference between defer and async?"

C: "Both download in parallel with parsing. \`async\` executes as soon as it
    has downloaded, which can be mid-parse and in any order. \`defer\` waits
    until parsing is complete and executes in document order.

    So \`defer\` for anything that touches the DOM or depends on another
    script; \`async\` for independent things like analytics."

I: "How would you debug a page that's slow to become interactive?"

C: "I'd start with a Performance recording rather than guessing —
    specifically looking for long tasks on the main thread, because
    time-to-interactive is usually one or two of those rather than
    everything being slightly slow.

    Common culprits: a large synchronous bundle parse, expensive work in
    a mount effect, or layout thrashing from reading offsetWidth in a
    loop. Once I know which, the fixes differ a lot — code splitting,
    deferring the work, or batching reads and writes."

    >> Names a tool, says what it is looking for, and gives candidates
    >> without committing to one before measuring. That last part is
    >> what separates it from reciting a list of optimisations.`,
          explanation:
            "Notice the pattern in every answer: a short direct response, one level of mechanism, and a consequence — and in two of them, a question back. Handing control back to the interviewer is a good habit in a screen, because it keeps you from spending your thirty minutes on the one topic you happened to start with.",
        },
      ],
    },
    {
      id: "coding",
      heading: "Round 2: live coding",
      body: [
        "Forty-five minutes, screen shared, one problem with follow-ups. The assessment is **how you work**, not whether you finish — a clean half-solution with good reasoning beats a complete one produced in silence.",
      ],
      examples: [
        {
          id: "coding-transcript",
          title: "A live coding round",
          lang: "bash",
          code: `I: "Build an autocomplete. Input box, calls /search?q=, shows results."

C: "A few questions first. Should I debounce the requests, and roughly
    what delay? Do results need to be keyboard-navigable? And should I
    assume fetch is available or write against an injected client?"

I: "Debounce, yes — 300ms. Keyboard is a stretch goal. Assume fetch."

    >> Three questions, ten seconds. It establishes scope and surfaces
    >> the debounce requirement rather than guessing at it.

C: "I'll start with the fetch and rendering, then add debouncing, then
    handle the race — because two responses can arrive out of order and
    the slower older one would overwrite the newer results."

    >> Naming the race before writing it is the single highest-value
    >> sentence in this round. Most candidates hit it as a bug later,
    >> or never.

    [writes the basic version, narrating]

C: "That works but fires per keystroke. Adding the debounce now."

    [adds debounce]

C: "And now cancellation — I'll use an AbortController so the previous
    request is aborted rather than just ignored, which also stops the
    server doing work nobody wants. I need to be careful to treat
    AbortError as expected rather than showing it as a failure."

    [implements]

I: "What if the user clears the input?"

C: "Good catch — right now that fires a request for an empty query. I'd
    guard it: if the trimmed query is empty, abort anything in flight,
    clear the results, and return without fetching."

    >> Accepts the correction plainly and states the fix precisely.
    >> No defensiveness, no over-apologising.

I: "We have ten minutes. What would you do with them?"

C: "Two things, in this order. First a loading and error state, because
    right now a failed request shows the previous results forever and
    that's a correctness problem. Then keyboard navigation, which is the
    stretch goal.

    If you'd rather see tests than either, I'd write those instead —
    the debounce and race logic are the parts I'd want covered."

    >> Prioritises by risk, gives a reason, and offers to be redirected.`,
          explanation:
            "The candidate never finished the keyboard navigation, and that is fine. What they demonstrated: clarifying scope, sequencing work by risk, anticipating the race condition, taking a correction well, and reasoning about what to do with limited time. Those are the things being scored, and all of them are visible only because they talked.",
        },
      ],
      pitfalls: [
        {
          title: "Silence is the most common failure in this round",
          body: "An interviewer watching someone type for eight minutes without speaking has no information to assess. If you need to think, say \"give me thirty seconds to think about the structure\" — that is a perfectly normal thing to say and it converts silence into a deliberate pause. The same applies when stuck: \"I'm trying to decide whether to handle cancellation here or in the caller\" invites help without asking for the answer.",
        },
      ],
    },
    {
      id: "design",
      heading: "Round 3: design discussion",
      body: [
        "Open-ended, often about something you would build or something from your own experience. There is no correct answer; the assessment is whether you reason about constraints, trade-offs and failure.",
      ],
      examples: [
        {
          id: "design-transcript",
          title: "A front-end design discussion",
          lang: "bash",
          code: `I: "Design the front end for a collaborative document editor."

C: "Let me establish scope first. How many concurrent editors per
    document — two or three, or hundreds? Does it need to work offline?
    And is this rich text or plain?"

I: "Up to about ten. Offline would be nice. Rich text."

C: "Then the central problem is conflict resolution, and that choice
    drives most of the rest.

    Two options. Operational transformation — what Google Docs uses —
    needs a central server to order operations, and is well understood
    but genuinely hard to implement correctly. CRDTs converge without
    a coordinator, which gives you offline for free, at the cost of
    more metadata per document and larger payloads.

    Given ten users and an offline requirement, I'd take a CRDT —
    Yjs or Automerge rather than writing one. The metadata cost is
    real but bounded at that scale."

    >> States the decision that everything else depends on, gives
    >> both options with their costs, and picks one for a stated
    >> reason tied to the constraints just established.

I: "How does the UI stay fast with a large document?"

C: "Two separate concerns. Rendering — virtualise, so only the visible
    portion is in the DOM. And input latency — apply local edits
    optimistically and immediately, then reconcile when the remote
    update arrives. A CRDT makes that safe, because local and remote
    operations commute.

    The thing I'd watch is that a remote update shouldn't move the
    user's cursor or scroll position. That's the bug users actually
    notice and complain about."

    >> The last paragraph is the strongest part: it names a concrete
    >> user-visible failure rather than staying abstract.

I: "What happens when the connection drops?"

C: "Edits keep applying locally, since the CRDT doesn't need the server
    to make progress. I'd queue outgoing updates, show a clear
    'reconnecting' indicator — silently dropping to offline is worse
    than saying so — and reconnect with backoff.

    The case I'd think hardest about is a long disconnection where the
    document has diverged a lot. Convergence is guaranteed, but the
    *result* may surprise someone who has been editing for an hour.
    I'd want a way to see what changed after a long absence."

    >> Answers the mechanism, then goes past it to the case where the
    >> guarantee is technically satisfied but the experience is bad.
    >> That is a senior instinct and it is what this round is for.

I: "You mentioned Yjs. What if we couldn't use a third-party library?"

C: "Then I'd push back on the requirement, honestly — writing a
    correct CRDT is a multi-month project and the failure mode is
    silent data corruption.

    If it were genuinely non-negotiable, I'd narrow the scope: OT with
    a central server for plain text is far more tractable than a
    general rich-text CRDT, and I'd drop the offline requirement, since
    that's what makes the coordinator-free approach necessary."

    >> Disagrees with the premise, gives the reason, and still answers
    >> the question under the constraint. Both halves matter.`,
          explanation:
            "The last exchange is worth studying. Pushing back on a requirement is not refusing to answer — the candidate stated the cost, then answered the hypothetical anyway with a scoped-down alternative. An interviewer asking that question is usually testing exactly that: whether you can distinguish \"this is hard\" from \"this is impossible\", and whether you fold under a constraint or negotiate it.",
        },
      ],
    },
    {
      id: "your-questions",
      heading: "The questions you ask",
      body: [
        "Every interview ends with \"do you have questions for us\", and it is assessed. \"No, I think you covered everything\" reads as disinterest even when it is politeness.",
        "The useful ones are specific and hard to answer from a careers page. **\"What does the code review process look like — who reviews, and how long do PRs usually wait?\"** **\"What is the most annoying part of the codebase right now?\"** — the answer is always revealing, and how freely they answer is more revealing still. **\"What happened the last time something broke in production?\"** **\"What would you want the person in this role to have achieved in six months?\"**",
        "Ask two or three, not a list. And listen to the answers — a hesitation on \"how long do PRs wait\" tells you more about the day-to-day than anything on the job posting.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What happens when you type a URL into a browser and press enter?",
      answer:
        "DNS resolves the hostname, a TCP connection is opened and TLS negotiated, the browser sends an HTTP request and receives HTML, parses it into a DOM while requesting subresources, builds the CSSOM and render tree, then lays out, paints and composites. The question has no bottom, so give the breadth first and ask which part they want — volunteering everything you know about TCP is how it goes wrong.",
    },
    {
      question: "What is the difference between `async` and `defer` on a script tag?",
      answer:
        "Both download in parallel with HTML parsing. `async` executes as soon as its download finishes, which can interrupt parsing and happens in unpredictable order. `defer` waits until parsing completes and executes scripts in document order. Use `defer` for anything touching the DOM or depending on another script, and `async` for independent things like analytics.",
    },
    {
      question: "How would you debug a page that is slow to become interactive?",
      answer:
        "Record a Performance profile rather than guessing, and look for long tasks blocking the main thread — time-to-interactive is usually one or two of those rather than uniform slowness. Common causes are a large synchronous bundle parse, expensive work in a mount effect, and layout thrashing from interleaved reads and writes. The fixes differ enough that measuring first genuinely matters.",
    },
    {
      question: "How do you handle a live coding problem you cannot finish in time?",
      answer:
        "Prioritise by risk and say why — a missing error state is a correctness problem, a missing stretch goal is not. State what you would do with the remaining time and offer to be redirected. Finishing is not the assessment; clarifying scope, sequencing sensibly, anticipating problems like a response race, and taking corrections well are, and all of them are only visible if you talk while working.",
    },
  ],
  takeaways: [
    "In a screen, give breadth first and offer depth — open-ended questions punish volunteering everything",
    "Every good answer has a consequence sentence; that is what makes it sound like experience",
    "In live coding, clarify scope in three questions, then say your plan before writing",
    "Naming a race condition before hitting it is worth more than a complete solution",
    "Silence is the most common live-coding failure — narrate, or say you are pausing to think",
    "In design, establish the decision everything else depends on, then pick with a stated reason",
    "Going past the mechanism to a concrete user-visible failure is the senior signal",
    "Pushing back on a premise is fine if you state the cost and still answer under the constraint",
    "Ask two or three specific questions at the end; the hesitations are the informative part",
  ],
  status: "available",
};
