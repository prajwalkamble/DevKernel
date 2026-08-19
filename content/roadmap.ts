/**
 * The programme, above the level of a track.
 *
 * A track answers "what is in this subject". This answers the two questions
 * somebody actually arrives with — *where do I start* and *how long until I can
 * do something* — and neither has a good answer on a page that opens with a list
 * of eleven tracks. Keeping it as data rather than as prose in a page component
 * means the module counts below are derived from the real curriculum and cannot
 * drift away from it.
 */

import { getTrackBySlug } from "@/content/tracks";

/**
 * How far along a module is. Deliberately three states rather than two: a
 * syllabus that is settled is a real thing to have published, and calling it
 * "coming soon" hides how much of the decision-making is already done — but
 * calling it "available" would be a lie.
 */
export type RoadmapStatus = "live" | "syllabus" | "planned";

export interface RoadmapModule {
  id: string;
  /** "Module 0", "Electives" — the roadmap's own numbering. */
  label: string;
  title: string;
  /** One line for the card. */
  tagline: string;
  /** A paragraph: what it is for, and who can skip it. */
  summary: string;
  status: RoadmapStatus;
  /** Tracks that carry this module, in reading order. */
  trackSlugs: string[];
  /** Module phases within those tracks, when the module is only part of a track. */
  phases?: string[];
  /** Headline topics, for modules with no track behind them yet. */
  topics?: string[];
  /** Named honestly: what this module does not yet cover. */
  gaps?: string[];
}

export const ROADMAP_MODULES: RoadmapModule[] = [
  {
    id: "module-0",
    label: "Module 0",
    title: "Programming Constructs",
    tagline: "For beginners: build command over the fundamentals first",
    summary:
      "Eleven modules that assume nothing — not a language, not a loop, not an array. This exists because the usual advice to a beginner is to start doing problems, which asks them to learn recursion and their first programming language at the same time; they then conclude they are bad at algorithms when they were only ever bad at for-loops. If you already code, read the eleven titles, confirm there is nothing there you cannot do, and skip the whole module in an afternoon.",
    status: "syllabus",
    trackSlugs: ["dsa"],
    phases: ["Module 0 · Programming Constructs"],
  },
  {
    id: "framework",
    label: "Bridge",
    title: "The Problem-Solving Framework",
    tagline: "The step between knowing the language and solving anything",
    summary:
      "Not on the roadmap, and the reason this curriculum exists. Every course teaches twenty solutions and none teaches how to arrive at one, which is why their graduates still freeze on an unseen problem. The method here is explicit and repeatable — restate, brute force, read the constraints for a target complexity, choose the structure, choose the algorithm, then write — and every module after it uses it. It is the one part of the path that is fully written today.",
    status: "live",
    trackSlugs: ["dsa"],
    phases: ["Bridge · The Problem-Solving Framework"],
  },
  {
    id: "module-1",
    label: "Module 1",
    title: "Problem Solving in DS & Algo",
    tagline: "Linear structures, then non-linear, then the grind",
    summary:
      "The long middle, split the way the roadmap splits it: linear structures and the patterns they enable, then the non-linear ones, then the grind that turns recognition into a reflex. Each module introduces the structures it needs, then the patterns those structures make possible, then points at the problems on the sheet that drill them — because a hash map is a fact and \"turn the inner loop into a lookup\" is a skill, and only one of the two transfers.",
    status: "syllabus",
    trackSlugs: ["dsa"],
    phases: [
      "Module 1 · Linear DSA",
      "Module 1 · Non-linear DSA",
      "Module 1 · The Grind",
    ],
  },
  {
    id: "module-2",
    label: "Module 2",
    title: "System Design — SQL, LLD & HLD",
    tagline: "From a SELECT statement to an architecture you can defend",
    summary:
      "SQL first, because it is the only one of the three you can practise with immediate feedback, and because every later argument about sharding and caching is an argument about queries. Then low-level design, where the vocabulary gets built on one service in real code. Then high-level design, where each component is introduced by the failure that forces it rather than presented as a diagram to memorise.",
    status: "syllabus",
    trackSlugs: ["system-design"],
    phases: [
      "Stage 1 · SQL",
      "Stage 2 · Low-Level Design",
      "Stage 3 · High-Level Design",
    ],
  },
  {
    id: "module-3",
    label: "Module 3",
    title: "Full-Stack Specialisation with Project",
    tagline: "Build something that scales, and apply the design work to it",
    summary:
      "Partly here already: the language and framework tracks below cover the front end, the JVM back end and the frameworks around both. What is not here yet is the spine that joins them into one deployed product — Node, Redux, Git, and the deployment story — so this module is honestly half-covered rather than claimed as finished.",
    status: "planned",
    trackSlugs: ["js-ts", "react", "next", "angular", "java", "spring-boot"],
    gaps: [
      "Node.js and an Express-shaped backend",
      "Redux, and state management at application scale",
      "Git, branching and working on a team",
      "Deployment on AWS, and the security that goes with it",
      "The capstone project that ties LLD and HLD to code you shipped",
    ],
  },
  {
    id: "module-4",
    label: "Module 4",
    title: "GenAI, Agentic AI & FDE Mastery",
    tagline: "LLMs, retrieval, agents — and the engineer who deploys them",
    summary:
      "Not started, with one exception: the DSA track already carries the algorithms underneath these systems, because a vector index is a graph search, tokenisation is a greedy merge over a frequency map, and sampling a token is a heap. That module is the honest part of this one, and it is listed under Module 1 where it belongs.",
    status: "planned",
    trackSlugs: [],
    topics: [
      "LLM mastery: prompt patterns, reasoning techniques, structured outputs, function calling",
      "RAG: embeddings, vector databases, chunking strategy, retrieval pipelines",
      "Agentic AI: frameworks, tool use, memory design, multi-agent orchestration, MCP",
      "Evaluation and AI safety",
      "Forward-deployed engineering: discovery, scoping, integration boundaries, adoption",
    ],
  },
  {
    id: "electives",
    label: "Electives",
    title: "Add-ons, off the critical path",
    tagline: "Needed for contests and senior loops, not for a first offer",
    summary:
      "Deliberately outside the main sequence. Advanced DSA and the design case studies both have published syllabi and sit at the end of their tracks; the systems electives are not started. Nothing here is required to pass a standard interview loop, and treating it as required is a common way to never finish the parts that are.",
    status: "syllabus",
    trackSlugs: ["dsa", "system-design"],
    phases: ["Electives · Advanced DSA", "Electives · Case Studies"],
    gaps: [
      "Mobile development: React Native, Firebase, and an AI chat app",
      "Computer networks: IPs, DNS, and the protocols under every request",
      "Operating systems: processes, memory and scheduling",
    ],
  },
];

