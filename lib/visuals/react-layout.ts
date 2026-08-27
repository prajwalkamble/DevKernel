/**
 * Where the files go — a React project's layout, animated by running the
 * rearrangement rather than by drawing two pictures side by side.
 *
 * The trick that makes this honest is `listing()`. Nothing here writes an
 * indented tree by hand: a layout is a flat list of paths, and the directory
 * structure is *derived* from those paths by splitting on "/" and grouping.
 * So when `regroup()` moves `src/components/CartLine.tsx` to
 * `src/features/cart/CartLine.tsx`, the `components/` directory disappears
 * because nothing is left in it — not because a second hand-drawn tree omits
 * it. A layout that claimed to collapse a folder while leaving a file behind
 * would render with the folder still there, which is exactly the failure a
 * drawn diagram hides.
 *
 * The scaffold below is not remembered either. It is the output of
 * `npm create vite@latest my-app -- --template react-ts` on create-vite 9.2.0,
 * read off disk, with the notes written against the files' real contents.
 */
import { Recorder, type FileEntry, type FileTreeFrame, type Role, type Visualisation } from "./types";

/* ------------------------------------------------------------- the listing -- */

/** A file in a layout: where it is, and what it is for. */
interface SrcFile {
  path: string;
  note?: string;
  role?: Role;
}

interface DirNode {
  children: Map<string, DirNode>;
  files: SrcFile[];
}

function emptyDir(): DirNode {
  return { children: new Map(), files: [] };
}

/**
 * A flat list of paths as an indented listing.
 *
 * Directories come before files at every level and both are sorted, which is
 * what `tree` does and what every editor's sidebar does — so a reader comparing
 * this with their own project is comparing like with like.
 */
function listing(files: SrcFile[]): FileEntry[] {
  const root = emptyDir();

  for (const file of files) {
    const parts = file.path.split("/");
    const name = parts.pop()!;
    let dir = root;
    for (const part of parts) {
      if (!dir.children.has(part)) dir.children.set(part, emptyDir());
      dir = dir.children.get(part)!;
    }
    dir.files.push({ ...file, path: name });
  }

  const out: FileEntry[] = [];
  const walk = (dir: DirNode, depth: number, prefix: string) => {
    for (const name of [...dir.children.keys()].sort()) {
      out.push({ id: `${prefix}${name}/`, name: `${name}/`, depth, kind: "dir" });
      walk(dir.children.get(name)!, depth + 1, `${prefix}${name}/`);
    }
    for (const file of [...dir.files].sort((a, b) => a.path.localeCompare(b.path))) {
      out.push({
        id: `${prefix}${file.path}`,
        name: file.path,
        depth,
        kind: "file",
        note: file.note,
        role: file.role,
      });
    }
  };
  walk(root, 0, "");
  return out;
}

/**
 * A directory takes the role of its contents when all of them agree.
 *
 * Without this, moving every file out of `components/` highlights six rows and
 * leaves the folder they are leaving unmarked, which is the one row the eye is
 * looking for.
 */
function rollUp(entries: FileEntry[]): FileEntry[] {
  return entries.map((entry, i) => {
    if (entry.kind !== "dir") return entry;
    const inside: FileEntry[] = [];
    for (let j = i + 1; j < entries.length && entries[j].depth > entry.depth; j++) {
      if (entries[j].kind === "file") inside.push(entries[j]);
    }
    if (inside.length === 0) return entry;
    const first = inside[0].role;
    return inside.every((f) => f.role === first) ? { ...entry, role: first } : entry;
  });
}

/* ------------------------------------------------------------- 1. scaffold -- */

/**
 * Every file `create-vite` writes, and what each one is for.
 *
 * Read off a real generated project; see the module comment. The notes are
 * short because they sit in a column beside the name — the lesson prose is
 * where the reasoning lives.
 */
