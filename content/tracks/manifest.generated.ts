/**
 * GENERATED FILE — do not edit.
 *
 * Produced by `npm run manifest` from the curriculum in `content/tracks`.
 * `npm run verify` fails when this file and the tracks disagree.
 *
 * This is the curriculum with lesson bodies removed. Import it — through
 * `@/content/tracks/meta` — from anything that needs titles, counts,
 * durations or statuses, and import `@/content/tracks` only where a lesson's
 * sections are genuinely needed.
 */
import type { TrackMeta } from "./meta-types";

export const trackMetas: TrackMeta[] = [
  {
    "id": "dsa",
    "slug": "dsa",
    "title": "Data Structures & Algorithms",
    "shortTitle": "DSA",
    "tagline": "Modules 0 and 1 — from your first for-loop to naming the pattern on sight",
    "description": "Roadmap Modules 0 and 1, end to end. Built for two people: the one who has never written a for-loop, and the one who has read about every algorithm and still freezes on a blank editor. Module 0 starts at what a program is and does not assume a language — skip it in an afternoon if you already code. Then the framework: an explicit, repeatable method for taking an unseen problem apart, which is the step most courses skip and the reason their graduates still stare at problems. Then Module 1, linear structures then non-linear ones, every structure introduced with the patterns it enables and the problems those patterns solve. Then the grind — recognition drills, company-wise sheets, interview technique. Every problem comes with the brute force as well as the optimal solution, and every example can be read in any of the languages the track supports, so the algorithm is what you are learning rather than a dialect. You write your own in the browser and have it graded before you see either.",
    "order": 1,
    "status": "available",
    "accent": "dsa",
    "mode": "learn",
    "lessonMinutes": [
      25,
      45
    ],
    "interviewPrep": true,
    "runnable": false,
    "modules": [
      {
        "slug": "introduction-to-programming",
        "trackSlug": "dsa",
        "title": "Introduction to Programming",
        "description": "The ground floor, assumed by every course that starts at arrays and the reason people bounce off them. What a program actually is, what it does to memory, and how to turn a paragraph of English into code that runs.",
        "order": 1,
        "status": "available",
        "phase": "Module 0 · Programming Constructs",
        "lessons": [
          {
            "slug": "what-a-program-is",
            "moduleSlug": "introduction-to-programming",
            "title": "What a Program Actually Is",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "your-first-program",
            "moduleSlug": "introduction-to-programming",
            "title": "Your First Program",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "variables-and-values",
            "moduleSlug": "introduction-to-programming",
            "title": "Variables, Values & What They Cost",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "statements-and-expressions",
            "moduleSlug": "introduction-to-programming",
            "title": "Statements, Expressions & the Order Things Happen",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "comments-and-naming",
            "moduleSlug": "introduction-to-programming",
            "title": "Comments, Naming & Code You Can Read Tomorrow",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "errors-and-how-they-announce-themselves",
            "moduleSlug": "introduction-to-programming",
            "title": "Errors: Compile-Time, Runtime & the Silent One",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "reading-a-problem-statement",
            "moduleSlug": "introduction-to-programming",
            "title": "Reading a Problem Statement",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "testing-and-debugging-by-hand",
            "moduleSlug": "introduction-to-programming",
            "title": "Testing & Debugging Before You Have Any Tooling",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "your-solving-language",
        "trackSlug": "dsa",
        "title": "Your Solving Language",
        "description": "Pick one language and stop fighting it. The same twelve operations in whichever you chose, the places it will quietly betray you — silent overflow, truncating division, a string built in a loop — and the template you start every problem from. The traps are language-specific; the list of things you must be able to do is not.",
        "order": 2,
        "status": "available",
        "phase": "Module 0 · Programming Constructs",
        "lessons": [
          {
            "slug": "choosing-your-language",
            "moduleSlug": "your-solving-language",
            "title": "Choosing One, and Stopping the Argument",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "overflow-division-and-ceilings",
            "moduleSlug": "your-solving-language",
            "title": "Overflow, Division & the Ceiling That Is Not a Ceiling",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "strings-and-the-quadratic-trap",
            "moduleSlug": "your-solving-language",
            "title": "Strings, Immutability & the Quadratic Trap",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "collections-mapped-across",
            "moduleSlug": "your-solving-language",
            "title": "Collections, Mapped Onto Each Other",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "iteration-idioms",
            "moduleSlug": "your-solving-language",
            "title": "Iteration Idioms & Mutating While You Iterate",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "sorting-with-a-comparator",
            "moduleSlug": "your-solving-language",
            "title": "Sorting by Something Other Than the Value",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "fast-input-and-output",
            "moduleSlug": "your-solving-language",
            "title": "Fast Input & Output, and When It Matters",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-starter-template",
            "moduleSlug": "your-solving-language",
            "title": "The Template You Type From Muscle Memory",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "input-output-and-data-types",
        "trackSlug": "dsa",
        "title": "Input, Output & Data Types",
        "description": "Getting data in and answers out — and the fixed-width types that will lie to you the first time a number gets large.",
        "order": 3,
        "status": "available",
        "phase": "Module 0 · Programming Constructs",
        "lessons": [
          {
            "slug": "reading-input",
            "moduleSlug": "input-output-and-data-types",
            "title": "Reading Input Correctly",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "printing-and-formatting",
            "moduleSlug": "input-output-and-data-types",
            "title": "Printing & Formatting",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "integer-types-and-ranges",
            "moduleSlug": "input-output-and-data-types",
            "title": "Integer Types, Ranges & Silent Wrapping",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "floating-point",
            "moduleSlug": "input-output-and-data-types",
            "title": "Floating Point: Why 0.1 + 0.2 Is Not 0.3",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "characters-ascii-and-unicode",
            "moduleSlug": "input-output-and-data-types",
            "title": "Characters, ASCII & Arithmetic on Letters",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "booleans-null-and-truthiness",
            "moduleSlug": "input-output-and-data-types",
            "title": "Booleans, Null & the Truthiness Traps",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "type-conversion",
            "moduleSlug": "input-output-and-data-types",
            "title": "Type Conversion: Widening, Casting & Parsing",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "arbitrary-precision-integers",
            "moduleSlug": "input-output-and-data-types",
            "title": "Arbitrary Precision, and Java's BigInteger",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "operators-and-expressions",
        "trackSlug": "dsa",
        "title": "Operators & Expressions",
        "description": "Eight lines of syntax that look obvious and produce a surprising share of all wrong answers — integer division, negative modulo, and comparing objects when you meant values.",
        "order": 4,
        "status": "available",
        "phase": "Module 0 · Programming Constructs",
        "lessons": [
          {
            "slug": "arithmetic-operators",
            "moduleSlug": "operators-and-expressions",
            "title": "The Arithmetic Operators",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-modulo-operator",
            "moduleSlug": "operators-and-expressions",
            "title": "Modulo, and What It Is Actually For",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "comparison-and-equality",
            "moduleSlug": "operators-and-expressions",
            "title": "Comparison & Equality",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "logical-operators",
            "moduleSlug": "operators-and-expressions",
            "title": "Logical Operators & Short-Circuiting",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "assignment-and-increment",
            "moduleSlug": "operators-and-expressions",
            "title": "Assignment, Compound Assignment & Increment",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "bitwise-operators",
            "moduleSlug": "operators-and-expressions",
            "title": "Bitwise Operators, First Look",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "precedence-and-associativity",
            "moduleSlug": "operators-and-expressions",
            "title": "Precedence, Associativity & When to Stop Memorising",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-ternary-operator",
            "moduleSlug": "operators-and-expressions",
            "title": "The Ternary Operator, and Where It Helps",
            "estimatedMinutes": 15,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "conditional-statements-and-loops",
        "trackSlug": "dsa",
        "title": "Conditional Statements & Loops",
        "description": "Branching and repetition, which between them are most of programming — plus the loop invariant, the one idea that turns a loop you hope is right into one you can prove is.",
        "order": 5,
        "status": "available",
        "phase": "Module 0 · Programming Constructs",
        "lessons": [
          {
            "slug": "if-else-and-overlapping-conditions",
            "moduleSlug": "conditional-statements-and-loops",
            "title": "if, else if, else — and Conditions That Overlap",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "switch-and-match",
            "moduleSlug": "conditional-statements-and-loops",
            "title": "switch, match & the Fall-Through",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "three-kinds-of-loop",
            "moduleSlug": "conditional-statements-and-loops",
            "title": "while, do-while & for: One Loop, Three Spellings",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-loop-invariant",
            "moduleSlug": "conditional-statements-and-loops",
            "title": "The Loop Invariant",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "break-continue-and-nested-exits",
            "moduleSlug": "conditional-statements-and-loops",
            "title": "break, continue & Getting Out of Nested Loops",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "nested-loops-and-what-they-cost",
            "moduleSlug": "conditional-statements-and-loops",
            "title": "Nested Loops & What Each Level Costs",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "off-by-one-and-the-fence-post",
            "moduleSlug": "conditional-statements-and-loops",
            "title": "Off-by-One Errors & the Fence-Post Problem",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "infinite-loops",
            "moduleSlug": "conditional-statements-and-loops",
            "title": "Infinite Loops: On Purpose, and by Accident",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "pattern-printing-problems",
        "trackSlug": "dsa",
        "title": "Pattern Printing Problems",
        "description": "Pyramids, diamonds and Floyd's triangle. Not algorithm patterns — those are Module 1 — but the classic nested-loop drill, and the fastest way to make loop bounds something you derive rather than guess, because the screen tells you instantly when you are wrong.",
        "order": 6,
        "status": "available",
        "phase": "Module 0 · Programming Constructs",
        "lessons": [
          {
            "slug": "why-pattern-printing",
            "moduleSlug": "pattern-printing-problems",
            "title": "Why This Drill, and the Method That Solves All of Them",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "rectangles-and-right-triangles",
            "moduleSlug": "pattern-printing-problems",
            "title": "Rectangles & Right Triangles",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "pyramids-and-diamonds",
            "moduleSlug": "pattern-printing-problems",
            "title": "Pyramids & Diamonds",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "number-patterns",
            "moduleSlug": "pattern-printing-problems",
            "title": "Number Patterns, Floyd's & Pascal's Triangle",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "character-patterns",
            "moduleSlug": "pattern-printing-problems",
            "title": "Character Patterns",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "hollow-patterns",
            "moduleSlug": "pattern-printing-problems",
            "title": "Hollow Patterns & Turning a Border Into a Condition",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "a-method-for-any-pattern",
            "moduleSlug": "pattern-printing-problems",
            "title": "A Method for Any Pattern",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "from-patterns-to-grids",
            "moduleSlug": "pattern-printing-problems",
            "title": "From Patterns to Grids",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "functions-and-the-call-stack",
        "trackSlug": "dsa",
        "title": "Functions & the Call Stack",
        "description": "How a program is broken into pieces, and what the machine does when one piece calls another — the mental model that recursion, in Module 1, is built directly on top of.",
        "order": 7,
        "status": "available",
        "phase": "Module 0 · Programming Constructs",
        "lessons": [
          {
            "slug": "defining-functions",
            "moduleSlug": "functions-and-the-call-stack",
            "title": "Defining a Function",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "scope-and-shadowing",
            "moduleSlug": "functions-and-the-call-stack",
            "title": "Scope, Shadowing & How Long a Variable Lives",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "pass-by-value-and-references",
            "moduleSlug": "functions-and-the-call-stack",
            "title": "Pass by Value, Pass by Reference & What Actually Happens",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-call-stack",
            "moduleSlug": "functions-and-the-call-stack",
            "title": "The Call Stack",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "overloading-and-default-arguments",
            "moduleSlug": "functions-and-the-call-stack",
            "title": "Overloading, Defaults & Variable Arguments",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "pure-functions-and-side-effects",
            "moduleSlug": "functions-and-the-call-stack",
            "title": "Pure Functions & Side Effects",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "your-first-recursion",
            "moduleSlug": "functions-and-the-call-stack",
            "title": "Your First Recursion",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "stack-overflow",
            "moduleSlug": "functions-and-the-call-stack",
            "title": "Stack Overflow: Causing One, Reading It, Fixing It",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "arrays-and-strings-hands-on",
        "trackSlug": "dsa",
        "title": "1D Arrays & String Implementation",
        "description": "The first real data structure, and the one every later structure is built out of. Hands-on and mechanical: the loops you will write a thousand times, until writing them takes no thought at all.",
        "order": 8,
        "status": "available",
        "phase": "Module 0 · Programming Constructs",
        "lessons": [
          {
            "slug": "declaring-and-traversing",
            "moduleSlug": "arrays-and-strings-hands-on",
            "title": "Declaring, Initialising & Traversing an Array",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "indexing-and-bounds",
            "moduleSlug": "arrays-and-strings-hands-on",
            "title": "Indexing, Bounds & Slicing",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "fixed-and-dynamic-arrays",
            "moduleSlug": "arrays-and-strings-hands-on",
            "title": "Fixed Arrays, Dynamic Arrays & Why Doubling Works",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "one-pass-scans",
            "moduleSlug": "arrays-and-strings-hands-on",
            "title": "Searching, Summing & Finding the Best in One Pass",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "reversing-rotating-and-shifting",
            "moduleSlug": "arrays-and-strings-hands-on",
            "title": "Reversing, Rotating & Shifting In Place",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "strings-as-sequences",
            "moduleSlug": "arrays-and-strings-hands-on",
            "title": "Strings as Sequences of Characters",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "building-strings",
            "moduleSlug": "arrays-and-strings-hands-on",
            "title": "Building a String Without the Quadratic Trap",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-string-operations-worth-knowing",
            "moduleSlug": "arrays-and-strings-hands-on",
            "title": "The String Operations Worth Knowing Cold",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "number-systems-and-maths",
        "trackSlug": "dsa",
        "title": "Number Systems & Mathematical Foundations",
        "description": "How numbers are written, how they are stored, and the handful of number-theory facts that show up constantly in problems — including the two representations that lie to you, fixed-width integers and floating point.",
        "order": 9,
        "status": "available",
        "phase": "Module 0 · Programming Constructs",
        "lessons": [
          {
            "slug": "number-bases",
            "moduleSlug": "number-systems-and-maths",
            "title": "Decimal, Binary, Octal & Hexadecimal",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "twos-complement-and-integer-limits",
            "moduleSlug": "number-systems-and-maths",
            "title": "Two's Complement & Integer Limits",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "digit-manipulation",
            "moduleSlug": "number-systems-and-maths",
            "title": "Extracting & Rebuilding Digits",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "divisors-and-primes",
            "moduleSlug": "number-systems-and-maths",
            "title": "Divisors, Primes & the √n Insight",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "gcd-lcm-and-euclid",
            "moduleSlug": "number-systems-and-maths",
            "title": "GCD, LCM & Euclid's Algorithm",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "powers-factorials-and-overflow",
            "moduleSlug": "number-systems-and-maths",
            "title": "Powers, Factorials & Where They Overflow",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "modular-arithmetic",
            "moduleSlug": "number-systems-and-maths",
            "title": "Modular Arithmetic & 10⁹ + 7",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "floating-point-and-epsilon",
            "moduleSlug": "number-systems-and-maths",
            "title": "Floating Point, Epsilon & When Not to Use Doubles",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "introduction-to-data-structures",
        "trackSlug": "dsa",
        "title": "Introduction to Data Structures",
        "description": "The survey before the deep dive: what every structure costs, what each one is for, and how to pick one from the operations a problem needs rather than from memory.",
        "order": 10,
        "status": "available",
        "phase": "Module 0 · Programming Constructs",
        "lessons": [
          {
            "slug": "what-a-data-structure-is",
            "moduleSlug": "introduction-to-data-structures",
            "title": "What a Data Structure Actually Is",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-map-of-data-structures",
            "moduleSlug": "introduction-to-data-structures",
            "title": "The Map of Data Structures",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "dynamic-arrays",
            "moduleSlug": "introduction-to-data-structures",
            "title": "Dynamic Arrays: The Default Structure",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "hash-maps-and-sets",
            "moduleSlug": "introduction-to-data-structures",
            "title": "Hash Maps & Hash Sets",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "what-makes-a-valid-key",
            "moduleSlug": "introduction-to-data-structures",
            "title": "What Makes a Valid Key",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "stacks-queues-and-deques",
            "moduleSlug": "introduction-to-data-structures",
            "title": "Stacks, Queues & Deques",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "heaps-and-priority-queues",
            "moduleSlug": "introduction-to-data-structures",
            "title": "Heaps & Priority Queues",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "ordered-structures-and-choosing",
            "moduleSlug": "introduction-to-data-structures",
            "title": "Ordered Structures & Choosing One",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "time-and-space-complexity",
        "trackSlug": "dsa",
        "title": "Time & Space Complexity",
        "description": "The vocabulary every later module borrows: how to count work, how to name the growth rate, and how to read a problem's constraints backwards into the solution it expects.",
        "order": 11,
        "status": "available",
        "phase": "Module 0 · Programming Constructs",
        "lessons": [
          {
            "slug": "counting-operations",
            "moduleSlug": "time-and-space-complexity",
            "title": "Counting Operations",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "big-o-theta-and-omega",
            "moduleSlug": "time-and-space-complexity",
            "title": "Big-O, Θ and Ω",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "reading-complexity-off-code",
            "moduleSlug": "time-and-space-complexity",
            "title": "Reading Complexity Off Code",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "amortised-analysis",
            "moduleSlug": "time-and-space-complexity",
            "title": "Amortised Analysis",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "recursion-and-recurrences",
            "moduleSlug": "time-and-space-complexity",
            "title": "Recursion & Recurrences",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "space-complexity",
            "moduleSlug": "time-and-space-complexity",
            "title": "Space Complexity & the Call Stack",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-complexities-worth-memorising",
            "moduleSlug": "time-and-space-complexity",
            "title": "The Complexities Worth Memorising",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "reading-constraints-backwards",
            "moduleSlug": "time-and-space-complexity",
            "title": "Reading Constraints Backwards",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "the-framework",
        "trackSlug": "dsa",
        "title": "The Framework: From Statement to First Line of Code",
        "description": "The module most courses do not have, and the reason their graduates still freeze. A repeatable seven-step method for taking apart a problem you have never seen: restate it, work it by hand, write the brute force, read the constraints backwards to a target complexity, let the dominant operation choose the structure, match the shape to a pattern, and only then write code. Six of the seven steps happen before you type anything. It ends by running all seven, from cold, on a problem that appears nowhere else in this track.",
        "order": 12,
        "status": "available",
        "phase": "Bridge · The Problem-Solving Framework",
        "lessons": [
          {
            "slug": "why-you-freeze",
            "moduleSlug": "the-framework",
            "title": "Why You Freeze, and What to Do Instead",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "restate-and-represent",
            "moduleSlug": "the-framework",
            "title": "Steps 1 & 2 — Restate It, Then Work It By Hand",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "always-write-the-brute-force",
            "moduleSlug": "the-framework",
            "title": "Step 3 — Always Write the Brute Force",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "reading-the-constraints",
            "moduleSlug": "the-framework",
            "title": "Step 4 — Read the Constraints Backwards to the Answer",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "choosing-the-data-structure",
            "moduleSlug": "the-framework",
            "title": "Step 5 — Let the Dominant Operation Choose the Structure",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "choosing-the-pattern",
            "moduleSlug": "the-framework",
            "title": "Step 6 — Match the Shape, Name the Pattern",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "only-now-write-the-code",
            "moduleSlug": "the-framework",
            "title": "Step 7 — Only Now, Write the Code",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "the-framework-end-to-end",
            "moduleSlug": "the-framework",
            "title": "All Seven Steps, on a Problem You Have Not Seen",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "arrays-and-strings",
        "trackSlug": "dsa",
        "title": "Arrays, Strings & Working In Place",
        "description": "The structures every other one is built out of, revisited as things algorithms are made of rather than things to loop over. Why indexing is genuinely constant-time and why two loops with identical complexity can differ seventeenfold; the counting and canonical-form moves that solve most string problems; and then the in-place family — compaction, reversal and rotation, matrix work, one-pass partitioning, and the cyclic sort that turns a whole class of missing-number problems into a two-line loop.",
        "order": 13,
        "status": "available",
        "phase": "Module 1 · Linear DSA",
        "lessons": [
          {
            "slug": "arrays-in-memory",
            "moduleSlug": "arrays-and-strings",
            "title": "Arrays in Memory & Why Locality Matters",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "strings-at-problem-scale",
            "moduleSlug": "arrays-and-strings",
            "title": "Strings at Problem Scale: Frequency & Canonical Form",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-read-pointer-and-the-write-pointer",
            "moduleSlug": "arrays-and-strings",
            "title": "The Read Pointer & the Write Pointer",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "reversal-rotation-and-the-cycles-underneath",
            "moduleSlug": "arrays-and-strings",
            "title": "Reversal, Rotation & the Cycles Underneath",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "matrices-transposition-and-rotation",
            "moduleSlug": "arrays-and-strings",
            "title": "Matrices: Transposition, Rotation & Marking In Place",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "spiral-order-and-shrinking-boundaries",
            "moduleSlug": "arrays-and-strings",
            "title": "Spiral Order & Shrinking Boundaries",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "one-pass-partitioning",
            "moduleSlug": "arrays-and-strings",
            "title": "One-Pass Partitioning & the Dutch National Flag",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "cyclic-sort-and-the-missing-number-family",
            "moduleSlug": "arrays-and-strings",
            "title": "Cyclic Sort & the Missing-Number Family",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "bit-manipulation-and-math",
        "trackSlug": "dsa",
        "title": "Bit Manipulation, Math & Number Theory",
        "description": "The two areas that feel like trivia until the problem in front of you is one of them — and then nothing else will do. Bits reframed as a set, so that `n ≤ 20` stops being a constraint and starts being an instruction; XOR's three identities and the family of problems they collapse into one loop; subset enumeration and the 3^n bound that makes it feasible. Then the number theory an interview actually reaches for: Euclid, sieves and factorisation, modular arithmetic with fast exponentiation and inverses, nCr under a prime modulus — and finally overflow, which is where a correct Python solution goes wrong on the way to Java.",
        "order": 14,
        "status": "available",
        "phase": "Module 1 · Linear DSA",
        "lessons": [
          {
            "slug": "bits-as-a-set",
            "moduleSlug": "bit-manipulation-and-math",
            "title": "Bits as a Set",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "xor-and-the-problems-it-solves",
            "moduleSlug": "bit-manipulation-and-math",
            "title": "XOR, and the Problems It Solves",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "enumerating-subsets",
            "moduleSlug": "bit-manipulation-and-math",
            "title": "Enumerating Subsets Efficiently",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "gcd-lcm-and-the-euclidean-algorithm",
            "moduleSlug": "bit-manipulation-and-math",
            "title": "GCD, LCM & the Euclidean Algorithm",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "primes-sieves-and-factorisation",
            "moduleSlug": "bit-manipulation-and-math",
            "title": "Primes: the Sieve, Factorisation & Divisor Counting",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "modular-arithmetic-and-fast-exponentiation",
            "moduleSlug": "bit-manipulation-and-math",
            "title": "Modular Arithmetic, Fast Exponentiation & Inverses",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "combinatorics-under-a-modulus",
            "moduleSlug": "bit-manipulation-and-math",
            "title": "Combinatorics: nCr Under a Modulus",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "overflow-and-pythons-integers",
            "moduleSlug": "bit-manipulation-and-math",
            "title": "Overflow, and Python's Integers Against Everyone Else's",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "binary-search",
        "trackSlug": "dsa",
        "title": "Binary Search & Binary Search on the Answer",
        "description": "The most-failed easy question there is, and then the technique that quietly solves a whole family of hard ones. The two loop conventions and why mixing them is where every off-by-one comes from; the boundary searches that answer \"first\", \"last\" and \"how many\"; the rotated and matrix variants; and then the reframe that matters most — searching the range of possible answers rather than the input, which turns \"minimise the maximum\" into the same twelve lines. Ends on real-valued precision, binary search as the inner step of a larger algorithm, and a peak-finding problem with no sorted input at all.",
        "order": 15,
        "status": "available",
        "phase": "Module 1 · Linear DSA",
        "lessons": [
          {
            "slug": "writing-binary-search-correctly",
            "moduleSlug": "binary-search",
            "title": "Writing It Correctly",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "lower-bound-and-upper-bound",
            "moduleSlug": "binary-search",
            "title": "Lower Bound, Upper Bound & Duplicates",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "rotated-arrays-matrices-and-unbounded-input",
            "moduleSlug": "binary-search",
            "title": "Rotated Arrays, Matrices & Unbounded Input",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "binary-search-on-the-answer",
            "moduleSlug": "binary-search",
            "title": "Binary Search on the Answer",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "real-valued-answers-and-precision",
            "moduleSlug": "binary-search",
            "title": "Real-Valued Answers & Precision",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "binary-search-inside-other-algorithms",
            "moduleSlug": "binary-search",
            "title": "Binary Search Inside Other Algorithms",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "peak-finding-without-sorted-input",
            "moduleSlug": "binary-search",
            "title": "Peak Finding: Binary Search Without Sorted Input",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "the-binary-search-sheet",
            "moduleSlug": "binary-search",
            "title": "The Sheet: Recognising Which Variant",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "two-pointers",
        "trackSlug": "dsa",
        "title": "Two Pointers",
        "description": "The first pattern that turns an O(n²) loop into an O(n) one, and the exchange argument that proves it is allowed to. Converging pointers on sorted input and the proof that a move discards nothing needed; the same-direction read/write pair behind every in-place filter; the lag and speed variants that find a midpoint or a cycle without a length. Then what sorting costs you, the three duplicate skips that make 3Sum correct without a set, three-way partitioning, and the inward and outward walks that solve the string problems.",
        "order": 16,
        "status": "available",
        "phase": "Module 1 · Linear DSA",
        "lessons": [
          {
            "slug": "opposite-ends-and-the-invariant",
            "moduleSlug": "two-pointers",
            "title": "Opposite Ends & the Invariant",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "proving-a-pointer-move-is-safe",
            "moduleSlug": "two-pointers",
            "title": "Proving a Pointer Move Is Safe",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "same-direction-read-write-and-lag",
            "moduleSlug": "two-pointers",
            "title": "Same Direction: Read/Write, Fast/Slow & Lag",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "sorting-first-and-what-it-costs",
            "moduleSlug": "two-pointers",
            "title": "Sorting First, and What It Costs",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "duplicates-and-k-sum",
            "moduleSlug": "two-pointers",
            "title": "Duplicates & k-Sum",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "three-pointers-and-partitioning",
            "moduleSlug": "two-pointers",
            "title": "Three Pointers & Partitioning",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "two-pointers-on-strings",
            "moduleSlug": "two-pointers",
            "title": "Two Pointers on Strings",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "the-two-pointer-sheet",
            "moduleSlug": "two-pointers",
            "title": "The Sheet: Which Pointer Shape",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "sliding-windows",
        "trackSlug": "dsa",
        "title": "Sliding Windows",
        "description": "\"Longest or shortest contiguous stretch such that…\" — one shape, a dozen problems, and one condition that decides whether it applies at all. Fixed windows and the one-in-one-out update; the grow-right shrink-left skeleton and the amortised argument that keeps a nested loop linear; and then the monotonicity requirement, demonstrated failing on a single negative number so that you can rule the pattern out rather than trust it. Then the at-most-k subtraction that rescues \"exactly k\", minimum window substring worked slowly, and the deque you need when the state is a maximum rather than a sum.",
        "order": 17,
        "status": "available",
        "phase": "Module 1 · Linear DSA",
        "lessons": [
          {
            "slug": "fixed-size-windows",
            "moduleSlug": "sliding-windows",
            "title": "Fixed-Size Windows: One In, One Out",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "variable-size-windows",
            "moduleSlug": "sliding-windows",
            "title": "Variable-Size Windows: Grow Right, Shrink Left",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "the-monotonicity-condition",
            "moduleSlug": "sliding-windows",
            "title": "The Condition That Decides Whether It Applies",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "at-most-k-and-the-exactly-k-trick",
            "moduleSlug": "sliding-windows",
            "title": "At Most K, and the Exactly-K Trick",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "choosing-the-window-state",
            "moduleSlug": "sliding-windows",
            "title": "Choosing the Window State",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "minimum-window-substring",
            "moduleSlug": "sliding-windows",
            "title": "Minimum Window Substring",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "when-the-state-needs-more-than-a-counter",
            "moduleSlug": "sliding-windows",
            "title": "When the State Needs More Than a Counter",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "the-sliding-window-sheet",
            "moduleSlug": "sliding-windows",
            "title": "The Sheet: Recognising a Window",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "prefix-sums-and-range-queries",
        "trackSlug": "dsa",
        "title": "Prefix Sums & Range Queries",
        "description": "Precompute once, answer forever — and the hash-map pairing that finds subarrays a window cannot. The prefix array and the leading zero that removes an edge case from every query; then the identity `prefix[i] = prefix[j] - k`, which counts subarrays with an exact sum in one pass and does not care about negative numbers. Difference arrays for the mirror problem of many range updates; two-dimensional tables and the fix-two-rows collapse that reduces a 2D problem to a 1D one; which aggregates can be prefixed at all and what to use when they cannot; and finally the two questions that decide between this module and the last one.",
        "order": 18,
        "status": "available",
        "phase": "Module 1 · Linear DSA",
        "lessons": [
          {
            "slug": "the-prefix-array-and-the-leading-zero",
            "moduleSlug": "prefix-sums-and-range-queries",
            "title": "The Prefix Array & the Leading Zero",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "prefix-sums-with-a-hash-map",
            "moduleSlug": "prefix-sums-and-range-queries",
            "title": "Prefix Sums with a Hash Map",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "difference-arrays-and-range-updates",
            "moduleSlug": "prefix-sums-and-range-queries",
            "title": "Difference Arrays & Range Updates",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "which-aggregates-prefix",
            "moduleSlug": "prefix-sums-and-range-queries",
            "title": "Which Aggregates Prefix, and Which Do Not",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "two-dimensional-prefix-sums",
            "moduleSlug": "prefix-sums-and-range-queries",
            "title": "Two-Dimensional Prefix Sums",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "when-the-array-changes",
            "moduleSlug": "prefix-sums-and-range-queries",
            "title": "When the Array Changes",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "window-or-prefix",
            "moduleSlug": "prefix-sums-and-range-queries",
            "title": "Window or Prefix? The Problems That Look Alike",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-prefix-sum-sheet",
            "moduleSlug": "prefix-sums-and-range-queries",
            "title": "The Sheet: Prefix Problems",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "recursion-and-backtracking",
        "trackSlug": "dsa",
        "title": "Recursion & Backtracking",
        "description": "The mental model everything after this depends on. How to trust a recursive call rather than trace it, how to read a recursion tree's cost off its shape, and where the call stack actually runs out. Then backtracking's one template — choose, explore, un-choose — applied to subsets, permutations and combinations, with duplicates handled by skipping rather than by a set. Pruning is given its own lesson because it is the difference between a search that finishes and one that does not: the same N-queens search, pruned, visits nine thousand times fewer nodes at n=8. Ends on the bridge to dynamic programming, which is a correct recursion plus a cache.",
        "order": 19,
        "status": "available",
        "phase": "Module 1 · Linear DSA",
        "lessons": [
          {
            "slug": "the-base-case-and-the-leap-of-faith",
            "moduleSlug": "recursion-and-backtracking",
            "title": "The Base Case & the Leap of Faith",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-call-stack-and-converting-to-iteration",
            "moduleSlug": "recursion-and-backtracking",
            "title": "The Call Stack & Converting to Iteration",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "choose-explore-un-choose",
            "moduleSlug": "recursion-and-backtracking",
            "title": "Backtracking: Choose, Explore, Un-choose",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "pruning-and-constraint-problems",
            "moduleSlug": "recursion-and-backtracking",
            "title": "Pruning & Constraint Problems",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "divide-and-conquer-as-a-shape",
            "moduleSlug": "recursion-and-backtracking",
            "title": "Divide and Conquer as a Shape",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "subsets-permutations-and-combinations",
            "moduleSlug": "recursion-and-backtracking",
            "title": "Subsets, Permutations & Combinations",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "from-recursion-to-memoisation",
            "moduleSlug": "recursion-and-backtracking",
            "title": "From Recursion to Memoisation",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "the-recursion-sheet",
            "moduleSlug": "recursion-and-backtracking",
            "title": "The Sheet: Recursion & Backtracking",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "hashing",
        "trackSlug": "dsa",
        "title": "Hashing: Maps, Sets & Frequency",
        "description": "The structure that collapses a nested loop into a single pass more often than any other, and the reason its O(1) carries an asterisk. Starts with what a hash map actually is — an array plus a function from key to index — then spends a full lesson on the worst case, because average-case O(1) is a statement about how keys spread rather than a promise, and it can be broken deliberately. The rest is the four moves that recur: check the complement before you insert, count and then decide, group by a canonical key, and pair prefix sums with a map when values can go negative and a sliding window cannot. Ends by drawing the line where hashing stops — every question about order needs a different structure.",
        "order": 20,
        "status": "available",
        "phase": "Module 1 · Linear DSA",
        "lessons": [
          {
            "slug": "buckets-hashes-and-load-factor",
            "moduleSlug": "hashing",
            "title": "What a Hash Map Actually Is",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "why-o1-is-average-not-worst-case",
            "moduleSlug": "hashing",
            "title": "The Asterisk on O(1)",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-complement-pattern",
            "moduleSlug": "hashing",
            "title": "The Complement Pattern",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "frequency-counting",
            "moduleSlug": "hashing",
            "title": "Frequency Counting",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "grouping-by-a-derived-key",
            "moduleSlug": "hashing",
            "title": "Grouping by a Derived Key",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "hashing-your-own-types",
            "moduleSlug": "hashing",
            "title": "Hashing Your Own Types",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "prefix-sums-meet-hash-maps",
            "moduleSlug": "hashing",
            "title": "Prefix Sums Meet Hash Maps",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "when-a-sorted-structure-wins",
            "moduleSlug": "hashing",
            "title": "When a Sorted Structure Wins, and the Sheet",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "sorting",
        "trackSlug": "dsa",
        "title": "Sorting",
        "description": "A tool rather than a topic. You will rarely implement one and constantly rely on one — so this is mostly about what your language's sort really is and when order is the whole solution. Covers the four algorithms worth knowing and what each is actually good at, the n log n lower bound and the counting sorts that escape it by not comparing, stability and the multi-key sorting that depends on it, and the comparator contract that `a - b` quietly violates. Ends where sorting matters most: as preprocessing, where one log factor buys adjacency, monotonicity and a provable greedy order — and on the problems where reaching for a sort is the trap.",
        "order": 21,
        "status": "available",
        "phase": "Module 1 · Linear DSA",
        "lessons": [
          {
            "slug": "the-sorts-worth-knowing",
            "moduleSlug": "sorting",
            "title": "The Sorts Worth Knowing",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-n-log-n-lower-bound",
            "moduleSlug": "sorting",
            "title": "The n log n Lower Bound",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "stability-and-when-it-matters",
            "moduleSlug": "sorting",
            "title": "Stability, and When It Silently Matters",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "what-your-library-sort-actually-is",
            "moduleSlug": "sorting",
            "title": "What Your Library Sort Actually Is",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "comparators-and-the-contract",
            "moduleSlug": "sorting",
            "title": "Comparators and the Contract",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "counting-bucket-and-radix",
            "moduleSlug": "sorting",
            "title": "Counting, Bucket and Radix",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "sorting-as-preprocessing",
            "moduleSlug": "sorting",
            "title": "Sorting as Preprocessing",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-sheet-sorting",
            "moduleSlug": "sorting",
            "title": "The Sheet: Where Sorting Is the Whole Idea",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "linked-lists",
        "trackSlug": "dsa",
        "title": "Linked Lists",
        "description": "Rarely the right structure in production, permanently popular in interviews — because pointer manipulation is where sloppy reasoning shows up immediately. Starts by being honest about the trade: O(1) insertion is conditional on already holding the position, and cache locality means the array usually wins anyway. Then the five moves everything else is built from — the dummy head that deletes half your edge cases, reversal in both forms, fast and slow pointers with Floyd's cycle-start argument worked through, merging, and the two-chain build. Ends on the LRU cache, the problem that justifies the doubly linked list, and a sheet with the habit that stops pointer code from going wrong.",
        "order": 22,
        "status": "available",
        "phase": "Module 1 · Linear DSA",
        "lessons": [
          {
            "slug": "the-shape-and-the-real-cost",
            "moduleSlug": "linked-lists",
            "title": "The Shape, and the Real Cost",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-dummy-head",
            "moduleSlug": "linked-lists",
            "title": "The Dummy Head",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "reversal-iteratively-and-recursively",
            "moduleSlug": "linked-lists",
            "title": "Reversal",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "fast-and-slow-pointers",
            "moduleSlug": "linked-lists",
            "title": "Fast and Slow Pointers",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "merging-partitioning-and-sorting",
            "moduleSlug": "linked-lists",
            "title": "Merging, Partitioning and Sorting",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-lru-cache",
            "moduleSlug": "linked-lists",
            "title": "The LRU Cache",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "problems-that-rewire",
            "moduleSlug": "linked-lists",
            "title": "Problems That Rewire",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-sheet-linked-lists",
            "moduleSlug": "linked-lists",
            "title": "The Sheet, and How to Not Get Lost",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "stacks-and-queues",
        "trackSlug": "dsa",
        "title": "Stacks, Queues & Monotonic Structures",
        "description": "Two structures with one rule each — and the monotonic variants that answer \"the next element greater than this one\" for every index in linear time. Starts with recognising nesting, which is the real skill, since the stack itself is three method calls. Then the queue and the implementation detail that decides whether it is O(1) or quietly quadratic, and the amortised argument that the two-stack queue demonstrates most cleanly. The monotonic stack and deque are given three lessons between them, including Largest Rectangle worked through in full, because that one problem is the key to the whole family. Ends on augmentation — storing the answer beside the data — which is the idea behind every advanced structure later in this track.",
        "order": 23,
        "status": "available",
        "phase": "Module 1 · Linear DSA",
        "lessons": [
          {
            "slug": "the-stack-and-nesting",
            "moduleSlug": "stacks-and-queues",
            "title": "The Stack, and Problems That Are Secretly About Nesting",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "queues-deques-and-ring-buffers",
            "moduleSlug": "stacks-and-queues",
            "title": "Queues, Deques and Ring Buffers",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-monotonic-stack",
            "moduleSlug": "stacks-and-queues",
            "title": "The Monotonic Stack",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "largest-rectangle-and-its-family",
            "moduleSlug": "stacks-and-queues",
            "title": "Largest Rectangle, and Its Family",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-monotonic-deque",
            "moduleSlug": "stacks-and-queues",
            "title": "The Monotonic Deque",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "min-stack-and-augmenting",
            "moduleSlug": "stacks-and-queues",
            "title": "Min-Stack, and Augmenting a Structure",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "turning-recursion-into-a-stack",
            "moduleSlug": "stacks-and-queues",
            "title": "Turning Recursion Into a Stack",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-sheet-stacks-and-queues",
            "moduleSlug": "stacks-and-queues",
            "title": "The Sheet",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "trees",
        "trackSlug": "dsa",
        "title": "Trees & Binary Search Trees",
        "description": "Where recursion stops being a party trick. Traversals, the ordering invariant that makes a BST searchable, and the balancing that stops it degenerating into a linked list. The three depth-first orders are taught as one function with the visit line moved, because that is what tells you which one a problem needs — context carried down is pre-order, summaries returned up is post-order, and that single question settles most tree problems. A full lesson goes to validating a BST, since the obvious local check returns a wrong answer rather than a slow one. Ends on serialisation, which forces precision about what a traversal actually records and why in-order alone can never rebuild a tree.",
        "order": 24,
        "status": "available",
        "phase": "Module 1 · Non-linear DSA",
        "lessons": [
          {
            "slug": "shape-height-and-terminology",
            "moduleSlug": "trees",
            "title": "Shape, Height, and Why It Decides Everything",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "traversals-and-what-each-is-for",
            "moduleSlug": "trees",
            "title": "Traversals, and What Each One Is For",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "level-order-and-the-width-snapshot",
            "moduleSlug": "trees",
            "title": "Level-Order, and the Width Snapshot",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-bst-invariant",
            "moduleSlug": "trees",
            "title": "The BST Invariant",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "why-validating-a-bst-is-not-local",
            "moduleSlug": "trees",
            "title": "Why Validating a BST Is Not a Local Check",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "balancing-avl-red-black-and-your-treemap",
            "moduleSlug": "trees",
            "title": "Balancing: AVL, Red-Black, and What Your TreeMap Is",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "lowest-common-ancestor-and-paths",
            "moduleSlug": "trees",
            "title": "Lowest Common Ancestor, Diameter, and Paths",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "serialising-and-the-sheet",
            "moduleSlug": "trees",
            "title": "Serialising, Reconstructing, and the Sheet",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "heaps-and-priority-queues",
        "trackSlug": "dsa",
        "title": "Heaps & Priority Queues",
        "description": "The structure for \"the smallest thing so far\". A heap makes a much weaker promise than a search tree — a parent beats its children and nothing else is ordered — and that weakness is what buys an O(log n) repair with no rebalancing and an array with no pointers in it. The module starts from the invariant and the index arithmetic, then the two sifts, then the linear-time build that catches people out. In progress: lessons on top-K, the two-heap running median, k-way merge, when bucket sort wins outright, and heap-backed scheduling are still to come.",
        "order": 25,
        "status": "available",
        "phase": "Module 1 · Non-linear DSA",
        "lessons": [
          {
            "slug": "the-heap-property-and-the-array",
            "moduleSlug": "heaps-and-priority-queues",
            "title": "The Heap Property, and Why an Array Is the Right Home",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "sifting-and-building",
            "moduleSlug": "heaps-and-priority-queues",
            "title": "Sift Up, Sift Down, and the O(n) Build",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "the-priority-queue-api",
            "moduleSlug": "heaps-and-priority-queues",
            "title": "The Priority Queue API, and the Comparator That Decides Everything",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "top-k-and-the-heap-that-is-backwards",
            "moduleSlug": "heaps-and-priority-queues",
            "title": "Top-K, and Why the Heap Points the Wrong Way",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "the-two-heap-pattern",
            "moduleSlug": "heaps-and-priority-queues",
            "title": "Two Heaps, and the Running Median",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "k-way-merge",
            "moduleSlug": "heaps-and-priority-queues",
            "title": "K-Way Merge, and Merging More Than Fits",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "when-counting-beats-the-heap",
            "moduleSlug": "heaps-and-priority-queues",
            "title": "When Counting Beats the Heap Outright",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "scheduling-intervals-and-the-heap-sheet",
            "moduleSlug": "heaps-and-priority-queues",
            "title": "Scheduling, Intervals, and the Heap Sheet",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "greedy-algorithms",
        "trackSlug": "dsa",
        "title": "Greedy Algorithms",
        "description": "A strategy that is either optimal or badly wrong with nothing in between, so this module is mostly about proving which one you have. It starts where the difference is sharpest: the same three items and the same bag, greedy-optimal when they can be cut and wrong by 60 when they cannot. In progress: lessons on coin change and the greedy-against-DP decision are still to come.",
        "order": 26,
        "status": "available",
        "phase": "Module 1 · Non-linear DSA",
        "lessons": [
          {
            "slug": "the-greedy-choice-and-its-preconditions",
            "moduleSlug": "greedy-algorithms",
            "title": "The Greedy Choice, and the Two Things It Needs",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "proving-a-greedy-rule-correct",
            "moduleSlug": "greedy-algorithms",
            "title": "Proving It: The Exchange Argument",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "hunting-the-counterexample",
            "moduleSlug": "greedy-algorithms",
            "title": "Breaking It: Hunting the Counterexample",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "interval-scheduling-and-the-sort-key",
            "moduleSlug": "greedy-algorithms",
            "title": "Interval Scheduling, and the Sort Key That Solves It",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "merging-intervals-and-the-family-around-it",
            "moduleSlug": "greedy-algorithms",
            "title": "Merging Intervals, and the Family Around It",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "huffman-coding-built-from-a-heap",
            "moduleSlug": "greedy-algorithms",
            "title": "Huffman Coding, Built from a Heap",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "dynamic-programming-foundations",
        "trackSlug": "dsa",
        "title": "Dynamic Programming: Foundations",
        "description": "The technique people find hardest, taught the only way that works: start from a recursion you already believe, then make it fast. Memoisation before tabulation, always.",
        "order": 27,
        "status": "coming-soon",
        "phase": "Module 1 · Non-linear DSA",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "dynamic-programming-foundations",
            "title": "Dynamic Programming: Foundations — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "dynamic-programming-patterns",
        "trackSlug": "dsa",
        "title": "Dynamic Programming: The Patterns",
        "description": "The catalogue. Nine recognisable shapes covering the overwhelming majority of DP problems — the module that converts \"I understood the solution\" into \"I found the solution\".",
        "order": 28,
        "status": "coming-soon",
        "phase": "Module 1 · Non-linear DSA",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "dynamic-programming-patterns",
            "title": "Dynamic Programming: The Patterns — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "graphs",
        "trackSlug": "dsa",
        "title": "Graphs: Modelling, BFS & DFS",
        "description": "The most general structure here, and the one most real problems turn out to be. Two traversals cover a surprising share of everything.",
        "order": 29,
        "status": "coming-soon",
        "phase": "Module 1 · Non-linear DSA",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "graphs",
            "title": "Graphs: Modelling, BFS & DFS — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "graph-algorithms",
        "trackSlug": "dsa",
        "title": "Graph Algorithms: Shortest Paths, MST & Ordering",
        "description": "The named algorithms, each introduced by the problem that forced its invention — and the conditions under which each one is wrong.",
        "order": 30,
        "status": "coming-soon",
        "phase": "Module 1 · Non-linear DSA",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "graph-algorithms",
            "title": "Graph Algorithms: Shortest Paths, MST & Ordering — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "pattern-atlas-drills",
        "trackSlug": "dsa",
        "title": "The Pattern Atlas: Recognition Drills",
        "description": "Drills in which you are forbidden to write code. You read a statement and name the pattern, the structure and the target complexity — because that is the step you are actually missing, and practising it separately is the fastest way to fix it.",
        "order": 31,
        "status": "coming-soon",
        "phase": "Module 1 · The Grind",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "pattern-atlas-drills",
            "title": "The Pattern Atlas: Recognition Drills — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "the-sheet",
        "trackSlug": "dsa",
        "title": "The Sheet: Company-Wise & Topic-Wise Grind Plans",
        "description": "How to grind so that it compounds. Ordered sheets by topic, by pattern and by company, with a schedule that revisits rather than accumulates.",
        "order": 32,
        "status": "coming-soon",
        "phase": "Module 1 · The Grind",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "the-sheet",
            "title": "The Sheet: Company-Wise & Topic-Wise Grind Plans — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "interview-technique",
        "trackSlug": "dsa",
        "title": "Interview Technique: Thinking Out Loud",
        "description": "Knowing the algorithm and passing the interview are different skills. How to attack an unseen problem in front of somebody, and how to talk while you do it.",
        "order": 33,
        "status": "coming-soon",
        "phase": "Module 1 · The Grind",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "interview-technique",
            "title": "Interview Technique: Thinking Out Loud — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "algorithms-behind-gen-ai",
        "trackSlug": "dsa",
        "title": "The Data Structures & Algorithms Behind Gen AI",
        "description": "Everything in this track, applied to the systems everyone is now building on. A vector database is a graph search, tokenisation is a greedy merge over a frequency map, and sampling a token is a heap.",
        "order": 34,
        "status": "coming-soon",
        "phase": "Module 1 · The Grind",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "algorithms-behind-gen-ai",
            "title": "The Data Structures & Algorithms Behind Gen AI — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "advanced-data-structures",
        "trackSlug": "dsa",
        "title": "Advanced Data Structures",
        "description": "The structures that answer a question no simpler structure can answer fast — range queries, prefix queries, and dynamic connectivity.",
        "order": 35,
        "status": "coming-soon",
        "phase": "Electives · Advanced DSA",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "advanced-data-structures",
            "title": "Advanced Data Structures — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "advanced-algorithms",
        "trackSlug": "dsa",
        "title": "Advanced Algorithms & String Matching",
        "description": "The specialised toolkit: string matching, hashing tricks, and the geometry that shows up just often enough to be worth knowing.",
        "order": 36,
        "status": "coming-soon",
        "phase": "Electives · Advanced DSA",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "advanced-algorithms",
            "title": "Advanced Algorithms & String Matching — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "advanced-dp-and-graph-problems",
        "trackSlug": "dsa",
        "title": "Advanced DP & Graph Problems",
        "description": "Where the two hardest topics stop being separate. Problems that need a DP over a graph, a graph built out of a DP state, or a technique from each composed into one solution.",
        "order": 37,
        "status": "coming-soon",
        "phase": "Electives · Advanced DSA",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "advanced-dp-and-graph-problems",
            "title": "Advanced DP & Graph Problems — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      }
    ]
  },
  {
    "id": "system-design",
    "slug": "system-design",
    "title": "System Design: SQL, LLD & HLD",
    "shortTitle": "System Design",
    "tagline": "Module 2 — from a SELECT statement to an architecture you can defend",
    "description": "Roadmap Module 2, in the order that actually builds: SQL first, because it is the only part you can practise with immediate feedback and the concrete floor the rest stands on. Then low-level design — one service, in real classes, where the vocabulary of responsibility and coupling and invariants gets built. Then high-level design, where every component is introduced by the failure that forces it rather than presented as a diagram to memorise: load balancers because one machine has a ceiling, consistent hashing because adding a machine moves every key, CAP because the network will partition whether you planned for it or not. Case studies close it out, each starting from real numbers — users, latency budget, consistency requirement — and deriving the architecture, because a design discussion without constraints cannot be wrong and therefore cannot teach you anything.",
    "order": 2,
    "status": "coming-soon",
    "accent": "system",
    "mode": "learn",
    "lessonMinutes": [
      25,
      45
    ],
    "interviewPrep": true,
    "runnable": false,
    "modules": [
      {
        "slug": "sql-foundations",
        "trackSlug": "system-design",
        "title": "SQL Foundations & Advanced SELECT",
        "description": "The relational model, and then the SELECT statement taken seriously — including the clause evaluation order that explains most of the things beginners find arbitrary about SQL.",
        "order": 1,
        "status": "coming-soon",
        "phase": "Stage 1 · SQL",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "sql-foundations",
            "title": "SQL Foundations & Advanced SELECT — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "joins",
        "trackSlug": "system-design",
        "title": "Joins: Every Way to Combine Two Tables",
        "description": "The single most-asked and most-failed area of SQL. Every join type, what each does to row counts, and the two mistakes — fan-out and the filtered outer join — that silently return plausible wrong answers.",
        "order": 2,
        "status": "coming-soon",
        "phase": "Stage 1 · SQL",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "joins",
            "title": "Joins: Every Way to Combine Two Tables — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "sorting-grouping-and-aggregation",
        "trackSlug": "system-design",
        "title": "Sorting, Grouping & Aggregation",
        "description": "Turning rows into answers. GROUP BY, the aggregate functions, and the HAVING/WHERE distinction that stops being confusing the moment you know when each one runs.",
        "order": 3,
        "status": "coming-soon",
        "phase": "Stage 1 · SQL",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "sorting-grouping-and-aggregation",
            "title": "Sorting, Grouping & Aggregation — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "subqueries-and-ctes",
        "trackSlug": "system-design",
        "title": "Subqueries & Common Table Expressions",
        "description": "How to build a query in layers instead of in one unreadable block — and the correlated subquery, which is the one that quietly runs once per row.",
        "order": 4,
        "status": "coming-soon",
        "phase": "Stage 1 · SQL",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "subqueries-and-ctes",
            "title": "Subqueries & Common Table Expressions — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "window-functions",
        "trackSlug": "system-design",
        "title": "Window Functions",
        "description": "The feature that separates people who can use SQL from people who can only query with it: aggregate over a set of rows while keeping every row.",
        "order": 5,
        "status": "coming-soon",
        "phase": "Stage 1 · SQL",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "window-functions",
            "title": "Window Functions — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "recursive-ctes",
        "trackSlug": "system-design",
        "title": "Recursive CTEs & Hierarchical Data",
        "description": "Trees and graphs stored in a table, and the one construct that can walk them — plus the termination condition, because a recursive CTE without one is an outage.",
        "order": 6,
        "status": "coming-soon",
        "phase": "Stage 1 · SQL",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "recursive-ctes",
            "title": "Recursive CTEs & Hierarchical Data — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "string-functions-and-regex",
        "trackSlug": "system-design",
        "title": "String Functions, Regex & Pattern Matching",
        "description": "The messy half of real data. Parsing, cleaning and matching text in the database, and knowing when doing so has quietly made every index useless.",
        "order": 7,
        "status": "coming-soon",
        "phase": "Stage 1 · SQL",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "string-functions-and-regex",
            "title": "String Functions, Regex & Pattern Matching — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "indexes-and-query-performance",
        "trackSlug": "system-design",
        "title": "Indexes & Query Performance",
        "description": "Not on the roadmap's list, and included anyway: every later argument about sharding, caching and read replicas is an argument about queries, and it cannot be had by somebody who has never read a query plan.",
        "order": 8,
        "status": "coming-soon",
        "phase": "Stage 1 · SQL",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "indexes-and-query-performance",
            "title": "Indexes & Query Performance — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "object-oriented-programming",
        "trackSlug": "system-design",
        "title": "Object-Oriented Programming, Properly",
        "description": "Not the four-pillars recital. What an object is for, what belongs inside one, and why composition keeps beating the inheritance hierarchy you were about to draw.",
        "order": 9,
        "status": "coming-soon",
        "phase": "Stage 2 · Low-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "object-oriented-programming",
            "title": "Object-Oriented Programming, Properly — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "solid-principles",
        "trackSlug": "system-design",
        "title": "SOLID Principles",
        "description": "Five principles usually taught as slogans, taught here as five specific pains — each introduced by the change request that makes badly-factored code expensive.",
        "order": 10,
        "status": "coming-soon",
        "phase": "Stage 2 · Low-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "solid-principles",
            "title": "SOLID Principles — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "design-patterns",
        "trackSlug": "system-design",
        "title": "Design Patterns That Actually Come Up",
        "description": "The dozen that appear in real code and in machine-coding rounds, each introduced by the problem it solves — because a pattern applied without that problem is just extra indirection.",
        "order": 11,
        "status": "coming-soon",
        "phase": "Stage 2 · Low-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "design-patterns",
            "title": "Design Patterns That Actually Come Up — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "uml-and-modelling",
        "trackSlug": "system-design",
        "title": "UML & Modelling Before You Code",
        "description": "Enough UML to think on a whiteboard and be understood in an interview — which is much less than the specification and much more useful.",
        "order": 12,
        "status": "coming-soon",
        "phase": "Stage 2 · Low-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "uml-and-modelling",
            "title": "UML & Modelling Before You Code — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "schema-design",
        "trackSlug": "system-design",
        "title": "Schema Design",
        "description": "Turning a domain into tables. Normalisation until it hurts, denormalisation once it does, and the constraints that let the database refuse to hold a wrong answer.",
        "order": 13,
        "status": "coming-soon",
        "phase": "Stage 2 · Low-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "schema-design",
            "title": "Schema Design — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "api-design",
        "trackSlug": "system-design",
        "title": "API Design",
        "description": "The contract everything else is built against, and the one thing in the system you cannot quietly change later.",
        "order": 14,
        "status": "coming-soon",
        "phase": "Stage 2 · Low-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "api-design",
            "title": "API Design — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "machine-coding-interviews",
        "trackSlug": "system-design",
        "title": "Machine Coding Interviews: The LLD Round",
        "description": "Ninety minutes, a vague problem statement, and a working program at the end. The round is a time-management exam disguised as a design exam, and this is the method for it.",
        "order": 15,
        "status": "coming-soon",
        "phase": "Stage 2 · Low-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "machine-coding-interviews",
            "title": "Machine Coding Interviews: The LLD Round — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "architecture-design",
        "trackSlug": "system-design",
        "title": "Architecture Design & the Shape of a System",
        "description": "How to start. Requirements, back-of-the-envelope numbers, and the first diagram — plus the habit that makes every later decision arguable instead of arbitrary.",
        "order": 16,
        "status": "coming-soon",
        "phase": "Stage 3 · High-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "architecture-design",
            "title": "Architecture Design & the Shape of a System — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "distributed-systems",
        "trackSlug": "system-design",
        "title": "Distributed Systems: Failure, Time & Coordination",
        "description": "The theory that makes the rest of the stage make sense. Once there is more than one machine, everything you assumed about time, order and success stops being free.",
        "order": 17,
        "status": "coming-soon",
        "phase": "Stage 3 · High-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "distributed-systems",
            "title": "Distributed Systems: Failure, Time & Coordination — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "dns-and-content-delivery",
        "trackSlug": "system-design",
        "title": "How a Request Finds You: DNS & CDNs",
        "description": "Everything that happens before your server sees a byte — the part most candidates skip and most interviewers open with.",
        "order": 18,
        "status": "coming-soon",
        "phase": "Stage 3 · High-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "dns-and-content-delivery",
            "title": "How a Request Finds You: DNS & CDNs — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "load-balancing-and-consistent-hashing",
        "trackSlug": "system-design",
        "title": "Load Balancing & Consistent Hashing",
        "description": "One machine has a ceiling, so you add machines — and immediately need to answer which one gets this request, and what happens to everything when you add the next.",
        "order": 19,
        "status": "coming-soon",
        "phase": "Stage 3 · High-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "load-balancing-and-consistent-hashing",
            "title": "Load Balancing & Consistent Hashing — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "caching",
        "trackSlug": "system-design",
        "title": "Caching",
        "description": "The first thing everyone reaches for and the thing most often waved at without detail. Where to put it, what to do on a miss, and how it goes stale.",
        "order": 20,
        "status": "coming-soon",
        "phase": "Stage 3 · High-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "caching",
            "title": "Caching — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "sql-vs-nosql",
        "trackSlug": "system-design",
        "title": "SQL vs NoSQL & Choosing a Datastore",
        "description": "The question every design interview reaches, usually answered by preference. Answered here by access pattern, which is the only thing that actually decides it.",
        "order": 21,
        "status": "coming-soon",
        "phase": "Stage 3 · High-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "sql-vs-nosql",
            "title": "SQL vs NoSQL & Choosing a Datastore — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "transactions-and-cap",
        "trackSlug": "system-design",
        "title": "Transactions, Consistency & the CAP Theorem",
        "description": "What a guarantee is worth, and what it costs. CAP stated correctly rather than as the triangle slide, and the consistency models that live between the extremes.",
        "order": 22,
        "status": "coming-soon",
        "phase": "Stage 3 · High-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "transactions-and-cap",
            "title": "Transactions, Consistency & the CAP Theorem — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "messaging-and-streams",
        "trackSlug": "system-design",
        "title": "Messaging & Streams: Queues and Kafka",
        "description": "How services stop waiting for each other. Queues, logs, and the delivery guarantees that decide whether your consumer can be written naively.",
        "order": 23,
        "status": "coming-soon",
        "phase": "Stage 3 · High-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "messaging-and-streams",
            "title": "Messaging & Streams: Queues and Kafka — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "microservices",
        "trackSlug": "system-design",
        "title": "Microservices & Service Boundaries",
        "description": "Splitting a system into services, and the honest accounting of what that costs — including the case, made properly, for not doing it.",
        "order": 24,
        "status": "coming-soon",
        "phase": "Stage 3 · High-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "microservices",
            "title": "Microservices & Service Boundaries — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "scalability",
        "trackSlug": "system-design",
        "title": "Scalability: Estimating, Measuring & Growing",
        "description": "Growing a system on purpose. What the numbers say the bottleneck is, what to do about it, and the order in which to do it.",
        "order": 25,
        "status": "coming-soon",
        "phase": "Stage 3 · High-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "scalability",
            "title": "Scalability: Estimating, Measuring & Growing — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "security",
        "trackSlug": "system-design",
        "title": "Security",
        "description": "The requirement that is never in the prompt and always in the follow-up questions.",
        "order": 26,
        "status": "coming-soon",
        "phase": "Stage 3 · High-Level Design",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "security",
            "title": "Security — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "hld-case-studies",
        "trackSlug": "system-design",
        "title": "HLD Case Studies: Chess & Hotstar",
        "description": "Two systems with opposite pressures. A chess site is small data and hard real-time correctness; a live-streaming platform is enormous bandwidth and a tolerance for being a few seconds behind.",
        "order": 27,
        "status": "coming-soon",
        "phase": "Electives · Case Studies",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "hld-case-studies",
            "title": "HLD Case Studies: Chess & Hotstar — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "lld-case-studies",
        "trackSlug": "system-design",
        "title": "LLD Case Studies: Rate Limiter & Parking Lot",
        "description": "The two most-asked machine-coding problems, taken from a blank file to a working, tested, extensible program — with the design decisions narrated as they are made.",
        "order": 28,
        "status": "coming-soon",
        "phase": "Electives · Case Studies",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "lld-case-studies",
            "title": "LLD Case Studies: Rate Limiter & Parking Lot — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "frontend-system-design",
        "trackSlug": "system-design",
        "title": "Frontend System Design: Netflix & WhatsApp Web",
        "description": "The design round that is now standard for senior front-end roles and that almost no material covers. Same discipline, different constraints: the network is hostile, the device is weak, and the user is watching.",
        "order": 29,
        "status": "coming-soon",
        "phase": "Electives · Case Studies",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "frontend-system-design",
            "title": "Frontend System Design: Netflix & WhatsApp Web — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      }
    ]
  },
  {
    "id": "js-ts",
    "slug": "js-ts",
    "title": "JavaScript & TypeScript",
    "shortTitle": "JS/TS",
    "tagline": "The web's language, and the type system that made it scale",
    "description": "Every concept taught in JavaScript and TypeScript side by side, so you learn what the language does and what types add on top of it — from your first variable through closures, prototypes, the event loop, the advanced type system, modules and tooling, all the way to interview-ready mastery.",
    "order": 3,
    "status": "available",
    "accent": "ts",
    "mode": "learn",
    "lessonMinutes": [
      20,
      40
    ],
    "interviewPrep": true,
    "runnable": true,
    "modules": [
      {
        "slug": "fundamentals",
        "trackSlug": "js-ts",
        "title": "Fundamentals",
        "description": "Start here. The absolute basics of JavaScript and TypeScript, taught side by side — variables, types, operators, control flow, functions, and data structures.",
        "order": 1,
        "status": "available",
        "lessons": [
          {
            "slug": "intro-js-vs-ts",
            "moduleSlug": "fundamentals",
            "title": "What Are JavaScript & TypeScript?",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "variables-var-let-const",
            "moduleSlug": "fundamentals",
            "title": "Variables: var, let & const",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "primitive-types-typeof",
            "moduleSlug": "fundamentals",
            "title": "Primitive Types & typeof",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "operators-and-coercion",
            "moduleSlug": "fundamentals",
            "title": "Operators, Equality & Type Coercion",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "control-flow",
            "moduleSlug": "fundamentals",
            "title": "Control Flow: Conditionals & Loops",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 4
          },
          {
            "slug": "functions-basics",
            "moduleSlug": "fundamentals",
            "title": "Functions: Declarations, Expressions & Arrow Functions",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "arrays-objects-basics",
            "moduleSlug": "fundamentals",
            "title": "Arrays, Objects, Destructuring & Spread",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          }
        ]
      },
      {
        "slug": "functions-scope",
        "trackSlug": "js-ts",
        "title": "Functions & Scope Deep Dive",
        "description": "Go beyond the basics: closures, hoisting internals, the this keyword in depth, call/apply/bind, higher-order functions, and TypeScript function types, overloads, and an introduction to generics.",
        "order": 2,
        "status": "available",
        "lessons": [
          {
            "slug": "closures",
            "moduleSlug": "functions-scope",
            "title": "Closures & the Module Pattern",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "hoisting-internals",
            "moduleSlug": "functions-scope",
            "title": "Hoisting Internals: How the Engine Really Processes Your Code",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "this-in-depth",
            "moduleSlug": "functions-scope",
            "title": "this In Depth",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "call-apply-bind",
            "moduleSlug": "functions-scope",
            "title": "call, apply & bind",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "higher-order-functions",
            "moduleSlug": "functions-scope",
            "title": "Higher-Order Functions & Composition",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "ts-function-types-overloads-generics-intro",
            "moduleSlug": "functions-scope",
            "title": "TypeScript: Function Types, Overloads & Generics Introduction",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          }
        ]
      },
      {
        "slug": "oop-prototypes",
        "trackSlug": "js-ts",
        "title": "Objects, Prototypes & OOP",
        "description": "How JavaScript's prototype chain actually works, ES class syntax as sugar over prototypes, inheritance, and TypeScript's access modifiers, interfaces, and abstract classes.",
        "order": 3,
        "status": "available",
        "lessons": [
          {
            "slug": "prototype-chain",
            "moduleSlug": "oop-prototypes",
            "title": "The Prototype Chain & Object.create",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "es-classes",
            "moduleSlug": "oop-prototypes",
            "title": "ES Classes: Fields, Methods, Static Members & Inheritance",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "getters-setters-computed-properties",
            "moduleSlug": "oop-prototypes",
            "title": "Getters, Setters & Computed Properties",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "ts-access-modifiers",
            "moduleSlug": "oop-prototypes",
            "title": "TypeScript Access Modifiers: public, private, protected, readonly",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 4
          },
          {
            "slug": "interfaces-vs-abstract-classes-vs-type-aliases",
            "moduleSlug": "oop-prototypes",
            "title": "Interfaces vs Abstract Classes vs Type Aliases",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 4
          },
          {
            "slug": "mixins-and-composition",
            "moduleSlug": "oop-prototypes",
            "title": "Mixins & Composition Over Inheritance",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 4
          }
        ]
      },
      {
        "slug": "arrays-collections",
        "trackSlug": "js-ts",
        "title": "Arrays, Iterables & Collections",
        "description": "A deep dive into every essential array method, Map and Set, iterators and generators, and how TypeScript generics make collection code reusable and type-safe.",
        "order": 4,
        "status": "available",
        "lessons": [
          {
            "slug": "array-methods-deep-dive",
            "moduleSlug": "arrays-collections",
            "title": "Array Methods Deep Dive",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "map-and-set",
            "moduleSlug": "arrays-collections",
            "title": "Map and Set",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 4
          },
          {
            "slug": "iterables-and-iterators",
            "moduleSlug": "arrays-collections",
            "title": "The Iterable & Iterator Protocols",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "generator-functions-and-yield",
            "moduleSlug": "arrays-collections",
            "title": "Generator Functions & yield",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "weakmap-and-weakset",
            "moduleSlug": "arrays-collections",
            "title": "WeakMap & WeakSet",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "ts-generics-for-custom-collections",
            "moduleSlug": "arrays-collections",
            "title": "TypeScript Generics for Custom Collection Types",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          }
        ]
      },
      {
        "slug": "async",
        "trackSlug": "js-ts",
        "title": "Asynchronous JS/TS",
        "description": "Callbacks, Promises, async/await, the event loop and the micro/macrotask queues explained precisely, plus typed Promises and robust error-handling patterns in TypeScript.",
        "order": 5,
        "status": "available",
        "lessons": [
          {
            "slug": "callbacks-and-callback-hell",
            "moduleSlug": "async",
            "title": "Callbacks & Callback Hell",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "promises-states-and-chaining",
            "moduleSlug": "async",
            "title": "Promises: States, Chaining & Combinators",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "async-await-and-error-handling",
            "moduleSlug": "async",
            "title": "async / await & Error Handling",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "the-event-loop-microtasks-and-macrotasks",
            "moduleSlug": "async",
            "title": "The Event Loop: Microtasks vs Macrotasks",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "typing-promises-and-async-functions",
            "moduleSlug": "async",
            "title": "TypeScript: Typing Promises & Async Functions",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "abortcontroller-and-cancellation",
            "moduleSlug": "async",
            "title": "AbortController & Cancellation Patterns",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          }
        ]
      },
      {
        "slug": "type-system",
        "trackSlug": "js-ts",
        "title": "TypeScript Type System Deep Dive",
        "description": "The advanced type system features that separate intermediate from expert TypeScript: unions, discriminated unions, advanced generics, utility types, mapped and conditional types, template literal types, and decorators.",
        "order": 6,
        "status": "available",
        "lessons": [
          {
            "slug": "unions-intersections-literal-types",
            "moduleSlug": "type-system",
            "title": "Union, Intersection & Literal Types",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "type-guards-and-discriminated-unions",
            "moduleSlug": "type-system",
            "title": "Type Guards & Discriminated Unions",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "advanced-generics",
            "moduleSlug": "type-system",
            "title": "Advanced Generics: Constraints, keyof & Inference",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "built-in-utility-types",
            "moduleSlug": "type-system",
            "title": "Built-in Utility Types",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "mapped-and-conditional-types",
            "moduleSlug": "type-system",
            "title": "Mapped & Conditional Types",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "template-literal-types-and-decorators",
            "moduleSlug": "type-system",
            "title": "Template Literal Types & Decorators",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          }
        ]
      },
      {
        "slug": "modules-tooling",
        "trackSlug": "js-ts",
        "title": "Modules & Tooling",
        "description": "How code gets split across files and put back together: ES Modules against CommonJS, the tsconfig.json options that actually matter, how an import specifier becomes a file on disk, what modern build tools do and why they are fast, and JSX from its syntax to its typed props.",
        "order": 7,
        "status": "available",
        "lessons": [
          {
            "slug": "es-modules-vs-commonjs",
            "moduleSlug": "modules-tooling",
            "title": "ES Modules vs CommonJS",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "tsconfig-in-depth",
            "moduleSlug": "modules-tooling",
            "title": "tsconfig.json in Depth",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "module-resolution",
            "moduleSlug": "modules-tooling",
            "title": "Module Resolution",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "build-tools",
            "moduleSlug": "modules-tooling",
            "title": "Build Tools",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "jsx-fundamentals",
            "moduleSlug": "modules-tooling",
            "title": "JSX Fundamentals",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "tsx-typing-components",
            "moduleSlug": "modules-tooling",
            "title": "TSX: Typing JSX",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 5
          }
        ]
      },
      {
        "slug": "dom-browser",
        "trackSlug": "js-ts",
        "title": "DOM & Browser APIs",
        "description": "Working with the DOM directly, event handling and delegation, fetch and networking, browser storage, and how to type all of it correctly in TypeScript — plus the platform APIs that replace code people still write by hand.",
        "order": 8,
        "status": "available",
        "lessons": [
          {
            "slug": "selecting-and-manipulating",
            "moduleSlug": "dom-browser",
            "title": "Selecting & Manipulating DOM Nodes",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "events-and-delegation",
            "moduleSlug": "dom-browser",
            "title": "Events, Delegation & Custom Events",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "fetch-and-networking",
            "moduleSlug": "dom-browser",
            "title": "fetch, Requests & Responses",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "browser-storage",
            "moduleSlug": "dom-browser",
            "title": "localStorage, sessionStorage & Cookies",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "typing-the-dom",
            "moduleSlug": "dom-browser",
            "title": "Typing the DOM in TypeScript",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "modern-browser-apis",
            "moduleSlug": "dom-browser",
            "title": "Browser APIs Worth Knowing",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "react",
        "trackSlug": "js-ts",
        "title": "React with JS vs TS",
        "description": "Applying TypeScript to React: what the .tsx extension changes, typing props, children and event handlers, state and reducers, context, refs and custom hooks, generic and polymorphic components, and the patterns real component libraries are built from. Assumes you know React — the React track teaches that.",
        "order": 9,
        "status": "available",
        "lessons": [
          {
            "slug": "jsx-vs-tsx",
            "moduleSlug": "react",
            "title": "JSX vs TSX: What Actually Changes",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "typing-props",
            "moduleSlug": "react",
            "title": "Typing Props, Children & Handlers",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "typing-state-and-reducers",
            "moduleSlug": "react",
            "title": "Typing State, Effects & Reducers",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "typing-context-refs-hooks",
            "moduleSlug": "react",
            "title": "Typing Context, Refs & Custom Hooks",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "generic-components",
            "moduleSlug": "react",
            "title": "Generic Components",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "typing-common-patterns",
            "moduleSlug": "react",
            "title": "Typing Common React Patterns",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "design-patterns",
        "trackSlug": "js-ts",
        "title": "Design Patterns & Architecture",
        "description": "Common JavaScript/TypeScript design patterns and the language features that replaced several of them, functional patterns worth adopting, error-handling architecture with custom error classes and Result types, how to structure an application several people work on, and a step-by-step guide to migrating an existing JavaScript project to TypeScript.",
        "order": 10,
        "status": "available",
        "lessons": [
          {
            "slug": "classic-patterns",
            "moduleSlug": "design-patterns",
            "title": "Module, Singleton, Factory & Observer",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "functional-patterns",
            "moduleSlug": "design-patterns",
            "title": "Functional Patterns in JavaScript & TypeScript",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "error-handling-architecture",
            "moduleSlug": "design-patterns",
            "title": "Error Handling Architecture",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "structuring-applications",
            "moduleSlug": "design-patterns",
            "title": "Structuring Larger Applications",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "js-to-ts-migration",
            "moduleSlug": "design-patterns",
            "title": "Migrating a JavaScript Project to TypeScript",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "incremental-typing-strategies",
            "moduleSlug": "design-patterns",
            "title": "Incremental Typing Strategies",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "testing-debugging",
        "trackSlug": "js-ts",
        "title": "Testing & Debugging",
        "description": "Unit testing fundamentals with Vitest, typing mocks and fixtures so tests cannot drift from the code they check, writing code that is testable in the first place, debugging with DevTools and the Node inspector, source maps for compiled TypeScript, and the async and closure bugs that never produce a useful stack trace.",
        "order": 11,
        "status": "available",
        "lessons": [
          {
            "slug": "testing-fundamentals",
            "moduleSlug": "testing-debugging",
            "title": "Unit Testing Fundamentals with Vitest",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "typing-tests-and-mocks",
            "moduleSlug": "testing-debugging",
            "title": "Typing Tests, Mocks & Fixtures",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "writing-testable-code",
            "moduleSlug": "testing-debugging",
            "title": "Writing Testable Code",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "devtools-and-node-inspector",
            "moduleSlug": "testing-debugging",
            "title": "Debugging with DevTools & the Node Inspector",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "source-maps",
            "moduleSlug": "testing-debugging",
            "title": "Source Maps & Debugging Compiled TypeScript",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "async-and-closure-bugs",
            "moduleSlug": "testing-debugging",
            "title": "Debugging Async & Closure Bugs",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 9
          }
        ]
      },
      {
        "slug": "interview-mastery",
        "trackSlug": "js-ts",
        "title": "Interview Mastery",
        "description": "The consolidation pass over everything in this track: a cross-topic question bank answered at the depth interviewers listen for, output-prediction puzzles with verified results, the utility implementations that come up far more often than algorithms, how to argue a trade-off, three interview rounds written as transcripts, and the behavioural questions engineers reliably under-prepare for.",
        "order": 12,
        "status": "available",
        "lessons": [
          {
            "slug": "cross-topic-question-bank",
            "moduleSlug": "interview-mastery",
            "title": "The Cross-Topic Question Bank",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "output-prediction",
            "moduleSlug": "interview-mastery",
            "title": "Output Prediction: Guess the console.log",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "coding-problems",
            "moduleSlug": "interview-mastery",
            "title": "The Coding Problems That Actually Come Up",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "explaining-tradeoffs",
            "moduleSlug": "interview-mastery",
            "title": "Explaining Trade-offs",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "mock-interview-walkthroughs",
            "moduleSlug": "interview-mastery",
            "title": "Mock Interview Walkthroughs",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "behavioural-questions",
            "moduleSlug": "interview-mastery",
            "title": "Behavioural Questions on Code Quality",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      }
    ]
  },
  {
    "id": "react",
    "slug": "react",
    "title": "React",
    "shortTitle": "React",
    "tagline": "Components, props and hooks, all the way to concurrent rendering",
    "description": "React from the first component to the parts most people never learn properly. You start by creating an app and rendering JSX, meet props and state, then work through every hook — what each one is for, the rules they obey, and the bugs you get when you break them. From there: forms, effects and data fetching, context and state architecture, the rendering behaviour behind every performance problem, then concurrent React, Suspense, and the difference between client rendering, server rendering, hydration and Server Components. Ends with testing, TypeScript, the patterns real codebases use, then a capstone module: Bug Tracker, in the shape of a small Bugzilla or Jira, specified with numbered requirements and built end to end — a React front end over an HTTP API and a database you also write, ending with the triage queue where every earlier decision has to hold at once.",
    "order": 4,
    "status": "available",
    "accent": "react",
    "mode": "learn",
    "lessonMinutes": [
      20,
      45
    ],
    "interviewPrep": true,
    "runnable": true,
    "modules": [
      {
        "slug": "foundations",
        "trackSlug": "react",
        "title": "What React Is & Your First App",
        "description": "Start at absolute zero: what React is and the problem it removes, then create an app, write components, pass props, add state with your first hook, and finish by building a complete working interface. Modules 2 to 6 return to each of these properly — this one gets you to something that runs.",
        "order": 1,
        "status": "available",
        "lessons": [
          {
            "slug": "what-is-react",
            "moduleSlug": "foundations",
            "title": "What React Is, and the Problem It Solves",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "creating-a-react-app",
            "moduleSlug": "foundations",
            "title": "Creating a React App",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "jsx-and-your-first-component",
            "moduleSlug": "foundations",
            "title": "JSX & Your First Component",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "props",
            "moduleSlug": "foundations",
            "title": "Props: Passing Data Into a Component",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "state-and-your-first-hook",
            "moduleSlug": "foundations",
            "title": "State & Your First Hook",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "building-your-first-app",
            "moduleSlug": "foundations",
            "title": "Putting It Together: Your First Real App",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "jsx-and-rendering",
        "trackSlug": "react",
        "title": "JSX & Rendering in Depth",
        "description": "What JSX actually compiles to, how React turns a tree of elements into DOM, and why the render/commit split explains most of React's surprising behaviour.",
        "order": 2,
        "status": "available",
        "lessons": [
          {
            "slug": "what-jsx-compiles-to",
            "moduleSlug": "jsx-and-rendering",
            "title": "What JSX Compiles To",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "elements-and-components",
            "moduleSlug": "jsx-and-rendering",
            "title": "Elements Against Components",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "expressions-in-jsx",
            "moduleSlug": "jsx-and-rendering",
            "title": "Expressions, Conditionals & What Actually Renders",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "attributes-and-props",
            "moduleSlug": "jsx-and-rendering",
            "title": "Attributes, Props & the DOM Naming Rules",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "fragments-and-multiple-children",
            "moduleSlug": "jsx-and-rendering",
            "title": "Fragments & Returning Several Children",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "render-and-commit",
            "moduleSlug": "jsx-and-rendering",
            "title": "The Render Phase & the Commit Phase",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "virtual-dom-and-reconciliation",
            "moduleSlug": "jsx-and-rendering",
            "title": "The Virtual DOM & Reconciliation",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "lists-and-keys",
            "moduleSlug": "jsx-and-rendering",
            "title": "Rendering Lists, and What a Key Actually Does",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "components-and-props",
        "trackSlug": "react",
        "title": "Components & Props",
        "description": "The unit React is built from: a function that takes props and returns UI. Everything about passing data in, including the parts that go wrong — and where the resulting files belong on disk.",
        "order": 3,
        "status": "available",
        "lessons": [
          {
            "slug": "what-makes-a-component",
            "moduleSlug": "components-and-props",
            "title": "What Makes a Function a Component",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "props-in-depth",
            "moduleSlug": "components-and-props",
            "title": "Props, Properly",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "children-as-a-prop",
            "moduleSlug": "components-and-props",
            "title": "`children`, and Why It Is Just Another Prop",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "props-are-read-only",
            "moduleSlug": "components-and-props",
            "title": "Props Are Read-Only, and What That Buys",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "functions-as-props",
            "moduleSlug": "components-and-props",
            "title": "Functions as Props & Lifting State Up",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "composition-not-inheritance",
            "moduleSlug": "components-and-props",
            "title": "Composition Instead of Inheritance",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "typing-props",
            "moduleSlug": "components-and-props",
            "title": "Typing Props with TypeScript",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "splitting-a-page",
            "moduleSlug": "components-and-props",
            "title": "Splitting a Page Into Components: A Worked Refactor",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "project-structure",
            "moduleSlug": "components-and-props",
            "title": "Where the Files Go: Project Structure",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 10
          }
        ]
      },
      {
        "slug": "state-and-events",
        "trackSlug": "react",
        "title": "State & Events",
        "description": "useState properly: what a state variable really is, why updates are asynchronous, and the batching behaviour that catches everyone once.",
        "order": 4,
        "status": "available",
        "lessons": [
          {
            "slug": "what-usestate-stores",
            "moduleSlug": "state-and-events",
            "title": "What `useState` Actually Stores",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "updates-are-queued",
            "moduleSlug": "state-and-events",
            "title": "Updates Are Queued, Not Immediate",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "functional-updates",
            "moduleSlug": "state-and-events",
            "title": "Functional Updates",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "state-is-a-snapshot",
            "moduleSlug": "state-and-events",
            "title": "State Is a Snapshot",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "batching",
            "moduleSlug": "state-and-events",
            "title": "Batching, and What React 18 Changed",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "objects-and-arrays-in-state",
            "moduleSlug": "state-and-events",
            "title": "Updating Objects and Arrays Without Mutating",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "events-and-delegation",
            "moduleSlug": "state-and-events",
            "title": "Events, Synthetic Events & Delegation",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "choosing-state-shape",
            "moduleSlug": "state-and-events",
            "title": "Choosing State Shape",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "core-hooks",
        "trackSlug": "react",
        "title": "The Hooks You Use Every Day",
        "description": "useState, useEffect, useRef and useContext — what each is for, what it is not for, and the rules that make them work at all.",
        "order": 5,
        "status": "available",
        "lessons": [
          {
            "slug": "why-hooks-exist",
            "moduleSlug": "core-hooks",
            "title": "Why Hooks Exist, and What They Replaced",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "rules-of-hooks",
            "moduleSlug": "core-hooks",
            "title": "The Rules of Hooks, and the List Underneath Them",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "useeffect",
            "moduleSlug": "core-hooks",
            "title": "`useEffect`: What an Effect Is, and When It Runs",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-dependency-array",
            "moduleSlug": "core-hooks",
            "title": "The Dependency Array, and the Lint Rule Worth Obeying",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "cleanup-and-strict-mode",
            "moduleSlug": "core-hooks",
            "title": "Cleanup, and Why Effects Run Twice",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "useref",
            "moduleSlug": "core-hooks",
            "title": "`useRef`: DOM Access, and Values That Survive a Render",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "usecontext",
            "moduleSlug": "core-hooks",
            "title": "`useContext`: Reading Shared Data Without Prop Drilling",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "state-ref-or-variable",
            "moduleSlug": "core-hooks",
            "title": "State, a Ref, or Just a Variable",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "lists-keys-forms",
        "trackSlug": "react",
        "title": "Lists, Keys & Forms",
        "description": "Rendering collections correctly, and the controlled-input model that makes React forms behave differently from HTML ones.",
        "order": 6,
        "status": "available",
        "lessons": [
          {
            "slug": "rendering-lists",
            "moduleSlug": "lists-keys-forms",
            "title": "Rendering Arrays, and Where a Key Comes From",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "the-index-key-bug",
            "moduleSlug": "lists-keys-forms",
            "title": "The Index-as-Key Bug, Demonstrated",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "controlled-and-uncontrolled",
            "moduleSlug": "lists-keys-forms",
            "title": "Controlled Against Uncontrolled Inputs",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "every-input-type",
            "moduleSlug": "lists-keys-forms",
            "title": "Text, Checkboxes, Radios, Selects and Textareas",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "form-submission",
            "moduleSlug": "lists-keys-forms",
            "title": "Submission, `preventDefault`, and the Platform APIs",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "validation-and-errors",
            "moduleSlug": "lists-keys-forms",
            "title": "Validation, and Showing Errors at the Right Moment",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "resetting-with-a-key",
            "moduleSlug": "lists-keys-forms",
            "title": "Resetting a Form With a Key, Instead of an Effect",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "form-libraries",
            "moduleSlug": "lists-keys-forms",
            "title": "When to Reach for a Form Library",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "effects-and-data",
        "trackSlug": "react",
        "title": "Effects, Lifecycle & Data Fetching",
        "description": "The module that fixes most React bugs: when you actually need an effect, when you do not, and how to fetch data without race conditions.",
        "order": 7,
        "status": "available",
        "lessons": [
          {
            "slug": "you-might-not-need-an-effect",
            "moduleSlug": "effects-and-data",
            "title": "You Might Not Need an Effect",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "synchronising-with-an-external-system",
            "moduleSlug": "effects-and-data",
            "title": "What an Effect Is Actually For",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "fetching-in-an-effect",
            "moduleSlug": "effects-and-data",
            "title": "Fetching Data in an Effect",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "race-conditions-and-cleanup",
            "moduleSlug": "effects-and-data",
            "title": "The Race Condition Nobody Sees in Development",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "loading-error-and-empty-states",
            "moduleSlug": "effects-and-data",
            "title": "Loading, Error and Empty States",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "subscriptions-timers-and-listeners",
            "moduleSlug": "effects-and-data",
            "title": "Subscriptions, Timers and Event Listeners",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "uselayouteffect",
            "moduleSlug": "effects-and-data",
            "title": "useLayoutEffect, and the One Case It Is For",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "why-a-data-library-exists",
            "moduleSlug": "effects-and-data",
            "title": "Why a Data-Fetching Library Exists",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "context-and-state-architecture",
        "trackSlug": "react",
        "title": "Composition, Context & State Architecture",
        "description": "Where state should live in a real application, and the tools for sharing it without turning every component into a re-render trigger.",
        "order": 8,
        "status": "available",
        "lessons": [
          {
            "slug": "prop-drilling",
            "moduleSlug": "context-and-state-architecture",
            "title": "Prop Drilling, and When It Is Fine",
            "estimatedMinutes": 22,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "composition-instead-of-context",
            "moduleSlug": "context-and-state-architecture",
            "title": "Composition Instead of Context",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "what-a-context-update-costs",
            "moduleSlug": "context-and-state-architecture",
            "title": "What a Context Update Costs",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "usereducer",
            "moduleSlug": "context-and-state-architecture",
            "title": "useReducer: State That Changes in More Than One Way",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "a-small-store-with-reducer-and-context",
            "moduleSlug": "context-and-state-architecture",
            "title": "A Small Store, From a Reducer and Context",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "splitting-contexts",
            "moduleSlug": "context-and-state-architecture",
            "title": "Splitting Contexts to Limit Re-renders",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "choosing-where-state-lives",
            "moduleSlug": "context-and-state-architecture",
            "title": "Choosing Where State Lives",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "zustand-redux-and-jotai",
            "moduleSlug": "context-and-state-architecture",
            "title": "Zustand, Redux Toolkit and Jotai",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 9
          }
        ]
      },
      {
        "slug": "rendering-and-performance",
        "trackSlug": "react",
        "title": "Rendering Behaviour & Performance",
        "description": "Why a component re-rendered, how to find out, and the small set of fixes that actually work — plus the React Compiler, which changes the calculus.",
        "order": 9,
        "status": "available",
        "lessons": [
          {
            "slug": "what-causes-a-re-render",
            "moduleSlug": "rendering-and-performance",
            "title": "What Causes a Re-render, and What Does Not",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "re-rendering-is-not-the-problem",
            "moduleSlug": "rendering-and-performance",
            "title": "Re-rendering Is Not the Problem",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "react-memo",
            "moduleSlug": "rendering-and-performance",
            "title": "React.memo, and the Prop Identity Problem",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "usememo-and-usecallback",
            "moduleSlug": "rendering-and-performance",
            "title": "useMemo and useCallback: What They Cost and When They Pay",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "referential-equality",
            "moduleSlug": "rendering-and-performance",
            "title": "Referential Equality: One Rule, Four Places",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-react-compiler",
            "moduleSlug": "rendering-and-performance",
            "title": "The React Compiler",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "profiling",
            "moduleSlug": "rendering-and-performance",
            "title": "Profiling: Finding Out Instead of Guessing",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "virtualising-and-code-splitting",
            "moduleSlug": "rendering-and-performance",
            "title": "Rendering Less, and Shipping Less",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 10
          }
        ]
      },
      {
        "slug": "advanced-and-custom-hooks",
        "trackSlug": "react",
        "title": "Advanced Hooks & Custom Hooks",
        "description": "The remaining built-in hooks, and how to extract your own so that logic is reusable without a wrapper component.",
        "order": 10,
        "status": "available",
        "lessons": [
          {
            "slug": "writing-a-custom-hook",
            "moduleSlug": "advanced-and-custom-hooks",
            "title": "Writing a Custom Hook",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "useid",
            "moduleSlug": "advanced-and-custom-hooks",
            "title": "useId, and Ids That Survive Hydration",
            "estimatedMinutes": 20,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "refs-and-imperative-handles",
            "moduleSlug": "advanced-and-custom-hooks",
            "title": "Refs as Props, and useImperativeHandle",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "usesyncexternalstore",
            "moduleSlug": "advanced-and-custom-hooks",
            "title": "useSyncExternalStore",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "usedebugvalue-and-devtools",
            "moduleSlug": "advanced-and-custom-hooks",
            "title": "useDebugValue and the DevTools Story",
            "estimatedMinutes": 18,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "composing-hooks-and-return-shapes",
            "moduleSlug": "advanced-and-custom-hooks",
            "title": "Composing Hooks, and the Shape They Return",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "a-library-of-small-hooks",
            "moduleSlug": "advanced-and-custom-hooks",
            "title": "A Library of Small Hooks You Will Actually Reuse",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "testing-a-custom-hook",
            "moduleSlug": "advanced-and-custom-hooks",
            "title": "Testing a Custom Hook in Isolation",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 9
          }
        ]
      },
      {
        "slug": "concurrent-react",
        "trackSlug": "react",
        "title": "Concurrent React, Suspense & Transitions",
        "description": "The rendering model React 18 introduced: interruptible rendering, and the APIs that let you tell React what is urgent.",
        "order": 11,
        "status": "available",
        "lessons": [
          {
            "slug": "what-concurrent-rendering-changed",
            "moduleSlug": "concurrent-react",
            "title": "What Concurrent Rendering Actually Changed",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "suspense",
            "moduleSlug": "concurrent-react",
            "title": "Suspense: A Boundary, Not a Flag",
            "estimatedMinutes": 34,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "transitions",
            "moduleSlug": "concurrent-react",
            "title": "Transitions: Telling React What Can Wait",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "usedeferredvalue",
            "moduleSlug": "concurrent-react",
            "title": "useDeferredValue",
            "estimatedMinutes": 27,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "error-boundaries",
            "moduleSlug": "concurrent-react",
            "title": "Error Boundaries",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "streaming",
            "moduleSlug": "concurrent-react",
            "title": "Streaming: Sending a Page in Pieces",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-use-hook",
            "moduleSlug": "concurrent-react",
            "title": "The use Hook",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "strict-mode",
            "moduleSlug": "concurrent-react",
            "title": "Strict Mode & Double Invocation",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "client-and-server-rendering",
        "trackSlug": "react",
        "title": "Client, Server & Hydration",
        "description": "The whole rendering picture in one place: what CSR, SSR, SSG and Server Components each mean, what hydration is, and which problem each one solves.",
        "order": 12,
        "status": "available",
        "lessons": [
          {
            "slug": "client-side-rendering",
            "moduleSlug": "client-and-server-rendering",
            "title": "Client-Side Rendering: The Empty Div",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "server-side-rendering",
            "moduleSlug": "client-and-server-rendering",
            "title": "Server-Side Rendering",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "hydration",
            "moduleSlug": "client-and-server-rendering",
            "title": "Hydration",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "hydration-mismatches",
            "moduleSlug": "client-and-server-rendering",
            "title": "Hydration Mismatches",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "static-generation",
            "moduleSlug": "client-and-server-rendering",
            "title": "Static Generation & Revalidation",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "react-server-components",
            "moduleSlug": "client-and-server-rendering",
            "title": "React Server Components",
            "estimatedMinutes": 34,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "the-use-client-boundary",
            "moduleSlug": "client-and-server-rendering",
            "title": "The 'use client' Boundary",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "choosing-a-strategy",
            "moduleSlug": "client-and-server-rendering",
            "title": "Choosing a Strategy, Per Screen",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 9
          }
        ]
      },
      {
        "slug": "testing-typescript-tooling",
        "trackSlug": "react",
        "title": "Testing, TypeScript & Tooling",
        "description": "Making a React codebase maintainable: types that catch real mistakes, tests that survive a refactor, and the build tooling underneath.",
        "order": 13,
        "status": "available",
        "lessons": [
          {
            "slug": "typing-components",
            "moduleSlug": "testing-typescript-tooling",
            "title": "Typing Components: Props, Children, Events & Refs",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "generic-components-and-hooks",
            "moduleSlug": "testing-typescript-tooling",
            "title": "Generic Components & Typing a Hook",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "testing-library",
            "moduleSlug": "testing-typescript-tooling",
            "title": "Testing Library: Querying the Way a User Would",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "testing-interaction-and-async",
            "moduleSlug": "testing-typescript-tooling",
            "title": "Testing Interaction & Async UI",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 10
          },
          {
            "slug": "mocking-the-network",
            "moduleSlug": "testing-typescript-tooling",
            "title": "Mocking the Network with MSW",
            "estimatedMinutes": 27,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "component-tests-and-end-to-end",
            "moduleSlug": "testing-typescript-tooling",
            "title": "Component Tests Against End-to-End",
            "estimatedMinutes": 27,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "vite-and-the-build",
            "moduleSlug": "testing-typescript-tooling",
            "title": "Vite & What a React Build Does",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "eslint-and-the-hooks-plugin",
            "moduleSlug": "testing-typescript-tooling",
            "title": "ESLint, the Hooks Plugin & the Rules Worth Enforcing",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 9
          }
        ]
      },
      {
        "slug": "patterns-and-mastery",
        "trackSlug": "react",
        "title": "Patterns, Ecosystem & Judgement",
        "description": "The consolidation pass: the composition patterns that show up in every large codebase, how to design a component API other people enjoy using, accessibility as a set of decisions rather than a checklist, how to get oriented in code you have never seen, and one component designed end to end.",
        "order": 14,
        "status": "available",
        "lessons": [
          {
            "slug": "compound-components",
            "moduleSlug": "patterns-and-mastery",
            "title": "Compound Components, Slots & Headless Design",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 10
          },
          {
            "slug": "container-and-presentational",
            "moduleSlug": "patterns-and-mastery",
            "title": "Container/Presentational, and What Replaced It",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "designing-a-component-api",
            "moduleSlug": "patterns-and-mastery",
            "title": "Designing a Component API Other People Enjoy Using",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "accessibility",
            "moduleSlug": "patterns-and-mastery",
            "title": "Accessibility in React",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 10
          },
          {
            "slug": "portals-and-animation",
            "moduleSlug": "patterns-and-mastery",
            "title": "Portals, Animation & Escaping the Tree",
            "estimatedMinutes": 28,
            "status": "available",
            "takeawayCount": 10
          },
          {
            "slug": "reading-and-reviewing-react",
            "moduleSlug": "patterns-and-mastery",
            "title": "Reading Unfamiliar React & Reviewing It Well",
            "estimatedMinutes": 27,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "a-component-design-walkthrough",
            "moduleSlug": "patterns-and-mastery",
            "title": "A Component-Design Walkthrough, End to End",
            "estimatedMinutes": 36,
            "status": "available",
            "takeawayCount": 11
          }
        ]
      },
      {
        "slug": "capstone-project",
        "trackSlug": "react",
        "title": "Capstone: Build a Bug Tracker",
        "description": "Bug Tracker — an issue tracker for one small team, in the shape of a small Bugzilla, Jira or GitHub Issues. Specified with numbered functional and non-functional requirements, then built: a shared schema package, a Hono and SQLite backend, and a React and TypeScript front end with filters in the URL, a triage queue ordered worst-first, two optimistic mutations and one deliberately not, and tests that fake the network rather than the modules.",
        "order": 15,
        "status": "available",
        "lessons": [
          {
            "slug": "bug-tracker-requirements-and-architecture",
            "moduleSlug": "capstone-project",
            "title": "Bug Tracker: Requirements & Architecture",
            "estimatedMinutes": 32,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "bug-tracker-structure-types-and-backend",
            "moduleSlug": "capstone-project",
            "title": "Bug Tracker: Folder Structure, Shared Types & the Backend",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "bug-tracker-the-data-layer",
            "moduleSlug": "capstone-project",
            "title": "Bug Tracker: The Data Layer",
            "estimatedMinutes": 32,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "bug-tracker-components-screens-and-tests",
            "moduleSlug": "capstone-project",
            "title": "Bug Tracker: Components, Screens & Tests",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "bug-tracker-the-triage-queue",
            "moduleSlug": "capstone-project",
            "title": "Bug Tracker: The Triage Queue",
            "estimatedMinutes": 26,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      }
    ]
  },
  {
    "id": "next",
    "slug": "nextjs",
    "title": "Next.js",
    "shortTitle": "Next",
    "tagline": "The App Router, Server Components, and every rendering strategy in one place",
    "description": "Next.js from `create-next-app` to production, built around the one question that decides everything in a Next.js codebase: where does this code run? You start with file-based routing and layouts, then meet the Server/Client Component boundary and learn what may cross it. From there, every rendering strategy — static, server-rendered, incrementally regenerated, partially prerendered and client-only — with the caching model that drives them, then data fetching, Server Actions, route handlers, streaming, metadata, authentication, testing and deployment.",
    "order": 5,
    "status": "coming-soon",
    "accent": "next",
    "mode": "learn",
    "lessonMinutes": [
      25,
      40
    ],
    "interviewPrep": true,
    "runnable": false,
    "modules": [
      {
        "slug": "foundations",
        "trackSlug": "nextjs",
        "title": "What Next.js Is & Your First App",
        "description": "What Next.js adds to React and why, then a running application: the project layout, the dev server, and your first pages.",
        "order": 1,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "foundations",
            "title": "What Next.js Is & Your First App — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "app-router",
        "trackSlug": "nextjs",
        "title": "Routing with the App Router",
        "description": "Everything the file system means: segments, dynamic routes, groups, parallel routes and intercepting routes.",
        "order": 2,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "app-router",
            "title": "Routing with the App Router — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "layouts-and-ui-files",
        "trackSlug": "nextjs",
        "title": "Layouts, Templates, Loading & Error UI",
        "description": "The special files that wrap a route: shared shells that survive navigation, instant loading states, and error boundaries that are actually reachable.",
        "order": 3,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "layouts-and-ui-files",
            "title": "Layouts, Templates, Loading & Error UI — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "server-and-client-components",
        "trackSlug": "nextjs",
        "title": "Server Components & Client Components",
        "description": "The boundary the whole framework is organised around: what runs on the server, what ships to the browser, and the rules for passing things between them.",
        "order": 4,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "server-and-client-components",
            "title": "Server Components & Client Components — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "rendering-strategies",
        "trackSlug": "nextjs",
        "title": "Rendering Strategies: Static, Server, ISR, PPR & Client",
        "description": "Every way Next.js can produce a page, what each one costs, and how to tell which one you actually got.",
        "order": 5,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "rendering-strategies",
            "title": "Rendering Strategies: Static, Server, ISR, PPR & Client — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "data-fetching-and-caching",
        "trackSlug": "nextjs",
        "title": "Data Fetching & Caching",
        "description": "Fetching on the server, and the caching layers that make the same code fast or stale depending on what you asked for.",
        "order": 6,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "data-fetching-and-caching",
            "title": "Data Fetching & Caching — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "server-actions",
        "trackSlug": "nextjs",
        "title": "Server Actions & Mutations",
        "description": "Writing data without writing an API: functions that run on the server, called straight from a form or a Client Component.",
        "order": 7,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "server-actions",
            "title": "Server Actions & Mutations — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "route-handlers",
        "trackSlug": "nextjs",
        "title": "Route Handlers & the Backend Layer",
        "description": "When you do need an HTTP endpoint: route handlers, the Web Request and Response APIs, and the runtimes they can run on.",
        "order": 8,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "route-handlers",
            "title": "Route Handlers & the Backend Layer — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "navigation-and-streaming",
        "trackSlug": "nextjs",
        "title": "Navigation, Streaming & Suspense",
        "description": "How moving between routes actually works, and how to make a slow page usable before it has finished loading.",
        "order": 9,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "navigation-and-streaming",
            "title": "Navigation, Streaming & Suspense — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "styling-assets-fonts",
        "trackSlug": "nextjs",
        "title": "Styling, Assets, Fonts & Images",
        "description": "The built-in optimisations that are easy to leave switched off, and the styling options that work with Server Components.",
        "order": 10,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "styling-assets-fonts",
            "title": "Styling, Assets, Fonts & Images — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "metadata-seo",
        "trackSlug": "nextjs",
        "title": "Metadata, SEO & Accessibility",
        "description": "Making pages that search engines, social cards and screen readers all understand.",
        "order": 11,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "metadata-seo",
            "title": "Metadata, SEO & Accessibility — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "auth-middleware-security",
        "trackSlug": "nextjs",
        "title": "Authentication, Middleware & Security",
        "description": "Sessions, protected routes, and the security model of a framework where some of your code runs on a server and some does not.",
        "order": 12,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "auth-middleware-security",
            "title": "Authentication, Middleware & Security — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "testing-performance-deployment",
        "trackSlug": "nextjs",
        "title": "Testing, Performance & Deployment",
        "description": "Getting it live and keeping it fast: what to test at which layer, what to measure, and what deployment actually requires.",
        "order": 13,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "testing-performance-deployment",
            "title": "Testing, Performance & Deployment — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "advanced-and-mastery",
        "trackSlug": "nextjs",
        "title": "Advanced Patterns & Interview Mastery",
        "description": "The consolidation pass: architecture decisions in a real Next.js codebase, migration realities, and the questions interviews actually ask.",
        "order": 14,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "advanced-and-mastery",
            "title": "Advanced Patterns & Interview Mastery — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      }
    ]
  },
  {
    "id": "angular",
    "slug": "angular",
    "title": "Angular",
    "shortTitle": "Angular",
    "tagline": "Standalone components, signals, and a framework with batteries included",
    "description": "Angular from scratch to mastery, on the modern framework: standalone components, signals, the built-in control flow, and the new reactivity model — not AngularJS 1.x, which is a separate and long-superseded framework. You start with the CLI and your first component, learn templates and binding, then inputs and outputs (Angular's props), signals for state, dependency injection, routing, both forms systems, RxJS and HTTP, change detection and performance, server-side rendering with hydration, testing, and the architecture decisions large Angular codebases turn on.",
    "order": 6,
    "status": "coming-soon",
    "accent": "angular",
    "mode": "learn",
    "lessonMinutes": [
      25,
      40
    ],
    "interviewPrep": true,
    "runnable": false,
    "modules": [
      {
        "slug": "foundations",
        "trackSlug": "angular",
        "title": "What Angular Is & Your First App",
        "description": "What kind of framework Angular is and who it is for, then a running application: the CLI, the project layout, and your first component on screen.",
        "order": 1,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "foundations",
            "title": "What Angular Is & Your First App — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "components-and-templates",
        "trackSlug": "angular",
        "title": "Components, Templates & Binding",
        "description": "The template syntax: interpolation, the three kinds of binding, and the control flow that replaced the structural directives.",
        "order": 2,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "components-and-templates",
            "title": "Components, Templates & Binding — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "directives-and-pipes",
        "trackSlug": "angular",
        "title": "Directives & Pipes",
        "description": "Extending the template: attribute directives that change behaviour, and pipes that transform values on the way to the screen.",
        "order": 3,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "directives-and-pipes",
            "title": "Directives & Pipes — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "inputs-outputs-communication",
        "trackSlug": "angular",
        "title": "Inputs, Outputs & Component Communication",
        "description": "Angular's equivalent of props: passing data down with inputs, sending events up with outputs, and the signal-based versions that replaced the decorators.",
        "order": 4,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "inputs-outputs-communication",
            "title": "Inputs, Outputs & Component Communication — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "signals-and-state",
        "trackSlug": "angular",
        "title": "Signals & Reactive State",
        "description": "Angular's current reactivity model: values that know who is reading them, and the change detection that follows from that.",
        "order": 5,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "signals-and-state",
            "title": "Signals & Reactive State — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "services-and-di",
        "trackSlug": "angular",
        "title": "Services & Dependency Injection",
        "description": "The part of Angular that most distinguishes it: a real dependency injection container, and how to use it without fighting it.",
        "order": 6,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "services-and-di",
            "title": "Services & Dependency Injection — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "routing-and-navigation",
        "trackSlug": "angular",
        "title": "Routing & Navigation",
        "description": "The router: mapping URLs to components, loading code on demand, and guarding what should not be reachable.",
        "order": 7,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "routing-and-navigation",
            "title": "Routing & Navigation — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "forms",
        "trackSlug": "angular",
        "title": "Forms: Template-driven & Reactive",
        "description": "Both form systems, why Angular has two, and how to build a validated form that behaves well.",
        "order": 8,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "forms",
            "title": "Forms: Template-driven & Reactive — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "http-and-rxjs",
        "trackSlug": "angular",
        "title": "HTTP, RxJS & Async Data",
        "description": "Talking to a server, and the reactive library Angular is built on — the parts of RxJS you genuinely need, not the whole catalogue.",
        "order": 9,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "http-and-rxjs",
            "title": "HTTP, RxJS & Async Data — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "change-detection-performance",
        "trackSlug": "angular",
        "title": "Change Detection & Performance",
        "description": "How Angular decides to re-render, what zoneless changes, and the work that actually makes an Angular app fast.",
        "order": 10,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "change-detection-performance",
            "title": "Change Detection & Performance — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "ssr-and-hydration",
        "trackSlug": "angular",
        "title": "Server-Side Rendering & Hydration",
        "description": "Rendering Angular on the server: what changes, what breaks, and how hydration reuses the HTML you already sent.",
        "order": 11,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "ssr-and-hydration",
            "title": "Server-Side Rendering & Hydration — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "testing",
        "trackSlug": "angular",
        "title": "Testing",
        "description": "Testing an Angular application at each layer, using the tooling the framework provides.",
        "order": 12,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "testing",
            "title": "Testing — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "architecture-and-state",
        "trackSlug": "angular",
        "title": "Architecture, State Management & Libraries",
        "description": "Structuring an Angular application that several people work on, and choosing a state approach that matches its size.",
        "order": 13,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "architecture-and-state",
            "title": "Architecture, State Management & Libraries — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "advanced-and-mastery",
        "trackSlug": "angular",
        "title": "Advanced Angular & Interview Mastery",
        "description": "The consolidation pass: the parts of Angular that only come up in large codebases, plus the questions interviews use to find out whether you understand the framework or just its syntax.",
        "order": 14,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "advanced-and-mastery",
            "title": "Advanced Angular & Interview Mastery — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      }
    ]
  },
  {
    "id": "rust",
    "slug": "rust",
    "title": "Rust",
    "shortTitle": "Rust",
    "tagline": "Memory safety without a garbage collector, enforced at compile time",
    "description": "Rust from absolute zero — what it is, what it is for, and how to declare your first variable — through to writing systems software in it. You meet ownership early enough that the borrow checker stops being an obstacle, then work outward through traits, error handling, concurrency, async and unsafe. This is a track for building things: every module ends with programs you compile and run, and it finishes on shipping real projects rather than on interview questions.",
    "order": 7,
    "status": "coming-soon",
    "accent": "rust",
    "mode": "learn",
    "lessonMinutes": [
      25,
      40
    ],
    "interviewPrep": false,
    "runnable": false,
    "modules": [
      {
        "slug": "foundations",
        "trackSlug": "rust",
        "title": "What Rust Is & Your First Programs",
        "description": "Start at absolute zero: what Rust is, what problem it was built to solve, and where it is used — then install it, compile your first program, declare your first variable, and learn to read the compiler messages that will teach you the rest of the language.",
        "order": 1,
        "status": "available",
        "lessons": [
          {
            "slug": "what-is-rust",
            "moduleSlug": "foundations",
            "title": "What Rust Is, and Why It Exists",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "toolchain-and-first-program",
            "moduleSlug": "foundations",
            "title": "The Toolchain & Your First Program",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "variables-mutability-constants",
            "moduleSlug": "foundations",
            "title": "Declaring Variables: let, mut, Shadowing & Constants",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "scalar-types",
            "moduleSlug": "foundations",
            "title": "Scalar Types: Integers, Floats, Booleans & Characters",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "tuples-arrays-slices",
            "moduleSlug": "foundations",
            "title": "Compound Types: Tuples, Arrays & a First Look at Slices",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "reading-compiler-errors",
            "moduleSlug": "foundations",
            "title": "Reading What the Compiler Tells You",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "control-flow-functions",
        "trackSlug": "rust",
        "title": "Control Flow, Functions & Program Structure",
        "description": "Turning a page of statements into a program: functions with real signatures, the expression-oriented control flow that surprises people coming from C, and a first command-line tool you can actually use.",
        "order": 2,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "control-flow-functions",
            "title": "Control Flow, Functions & Program Structure — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "ownership-borrowing-lifetimes",
        "trackSlug": "rust",
        "title": "Ownership, Borrowing & Lifetimes",
        "description": "The module the whole language is built on: who owns a value, who may look at it, and how the compiler proves no reference outlives what it points to — all without a garbage collector.",
        "order": 3,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "ownership-borrowing-lifetimes",
            "title": "Ownership, Borrowing & Lifetimes — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "structs-enums-matching",
        "trackSlug": "rust",
        "title": "Structs, Enums & Pattern Matching",
        "description": "Rust's data modelling: product types, sum types, and the exhaustive matching that makes illegal states genuinely unrepresentable.",
        "order": 4,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "structs-enums-matching",
            "title": "Structs, Enums & Pattern Matching — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "collections-strings-iterators",
        "trackSlug": "rust",
        "title": "Collections, Strings & Iterators",
        "description": "The standard collections, the two string types that confuse everyone exactly once, and the iterator protocol that replaces most loops you would otherwise write.",
        "order": 5,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "collections-strings-iterators",
            "title": "Collections, Strings & Iterators — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "error-handling",
        "trackSlug": "rust",
        "title": "Error Handling",
        "description": "Errors as values: propagating with ?, designing error types other people can match on, and knowing the small set of cases where panicking is the correct answer.",
        "order": 6,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "error-handling",
            "title": "Error Handling — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "traits-generics",
        "trackSlug": "rust",
        "title": "Traits & Generics",
        "description": "How Rust does polymorphism: traits as shared behaviour, generics monomorphised at compile time, and trait objects for when the type is only known at runtime.",
        "order": 7,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "traits-generics",
            "title": "Traits & Generics — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "smart-pointers-interior-mutability",
        "trackSlug": "rust",
        "title": "Smart Pointers & Interior Mutability",
        "description": "What to reach for when a single owner and a compile-time borrow are not enough: heap allocation, shared ownership, and mutation checked at runtime instead.",
        "order": 8,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "smart-pointers-interior-mutability",
            "title": "Smart Pointers & Interior Mutability — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "modules-crates-cargo",
        "trackSlug": "rust",
        "title": "Modules, Crates & Cargo",
        "description": "How a Rust project is organised, built and published — the point where a file of code becomes something other people can depend on.",
        "order": 9,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "modules-crates-cargo",
            "title": "Modules, Crates & Cargo — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "testing-docs-debugging",
        "trackSlug": "rust",
        "title": "Testing, Documentation & Debugging",
        "description": "The feedback loop around your code: tests that run with one command, documentation the compiler checks, and what to do when a program still misbehaves.",
        "order": 10,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "testing-docs-debugging",
            "title": "Testing, Documentation & Debugging — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "concurrency-parallelism",
        "trackSlug": "rust",
        "title": "Concurrency & Parallelism",
        "description": "Why data races are a compile error in Rust, and how Send and Sync turn thread safety into something the type system checks rather than something you hope for.",
        "order": 11,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "concurrency-parallelism",
            "title": "Concurrency & Parallelism — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "async-rust",
        "trackSlug": "rust",
        "title": "Async Rust & Networked Services",
        "description": "Futures as state machines, the executor that drives them, and the ecosystem decisions you have to make before writing a line of async code — ending with a service that serves real traffic.",
        "order": 12,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "async-rust",
            "title": "Async Rust & Networked Services — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "unsafe-ffi-systems",
        "trackSlug": "rust",
        "title": "Unsafe, FFI & Systems Rust",
        "description": "The escape hatch and its contract: what unsafe actually permits, what you promise in exchange, and how Rust talks to the C world it has to live in.",
        "order": 13,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "unsafe-ffi-systems",
            "title": "Unsafe, FFI & Systems Rust — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "idiomatic-rust-projects",
        "trackSlug": "rust",
        "title": "Idiomatic Rust & Shipping Real Projects",
        "description": "The consolidation pass: turning working Rust into Rust other people enjoy depending on, and taking a project all the way from an empty directory to a released binary.",
        "order": 14,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "idiomatic-rust-projects",
            "title": "Idiomatic Rust & Shipping Real Projects — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      }
    ]
  },
  {
    "id": "go",
    "slug": "go",
    "title": "Go",
    "shortTitle": "Go",
    "tagline": "Small language, fast builds, and concurrency that fits in your head",
    "description": "Go from nothing installed through to writing the kind of software Go is actually used for: network services, command-line tools and infrastructure. You meet interfaces early, because implicit satisfaction is the idea the rest of the language is built around, and concurrency gets the two modules it needs rather than the one that leaves people writing data races. Every module ends in programs you compile and run, and the track finishes on shipping a real service — testing, profiling, and the deployment story that made Go the default for this kind of work.",
    "order": 8,
    "status": "available",
    "accent": "go",
    "mode": "learn",
    "lessonMinutes": [
      25,
      40
    ],
    "interviewPrep": false,
    "runnable": true,
    "modules": [
      {
        "slug": "foundations",
        "trackSlug": "go",
        "title": "Foundations",
        "description": "From nothing installed to reading and writing real Go. What the language is for and what it deliberately leaves out; the one command that is the whole toolchain; declarations and the zero-value guarantee; the numeric and string types, including the fact that a Go string holds bytes rather than characters; the four composite types and the array-versus-slice distinction that has to be understood rather than memorised; and finally functions, the single loop keyword, and errors as ordinary values.",
        "order": 1,
        "status": "available",
        "lessons": [
          {
            "slug": "what-go-is-and-why",
            "moduleSlug": "foundations",
            "title": "What Go Is, and What It Is For",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "toolchain-and-first-program",
            "moduleSlug": "foundations",
            "title": "The Toolchain & Your First Program",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "variables-constants-and-zero-values",
            "moduleSlug": "foundations",
            "title": "Variables, Constants & the Zero Value",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 5
          },
          {
            "slug": "numbers-strings-runes-and-bytes",
            "moduleSlug": "foundations",
            "title": "Numbers, Strings, Runes & Bytes",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "arrays-slices-maps-and-structs",
            "moduleSlug": "foundations",
            "title": "Arrays, Slices, Maps & Structs",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "functions-control-flow-and-errors",
            "moduleSlug": "foundations",
            "title": "Functions, Control Flow & Errors as Values",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "methods-interfaces-and-composition",
        "trackSlug": "go",
        "title": "Methods, Interfaces & Composition",
        "description": "The heart of Go's type system, and the module that changes how the rest of the language reads. No classes, no inheritance — methods on any named type, interfaces satisfied without declaring anything, and composition where other languages would subclass.",
        "order": 2,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "methods-interfaces-and-composition",
            "title": "Methods, Interfaces & Composition — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "errors-and-testing",
        "trackSlug": "go",
        "title": "Errors, Panics & Testing",
        "description": "Error handling beyond `if err != nil`: sentinel errors, custom error types, wrapping and unwrapping. Then the testing package, which is in the standard library and needs no framework.",
        "order": 3,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "errors-and-testing",
            "title": "Errors, Panics & Testing — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "packages-modules-and-project-layout",
        "trackSlug": "go",
        "title": "Packages, Modules & Project Layout",
        "description": "How Go code is organised at a scale bigger than one file: what a package is for, how visibility actually works, and the module system that replaced GOPATH.",
        "order": 4,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "packages-modules-and-project-layout",
            "title": "Packages, Modules & Project Layout — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "goroutines-and-channels",
        "trackSlug": "go",
        "title": "Goroutines & Channels",
        "description": "The feature Go is famous for. Goroutines cost a couple of kilobytes, channels move data between them, and select multiplexes. This module builds the model; the next one covers what goes wrong.",
        "order": 5,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "goroutines-and-channels",
            "title": "Goroutines & Channels — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "concurrency-safety-and-context",
        "trackSlug": "go",
        "title": "Concurrency Safety, Context & the Memory Model",
        "description": "The half that a one-module treatment leaves out. Races, the memory model, cancellation, and the leaks that only appear under load.",
        "order": 6,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "concurrency-safety-and-context",
            "title": "Concurrency Safety, Context & the Memory Model — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "the-standard-library",
        "trackSlug": "go",
        "title": "The Standard Library in Practice",
        "description": "Go's standard library is unusually complete, and knowing it is most of knowing Go. The packages you will reach for weekly, with the interfaces that tie them together.",
        "order": 7,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "the-standard-library",
            "title": "The Standard Library in Practice — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "generics",
        "trackSlug": "go",
        "title": "Generics",
        "description": "Added in Go 1.18 after thirteen years without them, and deliberately narrower than most languages'. What they can do, what they cannot, and why most Go code still does not need them.",
        "order": 8,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "generics",
            "title": "Generics — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "building-http-services",
        "trackSlug": "go",
        "title": "Building HTTP Services",
        "description": "The thing most Go is written for. net/http is in the standard library and is production-grade, so this module builds a real service on it rather than reaching for a framework.",
        "order": 9,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "building-http-services",
            "title": "Building HTTP Services — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "shipping-go",
        "trackSlug": "go",
        "title": "Shipping Go",
        "description": "Turning a program into software other people run: cross-compilation, small containers, profiling, and the tooling that keeps a codebase healthy.",
        "order": 10,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "shipping-go",
            "title": "Shipping Go — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      }
    ]
  },
  {
    "id": "assembly",
    "slug": "assembly",
    "title": "Assembly (x86-64)",
    "shortTitle": "ASM",
    "tagline": "What the machine actually executes, in Intel syntax with NASM",
    "description": "The layer underneath every other language, from the very beginning: what assembly is, why it still exists, and what a CPU is really doing. You start with bits and the fetch-decode-execute cycle, write real x86-64 programs in NASM on Linux — registers, addressing modes, the stack, the System V ABI and syscalls — then use that knowledge to read compiler output, debug binaries, and make code genuinely faster. Built for people who want to write and understand machine-level code, not for interview preparation.",
    "order": 9,
    "status": "coming-soon",
    "accent": "asm",
    "mode": "learn",
    "lessonMinutes": [
      25,
      40
    ],
    "interviewPrep": false,
    "runnable": false,
    "modules": [
      {
        "slug": "what-assembly-is",
        "trackSlug": "assembly",
        "title": "What Assembly Is & How a Machine Runs Code",
        "description": "Start at absolute zero: what assembly language actually is, why it is still written, and what a CPU is really doing when it runs a program — then follow a C file through every stage of the build, read a complete working NASM program line by line, and watch it execute one instruction at a time in a debugger.",
        "order": 1,
        "status": "available",
        "lessons": [
          {
            "slug": "what-is-assembly",
            "moduleSlug": "what-assembly-is",
            "title": "What Assembly Is, and Why It Still Matters",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "how-a-cpu-executes-a-program",
            "moduleSlug": "what-assembly-is",
            "title": "How a CPU Actually Executes a Program",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "from-source-to-process",
            "moduleSlug": "what-assembly-is",
            "title": "From Source Code to a Running Process",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "reading-your-first-program",
            "moduleSlug": "what-assembly-is",
            "title": "Reading Your First x86-64 Program",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "the-toolchain",
            "moduleSlug": "what-assembly-is",
            "title": "The Toolchain, and Seeing the Machine Code",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "numbers-bits-memory",
        "trackSlug": "assembly",
        "title": "Numbers, Bits & How Memory Is Addressed",
        "description": "Assembly has no types, so the representation is your responsibility. This module makes every bit pattern you will meet legible before you write code that manipulates them.",
        "order": 2,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "numbers-bits-memory",
            "title": "Numbers, Bits & How Memory Is Addressed — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "first-nasm-program",
        "trackSlug": "assembly",
        "title": "Your First NASM Program",
        "description": "Toolchain, program skeleton, and a working program on screen — assembled, linked, run and stepped through in a debugger before the module is over.",
        "order": 3,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "first-nasm-program",
            "title": "Your First NASM Program — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "registers-data-movement",
        "trackSlug": "assembly",
        "title": "Registers & Moving Data Around",
        "description": "The sixteen registers, the sub-register rules that surprise everyone exactly once, and every way of getting a value from one place to another.",
        "order": 4,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "registers-data-movement",
            "title": "Registers & Moving Data Around — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "arithmetic-logic-flags",
        "trackSlug": "assembly",
        "title": "Arithmetic, Logic & Flags",
        "description": "Doing the maths, and reading the flags register that every conditional branch in every program you have ever run depends on.",
        "order": 5,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "arithmetic-logic-flags",
            "title": "Arithmetic, Logic & Flags — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "control-flow",
        "trackSlug": "assembly",
        "title": "Control Flow",
        "description": "Rebuilding every construct you know — if, while, for, switch — out of labels and jumps, and seeing why the compiler sometimes refuses to branch at all.",
        "order": 6,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "control-flow",
            "title": "Control Flow — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "memory-addressing",
        "trackSlug": "assembly",
        "title": "Memory & Addressing Modes",
        "description": "The one addressing formula the whole instruction set uses, and how arrays, structs and strings are laid out to suit it.",
        "order": 7,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "memory-addressing",
            "title": "Memory & Addressing Modes — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "stack-and-calls",
        "trackSlug": "assembly",
        "title": "The Stack & Function Calls",
        "description": "How a function call actually works — the return address, the frame, and the ABI contract that lets code from different compilers link together at all.",
        "order": 8,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "stack-and-calls",
            "title": "The Stack & Function Calls — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "os-interface",
        "trackSlug": "assembly",
        "title": "Talking to the Operating System",
        "description": "Everything a program cannot do by itself: files, arguments, and memory that the kernel has to hand out.",
        "order": 9,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "os-interface",
            "title": "Talking to the Operating System — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "linking-libc-mixed",
        "trackSlug": "assembly",
        "title": "Linking, libc & Mixing C with Assembly",
        "description": "Where assembly earns its keep in real projects: as a routine inside a larger program, called from C and calling back into it.",
        "order": 10,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "linking-libc-mixed",
            "title": "Linking, libc & Mixing C with Assembly — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "reading-compiler-output",
        "trackSlug": "assembly",
        "title": "Reading Compiler Output & Disassembly",
        "description": "The payoff module: point a compiler at C or Rust, read what it produced, and understand every transformation it made — plus AT&T syntax, since that is what the tools print.",
        "order": 11,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "reading-compiler-output",
            "title": "Reading Compiler Output & Disassembly — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "simd-floating-point",
        "trackSlug": "assembly",
        "title": "SIMD & Floating Point",
        "description": "Floating point as it is really represented, and the vector registers that do four or eight operations for the price of one.",
        "order": 12,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "simd-floating-point",
            "title": "SIMD & Floating Point — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "debugging-and-memory-safety",
        "trackSlug": "assembly",
        "title": "Debugging, Crashes & Memory Safety",
        "description": "Using machine-level knowledge to find real bugs: reading a crash, understanding how memory corruption happens, and knowing what each modern mitigation actually stops.",
        "order": 13,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "debugging-and-memory-safety",
            "title": "Debugging, Crashes & Memory Safety — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "optimisation-and-projects",
        "trackSlug": "assembly",
        "title": "Optimisation & Assembly in Real Projects",
        "description": "Why two instruction sequences that do identical work run at different speeds, how to measure it honestly, and where hand-written assembly still belongs in a modern codebase.",
        "order": 14,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "optimisation-and-projects",
            "title": "Optimisation & Assembly in Real Projects — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      }
    ]
  },
  {
    "id": "cpp",
    "slug": "cpp",
    "title": "C++",
    "shortTitle": "C++",
    "tagline": "From your first variable to production systems, with nothing skipped",
    "description": "C++ from absolute zero — what it is, how a source file becomes an executable, and how to declare your first variable — through to writing production software in it. You learn functions and control flow, then memory and pointers, then classes, constructors and destructors and the RAII idea that makes C++ safe without a garbage collector. From there: move semantics, polymorphism, templates, the standard library, exception safety, concurrency, build systems and performance. The track finishes on production work — designing types other people depend on, structuring a real codebase, and shipping two complete applications.",
    "order": 10,
    "status": "available",
    "accent": "cpp",
    "mode": "learn",
    "lessonMinutes": [
      25,
      40
    ],
    "interviewPrep": true,
    "runnable": false,
    "modules": [
      {
        "slug": "foundations",
        "trackSlug": "cpp",
        "title": "What C++ Is & Your First Programs",
        "description": "Start at absolute zero: what C++ is, what problem it exists to solve, and how a source file becomes an executable — then declare your first variable, meet the fundamental types and the traps in them, get data in and out of a program, and learn to read the compiler messages that will teach you the rest of the language.",
        "order": 1,
        "status": "available",
        "lessons": [
          {
            "slug": "what-cpp-is",
            "moduleSlug": "foundations",
            "title": "What C++ Is, What It Is For & Where It Runs",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "first-program-and-the-build",
            "moduleSlug": "foundations",
            "title": "Your First Program & How It Gets Built",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "declaring-variables",
            "moduleSlug": "foundations",
            "title": "Declaring Variables: Initialisation, const & auto",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "fundamental-types",
            "moduleSlug": "foundations",
            "title": "The Fundamental Types & Their Traps",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "operators-and-expressions",
            "moduleSlug": "foundations",
            "title": "Operators & Expressions",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "input-output-and-format",
            "moduleSlug": "foundations",
            "title": "Input, Output & std::format",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "reading-compiler-errors",
            "moduleSlug": "foundations",
            "title": "Reading Compiler & Linker Errors",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "control-flow-functions",
        "trackSlug": "cpp",
        "title": "Control Flow, Functions & Program Structure",
        "description": "Turning a page of statements into a program: branching and loops, functions with real signatures, and the decision you make on every one of them — whether a parameter is copied, exposed or lent read-only. Then the two things that make a codebase rather than a file: when objects are created and destroyed, and how to split one source file into headers and translation units the linker can join.",
        "order": 2,
        "status": "available",
        "lessons": [
          {
            "slug": "branching-if-switch",
            "moduleSlug": "control-flow-functions",
            "title": "Branching: if, switch & the Conditional Operator",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "loops",
            "moduleSlug": "control-flow-functions",
            "title": "Loops: while, for & the Range-Based for",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "declaring-functions",
            "moduleSlug": "control-flow-functions",
            "title": "Declaring & Defining Functions",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "passing-parameters",
            "moduleSlug": "control-flow-functions",
            "title": "Passing by Value, by Reference & by const Reference",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "overloading-and-defaults",
            "moduleSlug": "control-flow-functions",
            "title": "Overloading, Default Arguments & inline",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "scope-storage-lifetime",
            "moduleSlug": "control-flow-functions",
            "title": "Scope, Storage Duration & Lifetime",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "headers-and-the-odr",
            "moduleSlug": "control-flow-functions",
            "title": "Headers, Translation Units & the One-Definition Rule",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "memory-pointers-references",
        "trackSlug": "cpp",
        "title": "Memory, Pointers & References",
        "description": "Where objects actually live, what a pointer really is, and who is responsible for freeing what. This is the module that separates C++ from managed languages: you meet the five memory bug classes by writing them deliberately and catching each one with a sanitizer, learn const correctness as a discipline, and finish on RAII — the idea that makes all of it safe without a garbage collector, and the foundation the next module is built on.",
        "order": 3,
        "status": "available",
        "lessons": [
          {
            "slug": "the-memory-model",
            "moduleSlug": "memory-pointers-references",
            "title": "Where Objects Live: Stack, Heap & Static Storage",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "pointers",
            "moduleSlug": "memory-pointers-references",
            "title": "Pointers: Addresses, Dereferencing & nullptr",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "pointer-arithmetic-and-arrays",
            "moduleSlug": "memory-pointers-references",
            "title": "Pointer Arithmetic, Arrays & Decay",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "dynamic-allocation",
            "moduleSlug": "memory-pointers-references",
            "title": "Dynamic Allocation: new, delete & the Ownership Question",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "memory-bugs-and-sanitizers",
            "moduleSlug": "memory-pointers-references",
            "title": "The Five Memory Bugs & the Sanitizers That Find Them",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "const-correctness",
            "moduleSlug": "memory-pointers-references",
            "title": "const Correctness",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "ownership-and-raii",
            "moduleSlug": "memory-pointers-references",
            "title": "From Raw Pointers to Ownership: RAII & unique_ptr",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "classes-constructors-destructors",
        "trackSlug": "cpp",
        "title": "Structs, Classes, Constructors & Destructors",
        "description": "Defining your own types. Start with structs as plain groups of data, then meet the idea that makes a class worth writing — an invariant the type guarantees. Constructors establish it, member initialiser lists build it efficiently, and destructors tie a resource's lifetime to an object's, which is RAII done in your own code. Finishes with `this`, static members, `friend`, and giving your types the syntax of built-in ones.",
        "order": 4,
        "status": "available",
        "lessons": [
          {
            "slug": "structs",
            "moduleSlug": "classes-constructors-destructors",
            "title": "Structs: Grouping Data",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "classes-and-invariants",
            "moduleSlug": "classes-constructors-destructors",
            "title": "From Struct to Class: Invariants & Encapsulation",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "constructors",
            "moduleSlug": "classes-constructors-destructors",
            "title": "Constructors",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "member-initialiser-lists",
            "moduleSlug": "classes-constructors-destructors",
            "title": "Member Initialiser Lists & Initialisation Order",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "destructors-and-raii",
            "moduleSlug": "classes-constructors-destructors",
            "title": "Destructors & Writing Your Own RAII Types",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "this-static-members-friends",
            "moduleSlug": "classes-constructors-destructors",
            "title": "this, Static Members & friend",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "operator-overloading",
            "moduleSlug": "classes-constructors-destructors",
            "title": "Operator Overloading",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "copy-move-rule-of-five",
        "trackSlug": "cpp",
        "title": "Copy, Move & the Rule of Five",
        "description": "What happens when an object is copied, and what changed when C++11 let you steal from a value nobody needs any more. The generated copy is exactly right for a class of standard members and catastrophically wrong for one holding a raw pointer; move semantics make transfers cheap, but only if you get one keyword right. Ends with the rule of zero — the observation that the best version of all this is code you never write — and a complete resource-owning class tested under a sanitizer.",
        "order": 5,
        "status": "available",
        "lessons": [
          {
            "slug": "copy-constructor-and-assignment",
            "moduleSlug": "copy-move-rule-of-five",
            "title": "The Copy Constructor & Copy Assignment",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "value-categories",
            "moduleSlug": "copy-move-rule-of-five",
            "title": "Value Categories: lvalue, prvalue & xvalue",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "move-constructor-and-assignment",
            "moduleSlug": "copy-move-rule-of-five",
            "title": "The Move Constructor & Move Assignment",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "std-move-and-moved-from",
            "moduleSlug": "copy-move-rule-of-five",
            "title": "std::move & What a Moved-From Object Is",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "rule-of-zero-three-five",
            "moduleSlug": "copy-move-rule-of-five",
            "title": "The Rule of Zero, Three & Five",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "copy-elision-and-rvo",
            "moduleSlug": "copy-move-rule-of-five",
            "title": "Copy Elision, RVO & the Copies You Never Pay For",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "writing-a-resource-owning-class",
            "moduleSlug": "copy-move-rule-of-five",
            "title": "Writing a Resource-Owning Class End to End",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "inheritance-polymorphism",
        "trackSlug": "cpp",
        "title": "Inheritance & Polymorphism",
        "description": "One keyword decides whether a call consults the declaration or the object, and the module takes that apart down to the two instructions it compiles to — vtable dumped, vptr read out of a live object, and the call watched devirtualizing when a class is marked final. Then the ways it silently breaks: a destructor missing `virtual` that leaks 32KB, a signature off by one `const` that never overrode anything, a missing `&` that copies half an object. Ends on multiple inheritance and the diamond, and the argument that composition should have been the first choice anyway.",
        "order": 6,
        "status": "available",
        "lessons": [
          {
            "slug": "public-inheritance-and-is-a",
            "moduleSlug": "inheritance-polymorphism",
            "title": "Public Inheritance & the is-a Relationship",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "virtual-functions-and-dynamic-dispatch",
            "moduleSlug": "inheritance-polymorphism",
            "title": "Virtual Functions & Dynamic Dispatch",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 9
          },
          {
            "slug": "vtable-and-vptr",
            "moduleSlug": "inheritance-polymorphism",
            "title": "The vtable & vptr, Inspected in Real Memory",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 10
          },
          {
            "slug": "abstract-classes-and-interfaces",
            "moduleSlug": "inheritance-polymorphism",
            "title": "Abstract Classes, Pure Virtual Functions & Interfaces",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "virtual-destructors-and-slicing",
            "moduleSlug": "inheritance-polymorphism",
            "title": "Virtual Destructors & Object Slicing",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "override-final-and-silent-non-overrides",
            "moduleSlug": "inheritance-polymorphism",
            "title": "override, final & the Overrides That Silently Are Not",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "multiple-inheritance-and-composition",
            "moduleSlug": "inheritance-polymorphism",
            "title": "Multiple Inheritance, the Diamond & Composition Instead",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 13
          }
        ]
      },
      {
        "slug": "templates-generics",
        "trackSlug": "cpp",
        "title": "Templates & Generic Programming",
        "description": "Writing code once and letting the compiler generate a version per type. Deduction and the decay that quietly drops a `const`, specialisation and the type traits built entirely out of it, parameter packs and the fold expressions that ended the recursion, and a prime sieve using `std::vector` that compiles down to a single `mov` instruction. Ends on concepts — what they fixed about error messages, measured against the same mistake made without them — and the SFINAE they replaced, which every codebase older than C++20 is still full of.",
        "order": 7,
        "status": "available",
        "lessons": [
          {
            "slug": "function-templates-and-deduction",
            "moduleSlug": "templates-generics",
            "title": "Function Templates, Deduction & Instantiation",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "class-templates-and-deduction-guides",
            "moduleSlug": "templates-generics",
            "title": "Class Templates, Default Arguments & Deduction Guides",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "full-and-partial-specialisation",
            "moduleSlug": "templates-generics",
            "title": "Full & Partial Specialisation",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "variadic-templates-and-folds",
            "moduleSlug": "templates-generics",
            "title": "Variadic Templates, Parameter Packs & Fold Expressions",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "constexpr-and-compile-time-computation",
            "moduleSlug": "templates-generics",
            "title": "constexpr, consteval & Computing at Compile Time",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "concepts-and-constrained-templates",
            "moduleSlug": "templates-generics",
            "title": "Concepts & Constrained Templates",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "sfinae-enable-if-and-older-generic-code",
            "moduleSlug": "templates-generics",
            "title": "SFINAE, enable_if & the Code You Will Still Have to Read",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 11
          }
        ]
      },
      {
        "slug": "standard-library",
        "trackSlug": "cpp",
        "title": "The Standard Library",
        "description": "Containers, iterators and algorithms as one design, chosen on the guarantees rather than on habit. `vector`'s doubling and the reallocation that invalidates every pointer into it; a linked list losing a traversal by ten times and winning a front-insert by four hundred; the `operator[]` that silently inserts and the comparator that makes `std::sort` write out of bounds. Ends on `string_view` turning a hundred allocations into zero, and the C++20 ranges rewrite — projections, lazy pipelines, and what they cost.",
        "order": 8,
        "status": "available",
        "lessons": [
          {
            "slug": "vector-growth-and-reallocation",
            "moduleSlug": "standard-library",
            "title": "vector: Growth, Capacity, reserve & the Reallocation You Did Not See",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "deque-list-and-forward-list",
            "moduleSlug": "standard-library",
            "title": "deque, list & forward_list — and When Each Actually Wins",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 10
          },
          {
            "slug": "map-and-set-against-unordered",
            "moduleSlug": "standard-library",
            "title": "map & set Against Their Unordered Counterparts",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "iterator-categories-and-invalidation",
            "moduleSlug": "standard-library",
            "title": "Iterator Categories & Invalidation",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "algorithms-predicates-and-erase-remove",
            "moduleSlug": "standard-library",
            "title": "Algorithms, Predicates & the Erase-Remove Idiom",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "string-and-string-view",
            "moduleSlug": "standard-library",
            "title": "std::string & string_view — Avoiding Needless Copies",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "ranges-views-and-pipelines",
            "moduleSlug": "standard-library",
            "title": "Ranges, Views & Composing Pipelines",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 11
          }
        ]
      },
      {
        "slug": "modern-cpp-idioms",
        "trackSlug": "cpp",
        "title": "Modern C++ Idioms",
        "description": "The features that changed how C++ is written. Smart pointers that make a double free unrepresentable rather than merely unlikely, and the reference cycle that leaks anyway until one pointer is made weak. Lambdas taken apart as the classes the compiler writes them into, and the `[=]` in a member function that captures `this` rather than the members. Then perfect forwarding, the type erasure behind `std::function` and the six-times cost it carries, and the vocabulary types — `optional` and `variant` — that let a signature state absence and choice instead of encoding them in a sentinel.",
        "order": 9,
        "status": "available",
        "lessons": [
          {
            "slug": "unique-ptr-and-sole-ownership",
            "moduleSlug": "modern-cpp-idioms",
            "title": "unique_ptr & Expressing Sole Ownership in the Type",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "shared-ptr-weak-ptr-and-control-blocks",
            "moduleSlug": "modern-cpp-idioms",
            "title": "shared_ptr, weak_ptr, Control Blocks & Reference Cycles",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 15
          },
          {
            "slug": "lambdas-captures-and-closure-types",
            "moduleSlug": "modern-cpp-idioms",
            "title": "Lambdas, Capture Modes & the Closure Type the Compiler Writes",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "forwarding-references-and-perfect-forwarding",
            "moduleSlug": "modern-cpp-idioms",
            "title": "Forwarding References, Perfect Forwarding & std::forward",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "std-function-and-type-erasure",
            "moduleSlug": "modern-cpp-idioms",
            "title": "std::function, Type Erasure & What It Costs",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "optional-and-variant",
            "moduleSlug": "modern-cpp-idioms",
            "title": "optional & variant — Absence and Choice, Honestly",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "structured-bindings-if-init-and-designated-initialisers",
            "moduleSlug": "modern-cpp-idioms",
            "title": "Structured Bindings, if-init & Designated Initialisers",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 11
          }
        ]
      },
      {
        "slug": "error-handling",
        "trackSlug": "cpp",
        "title": "Error Handling & Exception Safety",
        "description": "Stack unwinding running every destructor on the way out — the mechanism RAII depends on — and the four guarantees a function can promise about what it leaves behind, measured on two classes that differ only in whether they build aside before committing. Then copy-and-swap, which gets self-assignment safety and the strong guarantee for free from one by-value parameter, and the single `noexcept` keyword that decides whether `vector` moves or copies on every reallocation. Ends by choosing deliberately between the four mechanisms: assertions for your bugs, `error_code` and `std::expected` for expected failures, exceptions for rare ones — and making the invalid state unrepresentable so you handle nothing at all.",
        "order": 10,
        "status": "available",
        "lessons": [
          {
            "slug": "throw-catch-and-stack-unwinding",
            "moduleSlug": "error-handling",
            "title": "Exceptions: throw, catch & Stack Unwinding",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "exception-safety-guarantees",
            "moduleSlug": "error-handling",
            "title": "The Exception Safety Guarantees: Basic, Strong & Nothrow",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 11
          },
          {
            "slug": "copy-and-swap",
            "moduleSlug": "error-handling",
            "title": "Writing Strongly Exception-Safe Code with Copy-and-Swap",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "noexcept-and-vector-growth",
            "moduleSlug": "error-handling",
            "title": "noexcept, Move Operations & Why vector's Growth Depends On It",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "error-codes-and-std-error-code",
            "moduleSlug": "error-handling",
            "title": "Error Codes, std::error_code & When Exceptions Are the Wrong Tool",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "std-expected-returning-errors-as-values",
            "moduleSlug": "error-handling",
            "title": "std::expected & Returning Errors as Values",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "assertions-invariants-and-failing-fast",
            "moduleSlug": "error-handling",
            "title": "Assertions, Invariants & Failing Fast in the Right Place",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 12
          }
        ]
      },
      {
        "slug": "concurrency",
        "trackSlug": "cpp",
        "title": "Concurrency & Parallelism",
        "description": "Threads, the memory model, and the primitives that make concurrent code correct rather than merely fast on the machine you tested it on. A data race losing 178,000 updates at `-O0` and producing a flawless answer at `-O2` — because the optimiser collapsed the loop to one instruction — with ThreadSanitizer catching it either way. A real deadlock hanging until it is killed, and the lock hierarchy that turns an ordering bug into a single-threaded exception. Then a producer/consumer queue with a shutdown path that actually terminates, the `std::async` destructor that silently serialised three parallel tasks, false sharing costing 6× on counters nobody shared, and the memory orderings measured down to the x86 instructions they compile to.",
        "order": 11,
        "status": "available",
        "lessons": [
          {
            "slug": "threads-joining-detaching-and-jthread",
            "moduleSlug": "concurrency",
            "title": "Threads, Joining, Detaching & jthread's Automatic Join",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "data-races-and-what-the-standard-says",
            "moduleSlug": "concurrency",
            "title": "Data Races & What the Standard Actually Says About Them",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "mutexes-lock-guards-and-deadlock",
            "moduleSlug": "concurrency",
            "title": "Mutexes, lock_guard, unique_lock, scoped_lock & Deadlock",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 14
          },
          {
            "slug": "condition-variables-and-a-correct-queue",
            "moduleSlug": "concurrency",
            "title": "Condition Variables & a Producer/Consumer Queue That Is Actually Correct",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 14
          },
          {
            "slug": "future-promise-async-and-packaged-task",
            "moduleSlug": "concurrency",
            "title": "future, promise, async & packaged_task",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "atomics-compare-exchange-and-lock-free",
            "moduleSlug": "concurrency",
            "title": "Atomics, Compare-Exchange & Lock-Free Against Wait-Free",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "the-memory-model-and-memory-orderings",
            "moduleSlug": "concurrency",
            "title": "The C++ Memory Model & the Memory Orderings",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 15
          }
        ]
      },
      {
        "slug": "build-tooling-testing",
        "trackSlug": "cpp",
        "title": "Build Systems, Tooling & Testing",
        "description": "The parts of C++ that are not the language, and that decide whether a project is pleasant or miserable to work on. Modern CMake as targets carrying usage requirements, and the `PUBLIC`/`PRIVATE` distinction that decides what your consumers inherit. Dependencies found, fetched or vendored, and why C++ needed thirty years to get a package manager — the ABI problem, stated concretely. Then the tools that find what testing cannot: sanitizers turning undefined behaviour into a diagnostic, a warning set producing nine real findings from one small file, GCC's path-sensitive analyzer catching a leak on an early-return path, and a CI pipeline assembling all of it.",
        "order": 12,
        "status": "available",
        "lessons": [
          {
            "slug": "cmake-targets-properties-and-usage-requirements",
            "moduleSlug": "build-tooling-testing",
            "title": "CMake from First Principles: Targets, Properties & Usage Requirements",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 14
          },
          {
            "slug": "find-package-and-fetchcontent",
            "moduleSlug": "build-tooling-testing",
            "title": "Dependencies with find_package & FetchContent",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "modules-as-the-successor-to-headers",
            "moduleSlug": "build-tooling-testing",
            "title": "Modules as the Successor to Headers, and What They Change",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "package-management-with-vcpkg-and-conan",
            "moduleSlug": "build-tooling-testing",
            "title": "Package Management with vcpkg & Conan",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "sanitizers-address-undefined-and-thread",
            "moduleSlug": "build-tooling-testing",
            "title": "Sanitizers: Address, Undefined Behaviour & Thread",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "static-analysis-and-warnings-worth-enforcing",
            "moduleSlug": "build-tooling-testing",
            "title": "Static Analysis, and the Warnings Worth Turning On and Enforcing",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 15
          },
          {
            "slug": "unit-testing-and-ci-end-to-end",
            "moduleSlug": "build-tooling-testing",
            "title": "Unit Testing with GoogleTest & Catch2, and a CI Pipeline End to End",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 13
          }
        ]
      },
      {
        "slug": "performance-systems",
        "trackSlug": "cpp",
        "title": "Performance & Systems Programming",
        "description": "Why fast C++ is mostly about data layout and undefined behaviour rather than clever code, and how to measure instead of guessing. Undefined behaviour shown as a premise the optimiser reasons from — a null check deleted, an infinite loop compiled to a bare `ret`. The memory hierarchy swept on real hardware from 3.4ns in L1 to 93ns in RAM, and a strided loop where halving the arithmetic saves nothing at all. Then padding measured halving a struct, four microbenchmark traps caught reporting work that never happened, an arena taking 200,019 allocations down to 7, and LTO turning a 665ms loop into 0.0ms by inlining across a translation unit and deleting it.",
        "order": 13,
        "status": "available",
        "lessons": [
          {
            "slug": "undefined-behaviour-and-the-optimiser",
            "moduleSlug": "performance-systems",
            "title": "Undefined Behaviour & What the Optimiser Is Allowed to Assume",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "caches-locality-and-data-layout",
            "moduleSlug": "performance-systems",
            "title": "Caches, Locality & Why Data Layout Beats Clever Code",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "alignment-padding-and-class-layout",
            "moduleSlug": "performance-systems",
            "title": "Alignment, Padding & the Layout of a Class in Memory",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "profilers-benchmarks-and-microbenchmark-traps",
            "moduleSlug": "performance-systems",
            "title": "Profilers, Benchmarks & the Microbenchmark Traps",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 14
          },
          {
            "slug": "allocators-arenas-and-small-buffer-optimisation",
            "moduleSlug": "performance-systems",
            "title": "Custom Allocators, Arenas & Small-Buffer Optimisation",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "inlining-lto-and-reading-assembly",
            "moduleSlug": "performance-systems",
            "title": "Inlining, Link-Time Optimisation & Reading the Generated Assembly",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 12
          },
          {
            "slug": "bit-manipulation-span-and-byte",
            "moduleSlug": "performance-systems",
            "title": "Bit Manipulation, std::span & std::byte for Low-Level Work",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 13
          }
        ]
      },
      {
        "slug": "production-cpp",
        "trackSlug": "cpp",
        "title": "Production C++: Designing & Shipping Real Applications",
        "description": "The consolidation pass: turning working C++ into C++ other people can depend on. Designing a class around its invariant and making the invalid states unrepresentable, so the checks you were going to write become unnecessary. Physical design as the thing that actually controls build times, and the pimpl destructor that fails with an incomplete-type error if you forget it. Configuration validated once at startup, logs as structured events rather than sentences, and the filesystem and socket edges where TOCTOU races and partial reads live. Ends with two complete programs: a command-line tool verified against the system `wc`, and a concurrent TCP service driven by six clients through thirty round trips with zero ThreadSanitizer warnings.",
        "order": 14,
        "status": "available",
        "lessons": [
          {
            "slug": "designing-a-class-interfaces-and-invariants",
            "moduleSlug": "production-cpp",
            "title": "Designing a Class: Interfaces, Invariants & API Ergonomics",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "structuring-a-real-codebase",
            "moduleSlug": "production-cpp",
            "title": "Structuring a Real Codebase: Layering, Dependencies & Build Times",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "configuration-logging-and-observability",
            "moduleSlug": "production-cpp",
            "title": "Configuration, Structured Logging & Observability",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 14
          },
          {
            "slug": "filesystem-processes-and-networking",
            "moduleSlug": "production-cpp",
            "title": "Filesystem, Processes & Networking at the Edges of a Program",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "reading-reviewing-and-interviewing",
            "moduleSlug": "production-cpp",
            "title": "Reading Unfamiliar C++, Reviewing It Well & the Questions That Separate Familiarity from Fluency",
            "estimatedMinutes": 40,
            "status": "available",
            "takeawayCount": 13
          },
          {
            "slug": "project-a-production-command-line-tool",
            "moduleSlug": "production-cpp",
            "title": "Project: A Production-Grade Command-Line Tool, from Empty Directory to Release",
            "estimatedMinutes": 45,
            "status": "available",
            "takeawayCount": 14
          },
          {
            "slug": "project-a-concurrent-tcp-service",
            "moduleSlug": "production-cpp",
            "title": "Project: A Concurrent TCP Service, End to End",
            "estimatedMinutes": 45,
            "status": "available",
            "takeawayCount": 14
          }
        ]
      }
    ]
  },
  {
    "id": "java",
    "slug": "java",
    "title": "Java",
    "shortTitle": "Java",
    "tagline": "The whole language back in your hands, one short topic at a time",
    "description": "A revision pass over Java that starts at the beginning and does not skip anything, but respects that you have written it before. Each topic is a self-contained 10 to 15 minute refresher — what it is, the part people get wrong, and the interview question attached to it — running from the JVM and objects through generics, collections, streams, the memory model and modern Java up to Java 25.",
    "order": 11,
    "status": "coming-soon",
    "accent": "java",
    "mode": "revise",
    "lessonMinutes": [
      10,
      15
    ],
    "interviewPrep": true,
    "runnable": false,
    "modules": [
      {
        "slug": "java-and-the-jvm",
        "trackSlug": "java",
        "title": "Java & the JVM, Refreshed",
        "description": "The execution model underneath everything: what javac produces, what the JVM does with it, and the type distinctions that decide how your data behaves.",
        "order": 1,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "java-and-the-jvm",
            "title": "Java & the JVM, Refreshed — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "objects-classes-encapsulation",
        "trackSlug": "java",
        "title": "Objects, Classes & Encapsulation",
        "description": "Everything about a single class: construction, state, identity, and the contracts the platform expects you to honour.",
        "order": 2,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "objects-classes-encapsulation",
            "title": "Objects, Classes & Encapsulation — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "inheritance-interfaces-polymorphism",
        "trackSlug": "java",
        "title": "Inheritance, Interfaces & Polymorphism",
        "description": "Subtyping in Java: what is dispatched dynamically, what is not, and how interfaces changed once they gained default methods.",
        "order": 3,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "inheritance-interfaces-polymorphism",
            "title": "Inheritance, Interfaces & Polymorphism — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "generics-type-erasure",
        "trackSlug": "java",
        "title": "Generics & Type Erasure",
        "description": "Generics as they really work: a compile-time-only feature, with every surprising restriction traceable back to erasure.",
        "order": 4,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "generics-type-erasure",
            "title": "Generics & Type Erasure — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "collections-framework",
        "trackSlug": "java",
        "title": "The Collections Framework",
        "description": "Every collection worth knowing, its complexity, and the one property that should decide which you pick.",
        "order": 5,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "collections-framework",
            "title": "The Collections Framework — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "streams-lambdas-functional",
        "trackSlug": "java",
        "title": "Streams, Lambdas & Functional Java",
        "description": "The functional half of modern Java, including the parts of the Stream API that behave differently from how they read.",
        "order": 6,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "streams-lambdas-functional",
            "title": "Streams, Lambdas & Functional Java — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "exceptions-resources",
        "trackSlug": "java",
        "title": "Exceptions & Resource Management",
        "description": "Java's error model, the checked exception debate, and the constructs that make cleanup reliable.",
        "order": 7,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "exceptions-resources",
            "title": "Exceptions & Resource Management — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "concurrency-memory-model",
        "trackSlug": "java",
        "title": "Concurrency & the Java Memory Model",
        "description": "Threads, the happens-before relationship that makes concurrent code correct, and the high-level tools that mean you rarely write wait and notify.",
        "order": 8,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "concurrency-memory-model",
            "title": "Concurrency & the Java Memory Model — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "memory-gc-performance",
        "trackSlug": "java",
        "title": "Memory, GC & Performance",
        "description": "Where objects live, how they are collected, and how to find out why something is slow instead of guessing.",
        "order": 9,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "memory-gc-performance",
            "title": "Memory, GC & Performance — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 7
          }
        ]
      },
      {
        "slug": "modern-java",
        "trackSlug": "java",
        "title": "Modern Java, 8 to 25",
        "description": "Everything added since the Java you may have learned, so the language in front of you matches the language in your head.",
        "order": 10,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "modern-java",
            "title": "Modern Java, 8 to 25 — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "build-test-tooling",
        "trackSlug": "java",
        "title": "Build, Test & Tooling",
        "description": "The ecosystem around the code: building, testing, and finding out what a running JVM is doing.",
        "order": 11,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "build-test-tooling",
            "title": "Build, Test & Tooling — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 6
          }
        ]
      },
      {
        "slug": "design-interview-mastery",
        "trackSlug": "java",
        "title": "Design & Interview Mastery",
        "description": "The consolidation pass: the judgement questions an interview is really testing, answered with the whole track behind you.",
        "order": 12,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "design-interview-mastery",
            "title": "Design & Interview Mastery — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 6
          }
        ]
      }
    ]
  },
  {
    "id": "spring-boot",
    "slug": "spring-boot",
    "title": "Spring Boot",
    "shortTitle": "Spring",
    "tagline": "From your first bean to an enterprise service you can deploy",
    "description": "Spring Boot from nothing — what the framework actually does for you, why dependency injection exists, and how a plain Java method becomes an HTTP endpoint — through to production. You learn the container and configuration, then Spring MVC and REST API design, persistence with Spring Data JPA, and testing. Then Spring Security in depth across authentication, authorization and OAuth2/JWT. Then the other three ways services talk: GraphQL, WebSocket and webhooks. Then Spring AI, from a first chat call to RAG, tool calling and MCP. The track ends where real work does: observability, packaging, deployment and performance. Built on Spring Boot 4.1 and Java 25, with every example compiled and run.",
    "order": 12,
    "status": "available",
    "accent": "spring",
    "mode": "learn",
    "lessonMinutes": [
      25,
      40
    ],
    "interviewPrep": true,
    "runnable": false,
    "modules": [
      {
        "slug": "foundations",
        "trackSlug": "spring-boot",
        "title": "Foundations",
        "description": "Everything you need before the framework can teach you anything else: what Spring Boot is and what it replaces, a running application, the anatomy of the project it generated, the three-step move from a plain Java class to an HTTP endpoint, where the beans you never wrote come from, how configuration reaches your code, and how to read a startup that fails.",
        "order": 1,
        "status": "available",
        "lessons": [
          {
            "slug": "what-spring-boot-is",
            "moduleSlug": "foundations",
            "title": "What Spring Boot Is, and the Problem It Solves",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "your-first-application",
            "moduleSlug": "foundations",
            "title": "Your First Application: Initializr to a Running Server",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 6
          },
          {
            "slug": "project-anatomy",
            "moduleSlug": "foundations",
            "title": "Anatomy of a Spring Boot Project",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "from-java-to-http",
            "moduleSlug": "foundations",
            "title": "From a Plain Java Class to an HTTP Endpoint",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "auto-configuration",
            "moduleSlug": "foundations",
            "title": "Auto-Configuration: Where the Beans You Never Wrote Come From",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "configuration-and-profiles",
            "moduleSlug": "foundations",
            "title": "Configuration: Properties, Profiles and Precedence",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "reading-a-failed-startup",
            "moduleSlug": "foundations",
            "title": "Reading a Failed Startup",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "beans-and-configuration",
        "trackSlug": "spring-boot",
        "title": "The Container: Beans, Injection & Configuration",
        "description": "The engine under every Spring application. What a bean actually is and how one gets created, the two ways to declare one, why constructor injection is the only style worth using, what to do when two beans could satisfy one dependency, how long each bean lives, and how one part of the application tells another that something happened without holding a reference to it. It closes on configuration as the container sees it: a group of properties bound onto a typed, validated bean, and beans that are only registered when a condition holds.",
        "order": 2,
        "status": "available",
        "lessons": [
          {
            "slug": "what-a-bean-is",
            "moduleSlug": "beans-and-configuration",
            "title": "What a Bean Is, and the Container That Holds It",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "declaring-beans",
            "moduleSlug": "beans-and-configuration",
            "title": "Declaring Beans: Stereotypes, @Configuration and @Bean",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "injection",
            "moduleSlug": "beans-and-configuration",
            "title": "Injection: Constructor, Setter, Field — and the Cycle Problem",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "resolving-ambiguity",
            "moduleSlug": "beans-and-configuration",
            "title": "Ambiguity: @Primary, @Qualifier and Injecting Collections",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 7
          },
          {
            "slug": "scopes-and-lifecycle",
            "moduleSlug": "beans-and-configuration",
            "title": "Scopes, Lazy Initialisation and the Bean Lifecycle",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "application-events",
            "moduleSlug": "beans-and-configuration",
            "title": "Application Events: Decoupling Inside One Process",
            "estimatedMinutes": 25,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "configuration-properties",
            "moduleSlug": "beans-and-configuration",
            "title": "Configuration Properties as Beans",
            "estimatedMinutes": 35,
            "status": "available",
            "takeawayCount": 8
          },
          {
            "slug": "conditional-beans",
            "moduleSlug": "beans-and-configuration",
            "title": "Conditional Beans: @Profile and @Conditional",
            "estimatedMinutes": 30,
            "status": "available",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "web-mvc-fundamentals",
        "trackSlug": "spring-boot",
        "title": "Spring MVC: From a Java Method to an HTTP Endpoint",
        "description": "The request lifecycle in full. What DispatcherServlet does between the socket and your method, and every annotation that shapes the mapping in between.",
        "order": 3,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "web-mvc-fundamentals",
            "title": "Spring MVC: From a Java Method to an HTTP Endpoint — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "rest-api-design",
        "trackSlug": "spring-boot",
        "title": "REST API Design: Validation, Errors & Versioning",
        "description": "The difference between an endpoint that works and an API other teams can build on: input you can trust, failures that explain themselves, and change that does not break callers.",
        "order": 4,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "rest-api-design",
            "title": "REST API Design: Validation, Errors & Versioning — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "persistence-jpa",
        "trackSlug": "spring-boot",
        "title": "Persistence with Spring Data JPA",
        "description": "Talking to a relational database without writing the boilerplate, and without the performance traps that ORM abstraction hides until production.",
        "order": 5,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "persistence-jpa",
            "title": "Persistence with Spring Data JPA — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "testing",
        "trackSlug": "spring-boot",
        "title": "Testing Spring Applications",
        "description": "Tests that catch real defects and still run fast, using the slice annotations Spring provides instead of booting the whole application for everything.",
        "order": 6,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "testing",
            "title": "Testing Spring Applications — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "security-authentication",
        "trackSlug": "spring-boot",
        "title": "Spring Security: Authentication & the Filter Chain",
        "description": "Proving who the caller is. The filter chain in detail, because almost every Spring Security problem is really a misunderstanding of what runs in what order.",
        "order": 7,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "security-authentication",
            "title": "Spring Security: Authentication & the Filter Chain — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "security-authorization",
        "trackSlug": "spring-boot",
        "title": "Spring Security: Authorization & Method Security",
        "description": "Deciding what an authenticated caller may do, at the URL and inside the domain, without scattering permission checks through the code.",
        "order": 8,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "security-authorization",
            "title": "Spring Security: Authorization & Method Security — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "security-oauth2-jwt",
        "trackSlug": "spring-boot",
        "title": "Spring Security: JWT, OAuth2 & OIDC",
        "description": "Stateless authentication and delegated identity: the model every distributed system ends up needing, and the parts of it that are genuinely dangerous to get wrong.",
        "order": 9,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "security-oauth2-jwt",
            "title": "Spring Security: JWT, OAuth2 & OIDC — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "http-clients",
        "trackSlug": "spring-boot",
        "title": "Calling Other Services: RestClient & HTTP Interfaces",
        "description": "The outbound half of a service. How a normal-looking Java interface becomes real HTTP calls, and how to keep a slow dependency from taking you down with it.",
        "order": 10,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "http-clients",
            "title": "Calling Other Services: RestClient & HTTP Interfaces — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "graphql",
        "trackSlug": "spring-boot",
        "title": "GraphQL with Spring",
        "description": "A second API style with a different set of trade-offs: the client picks the shape of the response, which solves over-fetching and hands you a new performance problem to manage.",
        "order": 11,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "graphql",
            "title": "GraphQL with Spring — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "websockets",
        "trackSlug": "spring-boot",
        "title": "WebSocket & Real-Time Messaging",
        "description": "Pushing data to clients instead of waiting to be asked. Raw sockets, the STOMP messaging model on top, and the state problem that makes scaling them different.",
        "order": 12,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "websockets",
            "title": "WebSocket & Real-Time Messaging — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "webhooks",
        "trackSlug": "spring-boot",
        "title": "Webhooks: Receiving and Sending",
        "description": "The integration pattern every third-party service uses, and the one most teams implement insecurely — an unauthenticated public endpoint that mutates your data.",
        "order": 13,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "webhooks",
            "title": "Webhooks: Receiving and Sending — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "async-scheduling-messaging",
        "trackSlug": "spring-boot",
        "title": "Async, Scheduling, Events & Messaging",
        "description": "Work that happens off the request thread: background jobs, scheduled tasks, in-process events, and the message brokers that carry work between services.",
        "order": 14,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "async-scheduling-messaging",
            "title": "Async, Scheduling, Events & Messaging — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "spring-ai-fundamentals",
        "trackSlug": "spring-boot",
        "title": "Spring AI: Chat, Prompts & Structured Output",
        "description": "Calling a model as an ordinary dependency. ChatClient, prompt construction, and the step that makes model output usable in real code — getting typed objects instead of prose.",
        "order": 15,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "spring-ai-fundamentals",
            "title": "Spring AI: Chat, Prompts & Structured Output — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "spring-ai-rag-tools",
        "trackSlug": "spring-boot",
        "title": "Spring AI: RAG, Tools & MCP",
        "description": "Giving a model access to your data and your systems: retrieval over your own documents, tool calling that lets it invoke your code, and MCP for exposing capabilities to other clients.",
        "order": 16,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "spring-ai-rag-tools",
            "title": "Spring AI: RAG, Tools & MCP — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "observability",
        "trackSlug": "spring-boot",
        "title": "Observability & Operations",
        "description": "Knowing what your service is doing once it is somewhere you cannot attach a debugger — the work that decides how long an incident lasts.",
        "order": 17,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "observability",
            "title": "Observability & Operations — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      },
      {
        "slug": "production-deployment",
        "trackSlug": "spring-boot",
        "title": "Production: Packaging, Deployment & Performance",
        "description": "Getting it out the door and keeping it healthy. Packaging, containers, native images, and a final capstone that puts every module in the track into one deployable service.",
        "order": 18,
        "status": "coming-soon",
        "lessons": [
          {
            "slug": "coming-soon",
            "moduleSlug": "production-deployment",
            "title": "Production: Packaging, Deployment & Performance — Coming Soon",
            "estimatedMinutes": 0,
            "status": "coming-soon",
            "takeawayCount": 8
          }
        ]
      }
    ]
  }
];
