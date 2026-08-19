import type { Lesson } from "@/content/types";

export const declaringBeansLesson: Lesson = {
  id: "spring-declaring-beans",
  slug: "declaring-beans",
  moduleSlug: "beans-and-configuration",
  title: "Declaring Beans: Stereotypes, @Configuration and @Bean",
  summary:
    "Two ways to put a bean in the container, and a clean rule for choosing: annotate the classes you own, write @Bean methods for the ones you do not. Then the detail nobody explains — what proxyBeanMethods actually does, demonstrated rather than asserted.",
  estimatedMinutes: 30,
  objectives: [
    "Choose between a stereotype annotation and a @Bean method",
    "Say what @Service, @Repository and @Controller add over @Component",
    "Write a @Configuration class for third-party types",
    "Explain what @Configuration proxying does, and when to turn it off",
    "Attach lifecycle callbacks to a bean you did not write",
  ],
  sections: [
    {
      id: "two-ways",
      heading: "The two ways, and the rule",
      body: [
        "**Stereotype annotations** — `@Component` and its specialisations — mark a class so the component scan registers it. **`@Bean` methods** inside a `@Configuration` class register whatever the method returns.",
        "The rule is about ownership. **If you wrote the class, annotate it.** It is one line, it sits with the code, and the constructor documents the dependencies. **If you did not write the class, use a `@Bean` method** — you cannot add an annotation to a library's class, and a `@Bean` method is also where any construction logic belongs.",
      ],
      examples: [
        {
          id: "both",
          title: "Side by side",
          lang: "java",
          code: `// Your class: annotate it.
@Service
public class OrderService {
    public OrderService(OrderRepository repository) { ... }
}

// A class from a library: build it in a @Bean method.
@Configuration
public class ClientConfig {

    @Bean
    public RestClient paymentClient(PaymentProperties properties) {
        return RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("X-Api-Key", properties.getApiKey())
                .build();
    }
}`,
          explanation:
            "Note the `@Bean` method's parameter. **Method parameters are injection points** — Spring resolves `PaymentProperties` from the container exactly as it would a constructor argument. That is how a `@Bean` method gets access to other beans, and it is why you almost never need to inject the context.",
        },
      ],
    },
    {
      id: "stereotypes",
      heading: "The stereotype family",
      body: [
        "`@Service`, `@Repository` and `@Controller` are all meta-annotated with `@Component`. To the scan they are identical. They differ in two ways that are worth respecting.",
        "**They communicate a layer.** `@Service` says business logic, `@Repository` says data access, `@Controller` says web entry point. A reader can navigate a codebase by them, and so can tooling.",
        "**`@Repository` does something real.** It enables exception translation: a `SQLException` or a Hibernate-specific exception thrown inside is caught and rethrown as one of Spring's `DataAccessException` subclasses. That is what lets service code catch `DuplicateKeyException` without importing your database driver's exception hierarchy — and it is why swapping `@Repository` for `@Component` on a DAO quietly changes what your callers see.",
      ],
      examples: [
        {
          id: "stereotype-list",
          title: "The family",
          lang: "java",
          code: `@Component     // anything that does not fit the others
@Service       // business logic
@Repository    // data access -- plus persistence exception translation
@Controller    // web entry point, returning view names
@RestController  // @Controller + @ResponseBody
@Configuration   // a source of @Bean methods (also a @Component)`,
        },
      ],
      pitfalls: [
        {
          title: "A stereotype only works if the scan reaches it",
          body:
            "Component scanning starts at the `@SpringBootApplication` class's package and covers it and everything below. An annotated class outside that subtree is not registered, silently — module 1 lesson 3 proves it with a controller that returns 404 despite being correct in every visible way. When a bean \"is not being picked up\", check the package before anything else.",
        },
      ],
    },
    {
      id: "configuration",
      heading: "@Configuration in detail",
      body: [
        "A `@Configuration` class is itself a bean, discovered by the same component scan, whose `@Bean` methods each contribute one more bean named after the method.",
      ],
      examples: [
        {
          id: "config-anatomy",
          title: "What each part controls",
          lang: "java",
          code: `@Configuration
public class ClientConfig {

    // Bean name is the method name: "paymentClient".
    @Bean
    public RestClient paymentClient(PaymentProperties properties) { ... }

    // Or name it explicitly, and give it aliases.
    @Bean(name = { "auditClient", "audit" })
    public RestClient auditClientBean() { ... }

    // Lifecycle callbacks for a class you cannot annotate.
    @Bean(initMethod = "start", destroyMethod = "shutdown")
    public MetricsReporter reporter() { ... }

    // destroyMethod is inferred: a public no-arg close() or shutdown() is
    // called automatically. Set destroyMethod = "" to stop that.
    @Bean
    public AutoCloseable resource() { ... }
}`,
          explanation:
            "`initMethod` and `destroyMethod` are the `@Bean` equivalents of `@PostConstruct` and `@PreDestroy`, and they exist precisely because you cannot put an annotation on someone else's class. The inference rule catches people out: Spring calls a public no-argument `close()` or `shutdown()` on a `@Bean` at shutdown *unless you tell it not to*.",
        },
      ],
    },
    {
      id: "proxy",
      heading: "proxyBeanMethods, demonstrated",
      body: [
        "This is the part of `@Configuration` that is usually described and rarely shown. By default, Spring subclasses your configuration class at runtime and intercepts calls to its `@Bean` methods, so calling one from another **returns the existing bean** rather than running the method again.",
        "Two configuration classes, structurally identical apart from one attribute:",
      ],
      examples: [
        {
          id: "proxy-code",
          title: "The setup",
          lang: "java",
          code: `public class Dependency {
    private static int instances = 0;
    public final int instance = ++instances;      // counts constructions
}

@Configuration                                    // the default: proxyBeanMethods = true
public class ProxiedConfig {

    @Bean
    public Dependency proxiedDependency() { return new Dependency(); }

    @Bean
    public Consumer proxiedConsumer() {
        return new Consumer(proxiedDependency());  // a call to another @Bean method
    }
}

@Configuration(proxyBeanMethods = false)          // "lite" mode
public class LiteConfig {

    @Bean
    public Dependency liteDependency() { return new Dependency(); }

    @Bean
    public Consumer liteConsumer() {
        return new Consumer(liteDependency());     // the same call
    }
}`,
        },
        {
          id: "proxy-out",
          title: "What each one actually produces",
          lang: "bash",
          code: `PROXY proxyBeanMethods=true  -> consumer holds #3, the bean is #3, same=true
PROXY proxyBeanMethods=false -> consumer holds #2, the bean is #1, same=false`,
          explanation:
            "With proxying on, `proxiedDependency()` inside `proxiedConsumer()` was intercepted and returned the singleton — one object, shared. With it off, the call was an ordinary Java method call, so `new Dependency()` ran a second time and the consumer holds an object that **is not the bean**. Two instances exist, one of them registered and one of them not.",
        },
      ],
      pitfalls: [
        {
          title: "Lite mode is faster, and quietly wrong if you call across @Bean methods",
          body:
            "Proxying costs a CGLIB subclass per configuration class at startup, which is why every auto-configuration Boot ships uses `proxyBeanMethods = false`. That is safe there because those methods take what they need as **parameters** rather than calling each other. Adopt the same discipline — pass dependencies in as method parameters — and lite mode is free. Turn proxying off while calling one `@Bean` method from another and you get duplicate objects, which for a connection pool or a cache is a real bug.",
        },
        {
          title: "A `@Configuration` class cannot be `final`",
          body:
            "Proxying works by subclassing, so a `final` configuration class (or a `final` or `private` `@Bean` method) cannot be proxied. Spring fails at startup rather than silently degrading. With `proxyBeanMethods = false` there is no subclass, so the restriction goes away.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Which to reach for",
      examples: [
        {
          id: "decision",
          title: "In practice",
          lang: "java",
          code: `// Your own class, no construction logic            -> stereotype
@Service
public class PricingService { ... }

// A library type                                    -> @Bean
@Bean
public ObjectMapper objectMapper() { ... }

// Needs configuration read from properties           -> @Bean
@Bean
public DataSource dataSource(DataSourceProperties props) { ... }

// Several beans of one type, differently configured  -> @Bean
@Bean RestClient billingClient(...) { ... }
@Bean RestClient shippingClient(...) { ... }

// Should only exist in some environments             -> either, plus a condition
@Service
@Profile("prod")
public class SmtpEmailSender implements EmailSender { ... }`,
          explanation:
            "The last two are the cases where a `@Bean` method really earns its place: you cannot express \"two differently configured instances of the same class\" with a class-level annotation, because a class can only be annotated once.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When do you use @Bean rather than @Component?",
      answer:
        "`@Component` when you own the class — the annotation lives with the code and the constructor documents its dependencies. `@Bean` when you do not: a library type cannot be annotated, so you construct it in a method. `@Bean` is also the only option when construction needs logic (a builder, values read from properties), when you need several differently configured instances of the same class, or when you need `initMethod`/`destroyMethod` on a class you cannot put `@PostConstruct` on. A `@Bean` method's parameters are injection points, resolved from the container like constructor arguments.",
    },
    {
      question: "What does @Configuration's proxyBeanMethods actually do?",
      answer:
        "With the default `true`, Spring creates a CGLIB subclass of the configuration class and intercepts `@Bean` method calls, so calling one `@Bean` method from another returns the already-created singleton instead of executing the method body again. With `false` — \"lite\" mode — no subclass is created and such a call is an ordinary Java call, producing a second, unmanaged instance. Lite mode avoids the proxy cost at startup and is what Boot's own auto-configurations use, which is safe because they take dependencies as method parameters rather than calling each other. The proxy also means a `@Configuration` class and its `@Bean` methods cannot be `final`.",
    },
    {
      question: "Is there any real difference between @Component, @Service and @Repository?",
      answer:
        "To component scanning, no — `@Service` and `@Repository` are meta-annotated with `@Component`. The differences are intent, which matters for readability and for tooling, and one concrete behaviour: `@Repository` enables persistence exception translation, so vendor-specific exceptions thrown inside are rethrown as Spring's `DataAccessException` hierarchy. That is why a DAO should carry `@Repository` rather than `@Component` — callers otherwise see driver-specific exception types.",
    },
    {
      question: "How do you attach initialisation and cleanup to a bean whose class you cannot modify?",
      answer:
        "Through the `@Bean` annotation's `initMethod` and `destroyMethod` attributes, which name methods on the returned object to call after construction and before shutdown. They are the external equivalents of `@PostConstruct` and `@PreDestroy`. Note that `destroyMethod` is inferred: if the bean type has a public no-argument `close()` or `shutdown()`, Spring calls it at shutdown automatically, and you suppress that with `destroyMethod = \"\"` when the object's lifetime is not the container's to end.",
    },
  ],
  takeaways: [
    "Annotate classes you own; write `@Bean` methods for classes you do not.",
    "`@Bean` method parameters are injection points, resolved from the container.",
    "`@Service`/`@Repository`/`@Controller` are `@Component` plus intent — and `@Repository` also adds exception translation.",
    "A `@Configuration` class is itself a bean, and `@Bean` methods are named after the method.",
    "`proxyBeanMethods = true` makes a call between `@Bean` methods return the singleton; `false` makes it a plain call producing a second, unmanaged object.",
    "Pass dependencies as `@Bean` method parameters and lite mode is safe — which is what Boot's own auto-configurations do.",
    "`destroyMethod` is inferred from a public no-arg `close()`/`shutdown()` unless you set it to `\"\"`.",
  ],
  status: "available",
};