const SCAFFOLD: SrcFile[] = [
  { path: ".gitignore", note: "node_modules, dist, editor noise" },
  { path: ".oxlintrc.json", note: "lint rules — rules-of-hooks is on" },
  { path: "README.md", note: "the four commands, nothing more" },
  { path: "index.html", note: "the real page; React mounts into #root" },
  { path: "package.json", note: "dependencies and the four scripts" },
  { path: "tsconfig.json", note: "empty — it only references the other two" },
  { path: "tsconfig.app.json", note: "settings for src/, which runs in a browser" },
  { path: "tsconfig.node.json", note: "settings for vite.config.ts, which runs in Node" },
  { path: "vite.config.ts", note: "one plugin: @vitejs/plugin-react" },
  { path: "public/favicon.svg", note: "copied verbatim, fetched as /favicon.svg" },
  { path: "public/icons.svg", note: "same — never touched by the build" },
  { path: "src/main.tsx", note: "the entry point: createRoot(…).render(…)" },
  { path: "src/App.tsx", note: "the root component" },
  { path: "src/App.css", note: "styles imported by App.tsx" },
  { path: "src/index.css", note: "global styles, imported by main.tsx" },
  { path: "src/assets/hero.png", note: "imported by code, so hashed and inlined" },
  { path: "src/assets/react.svg", note: "same — an import, not a URL" },
  { path: "src/assets/vite.svg", note: "same" },
];

/** What the animation says as it reaches each file. */
const SCAFFOLD_NOTES: Record<string, string> = {
  "index.html":
    "index.html is the whole page a visitor receives. One empty <div id=\"root\">, and a module script pointing at TypeScript source.",
  "package.json":
    "package.json holds two dependencies — react and react-dom — and four scripts: dev, build, lint, preview.",
  "tsconfig.json":
    "tsconfig.json has \"files\": [] and two references. It compiles nothing itself; it is a solution file pointing at the two real configs.",
  "tsconfig.app.json":
    "tsconfig.app.json covers src/. It is the browser half: DOM types, \"jsx\": \"react-jsx\", and noEmit, because Vite does the emitting.",
  "tsconfig.node.json":
    "tsconfig.node.json covers vite.config.ts, which runs in Node rather than in the browser. Two environments, two configs — that is the whole reason there are three files.",
  "vite.config.ts":
    "vite.config.ts is four lines and one plugin. Everything else is a default you have not had to think about yet.",
  ".oxlintrc.json":
    ".oxlintrc.json is the linter's config, and rules-of-hooks is set to error. Newer scaffolds use oxlint rather than ESLint; the rule you care about is on either way.",
  "public/favicon.svg":
    "public/ is copied to the output byte for byte and referenced by URL. Nothing in it is hashed, bundled or checked.",
  "public/icons.svg":
    "A missing file in public/ is a 404 at runtime. A missing import in src/ is a build error. That difference is the whole reason to prefer src/.",
  "src/main.tsx":
    "src/main.tsx is the entry point, and the seam between the page and React: createRoot takes the div, render gives it a tree.",
  "src/App.tsx":
    "src/App.tsx is the root component. Everything you build hangs off this one, which is why the next question is how to organise what hangs off it.",
  "src/index.css":
    "index.css is imported from main.tsx. Importing CSS from JavaScript is a build-tool feature, not a language one.",
  "src/assets/hero.png":
    "src/assets/ holds files that code imports. The build hashes them, inlines the small ones, and fails loudly when one is missing.",
};

function scaffold(): Visualisation {
  const rec = new Recorder<FileTreeFrame>();
  const seen = new Set<string>();

  const emit = (current: string | null, note: string) =>
    rec.push({
      kind: "filetree",
      root: "my-app/",
      entries: rollUp(
        listing(
          SCAFFOLD.map((file) => ({
            ...file,
            role: file.path === current ? "active" : seen.has(file.path) ? "unchanged" : undefined,
          }))
        )
      ),
      note,
    });

  emit(null, "Eighteen files, and none of them are mysterious. Five minutes here saves an hour later.");

  for (const file of SCAFFOLD) {
    const note = SCAFFOLD_NOTES[file.path];
    if (!note) continue;
    rec.bump("explained");
    emit(file.path, note);
    seen.add(file.path);
  }

  emit(
    null,
    "Notice what is not here: no components/, no hooks/, no routes/. The generator refuses to guess at your structure, which means the next decision is yours."
  );

  return {
    frames: rec.frames,
    summary:
      "A fresh Vite project is configuration at the root and your code in src/. The two directories people confuse are public/, which is copied verbatim and fetched by URL, and src/assets/, which your code imports so the build can hash it and fail when it is missing. Nothing in the scaffold suggests a folder structure — that part is left to you.",
  };
}

