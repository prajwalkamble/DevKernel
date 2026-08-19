import type { Lesson } from "@/content/types";

export const failedStartupLesson: Lesson = {
  id: "spring-failed-startup",
  slug: "reading-a-failed-startup",
  moduleSlug: "foundations",
  title: "Reading a Failed Startup",
  summary:
    "Six real failures, with the exact text Boot prints for each and the fix it is pointing at. Learning to read these is the difference between a two-minute fix and an afternoon of guessing — and a failure at startup is the best kind of failure you can get.",
  estimatedMinutes: 30,
  objectives: [
    "Recognise the failure-analyzer banner and read it in the right order",
    "Diagnose the five startup failures you will actually hit",
    "Read a stack trace that has no analyzer, bottom-up",
    "Use the conditions report and actuator endpoints to investigate",
    "Explain why failing at startup is a design goal rather than an inconvenience",
  ],
  sections: [
    {
      id: "banner",
      heading: "The banner, and how to read it",
      body: [
        "Boot ships **failure analyzers**: classes that catch known startup exceptions and rewrite them as a plain description and a suggested action. When you see this shape, the framework already knows what went wrong.",
      ],
      examples: [
        {
          id: "shape",
          title: "The shape",
          lang: "bash",
          code: `***************************
APPLICATION FAILED TO START
***************************

Description:

<what went wrong, in a sentence>

Action:

<what to do about it>`,
          explanation:
            "**Read the Action line first.** It is written by whoever knows this failure best, and for most of these it is the entire fix. Then read the Description for the specifics — which bean, which port, which property. The stack trace above the banner is usually irrelevant when the banner is present.",
        },
      ],
      pitfalls: [
        {
          title: "A startup failure is good news",
          body:
            "Every failure in this lesson happens before the port opens and before a single request is served. Compare that with the alternative: a missing dependency discovered as a `NullPointerException` at 3am under load, in one code path nobody exercised. Constructor injection, typed configuration properties and eager singleton creation all exist to move failures to startup — this is the framework's design working, not fighting you.",
        },
      ],
    },
    {
      id: "port",
      heading: "1. Port already in use",
      examples: [
        {
          id: "port",
          title: "The one everybody hits first",
          lang: "bash",
          code: `Description:

Web server failed to start. Port 8080 was already in use.

Action:

Identify and stop the process that's listening on port 8080 or configure this
application to listen on another port.`,
          explanation:
            "Almost always your own application, still running in a terminal tab you forgot about — often left behind by an IDE run that did not shut down cleanly.",
        },
        {
          id: "port-fix",
          title: "Finding the culprit",
          lang: "bash",
          code: `# Linux
$ ss -lptn 'sport = :8080'
$ kill <pid>

# macOS
$ lsof -i :8080
$ kill <pid>

# Or sidestep it
$ java -jar app.jar --server.port=8081
$ java -jar app.jar --server.port=0        # any free port; the log tells you which`,
        },
      ],
    },
    {
      id: "missing-bean",
      heading: "2. A dependency with no bean to satisfy it",
      body: [
        "A class asks for something the container does not have. This is the most common failure after the first week, and its cause is nearly always mundane.",
      ],
      examples: [
        {
          id: "missing-code",
          title: "The setup",
          lang: "java",
          code: `public interface PaymentGateway {
    void charge(long pence);
}

@Service
public class OrderService {

    private final PaymentGateway gateway;

    public OrderService(PaymentGateway gateway) {   // nothing implements this
        this.gateway = gateway;
    }
}`,
        },
        {
          id: "missing-out",
          title: "What Boot says",
          lang: "bash",
          code: `Description:

Parameter 0 of constructor in com.example.catalog.fail.OrderService required a bean of
type 'com.example.catalog.fail.PaymentGateway' that could not be found.

Action:

Consider defining a bean of type 'com.example.catalog.fail.PaymentGateway' in your
configuration.`,
          explanation:
            "It names the class, the constructor and the parameter index. There are four realistic causes, in rough order of likelihood: **(a)** the implementation exists but has no `@Component`/`@Service` on it; **(b)** it has the annotation but sits outside the component-scan boundary (lesson 3); **(c)** it comes from an auto-configuration whose condition did not pass — check the conditions report's negative matches; **(d)** you genuinely have not written it yet.",
        },
      ],
      pitfalls: [
        {
          title: "\"But I have @Autowired on the field!\"",
          body:
            "Field injection turns this startup failure into a `NullPointerException` at first use in some configurations, and into the same failure in others — which is worse, because the behaviour is not predictable from reading the class. Constructor injection makes the missing dependency impossible to ignore: the object cannot be constructed at all, so the application refuses to start. That is the entire argument.",
        },
      ],
    },
    {
      id: "ambiguity",
      heading: "3. Two beans where one was expected",
      body: [
        "The opposite problem, and just as common once a codebase grows a second implementation of an interface.",
      ],
      examples: [
        {
          id: "ambig-code",
          title: "Two implementations, one injection point",
          lang: "java",
          code: `public interface Notifier { void notifyUser(String message); }

@Component public class EmailNotifier implements Notifier { ... }
@Component public class SmsNotifier   implements Notifier { ... }

@Service
public class AlertService {
    public AlertService(Notifier notifier) { ... }     // which one?
}`,
        },
        {
          id: "ambig-out",
          title: "What Boot says",
          lang: "bash",
          code: `Description:

Parameter 0 of constructor in com.example.catalog.fail.AlertService required a single bean,
but 2 were found:
	- emailNotifier: defined in URL [.../EmailNotifier.class]
	- smsNotifier: defined in URL [.../SmsNotifier.class]

Action:

Consider marking one of the beans as @Primary, updating the consumer to accept multiple
beans, or using @Qualifier to identify the bean that should be consumed`,
          explanation:
            "Note that the bean names are the class names with a lowercased first letter — that default naming is what `@Qualifier` refers to.",
        },
        {
          id: "ambig-fix",
          title: "The three fixes, and when each is right",
          lang: "java",
          code: `// (a) One is the normal answer, the other is a special case.
@Component @Primary
public class EmailNotifier implements Notifier { ... }

// (b) This particular injection point wants a specific one.
public AlertService(@Qualifier("smsNotifier") Notifier notifier) { ... }

// (c) You actually want all of them -- Spring injects the whole collection.
public AlertService(List<Notifier> notifiers) { ... }
//     ...or as a Map, keyed by bean name:
public AlertService(Map<String, Notifier> notifiersByName) { ... }`,
          explanation:
            "Option (c) is underused and often the best design: a fan-out where every registered implementation is invoked, and adding a new one means adding a class and nothing else. Module 2 goes into `@Primary` and `@Qualifier` in depth.",
        },
      ],
    },
    {
      id: "cycle",
      heading: "4. A dependency cycle",
      body: [
        "Two beans that each need the other. Boot draws you a picture.",
      ],
      examples: [
        {
          id: "cycle-out",
          title: "What Boot says",
          lang: "bash",
          code: `Description:

The dependencies of some of the beans in the application context form a cycle:

┌─────┐
|  invoiceService defined in URL [.../InvoiceService.class]
↑     ↓
|  reminderService defined in URL [.../ReminderService.class]
└─────┘

Action:

Relying upon circular references is discouraged and they are prohibited by default.
Update your application to remove the dependency cycle between beans. As a last resort,
it may be possible to break the cycle automatically by setting
spring.main.allow-circular-references to true.`,
          explanation:
            "With constructor injection a cycle is not merely discouraged, it is **logically impossible** — neither object can be built first. Since Boot 2.6 it fails by default rather than papering over it.",
        },
      ],
      pitfalls: [
        {
          title: "allow-circular-references is not the fix",
          body:
            "Setting it to `true` makes Spring inject a proxy and defer the wiring, which turns a startup failure into subtle ordering bugs and a half-initialised object visible during construction. A cycle is a design signal: the two classes are really one responsibility that was split in the wrong place, or there is a third thing both depend on. Extract the shared piece, or invert the direction with an application event so one side stops needing a reference to the other. `@Lazy` on one side works and is the least bad workaround, but treat it as a note to come back.",
        },
      ],
    },
    {
      id: "datasource",
      heading: "5. A starter with nothing configured",
      body: [
        "Add `spring-boot-starter-data-jpa` and run it before you have set up a database:",
      ],
      examples: [
        {
          id: "ds-out",
          title: "What Boot says",
          lang: "bash",
          code: `Description:

Failed to configure a DataSource: 'url' attribute is not specified and no embedded
datasource could be configured.

Reason: Failed to determine a suitable driver class

Action:

Consider the following:
	If you want an embedded database (H2, HSQL or Derby), please put it on the classpath.
	If you have database settings to be loaded from a particular profile you may need to
	activate it (no profiles are currently active).`,
          explanation:
            "This is auto-configuration reporting that it has been asked to do something impossible. A JPA starter on the classpath means Boot will build a `DataSource`; it needs either a URL or an embedded database to point at. The last line of the action is a genuinely useful hint — the settings often *do* exist, in a profile nobody activated.",
        },
        {
          id: "ds-fix",
          title: "The fixes",
          lang: "yaml",
          code: `# Real database:
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/catalog
    username: catalog
    password: \${DB_PASSWORD}          # from the environment, never in the file

# Or an in-memory one for local work -- add com.h2database:h2 and this is enough:
#   (no configuration at all; Boot detects H2 and configures it)

# Or, only if you truly are not using persistence yet:
#   spring.autoconfigure.exclude: >
#     org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration`,
        },
      ],
    },
    {
      id: "no-analyzer",
      heading: "6. When there is no analyzer",
      body: [
        "Not every failure has one. An exception thrown from your own initialisation code produces an ordinary stack trace, and reading it is a skill worth ten minutes.",
      ],
      examples: [
        {
          id: "raw-code",
          title: "A bean that refuses to initialise",
          lang: "java",
          code: `@Component
public class LicenceChecker {

    @PostConstruct
    void verify() {
        throw new IllegalStateException("licence key missing: set CATALOG_LICENCE");
    }
}`,
        },
        {
          id: "raw-out",
          title: "32 lines of stack trace, and the two that matter",
          lang: "bash",
          code: `ERROR 21715 --- [catalog] [main] o.s.boot.SpringApplication : Application run failed

org.springframework.beans.factory.BeanCreationException: Error creating bean with name
'licenceChecker': Invocation of init method failed
	at ...InitDestroyAnnotationBeanPostProcessor.postProcessBeforeInitialization(...)
	at ...  (28 more frames of Spring internals)
	at org.springframework.boot.loader.launch.JarLauncher.main(JarLauncher.java:40)

Caused by: java.lang.IllegalStateException: licence key missing: set CATALOG_LICENCE
	at com.example.catalog.fail.LicenceChecker.verify(LicenceChecker.java:11)
	at java.base/java.lang.reflect.Method.invoke(Method.java:565)
	...`,
          explanation:
            "**Read a Java stack trace bottom-up.** The last `Caused by:` is the original failure; everything above it is the chain of wrappers. Then scan its frames for the first line mentioning **your own package** — here `LicenceChecker.verify(LicenceChecker.java:11)`. Those two pieces of information, the root message and your own topmost frame, resolve the great majority of traces. The 28 frames of Spring internals between them are the call path, and you rarely need it.",
        },
      ],
      pitfalls: [
        {
          title: "Write the exception message you would want to receive",
          body:
            "`licence key missing: set CATALOG_LICENCE` names the problem and the fix. `IllegalStateException: invalid config` names neither, and the person reading it at 3am may be you. When you throw during initialisation, include what was expected, what was found, and what to do — you are writing your own failure analyzer.",
        },
      ],
    },
    {
      id: "toolkit",
      heading: "The investigation toolkit",
      body: [
        "When the banner does not settle it, these four are the order to reach for things.",
      ],
      examples: [
        {
          id: "toolkit",
          title: "In order of effort",
          lang: "bash",
          code: `# 1. Why did (or didn't) an auto-configuration apply?
$ java -jar app.jar --debug            # conditions evaluation report; read Negative matches

# 2. Where did this property value come from?
$ curl -s localhost:8080/actuator/env/catalog.page-size
$ curl -s localhost:8080/actuator/configprops

# 3. What beans actually exist?
$ curl -s localhost:8080/actuator/beans | jq '.contexts[].beans | keys'

# 4. Which URLs are mapped, and to what?
$ curl -s localhost:8080/actuator/mappings | jq '..|.predicate?|select(.)'

# (2-4 need exposing first, in application.yml:)
#   management.endpoints.web.exposure.include: env,configprops,beans,mappings,conditions`,
          explanation:
            "Endpoints 2–4 need a *running* application, so they are for \"it started but behaves wrongly\". For \"it will not start\", `--debug` and the banner are the tools. Never expose these endpoints publicly in production — they reveal your entire configuration and bean graph.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a failure analyzer in Spring Boot?",
      answer:
        "A `FailureAnalyzer` implementation that inspects a startup exception and returns a `FailureAnalysis` — a human-readable description and a suggested action — which Boot prints in the `APPLICATION FAILED TO START` banner instead of the raw stack trace. Boot ships analyzers for the common cases: port conflicts, unsatisfied and ambiguous dependencies, bean cycles, unconfigured data sources, and configuration binding errors. You can register your own for a library by implementing the interface and listing it in `META-INF/spring.factories`, which is worth doing for any exception your users will hit repeatedly.",
    },
    {
      question: "You get 'required a bean of type X that could not be found'. How do you diagnose it?",
      answer:
        "Work through four causes in order. First, does an implementation exist and does it carry a stereotype annotation — `@Component`, `@Service`, `@Repository` — or is it declared by an `@Bean` method? Second, is it inside the component-scan boundary, meaning the main class's package or below? Third, was it supposed to come from an auto-configuration, in which case `--debug` and the negative matches section will name the condition that failed. Fourth, does it simply not exist yet. In my experience the second is the one people miss, because the class looks completely correct in isolation.",
    },
    {
      question: "How do you read a long Java stack trace efficiently?",
      answer:
        "Bottom-up. The final `Caused by:` is the original exception and its message is usually the real information; everything above is wrapping. Within that block, find the topmost frame belonging to your own package — that is where your code was when it failed. Framework frames in between are the call path and rarely matter. If there is no `Caused by`, the top exception is the root. And when Boot has printed an `APPLICATION FAILED TO START` banner underneath, read that first: an analyzer has already done this work for you.",
    },
    {
      question: "Why does Spring prohibit circular references by default, and what should you do about one?",
      answer:
        "Because with constructor injection a cycle cannot be resolved at all — neither bean can be constructed first — and the mechanisms that make it appear to work with field or setter injection produce half-initialised objects and order-dependent behaviour. Since Boot 2.6 it is a startup failure. The fix is a design change: extract the shared responsibility into a third bean that both depend on, or invert one direction using an application event so the dependency no longer needs to be held. `@Lazy` on one side, or `spring.main.allow-circular-references=true`, will make it start, but both hide a structural problem rather than fixing it.",
    },
  ],
  takeaways: [
    "`APPLICATION FAILED TO START` means an analyzer recognised the failure — read the **Action** line first.",
    "'Required a bean … that could not be found' is usually a missing annotation or a class outside the scan boundary.",
    "'Required a single bean, but 2 were found' is fixed with `@Primary`, `@Qualifier`, or by injecting a `List`/`Map` of them.",
    "A dependency cycle is a design signal; `allow-circular-references` hides it rather than fixing it.",
    "'Failed to configure a DataSource' means a persistence starter is on the classpath with nothing to connect to.",
    "With no analyzer: read the trace bottom-up, take the last `Caused by`, then find your own topmost frame.",
    "`--debug` for \"it will not start\"; the `env`, `configprops`, `beans` and `mappings` endpoints for \"it started but is wrong\".",
    "Failures at startup are the design working — that is why constructor injection and typed properties are worth it.",
  ],
  status: "available",
};
