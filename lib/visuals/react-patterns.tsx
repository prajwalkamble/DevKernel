/**
 * Composition patterns, and the two places a component tree stops matching the
 * thing the user is actually dealing with.
 *
 * The compound-component and portal generators walk *real* element trees, the
 * same ones the lessons print — so the context lookup that finds a provider six
 * levels up is a search over the tree's real shape, and the divergence between
 * the React tree and the DOM tree is produced by running two different walks
 * over one tree rather than by drawing two pictures.
 *
 * The focus-order generator implements the specification's sequential focus
 * navigation order. That algorithm is the entire reason `tabindex="1"` is a bug
 * rather than a preference, and implementing it is the only way to show why
 * without asking anybody to take it on trust.
 */
import type { ReactNode } from "react";
import { layout, read, type ElNode } from "./react";
import {
  Recorder,
  type Role,
  type SequenceFrame,
  type TreeFrame,
  type Visualisation,
} from "./types";

/* ------------------------------------------------- 1. compound components -- */

function Tabs({ children }: { children?: ReactNode }) { return children; }
Tabs.displayName = "Tabs";
function TabList({ children }: { children?: ReactNode }) { return children; }
TabList.displayName = "TabList";
function Tab() { return null; }
Tab.displayName = "Tab";
function Fancy({ children }: { children?: ReactNode }) { return children; }
Fancy.displayName = "Fancy";
function Panel() { return null; }
Panel.displayName = "Panel";

/**
 * A user's markup, including the thing that breaks every other API design: a
 * consumer wrapped in a component the library has never heard of.
 */
const COMPOUND_TREE = (
  <Tabs>
    <TabList>
      <Tab />
      <Fancy>
        <Tab />
      </Fancy>
    </TabList>
    <Panel />
  </Tabs>
);

/** The components that read the shared state, and the one that provides it. */
const PROVIDER = "Tabs";
const CONSUMERS = new Set(["Tab", "Panel"]);

function compoundRun(): Visualisation {
  const rec = new Recorder<TreeFrame>();
  const root = read(COMPOUND_TREE, "c")!;
  const roles = new Map<string, Role>();
  const badges = new Map<string, string>([["Tabs", "provides {active, select}"]]);

  const emit = (note: string) =>
    rec.push({ kind: "tree", nodes: layout(root, roles, badges), note });

  emit("A compound component as its user writes it. <Tabs> owns the state; the pieces are ordinary children, arranged however the page needs them.");

  /* The real lookup: nearest provider above, found by walking the ancestor
     stack — which is what makes depth irrelevant. */
  const walk = (node: ElNode, ancestors: ElNode[]) => {
    if (node.label === PROVIDER) {
      roles.set(node.id, "active");
      rec.bump("providers");
      emit("Tabs renders a context provider around its children. It does not inspect them, clone them, or care how many there are.");
    } else if (CONSUMERS.has(node.label)) {
      const provider = [...ancestors].reverse().find((a) => a.label === PROVIDER);
      rec.bump("lookups");
      if (provider) {
        roles.set(node.id, "mounted");
        const depth = ancestors.length - ancestors.indexOf(provider);
        emit(`${node.label} calls useTabs(), which reads the nearest provider above it — ${depth} level${depth === 1 ? "" : "s"} up. Nothing was passed down by hand, and nothing between them had to know this prop existed.`);
      } else {
        roles.set(node.id, "unmounted");
        emit(`${node.label} has no Tabs above it. The hook throws with a sentence saying so, which is the entire error-handling story of this pattern.`);
      }
    } else {
      roles.set(node.id, "unchanged");
      rec.bump("pass-through");
      emit(`${node.label} is not part of the library at all. It renders its children and knows nothing — and that is why the second Tab still works.`);
    }
    for (const child of node.children) walk(child, [...ancestors, node]);
  };

  walk(root, []);

  emit("The second Tab is wrapped in a component the library has never heard of, and it found the state anyway. That is the difference between a compound component and a `tabs={[…]}` prop: the arrangement is the caller's, not the library's.");

  return {
    frames: rec.frames,
    summary:
      "A compound component splits one widget into several, and shares state between them through context rather than props. The consumer arranges the pieces — wraps them, reorders them, puts something in between — and every piece still finds the state, because the lookup walks up the tree rather than along a list. The cost is a runtime error rather than a type error when a piece is used outside its parent, which is why the hook should throw with a sentence naming both components.",
  };
}

