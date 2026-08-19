import type { Lesson } from "@/content/types";

export const javaToEndpointLesson: Lesson = {
  id: "spring-java-to-endpoint",
  slug: "from-java-to-http",
  moduleSlug: "foundations",
  title: "From a Plain Java Class to an HTTP Endpoint",
  summary:
    "The central move in Spring, in three steps you can run one at a time: an ordinary class, the same class as a bean, and the same class reachable over HTTP. Nothing about the method changes — only who calls it.",
  estimatedMinutes: 35,
  objectives: [
    "Turn a plain class into a bean and explain exactly what changed",
    "Inject one bean into another with constructor injection",
    "Expose a method as an HTTP endpoint with @RestController",
    "Read a request's query parameters and path segments into method parameters",
    "Explain how a returned Java object becomes a JSON response body",
  ],
  sections: [
    {
      id: "stage-one",
      heading: "Stage 1: ordinary Java",
      body: [
        "Start with a class that has no idea Spring exists. It has one method, and that method is the only thing in this lesson that never changes.",
      ],
      examples: [
        {
          id: "plain",
          title: "No framework at all",
          lang: "java",
          code: `public class Greeter {

    public String greet(String name) {
        return "Hello, " + name + "!";
    }

    public static void main(String[] args) {
        Greeter greeter = new Greeter();
        System.out.println(greeter.greet("world"));
    }
}`,
          output: "Hello, world!",
          explanation:
            "You called `new`, you called the method, you printed the result. Hold onto this: by the end of the lesson a browser will call `greet` across a network, and the method body will be character-for-character identical.",
        },
      ],
    },
    {
      id: "stage-two",
      heading: "Stage 2: the same class, as a bean",
      body: [
        "Add one annotation, and stop calling `new`.",
      ],
      examples: [
        {
          id: "bean",
          title: "@Service, and a consumer",
          lang: "java",
          code: `package com.example.catalog;

import org.springframework.stereotype.Service;

@Service
public class Greeter {

    public String greet(String name) {
        return "Hello, " + name + "!";
    }
}

// A second bean that needs the first one.
package com.example.catalog;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class StartupPrinter implements CommandLineRunner {

    private final Greeter greeter;

    // One constructor, so Spring uses it. No @Autowired needed.
    public StartupPrinter(Greeter greeter) {
        this.greeter = greeter;
    }

    @Override
    public void run(String... args) {
        System.out.println("PROBE-STARTUP: " + greeter.greet("world"));
    }
}`,
          explanation:
            "`@Service` tells the component scan to register a `Greeter`. `StartupPrinter` declares that it needs one, and the container supplies it. `CommandLineRunner` is a Boot interface whose `run` is called once, after the context is built and just before the application is considered started — handy for exactly this kind of proof.",
        },
        {
          id: "bean-log",
          title: "Where that line appears in the startup log",
          lang: "bash",
          code: `INFO 14761 --- [catalog] [main] o.s.boot.tomcat.TomcatWebServer : Tomcat started on port 8080 (http) with context path '/'
INFO 14761 --- [catalog] [main] com.example.catalog.CatalogApplication : Started CatalogApplication in 7.392 seconds (process running for 8.726)
PROBE-STARTUP: Hello, world!`,
          explanation:
            "Same output as stage 1, produced by a method nobody in your code called. Three things happened for free: the container found `Greeter`, worked out that `StartupPrinter` needed one, and constructed them in the right order. **This is the whole of dependency injection.** Everything else in Spring is built on it.",
        },
      ],
      pitfalls: [
        {
          title: "@Service, @Component, @Repository — what is the difference?",
          body:
            "For the scan, none: `@Service` and `@Repository` are `@Component` with a different name. The difference is intent for a human reader, plus one real behaviour — `@Repository` enables translation of vendor-specific persistence exceptions into Spring's `DataAccessException` hierarchy. Use `@Service` for business logic, `@Repository` for data access, `@Component` when neither fits.",
        },
        {
          title: "Forgetting the annotation gives you a startup failure, not a null",
          body:
            "Delete `@Service` from `Greeter` and the application refuses to start with `Parameter 0 of constructor in ... StartupPrinter required a bean of type '...Greeter' that could not be found`. That is a good failure: loud, at startup, before any traffic. It is one of the strongest arguments for constructor injection, and lesson 7 reads the message in full.",
        },
      ],
    },
    {
      id: "stage-three",
      heading: "Stage 3: the same class, over HTTP",
      body: [
        "Replace the `CommandLineRunner` with a controller. Still no change to `Greeter`.",
      ],
      examples: [
        {
          id: "controller",
          title: "A REST controller",
          lang: "java",
          code: `package com.example.catalog;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GreetingController {

    private final Greeter greeter;

    public GreetingController(Greeter greeter) {
        this.greeter = greeter;
    }

    @GetMapping("/greeting")
    public String greeting(@RequestParam(defaultValue = "world") String name) {
        return greeter.greet(name);
    }

    @GetMapping("/greeting/json")
    public Greeting greetingJson(@RequestParam(defaultValue = "world") String name) {
        return new Greeting(name, greeter.greet(name));
    }

    public record Greeting(String name, String message) {}
}`,
          explanation:
            "`@RestController` does two jobs: it is a `@Component`, so the class becomes a bean, and it marks every method's return value as **the response body** rather than the name of a view to render. `@GetMapping(\"/greeting\")` registers the method for `GET /greeting`. `@RequestParam` binds the query string's `name` to the parameter, falling back to `world` when it is absent.",
        },
        {
          id: "calls",
          title: "Calling it",
          lang: "bash",
          code: `$ curl -i "http://localhost:8080/greeting?name=Prajwal"
HTTP/1.1 200
Content-Type: text/plain;charset=UTF-8
Content-Length: 15

Hello, Prajwal!

$ curl -i "http://localhost:8080/greeting/json?name=Prajwal"
HTTP/1.1 200
Content-Type: application/json
Content-Length: 46

{"name":"Prajwal","message":"Hello, Prajwal!"}`,
          explanation:
            "Look at the two `Content-Type` headers, because that difference is doing something you did not configure. Returning a `String` produces `text/plain`. Returning an **object** produces `application/json`, with the record's components serialised as fields — Jackson was on the classpath courtesy of the web starter, so Boot registered a message converter for it, and the converter matched the return type. You wrote no serialisation code and no `Content-Type`.",
        },
      ],
    },
    {
      id: "request-to-method",
      heading: "How a request finds your method",
      body: [
        "The full lifecycle is module 3's job, but you need the outline now or the annotations look arbitrary.",
        "**1.** Tomcat accepts the TCP connection and parses the HTTP request. **2.** It hands it to the one servlet Boot registered: Spring's `DispatcherServlet`. **3.** The dispatcher asks its handler mappings which method matches `GET /greeting` — the table built at startup from every `@GetMapping` it found. **4.** Argument resolvers fill in your parameters: `@RequestParam` from the query string, `@PathVariable` from the URL, `@RequestBody` by deserialising the body. **5.** Your method runs. **6.** A message converter turns the return value into bytes, choosing the format from the return type and the request's `Accept` header. **7.** The response goes back down the same path.",
        "Every annotation in the controller is a hook into one of those steps. That is all they are.",
      ],
      examples: [
        {
          id: "lazy-servlet",
          title: "Watch step 2 happen",
          lang: "bash",
          code: `# ... application already reported "Started CatalogApplication". Then the FIRST request arrives:

INFO 14761 --- [nio-8080-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/] : Initializing Spring DispatcherServlet 'dispatcherServlet'
INFO 14761 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet  : Initializing Servlet 'dispatcherServlet'
INFO 14761 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet  : Completed initialization in 3 ms`,
          explanation:
            "The servlet is created on the first request, not at startup — and notice the thread name has changed from `main` to `nio-8080-exec-1`, a worker from Tomcat's pool. **Your controller method runs on a Tomcat thread, not the startup thread.** That fact governs everything about concurrency in a Spring MVC application: your beans are shared singletons handling many requests at once, so a mutable field on a controller or service is a data race.",
        },
      ],
      pitfalls: [
        {
          title: "Beans are singletons; controller fields are shared",
          body:
            "There is one `GreetingController` instance serving every concurrent request. A `private String lastName;` on it would be written by every request simultaneously. Keep request state in local variables and method parameters — they live on the calling thread's stack — and keep bean fields for dependencies, injected once and never reassigned. `final` fields via constructor injection make this the default rather than a discipline.",
        },
      ],
    },
    {
      id: "input",
      heading: "Getting input in",
      body: [
        "Four annotations cover almost everything a request can carry.",
      ],
      examples: [
        {
          id: "inputs",
          title: "The four you need on day one",
          lang: "java",
          code: `@RestController
@RequestMapping("/api/books")          // a prefix for every method in the class
public class BookController {

    // GET /api/books/42
    @GetMapping("/{id}")
    public Book byId(@PathVariable Long id) { ... }

    // GET /api/books?author=Pratchett&page=2
    @GetMapping
    public List<Book> search(@RequestParam String author,
                             @RequestParam(defaultValue = "0") int page) { ... }

    // POST /api/books   with a JSON body
    @PostMapping
    public Book create(@RequestBody NewBook body) { ... }

    // Any header, by name
    @GetMapping("/whoami")
    public String whoami(@RequestHeader("X-Request-Id") String requestId) { ... }
}`,
          explanation:
            "`@PathVariable` takes a segment of the URL, matched by name against the `{id}` placeholder. `@RequestParam` takes a query-string value; without a `defaultValue` it is required, and a missing one is a 400. `@RequestBody` deserialises the request body onto your type — the inverse of what happened to the return value in stage 3. `@RequestHeader` takes a header. Types are converted for you: `Long id` from the string `\"42\"`, `int page` from `\"2\"`, and a bad value is a 400 rather than an exception in your method.",
        },
        {
          id: "mappings",
          title: "The mapping annotations",
          lang: "java",
          code: `@GetMapping     // read something. Safe and idempotent.
@PostMapping    // create something, or "do something with side effects".
@PutMapping     // replace something wholesale. Idempotent.
@PatchMapping   // partially update something.
@DeleteMapping  // remove something. Idempotent.

// All five are shorthand. This is the long form:
@RequestMapping(method = RequestMethod.GET, path = "/greeting")

// @RequestMapping on the class contributes a prefix; on a method it can also
// narrow by content type, which is how you serve two formats from one path:
@GetMapping(path = "/report", produces = "text/csv")
@GetMapping(path = "/report", produces = "application/json")`,
        },
      ],
      pitfalls: [
        {
          title: "@RequestParam's name comes from the parameter name",
          body:
            "`@RequestParam String author` only works because the compiler kept parameter names — Boot's parent POM passes `-parameters` to javac for you. In a hand-rolled build without that flag, parameter names are erased to `arg0` and binding fails at runtime with a message telling you to enable it. If you ever see *\"Ensure that your compiler is configured to use the '-parameters' flag\"*, that is what it means. Naming explicitly — `@RequestParam(\"author\")` — is immune either way.",
        },
      ],
    },
    {
      id: "output",
      heading: "Getting output back",
      body: [
        "Returning an object gives you a 200 and a JSON body. When you need to control the status code or the headers, return a `ResponseEntity` instead.",
      ],
      examples: [
        {
          id: "response-entity",
          title: "When the default is not enough",
          lang: "java",
          code: `// 200 + JSON body. Correct for the majority of read endpoints.
@GetMapping("/{id}")
public Book byId(@PathVariable Long id) {
    return service.find(id);
}

// Full control: status, headers, body.
@PostMapping
public ResponseEntity<Book> create(@RequestBody NewBook body) {
    Book saved = service.create(body);
    return ResponseEntity
            .created(URI.create("/api/books/" + saved.id()))   // 201 + Location header
            .body(saved);
}

// 404 when there is nothing to return.
@GetMapping("/{id}")
public ResponseEntity<Book> maybe(@PathVariable Long id) {
    return service.findOptional(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
}

// No body at all.
@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)     // 204
public void delete(@PathVariable Long id) {
    service.delete(id);
}`,
          explanation:
            "Prefer the plain return type when the defaults are right — it keeps the method readable and testable. Reach for `ResponseEntity` when the status or the headers are part of the contract, which for a `POST` that creates something they are: `201 Created` with a `Location` header is what a well-behaved API returns.",
        },
      ],
      pitfalls: [
        {
          title: "Do not return your database entity",
          body:
            "It works, and it is the single most common design mistake in Spring applications. Your entity is shaped by the database; your API response is a contract with callers. Coupling them means a column rename is a breaking API change, lazily loaded relations blow up during serialisation, and fields you never meant to publish — a password hash, an internal flag — end up in the JSON. Return a record built for the response. Module 4 covers the mapping layer properly.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between @Controller and @RestController?",
      answer:
        "`@RestController` is `@Controller` plus `@ResponseBody` applied to every method. With `@Controller`, a returned `String` is interpreted as a **view name** for a template engine to render; with `@RestController` it is the response body itself, written through a message converter. Use `@RestController` for APIs and `@Controller` for server-rendered HTML. Returning a `String` from a `@Controller` by accident is a classic bug: you get a view-resolution error, or a 404, rather than the text you expected.",
    },
    {
      question: "How does a Java object returned from a controller become JSON?",
      answer:
        "Spring MVC picks an `HttpMessageConverter` for the return value. The web starter puts Jackson on the classpath, so Boot auto-configures `MappingJackson2HttpMessageConverter` (Jackson 3, in the `tools.jackson` package as of Boot 4). The dispatcher chooses a converter by matching the return type against each converter's supported types and the request's `Accept` header against its supported media types, then the converter serialises straight to the response's output stream. The same machinery runs in reverse for `@RequestBody`. Nothing about it is specific to JSON — add a converter and the same method can produce XML or CSV.",
    },
    {
      question: "Your controller method runs on which thread, and why does it matter?",
      answer:
        "On a worker thread from the servlet container's pool — `http-nio-8080-exec-N` for Tomcat — not the thread that started the application. It matters because Spring beans are singletons by default, so one controller instance and one service instance serve every concurrent request. Any mutable state on those beans is shared across threads with no synchronisation. Request-scoped state belongs in local variables; bean fields should be dependencies, made `final` through constructor injection.",
    },
    {
      question: "When should a controller method return ResponseEntity instead of the object itself?",
      answer:
        "When the status code or the response headers are part of what the endpoint communicates: `201 Created` with a `Location` header after a create, `204 No Content` after a delete, `404` when a lookup finds nothing, or any endpoint setting cache or ETag headers. When the answer is always 200 with a body, the plain return type is better — less noise, and unit tests can assert on the domain object without unwrapping. `@ResponseStatus` is a middle option when the status is fixed and you do not need headers.",
    },
  ],
  takeaways: [
    "A bean is an ordinary object; the annotation only tells the container to build it and hand it out.",
    "`@RestController` is `@Controller` + `@ResponseBody`: return values are the response body, not view names.",
    "Returning a `String` gives `text/plain`; returning an object gives `application/json`, via a message converter you never configured.",
    "`@PathVariable`, `@RequestParam`, `@RequestBody` and `@RequestHeader` are hooks into the argument-resolution step.",
    "Your method runs on a Tomcat worker thread against singleton beans — never keep request state in a bean field.",
    "Use `ResponseEntity` when status or headers are part of the contract; otherwise return the object.",
    "Never return a JPA entity from a controller. Return a type designed for the response.",
  ],
  status: "available",
};
