import type { Lesson } from "@/content/types";

export const scopesLifecycleLesson: Lesson = {
  id: "spring-scopes-lifecycle",
  slug: "scopes-and-lifecycle",
  moduleSlug: "beans-and-configuration",
  title: "Scopes, Lazy Initialisation and the Bean Lifecycle",
  summary:
    "How many instances exist, when they are built, and what runs around construction and shutdown — with the full callback order printed from a real application, and the prototype-in-a-singleton trap demonstrated rather than described.",
  estimatedMinutes: 30,
  objectives: [
    "State what singleton scope does and does not guarantee",
    "Use prototype scope, and avoid the trap that makes it useless",
    "Decide when lazy initialisation helps and what it costs",
    "Recite the lifecycle callback order and know which to use",
    "Choose between @PostConstruct, InitializingBean and initMethod",
  ],
  sections: [
    {
      id: "singleton",
      heading: "Singleton: the default, and what it means",
      body: [
        "Every bean is a singleton unless you say otherwise. Two things follow, and the second is the one that causes bugs.",
        "**One instance per container**, created eagerly at startup. Not one per JVM — the Java singleton pattern is a different thing, and a test that builds two contexts has two instances.",
        "**Shared across every thread.** In a web application, one controller and one service instance serve every concurrent request. Any mutable field on a bean is shared state without synchronisation.",
      ],
      examples: [
        {
          id: "singleton-proof",
          title: "Asked for twice",
          lang: "bash",
          code: `SCOPE singleton constructed: 2bfeb1ef        <- once, during startup
SCOPE singleton twice: 2bfeb1ef 2bfeb1ef same=true`,
          explanation:
            "Constructed once at startup and handed out by reference thereafter. Eager creation is deliberate: a bean that cannot be built fails the deployment rather than the first request that needs it.",
        },
        {
          id: "stateless",
          title: "The rule that follows",
          lang: "java",
          code: `@Service
public class BadCounter {
    private int count;                        // shared by every thread. A data race.
    public int next() { return ++count; }
}

@Service
public class GoodCounter {
    private final AtomicInteger count = new AtomicInteger();   // safe by construction
    public int next() { return count.incrementAndGet(); }
}

@Service
public class BestCounter {
    private final CounterRepository repository;                // dependency, not state
    public BestCounter(CounterRepository repository) { this.repository = repository; }
}`,
          explanation:
            "Bean fields are for **dependencies**, injected once through the constructor and never reassigned. Anything per-request belongs in a method parameter or a local variable, which live on the calling thread's stack. When shared mutable state is genuinely required, make it explicitly thread-safe.",
        },
      ],
    },
    {
      id: "prototype",
      heading: "Prototype, and the trap",
      body: [
        "A prototype bean is created fresh on every request for it. Spring builds it, injects it, runs its initialisation callbacks — and then forgets about it. **Destruction callbacks never run for a prototype**; the container is not tracking it, so cleanup is the caller's problem.",
      ],
      examples: [
        {
          id: "prototype-proof",
          requires: "a running Spring application context",
          title: "Two calls to getBean",
          lang: "java",
          code: `@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class PrototypeThing {
    public PrototypeThing() {
        System.out.println("SCOPE prototype constructed: " + id());
    }
    public String id() { return Integer.toHexString(System.identityHashCode(this)); }
}`,
          output: `SCOPE prototype constructed: 7c2327fa
SCOPE prototype constructed: 3d7fa3ae
SCOPE prototype twice: 7c2327fa 3d7fa3ae same=false`,
        },
        {
          id: "trap",
          requires: "a running Spring application context",
          title: "The trap: a prototype injected into a singleton",
          lang: "java",
          code: `@Component
public class InjectedDirectly {
    private final PrototypeThing thing;

    public InjectedDirectly(PrototypeThing thing) {   // resolved ONCE, at construction
        this.thing = thing;
    }

    public String get() { return thing.id(); }
}

@Component
public class ViaProvider {
    private final ObjectProvider<PrototypeThing> provider;

    public ViaProvider(ObjectProvider<PrototypeThing> provider) {
        this.provider = provider;
    }

    public String get() { return provider.getObject().id(); }   // resolved per call
}`,
          output: `TRAP injected directly:  1532c619 then 1532c619
SCOPE prototype constructed: 58065f0c
SCOPE prototype constructed: 3605c4d3
TRAP via ObjectProvider: 58065f0c then 3605c4d3`,
          explanation:
            "`InjectedDirectly` returns **the same object both times**, and it is neither of the two just constructed — it is the one created during startup, when the singleton's constructor ran. The prototype scope did nothing. This is not a bug in Spring: the injection point was resolved once, because the singleton holding it is only constructed once. `ObjectProvider.getObject()` asks the container each time, which is what prototype scope was for.",
        },
      ],
      pitfalls: [
        {
          title: "Prototype scope is rarely the answer",
          body:
            "Before reaching for it, ask what is wrong with `new`. If an object holds per-operation state and needs no injected dependencies, a local `new` is simpler, faster, and has no lifecycle questions. Prototype scope earns its place only when the fresh object genuinely needs the container — because it has dependencies of its own to inject. Note too that the destroy callbacks never fire, so a prototype holding a resource is a leak unless the caller closes it.",
        },
      ],
    },
    {
      id: "other-scopes",
      heading: "The other scopes",
      examples: [
        {
          id: "scope-list",
          title: "What exists",
          lang: "java",
          code: `@Scope("singleton")   // default: one per container
@Scope("prototype")   // a new one on every injection or getBean

// Web scopes -- only in a web application:
@Scope("request")     // one per HTTP request
@Scope("session")     // one per HTTP session
@Scope("application") // one per ServletContext

// Injecting a shorter-lived scope into a singleton needs a proxy:
@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestContext { ... }`,
          explanation:
            "The `proxyMode` is the same trap in different clothing. A singleton constructed at startup cannot hold a request-scoped object — there is no request yet. The scoped proxy injects a stand-in that, on every method call, looks up the instance belonging to the *current* request. Convenient, and worth knowing it is happening: that field is not the object it appears to be.",
        },
      ],
      pitfalls: [
        {
          title: "Session scope does not survive a restart or a second instance",
          body:
            "Session-scoped beans live in the servlet session, which by default is in the heap of one process. Deploy two instances behind a load balancer without sticky sessions or a shared session store and half the requests see an empty session. Treat session-scoped state as a cache of something you can rebuild, not as a place to keep anything you would mind losing.",
        },
      ],
    },
    {
      id: "lazy",
      heading: "Lazy initialisation",
      body: [
        "`@Lazy` defers a singleton's construction until something first asks for it.",
      ],
      examples: [
        {
          id: "lazy-proof",
          title: "Nothing until asked",
          lang: "bash",
          code: `# ... the entire startup completes, and then:

SCOPE asking for the lazy bean now...
SCOPE lazy constructed (only now)`,
          explanation:
            "Useful for a genuinely expensive bean that most runs never touch. `spring.main.lazy-initialization=true` applies it to the whole application, which cuts startup time noticeably.",
        },
      ],
      pitfalls: [
        {
          title: "Blanket lazy initialisation trades a good failure for a bad one",
          body:
            "Eager creation means a bean that cannot be built — a bad connection string, a missing dependency — fails the deployment, before any traffic arrives. Make everything lazy and that failure moves to the first request that happens to need the bean, which may be minutes later, in production, on one endpoint. It is a reasonable setting for local development where startup time is felt constantly; it is a poor default for a deployed service.",
        },
      ],
    },
    {
      id: "lifecycle",
      heading: "The lifecycle, in order",
      body: [
        "Spring offers three ways to hook initialisation and three to hook destruction. They all run, in a fixed order. Printed from a real application:",
      ],
      examples: [
        {
          id: "lifecycle-code",
          title: "A bean using all six",
          lang: "java",
          code: `public class Lifecycle implements InitializingBean, DisposableBean {

    public Lifecycle()                       { System.out.println("LC 1. constructor"); }

    @PostConstruct
    void postConstruct()                     { System.out.println("LC 2. @PostConstruct"); }

    @Override
    public void afterPropertiesSet()         { System.out.println("LC 3. InitializingBean"); }

    public void customInit()                 { System.out.println("LC 4. @Bean(initMethod)"); }

    @PreDestroy
    void preDestroy()                        { System.out.println("LC 6. @PreDestroy"); }

    @Override
    public void destroy()                    { System.out.println("LC 7. DisposableBean"); }

    public void customDestroy()              { System.out.println("LC 8. @Bean(destroyMethod)"); }
}

// Registered with both external callbacks:
@Bean(initMethod = "customInit", destroyMethod = "customDestroy")
public Lifecycle lifecycle() { return new Lifecycle(); }`,
        },
        {
          id: "lifecycle-out",
          title: "The order, verbatim",
          lang: "bash",
          code: `LC 1. constructor
LC 2. @PostConstruct
LC 3. InitializingBean.afterPropertiesSet
LC 4. @Bean(initMethod)
LC 5. context is up and running

  ... the application runs ...

LC 6. @PreDestroy
LC 7. DisposableBean.destroy
LC 8. @Bean(destroyMethod)`,
          explanation:
            "Annotation first, then the interface, then the externally configured method — on both sides, symmetrically. Dependencies are injected between step 1 and step 2, which is the point of having step 2 at all: in the constructor the injected fields are set, but any bean *that* depends on may not be fully initialised yet, and `@PostConstruct` is the first moment the object is guaranteed complete.",
        },
        {
          id: "which",
          title: "Which one to use",
          lang: "java",
          code: `// Your class, ordinary case                -> @PostConstruct / @PreDestroy
@PostConstruct
void warmCache() { ... }

// A class you cannot annotate               -> @Bean(initMethod=, destroyMethod=)
@Bean(initMethod = "start", destroyMethod = "stop")
public MetricsReporter reporter() { ... }

// InitializingBean / DisposableBean         -> avoid: couples your class to Spring
//   for no benefit over the annotation.

// Work that needs the whole context ready   -> ApplicationRunner / CommandLineRunner,
//   or an @EventListener on ApplicationReadyEvent`,
          explanation:
            "The distinction in the last line matters. `@PostConstruct` runs while the context is still being built, so other beans may not exist yet and the web server is not listening. If your startup work needs a *complete* application — warming a cache by calling your own endpoint, registering with service discovery — hook `ApplicationReadyEvent` instead.",
        },
      ],
      pitfalls: [
        {
          title: "Destroy callbacks only run on an orderly shutdown",
          body:
            "They run when the context closes: a `SIGTERM` that the JVM turns into a shutdown hook, or an explicit `close()`. They do **not** run on `SIGKILL`, on a container that exceeded its stop timeout, or on a hard crash. So a destroy callback is the right place to flush a buffer or deregister from a load balancer, and the wrong place to be the only thing preventing data loss. Module 17 covers graceful shutdown and the timeouts that decide whether these ever run.",
        },
        {
          title: "`@PostConstruct` needs the annotation on the classpath",
          body:
            "`@PostConstruct` and `@PreDestroy` live in `jakarta.annotation`, which arrives with the Boot starters. On a stripped-down classpath they are silently absent rather than a compile error, and the callback simply never runs — a failure mode worth recognising because nothing reports it.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the default bean scope, and what does it imply for your code?",
      answer:
        "Singleton: one instance per application context, created eagerly at startup. It is per container, not per JVM. The practical implication is thread safety — that one instance serves every concurrent request, so any mutable field on a bean is shared state without synchronisation. Bean fields should be dependencies, `final` and injected through the constructor; per-request state belongs in method parameters and local variables. Eager creation is also a feature: a bean that cannot be built fails the deployment rather than the first request that needs it.",
    },
    {
      question: "What goes wrong when you inject a prototype bean into a singleton?",
      answer:
        "Nothing, and that is the problem — you get one instance, forever. The injection point is resolved when the *singleton* is constructed, which happens once, so the prototype is created once and the scope has no effect. Confirming this in a running application shows the same identity hash on every call. The fix is to resolve per use rather than per construction: inject `ObjectProvider<T>` and call `getObject()`, use a scoped proxy, or use method injection with `@Lookup`. Worth adding that prototype destruction callbacks never run at all — the container does not track the instances it hands out.",
    },
    {
      question: "What is the full bean lifecycle callback order?",
      answer:
        "Constructor, then dependency injection, then `@PostConstruct`, then `InitializingBean.afterPropertiesSet()`, then the `@Bean(initMethod)` method — and symmetrically on shutdown: `@PreDestroy`, `DisposableBean.destroy()`, then `@Bean(destroyMethod)`. Annotation, interface, external configuration, in that order on both sides. Prefer the annotations in your own code, and the `@Bean` attributes for classes you cannot modify; the interfaces couple your class to Spring for no benefit. Destroy callbacks only run on an orderly context close, so they are not a guarantee against a hard kill.",
    },
    {
      question: "When would you enable lazy initialisation, and what is the risk?",
      answer:
        "`@Lazy` on a specific bean is right for something genuinely expensive that most runs never touch. Application-wide `spring.main.lazy-initialization=true` meaningfully cuts startup time and is reasonable for local development. The risk is that it converts the framework's best property — failing at startup — into failing on the first request that needs the bean, which in production means an error on one endpoint minutes after a deploy that looked successful. That trade is usually wrong for a deployed service and usually fine on a laptop.",
    },
  ],
  takeaways: [
    "Singleton means one per container, created eagerly, shared across all threads — so bean fields hold dependencies, not state.",
    "Prototype means a new instance per request for it, with no destruction callbacks ever.",
    "A prototype injected directly into a singleton is created once — use `ObjectProvider.getObject()` per call.",
    "Request and session scopes need a scoped proxy to be usable from a singleton.",
    "`@Lazy` defers construction; applied globally it trades startup failures for first-request failures.",
    "Init order: constructor → injection → `@PostConstruct` → `InitializingBean` → `initMethod`. Destroy mirrors it.",
    "Use `ApplicationReadyEvent`, not `@PostConstruct`, for work that needs the whole application up.",
    "Destroy callbacks run only on an orderly shutdown — never on `SIGKILL`.",
  ],
  status: "available",
};
