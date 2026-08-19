import type { TrackDefinition } from "@/content/types";
import { createComingSoonModule } from "@/content/comingSoon";
import { springFoundationsModule } from "./modules/01-foundations";
import { springContainerModule } from "./modules/02-container";

/**
 * Spring Boot taken from "I have never seen this annotation before" to shipping
 * an enterprise service you are on call for.
 *
 * The order is deliberate. The container comes before the web layer, because
 * `@RestController` is meaningless until you know what makes it a bean and who
 * calls it. The web layer comes before persistence, because an endpoint you can
 * curl is the fastest honest feedback loop there is. Security is three modules
 * rather than one — authentication, authorization, then tokens — because it is
 * where most real applications are actually wrong, and a single skim of
 * `SecurityFilterChain` is how that happens. The four API styles the track
 * covers (REST, GraphQL, WebSocket, webhooks) each get a module, because
 * choosing between them is a design skill and not a syntax one.
 *
 * Baseline is Spring Boot 4.1 on Java 25. That matters more than a version line
 * usually does: Boot 4 renamed the web starter to `spring-boot-starter-webmvc`,
 * split `spring-boot-starter-test` into per-module test starters, moved to
 * Jakarta EE 11 and Spring Framework 7, and — the one that silently breaks
 * copied code — moved Jackson to `tools.jackson`, not `com.fasterxml.jackson`.
 * Every example here was compiled and run against that stack rather than
 * recalled, and anything inherited from the 3.x era is labelled where it still
 * matters, because that is what the codebase you join will be written in.
 */
