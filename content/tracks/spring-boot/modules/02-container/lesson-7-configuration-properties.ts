import type { Lesson } from "@/content/types";

export const configurationPropertiesLesson: Lesson = {
  id: "spring-configuration-properties",
  slug: "configuration-properties",
  moduleSlug: "beans-and-configuration",
  title: "Configuration Properties as Beans",
  summary:
    "Module 1 covered where configuration values come from. This is the other half: turning a group of them into a typed, validated, immutable bean — including binding a class you did not write, converting to your own types, and failing at startup when a value is out of range.",
  estimatedMinutes: 35,
  objectives: [
    "Bind a group of properties onto an immutable record",
    "Predict which types Spring converts for you, and which need help",
    "Bind properties onto a third-party class you cannot annotate",
    "Register a custom converter for a domain type",
    "Make an out-of-range value a startup failure rather than a runtime surprise",
  ],
  sections: [
    {
      id: "why",
      heading: "Why a bean rather than a handful of @Values",
      body: [
        "Module 1 lesson 6 introduced `@ConfigurationProperties` alongside `@Value` and property precedence. That lesson was about *where a value comes from*. This one is about the object it lands on, because that object is a bean like any other — created by the container, injectable, and subject to the same lifecycle you learned in lesson 5.",
        "The reason to prefer it is that a typed object gives you five things a scattered set of `@Value` strings cannot: conversion to real types, validation at startup, one place that documents every setting a feature has, IDE autocompletion in `application.yml`, and visibility through the `configprops` actuator endpoint.",
      ],
    },
    {
      id: "record",
      heading: "Constructor binding onto a record",
      body: [
        "The shape to reach for in new code. No setters, nothing mutable, defaults declared where the field is.",
      ],
      examples: [
        {
          id: "record",
          title: "One record, several types",
          lang: "java",
          code: `@Validated
@ConfigurationProperties(prefix = "catalog")
public record CatalogProperties(

        @NotBlank
        @DefaultValue("unset") String displayName,

        @Min(1) @Max(100)
        @DefaultValue("10") int pageSize,

        @DefaultValue("5s") Duration timeout,

        @DefaultValue("10MB") DataSize maxUpload,

        @Valid @DefaultValue Retry retry,

        @DefaultValue List<Endpoint> endpoints) {

    public record Retry(@DefaultValue("3") @Min(1) int attempts,
                        @DefaultValue("200ms") Duration backoff) {}

    public record Endpoint(String name, String url) {}
}`,
          explanation:
            "A record has exactly one constructor, so Spring uses constructor binding without being told. `@DefaultValue` supplies the value when the property is absent — note it takes a **string**, parsed the same way a property would be. On a nested object, bare `@DefaultValue` means \"build it from its own defaults rather than leaving it null\", which is what stops `properties.retry()` from being a `NullPointerException` waiting to happen.",
        },
        {
          id: "yaml",
          title: "The configuration it binds",
          lang: "yaml",
          code: `catalog:
  display-name: Catalog Service
  page-size: 20
  timeout: 30s
  max-upload: 25MB
  retry:
    attempts: 5
    backoff: 750ms
  endpoints:
    - name: billing
      url: https://billing.internal/api
    - name: shipping
      url: https://shipping.internal/api`,
        },
        {
          id: "bound",
          title: "What arrives in the object",
          lang: "bash",
          code: `CFG displayName = Catalog Service
CFG pageSize    = 20
CFG timeout     = PT30S  (from "30s")
CFG maxUpload   = 26214400 bytes  (from "25MB")
CFG retry       = attempts=5 backoff=PT0.75S
CFG endpoints   = [Endpoint[name=billing, url=https://billing.internal/api],
                   Endpoint[name=shipping, url=https://shipping.internal/api]]`,
          explanation:
            "Every conversion here is free. `30s` became a `Duration` of PT30S, `750ms` became PT0.75S, `25MB` became a `DataSize` of 26,214,400 bytes, and the YAML list became a `List<Endpoint>` of records. You wrote no parsing code — and, more to the point, a malformed value is caught here rather than the first time the field is read.",
        },
      ],
      pitfalls: [
        {
          title: "Records give you constructor binding; classes need a single constructor too",
          body:
            "The JavaBean style — a class with getters and setters — still works and is what you will meet in older codebases, but it forces mutability and cannot be `final`. If you use a class, give it one constructor and Spring binds through it exactly as it does for a record. What you must not do is mix: a class with both a binding constructor and setters is ambiguous, and Spring will tell you so at startup.",
        },
      ],
    },
    {
      id: "conversion",
      heading: "What Spring converts, and what it does not",
      examples: [
        {
          id: "conversions",
          title: "Free conversions",
          lang: "properties",
          code: `# Primitives, wrappers, String, enums                 int, long, boolean, MyEnum
app.retries=3
app.mode=STRICT

# Duration -- suffix or ISO-8601
app.timeout=5s          app.timeout=200ms       app.timeout=PT1M30S

# DataSize
app.max-upload=10MB     app.buffer=512KB

# Collections and maps
app.hosts[0]=a.internal
app.limits.free=10
app.limits.paid=1000

# Nested objects, to any depth
app.retry.attempts=3
app.retry.backoff=200ms

# java.time, URI, URL, Charset, Locale, Resource, Class, Pattern ...
app.start=2026-08-12T09:00:00Z
app.config=classpath:rules.json`,
          explanation:
            "The list is long enough that the practical rule is: assume Spring can convert it, and only write code when it cannot. `Duration` and `DataSize` are worth memorising because hand-parsing `\"30\"` into \"thirty of something\" is a classic source of unit bugs.",
        },
        {
          id: "converter",
          requires: "a running Spring application context",
          title: "A type Spring cannot guess",
          lang: "java",
          code: `public record Region(String country, String zone) { }

@Component
@ConfigurationPropertiesBinding                     // <- the part people miss
public class RegionConverter implements Converter<String, Region> {

    @Override
    public Region convert(String source) {
        String[] parts = source.split("-", 2);
        return new Region(parts[0], parts.length > 1 ? parts[1] : "default");
    }
}

@ConfigurationProperties(prefix = "deployment")
public record DeploymentProperties(@DefaultValue("gb-london") Region region) { }`,
          output: `CFG region = gb/london  (custom Converter)`,
          explanation:
            "`@ConfigurationPropertiesBinding` is the load-bearing annotation. A plain `Converter` bean joins the application's general conversion service, which is **not** the one property binding uses — binding happens early, before most of the context exists, so it has its own. Without that annotation the converter is registered, never consulted, and you get a conversion failure for a converter you can see in the container.",
        },
      ],
    },
    {
      id: "third-party",
      heading: "Binding a class you did not write",
      body: [
        "This is where lesson 2's rule — annotate what you own, use `@Bean` for what you do not — meets configuration. You cannot put `@ConfigurationProperties` on a library's class, but you can put it on the `@Bean` method that creates one.",
      ],
      examples: [
        {
          id: "third-party-code",
          title: "@ConfigurationProperties on a @Bean method",
          lang: "java",
          code: `// From a library. No Spring annotations, ordinary setters.
public class LegacyClient {
    private String host = "localhost";
    private int port = 1234;
    private boolean tls = false;
    // getters and setters ...
}

@Configuration
public class LegacyConfig {

    @Bean
    @ConfigurationProperties(prefix = "legacy")     // binds onto the RETURNED object
    public LegacyClient legacyClient() {
        return new LegacyClient();
    }
}`,
        },
        {
          id: "third-party-out",
          title: "The properties land on the instance",
          lang: "bash",
          code: `# application.yml
legacy:
  host: legacy.internal
  port: 9000
  tls: true

# at startup:
CFG legacy = LegacyClient[host=legacy.internal, port=9000, tls=true]`,
          explanation:
            "Spring constructs the object your method returned, then applies the `legacy.*` properties to it through its setters. The values you set inside the method act as defaults, because binding runs afterwards and only overwrites what the configuration actually specifies. This is exactly how Boot configures things like `DataSource` and `RestClient` internally, and it is the cleanest way to make a third-party client configurable without writing a properties class that mirrors it field for field.",
        },
      ],
    },
    {
      id: "validation",
      heading: "Failing at startup on a bad value",
      body: [
        "Type conversion already rejects `page-size: lots`. Validation goes further and rejects values that are the right *type* and the wrong *value* — which is the class of misconfiguration that otherwise reaches production intact.",
      ],
      examples: [
        {
          id: "validation-one",
          title: "One constraint violated",
          lang: "bash",
          code: `$ java -jar app.jar --catalog.page-size=500

***************************
APPLICATION FAILED TO START
***************************

Description:

Binding to target com.example.container.config.CatalogProperties failed:

    Property: catalog.pageSize
    Value: "500"
    Origin: "catalog.page-size" from property source "commandLineArgs"
    Reason: must be less than or equal to 100

Action:

Update your application's configuration`,
          explanation:
            "Read the two name forms: **Property** is the canonical name of the target — `catalog.pageSize`, the Java field — while **Origin** is the name and source it actually came from. When relaxed binding has quietly matched something you did not expect, that pair is what tells you.",
        },
        {
          id: "validation-many",
          title: "All violations at once, including nested ones",
          lang: "bash",
          code: `$ java -jar app.jar --catalog.page-size=500 --catalog.display-name=

Binding to target com.example.container.config.CatalogProperties failed:

    Property: catalog.pageSize
    Value: "500"
    Origin: "catalog.page-size" from property source "commandLineArgs"
    Reason: must be less than or equal to 100

    Property: catalog.displayName
    Value: ""
    Origin: "catalog.display-name" from property source "commandLineArgs"
    Reason: must not be blank

# And with @Valid on the nested record, its constraints are checked too:
$ java -jar app.jar --catalog.retry.attempts=0

    Property: catalog.retry.attempts
    Value: "0"
    Reason: must be greater than or equal to 1`,
          explanation:
            "Every violation is reported in one go, rather than one per restart. Nested validation needs `@Valid` on the nested field — without it, `Retry`'s own constraints are silently ignored, which is the single most common mistake with validated configuration.",
        },
      ],
      pitfalls: [
        {
          title: "`@Validated` on the class, `@Valid` on the nested field",
          body:
            "Two annotations that look interchangeable and are not. `@Validated` (Spring's) on the `@ConfigurationProperties` type switches validation on for it. `@Valid` (Jakarta's) on a nested field tells the validator to recurse into it. Omit the first and nothing is validated; omit the second and only the top level is. Both are needed, and neither reports that it is missing.",
        },
        {
          title: "Validate what has a sensible range, not everything",
          body:
            "Pool sizes, timeouts, retry counts, page sizes, thread counts — anything where a plausible-looking number can still be wrong is worth a constraint, because the alternative is discovering it under load. A `@NotBlank` on every string, by contrast, is noise that makes the class harder to read without catching anything real.",
        },
      ],
    },
    {
      id: "registration",
      heading: "Registration, and the bean it becomes",
      body: [
        "`@ConfigurationProperties` alone does not create a bean — unlike `@Component`, the annotation is a binding instruction, not a stereotype. Two ways to register it:",
      ],
      examples: [
        {
          id: "registration-code",
          requires: "a running Spring application context",
          title: "Scan, or enable individually",
          lang: "java",
          code: `// 1. Scan for them, exactly like component scanning. The usual choice.
@SpringBootApplication
@ConfigurationPropertiesScan
public class Application { ... }

// 2. Or register specific types, typically from the configuration that uses them.
@Configuration
@EnableConfigurationProperties({ CatalogProperties.class, DeploymentProperties.class })
public class CatalogConfig { ... }`,
          output: `CFG props bean names = [catalog-com.example.container.config.CatalogProperties,
                        deployment-com.example.container.config.DeploymentProperties]`,
          explanation:
            "Note the generated bean names: **prefix, a hyphen, then the fully qualified class name**. That is why you almost never refer to a properties bean by name — you inject it by type. It is also how you spot them in `/actuator/beans`. Option 2 is what a library should use, since scanning is the application's decision to make, not a dependency's.",
        },
      ],
      pitfalls: [
        {
          title: "Forgetting registration produces a confusing error",
          body:
            "A `@ConfigurationProperties` class with neither `@ConfigurationPropertiesScan` reaching it nor an `@EnableConfigurationProperties` naming it is not a bean, so injecting it fails with *required a bean of type … that could not be found* — for a class that visibly carries a Spring annotation. Add `@ConfigurationPropertiesScan` to the main class once and the problem never recurs.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does @ConfigurationProperties differ from @Value?",
      answer:
        "`@Value` injects one value from a SpEL-style placeholder string; `@ConfigurationProperties` binds a whole group onto a typed object. The typed object gives type conversion, startup-time failure on bad values, Bean Validation support through `@Validated`, one place that documents every setting a feature has, IDE autocompletion via the configuration processor, and visibility in the `configprops` actuator endpoint. `@Value` also scatters uncheckable key strings across classes. Use `@Value` for a genuine one-off with an inline default, and `@ConfigurationProperties` for anything that is a group — which is most things.",
    },
    {
      question: "How do you bind configuration onto a class from a third-party library?",
      answer:
        "Put `@ConfigurationProperties` on the `@Bean` method that creates it, alongside `@Bean`. Spring constructs whatever the method returns and then applies the prefixed properties to it through its setters, so any values you set inside the method act as defaults that configuration can override. This avoids writing a mirror properties class and re-copying its fields, and it is the same mechanism Boot uses internally for types like `DataSource`. It requires the third-party class to have setters; if it is immutable, you bind a properties record instead and pass its values to the builder.",
    },
    {
      question: "You wrote a Converter for a custom type and binding still fails. Why?",
      answer:
        "Because property binding does not use the application's general `ConversionService`. Binding happens very early, before most of the context exists, so it builds its own conversion service from converter beans explicitly marked with `@ConfigurationPropertiesBinding`. Without that annotation the `Converter` bean exists and is simply never consulted during binding. Adding it fixes the failure.",
    },
    {
      question: "How do you validate configuration, and what is the difference between @Validated and @Valid here?",
      answer:
        "Put Spring's `@Validated` on the `@ConfigurationProperties` type to switch validation on, and Jakarta's `@Valid` on any nested field so the validator recurses into it. Constraints then run at binding time, so a bad value fails startup with every violation listed at once, each with the property's canonical name, the offending value, and the origin — the source and, for a file, the line. Missing `@Validated` means nothing is validated; missing `@Valid` on a nested type means only the top level is. Neither omission reports itself, which is what makes it a common bug.",
    },
  ],
  takeaways: [
    "A `@ConfigurationProperties` type is an ordinary bean — inject it by type like any other.",
    "A record gets constructor binding for free; `@DefaultValue` supplies absent values, and bare `@DefaultValue` on a nested type stops it being null.",
    "`Duration` (`30s`), `DataSize` (`25MB`), enums, lists, maps and nested objects all convert with no code.",
    "For your own types, write a `Converter` **and** annotate it `@ConfigurationPropertiesBinding` — binding does not use the general conversion service.",
    "`@ConfigurationProperties` on a `@Bean` method binds onto a class you cannot annotate.",
    "`@Validated` on the type, `@Valid` on nested fields — both are needed, and neither reports being missing.",
    "Binding failures list every violation at once, with the canonical **Property** name and the **Origin** it came from.",
    "Register with `@ConfigurationPropertiesScan`; the resulting bean is named `prefix-fully.qualified.ClassName`.",
  ],
  status: "available",
};
