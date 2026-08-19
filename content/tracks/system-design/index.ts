import type { TrackDefinition } from "@/content/types";
import { createComingSoonModule } from "@/content/comingSoon";

/**
 * Module 2 of the roadmap: the half of the interview that is not algorithms, and
 * the half of the job that is not writing functions.
 *
 * Three stages, in this order, for a reason that is worth stating because most
 * material gets it backwards.
 *
 * **SQL comes first.** It is the only one of the three you can practise the way
 * you practise DSA — a question, an answer, and something that tells you
 * immediately whether you were right. It is also the concrete floor the other
 * two stand on: a schema decision in LLD and a sharding decision in HLD are both
 * arguments about queries, and you cannot have that argument if you cannot read
 * a query plan.
 *
 * **Low-level design comes second.** One service, in code, with classes you
 * could actually type. This is where the vocabulary is built — responsibility,
 * coupling, invariant, interface — and the vocabulary is what makes the
 * high-level conversation possible rather than decorative.
 *
 * **High-level design comes last**, because it is the stage where guessing is
 * easiest to hide. Anyone can say "add a cache". The stage is arranged so that
 * every component is introduced by the failure that forces it: load balancing
 * because one machine has a ceiling, consistent hashing because adding a machine
 * moves every key, CAP because a network you do not control will partition.
 *
 * The case studies are electives and are the point of the whole track. Design
 * discussions are unfalsifiable until they meet a real requirement — a number of
 * users, a latency budget, a consistency demand — so each one starts from those
 * numbers and derives the architecture rather than presenting one.
 *
 * What this track deliberately does not do is hand you a diagram to memorise.
 * A memorised architecture survives exactly one follow-up question.
 */
