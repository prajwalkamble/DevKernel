import type { Lesson } from "@/content/types";

export const conditionalBeansLesson: Lesson = {
  id: "spring-conditional-beans",
  slug: "conditional-beans",
  moduleSlug: "beans-and-configuration",
  title: "Conditional Beans: @Profile and @Conditional",
  summary:
    "A bean definition that is only registered when something is true. Module 1 showed auto-configuration using this to decide what Boot gives you; this is the same machinery pointed at your own code — and the ordering rule that makes one of these annotations unsafe outside a library.",
  estimatedMinutes: 30,
  objectives: [
    "Swap an implementation per environment with @Profile",
    "Switch a feature on and off with @ConditionalOnProperty",
    "Recognise the @ConditionalOn* family and what each tests",
    "Write a custom Condition",
    "Explain why @ConditionalOnMissingBean is unsafe in your own configuration",
  ],
  sections: [
    {
      id: "idea",
      heading: "The idea",
      body: [
        "Lesson 1 made the point that Spring collects **bean definitions** before creating any instances. Conditions live in that gap: during registration, a condition is evaluated, and a definition whose condition is false is never registered at all.",
        "The consequence is worth stating plainly. A conditional bean that does not match is not a null, not a disabled object, not a no-op — it **does not exist**. Anything that required it fails at startup with the missing-bean error from lesson 7 of module 1, which is exactly the behaviour you want.",
      ],
    },
    {
      id: "profile",
      heading: "@Profile: choosing per environment",
      examples: [
        {
          id: "profile-code",
          title: "Two implementations, one interface",
          lang: "java",
          code: `public interface EmailSender {
    String describe();
}

@Service
@Profile("!prod")                       // every profile EXCEPT prod
public class LoggingEmailSender implements EmailSender {
    public String describe() { return "logging (nothing is actually sent)"; }
}

@Service
@Profile("prod")
public class SmtpEmailSender implements EmailSender {
    public String describe() { return "smtp (real mail)"; }
}`,
        },
        {
          id: "profile-out",
          title: "What each run gets",
          lang: "bash",
          code: `$ java -jar app.jar
CFG emailSender = logging (nothing is actually sent)

$ java -jar app.jar --spring.profiles.active=prod
INFO ... : The following 1 profile is active: "prod"
CFG emailSender = smtp (real mail)`,
          explanation:
            "The injection point asked for `EmailSender` and there was never any ambiguity, because only one of the two definitions was registered in each run. Note the `!prod` on the first: negation matters here, because a profile expression that covers only the profiles you thought of leaves the bean missing entirely when someone adds a new one.",
        },
        {
          id: "profile-expressions",
          title: "Profile expressions",
          lang: "java",
          code: `@Profile("dev")                 // dev active
@Profile("!prod")               // prod not active
@Profile({ "dev", "test" })     // dev OR test
@Profile("prod & metrics")      // both
@Profile("!prod & !test")       // neither

// On a @Bean method as well as a class:
@Bean
@Profile("prod")
public DataSource dataSource() { ... }`,
        },
      ],
      pitfalls: [
        {
          title: "Two profiles selecting two implementations means you test the wrong code",
          body:
            "The pattern is genuinely useful for external systems you must not touch from a laptop — email, payments, SMS. It is also how you end up shipping a code path nobody has run: the implementation exercised by every test and every local run is the one that will never execute in production. Keep the profile-swapped surface as small as possible, prefer configuring one implementation differently over selecting between two, and if you must have both, integration-test the production one against a fake server rather than swapping it out.",
        },
        {
          title: "A bean with no matching profile just is not there",
          body:
            "Misspell `@Profile(\"prd\")` and in production the bean silently vanishes, and you get an unsatisfied-dependency failure naming the interface rather than the typo. That failure is at startup, which is the saving grace — but the message points at the consumer, not the cause. Check the conditions report (`--debug`) when a profile-selected bean is missing; it names the condition that failed.",
        },
      ],
    },
    {
      id: "property",
      heading: "@ConditionalOnProperty: a feature switch",
      examples: [
        {
          id: "property-code",
          title: "On unless turned off",
          lang: "java",
          code: `@Component
@ConditionalOnProperty(
        prefix = "catalog.cache",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true)          // <- default ON when the property is absent
public class CacheWarmer {
    public CacheWarmer() {
        System.out.println("COND CacheWarmer created");
    }
}`,
        },
        {
          id: "property-out",
          title: "With and without the property",
          lang: "bash",
          code: `$ java -jar app.jar
COND CacheWarmer created

$ java -jar app.jar --catalog.cache.enabled=false
(nothing -- the bean was never registered)`,
          explanation:
            "`matchIfMissing` is the attribute that decides your default, and it is the one to be deliberate about. `true` means opt-out — the feature is on unless disabled, which suits something most deployments want. `false` (the default) means opt-in, which suits anything expensive or risky. Getting it backwards produces a feature that is silently on everywhere, which is how a debug endpoint reaches production.",
        },
      ],
    },
    {
      id: "family",
      heading: "The @ConditionalOn* family",
      body: [
        "Module 1 lesson 5 met these from the outside, reading the conditions report to find out what auto-configuration decided. They are ordinary annotations and your code can use them too.",
      ],
      examples: [
        {
          id: "family-list",
          title: "What each one tests",
          lang: "java",
          code: `@ConditionalOnClass(RestClient.class)       // that class is on the classpath
@ConditionalOnMissingClass("com.foo.Bar")   // it is not

@ConditionalOnBean(DataSource.class)        // such a bean is already defined
@ConditionalOnMissingBean                   // it is not  -- see the warning below

@ConditionalOnProperty(...)                 // a property has a given value
@ConditionalOnBooleanProperty("app.feature.enabled")

@ConditionalOnResource(resources = "classpath:rules.json")
@ConditionalOnWebApplication(type = SERVLET)
@ConditionalOnNotWebApplication
@ConditionalOnJava(JavaVersion.TWENTY_ONE)
@ConditionalOnExpression("\${app.mode} == 'strict'")   // arbitrary SpEL`,
          explanation:
            "`@ConditionalOnClass` is the one that makes optional integrations possible: a bean that only exists when a library is present, so adding a dependency switches a feature on. That is the whole design of a Spring starter.",
        },
      ],
      pitfalls: [
        {
          title: "@ConditionalOnMissingBean is for libraries, not applications",
          body:
            "It works by asking what has been registered *so far*, so its answer depends on the order configuration classes are processed — and that order is not guaranteed between your own `@Configuration` classes. Auto-configuration can rely on it because Boot guarantees auto-configuration is processed **after** all user configuration, so \"nothing defined it\" is a settled question by then. Inside your own application, two configuration classes each backing off from the other is a coin flip that may land differently after an unrelated refactor. Use it when writing a starter; use `@Profile` or `@ConditionalOnProperty` when writing an application.",
        },
      ],
    },
    {
      id: "custom",
      heading: "Writing your own Condition",
      body: [
        "When nothing built in expresses the rule, implement `Condition`. It is a single method returning a boolean.",
      ],
      examples: [
        {
          id: "custom-code",
          requires: "a running Spring application context",
          title: "A condition and its use",
          lang: "java",
          code: `public class OnLinuxCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String os = context.getEnvironment().getProperty("os.name", "");
        return os.toLowerCase().contains("linux");
    }
}

@Component
@Conditional(OnLinuxCondition.class)
public class LinuxOnlyBean {
    public LinuxOnlyBean() {
        System.out.println("COND LinuxOnlyBean created");
    }
}`,
          output: `COND LinuxOnlyBean created        # on Linux
CFG conditional beans present = [cacheWarmer, linuxOnlyBean]`,
          explanation:
            "`ConditionContext` gives you the `Environment` (properties and active profiles), the `BeanFactory`, the `ClassLoader` and the resource loader — enough to test almost anything. `AnnotatedTypeMetadata` describes what the annotation was placed on, which is how a condition can read attributes from its own annotation and behave differently per use.",
        },
        {
          id: "custom-meta",
          title: "Wrapping it in an annotation of your own",
          lang: "java",
          code: `@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.TYPE, ElementType.METHOD })
@Conditional(OnLinuxCondition.class)
public @interface ConditionalOnLinux { }

@Component
@ConditionalOnLinux                        // reads far better at the use site
public class LinuxOnlyBean { ... }`,
          explanation:
            "This is exactly how `@ConditionalOnClass` and the rest are built — each is a meta-annotation over a `Condition` implementation. Worth doing whenever the same condition appears more than twice.",
        },
      ],
    },
    {
      id: "debugging",
      heading: "Finding out why a bean is missing",
      body: [
        "Every condition in the application — Boot's and yours — is reported in the conditions evaluation report from module 1 lesson 5.",
      ],
      examples: [
        {
          id: "debug",
          title: "The same tool, on your own beans",
          lang: "bash",
          code: `$ java -jar app.jar --debug
# ... then read the Negative matches section for your class name.

# In a running application, if the endpoint is exposed:
$ curl -s localhost:8080/actuator/conditions | jq '.contexts[].negativeMatches'

# And to see which profiles are actually active:
$ curl -s localhost:8080/actuator/env | jq '.activeProfiles'`,
          explanation:
            "When a bean you expected is missing, this answers it in one step instead of reasoning about it. The negative matches entry names the condition that failed and, for property conditions, the property it looked for and did not find.",
        },
      ],
      pitfalls: [
        {
          title: "Conditions are evaluated once, at startup",
          body:
            "A conditional bean is decided when the context is built and never reconsidered. Changing `catalog.cache.enabled` at runtime does nothing — the definition was already registered or discarded. If you need a switch that flips without a restart, that is a feature flag: an ordinary bean that reads a value on each call, or a dedicated flag library. Conditions decide what exists; flags decide what it does.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you provide a different implementation per environment?",
      answer:
        "`@Profile` on the bean, with the profile activated through `spring.profiles.active`. Only the matching definition is registered, so an injection point asking for the interface sees exactly one candidate and there is no ambiguity to resolve. Expressions support negation and combination — `@Profile(\"!prod\")`, `@Profile(\"prod & metrics\")` — and negation is usually the safer default, since a positive list stops covering you as soon as someone adds a profile. The design caveat is that whatever runs locally and in tests is then not what runs in production, so the swapped surface should stay small.",
    },
    {
      question: "What does @ConditionalOnProperty's matchIfMissing control?",
      answer:
        "Whether the condition matches when the property is absent entirely — that is, whether the feature defaults to on or off. `matchIfMissing = true` is opt-out: the bean exists unless someone sets the property to disable it. The default, `false`, is opt-in: nothing happens until the property is explicitly set. It is worth being deliberate about, because getting it backwards on something like a debug or diagnostics bean means it is silently enabled in every environment that never mentions the property.",
    },
    {
      question: "Why is @ConditionalOnMissingBean risky in your own configuration?",
      answer:
        "Because it asks what has been registered so far, so its result depends on the order in which configuration classes are processed — and Spring makes no ordering guarantee between an application's own `@Configuration` classes. Auto-configuration can depend on it safely because Boot guarantees auto-configuration runs after all user configuration, making \"the user did not define one\" a settled question. In application code, two classes each backing off from the other can resolve differently after an unrelated change. Use it when writing a starter; inside an application prefer `@Profile` or `@ConditionalOnProperty`, which do not depend on ordering.",
    },
    {
      question: "How would you write a condition Spring does not provide?",
      answer:
        "Implement `Condition`, whose single `matches` method receives a `ConditionContext` — giving access to the `Environment`, the bean factory, the class loader and the resource loader — and `AnnotatedTypeMetadata` describing what the annotation was placed on. Then apply it with `@Conditional(MyCondition.class)`, and usually wrap that in your own meta-annotation so the use site reads well. That is precisely how the built-in `@ConditionalOn*` annotations are constructed. For an auto-configuration class, extend `SpringBootCondition` instead so the result appears in the conditions evaluation report with a readable message.",
    },
  ],
  takeaways: [
    "A condition is evaluated during bean-definition registration, so a non-matching bean does not exist rather than being disabled.",
    "`@Profile` selects per environment; prefer negated expressions so a new profile does not silently remove a bean.",
    "`@ConditionalOnProperty` with `matchIfMissing` is your opt-in/opt-out switch — choose the default deliberately.",
    "`@ConditionalOnClass` is what makes \"add the dependency to enable the feature\" work, and is the core of a starter.",
    "`@ConditionalOnMissingBean` depends on processing order — safe in a library, unreliable in an application.",
    "A custom `Condition` is one boolean method; wrap it in a meta-annotation the way Boot does.",
    "`--debug` and the `conditions` endpoint report your own conditions, not just Boot's.",
    "Conditions are decided once at startup — for a switch that flips at runtime you need a feature flag, not a condition.",
  ],
  status: "available",
};
