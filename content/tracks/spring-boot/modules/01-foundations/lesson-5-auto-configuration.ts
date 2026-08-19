import type { Lesson } from "@/content/types";

export const autoConfigurationLesson: Lesson = {
  id: "spring-auto-configuration",
  slug: "auto-configuration",
  moduleSlug: "foundations",
  title: "Auto-Configuration: Where the Beans You Never Wrote Come From",
  summary:
    "Boot's most useful feature is also the one that makes it feel like magic. It is not magic — it is a list of classes, each guarded by conditions, and the framework will print every decision it made if you ask it to.",
  estimatedMinutes: 35,
  objectives: [
    "Explain the mechanism: how Boot finds and applies auto-configuration classes",
    "Read the @Conditional annotations that guard each one",
    "Print and interpret the conditions evaluation report",
    "Override an auto-configured bean by defining your own",
    "Exclude an auto-configuration you do not want",
  ],
  sections: [
    {
      id: "mechanism",
      heading: "The mechanism, in one page",
      body: [
        "`@EnableAutoConfiguration` — inside `@SpringBootApplication` — does the following at startup.",
        "**1.** It reads every `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` file on the classpath. Each is a plain list of class names, one per line. **2.** It evaluates the conditions on each of those classes. **3.** The ones whose conditions pass are processed as `@Configuration` classes, contributing their `@Bean` methods to your context. The rest are skipped.",
        "That is the entire feature. No classpath scanning of arbitrary packages, no bytecode inspection of your code — a file, a list, and a set of `if` statements.",
      ],
      examples: [
        {
          id: "imports-file",
          title: "The registration file, from inside a real jar",
          lang: "bash",
          code: `$ unzip -p spring-boot-webmvc-4.1.0.jar \\
      META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports

org.springframework.boot.webmvc.autoconfigure.DispatcherServletAutoConfiguration
org.springframework.boot.webmvc.autoconfigure.WebMvcAutoConfiguration
org.springframework.boot.webmvc.autoconfigure.WebMvcObservationAutoConfiguration
org.springframework.boot.webmvc.autoconfigure.error.ErrorMvcAutoConfiguration
...`,
          explanation:
            "On the catalog project's classpath, **ten** jars carry one of these files, listing **91** auto-configuration classes between them. That is the candidate set. Adding a starter adds jars, which adds candidates — which is the precise sense in which auto-configuration \"reacts to the classpath\".",
        },
      ],
      pitfalls: [
        {
          title: "spring.factories is the old location",
          body:
            "Before Boot 2.7 the list lived under a key in `META-INF/spring.factories`. It moved to the dedicated `.imports` file, and support for the old location was removed in Boot 3. If you follow an older blog post about writing your own auto-configuration, this is the part that will silently do nothing.",
        },
      ],
    },
    {
      id: "conditions",
      heading: "The conditions",
      body: [
        "An auto-configuration class is an ordinary `@Configuration` class with `@Conditional` annotations on it. Those annotations are the whole intelligence of the system, and there are only a handful worth memorising.",
      ],
      examples: [
        {
          id: "condition-list",
          title: "The conditions you will meet",
          lang: "java",
          code: `@ConditionalOnClass(DataSource.class)          // that class is on the classpath
@ConditionalOnMissingClass("com.foo.Bar")     // it is not

@ConditionalOnBean(DataSource.class)          // such a bean already exists
@ConditionalOnMissingBean                     // it does not -- "back off if the user defined one"

@ConditionalOnProperty(name = "catalog.cache.enabled", havingValue = "true")
@ConditionalOnBooleanProperty("spring.aop.auto")

@ConditionalOnWebApplication(type = SERVLET)  // this is a servlet web app
@ConditionalOnResource(resources = "classpath:banner.txt")`,
          explanation:
            "**`@ConditionalOnMissingBean` is the important one.** It is how every default in Boot is polite: the auto-configuration defines a bean *only if you have not*. That single convention is why overriding anything in Boot means \"just declare your own\" rather than \"find the setting that turns theirs off\".",
        },
        {
          id: "real-autoconfig",
          title: "What one actually looks like",
          lang: "java",
          code: `// Simplified from Boot's own ErrorMvcAutoConfiguration.
@AutoConfiguration
@ConditionalOnWebApplication(type = Type.SERVLET)
@ConditionalOnClass({ Servlet.class, DispatcherServlet.class })
public class ErrorMvcAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(value = ErrorAttributes.class, search = SearchStrategy.CURRENT)
    public DefaultErrorAttributes errorAttributes() {
        return new DefaultErrorAttributes();
    }

    @Bean
    @ConditionalOnMissingBean(value = ErrorController.class, search = SearchStrategy.CURRENT)
    public BasicErrorController basicErrorController(ErrorAttributes errorAttributes, ...) {
        return new BasicErrorController(errorAttributes, ...);
    }
}`,
          explanation:
            "There is nothing here you could not have written. Read a few of these — your IDE will open them, they ship with source — and auto-configuration stops being a black box. This one is the reason a 404 on a Spring Boot API returns a tidy JSON error object instead of a Tomcat HTML page.",
        },
      ],
    },
    {
      id: "report",
      heading: "The conditions evaluation report",
      body: [
        "You never have to guess what auto-configuration did. Start with `--debug` and Boot prints every decision, with the reason.",
      ],
      examples: [
        {
          id: "report-run",
          title: "Asking for the report",
          lang: "bash",
          code: `$ java -jar target/catalog-0.0.1-SNAPSHOT.jar --debug

# ... or, permanently, in application.yml:
#   debug: true
#
# ... or, without the rest of the DEBUG logging noise, expose the actuator endpoint:
#   management.endpoints.web.exposure.include=conditions
#   then GET /actuator/conditions`,
          explanation:
            "`--debug` is not the same as setting the root log level to DEBUG. It switches on debug logging for Boot's own machinery and prints this report. The actuator `conditions` endpoint gives the same information as JSON from a running application, which is the one to use in a deployed environment.",
        },
        {
          id: "report-shape",
          title: "The four sections it prints",
          lang: "bash",
          code: `============================
CONDITIONS EVALUATION REPORT
============================

Positive matches:            # 125 entries -- what was applied, and why
-----------------

   ErrorMvcAutoConfiguration matched:
      - @ConditionalOnClass found required classes 'jakarta.servlet.Servlet',
        'org.springframework.web.servlet.DispatcherServlet' (OnClassCondition)
      - found 'session' scope (OnWebApplicationCondition)

   ErrorMvcAutoConfiguration#errorAttributes matched:
      - @ConditionalOnMissingBean (types: org.springframework.boot.webmvc.error.ErrorAttributes;
        SearchStrategy: current) did not find any beans (OnBeanCondition)

Negative matches:            # 93 entries -- what was skipped, and why
-----------------

   AopAutoConfiguration.AspectJAutoProxyingConfiguration:
      Did not match:
         - @ConditionalOnClass did not find required class
           'org.aspectj.weaver.Advice' (OnClassCondition)

   AuditAutoConfiguration:
      Did not match:
         - @ConditionalOnBean (types: ...AuditEventRepository; SearchStrategy: all)
           did not find any beans of type ...AuditEventRepository (OnBeanCondition)

Exclusions:                  # what you explicitly turned off
-----------
    None

Unconditional classes:       # applied always, no conditions
----------------------
    org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration
    org.springframework.boot.autoconfigure.ssl.SslAutoConfiguration`,
          explanation:
            "**Negative matches is the section you will use.** When a feature you expected is not there, the report tells you exactly which condition failed — nearly always a missing class (you forgot a dependency) or a missing property (you forgot to enable it). It converts \"why isn't this working\" into a one-line answer.",
        },
      ],
    },
    {
      id: "overriding",
      heading: "Overriding a default",
      body: [
        "Because the defaults are guarded by `@ConditionalOnMissingBean`, overriding one means declaring your own bean of that type. Nothing else. Here is the proof, end to end.",
      ],
      examples: [
        {
          id: "before",
          title: "Before: the auto-configured error body",
          lang: "bash",
          code: `$ curl -s http://localhost:8080/nope
{"timestamp":"2026-08-12T14:04:16.437Z","status":404,"error":"Not Found","path":"/nope"}`,
        },
        {
          id: "own-bean",
          title: "Declare your own",
          lang: "java",
          code: `package com.example.catalog;

import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.webmvc.error.DefaultErrorAttributes;
import org.springframework.boot.webmvc.error.ErrorAttributes;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.WebRequest;

@Configuration
public class ErrorConfig {

    @Bean
    public ErrorAttributes errorAttributes() {
        return new DefaultErrorAttributes() {
            @Override
            public Map<String, Object> getErrorAttributes(WebRequest request,
                                                          ErrorAttributeOptions options) {
                Map<String, Object> attributes = super.getErrorAttributes(request, options);
                attributes.put("hint", "this bean replaced the auto-configured one");
                return attributes;
            }
        };
    }
}`,
        },
        {
          id: "after",
          title: "After: yours wins, and the report says so",
          lang: "bash",
          code: `$ curl -s http://localhost:8080/nope
{"timestamp":"2026-08-12T14:09:42.142Z","status":404,"error":"Not Found","path":"/nope",
 "hint":"this bean replaced the auto-configured one"}

# The same entry has moved from Positive matches to Negative matches:

Negative matches:
   ErrorMvcAutoConfiguration#errorAttributes:
      Did not match:
         - @ConditionalOnMissingBean (types: org.springframework.boot.webmvc.error.ErrorAttributes;
           SearchStrategy: current) found beans of type
           '...ErrorAttributes' errorAttributes (OnBeanCondition)`,
          explanation:
            "Read that negative match closely — it is the whole model in one line. Boot did not lose a fight with your bean; it *declined to define one*, because it found yours. Auto-configuration is always evaluated **after** your own configuration, precisely so this ordering works.",
        },
      ],
      pitfalls: [
        {
          title: "Most of the time you want a property, not a bean",
          body:
            "Replacing a bean is the heavy hammer. Boot exposes hundreds of properties — `server.port`, `spring.jackson.serialization.indent-output`, `spring.datasource.hikari.maximum-pool-size` — and every one of them is read by an auto-configuration that then builds the bean for you. Check the property first: it survives upgrades, where a hand-built bean can silently miss new defaults.",
        },
      ],
    },
    {
      id: "excluding",
      heading: "Excluding an auto-configuration",
      body: [
        "Occasionally you want a default gone entirely rather than replaced.",
      ],
      examples: [
        {
          id: "exclude",
          title: "Three ways, same effect",
          lang: "java",
          code: `// 1. On the main class.
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class CatalogApplication { ... }`,
        },
        {
          id: "exclude-props",
          title: "Or from configuration",
          lang: "yaml",
          code: `# 2. In application.yml -- fully qualified names.
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration

# 3. Or as a command-line argument, for a one-off:
#    java -jar app.jar --spring.autoconfigure.exclude=...DataSourceAutoConfiguration`,
          explanation:
            "Excluded classes are listed in the report's **Exclusions** section, so you always have a record. Exclusion is a blunt instrument — you are removing every bean that class would have defined, including ones you may still want — so reach for it when a starter arrived transitively and is configuring something you have no use for.",
        },
      ],
      pitfalls: [
        {
          title: "The classic: a JPA starter with nowhere to connect",
          body:
            "Add `spring-boot-starter-data-jpa` without a database and startup fails with *\"Failed to configure a DataSource: 'url' attribute is not specified and no embedded datasource could be configured\"*. Excluding `DataSourceAutoConfiguration` silences it, and is almost always the wrong fix — you added a persistence starter, so configure a database or put H2 on the classpath. Exclusion is right only when you genuinely will not be using the feature.",
        },
      ],
    },
    {
      id: "your-own",
      heading: "Writing your own",
      body: [
        "The mechanism is open. Any library — including your company's shared internal one — can ship auto-configuration, and this is how a shared starter avoids making every team copy the same `@Bean` methods.",
      ],
      examples: [
        {
          id: "own-autoconfig",
          title: "A minimal auto-configuration",
          lang: "java",
          code: `// src/main/java/com/acme/audit/AuditAutoConfiguration.java
@AutoConfiguration
@ConditionalOnClass(AuditClient.class)
@ConditionalOnProperty(prefix = "acme.audit", name = "enabled", havingValue = "true",
                       matchIfMissing = true)
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public AuditClient auditClient(AuditProperties properties) {
        return new AuditClient(properties.getEndpoint(), properties.getTimeout());
    }
}`,
        },
        {
          id: "own-registration",
          title: "And the one line that registers it",
          lang: "properties",
          code: `# src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports

com.acme.audit.AuditAutoConfiguration`,
          explanation:
            "That is a complete starter. Any application that adds this jar gets a configured `AuditClient`, can disable it with `acme.audit.enabled=false`, can tune it with `acme.audit.*` properties, and can replace it entirely by declaring its own `AuditClient` bean — because of the `@ConditionalOnMissingBean`. Follow that convention and your library behaves the way Spring users expect.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does Spring Boot's auto-configuration actually work?",
      answer:
        "`@EnableAutoConfiguration` reads every `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` file on the classpath — each a plain list of class names — and evaluates the `@Conditional` annotations on each listed class. Those whose conditions pass are processed as `@Configuration` classes and contribute their `@Bean` methods. The conditions test the classpath (`@ConditionalOnClass`), the beans already defined (`@ConditionalOnBean` / `@ConditionalOnMissingBean`), properties, and the application type. Auto-configuration is applied after user configuration, so `@ConditionalOnMissingBean` reliably sees your beans and backs off.",
    },
    {
      question: "How do you override a bean that Boot auto-configured?",
      answer:
        "Define your own bean of that type — the auto-configured one is guarded by `@ConditionalOnMissingBean`, so it is simply not created. You can confirm it in the conditions evaluation report, where the entry moves from positive to negative matches with the reason `found beans of type '…'`. Before doing that, check whether a configuration property already covers what you need; properties are read by the auto-configuration itself and survive framework upgrades, whereas a hand-built replacement bean can miss defaults that a later version adds.",
    },
    {
      question: "An auto-configuration you expected did not apply. How do you find out why?",
      answer:
        "Run with `--debug`, or expose the `conditions` actuator endpoint in a deployed application, and read the negative matches section of the conditions evaluation report. It names each skipped class with the exact condition that failed. In practice it is nearly always `@ConditionalOnClass did not find required class …` (a missing dependency), `@ConditionalOnBean did not find any beans …` (something upstream did not get created), or a property condition (the feature needs enabling). The report turns the question into a lookup.",
    },
    {
      question: "What is the difference between @Configuration and @AutoConfiguration?",
      answer:
        "`@Configuration` is a source of bean definitions in your own application, discovered by component scanning. `@AutoConfiguration` is meta-annotated with `@Configuration(proxyBeanMethods = false)` and is discovered from the `.imports` file rather than by scanning — it is intended for libraries, is always processed after user configuration, and supports ordering hints (`before`, `after`) relative to other auto-configurations. You write `@Configuration` in an application and `@AutoConfiguration` in a starter.",
    },
  ],
  takeaways: [
    "Auto-configuration is a list of classes in `.imports` files, each guarded by `@Conditional` annotations. That is all.",
    "`@ConditionalOnMissingBean` is the convention that makes every Boot default overridable by simply declaring your own bean.",
    "Auto-configuration runs after your configuration, which is what makes that ordering work.",
    "`--debug` prints the conditions evaluation report; the negative matches section answers \"why isn't this on?\".",
    "The `conditions` actuator endpoint gives the same report as JSON from a running application.",
    "Prefer a configuration property to a replacement bean — properties survive upgrades.",
    "Exclusion (`spring.autoconfigure.exclude`) removes a default entirely; it is rarely the right fix for a startup error.",
  ],
  status: "available",
};