/** Modules of a track that belong to one of the given phases. */
export function modulesInPhases(trackSlug: string, phases?: string[]) {
  const track = getTrackBySlug(trackSlug);
  if (!track) return [];
  if (!phases) return track.modules;
  return track.modules.filter((mod) => mod.phase && phases.includes(mod.phase));
}

export interface RoadmapModuleStats {
  modules: number;
  /** Lessons readable today. */
  liveLessons: number;
  /** Lessons planned, counted from published syllabus topics. */
  plannedLessons: number;
}

export function getRoadmapModuleStats(entry: RoadmapModule): RoadmapModuleStats {
  const mods = entry.trackSlugs.flatMap((slug) => modulesInPhases(slug, entry.phases));
  let liveLessons = 0;
  let plannedLessons = 0;

  for (const mod of mods) {
    for (const lesson of mod.lessons) {
      if (lesson.status === "available") liveLessons++;
      else plannedLessons += lesson.takeaways?.length ?? 0;
    }
  }

  return { modules: mods.length, liveLessons, plannedLessons };
}

/**
 * One week of the opening month.
 *
 * The month is real and the claim attached to it is deliberately narrow: it
 * gets you *going* — writing solutions daily, naming patterns, reading a query
 * plan — and it does not get you to mastery, which the page says out loud
 * rather than leaving to be discovered in week five.
 */
export interface RoadmapWeek {
  week: string;
  title: string;
  /** What a beginner does. */
  beginner: string[];
  /** What somebody who already codes does instead. */
  experienced: string[];
  /** The one thing that should be true at the end of the week. */
  outcome: string;
}

export const FIRST_MONTH: RoadmapWeek[] = [
  {
    week: "Week 1",
    title: "Stop fighting the language, then learn the method",
    beginner: [
      "Module 0, in order — through Functions & the Call Stack",
      "Do every pattern-printing exercise; they are the loop drill",
      "Solve two easy problems in the browser console, in Python",
    ],
    experienced: [
      "Skim the eleven Module 0 titles; read only what you cannot already do",
      "Read the Framework module end to end — all eight lessons",
      "Solve five problems on the sheet, applying the method out loud each time",
    ],
    outcome:
      "You can restate a problem, write its brute force without stalling, and read the constraints for a target complexity.",
  },
  {
    week: "Week 2",
    title: "Linear DSA, first half",
    beginner: [
      "Finish Module 0: arrays, strings, number systems, complexity",
      "Arrays & strings, then binary search",
      "Solve ten problems, easy first, one pattern at a time",
    ],
    experienced: [
      "Arrays & strings, binary search, two pointers, sliding windows",
      "Solve twenty problems across those four patterns",
      "Use the Pattern Atlas drills: name the pattern before you are allowed to type",
    ],
    outcome:
      "Given an array problem, you name the pattern before you write anything — and are right most of the time.",
  },
  {
    week: "Week 3",
    title: "Linear DSA, second half — and SQL starts",
    beginner: [
      "Two pointers, sliding windows, hashing",
      "SQL: foundations and joins",
      "Solve fifteen problems; re-solve week 2's from scratch",
    ],
    experienced: [
      "Hashing, sorting, recursion, stacks & queues, linked lists",
      "SQL: foundations, joins, grouping, subqueries and CTEs",
      "Solve twenty-five problems; twenty SQL queries against a real dataset",
    ],
    outcome:
      "You reach for a hash map without being told to, and you can write a grouped, joined query without looking up the syntax.",
  },
  {
    week: "Week 4",
    title: "Non-linear DSA, and the design vocabulary",
    beginner: [
      "Sorting, recursion, stacks & queues",
      "LLD: object-oriented programming, and SOLID",
      "Solve fifteen problems; keep a log of what you got wrong and why",
    ],
    experienced: [
      "Trees and heaps; first pass at greedy and DP foundations",
      "LLD: OOP, SOLID, and schema design",
      "Solve twenty-five problems, mediums only; one machine-coding exercise timed",
    ],
    outcome:
      "You can take an unseen medium apart out loud, and design one service with classes you could actually type.",
  },
];