/* ----------------------------------------------------- 2/3. type or feature -- */

/**
 * One mid-sized app's files, tagged with the feature each belongs to.
 *
 * The layout below is the one almost every tutorial produces: a folder per
 * *kind of file*. The tags are what make the regrouping runnable — nothing
 * hard-codes the second tree.
 */
interface AppFile {
  /** Where it sits in the by-type layout. */
  path: string;
  /** The feature it belongs to, or null when it genuinely serves all of them. */
  feature: string | null;
  /** The file's own name, once the folder no longer says what kind it is. */
  base: string;
}

const APP: AppFile[] = [
  { path: "src/components/CartLine.tsx", feature: "cart", base: "CartLine.tsx" },
  { path: "src/components/CartTotal.tsx", feature: "cart", base: "CartTotal.tsx" },
  { path: "src/components/ProductCard.tsx", feature: "catalog", base: "ProductCard.tsx" },
  { path: "src/components/ProductGrid.tsx", feature: "catalog", base: "ProductGrid.tsx" },
  { path: "src/components/Button.tsx", feature: null, base: "Button.tsx" },
  { path: "src/components/Spinner.tsx", feature: null, base: "Spinner.tsx" },
  { path: "src/hooks/useCart.ts", feature: "cart", base: "useCart.ts" },
  { path: "src/hooks/useProducts.ts", feature: "catalog", base: "useProducts.ts" },
  { path: "src/hooks/useDebounce.ts", feature: null, base: "useDebounce.ts" },
  { path: "src/api/cart.ts", feature: "cart", base: "api.ts" },
  { path: "src/api/products.ts", feature: "catalog", base: "api.ts" },
  { path: "src/api/client.ts", feature: null, base: "client.ts" },
  { path: "src/types/cart.ts", feature: "cart", base: "types.ts" },
  { path: "src/types/product.ts", feature: "catalog", base: "types.ts" },
  { path: "src/utils/currency.ts", feature: null, base: "currency.ts" },
];

/** Where a file lands once the folders are named after features. */
function regroup(file: AppFile): string {
  return file.feature === null
    ? `src/shared/${file.path.split("/")[1]}/${file.base}`
    : `src/features/${file.feature}/${file.base}`;
}

function byType(): Visualisation {
  const rec = new Recorder<FileTreeFrame>();

  const emit = (roleOf: (file: AppFile) => Role | undefined, note: string) =>
    rec.push({
      kind: "filetree",
      root: "src/",
      entries: rollUp(
        listing(
          APP.map((file) => ({
            path: file.path.slice("src/".length),
            role: roleOf(file),
          }))
        )
      ),
      note,
    });

  emit(() => undefined, "Fifteen files, in a folder per kind of file. This is what almost every tutorial produces, and for fifteen files it is fine.");

  for (const folder of ["components", "hooks", "api", "types", "utils"]) {
    emit(
      (file) => (file.path.startsWith(`src/${folder}/`) ? "active" : undefined),
      `${folder}/ answers "what kind of thing is this?". Every ${folder === "components" ? "component" : folder === "hooks" ? "hook" : "file of that kind"} in the app is in here, whatever it is about.`
    );
  }

  emit(
    (file) => (file.feature === "cart" ? "active" : undefined),
    "Now ask the question you actually ask at work: where is the cart? Five files, in four different directories."
  );

  emit(
    (file) => (file.feature === "cart" ? "active" : file.feature === "catalog" ? "updated" : undefined),
    "The catalog is scattered the same way, and interleaved with it. Nothing in the layout says these two are separate things."
  );

  emit(
    (file) => (file.feature === null ? "unchanged" : undefined),
    "And the six genuinely shared files — Button, Spinner, useDebounce, the fetch client, currency — are mixed in with the feature-specific ones. Deleting a feature means visiting every folder and guessing."
  );

  return {
    frames: rec.frames,
    summary:
      "Grouping by kind of file answers a question nobody asks. You never look for \"all the hooks\"; you look for the cart, and the cart is spread across four folders with no line around it. It scales to about twenty files, which is exactly long enough to feel like the right decision.",
  };
}

