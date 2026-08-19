import type { Lesson } from "@/content/types";

export const projectAnatomyLesson: Lesson = {
  id: "spring-project-anatomy",
  slug: "project-anatomy",
  moduleSlug: "foundations",
  title: "Anatomy of a Spring Boot Project",
  summary:
    "Eight files, and every one of them earns its place. What the pom declares, why the package your main class lives in silently decides which of your classes Spring can see, and what is actually inside the jar you deploy.",
  estimatedMinutes: 30,
  objectives: [
    "Read a Boot pom.xml and say what each element does",
    "Explain what the parent POM manages so you never write a version number",
    "State the component scanning rule and predict which classes are found",
    "Describe what @SpringBootApplication expands to",
    "Open an executable jar and explain its layout",
  ],
  sections: [
    {
      id: "layout",
      heading: "The standard layout",
      body: [
        "Maven's directory convention is not a Spring idea, but Spring assumes it everywhere. Learn it once and every Java project you ever open is navigable.",
      ],
      examples: [
        {
          id: "tree",
          title: "Where things live",
          lang: "bash",
          code: `catalog/
├── pom.xml                              # the build: dependencies, plugins, Java version
├── mvnw, mvnw.cmd, .mvn/                # the Maven wrapper
└── src/
    ├── main/
    │   ├── java/                        # production code
    │   │   └── com/example/catalog/
    │   │       └── CatalogApplication.java
    │   └── resources/                   # non-code files, packaged into the jar
    │       ├── application.yml          # configuration
    │       ├── static/                  # served at / as-is (css, js, images)
    │       └── templates/               # server-rendered views, if you use them
    └── test/
        └── java/                        # tests. Mirrors main/java's packages.
            └── com/example/catalog/
                └── CatalogApplicationTests.java`,
          explanation:
            "The split that matters is `main` against `test`: everything under `src/test` is compiled with the test dependencies and is not packaged into the jar. `src/main/resources` is a **classpath root** — a file you put at `resources/application.yml` is loaded as `classpath:application.yml`, and it lands at the top level inside the jar, not in a `resources/` folder.",
        },
      ],
    },
    {
      id: "pom",
      heading: "The pom, element by element",
      body: [
        "`pom.xml` is the build. It is XML, which is unfashionable, but it is declarative — it states facts rather than running a script, and you can read it top to bottom without holding any state in your head.",
      ],
      examples: [
        {
          id: "pom",
          title: "A generated pom, trimmed to the parts that do work",
          lang: "xml",
          code: `<project xmlns="http://maven.apache.org/POM/4.0.0" ...>
    <modelVersion>4.0.0</modelVersion>

    <!-- 1. The parent. This is where the magic lives. -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.1.0</version>
        <relativePath/>
    </parent>

    <!-- 2. Your coordinates. groupId:artifactId:version identifies the artifact. -->
    <groupId>com.example</groupId>
    <artifactId>catalog</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>catalog</name>

    <properties>
        <java.version>25</java.version>
    </properties>

    <!-- 3. Dependencies. Note: no version numbers. -->
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <!-- 4. The plugin that turns a plain jar into an executable one. -->
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`,
          explanation:
            "Four things are happening. **The parent** supplies a dependency-management section listing tested versions for hundreds of libraries, plus sensible plugin configuration — that is why your dependencies have no `<version>`. **Your coordinates** name the artifact. **Dependencies** are declared by name only; `<scope>test</scope>` keeps a dependency out of the production jar, and DevTools is `runtime` and `optional` so it is present when you run locally but excluded from the repackaged jar. **The Boot plugin** repackages the jar so it can be run directly.",
        },
      ],
      pitfalls: [
        {
          title: "Never add a version to a Spring-managed dependency",
          body:
            "Writing `<version>` on a library the parent already manages overrides the tested version and is how you get a `NoSuchMethodError` at runtime — two libraries compiled against different versions of a third. If you genuinely must move one version, change the managed property (for example `<jackson.version>`) rather than pinning a single dependency. That keeps the whole set consistent.",
        },
        {
          title: "Gradle does the same job with different words",
          body:
            "If your team uses Gradle, `build.gradle` replaces the pom, `implementation` and `testImplementation` replace `<scope>`, and the `io.spring.dependency-management` plugin (or the Boot plugin's own platform support) replaces the parent POM. Every concept in this lesson transfers; only the syntax changes.",
        },
      ],
    },
    {
      id: "starters",
      heading: "What a starter really is",
      body: [
        "A starter contains **no code**. It is an empty jar whose entire content is a pom listing other dependencies. `spring-boot-starter-webmvc` is a promise: \"give me a working synchronous web stack\", and it resolves to Spring MVC, Spring Core, an embedded Tomcat, Jackson for JSON, and validation support, at versions tested together.",
        "This is worth internalising because it explains a lot of otherwise confusing behaviour. Auto-configuration reacts to **what is on the classpath**, and starters are how things get onto the classpath. Add a starter, and beans you never declared appear. Remove one, and they silently stop appearing.",
      ],
      examples: [
        {
          id: "starter-list",
          title: "The starters you will actually use",
          lang: "bash",
          code: `spring-boot-starter-webmvc        # synchronous web: MVC, Tomcat, Jackson  (was: -web)
spring-boot-starter-webflux       # reactive web: Netty, non-blocking
spring-boot-starter-data-jpa      # JPA, Hibernate, HikariCP, Spring Data
spring-boot-starter-data-jdbc     # lighter: JDBC, no Hibernate
spring-boot-starter-security      # Spring Security's filter chain
spring-boot-starter-validation    # Bean Validation (jakarta.validation)
spring-boot-starter-actuator      # health, metrics, operational endpoints
spring-boot-starter-graphql       # Spring for GraphQL
spring-boot-starter-websocket     # WebSocket and STOMP

# Test starters. In Boot 4 the single starter-test was split per module:
spring-boot-starter-webmvc-test
spring-boot-starter-data-jpa-test
spring-boot-starter-actuator-test`,
          explanation:
            "You add these by name, with no version. To see exactly what one drags in, run `./mvnw dependency:tree` — it prints the whole resolved graph, and it is the first thing to reach for when you want to know where a class on your classpath came from.",
        },
      ],
    },
    {
      id: "main-class",
      heading: "The main class, and the annotation on it",
      body: [
        "The generated main class is five lines, and both of them are load-bearing.",
      ],
      examples: [
        {
          id: "main",
          title: "CatalogApplication.java",
          lang: "java",
          code: `package com.example.catalog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CatalogApplication {

    public static void main(String[] args) {
        SpringApplication.run(CatalogApplication.class, args);
    }
}`,
          explanation:
            "`SpringApplication.run` builds the application context, runs it, and returns it — an ordinary `main`, which is why an IDE can debug it with no plugin. `@SpringBootApplication` is a **meta-annotation**: it is shorthand for three others.",
        },
        {
          id: "expanded",
          title: "The same thing, written out",
          lang: "java",
          code: `@SpringBootConfiguration   // this class is a source of bean definitions
@EnableAutoConfiguration   // turn on Boot's classpath-driven configuration
@ComponentScan             // find @Component and friends -- starting HERE
public class CatalogApplication { ... }`,
          explanation:
            "You will occasionally see the three written separately, usually because someone needed to configure one of them. `@ComponentScan` is the one with the surprising behaviour, and it is next.",
        },
      ],
    },
    {
      id: "scanning",
      heading: "Component scanning: the rule that bites",
      body: [
        "`@ComponentScan` with no arguments scans **the package containing the annotated class, and every package beneath it**. Nothing above it, and nothing beside it.",
        "That single rule explains a large share of \"why is my controller not working\" questions. Here is the same application with one controller inside the main class's package and one outside it — both correctly annotated, both compiled into the same jar.",
      ],
      examples: [
        {
          id: "scan-setup",
          title: "Two controllers, one boundary",
          lang: "java",
          code: `// src/main/java/com/example/catalog/GreetingController.java
package com.example.catalog;          // <-- inside the scan root

@RestController
public class GreetingController {
    @GetMapping("/greeting")
    public String greeting(@RequestParam(defaultValue = "world") String name) { ... }
}

// src/main/java/com/example/other/OutsideController.java
package com.example.other;            // <-- a sibling of the scan root

@RestController
public class OutsideController {
    @GetMapping("/outside")
    public String outside() {
        return "reached the controller outside the scan boundary";
    }
}`,
        },
        {
          id: "scan-proof",
          title: "What happens when you call both",
          lang: "bash",
          code: `$ curl -s http://localhost:8080/greeting?name=Prajwal
Hello, Prajwal!

$ curl -s http://localhost:8080/outside
{"timestamp":"2026-08-12T14:04:16.437Z","status":404,"error":"Not Found","path":"/outside"}`,
          explanation:
            "`OutsideController` compiled, shipped inside the jar, and is annotated correctly — and Spring never looked at it. `com.example.other` is not beneath `com.example.catalog`. There is no warning; the class is simply not a bean, so no mapping is registered and the request falls through to the 404 handler.",
        },
        {
          id: "scan-fix",
          title: "Two ways out",
          lang: "java",
          code: `// Preferred: put the main class in the root package, so everything is beneath it.
//   com.example            <- CatalogApplication here
//   com.example.catalog
//   com.example.other

// Or widen the scan explicitly:
@SpringBootApplication(scanBasePackages = "com.example")
public class CatalogApplication { ... }`,
          explanation:
            "With `scanBasePackages = \"com.example\"`, the same request returns `200` and `reached the controller outside the scan boundary`. The first option is better practice: a main class in the root package means the convention does the work and nobody has to remember the override. It is also why lesson 2 said the package name is the one Initializr field worth thinking about.",
        },
      ],
      pitfalls: [
        {
          title: "Widening the scan too far is a real cost",
          body:
            "`scanBasePackages = \"com\"` works, and will scan every class under `com` in every jar on your classpath — slowing startup and risking picking up beans from a library that did not intend to be scanned. Scan your own root package, not a prefix you share with the world.",
        },
      ],
    },
    {
      id: "jar",
      heading: "Inside the executable jar",
      body: [
        "`./mvnw package` produces two files. Look at their sizes and the story is immediate.",
      ],
      examples: [
        {
          id: "jar-sizes",
          title: "Two jars",
          lang: "bash",
          code: `$ ls -la target/*.jar*
21953846  target/catalog-0.0.1-SNAPSHOT.jar            # repackaged: 21.9 MB
    8907  target/catalog-0.0.1-SNAPSHOT.jar.original   # your code alone: 8.9 KB`,
          explanation:
            "Maven builds the ordinary jar — your compiled classes, and nothing else. Then the Boot plugin renames it to `.original` and writes a new jar containing your classes **and every dependency**. That is a *fat jar*, and 8.9 KB of your code needs 21.9 MB of libraries to run.",
        },
        {
          id: "jar-layout",
          title: "What is in there",
          lang: "bash",
          code: `$ unzip -l target/catalog-0.0.1-SNAPSHOT.jar
META-INF/MANIFEST.MF
BOOT-INF/classes/            # your compiled code and resources
BOOT-INF/lib/                # 43 dependency jars, nested whole
BOOT-INF/classpath.idx       # the order they go on the classpath
BOOT-INF/layers.idx          # grouping for Docker layer caching
org/springframework/boot/loader/...   # the launcher itself

$ unzip -p target/catalog-0.0.1-SNAPSHOT.jar META-INF/MANIFEST.MF
Main-Class: org.springframework.boot.loader.launch.JarLauncher
Start-Class: com.example.catalog.CatalogApplication
Spring-Boot-Version: 4.1.0
Spring-Boot-Classes: BOOT-INF/classes/
Spring-Boot-Lib: BOOT-INF/lib/`,
          explanation:
            "The manifest is the trick. `java -jar` runs whatever `Main-Class` names — and that is **not your class**, it is Boot's `JarLauncher`. The launcher installs a class loader that can read jars nested inside a jar (something the standard JVM cannot do), then calls the real entry point named by `Start-Class`. That indirection is the entire mechanism behind \"just run it with `java -jar`\".",
        },
        {
          id: "layers",
          title: "layers.idx, and why it exists",
          lang: "bash",
          code: `$ unzip -p target/catalog-0.0.1-SNAPSHOT.jar BOOT-INF/layers.idx
- "dependencies":
  - "BOOT-INF/lib/"
- "spring-boot-loader":
  - "org/"
- "snapshot-dependencies":
- "application":
  - "BOOT-INF/classes/"
  - "BOOT-INF/classpath.idx"
  - "BOOT-INF/layers.idx"
  - "META-INF/"`,
          explanation:
            "The order is deliberate: least likely to change first. Your dependencies change monthly; your code changes hourly. Unpacking the jar along these lines into separate Docker layers means a code-only deploy pushes a few kilobytes instead of 21 MB, because the dependency layer is unchanged and already cached. Module 18 builds the Dockerfile that uses this.",
        },
      ],
      pitfalls: [
        {
          title: "Fat jars and the `.original` file",
          body:
            "If another project depends on yours as a library, it must depend on the `.original` classifier or on a separately built plain jar — a fat jar is a runnable application, not something to put on someone else's classpath. In practice this means a shared library module should not have the Boot plugin's repackage goal enabled at all.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does the spring-boot-starter-parent give you?",
      answer:
        "Principally a `dependencyManagement` section that pins tested, mutually compatible versions for Spring's own modules and several hundred third-party libraries, so your `<dependency>` entries need no `<version>`. It also sets defaults you would otherwise configure by hand: the Java version property, UTF-8 source encoding, resource filtering for `application.yml`, and plugin configuration including the Boot repackage goal. If you cannot use it as a parent — because you already have a corporate parent POM — you import `spring-boot-dependencies` as a BOM in `dependencyManagement` and get the version management alone.",
    },
    {
      question: "Where does component scanning start, and what happens if a class is outside it?",
      answer:
        "At the package containing the class annotated with `@ComponentScan` — in practice the `@SpringBootApplication` main class — and it covers that package and all sub-packages. A correctly annotated class outside that subtree is simply not registered as a bean: no error, no warning. A controller in that position returns 404 for its mappings, and a service in that position surfaces later as an unsatisfied-dependency failure. The conventional fix is to put the main class in the project's root package; the explicit one is `@SpringBootApplication(scanBasePackages = \"...\")`.",
    },
    {
      question: "What does @SpringBootApplication expand to?",
      answer:
        "`@SpringBootConfiguration` (a specialised `@Configuration`, marking the class as a source of bean definitions and as the test-context anchor Boot searches for), `@EnableAutoConfiguration` (turns on classpath-driven auto-configuration), and `@ComponentScan` (scans from this package down). You would write them out separately when you need to customise one, most commonly to add `excludeFilters` to the scan or `exclude` to auto-configuration.",
    },
    {
      question: "How does an executable Spring Boot jar work, given the JVM cannot load nested jars?",
      answer:
        "The manifest's `Main-Class` is not your application; it is `org.springframework.boot.loader.launch.JarLauncher`, whose classes live unpacked at the root of the jar so the ordinary class loader can find them. It installs a custom class loader able to read the dependency jars stored whole under `BOOT-INF/lib/`, using `BOOT-INF/classpath.idx` for their order, then reflectively invokes the `main` method of the class named by the manifest's `Start-Class`. The dependencies are stored uncompressed and unexploded, which is what makes the jar reproducible and layerable.",
    },
  ],
  takeaways: [
    "The parent POM manages versions — never write `<version>` on a Spring-managed dependency.",
    "A starter is a pom with no code, whose job is to put a coherent set of libraries on the classpath.",
    "`@SpringBootApplication` = `@SpringBootConfiguration` + `@EnableAutoConfiguration` + `@ComponentScan`.",
    "Component scanning covers the main class's package and below. Anything outside is invisible, silently.",
    "Put the main class in your root package and the convention does the work for you.",
    "The executable jar's `Main-Class` is Boot's `JarLauncher`; your class is the `Start-Class` it calls.",
    "`layers.idx` orders the jar's contents by rate of change, so Docker layer caching works.",
  ],
  status: "available",
};
