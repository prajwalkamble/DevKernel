import type { Lesson } from "@/content/types";

export const configurationLesson: Lesson = {
  id: "spring-configuration",
  slug: "configuration-and-profiles",
  moduleSlug: "foundations",
  title: "Configuration: Properties, Profiles and Precedence",
  summary:
    "Everything that differs between your laptop and production lives here. Where values come from, the exact order in which they beat each other, and how to bind a group of them onto a typed object instead of scattering strings through your code.",
  estimatedMinutes: 35,
  objectives: [
    "Write configuration in application.yml and know what the indentation means",
    "Read a value with @Value and bind a group with @ConfigurationProperties",
    "Use profiles for per-environment configuration, and know that they merge",
    "State the property precedence order and predict which source wins",
    "Explain relaxed binding, including the form environment variables must take",
  ],
  sections: [
    {
      id: "why",
      heading: "Why not just put it in the code",
      body: [
        "A database URL, a third-party API key, a page size, a feature flag: each differs between your laptop, the test environment and production, and one of them must never be in version control at all. Externalised configuration is what lets a **single artifact** — one jar, one container image, byte-for-byte — run in every environment. That property is the whole point, and it is the reason twelve-factor puts config in the environment.",
        "Boot reads configuration from many places and merges them into one `Environment`. Your code asks the `Environment` for a value and never knows which place it came from.",
      ],
    },
    {
      id: "files",
      heading: "application.yml, and .properties",
      body: [
        "Boot looks for `application.properties` or `application.yml` on the classpath (`src/main/resources/`) and in a `config/` directory beside the jar. Both formats express the same thing; YAML nests, which makes a large file far easier to read.",
      ],
      examples: [
        {
          id: "yaml",
          title: "The same configuration, both ways",
          lang: "yaml",
          code: `# application.yml
spring:
  application:
    name: catalog

server:
  port: 8080

catalog:
  display-name: Catalog Service
  page-size: 20
  features:
    - search
    - recommendations`,
        },
        {
          id: "props",
          title: "Identical, in properties form",
          lang: "properties",
          code: `spring.application.name=catalog
server.port=8080
catalog.display-name=Catalog Service
catalog.page-size=20
catalog.features[0]=search
catalog.features[1]=recommendations`,
          explanation:
            "Note what YAML buys you at the list. Keep to one format per project — if both files are present, `.properties` wins, and a value that mysteriously refuses to change is often a leftover `application.properties` sitting next to the `application.yml` you have been editing.",
        },
      ],
      pitfalls: [
        {
          title: "YAML gotchas that cost an afternoon",
          body:
            "Tabs are not valid indentation — spaces only. An unquoted `on`, `off`, `yes` or `no` is a boolean, so a password of `no` becomes `false`. A version like `1.10` is a number and loses its trailing zero. Quote anything that is meant to be a string and looks like something else. And YAML is whitespace-significant: two keys at different indentation are in different objects, with no error to tell you.",
        },
      ],
    },
    {
      id: "reading",
      heading: "Two ways to read a value",
      body: [
        "`@Value` for a single value; `@ConfigurationProperties` for a group. In real applications you will use the second far more.",
      ],
      examples: [
        {
          id: "value",
          title: "@Value, and its default syntax",
          lang: "java",
          code: `@RestController
public class ConfigController {

    private final String bannerText;

    public ConfigController(@Value("\${catalog.banner:no banner configured}") String bannerText) {
        this.bannerText = bannerText;
    }
}`,
          explanation:
            "The part after the colon is the default, used when the property is absent. **Without a default, a missing property is a startup failure** — which is usually what you want for something like a database URL. Prefer injecting `@Value` through the constructor rather than onto a field, for the same reasons constructor injection wins generally.",
        },
        {
          id: "confprops",
          title: "@ConfigurationProperties: a typed object",
          lang: "java",
          code: `package com.example.catalog;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "catalog")
public class CatalogProperties {

    private String displayName = "unset";     // <- field defaults are the defaults
    private int pageSize = 10;
    private List<String> features = List.of();

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }

    public List<String> getFeatures() { return features; }
    public void setFeatures(List<String> features) { this.features = features; }
}

// Registered by adding this to the main class:
@SpringBootApplication
@ConfigurationPropertiesScan
public class CatalogApplication { ... }`,
          explanation:
            "Now `catalog.display-name`, `catalog.page-size` and `catalog.features` bind onto one object, converted to their real types, and you inject `CatalogProperties` like any other bean. Three things you gain over scattered `@Value`s: **type safety** (a non-numeric `page-size` fails at startup, not at first use), **one place** to see every setting the feature has, and **IDE autocompletion** in `application.yml` once you add the `spring-boot-configuration-processor` dependency.",
        },
        {
          id: "confprops-record",
          title: "The immutable form",
          lang: "java",
          code: `@ConfigurationProperties(prefix = "catalog")
public record CatalogProperties(
        @DefaultValue("unset") String displayName,
        @DefaultValue("10") int pageSize,
        List<String> features) {
}`,
          explanation:
            "Constructor binding onto a record: no setters, nothing mutable, and defaults expressed with `@DefaultValue`. This is the better shape for new code. The JavaBean version above is what you will meet in existing codebases, which is why both are here.",
        },
      ],
      pitfalls: [
        {
          title: "@ConfigurationProperties classes need registering",
          body:
            "Unlike `@Component`, the annotation alone is not enough. Either add `@ConfigurationPropertiesScan` to the main class (scans like component scanning does, from that package down), or list the class in `@EnableConfigurationProperties(CatalogProperties.class)` on a configuration class. Forgetting produces a `NoSuchBeanDefinitionException` for a class that visibly has the annotation on it.",
        },
      ],
    },
    {
      id: "profiles",
      heading: "Profiles",
      body: [
        "A profile is a named set of configuration, activated by name. The convention is one per environment: `dev`, `test`, `prod`.",
        "Boot loads `application.yml` **always**, and then `application-{profile}.yml` for each active profile on top. Note the word *on top* — profile files are merged over the base, not substituted for it.",
      ],
      examples: [
        {
          id: "profile-files",
          title: "Base and override",
          lang: "yaml",
          code: `# application.yml -- always loaded
catalog:
  display-name: Catalog Service
  page-size: 20
  features:
    - search
    - recommendations

# application-dev.yml -- loaded only when the dev profile is active
catalog:
  page-size: 5
  banner: Development build -- do not use for real orders`,
        },
        {
          id: "profile-run",
          title: "The merge, demonstrated",
          lang: "bash",
          code: `$ java -jar catalog.jar
INFO ... : No active profile set, falling back to 1 default profile: "default"
$ curl -s localhost:8080/config
{"displayName":"Catalog Service","pageSize":20,"features":["search","recommendations"],
 "banner":"no banner configured","activeProfiles":[]}

$ java -jar catalog.jar --spring.profiles.active=dev
INFO ... : The following 1 profile is active: "dev"
$ curl -s localhost:8080/config
{"displayName":"Catalog Service","pageSize":5,"features":["search","recommendations"],
 "banner":"Development build -- do not use for real orders","activeProfiles":["dev"]}`,
          explanation:
            "`page-size` became 5 and `banner` appeared, but `display-name` and `features` survived — they were never mentioned in the dev file. **Put everything in the base file and override only the differences.** A profile file that repeats the whole configuration is a file that will drift.",
        },
        {
          id: "profile-activate",
          title: "Ways to activate a profile",
          lang: "bash",
          code: `$ java -jar app.jar --spring.profiles.active=prod          # command line
$ SPRING_PROFILES_ACTIVE=prod java -jar app.jar            # environment variable
$ java -Dspring.profiles.active=prod -jar app.jar          # JVM system property

# More than one, applied left to right:
$ java -jar app.jar --spring.profiles.active=prod,metrics`,
        },
        {
          id: "profile-beans",
          title: "Profiles also select beans",
          lang: "java",
          code: `@Service
@Profile("!prod")                 // any profile except prod
public class LoggingEmailSender implements EmailSender { ... }

@Service
@Profile("prod")
public class SmtpEmailSender implements EmailSender { ... }`,
          explanation:
            "`@Profile` is evaluated during bean creation, so a whole implementation can be swapped per environment. Useful, and easy to overuse — when two profiles select two implementations of an interface, the code paths you run locally are not the code paths that run in production. Prefer configuring one implementation differently where you can.",
        },
      ],
      pitfalls: [
        {
          title: "Do not put secrets in a profile file",
          body:
            "`application-prod.yml` is in your repository, and a production database password in it is a credential in version control, readable by everyone with repo access and preserved forever in git history. Secrets come from the environment, or from a secret manager, at deploy time. A profile file should contain hostnames, pool sizes and feature flags — nothing you would mind seeing on a screen share.",
        },
      ],
    },
    {
      id: "precedence",
      heading: "Precedence: who beats whom",
      body: [
        "Boot merges around fifteen property sources in a fixed order. These are the ones that matter day to day, **strongest first**:",
        "**1.** Command-line arguments (`--catalog.page-size=99`). **2.** OS environment variables (`CATALOG_PAGE_SIZE=42`). **3.** JVM system properties (`-Dcatalog.page-size=…`). **4.** Profile-specific files, later profiles beating earlier. **5.** `application.yml`. **6.** Defaults in your code — a field initialiser, or `@Value`'s `:default`.",
        "The rule to remember is that **the more specific and the more external a source is, the more it wins**, which is exactly what you want: a container platform can override anything the jar shipped with, without rebuilding the jar.",
      ],
      examples: [
        {
          id: "precedence-run",
          title: "The whole chain, one property, five runs",
          lang: "bash",
          code: `# 1. application.yml alone
$ java -jar catalog.jar
   -> "pageSize":20

# 2. dev profile file beats the base file
$ java -jar catalog.jar --spring.profiles.active=dev
   -> "pageSize":5

# 3. a command-line argument beats the profile file
$ java -jar catalog.jar --spring.profiles.active=dev --catalog.page-size=99
   -> "pageSize":99

# 4. an environment variable beats the files
$ CATALOG_PAGE_SIZE=42 CATALOG_DISPLAY_NAME=FromEnv java -jar catalog.jar
   -> "pageSize":42, "displayName":"FromEnv"

# 5. and the command line beats the environment variable
$ CATALOG_PAGE_SIZE=42 java -jar catalog.jar --catalog.page-size=7
   -> "pageSize":7`,
          explanation:
            "Run 4 is worth a second look: nothing in any file is named `CATALOG_PAGE_SIZE`, and yet it bound to `catalog.page-size`. That is relaxed binding, next.",
        },
        {
          id: "where-from",
          title: "Finding out where a value actually came from",
          lang: "bash",
          code: `# Expose the env endpoint, then ask about one property.
# application.yml:
#   management.endpoints.web.exposure.include: env,configprops

$ curl -s "http://localhost:8080/actuator/env/catalog.page-size"
# -> every source that defines it, in order, with the winner first.

$ curl -s http://localhost:8080/actuator/configprops
# -> every @ConfigurationProperties bean and its bound values.`,
          explanation:
            "In a deployed application this is how you settle the question in seconds rather than reasoning about it. Both endpoints reveal configuration, so they must be secured — module 17 covers exposing actuator safely, and `env` masks values whose key looks like a secret.",
        },
      ],
    },
    {
      id: "relaxed",
      heading: "Relaxed binding",
      body: [
        "Boot matches property names loosely, so one canonical name can be written in whichever form a given source allows. `catalog.pageSize` in your Java class is reachable as all of these — but not as anything.",
      ],
      examples: [
        {
          id: "relaxed-proof",
          title: "What binds and what does not",
          lang: "bash",
          code: `# Target: private int pageSize;  under prefix "catalog". Default is 20.

$ java -jar catalog.jar --catalog.page-size=33     -> 33    # kebab-case: the canonical form
$ java -jar catalog.jar --catalog.page_size=33     -> 33    # underscores accepted
$ java -jar catalog.jar --catalog.PAGE-SIZE=55     -> 55    # case-insensitive
$ java -jar catalog.jar --catalog.pagesize=99      -> 99    # separators are optional

$ java -jar catalog.jar --catalog.pgsize=99        -> 20    # a real typo. Silently ignored.
$ java -jar catalog.jar --CATALOG_PAGESIZE=44      -> 20    # underscore form is for env vars only

$ CATALOG_PAGE_SIZE=42 java -jar catalog.jar       -> 42    # ...as an env var, it binds`,
          explanation:
            "The last two lines are the pair to remember. `CATALOG_PAGE_SIZE` binds when it is an **environment variable**, because environment variables cannot contain dots and Boot maps `_` to `.` for that source specifically. Passed as a command-line argument the same string binds to nothing. And a genuine misspelling produces no error at all — the property is simply never read.",
        },
      ],
      pitfalls: [
        {
          title: "A typo'd property is silent",
          body:
            "This is the most frustrating class of configuration bug: `server.prot=9000` starts happily on port 8080. Nothing validates that every property you set was consumed. Two defences: check `/actuator/configprops` to see what actually bound, and add `spring-boot-configuration-processor` to your build so your IDE autocompletes and flags unknown keys in `application.yml`.",
        },
      ],
    },
    {
      id: "validation",
      heading: "Failing fast on bad configuration",
      body: [
        "A wrong value should stop the application at startup, not surface as a strange bug an hour into production traffic. Type conversion gives you some of that for free.",
      ],
      examples: [
        {
          id: "bad-type",
          title: "A value of the wrong type",
          lang: "bash",
          code: `$ java -jar catalog.jar --catalog.page-size=lots

***************************
APPLICATION FAILED TO START
***************************

Description:

Failed to bind properties under 'catalog.page-size' to int:

    Property: catalog.page-size
    Value: "lots"
    Origin: "catalog.page-size" from property source "commandLineArgs"
    Reason: failed to convert java.lang.String to int
            (caused by java.lang.NumberFormatException: For input string: "lots")

Action:

Update your application's configuration`,
          explanation:
            "Note the **Origin** line. Boot tracked the value back to the source that supplied it — the command line here, but it would name the file and line number for a YAML file. That is the single most useful line when a value is wrong and you do not know which of six sources set it.",
        },
        {
          id: "validated",
          title: "Validating the values themselves",
          lang: "java",
          code: `@Validated                                        // turn on Bean Validation for this class
@ConfigurationProperties(prefix = "catalog")
public class CatalogProperties {

    @NotBlank
    private String displayName;

    @Min(1) @Max(100)
    private int pageSize = 20;

    @NotNull
    private Duration timeout = Duration.ofSeconds(5);   // "5s", "200ms", "PT1M" all bind
}`,
          explanation:
            "With `@Validated` and the validation starter, a `page-size` of `500` fails at startup with the constraint that was violated. This is worth doing for anything with a sensible range — pool sizes, timeouts, retry counts — because the alternative is discovering the bad value under load. Note `Duration`: Boot converts `5s`, `200ms` and ISO-8601 forms natively, and `DataSize` does the same for `10MB`.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the property precedence order in Spring Boot?",
      answer:
        "Strongest first: command-line arguments, then OS environment variables, then JVM system properties, then profile-specific configuration files (later-listed profiles beating earlier ones), then the base `application.yml`/`.properties`, then defaults declared in code. There are more sources in the full list — test properties, `@PropertySource`, the random property source — but the principle is that the more external and more specific a source, the higher it wins, so a deployment platform can override anything baked into the artifact without rebuilding it.",
    },
    {
      question: "How do profiles interact with the base configuration file?",
      answer:
        "They merge, they do not replace. `application.yml` is always loaded, and `application-{profile}.yml` is layered on top for each active profile, overriding only the keys it mentions. So the base file should hold everything, and a profile file only the differences. Profiles also gate beans through `@Profile`, and can be activated by `spring.profiles.active` as a command-line argument, an environment variable or a system property. Multiple profiles apply left to right, with the rightmost winning conflicts.",
    },
    {
      question: "What is relaxed binding, and what form must an environment variable take?",
      answer:
        "Relaxed binding lets one canonical property name be written in several forms: `catalog.page-size`, `catalog.pageSize`, `catalog.page_size`, `catalog.PAGESIZE` all bind to the same target, because the binder normalises case and separators. For environment variables the rule is stricter and specific to that source: uppercase the name and replace every dot and dash with an underscore, so `catalog.page-size` becomes `CATALOG_PAGE_SIZE`. That form works only as an environment variable — passed as a command-line argument it binds to nothing.",
    },
    {
      question: "@Value or @ConfigurationProperties — when do you use which?",
      answer:
        "`@Value` for a one-off value, especially with an inline default. `@ConfigurationProperties` for anything that is a group of related settings, which in practice is most things. The typed object gives type conversion and startup-time failure on bad values, `@Validated` support for range and format constraints, one obvious place to see every setting a feature has, IDE autocompletion via the configuration processor, and visibility through the `configprops` actuator endpoint. `@Value` also requires SpEL-style string keys scattered across classes, which no tool can check.",
    },
  ],
  takeaways: [
    "Externalised configuration is what lets one artifact run unchanged in every environment.",
    "Profile files are merged over the base file — put everything in the base and override only differences.",
    "Precedence, strongest first: command line, environment variables, system properties, profile files, base file, code defaults.",
    "Relaxed binding accepts many spellings; environment variables specifically use `UPPER_SNAKE_CASE`.",
    "A misspelled property is silently ignored — check `/actuator/configprops` and use the configuration processor.",
    "Prefer `@ConfigurationProperties` over scattered `@Value`s; add `@Validated` for values with a sensible range.",
    "The **Origin** line in a binding failure tells you which source supplied the bad value.",
    "Secrets never belong in a profile file that is committed to the repository.",
  ],
  status: "available",
};