function byFeature(): Visualisation {
  const rec = new Recorder<FileTreeFrame>();
  /* Each file's current home, mutated as the regrouping runs. The listing is
     rebuilt from this map every frame, so a folder vanishes exactly when its
     last file leaves. */
  const at = new Map<AppFile, string>(APP.map((file) => [file, file.path]));

  const emit = (roleOf: (file: AppFile) => Role | undefined, note: string) =>
    rec.push({
      kind: "filetree",
      root: "src/",
      entries: rollUp(
        listing(APP.map((file) => ({ path: at.get(file)!.slice("src/".length), role: roleOf(file) })))
      ),
      note,
    });

  emit(() => undefined, "The same fifteen files, grouped by kind. Watch what happens to the folders as each one moves.");

  for (const feature of ["cart", "catalog"]) {
    const mine = APP.filter((file) => file.feature === feature);
    for (const file of mine) {
      at.set(file, regroup(file));
      rec.bump("moved");
      emit(
        (f) => (f === file ? "moved" : at.get(f)!.includes(`/features/${feature}/`) ? "unchanged" : undefined),
        `${file.path.split("/").pop()} belongs to the ${feature}, so it moves to features/${feature}/. Its name changes too: api.ts inside cart/ does not need to be called cart.ts.`
      );
    }
    emit(
      (f) => (f.feature === feature ? "unchanged" : undefined),
      `The whole ${feature} is now one directory. Deleting the feature is deleting a folder, and nothing outside it can be silently left behind.`
    );
  }

  for (const file of APP.filter((f) => f.feature === null)) {
    at.set(file, regroup(file));
    rec.bump("moved");
    emit(
      (f) => (f === file ? "moved" : undefined),
      `${file.base} is used by both features, so it is genuinely shared and keeps its by-kind folder — under shared/, where "what kind of thing is this?" is the right question again.`
    );
  }

  emit(
    (f) => (f.feature === null ? "created" : undefined),
    "shared/ is small on purpose. A file earns its place here by having a second caller, not by looking reusable."
  );

  emit(
    () => undefined,
    "Two features, one shared layer, and every import that crosses a feature boundary is now visible as a path containing features/ or shared/."
  );

  return {
    frames: rec.frames,
    summary:
      "Grouping by feature puts a boundary where the work is. A feature is one folder, so it can be read, reviewed, handed over and deleted as a unit — and the shared layer is what is left when you only promote a file after its second caller. The by-kind folders survive inside shared/, because there the question really is what kind of thing it is.",
  };
}

/* ------------------------------------------------------------ 4. colocation -- */

/** What one component's folder holds once it is more than a single file. */
const COLOCATED: { path: string; note: string; when: string }[] = [
  {
    path: "Button/Button.tsx",
    note: "the component",
    when: "Button.tsx moves into a folder of its own name. Nothing about it changes.",
  },
  {
    path: "Button/Button.module.css",
    note: "styles, scoped to this file",
    when: "Its styles move next to it. A CSS module's class names are local, so this file cannot leak into another component.",
  },
  {
    path: "Button/Button.test.tsx",
    note: "the test",
    when: "The test moves next to the thing it tests. A component you delete takes its test with it, instead of leaving one behind that still passes.",
  },
  {
    path: "Button/Button.stories.tsx",
    note: "the isolated examples",
    when: "Stories, if you use them, go here too — same rule, same reason.",
  },
  {
    path: "Button/useButtonRipple.ts",
    note: "a hook only Button uses",
    when: "And a hook only Button uses. It is not shared, so it does not belong in a shared hooks/ folder — it belongs here, where deleting Button deletes it.",
  },
  {
    path: "Button/index.ts",
    note: "re-exports Button",
    when: "index.ts re-exports Button, so importers still write \"./Button\" rather than \"./Button/Button\". One line, and it is the only file outside code should import.",
  },
];