export const springBootTrack: TrackDefinition = {
  id: "spring-boot",
  slug: "spring-boot",
  title: "Spring Boot",
  shortTitle: "Spring",
  tagline: "From your first bean to an enterprise service you can deploy",
  description:
    "Spring Boot from nothing — what the framework actually does for you, why dependency injection exists, and how a plain Java method becomes an HTTP endpoint — through to production. You learn the container and configuration, then Spring MVC and REST API design, persistence with Spring Data JPA, and testing. Then Spring Security in depth across authentication, authorization and OAuth2/JWT. Then the other three ways services talk: GraphQL, WebSocket and webhooks. Then Spring AI, from a first chat call to RAG, tool calling and MCP. The track ends where real work does: observability, packaging, deployment and performance. Built on Spring Boot 4.1 and Java 25, with every example compiled and run.",
  order: 12,
  status: "available",
  accent: "spring",
  mode: "learn",
  lessonMinutes: [25, 40],
  interviewPrep: true,
  runnable: false,
  modules: [
    springFoundationsModule,
    springContainerModule,
    createComingSoonModule({
      id: "spring-mvc",
      slug: "web-mvc-fundamentals",
      title: "Spring MVC: From a Java Method to an HTTP Endpoint",
      order: 3,
      description:
        "The request lifecycle in full. What DispatcherServlet does between the socket and your method, and every annotation that shapes the mapping in between.",
      topics: [
        "The servlet model, DispatcherServlet, and the path a request takes",
        "@Controller against @RestController, and what @ResponseBody changes",
        "@RequestMapping, @GetMapping and the rest of the family",
        "@PathVariable, @RequestParam, @RequestHeader, @RequestBody and @ModelAttribute",
        "Returning data: ResponseEntity, status codes, and headers you should set",
        "Jackson 3 serialisation, and the annotations that control the JSON",
        "Content negotiation, media types, and file upload and download",
        "Filters, interceptors, and where cross-cutting logic belongs",
      ],
    }),
    createComingSoonModule({
      id: "spring-rest-design",
      slug: "rest-api-design",
      title: "REST API Design: Validation, Errors & Versioning",
      order: 4,
      description:
        "The difference between an endpoint that works and an API other teams can build on: input you can trust, failures that explain themselves, and change that does not break callers.",
      topics: [
        "Bean Validation, @Valid, and writing a constraint of your own",
        "@ControllerAdvice and @ExceptionHandler as a single error policy",
        "ProblemDetail and RFC 9457, instead of a bespoke error shape",
        "DTOs against entities, and the mapping layer between them",
        "Idempotency, safe methods, and designing for retries",
        "Pagination, sorting, filtering, and partial responses",
        "API versioning, including the built-in support added in Spring Framework 7",
        "OpenAPI documentation generated from the code",
      ],
    }),
    createComingSoonModule({
      id: "spring-persistence",
      slug: "persistence-jpa",
      title: "Persistence with Spring Data JPA",
      order: 5,
      description:
        "Talking to a relational database without writing the boilerplate, and without the performance traps that ORM abstraction hides until production.",
      topics: [
        "DataSource, connection pooling with HikariCP, and sensible pool sizes",
        "@Entity, identity, and the equals/hashCode problem JPA creates",
        "Repositories: derived queries, @Query, JPQL, and native SQL",
        "Relationships, fetch types, and the N+1 problem you will hit",
        "@Transactional: propagation, isolation, rollback rules, and self-invocation",
        "The persistence context, dirty checking, and detached entities",
        "Projections, specifications, and dynamic queries",
        "Flyway migrations, and testing against a real database with Testcontainers",
      ],
    }),
    createComingSoonModule({
      id: "spring-testing",
      slug: "testing",
      title: "Testing Spring Applications",
      order: 6,
      description:
        "Tests that catch real defects and still run fast, using the slice annotations Spring provides instead of booting the whole application for everything.",
      topics: [
        "The Boot 4 test starters, and what replaced spring-boot-starter-test",
        "@SpringBootTest, and when the full context is genuinely warranted",
        "Slices: @WebMvcTest, @DataJpaTest, @JsonTest, @RestClientTest",
        "MockMvc and RestTestClient for exercising controllers",
        "@MockitoBean, test doubles, and what not to mock",
        "Testcontainers, @ServiceConnection, and disposable infrastructure",
        "Testing security rules rather than assuming them",
        "The test pyramid in practice, and keeping the suite fast",
      ],
    }),
    createComingSoonModule({
      id: "spring-security-authn",
      slug: "security-authentication",
      title: "Spring Security: Authentication & the Filter Chain",
      order: 7,
      description:
        "Proving who the caller is. The filter chain in detail, because almost every Spring Security problem is really a misunderstanding of what runs in what order.",
      topics: [
        "The filter chain, and the request path through it",
        "SecurityFilterChain as a bean, and the lambda DSL",
        "Authentication, AuthenticationManager, and the SecurityContext",
        "UserDetailsService, and loading users from your own database",
        "Password storage: BCrypt, Argon2, and the DelegatingPasswordEncoder",
        "HTTP Basic, form login, and custom authentication filters",
        "Sessions, session fixation, concurrent sessions, and logout",
        "CSRF, CORS, and the security headers you get for free",
      ],
    }),
    createComingSoonModule({
      id: "spring-security-authz",
      slug: "security-authorization",
      title: "Spring Security: Authorization & Method Security",
      order: 8,
      description:
        "Deciding what an authenticated caller may do, at the URL and inside the domain, without scattering permission checks through the code.",
      topics: [
        "Authorities against roles, and the ROLE_ prefix that trips people up",
        "authorizeHttpRequests, matchers, and the ordering rule that decides everything",
        "Method security: @PreAuthorize, @PostAuthorize, @PreFilter, @PostFilter",
        "The security expression language, and calling your own bean from it",
        "Ownership checks and multi-tenant data isolation",
        "AccessDeniedHandler, AuthenticationEntryPoint, and correct 401 against 403",
        "Auditing who did what",
        "Common authorization mistakes, and how to test for them",
      ],
    }),
    createComingSoonModule({
      id: "spring-security-oauth",
      slug: "security-oauth2-jwt",
      title: "Spring Security: JWT, OAuth2 & OIDC",
      order: 9,
      description:
        "Stateless authentication and delegated identity: the model every distributed system ends up needing, and the parts of it that are genuinely dangerous to get wrong.",
      topics: [
        "Stateless authentication, and what a JWT actually is",
        "Signing, verification, JWKS, key rotation, and clock skew",
        "Resource server: validating tokens and mapping claims to authorities",
        "OAuth2 and OIDC flows, and which one your case needs",
        "OAuth2 client and social login",
        "Running an authorization server with Spring",
        "Refresh tokens, revocation, and logout that means something",
        "Service-to-service auth, and propagating identity between services",
      ],
    }),
    createComingSoonModule({
      id: "spring-http-clients",
      slug: "http-clients",
      title: "Calling Other Services: RestClient & HTTP Interfaces",
      order: 10,
      description:
        "The outbound half of a service. How a normal-looking Java interface becomes real HTTP calls, and how to keep a slow dependency from taking you down with it.",
      topics: [
        "RestClient, the current synchronous client, and why not RestTemplate",
        "Declarative HTTP interfaces: an annotated interface Spring implements",
        "WebClient, and when reactive is the right answer",
        "Request and response bodies, headers, and error decoding",
        "Timeouts — connect, read and total — and the defaults that will hurt you",
        "Retries, backoff, jitter, and idempotency of the call you retry",
        "Circuit breakers, bulkheads, and graceful degradation",
        "Testing outbound calls with MockRestServiceServer and WireMock",
      ],
    }),
    createComingSoonModule({
      id: "spring-graphql",
      slug: "graphql",
      title: "GraphQL with Spring",
      order: 11,
      description:
        "A second API style with a different set of trade-offs: the client picks the shape of the response, which solves over-fetching and hands you a new performance problem to manage.",
      topics: [
        "What GraphQL changes against REST, and when it is worth it",
        "Schema-first development and the type system",
        "@QueryMapping, @MutationMapping, @SchemaMapping and @Argument",
        "Resolvers, nested fields, and where the N+1 problem reappears",
        "Batch loading with DataLoader and @BatchMapping",
        "Errors, nullability, and partial results",
        "Securing a GraphQL endpoint, and why depth and complexity limits matter",
        "Subscriptions, and testing with GraphQlTester",
      ],
    }),
    createComingSoonModule({
      id: "spring-websockets",
      slug: "websockets",
      title: "WebSocket & Real-Time Messaging",
      order: 12,
      description:
        "Pushing data to clients instead of waiting to be asked. Raw sockets, the STOMP messaging model on top, and the state problem that makes scaling them different.",
      topics: [
        "When a request/response API is the wrong shape",
        "Raw WebSocket: handshake, handlers, and sessions",
        "STOMP over WebSocket, and the message broker model",
        "@MessageMapping, @SendTo, and messaging to a single user",
        "Server-Sent Events, and choosing between SSE and WebSocket",
        "Authenticating and authorizing a socket connection",
        "Scaling out: sticky sessions and an external broker relay",
        "Backpressure, heartbeats, reconnection, and testing",
      ],
    }),
    createComingSoonModule({
      id: "spring-webhooks",
      slug: "webhooks",
      title: "Webhooks: Receiving and Sending",
      order: 13,
      description:
        "The integration pattern every third-party service uses, and the one most teams implement insecurely — an unauthenticated public endpoint that mutates your data.",
      topics: [
        "Webhooks against polling, and the delivery guarantees you actually get",
        "Receiving: endpoint design, fast acknowledgement, and async processing",
        "Signature verification, HMAC, and constant-time comparison",
        "Replay protection with timestamps and nonces",
        "Idempotency keys, and surviving duplicate delivery",
        "Sending webhooks: queueing, retries with exponential backoff, and dead letters",
        "Ordering, at-least-once delivery, and consumer expectations",
        "Testing and debugging webhooks locally",
      ],
    }),
    createComingSoonModule({
      id: "spring-async",
      slug: "async-scheduling-messaging",
      title: "Async, Scheduling, Events & Messaging",
      order: 14,
      description:
        "Work that happens off the request thread: background jobs, scheduled tasks, in-process events, and the message brokers that carry work between services.",
      topics: [
        "@Async, TaskExecutor, and why the default executor is a trap",
        "Virtual threads on Java 25, and what they change for a Spring service",
        "@Scheduled, cron expressions, and scheduling in a multi-instance deployment",
        "Application events, @EventListener, and @TransactionalEventListener",
        "The transactional outbox pattern, and why dual writes lose data",
        "Messaging with Kafka and RabbitMQ from Spring",
        "Consumer groups, offsets, redelivery and poison messages",
        "Observability and error handling for work nobody is waiting on",
      ],
    }),
    createComingSoonModule({
      id: "spring-ai-basics",
      slug: "spring-ai-fundamentals",
      title: "Spring AI: Chat, Prompts & Structured Output",
      order: 15,
      description:
        "Calling a model as an ordinary dependency. ChatClient, prompt construction, and the step that makes model output usable in real code — getting typed objects instead of prose.",
      topics: [
        "What Spring AI is, and the portability the abstraction buys you",
        "ChatClient and ChatModel, and configuring a provider",
        "Prompts, messages, roles, and system instructions",
        "Prompt templates and injecting data safely into them",
        "Structured output: mapping a response onto a Java record",
        "Model options, temperature, token limits, and cost",
        "Streaming responses to a client",
        "Testing, evaluating and handling failure in code that calls a model",
      ],
    }),
    createComingSoonModule({
      id: "spring-ai-rag",
      slug: "spring-ai-rag-tools",
      title: "Spring AI: RAG, Tools & MCP",
      order: 16,
      description:
        "Giving a model access to your data and your systems: retrieval over your own documents, tool calling that lets it invoke your code, and MCP for exposing capabilities to other clients.",
      topics: [
        "Embeddings, vector similarity, and what a vector store is for",
        "Document readers, transformers, chunking, and the ETL pipeline",
        "Retrieval-augmented generation end to end with pgvector",
        "Advisors, and the retrieval and memory pipeline around a call",
        "Chat memory, conversation state, and its repositories",
        "Tool calling: exposing a Java method for the model to invoke",
        "Model Context Protocol — a Spring AI MCP server and client",
        "Guardrails, prompt injection, and the trust boundary around tool calls",
      ],
    }),
    createComingSoonModule({
      id: "spring-observability",
      slug: "observability",
      title: "Observability & Operations",
      order: 17,
      description:
        "Knowing what your service is doing once it is somewhere you cannot attach a debugger — the work that decides how long an incident lasts.",
      topics: [
        "Actuator: endpoints, and exposing them without leaking internals",
        "Health indicators, liveness and readiness, and what Kubernetes does with them",
        "Metrics with Micrometer, and the four signals worth alerting on",
        "Distributed tracing, spans, and context propagation across services",
        "Structured logging, correlation IDs, and log levels that survive an incident",
        "Profiling a slow endpoint, and finding the real bottleneck",
        "Graceful shutdown and connection draining",
        "Configuration, secrets and feature flags in a running system",
      ],
    }),
    createComingSoonModule({
      id: "spring-production",
      slug: "production-deployment",
      title: "Production: Packaging, Deployment & Performance",
      order: 18,
      description:
        "Getting it out the door and keeping it healthy. Packaging, containers, native images, and a final capstone that puts every module in the track into one deployable service.",
      topics: [
        "The executable jar, layered jars, and what Boot's repackaging does",
        "Container images with buildpacks and with a hand-written Dockerfile",
        "GraalVM native images: startup, memory, and what you give up",
        "JVM tuning, heap sizing, and container-aware defaults",
        "Startup time, lazy initialisation, and AOT processing",
        "Twelve-factor configuration, secrets management, and zero-downtime deploys",
        "CI/CD, reproducible builds, and supply-chain scanning",
        "Capstone: one service carrying REST, GraphQL, WebSocket, security and AI",
      ],
    }),
  ],
};
