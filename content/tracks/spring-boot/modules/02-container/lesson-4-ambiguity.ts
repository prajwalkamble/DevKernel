import type { Lesson } from "@/content/types";

export const ambiguityLesson: Lesson = {
  id: "spring-ambiguity",
  slug: "resolving-ambiguity",
  moduleSlug: "beans-and-configuration",
  title: "Ambiguity: @Primary, @Qualifier and Injecting Collections",
  summary:
    "The moment a second implementation of an interface appears, injection by type stops being enough. Four ways to say which one you meant — and one of them turns the problem into a feature.",
  estimatedMinutes: 25,
  objectives: [
    "Diagnose 'required a single bean, but N were found'",
    "Choose between @Primary and @Qualifier on principle rather than habit",
    "Inject every implementation as a List, ordered deliberately",
    "Inject implementations as a name-keyed Map and know where the keys come from",
    "Design a fan-out where adding a behaviour means adding one class",
  ],
  sections: [
    {
      id: "setup",
      heading: "The situation",
      body: [
        "One interface, three implementations, all beans. Every example in this lesson uses these.",
      ],
      examples: [
        {
          id: "impls",
          title: "Three notifiers",
          lang: "java",
          code: `public interface Notifier {
    String send(String message);
}

@Component @Primary @Order(2)
public class EmailNotifier implements Notifier {
    public String send(String m) { return "email:" + m; }
}

@Component @Order(1)
public class SmsNotifier implements Notifier {
    public String send(String m) { return "sms:" + m; }
}

@Component("pager") @Order(3)
public class PagerNotifier implements Notifier {
    public String send(String m) { return "pager:" + m; }
}`,
          explanation:
            "Bean names, which matter shortly: `emailNotifier`, `smsNotifier`, and `pager` — the last one because `@Component(\"pager\")` overrides the default.",
        },
        {
          id: "failure",
          title: "Without any of the fixes, this is the failure",
          lang: "bash",
          code: `Description:

Parameter 0 of constructor in com.example.container.probe.AlertService required a single
bean, but 2 were found:
	- emailNotifier: defined in URL [.../EmailNotifier.class]
	- smsNotifier: defined in URL [.../SmsNotifier.class]

Action:

Consider marking one of the beans as @Primary, updating the consumer to accept multiple
beans, or using @Qualifier to identify the bean that should be consumed`,
          explanation:
            "The action line lists all three fixes, in the order this lesson takes them.",
        },
      ],
    },
    {
      id: "primary",
      heading: "@Primary: the default answer",
      body: [
        "`@Primary` marks one bean as the one to inject when a by-type request is ambiguous. It is a property **of the bean**, declared once, and every injection point that does not say otherwise gets it.",
      ],
      examples: [
        {
          id: "primary-out",
          title: "By type, with @Primary present",
          lang: "bash",
          code: `AMBIG by type (@Primary wins): email:hi`,
          explanation:
            "Use `@Primary` when there is a genuine default — the implementation that most callers want, with the others as exceptions. If you cannot name a default without hesitating, `@Primary` is the wrong tool and you want `@Qualifier` at each site instead.",
        },
      ],
      pitfalls: [
        {
          title: "Only one @Primary per type",
          body:
            "Two `@Primary` beans of the same type reintroduce the ambiguity they were meant to resolve, and the failure message is the same one as before — which is confusing, because both beans look like they have been handled. Boot 3.4 added `@Fallback` as the inverse: a bean marked `@Fallback` is used only when nothing else matches, which is a cleaner way to express \"the default is whatever the application defines, and this is the backstop\".",
        },
      ],
    },
    {
      id: "qualifier",
      heading: "@Qualifier: this injection point, specifically",
      body: [
        "`@Qualifier` is a property **of the injection point**, not the bean. It names which one this particular constructor wants, overriding `@Primary`.",
      ],
      examples: [
        {
          id: "qualifier-code",
          requires: "a running Spring application context",
          title: "Naming one",
          lang: "java",
          code: `@Service
public class AlertService {

    private final Notifier notifier;

    public AlertService(@Qualifier("smsNotifier") Notifier notifier) {
        this.notifier = notifier;
    }
}`,
          output: `AMBIG @Qualifier(smsNotifier): sms:hi`,
          explanation:
            "The string is the **bean name**, so it is not checked by the compiler and a typo is a startup failure rather than a build error. Getting the name wrong produces a slightly misleading message — *required a bean … that could not be found* with a list of candidates that \"could not be injected\" — which is Boot telling you the type matched but the qualifier did not.",
        },
        {
          id: "custom-qualifier",
          title: "A typed qualifier, for when strings are not enough",
          lang: "java",
          code: `@Qualifier
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.TYPE, ElementType.PARAMETER, ElementType.FIELD, ElementType.METHOD })
public @interface Urgent { }

@Component @Urgent
public class SmsNotifier implements Notifier { ... }

@Service
public class AlertService {
    public AlertService(@Urgent Notifier notifier) { ... }   // checked by the compiler
}`,
          explanation:
            "A custom qualifier annotation is refactor-safe, autocompletes, and says *why* this one was chosen rather than merely which. Worth the six lines anywhere the distinction is meaningful rather than incidental.",
        },
      ],
    },
    {
      id: "collections",
      heading: "Injecting all of them",
      body: [
        "The third option is the one people forget, and it is frequently the best design available: ask for **all** the implementations.",
      ],
      examples: [
        {
          id: "list",
          requires: "a running Spring application context",
          title: "A List, in a deliberate order",
          lang: "java",
          code: `@Component
public class Consumers {

    private final List<Notifier> all;

    public Consumers(List<Notifier> all) {
        this.all = all;
    }

    public void report() {
        System.out.println(all.stream().map(n -> n.send("x")).toList());
    }
}`,
          output: `AMBIG List<Notifier> in @Order order: [sms:x, email:x, pager:x]`,
          explanation:
            "Spring injects every bean of the type. The order is **not** declaration order or class-name order — it comes from `@Order` (or the `Ordered` interface), lowest value first, which is why `sms` (1) precedes `email` (2) precedes `pager` (3). Without `@Order` the order is unspecified, so if the order matters, say so explicitly.",
        },
        {
          id: "map",
          requires: "a running Spring application context",
          title: "A Map, keyed by bean name",
          lang: "java",
          code: `public Consumers(Map<String, Notifier> byName) {
    this.byName = byName;
}`,
          output: `AMBIG Map keys: [emailNotifier, pager, smsNotifier]`,
          explanation:
            "The keys are bean names. This is the clean way to dispatch on a runtime value: a `Map<String, PaymentHandler>` keyed by provider name turns a `switch` over payment types into a lookup, and adding a provider means adding one `@Component` and nothing else.",
        },
        {
          id: "fanout",
          title: "The pattern this enables",
          lang: "java",
          code: `@Service
public class AlertService {

    private final List<Notifier> notifiers;

    public AlertService(List<Notifier> notifiers) {
        this.notifiers = notifiers;
    }

    public void raise(String message) {
        for (Notifier notifier : notifiers) {
            notifier.send(message);
        }
    }
}

// Adding a Slack channel is now exactly this, and nothing else:
@Component @Order(4)
public class SlackNotifier implements Notifier {
    public String send(String m) { return "slack:" + m; }
}`,
          explanation:
            "No registration list, no factory, no `switch`, no edit to `AlertService` — which is the open/closed principle arriving as a practical consequence of how the container resolves collections. This is the shape to reach for whenever \"and also do X\" is a recurring request.",
        },
      ],
      pitfalls: [
        {
          title: "An empty collection is a startup failure by default",
          body:
            "`List<Notifier>` with no `Notifier` beans anywhere does not inject an empty list — it fails, because the injection point is a required dependency and nothing satisfies it. Use `ObjectProvider<Notifier>` and `stream().toList()` when genuinely zero is acceptable, or annotate the parameter `@Autowired(required = false)`.",
        },
        {
          title: "Order matters more than people expect",
          body:
            "A fan-out where one participant must run first — an audit log, a validation step — and where the order comes from whatever the classpath scan happened to produce is a bug waiting for a rename. Put `@Order` on every implementation as soon as order is meaningful, and leave a comment saying why the numbers are what they are.",
        },
      ],
    },
    {
      id: "byname",
      heading: "The fourth way: by name",
      body: [
        "Spring falls back to matching the **parameter name** against bean names when the type is ambiguous. It works, and it is the one to be wary of.",
      ],
      examples: [
        {
          id: "byname-code",
          title: "Resolution by parameter name",
          lang: "java",
          code: `// Resolves to the bean named "smsNotifier", with no annotation at all.
public AlertService(Notifier smsNotifier) { ... }

// Explicit, and immune to a rename or a build without -parameters:
public AlertService(@Qualifier("smsNotifier") Notifier notifier) { ... }`,
          explanation:
            "This depends on parameter names surviving compilation — Boot's parent POM passes `-parameters` to javac, so they do. It makes a **rename of a parameter** a behaviour change, which is the sort of thing no reviewer catches. Prefer the explicit qualifier.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "@Primary or @Qualifier — how do you choose?",
      answer:
        "`@Primary` is a property of the bean and applies everywhere: use it when there is a genuine default that most injection points want. `@Qualifier` is a property of the injection point and overrides `@Primary`: use it when a particular consumer needs a specific implementation. If you cannot name a default without hesitating, that is the signal there isn't one, and qualifying at each site is the honest answer. `@Qualifier` takes a bean name as a string, so a custom qualifier annotation is worth defining wherever the distinction is meaningful — it is compiler-checked and states the reason rather than the name.",
    },
    {
      question: "What happens when you inject List<T> or Map<String, T>?",
      answer:
        "Spring injects every bean of type `T`. For a `List`, the order comes from `@Order` or the `Ordered` interface, lowest first, and is otherwise unspecified — so if order matters it must be declared. For a `Map`, the keys are the bean names. This turns ambiguity into a design: a fan-out over every implementation, or a dispatch table keyed by name, where adding a behaviour means adding one annotated class and touching nothing else. Note that an empty result is a failure by default, not an empty collection; use `ObjectProvider` if zero is valid.",
    },
    {
      question: "You need to pick an implementation based on a value known only at runtime. How?",
      answer:
        "Inject `Map<String, Handler>` and look up by the runtime key — the map is keyed by bean name, so naming each `@Component(\"card\")`, `@Component(\"paypal\")` and so on gives you a dispatch table for free. It replaces a `switch` that has to be edited for every new case with a lookup that never changes, and a missing key becomes a clear runtime error you can handle. If construction of the handler needs to be deferred or repeated, inject `ObjectProvider` instead and resolve per call.",
    },
    {
      question: "Spring resolves an ambiguous injection by parameter name. Should you rely on it?",
      answer:
        "No. When several beans match by type, Spring falls back to matching the injection point's name against bean names, so a parameter called `smsNotifier` silently selects the bean of that name. It works only because the build passes `-parameters` to javac, and it turns renaming a parameter — an operation every developer considers safe — into a behaviour change that no review will catch. Write `@Qualifier` explicitly and the same intent is stated where a reader can see it.",
    },
  ],
  takeaways: [
    "`@Primary` is on the bean and applies everywhere; `@Qualifier` is on the injection point and wins over it.",
    "`@Qualifier` takes a bean name string — a custom qualifier annotation is compiler-checked and says why.",
    "`List<T>` injects every implementation, ordered by `@Order` (lowest first) and otherwise unspecified.",
    "`Map<String, T>` injects them keyed by bean name — a dispatch table with no `switch`.",
    "The fan-out pattern makes \"add another behaviour\" a one-class change.",
    "An empty collection is a startup failure, not an empty list — use `ObjectProvider` when zero is valid.",
    "Resolution by parameter name works and is fragile; qualify explicitly instead.",
  ],
  status: "available",
};
