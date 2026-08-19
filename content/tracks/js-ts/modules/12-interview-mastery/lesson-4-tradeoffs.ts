import type { Lesson } from "@/content/types";

export const tradeoffsLesson: Lesson = {
  id: "interview-tradeoffs",
  slug: "explaining-tradeoffs",
  moduleSlug: "interview-mastery",
  title: "Explaining Trade-offs",
  summary:
    "The senior half of an interview is not about knowing more features — it is about arguing for a choice. Four decisions you will be asked to defend, and what a good answer sounds like.",
  estimatedMinutes: 35,
  objectives: [
    "Answer \"why did you choose X\" with a trade-off rather than a preference",
    "Argue when a TypeScript feature earns its complexity and when it does not",
    "Defend a decision to keep something simple",
    "Disagree with an interviewer well",
  ],
  sections: [
    {
      id: "the-shape",
      heading: "What a trade-off answer sounds like",
      body: [
        "The single most common weak answer to \"why did you use X\" is \"because it's better\". It is weak because it treats a decision as having a right answer, and the interviewer is checking whether you know decisions have costs.",
        "A good answer has four moves, and it takes under a minute.",
        "**Name the cost of the thing you chose.** Doing this first is disarming and immediately signals seniority.",
        "**Name what you got for it.**",
        "**Say what would change your mind.** This is the part almost nobody does, and it is the one that demonstrates the decision was actually made rather than defaulted into.",
        "**Anchor it in context.** Team size, lifespan, how much the code changes, who maintains it.",
      ],
      examples: [
        {
          id: "tradeoff-shape",
          title: "The same question, three answers",
          lang: "bash",
          code: `Q: "Why did you use TypeScript on that project?"

# Weak — a preference dressed as a fact.
"It's better than JavaScript. It catches bugs."

# Better — but still one-sided.
"It catches type errors at compile time, gives you autocomplete,
 and makes refactoring safer."

# Strong — cost, benefit, what would change it, context.
"It cost us build complexity and roughly a week of ramp-up for two
 people who hadn't used it.

 What we got was safe refactoring — we renamed a core domain type
 in month four and the compiler found all 200 call sites, which
 would otherwise have been a grep-and-pray afternoon.

 I'd have skipped it for a prototype we expected to throw away,
 or for a two-week project. The value is proportional to how long
 the code lives and how many people touch it, and this one was
 four people for two years."`,
          explanation:
            "The third answer says nothing the second does not, and lands completely differently — because it demonstrates the decision had a downside that was weighed. Note the concrete detail: \"200 call sites in month four\" is worth more than any general claim about safety, because it cannot be recited from a blog post.",
        },
      ],
    },
    {
      id: "ts-complexity",
      heading: "When a TypeScript feature earns its complexity",
      body: [
        "The most common trade-off question in a TypeScript interview is some version of *how clever should the types be?* There is a real answer, and it is not \"as clever as possible\".",
        "**The test: does this type prevent a bug that is actually possible, or enable a refactor that is actually likely?** If neither, it is cost — code to read, errors to decipher, and a barrier for the next person.",
        "A rough scale, from almost always worth it to rarely.",
        "**Always.** Typed function parameters and exported return types. Discriminated unions for state and errors. `unknown` at boundaries. These prevent real, common bugs and cost nothing.",
        "**Usually.** Generics on genuinely reusable functions and components. `keyof` and mapped types where the alternative is a hand-maintained list that will drift. Branded types for ids that are confusable.",
        "**Sometimes.** Conditional types, template literal types, recursive types. Right in a library where the type *is* the API; usually overkill in application code.",
        "**Rarely.** Type-level arithmetic, deep recursive inference, anything that makes the compiler slow. If a type takes ten minutes to understand, it will cost more than the bug it prevents.",
      ],
      examples: [
        {
          id: "clever-vs-simple",
          title: "The same guarantee, two prices",
          ts: `// Clever: derives the valid paths of a nested object at the type level.
type Path<T> = T extends object
  ? { [K in keyof T]: K extends string
        ? T[K] extends object ? K | \`\${K}.\${Path<T[K]>}\` : K
        : never
    }[keyof T]
  : never;

function get<T, P extends Path<T>>(obj: T, path: P): unknown { /* … */ }

get(config, "server.port");     // checked
get(config, "server.prot");     // error

// Simple: a union you maintain by hand.
type ConfigPath = "server.port" | "server.host" | "logging.level";

function get(obj: Config, path: ConfigPath): unknown { /* … */ }`,
          explanation:
            "**Both prevent the same bug.** The first is automatic and never drifts; the second is fifteen characters per new path and readable by anyone. The honest answer to which is right: the first if it is a published library used by people who cannot edit it, the second if it is your own config with eleven keys. Being able to argue *either* side depending on context is the point — an interviewer who hears only \"use the clever one\" learns less than one who hears the condition.",
        },
      ],
      pitfalls: [
        {
          title: "\"We can always add types later\" is usually false",
          body: "Retrofitting types onto code written without them is far more work than writing them as you go, because untyped code accumulates shapes that no type can describe — a function returning three different structures, an object whose fields depend on a flag. Module 10's migration lesson is what that costs. It is a fair trade-off to make deliberately for a prototype; it is not a fair thing to claim is cheap.",
        },
      ],
    },
    {
      id: "common-questions",
      heading: "Four you will be asked",
      body: [
        "**\"When would you not use TypeScript?\"** A prototype with a known short life. A tiny script. A team with no TypeScript experience and a two-week deadline. A codebase whose dependencies are all untyped, where you would spend the project writing declarations. Answering \"never\" reads as inexperience, not conviction.",
        "**\"Class or function?\"** Functions and closures by default in modern JavaScript — simpler, easier to test, no `this` to lose. Classes when you need many instances where prototype sharing matters, when `instanceof` is part of the contract (errors, especially), or when integrating with an API that expects them. What matters is that you have a reason, not which you chose.",
        "**\"REST or GraphQL?\"** GraphQL when clients need different shapes of the same data and over-fetching is a real cost, and when the team can afford the server complexity and caching story. REST when the endpoints are stable, HTTP caching is valuable, and the client set is small. The trap is arguing GraphQL is modern — the actual question is whether your clients' needs vary.",
        "**\"Would you add this library?\"** The honest framework: what does it cost in bundle size and in the risk of maintaining code we did not write, against how long it would take to build and maintain ourselves. `date-fns` for date maths — yes, dates are genuinely hard. A 40KB dependency for `debounce` — no, it is nine lines and you wrote it in the previous lesson.",
      ],
    },
    {
      id: "disagreeing",
      heading: "Disagreeing with an interviewer",
      body: [
        "Sometimes an interviewer states something you believe is wrong, or pushes back on a correct answer. How you handle it is often the most informative thing in the interview, because it is a live sample of how you behave in a code review.",
        "**Do not fold immediately.** Agreeing with something you think is wrong to avoid friction is exactly the behaviour nobody wants on a team.",
        "**Do not dig in either.** Restating your position more firmly is not an argument.",
        "**Ask what they are optimising for.** Most technical disagreements are not about facts; they are about different weightings. \"That makes sense if the priority is X — I was weighting Y more heavily. Which matters more here?\" resolves most of them and reframes it as a shared problem.",
        "**And update out loud when they are right.** \"That's a good point, I hadn't considered the caching implications — that does change my answer\" is a strong signal, not a weak one. The willingness to be wrong in public is most of what makes code review work.",
      ],
      examples: [
        {
          id: "disagreement",
          title: "Being pushed on a correct answer",
          lang: "bash",
          code: `Interviewer: "Wouldn't it be simpler to just use \`any\` here?"

# Folding — agrees with something you think is wrong.
"Yeah, that's probably fine."

# Digging in — restates, adds nothing.
"No, \`any\` is bad practice. You should never use it."

# Good — engages with the actual trade-off.
"It would be simpler right now, yes. My worry is that \`any\`
 spreads — everything derived from it is unchecked too, so one
 \`any\` at a boundary can quietly untype a whole feature, and
 nothing warns you.

 \`unknown\` gets the same simplicity at the boundary and forces
 one check at the point of use. If we're behind a deadline and
 this is throwaway, I'd take the \`any\` with a TODO. Is this
 code likely to stick around?"`,
          explanation:
            "The last answer concedes the interviewer's point, explains the specific mechanism it does not cover, offers a cheaper alternative, states the condition under which it would change its mind, and asks a question. That is what a productive disagreement looks like, and it is the same shape in a real code review.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When would you not use TypeScript?",
      answer:
        "A prototype with a known short life, a small script, a team with no TypeScript experience and a tight deadline, or a codebase whose dependencies are all untyped so you would spend the project writing declarations. The value scales with how long the code lives and how many people touch it. Answering \"never\" reads as inexperience — and it is worth adding that retrofitting types later is genuinely expensive, so it is a deliberate trade rather than a free deferral.",
    },
    {
      question: "How do you decide whether a type is too clever?",
      answer:
        "Ask whether it prevents a bug that is actually possible or enables a refactor that is actually likely. If neither, it is cost — code to read and errors to decipher. Typed parameters, discriminated unions and `unknown` at boundaries are always worth it. Conditional and recursive types are right where the type *is* the API, as in a published library, and usually overkill in application code. A type that takes ten minutes to understand costs more than the bug it prevents.",
    },
    {
      question: "How would you decide whether to add a dependency?",
      answer:
        "Weigh bundle size and the risk of maintaining code you did not write against how long it would take to build and maintain yourself, and how likely it is to be abandoned. `date-fns` for date arithmetic is worth it because dates are genuinely hard to get right. A 40KB package for `debounce` is not, because it is nine lines. Also worth checking: how many transitive dependencies it brings and whether it is actively maintained.",
    },
    {
      question: "What would you do if you disagreed with a technical decision on your team?",
      answer:
        "Find out what the other person is optimising for, because most disagreements are different weightings rather than different facts. State my reasoning and the specific risk I am worried about, propose the cheapest thing that addresses it, and say what would change my mind. If the decision goes the other way, commit to it properly rather than relitigating — and if it is genuinely risky, write down the concern so it can be revisited with evidence later.",
    },
  ],
  takeaways: [
    "Name the cost first, then the benefit, then what would change your mind, then the context",
    "\"Because it's better\" treats a decision as having a right answer, which is what the question is testing",
    "A type is worth its complexity if it prevents a possible bug or enables a likely refactor — otherwise it is cost",
    "Clever types belong where the type is the API; application code usually wants the boring version",
    "\"We'll add types later\" is a real trade-off but not a cheap one",
    "Answering \"I'd never do X\" reads as inexperience; name the conditions instead",
    "In a disagreement, ask what the other person is optimising for — most are weightings, not facts",
    "Updating your view out loud when someone is right is a strong signal, not a weak one",
  ],
  status: "available",
};
