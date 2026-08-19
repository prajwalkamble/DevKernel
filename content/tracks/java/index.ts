import type { TrackDefinition } from "@/content/types";
import { createComingSoonModule } from "@/content/comingSoon";

/**
 * Java as a revision track: the reader has written Java before and wants the
 * whole language back, quickly. Modules therefore run wide rather than deep,
 * and every topic is scoped to a single 10-15 minute refresher that can be read
 * on its own without the ones before it.
 *
 * Baseline is Java 25, the current LTS, with anything newer flagged as such.
 */
export const javaTrack: TrackDefinition = {
  id: "java",
  slug: "java",
  title: "Java",
  shortTitle: "Java",
  tagline: "The whole language back in your hands, one short topic at a time",
  description:
    "A revision pass over Java that starts at the beginning and does not skip anything, but respects that you have written it before. Each topic is a self-contained 10 to 15 minute refresher — what it is, the part people get wrong, and the interview question attached to it — running from the JVM and objects through generics, collections, streams, the memory model and modern Java up to Java 25.",
  order: 11,
  status: "coming-soon",
  accent: "java",
  mode: "revise",
  lessonMinutes: [10, 15],
  interviewPrep: true,
  runnable: false,
  modules: [
    createComingSoonModule({
      id: "java-jvm",
      slug: "java-and-the-jvm",
      title: "Java & the JVM, Refreshed",
      order: 1,
      description:
        "The execution model underneath everything: what javac produces, what the JVM does with it, and the type distinctions that decide how your data behaves.",
      topics: [
        "JDK, JRE and JVM, and which one you actually installed",
        "Source to bytecode to machine code, and where the JIT fits",
        "The classpath, jars, and how a class is found",
        "Primitives against reference types, and where each one lives",
        "Autoboxing, the Integer cache, and the == trap it creates",
        "var, type inference, and the places it is not allowed",
        "Strings: immutability, the string pool, and StringBuilder",
      ],
    }),
    createComingSoonModule({
      id: "java-objects",
      slug: "objects-classes-encapsulation",
      title: "Objects, Classes & Encapsulation",
      order: 2,
      description:
        "Everything about a single class: construction, state, identity, and the contracts the platform expects you to honour.",
      topics: [
        "Classes, fields, constructors, and initialisation order",
        "static, final, and static initialiser blocks",
        "this, method overloading, and varargs",
        "equals and hashCode, and the contract between them",
        "toString, Comparable, and Cloneable's problems",
        "Records, and what they generate for you",
        "Nested, inner, local and anonymous classes",
      ],
    }),
    createComingSoonModule({
      id: "java-inheritance",
      slug: "inheritance-interfaces-polymorphism",
      title: "Inheritance, Interfaces & Polymorphism",
      order: 3,
      description:
        "Subtyping in Java: what is dispatched dynamically, what is not, and how interfaces changed once they gained default methods.",
      topics: [
        "extends, super, and constructor chaining",
        "Overriding against overloading, and dynamic dispatch",
        "Abstract classes, and when to prefer an interface",
        "Interfaces, default methods, and static methods",
        "Sealed classes and permitted subtypes",
        "Composition over inheritance, with a concrete example",
        "Casting, instanceof, and pattern matching for instanceof",
      ],
    }),
    createComingSoonModule({
      id: "java-generics",
      slug: "generics-type-erasure",
      title: "Generics & Type Erasure",
      order: 4,
      description:
        "Generics as they really work: a compile-time-only feature, with every surprising restriction traceable back to erasure.",
      topics: [
        "Generic classes, methods, and bounded type parameters",
        "Type erasure, and what survives to runtime",
        "Wildcards, and reading ? extends and ? super",
        "PECS: producer extends, consumer super",
        "Arrays against generics, and why they do not mix",
        "Unchecked warnings, raw types, and safe suppression",
      ],
    }),
    createComingSoonModule({
      id: "java-collections",
      slug: "collections-framework",
      title: "The Collections Framework",
      order: 5,
      description:
        "Every collection worth knowing, its complexity, and the one property that should decide which you pick.",
      topics: [
        "The interface hierarchy: Collection, List, Set, Queue and Map",
        "ArrayList against LinkedList, and why the answer is usually ArrayList",
        "HashMap internals: buckets, resizing, and treeification",
        "TreeMap, LinkedHashMap, and ordering guarantees",
        "HashSet, TreeSet, and set operations",
        "Deque, PriorityQueue, and the queue implementations",
        "Comparable and Comparator, and sorting stability",
        "Immutable collections, List.of, and defensive copies",
      ],
    }),
    createComingSoonModule({
      id: "java-streams",
      slug: "streams-lambdas-functional",
      title: "Streams, Lambdas & Functional Java",
      order: 6,
      description:
        "The functional half of modern Java, including the parts of the Stream API that behave differently from how they read.",
      topics: [
        "Lambdas, closures, and effectively final capture",
        "Functional interfaces, and the java.util.function catalogue",
        "Method references, and the four kinds",
        "Stream pipelines: sources, intermediate and terminal operations",
        "Laziness, short-circuiting, and single-use streams",
        "Collectors: toList, groupingBy, joining and teeing",
        "Optional, and using it without reintroducing null checks",
        "Parallel streams, and when they actually help",
      ],
    }),
    createComingSoonModule({
      id: "java-exceptions",
      slug: "exceptions-resources",
      title: "Exceptions & Resource Management",
      order: 7,
      description:
        "Java's error model, the checked exception debate, and the constructs that make cleanup reliable.",
      topics: [
        "Checked against unchecked, and the design argument for each",
        "The exception hierarchy: Throwable, Error and Exception",
        "try, catch, finally, and the return-in-finally trap",
        "try-with-resources, AutoCloseable, and suppressed exceptions",
        "Designing custom exceptions, and preserving the cause",
        "Anti-patterns: swallowing, catching Exception, and logging twice",
      ],
    }),
    createComingSoonModule({
      id: "java-concurrency",
      slug: "concurrency-memory-model",
      title: "Concurrency & the Java Memory Model",
      order: 8,
      description:
        "Threads, the happens-before relationship that makes concurrent code correct, and the high-level tools that mean you rarely write wait and notify.",
      topics: [
        "Threads, Runnable, and thread lifecycle",
        "synchronized, intrinsic locks, and reentrancy",
        "The Java Memory Model, visibility, and happens-before",
        "volatile, and exactly what it does and does not guarantee",
        "Atomic classes and compare-and-swap",
        "ExecutorService, thread pools, and sizing them",
        "CompletableFuture and composing asynchronous work",
        "Concurrent collections, and virtual threads in Java 21",
      ],
    }),
    createComingSoonModule({
      id: "java-memory",
      slug: "memory-gc-performance",
      title: "Memory, GC & Performance",
      order: 9,
      description:
        "Where objects live, how they are collected, and how to find out why something is slow instead of guessing.",
      topics: [
        "Stack, heap, metaspace, and what lives where",
        "Object layout, headers, and the real cost of a small object",
        "Reachability, generational collection, and why it works",
        "The collectors: G1, ZGC and Shenandoah, and choosing one",
        "Memory leaks in a garbage-collected language",
        "Escape analysis, JIT compilation, and warm-up",
        "Benchmarking honestly with JMH",
      ],
    }),
    createComingSoonModule({
      id: "java-modern",
      slug: "modern-java",
      title: "Modern Java, 8 to 25",
      order: 10,
      description:
        "Everything added since the Java you may have learned, so the language in front of you matches the language in your head.",
      topics: [
        "Java 8 in one page: lambdas, streams, Optional and the new date-time API",
        "var, text blocks, and switch expressions",
        "Records, sealed types, and pattern matching for switch",
        "The module system, and why most projects still ignore it",
        "Virtual threads and structured concurrency",
        "Keeping current: release cadence, LTS, and preview features",
      ],
    }),
    createComingSoonModule({
      id: "java-tooling",
      slug: "build-test-tooling",
      title: "Build, Test & Tooling",
      order: 11,
      description:
        "The ecosystem around the code: building, testing, and finding out what a running JVM is doing.",
      topics: [
        "Maven and Gradle, and reading someone else's build file",
        "Dependency resolution, conflicts, and the shaded jar",
        "JUnit 5: lifecycle, assertions, and parameterised tests",
        "Mockito, test doubles, and what not to mock",
        "Packaging: jars, fat jars, and jlink images",
        "Debugging, jcmd, and reading a thread dump",
      ],
    }),
    createComingSoonModule({
      id: "java-mastery",
      slug: "design-interview-mastery",
      title: "Design & Interview Mastery",
      order: 12,
      description:
        "The consolidation pass: the judgement questions an interview is really testing, answered with the whole track behind you.",
      topics: [
        "SOLID, expressed in Java that people actually write",
        "The design patterns that show up in the JDK itself",
        "Immutability, defensive copying, and thread-safe design",
        "The classic interview questions, answered properly",
        "Reading unfamiliar Java and reviewing it well",
        "A system design walkthrough with a Java implementation",
      ],
    }),
  ],
};
