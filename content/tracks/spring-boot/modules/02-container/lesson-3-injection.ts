import type { Lesson } from "@/content/types";

export const injectionLesson: Lesson = {
  id: "spring-injection",
  slug: "injection",
  moduleSlug: "beans-and-configuration",
  title: "Injection: Constructor, Setter, Field — and the Cycle Problem",
  summary:
    "Three ways to receive a dependency, one of which you should use. The argument for constructor injection is usually made on taste; here it is made on behaviour you can observe, including exactly what Spring does with a dependency cycle under each style.",
  estimatedMinutes: 30,
  objectives: [
    "Write constructor, setter and field injection and state the trade-offs",
    "Explain why a single constructor needs no @Autowired",
    "Handle a dependency that may legitimately be absent",
    "Predict what happens to a dependency cycle under each injection style",
    "Recognise when @Lazy is a fix and when it is a deferral",
  ],
  sections: [
    {
      id: "three",
      heading: "The three styles",
      examples: [
        {
          id: "ctor",
          title: "Constructor injection — the one to use",
          lang: "java",
          code: `@Service
public class OrderService {

    private final OrderRepository repository;
    private final EmailSender email;

    // No @Autowired: since Spring 4.3, a single constructor is used implicitly.
    public OrderService(OrderRepository repository, EmailSender email) {
        this.repository = repository;
        this.email = email;
    }
}`,
          explanation:
            "Fields are `final`, so the object is immutable and cannot exist half-built. The dependencies are visible in the signature. And the class is constructible without Spring — a plain unit test writes `new OrderService(repo, email)` with no container at all.",
        },
        {
          id: "setter",
          title: "Setter injection — for genuinely optional dependencies",
          lang: "java",
          code: `@Service
public class ReportService {

    private MetricsRecorder metrics = MetricsRecorder.noop();

    @Autowired(required = false)
    public void setMetrics(MetricsRecorder metrics) {
        this.metrics = metrics;
    }
}`,
          explanation:
            "The field cannot be `final` and the object is mutable after construction. Its one honest use is a dependency that may be absent and has a sensible default — and even then `ObjectProvider` in the constructor usually reads better.",
        },
        {
          id: "field",
          title: "Field injection — what not to do",
          lang: "java",
          code: `@Service
public class OrderService {

    @Autowired
    private OrderRepository repository;      // set by reflection, after construction

    @Autowired
    private EmailSender email;
}`,
          explanation:
            "Shorter, and worse in four measurable ways. The field cannot be `final`. The dependencies are invisible in the type signature, so a class with nine of them looks as light as a class with one. `new OrderService()` produces an object with null fields, so a test must either start a container or use reflection. And there is no compile-time signal at all when you add a tenth.",
        },
      ],
      pitfalls: [
        {
          title: "Constructor injection makes a heavy class look heavy",
          body:
            "This is the underrated benefit. A constructor with eight parameters is uncomfortable to read and uncomfortable to write a test for, and that discomfort is accurate information: the class is doing too much. Field injection removes the signal without removing the problem — you can add a fifteenth `@Autowired` field and nothing anywhere gets harder. Design pressure you can feel is worth keeping.",
        },
      ],
    },
    {
      id: "optional",
      heading: "Dependencies that might not be there",
      body: [
        "Sometimes a bean genuinely may or may not exist — an optional integration, something only present under a profile. Three ways to say so, in ascending order of capability.",
      ],
      examples: [
        {
          id: "optional-ways",
          title: "Expressing 'maybe'",
          lang: "java",
          code: `// 1. Optional<T> -- empty when no such bean exists.
public ReportService(Optional<MetricsRecorder> metrics) {
    this.metrics = metrics.orElseGet(MetricsRecorder::noop);
}

// 2. ObjectProvider<T> -- the fullest API, and the one to prefer.
public ReportService(ObjectProvider<MetricsRecorder> metrics) {
    this.metrics = metrics.getIfAvailable(MetricsRecorder::noop);
}

// 3. @Autowired(required = false) on a setter -- the pre-Java-8 way.`,
          explanation:
            "`ObjectProvider` is worth learning properly: `getIfAvailable()` for optional, `getIfUnique()` for \"only if unambiguous\", `stream()` for all of them, and `getObject()` for a fresh instance each call — which is the standard fix for injecting a prototype into a singleton, covered in lesson 5. All of it stays in the constructor, so the dependency is still declared.",
        },
      ],
    },
    {
      id: "cycles",
      heading: "The cycle problem",
      body: [
        "Two beans that each need the other. The framework's behaviour here is the sharpest practical argument in the whole debate, and it is not what most write-ups claim.",
      ],
      examples: [
        {
          id: "cycle-ctor",
          title: "Constructor injection: impossible, and rejected",
          lang: "java",
          code: `@Component
public class FieldA {
    private final FieldB b;
    public FieldA(FieldB b) { this.b = b; }
}

@Component
public class FieldB {
    private final FieldA a;
    public FieldB(FieldA a) { this.a = a; }
}`,
        },
        {
          id: "cycle-ctor-out",
          title: "What Boot says",
          lang: "bash",
          code: `***************************
APPLICATION FAILED TO START
***************************

Description:

The dependencies of some of the beans in the application context form a cycle:

┌─────┐
|  fieldA defined in URL [.../FieldA.class]
↑     ↓
|  fieldB defined in URL [.../FieldB.class]
└─────┘`,
          explanation:
            "Not a policy decision — a logical one. Neither object can be constructed first, because each constructor requires the other to already exist.",
        },
        {
          id: "cycle-field",
          title: "Field injection: also rejected, but for a different reason",
          lang: "java",
          code: `@Component
public class FieldA {
    @Autowired FieldB b;
    public FieldA() { System.out.println("CYCLE FieldA constructed, b is " + b); }
}

@Component
public class FieldB {
    @Autowired FieldA a;
    public FieldB() { System.out.println("CYCLE FieldB constructed, a is " + a); }
}`,
        },
        {
          id: "cycle-field-out",
          title: "Constructed first, rejected second",
          lang: "bash",
          code: `CYCLE FieldA constructed, b is null
CYCLE FieldB constructed, a is null

***************************
APPLICATION FAILED TO START
***************************

Description:

The dependencies of some of the beans in the application context form a cycle:

┌─────┐
|  fieldA (field com.example.container.probe.FieldB com.example.container.probe.FieldA.b)
↑     ↓
|  fieldB (field com.example.container.probe.FieldA com.example.container.probe.FieldB.a)
└─────┘`,
          explanation:
            "Look at the two lines above the banner. **Both objects were constructed**, each with a null reference to the other, and only then did Spring detect the cycle and refuse. Field injection makes the cycle *technically resolvable* — the fields could be filled in afterwards — and since Boot 2.6 the container rejects it anyway, because a resolvable cycle is still a design problem.",
        },
        {
          id: "cycle-flag",
          title: "What the escape hatch really changes",
          lang: "bash",
          code: `# Field injection + the flag: it starts.
$ java -jar app.jar --spring.main.allow-circular-references=true
CYCLE FieldA constructed, b is null
CYCLE FieldB constructed, a is null
LC 5. context is up and running

# Constructor injection + the same flag: it still fails.
$ java -jar app.jar --spring.main.allow-circular-references=true

***************************
APPLICATION FAILED TO START
***************************
The dependencies of some of the beans in the application context form a cycle: ...`,
          explanation:
            "That is the precise statement, and it is worth carrying: **the flag only rescues non-constructor injection**, because only non-constructor injection can be deferred. Which also means that if a codebase depends on that flag to boot, it is depending on field or setter injection somewhere — the flag is a symptom.",
        },
      ],
      pitfalls: [
        {
          title: "@Lazy breaks a cycle by hiding a proxy in it",
          body:
            "`@Lazy` on one constructor parameter injects a proxy instead of the real bean, deferring the real lookup to the first method call, which breaks the construction-time deadlock. It works, and it is the least bad workaround. But you now have a proxy in your object graph and an initialisation that happens at an unpredictable moment, and the cycle is still there. Treat it as a note to come back to, not a fix.",
        },
        {
          title: "The real fixes",
          body:
            "A cycle almost always means one of two things. Either the two classes are one responsibility that was split in the wrong place — merge them, or extract the shared part into a third bean both depend on. Or the dependency in one direction is really a notification rather than a call, in which case publish an application event (lesson 6) and delete the reference entirely. Both leave the design better than a flag does.",
        },
      ],
    },
    {
      id: "autowired",
      heading: "When you still write @Autowired",
      body: [
        "Rarely. The rules, so you can read older code:",
        "**One constructor:** no annotation needed. Spring has used it implicitly since 4.3. **More than one constructor:** exactly one must carry `@Autowired`, or Spring cannot choose and will use a no-argument one if it exists. **On a setter or field:** the annotation is required, because there is nothing else to signal it. **`@Autowired(required = false)`:** the injection is skipped if no candidate exists, leaving the field at its default.",
        "In new code with a single constructor, `@Autowired` is noise. You will still see it constantly in codebases written before 4.3, and removing it changes nothing.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is constructor injection preferred?",
      answer:
        "Four concrete reasons. The fields can be `final`, so the object is immutable and can never exist partially constructed. The dependencies appear in the type signature, so a class that needs eight things looks like it needs eight things — design pressure you can feel. The class is usable without Spring, so unit tests call the constructor directly instead of starting a container or using reflection. And a missing dependency is a startup failure rather than a null field discovered later. Field injection loses all four for a saving of one line.",
    },
    {
      question: "How does Spring handle a circular dependency?",
      answer:
        "It rejects it by default, since Boot 2.6, whichever injection style is used — the container detects the cycle during creation and fails with a diagram of it. The styles differ in *why*: with constructor injection the cycle is logically unresolvable, since neither object can be built first; with field or setter injection both objects are constructed with null references and could be patched afterwards, so it is a policy refusal rather than an impossibility. `spring.main.allow-circular-references=true` restores the old behaviour, and consequently only helps non-constructor injection — a constructor cycle still fails with the flag set. The correct fix is to remove the cycle: extract the shared responsibility, or replace one direction with an application event.",
    },
    {
      question: "How do you inject a dependency that may not exist?",
      answer:
        "`ObjectProvider<T>` in the constructor is the best option: `getIfAvailable(defaultSupplier)` for optional, `getIfUnique()` when several candidates would be ambiguous, `stream()` for all of them. `Optional<T>` works and reads well for the simple case. `@Autowired(required = false)` on a setter is the older approach and gives up `final`. All three keep the dependency declared rather than hidden behind a context lookup, which is the property that matters.",
    },
    {
      question: "Do you need @Autowired on a constructor?",
      answer:
        "Not when the class has exactly one constructor — Spring has used it implicitly since version 4.3, so the annotation is pure noise in new code. It is required when a class has multiple constructors, to say which one to use, and on fields and setters, where nothing else marks them as injection points. You will still see it on single constructors in older codebases; removing it has no effect.",
    },
  ],
  takeaways: [
    "Use constructor injection: `final` fields, visible dependencies, testable without a container, failures at startup.",
    "A single constructor needs no `@Autowired`.",
    "`ObjectProvider<T>` in the constructor is the right way to express an optional dependency.",
    "Cycles are rejected by default under every injection style, since Boot 2.6.",
    "With field injection both objects are constructed with null references before the cycle is detected; with constructor injection neither can be built at all.",
    "`allow-circular-references=true` only rescues non-constructor injection — so needing it is itself the diagnosis.",
    "Fix a cycle by extracting the shared responsibility or replacing one direction with an event, not with `@Lazy`.",
  ],
  status: "available",
};
