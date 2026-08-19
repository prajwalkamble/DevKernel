import type { Lesson } from "@/content/types";

export const whatIsSpringBootLesson: Lesson = {
  id: "spring-what-is-spring-boot",
  slug: "what-spring-boot-is",
  moduleSlug: "foundations",
  title: "What Spring Boot Is, and the Problem It Solves",
  summary:
    "Spring, Spring Boot and the Spring ecosystem are three different things, and conflating them is the reason the framework feels arbitrary. Start from the problem — wiring, configuration and infrastructure code that has nothing to do with your product — and Boot's design stops looking like magic.",
  estimatedMinutes: 25,
  objectives: [
    "Separate Spring Framework, Spring Boot, and the wider Spring portfolio",
    "State the problem inversion of control actually solves",
    "Explain what 'convention over configuration' costs and buys",
    "Describe the three things Boot adds on top of Spring",
    "Decide honestly when Spring Boot is the wrong tool",
  ],
  sections: [
    {
      id: "three-things",
      heading: "Three things people call \"Spring\"",
      body: [
        "Almost every early confusion with this framework comes from one word doing three jobs. Pull them apart now and a great deal of what follows becomes obvious.",
        "**Spring Framework** is the core library. Its central feature is an *inversion of control container*: an object that builds your objects for you and hands them their dependencies. Everything else in Spring — the web layer, transactions, security integration — is built on that container. The current version is **Spring Framework 7**.",
        "**Spring Boot** is a layer on top whose entire purpose is to make Spring Framework usable without a week of setup. It contributes three things and nothing else conceptually: **starters** (curated dependency sets), **auto-configuration** (sensible beans defined for you, based on what is on the classpath), and an **embedded server** with an executable jar so your application is a normal process rather than something deployed into an application server. The current version is **Spring Boot 4.1**.",
        "**The Spring portfolio** is a family of separate projects that follow the same conventions: Spring Data, Spring Security, Spring for GraphQL, Spring AI, Spring Batch, and more. These are independent libraries. Boot supplies auto-configuration for them so they slot in without ceremony.",
        "So: Spring Framework is the engine, Spring Boot is the car built around it, and the portfolio is the set of parts you can bolt on. When someone says \"Spring is bloated\", they usually mean the portfolio is large — which it is, and you use perhaps four of its projects.",
      ],
    },
    {
      id: "the-problem",
      heading: "The problem: wiring",
      body: [
        "Before the framework, look at the problem. Here is an ordinary service class with two dependencies, assembled the ordinary way.",
      ],
      examples: [
        {
          id: "manual-wiring",
          title: "Assembling an application by hand",
          lang: "java",
          code: `public class OrderService {
    private final OrderRepository repository;
    private final EmailSender email;

    public OrderService(OrderRepository repository, EmailSender email) {
        this.repository = repository;
        this.email = email;
    }
}

// Somewhere, something has to build all of it:
public static void main(String[] args) {
    DataSource dataSource = new HikariDataSource(hikariConfig());
    OrderRepository repository = new JdbcOrderRepository(dataSource);
    EmailSender email = new SmtpEmailSender(host, port, username, password);
    OrderService orders = new OrderService(repository, email);
    PaymentService payments = new PaymentService(orders, gatewayClient);
    // ... and forty more lines, in dependency order, for a small application
}`,
          explanation:
            "Nothing here is *wrong*. For a small program this is the correct amount of machinery, and you should not reach for a framework to avoid it. The trouble is what happens as the graph grows: the assembly code must be written in dependency order, every new dependency edits `main`, and swapping `SmtpEmailSender` for a fake in a test means rebuilding the graph in the test too. None of this code is about orders or payments.",
        },
      ],
    },
    {
      id: "ioc",
      heading: "Inversion of control, concretely",
      body: [
        "The container's proposition is narrow: *you declare what exists and what each thing needs; the container works out the order and does the construction.* That inversion — you no longer call `new`, something else does — is what \"inversion of control\" names. \"Dependency injection\" is the specific technique: dependencies are handed in rather than looked up.",
        "The same classes, declared rather than assembled:",
      ],
      examples: [
        {
          id: "container-wiring",
          title: "The same graph, declared",
          lang: "java",
          code: `@Service
public class OrderService {
    private final OrderRepository repository;
    private final EmailSender email;

    // No annotation needed on the constructor. A single constructor
    // is enough for Spring to know what to inject.
    public OrderService(OrderRepository repository, EmailSender email) {
        this.repository = repository;
        this.email = email;
    }
}

@SpringBootApplication
public class ShopApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}`,
          explanation:
            "`@Service` marks the class as something the container should manage. `SpringApplication.run` starts the container, which finds the annotated classes, computes the dependency order itself, and constructs everything. Adding a dependency to `OrderService` means editing its constructor — and nothing else. That is the whole trade.",
        },
      ],
      pitfalls: [
        {
          title: "Dependency injection is a pattern, not a framework",
          body:
            "You can do constructor injection in plain Java — the first example does. The container is worth adopting when the graph is large enough that maintaining assembly code by hand is a real cost, and when you want the cross-cutting features (transactions, security, metrics) that the container is able to apply because it owns object creation. On a 300-line program, plain Java wins.",
        },
      ],
    },
    {
      id: "what-boot-adds",
      heading: "What Boot adds on top",
      body: [
        "Spring Framework alone still leaves you configuring a lot: which web server, how JSON is serialised, how the database connection pool is built. Boot's answer is **convention over configuration** — supply working defaults for everything, and let you override any of them.",
        "Concretely, the three contributions:",
        "**Starters.** A starter is a dependency that pulls in a coherent, version-aligned set of libraries. Adding `spring-boot-starter-webmvc` gives you Spring MVC, an embedded Tomcat, and Jackson, all at versions tested together. You stop resolving version conflicts by hand.",
        "**Auto-configuration.** At startup Boot inspects the classpath and the beans you have already defined, then defines the ones you have not. Tomcat on the classpath and no `WebServerFactory` bean of your own? It defines one. This is covered in full in lesson 5, including how to see every decision it made.",
        "**Embedded server and executable jar.** Your application contains its server rather than being deployed into one. `java -jar app.jar` is the whole deployment story, which is what makes Boot fit containers and twelve-factor platforms.",
      ],
      pitfalls: [
        {
          title: "Boot 4 renamed things you will have seen in older code",
          body:
            "Almost every tutorial, answer and book predating 2026 targets Boot 2 or 3, and several names changed in Boot 4. The web starter is now `spring-boot-starter-webmvc`, not `spring-boot-starter-web`. The single `spring-boot-starter-test` was split into per-module test starters. Jackson moved to the `tools.jackson` package, so a copied `com.fasterxml.jackson` import will not resolve. When something from an older source does not compile, this is usually why.",
        },
      ],
    },
    {
      id: "when-not",
      heading: "When not to use Spring Boot",
      body: [
        "A framework that says yes to everything teaches you nothing about its edges, so here are the real ones.",
        "**Startup time and memory matter more than developer speed.** A Boot application starts in a few seconds and holds a few hundred megabytes. For a short-lived CLI or a scale-to-zero function that is a poor fit. Module 18 covers GraalVM native images, which change this materially, at the cost of build complexity and some reflection limits.",
        "**The program is small.** A 500-line job with two dependencies does not need a container. Use plain Java.",
        "**You want to learn what the framework is doing.** This is the honest one. Boot's defaults are good, which means you can ship a working service without understanding HTTP, connection pooling or transactions — right up until production makes you understand them at speed. This track deliberately opens the lid on each default rather than presenting it as a given.",
        "What Boot is genuinely excellent at is the long-lived server application maintained by a team: the case where conventions everybody knows, a large ecosystem of integrations, and a strong operational story pay for themselves many times over. That is what the rest of this track builds.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between Spring and Spring Boot?",
      answer:
        "Spring Framework is the core inversion-of-control container plus the modules built on it. Spring Boot is a layer above it that removes setup cost, contributing three things: starters (curated, version-aligned dependency sets), auto-configuration (beans defined automatically based on the classpath and on which beans you have not defined yourself), and an embedded server packaged into an executable jar. Boot does not replace Spring — every Boot application is a Spring application.",
    },
    {
      question: "What problem does dependency injection solve?",
      answer:
        "It separates using an object from constructing it. Without it, assembly code has to be written in dependency order and every change to a dependency graph ripples into whoever builds it. With it, a class declares its dependencies in its constructor and the container resolves the order and does the construction. The practical benefits are that adding a dependency touches one class, and that tests can supply substitutes without rebuilding the graph. Because the container owns construction, it can also apply cross-cutting behaviour — transactions, security, metrics — around your objects.",
    },
    {
      question: "What does 'convention over configuration' mean, and what does it cost?",
      answer:
        "It means the framework supplies a working default for every decision, so you configure only the deviations. It costs discoverability: when you have not configured something, the behaviour comes from a default defined somewhere you did not write, and finding out what happened requires knowing where to look — the conditions evaluation report, or the auto-configuration class itself. It is a genuine trade of explicitness for speed, not a free win.",
    },
    {
      question: "Why is constructor injection preferred over field injection?",
      answer:
        "Constructor injection lets the field be `final`, so the object cannot exist in a partially built state and is immutable after construction. It makes dependencies visible in the type signature, so a class with eight of them looks as heavy as it is. It works without the container, which means plain unit tests just call the constructor. Field injection, by contrast, requires reflection to populate, hides dependencies from the signature, and cannot produce a `final` field.",
    },
  ],
  takeaways: [
    "Spring Framework is the container; Spring Boot is the setup-removal layer on top; the portfolio is a family of separate projects that plug into both.",
    "Inversion of control means you declare what exists and what it needs, and the container does the construction in the right order.",
    "Boot adds exactly three things: starters, auto-configuration, and an embedded server in an executable jar.",
    "Convention over configuration trades explicitness for speed — the cost is paid when you have to find out what a default did.",
    "Boot 4 renamed the web starter, split the test starter, and moved Jackson to `tools.jackson`; older examples will not compile unchanged.",
    "For short-lived or very small programs, plain Java is the better answer.",
  ],
  status: "available",
};