export const systemDesignTrack: TrackDefinition = {
  id: "system-design",
  slug: "system-design",
  title: "System Design: SQL, LLD & HLD",
  shortTitle: "System Design",
  tagline: "Module 2 — from a SELECT statement to an architecture you can defend",
  description:
    "Roadmap Module 2, in the order that actually builds: SQL first, because it is the only part you can practise with immediate feedback and the concrete floor the rest stands on. Then low-level design — one service, in real classes, where the vocabulary of responsibility and coupling and invariants gets built. Then high-level design, where every component is introduced by the failure that forces it rather than presented as a diagram to memorise: load balancers because one machine has a ceiling, consistent hashing because adding a machine moves every key, CAP because the network will partition whether you planned for it or not. Case studies close it out, each starting from real numbers — users, latency budget, consistency requirement — and deriving the architecture, because a design discussion without constraints cannot be wrong and therefore cannot teach you anything.",
  order: 2,
  status: "coming-soon",
  accent: "system",
  mode: "learn",
  lessonMinutes: [25, 45],
  interviewPrep: true,
  runnable: false,
  modules: [
    // ---------------------------------------------------------------------
    // Stage 1 — SQL
    // ---------------------------------------------------------------------
    createComingSoonModule({
      id: "sd-sql-foundations",
      slug: "sql-foundations",
      title: "SQL Foundations & Advanced SELECT",
      order: 1,
      phase: "Stage 1 · SQL",
      description:
        "The relational model, and then the SELECT statement taken seriously — including the clause evaluation order that explains most of the things beginners find arbitrary about SQL.",
      topics: [
        "Tables, rows, columns, keys: the relational model in one sitting",
        "SELECT, WHERE, and the clause evaluation order SQL really uses",
        "Why WHERE cannot see a column alias but ORDER BY can",
        "NULL, three-valued logic, and why = NULL is never true",
        "DISTINCT, LIMIT, OFFSET, and the pagination bug hiding in OFFSET",
        "CASE expressions, COALESCE and NULLIF",
        "Set operations: UNION, UNION ALL, INTERSECT, EXCEPT",
        "Setting up a database locally and loading a dataset worth querying",
      ],
    }),
    createComingSoonModule({
      id: "sd-sql-joins",
      slug: "joins",
      title: "Joins: Every Way to Combine Two Tables",
      order: 2,
      phase: "Stage 1 · SQL",
      description:
        "The single most-asked and most-failed area of SQL. Every join type, what each does to row counts, and the two mistakes — fan-out and the filtered outer join — that silently return plausible wrong answers.",
      topics: [
        "INNER JOIN, and what a join actually is underneath",
        "LEFT, RIGHT and FULL OUTER joins, and when each is the right question",
        "CROSS JOIN, and the row explosion you sometimes want",
        "Self joins: hierarchies, pairs, and comparing a row to its neighbours",
        "Fan-out: why joining then aggregating double-counts",
        "The filtered outer join: why a WHERE on the right table makes it inner",
        "Anti-joins and semi-joins: NOT EXISTS against NOT IN and NULL",
        "Joining on ranges and on inequalities, not just on equality",
      ],
    }),
    createComingSoonModule({
      id: "sd-sql-grouping",
      slug: "sorting-grouping-and-aggregation",
      title: "Sorting, Grouping & Aggregation",
      order: 3,
      phase: "Stage 1 · SQL",
      description:
        "Turning rows into answers. GROUP BY, the aggregate functions, and the HAVING/WHERE distinction that stops being confusing the moment you know when each one runs.",
      topics: [
        "ORDER BY, multiple keys, and where NULLs sort",
        "GROUP BY, and what a grouped row actually represents",
        "COUNT(*) against COUNT(column): the NULL difference that changes answers",
        "SUM, AVG, MIN, MAX, and aggregating over an empty group",
        "HAVING against WHERE, decided by evaluation order",
        "Conditional aggregation, and pivoting with CASE inside SUM",
        "GROUPING SETS, ROLLUP and CUBE for subtotals",
        "The classic report: top N per group, three different ways",
      ],
    }),
    createComingSoonModule({
      id: "sd-sql-subqueries",
      slug: "subqueries-and-ctes",
      title: "Subqueries & Common Table Expressions",
      order: 4,
      phase: "Stage 1 · SQL",
      description:
        "How to build a query in layers instead of in one unreadable block — and the correlated subquery, which is the one that quietly runs once per row.",
      topics: [
        "Scalar, row and table subqueries, and where each is legal",
        "Subqueries in SELECT, FROM and WHERE, and what changes in each",
        "Correlated subqueries, and the per-row cost that makes them dangerous",
        "EXISTS against IN against JOIN: the same question, three plans",
        "Common table expressions, and naming a step so the query reads top to bottom",
        "Chaining CTEs, and refactoring a nested query into a readable pipeline",
        "Materialisation: when a CTE is an optimiser fence and when it is not",
        "Rewriting a correlated subquery as a join, and measuring the difference",
      ],
    }),
    createComingSoonModule({
      id: "sd-sql-windows",
      slug: "window-functions",
      title: "Window Functions",
      order: 5,
      phase: "Stage 1 · SQL",
      description:
        "The feature that separates people who can use SQL from people who can only query with it: aggregate over a set of rows while keeping every row.",
      topics: [
        "OVER, PARTITION BY and ORDER BY, and what a window is",
        "ROW_NUMBER, RANK and DENSE_RANK, and picking the right one",
        "Running totals, moving averages, and cumulative aggregates",
        "LAG and LEAD: comparing a row to the ones around it",
        "FIRST_VALUE, LAST_VALUE, and the frame that makes LAST_VALUE surprise you",
        "Frame clauses: ROWS against RANGE, and the default nobody reads",
        "NTILE, percent rank, and bucketing",
        "Deduplication, sessionisation, and gaps-and-islands",
      ],
    }),
    createComingSoonModule({
      id: "sd-sql-recursive",
      slug: "recursive-ctes",
      title: "Recursive CTEs & Hierarchical Data",
      order: 6,
      phase: "Stage 1 · SQL",
      description:
        "Trees and graphs stored in a table, and the one construct that can walk them — plus the termination condition, because a recursive CTE without one is an outage.",
      topics: [
        "The anchor member, the recursive member, and how iteration terminates",
        "Walking an org chart, a category tree, a comment thread",
        "Depth tracking, and materialising the path to a node",
        "Cycle detection, and the runaway query that takes the database with it",
        "Transitive closure, and reachability over a graph in a table",
        "Generating series: dates, numbers, and filling gaps in a report",
        "Adjacency list against nested set against materialised path",
        "When to stop: the point at which this belongs in application code",
      ],
    }),
    createComingSoonModule({
      id: "sd-sql-strings",
      slug: "string-functions-and-regex",
      title: "String Functions, Regex & Pattern Matching",
      order: 7,
      phase: "Stage 1 · SQL",
      description:
        "The messy half of real data. Parsing, cleaning and matching text in the database, and knowing when doing so has quietly made every index useless.",
      topics: [
        "The core set: CONCAT, SUBSTRING, TRIM, REPLACE, LENGTH, POSITION",
        "Case handling, collations, and why sorting differs between databases",
        "LIKE and ILIKE, and the leading wildcard that kills an index",
        "Regular expressions in SQL, and the dialect differences that matter",
        "Splitting a delimited column into rows",
        "Full-text search: tsvector, inverted indexes, and ranking",
        "Formatting and parsing dates, and time zones done properly",
        "JSON columns: querying, indexing, and when a column should have been a table",
      ],
    }),
    createComingSoonModule({
      id: "sd-sql-performance",
      slug: "indexes-and-query-performance",
      title: "Indexes & Query Performance",
      order: 8,
      phase: "Stage 1 · SQL",
      description:
        "Not on the roadmap's list, and included anyway: every later argument about sharding, caching and read replicas is an argument about queries, and it cannot be had by somebody who has never read a query plan.",
      topics: [
        "B-tree indexes, and what an index physically is",
        "Reading EXPLAIN and EXPLAIN ANALYZE without fear",
        "Sequential scan against index scan, and why the planner sometimes prefers the scan",
        "Composite indexes, and why column order decides what they can serve",
        "Covering indexes and index-only scans",
        "What makes a predicate unable to use an index",
        "Hash, GIN and partial indexes, and where each earns its keep",
        "The cost of an index on write, and why more is not better",
      ],
    }),

    // ---------------------------------------------------------------------
    // Stage 2 — Low-level design
    // ---------------------------------------------------------------------
    createComingSoonModule({
      id: "sd-lld-oop",
      slug: "object-oriented-programming",
      title: "Object-Oriented Programming, Properly",
      order: 9,
      phase: "Stage 2 · Low-Level Design",
      description:
        "Not the four-pillars recital. What an object is for, what belongs inside one, and why composition keeps beating the inheritance hierarchy you were about to draw.",
      topics: [
        "Encapsulation as a boundary around an invariant, not as private fields",
        "Abstraction: the interface as the promise, the class as the detail",
        "Inheritance, and the fragile base class it tends to produce",
        "Polymorphism, dynamic dispatch, and programming to an interface",
        "Composition over inheritance, with the refactor shown both ways",
        "Value objects against entities, and identity against equality",
        "Immutability, and the concurrency bugs it deletes outright",
        "Cohesion and coupling: the two words every review comes down to",
      ],
    }),
    createComingSoonModule({
      id: "sd-lld-solid",
      slug: "solid-principles",
      title: "SOLID Principles",
      order: 10,
      phase: "Stage 2 · Low-Level Design",
      description:
        "Five principles usually taught as slogans, taught here as five specific pains — each introduced by the change request that makes badly-factored code expensive.",
      topics: [
        "Single responsibility: one reason to change, and finding the reasons",
        "Open-closed, and extension points that are not speculative generality",
        "Liskov substitution, and the square-rectangle problem stated properly",
        "Interface segregation, and the fat interface that forces empty methods",
        "Dependency inversion, and why it is not the same as dependency injection",
        "Applying all five to one class, step by step, with the diff visible",
        "Over-application: when SOLID produces twelve files that should be one",
        "The trade-off table: what each principle costs you to obey",
      ],
    }),
    createComingSoonModule({
      id: "sd-lld-patterns",
      slug: "design-patterns",
      title: "Design Patterns That Actually Come Up",
      order: 11,
      phase: "Stage 2 · Low-Level Design",
      description:
        "The dozen that appear in real code and in machine-coding rounds, each introduced by the problem it solves — because a pattern applied without that problem is just extra indirection.",
      topics: [
        "Creational: factory, builder, singleton, and why singleton is contentious",
        "Structural: adapter, decorator, facade, proxy",
        "Behavioural: strategy, observer, state, command",
        "Template method and chain of responsibility",
        "Recognising the smell each pattern is the cure for",
        "Patterns you can drop: the ones the language already gives you",
        "Combining patterns, and the complexity budget you are spending",
        "Naming: making the pattern visible in the code to the next reader",
      ],
    }),
    createComingSoonModule({
      id: "sd-lld-uml",
      slug: "uml-and-modelling",
      title: "UML & Modelling Before You Code",
      order: 12,
      phase: "Stage 2 · Low-Level Design",
      description:
        "Enough UML to think on a whiteboard and be understood in an interview — which is much less than the specification and much more useful.",
      topics: [
        "Class diagrams: attributes, methods, and the four relationship arrows",
        "Association, aggregation, composition — and getting the diamond right",
        "Multiplicity, and the cardinality question that exposes a design flaw",
        "Sequence diagrams, and making a flow of calls visible",
        "State diagrams, and modelling an entity's lifecycle",
        "Use-case and activity diagrams, and where they earn their keep",
        "Whiteboard UML: what to draw under time pressure and what to skip",
        "From requirements to a first class diagram, worked end to end",
      ],
    }),
    createComingSoonModule({
      id: "sd-lld-schema",
      slug: "schema-design",
      title: "Schema Design",
      order: 13,
      phase: "Stage 2 · Low-Level Design",
      description:
        "Turning a domain into tables. Normalisation until it hurts, denormalisation once it does, and the constraints that let the database refuse to hold a wrong answer.",
      topics: [
        "Entities, relationships and attributes, from a requirements paragraph",
        "Normal forms up to BCNF, and what each anomaly actually looks like",
        "Denormalising on purpose, and the write cost you accept for it",
        "Primary keys: natural, surrogate, UUID against auto-increment",
        "Foreign keys, cascades, and integrity the application cannot violate",
        "Modelling one-to-many, many-to-many, and the join table",
        "Soft deletes, audit columns, temporal data and slowly changing dimensions",
        "Migrations: evolving a schema that is already in production",
      ],
    }),
    createComingSoonModule({
      id: "sd-lld-api",
      slug: "api-design",
      title: "API Design",
      order: 14,
      phase: "Stage 2 · Low-Level Design",
      description:
        "The contract everything else is built against, and the one thing in the system you cannot quietly change later.",
      topics: [
        "Resources, verbs and status codes: REST as it was actually specified",
        "Designing the resource model from the domain, not from the tables",
        "Pagination, filtering and sorting, and cursors against offsets",
        "Idempotency, retries, and the idempotency key",
        "Versioning: URL, header, and the migration you will need either way",
        "Errors: shapes, codes, and messages a client can act on",
        "Authentication and authorisation at the boundary",
        "REST against GraphQL against gRPC, decided on the actual trade-offs",
      ],
    }),
    createComingSoonModule({
      id: "sd-lld-machine-coding",
      slug: "machine-coding-interviews",
      title: "Machine Coding Interviews: The LLD Round",
      order: 15,
      phase: "Stage 2 · Low-Level Design",
      description:
        "Ninety minutes, a vague problem statement, and a working program at the end. The round is a time-management exam disguised as a design exam, and this is the method for it.",
      topics: [
        "Reading the statement: requirements, and the ones you must ask about",
        "Scoping to what you can finish, and saying out loud what you cut",
        "The first ten minutes: entities, interfaces, and the skeleton",
        "Choosing where to be extensible and where to hard-code",
        "In-memory storage, and keeping persistence behind an interface",
        "Concurrency: what to make thread-safe and what to declare out of scope",
        "Testing under time pressure, and what to test first",
        "The walkthrough at the end, and the extensions they will ask for",
      ],
    }),

    // ---------------------------------------------------------------------
    // Stage 3 — High-level design
    // ---------------------------------------------------------------------
    createComingSoonModule({
      id: "sd-hld-architecture",
      slug: "architecture-design",
      title: "Architecture Design & the Shape of a System",
      order: 16,
      phase: "Stage 3 · High-Level Design",
      description:
        "How to start. Requirements, back-of-the-envelope numbers, and the first diagram — plus the habit that makes every later decision arguable instead of arbitrary.",
      topics: [
        "Functional and non-functional requirements, and pinning the numbers down",
        "Back-of-the-envelope estimation: QPS, storage, bandwidth",
        "The powers of two and the latency numbers worth memorising",
        "Client, server, database: the smallest system, and where it breaks first",
        "Layering, tiers, and separating read paths from write paths",
        "Stateless services, and why statelessness is what makes scaling possible",
        "Drawing the first diagram, and the components you have earned so far",
        "Documenting a decision: the trade-off, the alternative, the reason",
      ],
    }),
    createComingSoonModule({
      id: "sd-hld-distributed",
      slug: "distributed-systems",
      title: "Distributed Systems: Failure, Time & Coordination",
      order: 17,
      phase: "Stage 3 · High-Level Design",
      description:
        "The theory that makes the rest of the stage make sense. Once there is more than one machine, everything you assumed about time, order and success stops being free.",
      topics: [
        "The fallacies of distributed computing, one failure at a time",
        "Partial failure, and why a timeout is not an answer",
        "Clocks: why wall time lies, and what logical clocks fix",
        "Replication: leader-follower, multi-leader, leaderless",
        "Quorums, and the R + W > N arithmetic",
        "Consensus: what Paxos and Raft are for, at the level you need",
        "Leader election, distributed locks and ZooKeeper's actual job",
        "Idempotency and exactly-once, which does not exist and what to do instead",
      ],
    }),
    createComingSoonModule({
      id: "sd-hld-dns-cdn",
      slug: "dns-and-content-delivery",
      title: "How a Request Finds You: DNS & CDNs",
      order: 18,
      phase: "Stage 3 · High-Level Design",
      description:
        "Everything that happens before your server sees a byte — the part most candidates skip and most interviewers open with.",
      topics: [
        "What happens when you type a URL, in the order it happens",
        "DNS: resolvers, records, TTLs and propagation",
        "DNS-based routing: geo, latency and weighted policies",
        "TCP, TLS, and the round trips a connection costs",
        "HTTP/1.1, HTTP/2 and HTTP/3, and what each fixed",
        "CDNs: edge caching, origin shielding, and cache keys",
        "Cache-Control, ETags, and invalidation that actually works",
        "Static against dynamic content at the edge, and edge compute",
      ],
    }),
    createComingSoonModule({
      id: "sd-hld-load-balancing",
      slug: "load-balancing-and-consistent-hashing",
      title: "Load Balancing & Consistent Hashing",
      order: 19,
      phase: "Stage 3 · High-Level Design",
      description:
        "One machine has a ceiling, so you add machines — and immediately need to answer which one gets this request, and what happens to everything when you add the next.",
      topics: [
        "Layer 4 against layer 7, and what each can route on",
        "Round robin, least connections, weighted, and hash-based routing",
        "Health checks, draining, and removing a machine without dropping requests",
        "Sticky sessions, and why they are a smell rather than a feature",
        "Modulo hashing, and why adding one server remaps almost every key",
        "The hash ring, virtual nodes, and consistent hashing done properly",
        "Rendezvous hashing, and where it is simpler",
        "Rebalancing: what moves, what does not, and what it costs",
      ],
    }),
    createComingSoonModule({
      id: "sd-hld-caching",
      slug: "caching",
      title: "Caching",
      order: 20,
      phase: "Stage 3 · High-Level Design",
      description:
        "The first thing everyone reaches for and the thing most often waved at without detail. Where to put it, what to do on a miss, and how it goes stale.",
      topics: [
        "The cache hierarchy: browser, CDN, application, database",
        "Cache-aside, read-through, write-through, write-behind",
        "Eviction: LRU, LFU, TTL, and choosing between them",
        "Invalidation, and why it is genuinely one of the hard problems",
        "The thundering herd, and stampede protection",
        "Hot keys, and the shard that receives all the traffic",
        "Redis and Memcached, and the data structures Redis adds",
        "Measuring hit rate, and knowing when a cache is not earning its complexity",
      ],
    }),
    createComingSoonModule({
      id: "sd-hld-storage",
      slug: "sql-vs-nosql",
      title: "SQL vs NoSQL & Choosing a Datastore",
      order: 21,
      phase: "Stage 3 · High-Level Design",
      description:
        "The question every design interview reaches, usually answered by preference. Answered here by access pattern, which is the only thing that actually decides it.",
      topics: [
        "Relational stores, and what you give up by leaving them",
        "Key-value, document, wide-column, graph, time-series",
        "Choosing from access patterns rather than from data shape",
        "Vertical against horizontal scaling, and where each stops",
        "Read replicas, replication lag, and reading your own writes",
        "Sharding: by key, by range, by geography — and resharding",
        "Object storage and blobs, and keeping them out of the database",
        "Polyglot persistence, and the operational cost of a second datastore",
      ],
    }),
    createComingSoonModule({
      id: "sd-hld-transactions",
      slug: "transactions-and-cap",
      title: "Transactions, Consistency & the CAP Theorem",
      order: 22,
      phase: "Stage 3 · High-Level Design",
      description:
        "What a guarantee is worth, and what it costs. CAP stated correctly rather than as the triangle slide, and the consistency models that live between the extremes.",
      topics: [
        "ACID, and what each letter actually promises",
        "Isolation levels, and the anomaly each one still permits",
        "Optimistic against pessimistic locking, and deadlocks",
        "CAP stated properly: the choice only applies during a partition",
        "PACELC, and the latency trade you make when there is no partition",
        "Strong, eventual, causal and read-your-writes consistency",
        "Distributed transactions: two-phase commit, and why it is avoided",
        "Sagas, compensating actions, and the outbox pattern",
      ],
    }),
    createComingSoonModule({
      id: "sd-hld-messaging",
      slug: "messaging-and-streams",
      title: "Messaging & Streams: Queues and Kafka",
      order: 23,
      phase: "Stage 3 · High-Level Design",
      description:
        "How services stop waiting for each other. Queues, logs, and the delivery guarantees that decide whether your consumer can be written naively.",
      topics: [
        "Synchronous against asynchronous, and what decoupling buys",
        "Queues against publish-subscribe against the append-only log",
        "Kafka: topics, partitions, offsets, consumer groups",
        "Ordering guarantees, and the partition key that provides them",
        "At-most-once, at-least-once, and effectively-once by idempotency",
        "Backpressure, lag, dead-letter queues and poison messages",
        "Event-driven architecture, and event sourcing as a storage decision",
        "Stream processing: windows, joins, and late-arriving data",
      ],
    }),
    createComingSoonModule({
      id: "sd-hld-microservices",
      slug: "microservices",
      title: "Microservices & Service Boundaries",
      order: 24,
      phase: "Stage 3 · High-Level Design",
      description:
        "Splitting a system into services, and the honest accounting of what that costs — including the case, made properly, for not doing it.",
      topics: [
        "The monolith, and why it is the correct starting point",
        "Drawing a boundary: bounded contexts and the data each service owns",
        "Service-to-service calls, and the latency you just added",
        "API gateways, service discovery and the service mesh",
        "Resilience: timeouts, retries with jitter, bulkheads, circuit breakers",
        "The distributed monolith, and how to recognise you have built one",
        "Observability: structured logs, metrics, distributed tracing",
        "Deployment: containers, orchestration, blue-green and canaries",
      ],
    }),
    createComingSoonModule({
      id: "sd-hld-scalability",
      slug: "scalability",
      title: "Scalability: Estimating, Measuring & Growing",
      order: 25,
      phase: "Stage 3 · High-Level Design",
      description:
        "Growing a system on purpose. What the numbers say the bottleneck is, what to do about it, and the order in which to do it.",
      topics: [
        "Finding the bottleneck before optimising anything",
        "Latency against throughput, and reading a p99 correctly",
        "Little's law, and queueing theory at a useful depth",
        "Rate limiting: token bucket, leaky bucket, sliding window",
        "Load shedding, graceful degradation and backpressure",
        "Autoscaling, and why it does not save a stateful bottleneck",
        "Multi-region: active-active, active-passive, and data residency",
        "Capacity planning, load testing, and chaos experiments",
      ],
    }),
    createComingSoonModule({
      id: "sd-hld-security",
      slug: "security",
      title: "Security",
      order: 26,
      phase: "Stage 3 · High-Level Design",
      description:
        "The requirement that is never in the prompt and always in the follow-up questions.",
      topics: [
        "Authentication against authorisation, and keeping them separate",
        "Sessions, JWTs, refresh tokens, and revocation",
        "OAuth 2.0 and OpenID Connect, at the level you must be able to draw",
        "Password storage, hashing, and why encryption is the wrong word here",
        "TLS everywhere, certificate management, and encryption at rest",
        "The OWASP Top Ten, and where each one enters a system",
        "Secrets management, key rotation and least privilege",
        "Rate limiting and abuse prevention as security, not just as capacity",
      ],
    }),

    // ---------------------------------------------------------------------
    // Electives — case studies
    //
    // The point of the track. Every one starts from numbers rather than from a
    // diagram, because a design with no constraints cannot be wrong, and
    // something that cannot be wrong cannot teach you anything.
    // ---------------------------------------------------------------------
    createComingSoonModule({
      id: "sd-case-hld",
      slug: "hld-case-studies",
      title: "HLD Case Studies: Chess & Hotstar",
      order: 27,
      phase: "Electives · Case Studies",
      description:
        "Two systems with opposite pressures. A chess site is small data and hard real-time correctness; a live-streaming platform is enormous bandwidth and a tolerance for being a few seconds behind.",
      topics: [
        "Chess: requirements, matchmaking, and estimating concurrent games",
        "Chess: real-time moves over WebSockets, and authoritative game state",
        "Chess: clocks, reconnection, and resolving a disputed position",
        "Hotstar: the traffic spike a live match creates, in actual numbers",
        "Hotstar: ingest, transcoding ladders and adaptive bitrate delivery",
        "Hotstar: CDN strategy, origin shielding and multi-CDN failover",
        "Hotstar: the concurrency record, and what pre-scaling for it looks like",
        "Both: what was traded away, and the follow-up questions to expect",
      ],
    }),
    createComingSoonModule({
      id: "sd-case-lld",
      slug: "lld-case-studies",
      title: "LLD Case Studies: Rate Limiter & Parking Lot",
      order: 28,
      phase: "Electives · Case Studies",
      description:
        "The two most-asked machine-coding problems, taken from a blank file to a working, tested, extensible program — with the design decisions narrated as they are made.",
      topics: [
        "Rate limiter: requirements, and the four algorithms compared honestly",
        "Rate limiter: the class model, and keeping the algorithm swappable",
        "Rate limiter: thread safety, and making it distributed with Redis",
        "Parking lot: the requirements interview before any code",
        "Parking lot: entities, the spot-allocation strategy, and pricing",
        "Parking lot: the extensions they add mid-interview, absorbed cleanly",
        "Both: the tests to write first, under time pressure",
        "Both: how these are scored, and where candidates lose the round",
      ],
    }),
    createComingSoonModule({
      id: "sd-case-frontend",
      slug: "frontend-system-design",
      title: "Frontend System Design: Netflix & WhatsApp Web",
      order: 29,
      phase: "Electives · Case Studies",
      description:
        "The design round that is now standard for senior front-end roles and that almost no material covers. Same discipline, different constraints: the network is hostile, the device is weak, and the user is watching.",
      topics: [
        "What a front-end design round asks for, and how it differs from HLD",
        "Netflix: rendering strategy, the row-based catalogue, and virtualisation",
        "Netflix: image and video delivery, prefetching, and perceived performance",
        "Netflix: state management, personalisation and A/B infrastructure",
        "WhatsApp Web: real-time messaging, delivery receipts and presence",
        "WhatsApp Web: offline-first storage, sync, and conflict resolution",
        "WhatsApp Web: end-to-end encryption in a browser, and its constraints",
        "Both: performance budgets, Core Web Vitals, and accessibility as a requirement",
      ],
    }),
  ],
};