/* --------------------------------------------------------------- 2. portals -- */

function Page({ children }: { children?: ReactNode }) { return children; }
Page.displayName = "Page";
function Card2({ children }: { children?: ReactNode }) { return children; }
Card2.displayName = "Card";
function Modal({ children }: { children?: ReactNode }) { return children; }
Modal.displayName = "Modal";
function Dialog() { return null; }
Dialog.displayName = "Dialog";
function Footer() { return null; }
Footer.displayName = "Footer";

const PORTAL_TREE = (
  <Page>
    <Card2>
      <Modal>
        <Dialog />
      </Modal>
    </Card2>
    <Footer />
  </Page>
);

/** The component whose children are rendered through createPortal. */
const PORTALS = new Set(["Modal"]);

/**
 * One tree, two walks.
 *
 * The React tree is the element tree as written. The DOM tree is the same tree
 * with every portal's children re-parented to the root — which is exactly what
 * `createPortal` does. Both are computed here, so the divergence between them
 * is a product of the same input rather than two hand-drawn pictures that could
 * disagree with each other.
 */
function portalRun(): Visualisation {
  const rec = new Recorder<TreeFrame>();
  const root = read(PORTAL_TREE, "p")!;

  const reactRoles = new Map<string, Role>();
  const badges = new Map<string, string>([["Card", "overflow:hidden"]]);

  const emit = (tree: ElNode, roles: Map<string, Role>, note: string) =>
    rec.push({ kind: "tree", nodes: layout(tree, roles, badges), note });

  emit(root, reactRoles, "The React tree, as written. Dialog is inside Modal, inside Card, inside Page.");

  for (const id of ["Modal", "Dialog"]) {
    const found = [root, ...root.children.flatMap((c) => [c, ...c.children.flatMap((g) => [g, ...g.children])])]
      .find((n) => n.label === id);
    if (found) reactRoles.set(found.id, "active");
  }
  emit(root, reactRoles, "Context flows down this tree, so Dialog reads Card's theme. Events bubble up this tree, so a click inside Dialog reaches Card's onClick. Both of those stay true no matter what the DOM does.");

  /* The DOM walk: a portal's children are attached to the root instead of to
     their element parent. Everything else is unchanged. */
  const reparent = (node: ElNode): ElNode => {
    const moved: ElNode[] = [];
    const rebuild = (n: ElNode): ElNode => {
      const kept: ElNode[] = [];
      for (const child of n.children) {
        if (PORTALS.has(child.label)) {
          for (const grandchild of child.children) moved.push(rebuild(grandchild));
          continue;
        }
        kept.push(rebuild(child));
      }
      return { ...n, children: kept };
    };
    const next = rebuild(node);
    return { ...next, children: [...next.children, ...moved] };
  };

  const dom = reparent(root);
  const domRoles = new Map<string, Role>();
  const dialog = dom.children.find((c) => c.label === "Dialog");
  if (dialog) domRoles.set(dialog.id, "moved");
  rec.bump("nodes moved", 1);
  emit(dom, domRoles, "The DOM tree, after createPortal. The same Dialog node is now a child of the root — Card's overflow:hidden, its z-index and its stacking context no longer apply to it, which is the entire reason to reach for a portal.");

  emit(dom, domRoles, "Two trees, one component. React's tree decides context and event bubbling; the DOM tree decides clipping, stacking and where a screen reader meets the element. A portal moves the second without moving the first — which is useful, and is also why a click inside a portalled modal can still close the dropdown that rendered it.");

  return {
    frames: rec.frames,
    summary:
      "createPortal renders children into a different DOM node while leaving them exactly where they are in the React tree. Context still flows to them and their events still bubble to their React ancestors — a fact that surprises people the first time a click inside a portalled modal closes the menu that opened it. What changes is everything the DOM owns: clipping by an ancestor's overflow, z-index stacking, and document order for assistive technology. Which is why the last of those has to be handled explicitly, with focus management and aria-modal, rather than assumed.",
  };
}

/* ---------------------------------------------------------- 3. focus order -- */

interface Focusable {
  id: string;
  label: string;
  /** Undefined means "natively focusable, no tabindex attribute". */
  tabindex?: number;
  disabled?: boolean;
  native: boolean;
}

