import type { TrackDefinition } from "@/content/types";
import { createComingSoonModule } from "@/content/comingSoon";

/**
 * Modern Angular — standalone components, signals, the new control flow — not
 * AngularJS 1.x, which is a different framework that happens to share a name.
 *
 * Two decisions shape the order. Inputs and outputs get their own module (4)
 * because they are Angular's answer to props and the question people arrive
 * with. Signals arrive immediately afterwards, before services and RxJS,
 * because signals are now the default way to hold state and teaching the
 * RxJS-first version would be teaching the previous generation of Angular.
 */
export const angularTrack: TrackDefinition = {
  id: "angular",
  slug: "angular",
  title: "Angular",
  shortTitle: "Angular",
  tagline: "Standalone components, signals, and a framework with batteries included",
  description:
    "Angular from scratch to mastery, on the modern framework: standalone components, signals, the built-in control flow, and the new reactivity model — not AngularJS 1.x, which is a separate and long-superseded framework. You start with the CLI and your first component, learn templates and binding, then inputs and outputs (Angular's props), signals for state, dependency injection, routing, both forms systems, RxJS and HTTP, change detection and performance, server-side rendering with hydration, testing, and the architecture decisions large Angular codebases turn on.",
  order: 6,
  status: "coming-soon",
  accent: "angular",
  mode: "learn",
  lessonMinutes: [25, 40],
  interviewPrep: true,
  runnable: false,
  modules: [
    createComingSoonModule({
      id: "angular-foundations",
      slug: "foundations",
      title: "What Angular Is & Your First App",
      order: 1,
      description:
        "What kind of framework Angular is and who it is for, then a running application: the CLI, the project layout, and your first component on screen.",
      topics: [
        "What Angular is, and how a batteries-included framework differs from a library",
        "Angular against AngularJS 1.x — different frameworks, similar name",
        "Installing the CLI, and creating an app with ng new",
        "The project structure, and what every generated file is for",
        "Bootstrapping: main.ts, the root component, and standalone APIs",
        "Your first component: the decorator, the template and the styles",
        "TypeScript and decorators, and why Angular leans on both",
        "ng serve, ng build, and the development loop",
      ],
    }),
    createComingSoonModule({
      id: "angular-templates",
      slug: "components-and-templates",
      title: "Components, Templates & Binding",
      order: 2,
      description:
        "The template syntax: interpolation, the three kinds of binding, and the control flow that replaced the structural directives.",
      topics: [
        "The component decorator: selector, template, styles and encapsulation",
        "Interpolation, and expressions the template may contain",
        "Property binding with [ ], and attribute against property",
        "Event binding with ( ), and $event",
        "Two-way binding with [( )], and what the banana-in-a-box expands to",
        "The built-in control flow: @if, @for, @switch and @defer",
        "track in @for, and why it matters as much as React's key",
        "View encapsulation, component styles, and :host",
      ],
    }),
    createComingSoonModule({
      id: "angular-directives",
      slug: "directives-and-pipes",
      title: "Directives & Pipes",
      order: 3,
      description:
        "Extending the template: attribute directives that change behaviour, and pipes that transform values on the way to the screen.",
      topics: [
        "Attribute directives, and writing your own",
        "ngClass and ngStyle, and the binding shorthands that often replace them",
        "Structural directives, and what *ngIf and *ngFor still mean in older code",
        "Host bindings and host listeners",
        "Built-in pipes: date, currency, number, json and async",
        "Writing a custom pipe, and pure against impure",
        "The async pipe, and subscription management for free",
        "When a directive is the right answer instead of a component",
      ],
    }),
    createComingSoonModule({
      id: "angular-io",
      slug: "inputs-outputs-communication",
      title: "Inputs, Outputs & Component Communication",
      order: 4,
      description:
        "Angular's equivalent of props: passing data down with inputs, sending events up with outputs, and the signal-based versions that replaced the decorators.",
      topics: [
        "input() and the signal-based input API",
        "Required inputs, defaults, aliases and transforms",
        "The @Input decorator, for the code you will still meet",
        "output() and emitting events to a parent",
        "model() and two-way bound inputs",
        "Content projection with ng-content, and multi-slot projection",
        "Template variables, ViewChild and ContentChild",
        "Designing a component API: what belongs as an input at all",
      ],
    }),
    createComingSoonModule({
      id: "angular-signals",
      slug: "signals-and-state",
      title: "Signals & Reactive State",
      order: 5,
      description:
        "Angular's current reactivity model: values that know who is reading them, and the change detection that follows from that.",
      topics: [
        "What a signal is, and how it differs from a plain property",
        "signal(), set, update, and reading a signal in a template",
        "computed(), and derived state that caches",
        "effect(), and when you actually want one",
        "linkedSignal and resource(), for state derived from async work",
        "Signals against RxJS: which to reach for, and how to convert",
        "toSignal and toObservable",
        "Migrating a component from properties to signals, step by step",
      ],
    }),
    createComingSoonModule({
      id: "angular-di",
      slug: "services-and-di",
      title: "Services & Dependency Injection",
      order: 6,
      description:
        "The part of Angular that most distinguishes it: a real dependency injection container, and how to use it without fighting it.",
      topics: [
        "Services, and moving logic out of components",
        "@Injectable, providedIn, and the root injector",
        "inject() against constructor injection",
        "Injection tokens, and providing values that are not classes",
        "The injector hierarchy: root, route and element injectors",
        "useClass, useValue, useFactory and useExisting",
        "Optional, Self, SkipSelf and Host",
        "Testing with injected dependencies, and swapping providers",
      ],
    }),
    createComingSoonModule({
      id: "angular-routing",
      slug: "routing-and-navigation",
      title: "Routing & Navigation",
      order: 7,
      description:
        "The router: mapping URLs to components, loading code on demand, and guarding what should not be reachable.",
      topics: [
        "Defining routes, and the router outlet",
        "routerLink, active links, and programmatic navigation",
        "Route parameters, query parameters and the data property",
        "Child routes, nested outlets and layout routes",
        "Lazy loading with loadComponent and loadChildren",
        "Guards: canActivate, canMatch and canDeactivate as functions",
        "Resolvers, and having data ready before the component renders",
        "Route-level providers, and scoping a service to a feature",
      ],
    }),
    createComingSoonModule({
      id: "angular-forms",
      slug: "forms",
      title: "Forms: Template-driven & Reactive",
      order: 8,
      description:
        "Both form systems, why Angular has two, and how to build a validated form that behaves well.",
      topics: [
        "Template-driven forms with ngModel, and where they fit",
        "Reactive forms: FormControl, FormGroup and FormArray",
        "Typed reactive forms, and what strict typing catches",
        "Built-in validators, and writing a custom one",
        "Async validators, and validating against a server",
        "Displaying errors at the right time: touched, dirty and submitted",
        "Dynamic forms built from a schema",
        "Building a custom form control with ControlValueAccessor",
      ],
    }),
    createComingSoonModule({
      id: "angular-http",
      slug: "http-and-rxjs",
      title: "HTTP, RxJS & Async Data",
      order: 9,
      description:
        "Talking to a server, and the reactive library Angular is built on — the parts of RxJS you genuinely need, not the whole catalogue.",
      topics: [
        "HttpClient, provideHttpClient, and making a request",
        "Observables against promises, and cold against hot",
        "The operators that matter: map, filter, switchMap, catchError, tap",
        "switchMap, mergeMap, concatMap and exhaustMap, and choosing correctly",
        "Interceptors: auth headers, retries and error handling in one place",
        "Unsubscribing, takeUntilDestroyed, and leaks",
        "Error handling and retry strategies",
        "The resource API, and where it replaces hand-rolled loading state",
      ],
    }),
    createComingSoonModule({
      id: "angular-change-detection",
      slug: "change-detection-performance",
      title: "Change Detection & Performance",
      order: 10,
      description:
        "How Angular decides to re-render, what zoneless changes, and the work that actually makes an Angular app fast.",
      topics: [
        "Change detection, and what triggers a check",
        "Zone.js, and what monkey-patching the browser bought",
        "OnPush, and the contract it asks you to keep",
        "Zoneless Angular, and signals as the trigger instead",
        "@defer, and deferring work until it is needed",
        "trackBy and track, and avoiding needless DOM work",
        "Bundle size, lazy loading and the build budget",
        "Profiling with Angular DevTools, and reading the results",
      ],
    }),
    createComingSoonModule({
      id: "angular-ssr",
      slug: "ssr-and-hydration",
      title: "Server-Side Rendering & Hydration",
      order: 11,
      description:
        "Rendering Angular on the server: what changes, what breaks, and how hydration reuses the HTML you already sent.",
      topics: [
        "Client-side rendering, and the cost of an empty index.html",
        "Angular SSR: what the server renders and what it sends",
        "Hydration, and reusing server HTML instead of re-rendering",
        "Incremental hydration, and hydrating on interaction",
        "Prerendering (SSG), and routes known ahead of time",
        "Code that cannot run on the server: window, document and localStorage",
        "TransferState, and not fetching the same data twice",
        "Deploying an SSR Angular app",
      ],
    }),
    createComingSoonModule({
      id: "angular-testing",
      slug: "testing",
      title: "Testing",
      order: 12,
      description:
        "Testing an Angular application at each layer, using the tooling the framework provides.",
      topics: [
        "TestBed, and configuring a testing module",
        "Testing a component's template and behaviour",
        "Testing with signals and OnPush",
        "Mocking services and overriding providers",
        "Testing HTTP with HttpTestingController",
        "fakeAsync, tick and waitForAsync",
        "Harnesses, and testing components through a supported API",
        "End-to-end testing, and what belongs there instead",
      ],
    }),
    createComingSoonModule({
      id: "angular-architecture",
      slug: "architecture-and-state",
      title: "Architecture, State Management & Libraries",
      order: 13,
      description:
        "Structuring an Angular application that several people work on, and choosing a state approach that matches its size.",
      topics: [
        "Feature-based structure, and what replaced the module-per-feature habit",
        "Standalone components, and migrating away from NgModules",
        "Smart and presentational components, in Angular terms",
        "State with signals and services, for most applications",
        "NgRx, NgRx SignalStore, and when a store earns its complexity",
        "Component libraries: Angular Material and the CDK",
        "Nx, monorepos, and shared internal libraries",
        "Internationalisation and accessibility",
      ],
    }),
    createComingSoonModule({
      id: "angular-mastery",
      slug: "advanced-and-mastery",
      title: "Advanced Angular & Interview Mastery",
      order: 14,
      description:
        "The consolidation pass: the parts of Angular that only come up in large codebases, plus the questions interviews use to find out whether you understand the framework or just its syntax.",
      topics: [
        "Dynamic component creation and ViewContainerRef",
        "Custom structural directives, and the template context",
        "Angular Elements, and shipping a component as a web component",
        "Writing a schematic, and automating repetitive work",
        "Upgrading across major versions, and what ng update does",
        "Reading unfamiliar Angular and reviewing it well",
        "The classic interview questions, answered properly",
        "An architecture walkthrough for a real feature, end to end",
      ],
    }),
  ],
};
