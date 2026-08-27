import type { Lesson } from "@/content/types";

export const whereStateLivesLesson: Lesson = {
  id: "react-where-state-lives",
  slug: "choosing-where-state-lives",
  moduleSlug: "context-and-state-architecture",
  title: "Choosing Where State Lives",
  summary:
    "Six homes, and a set of questions that pick one. Most of what teams put in a global store turns out to be server data or a URL parameter, and the decision that matters is made before any of the tools do.",
  estimatedMinutes: 28,
  objectives: [
    "Separate server state, URL state, client state and ephemeral state",
    "Apply an ordered set of questions to place a piece of state",
    "Say why the URL is a first-class state container",
    "Recognise a global store that should have stayed local",
    "Move state back down when it was lifted too far",
  ],
  sections: [
    {
      id: "four-kinds",
      heading: "Four kinds of state, and they are not interchangeable",
      body: [
        "Most arguments about state management are two people talking about different kinds of state. Separating them settles most of it.",
        "**Server state.** Data owned by a server, which you have a copy of. Users, orders, search results. It can be stale — that is its defining property — and it needs caching, revalidation and invalidation. It belongs in a data cache, and module 7's last lesson covered why. It is also, in most applications, *most of the state*, which is why installing a query library so often empties out the global store.",
        "**URL state.** Which page, which tab, which filters, which sort order, which item is open. Its defining property is that it should survive a refresh and be shareable as a link. It belongs in the URL — in the path or the query string — and putting it in React state instead is the most common state-management mistake there is, because everything still works and the feature is quietly broken.",
        "**Client state.** Things the user has done that the server does not know about and the URL should not carry. A half-filled form, a multi-step wizard's progress, an undo stack, an unsent draft. This is what `useState`, reducers, context and stores are for.",
        "**Ephemeral UI state.** Is this dropdown open, is this row hovered, is this tooltip showing. Lives in the component, dies with it, and never goes anywhere else.",
        "The test that separates the first two from the second two: **would you be upset if this were lost on refresh?** Server state is refetched, URL state is restored, client state you may want to persist, ephemeral state should be lost.",
      ],
      pitfalls: [
        {
          title: "The URL is a state container and it is free",
          body: "Filters in `useState` mean the user cannot bookmark a filtered view, cannot share it, loses it on refresh, and gets no back-button behaviour. In the URL, all four work with no extra code — the browser already implements persistence, sharing and history for you. Every filter, tab, sort and pagination cursor should be there. The usual objection is that it is verbose; a `useSearchParams`-style hook makes it as short as `useState`.",
        },
      ],
    },
    {
      id: "questions",
      heading: "The questions, in order",
      body: [
        "Given a piece of client state, ask these in order and stop at the first yes.",
        "**1. Can it be computed from something else?** Then it is not state. Compute it during render — module 7, lesson 1.",
        "**2. Does it come from the server?** Then it belongs in the data cache, not in your state at all.",
        "**3. Should it survive a refresh or be shareable?** Then it belongs in the URL.",
        "**4. Does only one component use it?** Then `useState` in that component. This is the answer for most state, and the one people talk themselves out of.",
        "**5. Do a few components in one subtree use it?** Then lift it to their nearest common ancestor and pass props — or, better, compose so that fewer components need it.",
        "**6. Is it read across the tree and changed rarely?** Then context.",
        "**7. Is it read across the tree and changed often?** Then a store, for the selectors.",
        "Most pieces of state stop at 1, 2, 3 or 4. If everything in your application is reaching 6 or 7, the ordering has gone wrong somewhere earlier — usually at 2.",
      ],
    },
    {
      id: "nearest-ancestor",
      heading: "Lift to the nearest common ancestor — and no further",
      body: [
        "\"Lifting state up\" gets taught as a direction. It is a *destination*: the nearest common ancestor of the components that actually need the value.",
        "The failure is lifting past it. State goes up to fix one problem, the tree gets refactored, and nobody moves it back — so a value used by two sibling leaves lives at the root, drilled through six components or published to the whole application through a context.",
        "**Moving state back down is a real refactor and it is usually easy.** Find every consumer, find their nearest common ancestor, and move the `useState` there. The compiler finds the props that no longer exist.",
        "The signal that it is time: a provider whose consumers are all inside one route; a context read by three components that are siblings; a prop threaded through a chain where every component in it is in the same file.",
      ],
      pitfalls: [
        {
          title: "State at the root has a lifetime you did not choose",
          body: "State lives as long as the component holding it. At the root, that is the whole session — so a wizard's progress at the root is still there when the user comes back an hour later, and a filter at the root persists across a route change that should have cleared it. Putting state at the narrowest useful level gives you the right lifetime for free, with no cleanup code.",
        },
      ],
    },
    {
      id: "smells",
      heading: "Signals that state is in the wrong place",
      body: [
        "**A global store with a `currentPage` in it.** That is URL state.",
        "**A store slice named after a screen.** `checkoutPage.step` is that screen's state, and it should live in that screen so it is discarded when the user leaves.",
        "**Two pieces of state kept in step by an effect.** They are one piece of state in two places. Module 7, lesson 1.",
        "**A context read by exactly one component.** That is a global variable with a provider around it. Make it a prop.",
        "**State that is set in one place and read in one place, three levels apart.** Either move it down to the reader or compose so the writer builds the reader's element.",
        "**A store holding fetched data.** Server state in a client-state container: it has no staleness model, no revalidation, and no invalidation, so somebody will write all three by hand.",
      ],
    },
    {
      id: "worked",
      heading: "A worked placement",
      body: [
        "One screen — a product list with filters, a cart, and a details modal — with every piece of state placed by the questions above.",
      ],
      examples: [
        {
          id: "placement",
          title: "Where each piece goes, and why",
          lang: "tsx",
          code: `function ProductsRoute() {
  // 3. Shareable and survives refresh -> the URL.
  //    Bookmarkable, back-button works, no code for either.
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "all";
  const sort = params.get("sort") ?? "popular";
  const openId = params.get("open");          // which modal is open: also the URL

  // 2. Owned by the server -> the data cache. Keyed by the URL state, so
  //    changing a filter refetches and a repeat visit is instant.
  const { data: products, isPending } = useProducts({ category, sort });

  // 1. Derived -> computed, not stored.
  const visible = useMemo(
    () => products?.filter((p) => p.inStock) ?? [],
    [products],
  );

  // 4. Only this component uses it -> useState, right here.
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  // 6/7. The cart is read across the tree and lives above this route.
  //      A context is enough; it changes a few times per session.
  const cart = useCart();

  return (
    <Layout>
      <Filters category={category} sort={sort} onChange={setParams} />
      <ProductGrid products={showOutOfStock ? products ?? [] : visible} />
      {openId && <ProductModal id={openId} onClose={() => setParams({})} />}
      <CartBadge count={cart.items.length} />
    </Layout>
  );
}`,
          explanation:
            "Count what is left in React state: one boolean. Everything else is in the URL, in the cache, computed, or in a context that was already there for a reason. That ratio is normal for a well-placed screen, and it is the reason \"which state manager?\" is a smaller question than it looks.",
        },
      ],
      pitfalls: [
        {
          title: "Which modal is open belongs in the URL more often than not",
          body: "It makes the modal linkable, closes it with the back button — which is what users press — and survives a refresh. The exceptions are modals that must not be re-openable from a link: a confirmation, an unsaved-changes prompt, anything mid-transaction. Those are ephemeral state, and they should be lost.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you decide where a piece of state should live?",
      answer:
        "In order: can it be computed, in which case it is not state; does it come from the server, in which case it belongs in a data cache; should it survive a refresh or be shareable, in which case it belongs in the URL; does one component use it, in which case `useState` there; do a few in one subtree, in which case their nearest common ancestor; is it read across the tree and changed rarely, in which case context; changed often, in which case a store for the selectors. Most state stops in the first four.",
    },
    {
      question: "What kinds of state are there?",
      answer:
        "Server state — a cached copy of data someone else owns, which can go stale and needs revalidation and invalidation. URL state — which page, filters, sort, which item is open, all of which should survive a refresh and be shareable. Client state — drafts, wizard progress, undo stacks. And ephemeral UI state, which should die with the component. They need different tools, and most disagreements about state management are two people talking about different ones.",
    },
    {
      question: "Why should filters live in the URL?",
      answer:
        "Because the browser already implements persistence, sharing and history. In the URL, a filtered view is bookmarkable, shareable, survives a refresh and responds to the back button, all with no code. In `useState` none of that works, and the feature still looks finished — which is what makes it the most common state-management mistake rather than an obvious one.",
    },
    {
      question: "What are the signs that state is in the wrong place?",
      answer:
        "A global store holding a current page or a screen-specific step; a context read by exactly one component; two pieces of state kept in step by an effect; fetched data in a client-state store, with no staleness model. And the broadest one: state at the root that only one subtree uses, which also gives it the wrong lifetime — it survives navigation that should have cleared it.",
    },
  ],
  takeaways: [
    "Server, URL, client and ephemeral state are four different things needing four different tools",
    "Ask in order: computed, server, URL, one component, one subtree, context, store",
    "Most state stops in the first four questions",
    "The URL is a state container that gives you sharing, refresh survival and the back button for free",
    "Lift to the *nearest* common ancestor — lifting past it is the usual failure",
    "State at the root has a session-long lifetime you did not choose",
    "A context read by one component is a global variable with a provider around it",
    "Installing a data cache usually empties most of the global store, because most of it was server state",
  ],
  status: "available",
};