function colocate(): Visualisation {
  const rec = new Recorder<FileTreeFrame>();
  const others: SrcFile[] = [
    { path: "Card.tsx" },
    { path: "Spinner.tsx" },
  ];

  const emit = (files: SrcFile[], note: string) =>
    rec.push({ kind: "filetree", root: "src/components/", entries: rollUp(listing(files)), note });

  emit(
    [{ path: "Button.tsx", note: "one file, and growing" }, ...others],
    "One file per component works until a component acquires a second file. Then the question is where that file goes."
  );

  emit(
    [
      { path: "Button.tsx", role: "active" },
      { path: "Button.module.css", role: "created" },
      { path: "Button.test.tsx", role: "created" },
      ...others,
    ],
    "The flat answer: keep adding files beside it. Three files, sorted alphabetically — and with twenty components that is sixty rows with the pieces of each one no longer adjacent."
  );

  const grown: SrcFile[] = [];
  for (const step of COLOCATED) {
    grown.push({ path: step.path, note: step.note, role: "created" });
    rec.bump("files");
    emit(
      [...grown.map((f, i) => ({ ...f, role: i === grown.length - 1 ? ("created" as Role) : undefined })), ...others],
      step.when
    );
  }

  emit(
    [...grown.map((f) => ({ ...f, role: undefined })), ...others],
    "Everything that changes when Button changes is now in one place, and everything else in components/ is untouched."
  );

  emit(
    [
      ...grown.map((f) => ({ ...f, role: f.path.endsWith("index.ts") ? ("active" as Role) : ("deleted" as Role) })),
      ...others,
    ],
    "The payoff is deletion. Remove the folder and every trace of Button goes with it — no orphaned test, no unreferenced stylesheet, no hook left in a shared folder that nothing calls."
  );

  return {
    frames: rec.frames,
    summary:
      "Colocation is one rule: a file lives next to the thing that uses it, and moves outward only when a second thing uses it. A component's folder holds its markup, its styles, its test and any hook private to it, with index.ts as the single public entrance — so the unit you read, review and delete is the same unit in every case.",
  };
}

/* --------------------------------------------------- 5. where state lives -- */

/**
 * One feature's state, placed a file at a time.
 *
 * The tree is built from paths like every other listing here, so the claim
 * being made — that each kind of state has one obvious home and nothing needs
 * a top-level `store/` — is visible as a shape rather than asserted in prose.
 */
const STATE_FILES: { path: string; note: string; when: string }[] = [
  {
    path: "features/cart/CartPage.tsx",
    note: "useState for what only it needs",
    when: "Start at the leaf. Whether a row is expanded, what is typed in a field, whether a menu is open — that is useState in the component, and most state never leaves here.",
  },
  {
    path: "features/cart/cartReducer.ts",
    note: "(state, action) => state",
    when: "When the transitions get rules — merge quantities, refuse a duplicate, clear on checkout — they move into a reducer. It is a plain function, so it sits in its own file and is tested by calling it.",
  },
  {
    path: "features/cart/CartProvider.tsx",
    note: "useReducer + two providers",
    when: "The provider is the only place the reducer is wired to React. It creates the state and publishes it — as two contexts, so a component that only dispatches does not re-render when the value changes.",
  },
  {
    path: "features/cart/useCart.ts",
    note: "the hook components import",
    when: "One hook per context, each throwing when there is no provider above it. Components import these and never import the context objects — which is what lets the internals change without touching a caller.",
  },
  {
    path: "features/cart/index.ts",
    note: "the feature's front door",
    when: "The barrel exports the provider and the hooks, and nothing else. cartReducer and the context objects stay internal.",
  },
  {
    path: "app/providers.tsx",
    note: "where the providers are nested",
    when: "One file that nests every provider the app has. Without it, App.tsx accumulates a staircase of providers and every new feature deepens it.",
  },
  {
    path: "shared/stores/session.ts",
    note: "a store, no provider needed",
    when: "State that is genuinely global and read by unrelated features — the signed-in user, the theme — is a store rather than a context. It needs no provider, so it does not appear in the tree at all.",
  },
];