/** A dialog somebody has "fixed" by adding tabindex numbers. */
const FIELDS: Focusable[] = [
  { id: "f1", label: "close", native: true },
  { id: "f2", label: "name", native: true, tabindex: 1 },
  { id: "f3", label: "email", native: true },
  { id: "f4", label: "note", native: false, tabindex: 0 },
  { id: "f5", label: "cancel", native: true, disabled: true },
  { id: "f6", label: "save", native: true, tabindex: 2 },
  { id: "f7", label: "help", native: false },
];

/**
 * Sequential focus navigation order, as the specification defines it.
 *
 * Positive tabindex values first, ascending, ties broken by document order;
 * then everything with tabindex="0" or native focusability, in document order.
 * Disabled elements and elements with a negative tabindex are not in the order
 * at all. The bewildering result below is what that algorithm produces for the
 * markup above — not an exaggeration of it.
 */
function focusRun(): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const order: Focusable[] = [];

  const emit = (note: string, active?: string) =>
    rec.push({
      kind: "sequence",
      items: FIELDS.map((f) => ({
        id: f.id,
        label: f.label,
        role: f.id === active ? "active"
          : order.some((o) => o.id === f.id) ? "unchanged"
            : f.disabled || (!f.native && f.tabindex === undefined) ? "discarded"
              : undefined,
      })),
      pins: Object.fromEntries(
        FIELDS.map((f, i) => [i, f.tabindex === undefined ? (f.native ? "—" : "n/a") : `tabindex=${f.tabindex}`])
      ),
      note,
    });

  emit("A dialog, in the order it appears in the markup. Two of the fields have been given positive tabindex values by someone trying to fix the tab order.");

  const eligible = FIELDS.filter((f) => !f.disabled && (f.native || f.tabindex !== undefined) && (f.tabindex ?? 0) >= 0);
  for (const skipped of FIELDS.filter((f) => !eligible.includes(f))) {
    rec.bump("not focusable");
    emit(
      skipped.disabled
        ? `${skipped.label} is disabled, so it is not in the tab order at all — and neither is its tooltip, which is a real accessibility problem with disabled buttons.`
        : `${skipped.label} is a <div> with no tabindex. Not natively focusable, so the keyboard cannot reach it however many click handlers it has.`,
      skipped.id
    );
  }

  /* The spec's two groups, in the spec's order. */
  const positive = eligible.filter((f) => (f.tabindex ?? 0) > 0)
    .sort((a, b) => (a.tabindex! - b.tabindex!) || FIELDS.indexOf(a) - FIELDS.indexOf(b));
  const rest = eligible.filter((f) => (f.tabindex ?? 0) === 0);

  for (const field of positive) {
    order.push(field);
    rec.bump("tab stops");
    emit(`Tab ${order.length}: ${field.label}. Everything with a positive tabindex comes first, in ascending numeric order — ahead of the entire rest of the document, not just this dialog.`, field.id);
  }
  for (const field of rest) {
    order.push(field);
    rec.bump("tab stops");
    emit(`Tab ${order.length}: ${field.label}. Only now does the document order start, and it starts from the top of the page.`, field.id);
  }

  emit(`The final order is ${order.map((f) => f.label).join(" → ")}. Nobody wanted that. The close button, first in the markup, is reached third.`);

  return {
    frames: rec.frames,
    summary:
      "Sequential focus navigation puts every element with a positive tabindex first, in ascending order, ahead of the whole document — then everything else in document order. So a single tabindex=\"1\" does not move one element up by one; it moves it in front of every other focusable thing on the page, and a second one starts an ordering nobody can maintain. The two values worth using are 0, which adds a non-interactive element to the natural order, and -1, which makes an element focusable by script only — for the container you move focus to when a dialog opens. Everything else is fixed by changing the DOM order.",
  };
}

/* --------------------------------------------------------------- registry -- */

export const REACT_PATTERN_ALGOS = {
  compound: { label: "A compound component finding its state", run: compoundRun },
  portal: { label: "A portal: two trees, one component", run: portalRun },
  "focus-order": { label: "Tab order, as the browser computes it", run: focusRun },
} as const;

export type ReactPatternAlgoName = keyof typeof REACT_PATTERN_ALGOS;
