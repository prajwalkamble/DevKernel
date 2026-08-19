import type { Lesson } from "@/content/types";

export const eventsLesson: Lesson = {
  id: "spring-events",
  slug: "application-events",
  moduleSlug: "beans-and-configuration",
  title: "Application Events: Decoupling Inside One Process",
  summary:
    "A publisher that does not know its listeners. The mechanism is small and the default behaviour surprises people — events are synchronous, on the calling thread, inside the caller's transaction — so this lesson pins down exactly what publishing does before showing what it is good for.",
  estimatedMinutes: 25,
  objectives: [
    "Publish an event and consume it with @EventListener",
    "State what publishEvent does on the calling thread",
    "Control listener ordering, and know when you should not depend on it",
    "Recognise the built-in lifecycle events and use ApplicationReadyEvent",
    "Judge when an event is better than a direct method call, and when it is worse",
  ],
  sections: [
    {
      id: "mechanism",
      heading: "The mechanism",
      body: [
        "One bean publishes an object. Any bean with a matching `@EventListener` method receives it. The publisher has no reference to the listeners and no knowledge that any exist.",
        "Since Spring 4.2 the event can be **any object** — no base class, no interface. A record is the natural choice.",
      ],
      examples: [
        {
          id: "event-code",
          title: "An event, a publisher and two listeners",
          lang: "java",
          code: `public record OrderPlaced(String id, long amount) {}

@Service
public class OrderService {

    private final ApplicationEventPublisher events;

    public OrderService(ApplicationEventPublisher events) {
        this.events = events;
    }

    public void place(Order order) {
        repository.save(order);
        events.publishEvent(new OrderPlaced(order.id(), order.total()));
    }
}

@Component
public class InventoryListener {
    @EventListener
    @Order(1)
    public void on(OrderPlaced event) {
        System.out.println("EVENT inventory reserved for " + event.id()
                + " on thread " + Thread.currentThread().getName());
    }
}

@Component
public class EmailListener {
    @EventListener
    @Order(2)
    public void on(OrderPlaced event) {
        System.out.println("EVENT confirmation email for " + event.id());
    }
}`,
          explanation:
            "`ApplicationEventPublisher` is injectable anywhere; the `ApplicationContext` implements it, so you can also publish from `main`. Listener methods take the event type as their only parameter — that parameter type *is* the subscription.",
        },
      ],
    },
    {
      id: "synchronous",
      heading: "What publishEvent actually does",
      body: [
        "This is the part people get wrong, so here it is measured rather than asserted.",
      ],
      examples: [
        {
          id: "sync-proof",
          title: "Publishing, with thread names",
          lang: "bash",
          code: `EVENT publishing on thread main
EVENT inventory reserved for ord-1 on thread main
EVENT confirmation email for ord-1
EVENT publishEvent returned`,
          explanation:
            "Three facts, all visible. **Synchronous:** `publishEvent` did not return until every listener finished. **Same thread:** the listener ran on `main`, the caller's thread, not a pool. **Ordered:** `@Order(1)` before `@Order(2)`.",
        },
        {
          id: "consequences",
          title: "What follows from that",
          lang: "java",
          code: `@Transactional
public void place(Order order) {
    repository.save(order);
    events.publishEvent(new OrderPlaced(order.id(), order.total()));
    // Every listener runs HERE, before this method returns, on this thread,
    // inside this transaction.
    //
    //   - a slow listener slows this request
    //   - a listener that throws propagates out of publishEvent
    //     and rolls back this transaction
    //   - a listener reading the database sees the uncommitted save
}`,
          explanation:
            "The default is a plain in-process method call with the coupling removed — which is often exactly what you want, and is emphatically **not** a message queue. Nothing is persisted, nothing is retried, and a process crash between the save and the listener loses the effect entirely.",
        },
      ],
      pitfalls: [
        {
          title: "An exception in a listener fails the publisher",
          body:
            "Because the call is synchronous and unwrapped, a listener throwing propagates out of `publishEvent` and into the publishing method — rolling back its transaction and failing the request. That is occasionally what you want and usually not: the point of publishing was that the caller did not care. Catch and log inside listeners whose failure should not fail the operation, and be deliberate about which ones should.",
        },
      ],
    },
    {
      id: "async",
      heading: "Making a listener asynchronous",
      examples: [
        {
          id: "async-code",
          title: "@Async, and what it changes",
          lang: "java",
          code: `@SpringBootApplication
@EnableAsync
public class Application { ... }

@Component
public class EmailListener {

    @Async
    @EventListener
    public void on(OrderPlaced event) {
        // now on a task-executor thread; publishEvent returns immediately
    }
}`,
          explanation:
            "Now the listener runs on a `TaskExecutor` thread and `publishEvent` returns straight away. Everything you gained by being synchronous, you lose: the exception no longer reaches the caller (it goes to an `AsyncUncaughtExceptionHandler` you must configure, or nowhere), and the listener runs outside the publisher's transaction and outside its security context. Module 14 covers `@Async` properly — including why the default executor is a trap.",
        },
        {
          id: "txn-listener",
          title: "The one you will actually want",
          lang: "java",
          code: `@Component
public class EmailListener {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(OrderPlaced event) {
        // runs only if the publisher's transaction committed
    }
}`,
          explanation:
            "`@TransactionalEventListener` defers the listener until the publishing transaction reaches a chosen phase — `AFTER_COMMIT` by default. It solves the real problem with the plain listener: sending a confirmation email for an order whose transaction then rolls back. If there is no transaction the listener does not run at all unless you set `fallbackExecution = true`, which is a genuine gotcha. Module 5 returns to this once transactions are covered.",
        },
      ],
    },
    {
      id: "builtin",
      heading: "The events Spring publishes",
      body: [
        "Boot publishes its own lifecycle events, and listening to them is the supported way to hook startup.",
      ],
      examples: [
        {
          id: "builtin-list",
          title: "In startup order",
          lang: "java",
          code: `ApplicationStartingEvent          // before almost anything
ApplicationEnvironmentPreparedEvent   // Environment ready, context not created
ApplicationContextInitializedEvent
ApplicationPreparedEvent          // definitions loaded, beans not created
ContextRefreshedEvent             // all beans created and initialised
ApplicationStartedEvent           // context refreshed, runners not yet called
ApplicationReadyEvent             // <- everything up, ready for traffic
ApplicationFailedEvent            // startup threw
ContextClosedEvent                // shutdown beginning`,
        },
        {
          id: "ready",
          title: "The one you will use",
          lang: "java",
          code: `@Component
public class CacheWarmer {

    @EventListener(ApplicationReadyEvent.class)
    public void warm() {
        // Everything exists and the web server is listening.
        // Safe here; NOT safe in @PostConstruct.
    }
}`,
          explanation:
            "The distinction from `@PostConstruct` is the point. `@PostConstruct` runs while the context is still being built — other beans may be incomplete and no port is open. `ApplicationReadyEvent` runs when the application is genuinely up. For sequenced startup work, `ApplicationRunner` and `CommandLineRunner` do the same job with an `@Order` between them.",
        },
      ],
    },
    {
      id: "when",
      heading: "When an event is the right call",
      body: [
        "Events buy decoupling and cost traceability. Both are real.",
        "**Reach for one when** the publisher genuinely should not know who cares — \"an order was placed\" with three unrelated reactions, and adding a fourth should not touch `OrderService`. **Reach for one when** you need to break a dependency cycle: replace the reference with a notification and the cycle disappears along with it.",
        "**Do not reach for one when** the publisher needs a result, when there is exactly one listener that will always exist (that is a method call with extra steps), or when you want durability, retries or cross-process delivery — that is a message broker, and module 14 covers it.",
      ],
      pitfalls: [
        {
          title: "Events make control flow hard to follow",
          body:
            "`publishEvent(new OrderPlaced(...))` has no compile-time link to anything that handles it. \"Find usages\" on the record is the only trail, and if the listener lives in another module a reader may never find it. That is an acceptable price for genuine decoupling and a poor price for a single caller. A useful heuristic: if you would struggle to explain to a new colleague what happens after this line, prefer the direct call.",
        },
        {
          title: "Do not rely on listener order for correctness",
          body:
            "`@Order` works and is verifiable, but a design where listener A must run before listener B has coupled them back together while hiding the fact behind two annotations in different files. If the sequence matters, that is one operation with two steps, and it belongs in one method.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Are Spring application events synchronous or asynchronous?",
      answer:
        "Synchronous by default, on the publishing thread. `publishEvent` invokes every matching listener in turn and does not return until they have all finished, so a slow listener slows the caller, a listener that throws propagates the exception into the publisher and rolls back its transaction, and listeners see whatever the publisher has done so far — including uncommitted database writes. Adding `@Async` to a listener moves it to a task-executor thread and makes publishing return immediately, at the cost of the exception no longer reaching the caller and the listener running outside the publisher's transaction and security context.",
    },
    {
      question: "What problem does @TransactionalEventListener solve?",
      answer:
        "A plain `@EventListener` runs inside the publisher's transaction, so a side effect such as sending an email or calling another service can happen for work that then rolls back. `@TransactionalEventListener` binds the listener to a transaction phase — `AFTER_COMMIT` by default — so it runs only if the transaction actually committed. Watch for the default that if there is no transaction in progress the listener does not run at all, unless `fallbackExecution = true`. It does not make delivery durable: a crash between commit and listener still loses the event, which is what the transactional outbox pattern exists to fix.",
    },
    {
      question: "When would you use an application event instead of calling a method?",
      answer:
        "When the publisher genuinely should not know who reacts — one domain occurrence with several unrelated consequences, where adding another consequence should not modify the publisher — and when you need to break a dependency cycle by turning a reference into a notification. Not when the publisher needs a return value, not when there is exactly one listener that will always exist, and not when you need durability, retries or delivery to another process. The cost is traceability: there is no compile-time link from the publish site to the handler, so overusing events makes control flow genuinely hard to follow.",
    },
    {
      question: "Where should startup work go — @PostConstruct or ApplicationReadyEvent?",
      answer:
        "`@PostConstruct` for initialising the bean itself, since it runs while the context is still being built: other beans may not be fully initialised and the web server is not listening. `ApplicationReadyEvent`, or an `ApplicationRunner`/`CommandLineRunner`, for work that needs the whole application up — warming a cache through your own endpoints, registering with service discovery, running a one-off job. Using `@PostConstruct` for the second kind produces intermittent startup failures that depend on bean creation order, which is exactly the sort of bug that only appears in one environment.",
    },
  ],
  takeaways: [
    "Any object can be an event; a record is the natural choice.",
    "`publishEvent` is synchronous, on the caller's thread, inside the caller's transaction — verified by thread name.",
    "A listener that throws fails the publisher and rolls back its transaction.",
    "`@Order` controls listener sequence, but needing that sequence is a design smell.",
    "`@Async` decouples the thread and gives up the exception path, the transaction and the security context.",
    "`@TransactionalEventListener(AFTER_COMMIT)` is what you usually want for side effects.",
    "Use `ApplicationReadyEvent` for work that needs a fully started application.",
    "Events are not a message queue — no durability, no retries, no delivery beyond this process.",
  ],
  status: "available",
};