function stateLayout(): Visualisation {
  const rec = new Recorder<FileTreeFrame>();
  const placed: SrcFile[] = [];

  const emit = (note: string) =>
    rec.push({ kind: "filetree", root: "src/", entries: rollUp(listing(placed)), note });

  placed.push({ path: "features/cart/CartPage.tsx", note: STATE_FILES[0].note, role: "created" });
  emit(STATE_FILES[0].when);

  for (const step of STATE_FILES.slice(1)) {
    for (const file of placed) file.role = undefined;
    placed.push({ path: step.path, note: step.note, role: "created" });
    rec.bump("files");
    emit(step.when);
  }

  for (const file of placed) file.role = undefined;
  emit(
    "Seven files, and no top-level store/ directory. Each kind of state sits with the feature that owns it, and only the two genuinely app-wide things live outside."
  );

  return {
    frames: rec.frames,
    summary:
      "State architecture is mostly a filing question. Component state stays in the component; a reducer becomes a plain function in its own file; the provider is the single place that wires it to React; and hooks are what the rest of the feature imports, so the context objects never leave the folder. A top-level store/ directory is the thing to avoid — it pulls every feature's state into one place that every feature then depends on.",
  };
}

/* -------------------------------------------------- 6. where hooks belong -- */

/**
 * A hook moving outward as it acquires callers.
 *
 * Each frame moves one file and rebuilds the listing from the paths, so the
 * folder a hook leaves collapses on its own when it was the only thing in it —
 * which is the point being made. A hook does not start in `shared/hooks/`; it
 * arrives there, and only after a second feature imports it.
 */
function hooksLayout(): Visualisation {
  const rec = new Recorder<FileTreeFrame>();

  /* Fixed context, so the eye can track the one file that moves. */
  const fixed: SrcFile[] = [
    { path: "features/cart/CartPage.tsx" },
    { path: "features/cart/CartLine.tsx" },
    { path: "features/checkout/AddressForm.tsx" },
  ];

  /* The moving file replaces any fixed entry at the same path rather than
     joining it — step 1 annotates CartLine.tsx, it does not add a second one. */
  const emit = (moving: SrcFile | null, note: string) =>
    rec.push({
      kind: "filetree",
      root: "src/",
      entries: rollUp(
        listing(
          moving
            ? [...fixed.filter((f) => f.path !== moving.path), moving]
            : fixed
        )
      ),
      note,
    });

  emit(null, "Three components. A piece of logic inside CartLine is about to become a hook.");

  emit(
    { path: "features/cart/CartLine.tsx", note: "the hook is a function in this file", role: "active" },
    "Step 1: extract it, and leave it in the file. A hook used once belongs next to its only caller — it does not need a file, and giving it one is ceremony."
  );

  emit(
    { path: "features/cart/useLineTotal.ts", note: "used by two files in this feature", role: "created" },
    "Step 2: CartPage needs it too. Two callers inside one feature, so it becomes a file in that feature's folder — still nowhere anyone outside can reach."
  );

  emit(
    { path: "shared/hooks/useMoneyTotal.ts", note: "used by two features", role: "moved" },
    "Step 3: checkout needs it. Now — and only now — it moves to shared/hooks/, and it gets a name that does not mention the cart, because it no longer belongs to one."
  );

  emit(
    { path: "shared/hooks/useMoneyTotal.ts", note: "one home, two importers", role: undefined },
    "Three steps, one rule: a hook moves outward when it gains a caller, never in anticipation of one. Going the other way — starting in shared/hooks/ — is how that folder becomes a junk drawer of single-caller hooks."
  );

  return {
    frames: rec.frames,
    summary:
      "A custom hook's home is decided by how many things call it, and it moves one step at a time: inline in the file that uses it, then a file in the feature when a second component wants it, then the shared layer when a second feature does. The rename at the last step matters — a hook that keeps a feature's vocabulary in its name has not really been shared.",
  };
}

/* ------------------------------------------------------------------- table -- */

export const REACT_LAYOUT_ALGOS = {
  scaffold: {
    label: "A fresh Vite project, file by file",
    run: scaffold,
  },
  "by-type": {
    label: "Grouped by kind of file",
    run: byType,
  },
  "by-feature": {
    label: "Regrouped by feature",
    run: byFeature,
  },
  colocate: {
    label: "Colocating one component",
    run: colocate,
  },
  "state-layout": {
    label: "Where a feature's state lives",
    run: stateLayout,
  },
  "hooks-layout": {
    label: "Where a custom hook belongs",
    run: hooksLayout,
  },
} as const;

export type ReactLayoutName = keyof typeof REACT_LAYOUT_ALGOS;
