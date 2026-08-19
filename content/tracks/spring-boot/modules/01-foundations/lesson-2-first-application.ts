import type { Lesson } from "@/content/types";

export const firstApplicationLesson: Lesson = {
  id: "spring-first-application",
  slug: "your-first-application",
  moduleSlug: "foundations",
  title: "Your First Application: Initializr to a Running Server",
  summary:
    "Generate a project, build it, run it, and read every line the startup log prints — including the two that tell you the server is listening and the one that reveals the servlet has not been created yet.",
  estimatedMinutes: 30,
  objectives: [
    "Generate a project from Spring Initializr, in the browser and from the terminal",
    "Explain what the Maven wrapper is and why the project ships one",
    "Run the application three different ways and know when to use each",
    "Read the startup log line by line",
    "Recognise and fix the first error nearly everyone hits",
  ],
  sections: [
    {
      id: "prerequisites",
      heading: "What you need installed",
      body: [
        "Exactly one thing: a **JDK**. Not Maven, not Gradle, not a server — the project brings its own build tool, and the server is a library inside your application.",
        "Spring Boot 4.1 requires **Java 17 as a minimum**. This track uses **Java 25**, the current long-term-support release, because virtual threads and the newer language features matter later.",
      ],
      examples: [
        {
          id: "jdk-check",
          title: "Confirming your JDK",
          lang: "bash",
          code: `$ java --version
openjdk 25.0.3 2026-04-21

# If that fails, install one. Any of these work:
#   Linux (Debian/Ubuntu):  sudo apt install openjdk-25-jdk
#   macOS (Homebrew):       brew install openjdk@25
#   Any platform:           https://adoptium.net  (Eclipse Temurin)
#
# SDKMAN is worth it once you juggle versions:
$ sdk install java 25-tem`,
          explanation:
            "You need a **JDK**, not a JRE — the JDK contains the compiler. `java --version` printing a version proves a runtime exists; `javac --version` proves you can build.",
        },
      ],
    },
    {
      id: "initializr",
      heading: "Generating the project",
      body: [
        "**Spring Initializr** at `start.spring.io` generates a project skeleton. Every Spring developer starts here; the IDE plugins for IntelliJ and VS Code are the same service behind a different front end.",
        "You make five decisions. **Project**: Maven or Gradle — this track uses Maven, because its XML is declarative and easier to read when you are learning what a build even contains. **Language**: Java. **Spring Boot version**: take the default stable release, not a snapshot. **Project metadata**: group (your organisation, reversed-domain style), artifact (the project name). **Dependencies**: the starters you want.",
        "The site is a normal HTTP API, so you can skip the browser entirely — which is also the honest way to show exactly what was chosen.",
      ],
      examples: [
        {
          id: "initializr-curl",
          title: "Generating from the terminal",
          lang: "bash",
          code: `$ curl -o catalog.zip "https://start.spring.io/starter.zip?type=maven-project&language=java&bootVersion=4.1.0&javaVersion=25&groupId=com.example&artifactId=catalog&name=catalog&packageName=com.example.catalog&dependencies=web,actuator,devtools"

$ unzip -q catalog.zip -d catalog && cd catalog
$ find . -type f -not -path './.mvn/*' -not -name '*.cmd' | sort
./.gitattributes
./.gitignore
./HELP.md
./mvnw
./pom.xml
./src/main/java/com/example/catalog/CatalogApplication.java
./src/main/resources/application.properties
./src/test/java/com/example/catalog/CatalogApplicationTests.java`,
          explanation:
            "Eight files. That is a complete, runnable web application — which is worth sitting with for a moment, because the equivalent before Boot was a directory of XML and a server to deploy into. Note the dependency ids: `web` is the id Initializr uses, and it resolves to the `spring-boot-starter-webmvc` artifact in Boot 4.",
        },
      ],
      pitfalls: [
        {
          title: "Choose starters now, but you are not locked in",
          body:
            "Adding a dependency later is a few lines of XML — there is nothing special about the ones Initializr put in. The one thing worth getting right at generation time is the **package name**, because component scanning starts from the package containing your main class. Moving it later means moving every class. Lesson 3 explains why.",
        },
      ],
    },
    {
      id: "wrapper",
      heading: "The Maven wrapper",
      body: [
        "`mvnw` (and `mvnw.cmd` on Windows) is the **Maven wrapper**: a small script that downloads the exact Maven version the project expects, then runs it. The version is pinned in `.mvn/wrapper/maven-wrapper.properties`.",
        "This is why you did not have to install Maven. It also means every developer and every CI machine builds with the same Maven, which removes an entire category of \"works on my machine\". **Always use `./mvnw`, not `mvn`**, even if you have Maven installed.",
      ],
    },
    {
      id: "running",
      heading: "Three ways to run it",
      examples: [
        {
          id: "run-ways",
          title: "Pick one",
          lang: "bash",
          code: `# 1. The development loop. Compiles and runs in one step.
$ ./mvnw spring-boot:run

# 2. Build a jar, then run it as it will run in production.
$ ./mvnw package
$ java -jar target/catalog-0.0.1-SNAPSHOT.jar

# 3. From your IDE: run CatalogApplication.main() directly.
#    Best debugger experience -- breakpoints just work.`,
          explanation:
            "Use the IDE while writing code, `spring-boot:run` from a terminal, and `java -jar` when you want to be certain the packaged artifact behaves. They are the same application; only the launcher differs.",
        },
      ],
    },
    {
      id: "startup-log",
      heading: "Reading the startup log",
      body: [
        "Run it. After the ASCII banner and a version line, you get roughly a dozen lines — and every one of them is telling you something.",
      ],
      examples: [
        {
          id: "startup",
          title: "A real startup, annotated below",
          lang: "bash",
          code: `$ ./mvnw spring-boot:run

 :: Spring Boot ::                (v4.1.0)

INFO 23006 --- [catalog] [  restartedMain] com.example.catalog.CatalogApplication   : Starting CatalogApplication using Java 25.0.3 with PID 23006 (/tmp/spring/catalog/target/classes started by toothless in /tmp/spring/catalog)
INFO 23006 --- [catalog] [  restartedMain] com.example.catalog.CatalogApplication   : No active profile set, falling back to 1 default profile: "default"
INFO 23006 --- [catalog] [  restartedMain] .e.DevToolsPropertyDefaultsPostProcessor : Devtools property defaults active! Set 'spring.devtools.add-properties' to 'false' to disable
INFO 23006 --- [catalog] [  restartedMain] o.s.boot.tomcat.TomcatWebServer          : Tomcat initialized with port 8080 (http)
INFO 23006 --- [catalog] [  restartedMain] o.apache.catalina.core.StandardEngine    : Starting Servlet engine: [Apache Tomcat/11.0.22]
INFO 23006 --- [catalog] [  restartedMain] b.w.c.s.WebApplicationContextInitializer : Root WebApplicationContext: initialization completed in 1935 ms
INFO 23006 --- [catalog] [  restartedMain] o.s.b.a.e.web.EndpointLinksResolver      : Exposing 1 endpoint beneath base path '/actuator'
INFO 23006 --- [catalog] [  restartedMain] o.s.boot.tomcat.TomcatWebServer          : Tomcat started on port 8080 (http) with context path '/'
INFO 23006 --- [catalog] [  restartedMain] com.example.catalog.CatalogApplication   : Started CatalogApplication in 3.789 seconds (process running for 4.645)`,
          explanation:
            "Read it as a sequence. Spring records the JDK and PID, notes that no profile was selected, applies DevTools' development defaults, creates a Tomcat on port 8080, builds the application context, registers the Actuator endpoints, starts accepting connections, and reports total time. The two lines that matter operationally are the last two: **`Tomcat started`** means the port is open, and **`Started CatalogApplication`** means the context is fully built.",
        },
      ],
      pitfalls: [
        {
          title: "The thread is called `restartedMain`, not `main`",
          body:
            "That is DevTools. It loads your classes in a throw-away class loader so it can restart them when they change, and the restart runs on its own thread. If you remove the `devtools` dependency the thread becomes `main` again. It is a useful tell: seeing `restartedMain` in a production log means you shipped DevTools by accident.",
        },
        {
          title: "\"Started\" in 3.789 seconds is not the whole story",
          body:
            "Spring MVC's `DispatcherServlet` is initialised lazily, on the *first request*, not at startup. You can watch it happen — the log emits `Initializing Servlet 'dispatcherServlet'` when the first request arrives, which is why the first call to a fresh application is measurably slower than the second. Lesson 5 revisits this.",
        },
      ],
    },
    {
      id: "verify",
      heading: "Confirming it works",
      body: [
        "There are no endpoints yet — you have not written one. But the `actuator` starter contributes some, so there is something to call.",
      ],
      examples: [
        {
          id: "actuator-check",
          title: "Proof of life",
          lang: "bash",
          code: `$ curl -s http://localhost:8080/actuator/health
{"groups":["liveness","readiness"],"status":"UP"}

$ curl -s http://localhost:8080/actuator
{"_links":{"self":{"href":"http://localhost:8080/actuator","templated":false},
           "health":{"href":"http://localhost:8080/actuator/health","templated":false},
           "health-path":{"href":"http://localhost:8080/actuator/health/{*path}","templated":true}}}`,
          explanation:
            "`status: UP` is the application telling you it is healthy. Notice how little is exposed: of Actuator's many endpoints, **only `health` is available over HTTP by default**, because the others reveal configuration, beans and environment variables. That default is deliberate, and module 17 covers opening it up safely.",
        },
      ],
    },
    {
      id: "first-error",
      heading: "The first error you will hit",
      body: [
        "Start the application twice without stopping the first one — something everyone does within their first hour, usually by leaving it running in a forgotten terminal tab.",
      ],
      examples: [
        {
          id: "port-in-use",
          title: "Port already in use",
          lang: "bash",
          code: `***************************
APPLICATION FAILED TO START
***************************

Description:

Web server failed to start. Port 8080 was already in use.

Action:

Identify and stop the process that's listening on port 8080 or configure this application to listen on another port.`,
          explanation:
            "This is a **failure analyzer** — a Boot feature that catches known startup exceptions and rewrites them as a description and an action, instead of a hundred-line stack trace. Whenever you see this banner, read the *Action* line first; it is usually the fix.",
        },
        {
          id: "port-fix",
          title: "Two fixes",
          lang: "bash",
          code: `# Find and stop the process holding the port
$ ss -lptn 'sport = :8080'
$ kill <pid>

# Or just run on a different port
$ ./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"

# Port 0 asks the OS for any free port -- useful in tests
$ java -jar target/catalog-0.0.1-SNAPSHOT.jar --server.port=0`,
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the Maven wrapper and why do projects include it?",
      answer:
        "It is a checked-in script (`mvnw`) that downloads and runs a pinned Maven version, recorded in `.mvn/wrapper/maven-wrapper.properties`. It means a fresh clone builds with no prior Maven installation, and that every developer and CI runner uses an identical build tool version, which eliminates a class of environment-specific build failures. Gradle has the equivalent in `gradlew`.",
    },
    {
      question: "What does an embedded server change compared with deploying a WAR?",
      answer:
        "The server becomes a library your application depends on rather than an environment it is deployed into. The application is an ordinary process started with `java -jar`, so its server version is pinned in the build alongside everything else and cannot drift with the host. It makes the artifact self-contained, which is what makes it fit containers, process supervisors and platform-as-a-service runtimes. The cost is that each application carries its own server instance rather than several sharing one.",
    },
    {
      question: "Why is the first HTTP request to a freshly started Spring MVC application slower?",
      answer:
        "`DispatcherServlet` is initialised lazily on the first request rather than at startup, so that request pays for servlet initialisation as well as any first-call JIT and class loading. You can see it in the log as `Initializing Servlet 'dispatcherServlet'` appearing after `Started ...`. Setting `spring.mvc.servlet.load-on-startup=1` moves that cost into startup, which is usually what you want behind a load balancer that starts routing as soon as the port opens.",
    },
  ],
  takeaways: [
    "A JDK is the only prerequisite — the build tool and the web server both come with the project.",
    "Spring Initializr is an HTTP API, so project generation can be scripted rather than clicked.",
    "Always use `./mvnw`, so everyone builds with the same pinned Maven.",
    "`Tomcat started` means the port is open; `Started <App>` means the context is built. Those are the two lines that matter.",
    "Only Actuator's `health` endpoint is exposed over HTTP by default.",
    "`APPLICATION FAILED TO START` comes from a failure analyzer — read the *Action* line first.",
  ],
  status: "available",
};
