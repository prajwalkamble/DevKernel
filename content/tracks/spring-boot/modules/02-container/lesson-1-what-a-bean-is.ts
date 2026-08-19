import type { Lesson } from "@/content/types";

export const whatABeanIsLesson: Lesson = {
  id: "spring-what-a-bean-is",
  slug: "what-a-bean-is",
  moduleSlug: "beans-and-configuration",
  title: "What a Bean Is, and the Container That Holds It",
  summary:
    "A bean is an object the container made. The interesting part is the layer above it — the bean *definition* — because that is what Spring actually works with, and knowing the difference explains scopes, conditions, overriding and lazy initialisation in one go.",
  estimatedMinutes: 25,
  objectives: [
    "Distinguish a bean definition from a bean instance",
    "Name the container types and say which one you actually use",
    "Predict the default name Spring gives a bean",
    "Fetch beans by type and by name, and know when each fails",
    "Explain what the two-phase startup buys you",
  ],
  sections: [
    {
      id: "definition",
      heading: "A bean is not special",
      body: [
        "A bean is an ordinary Java object that the container constructed and holds a reference to. There is no interface to implement, no base class to extend, and nothing about the object at runtime marks it as a bean. `new Greeter()` and the `Greeter` bean are the same class producing the same object; the only difference is **who called the constructor**.",
        "What Spring actually manipulates is one level up. For each bean it holds a **bean definition**: a description of how to make the object — which class, which constructor, which arguments, what scope, whether it is lazy, which methods to call after construction and before destruction. Definitions are collected first; instances are created from them afterwards.",
        "That two-phase design is not incidental. It is what makes everything else possible: you can override a definition before anything is built, conditions can remove a definition, a definition can be marked lazy so nothing is built until asked, and the container can compute the whole dependency graph before it constructs the first object.",
      ],
      examples: [
        {
          id: "two-phase",
          title: "The two phases, in the order they run",
          lang: "bash",
          code: `1. REGISTRATION      component scan + @Bean methods + auto-configuration
                        -> a map of name -> BeanDefinition. Nothing constructed yet.

2. POST-PROCESSING   BeanFactoryPostProcessors may edit or add definitions
                        (this is where @ConfigurationProperties binding and
                         property placeholder resolution get wired in)

3. INSTANTIATION     every non-lazy singleton is created, in dependency order
                        -> the actual objects. Your constructors run here.

4. READY             "Started Application in x seconds"`,
          explanation:
            "Everything Spring lets you do to a bean before it exists — conditional registration, overriding, scope, laziness — happens in phases 1 and 2, on the definition. Everything that happens *to the object* happens in phase 3.",
        },
      ],
    },
    {
      id: "container",
      heading: "The container",
      body: [
        "Two interfaces, and in practice you only think about one.",
        "**`BeanFactory`** is the base container: registry, creation, dependency resolution. **`ApplicationContext`** extends it and adds everything an application actually needs — property resolution, internationalisation, event publishing, and the ability to load resources. Boot gives you an `ApplicationContext`, and when someone says \"the container\" or \"the context\" this is what they mean.",
        "You very rarely touch it directly. Asking the context for a bean is called **service locator** style, and it is the thing dependency injection exists to avoid: it hides the dependency from the constructor, so the class no longer declares what it needs. Reach for it in `main`, in framework-level code, and in tests — not in a service.",
      ],
      examples: [
        {
          id: "getbean",
          title: "The two ways to ask, and how they fail",
          lang: "java",
          code: `ConfigurableApplicationContext ctx = SpringApplication.run(App.class, args);

// By type. Fails if there are none, or more than one and no @Primary.
SingletonThing s = ctx.getBean(SingletonThing.class);

// By name, with the type checked.
Notifier pager = ctx.getBean("pager", Notifier.class);

// Is it there at all?
boolean present = ctx.containsBean("pager");

// Every definition the container knows about.
String[] names = ctx.getBeanDefinitionNames();`,
          explanation:
            "`getBean(Class)` throws `NoSuchBeanDefinitionException` when nothing matches and `NoUniqueBeanDefinitionException` when several do — the same two failures you meet as startup errors when injection cannot be resolved, because it is the same resolution code.",
        },
      ],
      pitfalls: [
        {
          title: "`getBean` in business code is a smell",
          body:
            "A class that calls `ctx.getBean(Foo.class)` has a dependency on `Foo` that does not appear in its constructor, cannot be substituted in a test without a container, and will fail at *call* time rather than at startup if `Foo` is missing. Every reason constructor injection exists is a reason not to do this. The legitimate uses are narrow: `main`, code that must choose a bean by a name computed at runtime, and framework integration.",
        },
      ],
    },
    {
      id: "names",
      heading: "Bean names",
      body: [
        "Every bean has a name, unique within the context. You will mostly ignore them — until you need `@Qualifier`, or you hit an overriding error, and then the naming rules matter.",
      ],
      examples: [
        {
          id: "naming",
          title: "Where the default name comes from",
          lang: "java",
          code: `@Component
public class EmailNotifier implements Notifier { }        // -> "emailNotifier"

@Component("pager")
public class PagerNotifier implements Notifier { }        // -> "pager"

@Configuration
public class ProxiedConfig {                              // -> "proxiedConfig"

    @Bean
    public Dependency proxiedDependency() { ... }         // -> "proxiedDependency"
}`,
          explanation:
            "For a scanned class, the simple class name with a lowercased first letter. For a `@Bean` method, **the method name** — which is why renaming a `@Bean` method is a breaking change for anything that referenced it by name. Both can be overridden by giving the annotation a value.",
        },
        {
          id: "names-real",
          title: "The names in a real context",
          lang: "bash",
          code: `# Printed from ctx.getBeanDefinitionNames(), filtered to our own classes:

[emailNotifier, lazyThing, lifecycle, liteConfig, pager, prototypeThing,
 proxiedConfig, singletonThing, smsNotifier]

# Unfiltered, the same trivial application has ~45 definitions. The rest are
# infrastructure that arrived through auto-configuration:

org.springframework.context.annotation.internalConfigurationAnnotationProcessor
org.springframework.boot.context.properties.ConfigurationPropertiesBindingPostProcessor
org.springframework.boot.autoconfigure.task.TaskExecutionAutoConfiguration
applicationTaskExecutorAsyncConfigurer
propertySourcesPlaceholderConfigurer
...`,
          explanation:
            "Two things are worth noticing. **Configuration classes are themselves beans** — `proxiedConfig` and `liteConfig` are in the list, because Spring has to instantiate them to call their `@Bean` methods. And the machinery that makes annotations work is beans too: `internalConfigurationAnnotationProcessor` is what processes `@Configuration`, and it is registered in the same registry as your code. Spring is built out of its own container.",
        },
      ],
      pitfalls: [
        {
          title: "Two beans cannot share a name",
          body:
            "Define a `@Bean proxiedDependency()` in two configuration classes and startup fails: *\"The bean 'proxiedDependency' … could not be registered. A bean with that name has already been defined … and overriding is disabled.\"* Since Boot 2.1 overriding is off by default, because a silently overridden bean is a genuinely horrible bug to find. `spring.main.allow-bean-definition-overriding=true` re-enables it; the right fix is nearly always to rename one.",
        },
      ],
    },
    {
      id: "why",
      heading: "What the container buys you",
      body: [
        "You could write the wiring by hand — lesson 1 of module 1 did. Three things are hard to get any other way.",
        "**The graph is computed, not written.** You declare edges (this class needs that one) and the container derives the order. Adding a dependency changes one constructor rather than an assembly routine.",
        "**Cross-cutting behaviour has somewhere to live.** Because the container creates your objects, it can hand out a *proxy* instead — an object with the same interface that runs something before and after each call. That is the entire mechanism behind `@Transactional`, `@Cacheable`, `@Async`, method security and metrics. None of them would be possible if you had called `new` yourself.",
        "**There is a place to stand.** Something owns every object in the application and knows its lifecycle, so shutdown can be orderly, health can be reported, and tools can inspect what exists. `/actuator/beans` prints the graph of a running system.",
      ],
      pitfalls: [
        {
          title: "Proxies are why self-invocation does not work",
          body:
            "If the container gave callers a proxy around your service, a call from **inside** the object to one of its own methods (`this.doThing()`) bypasses the proxy — because `this` is the real object, not the wrapper. An `@Transactional` method called from another method of the same class therefore runs with no transaction. This surprises everyone once; module 5 covers it properly when transactions arrive. Remember now that it exists, and that it follows directly from how the container works.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a Spring bean?",
      answer:
        "An object instantiated, assembled and managed by the Spring IoC container. There is nothing special about the class — no interface, no base class — the distinction is that the container called the constructor rather than your code. More precisely, Spring holds a `BeanDefinition` describing how to create it (class, constructor arguments, scope, laziness, lifecycle callbacks), and the bean is the instance produced from that definition. The definition/instance split is what allows conditions, overriding, scopes and lazy initialisation to work, because all of those operate on the definition before anything is constructed.",
    },
    {
      question: "What is the difference between BeanFactory and ApplicationContext?",
      answer:
        "`BeanFactory` is the core container contract: a registry of bean definitions with dependency resolution and instantiation. `ApplicationContext` extends it with the facilities an application needs — property and placeholder resolution, resource loading, internationalisation, application event publishing, and eager instantiation of singletons at startup so failures surface immediately. Boot always gives you an `ApplicationContext`; `BeanFactory` matters mainly as the interface the framework's internals are written against.",
    },
    {
      question: "How does Spring name beans, and why does it matter?",
      answer:
        "A scanned class gets its simple name with a lowercased first letter (`EmailNotifier` → `emailNotifier`); a `@Bean` method gets the method's name. Both can be set explicitly via the annotation's value. It matters in three places: `@Qualifier` refers to beans by name, a `Map<String, T>` injection point is keyed by name, and duplicate names are a startup failure since overriding is disabled by default. It also means renaming a `@Bean` method is a breaking change for any code that referenced it by name.",
    },
    {
      question: "Why does letting the container create your objects enable @Transactional and @Cacheable?",
      answer:
        "Because the container controls what the caller receives, it can hand out a proxy implementing the same type instead of the raw object, and run behaviour around each call — open and commit a transaction, consult a cache, record a metric. If you constructed the object yourself with `new`, there would be no point at which anything could be interposed. The direct consequence is self-invocation: a call from inside the object to one of its own methods goes through `this`, not the proxy, so the annotation has no effect on it.",
    },
  ],
  takeaways: [
    "A bean is an ordinary object; the container having created it is the whole difference.",
    "Spring works with **bean definitions** first and instances second — that split is what makes scopes, conditions and lazy init possible.",
    "`ApplicationContext` is the container you use; `BeanFactory` is the interface underneath it.",
    "Default names: class name with a lowercased first letter, or the `@Bean` method's name.",
    "Duplicate bean names are a startup failure — overriding has been off by default since Boot 2.1.",
    "Configuration classes and Spring's own annotation processors are beans in the same registry as your code.",
    "The container owning construction is what makes proxies — and therefore `@Transactional` — possible, and why self-invocation bypasses them.",
  ],
  status: "available",
};
