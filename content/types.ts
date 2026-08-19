export type ModuleStatus = "available" | "coming-soon";

/** Every language a lesson can show a code block in. */
export type CodeLanguage =
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "rust"
  | "go"
  | "asm"
  | "cpp"
  | "java"
  /* The DSA track carries every algorithm in both of the languages interviews
     and contests are actually written in. */
  | "python"
  | "bash"
  /* Configuration, schema and wire formats. A Spring lesson is half Java and
     half the files and payloads around it, and a build file shown as plain
     text is a build file nobody reads. */
  | "xml"
  | "yaml"
  | "properties"
  | "sql"
  | "graphql"
  | "json"
  | "http";

export interface CodeExample {
  id: string;
  title?: string;
  /** JavaScript source for this example, if applicable */
  js?: string;
  /** TypeScript source for this example, if applicable */
  ts?: string;
  /**
   * Source in any other language. `js`/`ts` stay separate because the JS/TS
   * track shows them side by side; everything else is a single block.
   */
  code?: string;
  /** Which language `code` is written in. Required whenever `code` is set. */
  lang?: CodeLanguage;
  /** Expected console output, shown as a hint under the example */
  output?: string;
  /** Markdown-lite prose (supports **bold** and `code`) explaining the example */
  explanation?: string;
  /**
   * Names a toolchain this example needs that the local verifier does not
   * provide — a Spring application context, say, which `java Main.java` cannot
   * stand up on its own.
   *
   * Such an example is still verified, just not here: it is run against the
   * real toolchain when the lesson is written, and the output pasted from that
   * run. Marking it lets `verify-lesson-code.mjs` report it as skipped-with-a-
   * reason rather than as a mismatch, which matters because a suite that is
   * permanently eight-red is a suite people stop reading.
   */
  requires?: string;
}

export interface Pitfall {
  title: string;
  body: string;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
}

export interface Section {
  id: string;
  heading: string;
  /** Paragraphs of markdown-lite prose */
  body?: string[];
  examples?: CodeExample[];
  pitfalls?: Pitfall[];
}

export interface Lesson {
  id: string;
  slug: string;
  moduleSlug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  objectives?: string[];
  sections: Section[];
  interviewQuestions?: InterviewQuestion[];
  takeaways?: string[];
  status: ModuleStatus;
}

/**
 * A module as its own file declares it. The owning track stamps `trackSlug` on
 * at registration time, so module files never have to repeat it.
 */
export interface ModuleDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  status: ModuleStatus;
  lessons: Lesson[];
  /**
   * Optional grouping above the module level. A long track is a sequence of
   * stages rather than a flat list of modules, and the stage is the thing a
   * learner navigates by — so tracks that have one declare it here and the
   * curriculum map draws a divider whenever it changes.
   */
  phase?: string;
}

export interface Module extends ModuleDefinition {
  trackSlug: string;
}

/** Selects the colour pair a track is badged with (see globals.css). */
export type TrackAccent =
  | "js"
  | "ts"
  | "cpp"
  | "asm"
  | "rust"
  | "go"
  | "java"
  | "spring"
  | "dsa"
  | "system"
  | "react"
  | "next"
  | "angular";

/**
 * Why you are here. A `learn` track assumes the language is new and takes the
 * time it takes; a `revise` track assumes you have written it before and is cut
 * into short, self-contained refreshers you can finish in a coffee break.
 */
export type TrackMode = "learn" | "revise";

export interface TrackDefinition {
  id: string;
  slug: string;
  /** Full name, e.g. "JavaScript & TypeScript" */
  title: string;
  /** Compact name for badges and breadcrumbs, e.g. "JS/TS" */
  shortTitle: string;
  /** One line, shown under the title on cards */
  tagline: string;
  /** A paragraph, shown on the track's own page */
  description: string;
  order: number;
  status: ModuleStatus;
  accent: TrackAccent;
  mode: TrackMode;
  /** Target length of one lesson, as [min, max] minutes. */
  lessonMinutes: [number, number];
  /**
   * Whether this track carries interview questions. Rust and Assembly are here
   * to build things with, so they trade the interview material for more time on
   * real programs; the tracks people are asked about in interviews keep it.
   */
  interviewPrep: boolean;
  /** True when the playground can run this track's code */
  runnable: boolean;
  modules: ModuleDefinition[];
}

export interface Track extends Omit<TrackDefinition, "modules"> {
  modules: Module[];
}
