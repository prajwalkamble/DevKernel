/**
 * Runs every visualisation and checks the frames it produces are well-formed.
 *
 * This is the frame-level half of the visual gate. Its companion,
 * `verify-visual-playback.mjs`, drives a real browser and proves the player
 * actually advances; it needs a running server and several minutes. This one
 * needs neither, so it can run on every change.
 *
 * What it catches that nothing else does:
 *
 *   - A role or marker pinned to an index the array does not have. The canvas
 *     renders those silently — the highlight simply does not appear — so a
 *     pointer that stops being drawn looks like an algorithm that stopped
 *     moving it.
 *   - A `visual` spec naming an algorithm that no table has. `FamilyVisual`
 *     falls back to the family default, and with `lockAlgorithm: true` the
 *     picker is hidden, so a typo shows a *different algorithm* under the
 *     lesson's own title with nothing on screen to say so.
 *   - A generator that emits one frame, or none. There is nothing to animate,
 *     and the player has no way to say so.
 *
 * Usage: npm run verify:frames
 */
import { tracks } from "@/content/tracks";
import type { VisualSpec } from "@/content/types";
import type { Frame, Role, Visualisation } from "@/lib/visuals/types";
import { SORTERS } from "@/lib/visuals/sorting";
import { SEARCHERS } from "@/lib/visuals/searching";
import {
  DEFAULT_ARRAY, DEFAULT_SORTED, FAMILIES, STRUCTURE_TITLE, resolveVisual, runStructure,
  type StructureKind,
} from "@/lib/visuals/resolve";

const ROLES: Role[] = [
  "compare", "swap", "pivot", "sorted", "active", "window", "discarded", "found",
  "mounted", "updated", "unchanged", "unmounted", "moved", "created", "deleted",
  "suspended", "stale", "server", "client",
];

const problems: string[] = [];
let checked = 0;
let frameCount = 0;

function fail(where: string, what: string) {
  problems.push(`${where}: ${what}`);
}

/** Index keys have to be integers that actually exist in the row they point at. */
function checkIndexMap(
  where: string, field: string, map: Record<number, unknown> | undefined, length: number
) {
  if (!map) return;
  for (const key of Object.keys(map)) {
    const i = Number(key);
    if (!Number.isInteger(i) || i < 0 || i >= length) {
      fail(where, `${field} key ${key} is outside 0..${length - 1}`);
    }
  }
}

function checkRoles(where: string, roles: Record<number | string, Role> | undefined) {
  if (!roles) return;
  for (const [key, role] of Object.entries(roles)) {
    if (!ROLES.includes(role)) fail(where, `role "${role}" at ${key} is not a known role`);
  }
}

function checkStats(where: string, stats: Record<string, number> | undefined) {
  if (!stats) return;
  for (const [name, value] of Object.entries(stats)) {
    if (!Number.isFinite(value)) fail(where, `stat "${name}" is ${value}`);
  }
}

function checkFrame(where: string, frame: Frame, index: number) {
  const at = `${where} frame ${index}`;
  if (!frame.note || !frame.note.trim()) fail(at, "has no note");
  checkStats(at, frame.stats);

  switch (frame.kind) {
    case "array":
    case "heap": {
      if (!Array.isArray(frame.values)) return fail(at, "values is not an array");
      for (const [i, v] of frame.values.entries()) {
        if (!Number.isFinite(v)) fail(at, `values[${i}] is ${v}`);
      }
      checkIndexMap(at, "roles", frame.roles, frame.values.length);
      checkRoles(at, frame.roles);
      if (frame.kind === "array") checkIndexMap(at, "markers", frame.markers, frame.values.length);
      break;
    }
    case "tree": {
      const ids = new Set<string>();
      for (const node of frame.nodes) {
        if (ids.has(node.id)) fail(at, `two nodes share the id "${node.id}"`);
        ids.add(node.id);
        if (!Number.isFinite(node.x) || node.depth < 0) fail(at, `node "${node.id}" has no place`);
        if (node.role && !ROLES.includes(node.role)) fail(at, `node "${node.id}" has role "${node.role}"`);
      }
      for (const node of frame.nodes) {
        if (node.parent !== undefined && !ids.has(node.parent)) {
          fail(at, `node "${node.id}" names a parent "${node.parent}" that is not in the frame`);
        }
      }
      break;
    }
    case "sequence": {
      checkIndexMap(at, "pins", frame.pins, frame.items.length);
      for (const [i, item] of frame.items.entries()) {
        if (item.label === undefined || item.label === null) fail(at, `items[${i}] has no label`);
        if (item.role && !ROLES.includes(item.role)) fail(at, `items[${i}] has role "${item.role}"`);
      }
      break;
    }
    case "buckets": {
      for (const [i, bucket] of frame.buckets.entries()) {
        if (!bucket.key) fail(at, `buckets[${i}] has no key`);
        if (bucket.role && !ROLES.includes(bucket.role)) fail(at, `buckets[${i}] has role "${bucket.role}"`);
      }
      break;
    }
    case "graph": {
      const ids = new Set(frame.nodes.map((n) => n.id));
      for (const node of frame.nodes) {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) fail(at, `node "${node.id}" has no place`);
        if (node.role && !ROLES.includes(node.role)) fail(at, `node "${node.id}" has role "${node.role}"`);
      }
      for (const edge of frame.edges) {
        if (!ids.has(edge.from) || !ids.has(edge.to)) {
          fail(at, `edge ${edge.from}->${edge.to} names a node that is not in the frame`);
        }
        if (edge.role && !ROLES.includes(edge.role)) fail(at, `edge ${edge.from}->${edge.to} has role "${edge.role}"`);
      }
      break;
    }
    case "filetree": {
      const ids = new Set<string>();
      let previous = -1;
      for (const entry of frame.entries) {
        if (ids.has(entry.id)) fail(at, `two entries share the id "${entry.id}"`);
        ids.add(entry.id);
        if (!Number.isInteger(entry.depth) || entry.depth < 0) {
          fail(at, `entry "${entry.id}" has depth ${entry.depth}`);
        }
        // A row may only ever indent by one from the row above it; anything
        // deeper means a directory row was never emitted, and the connectors
        // the canvas derives would attach the entry to the wrong parent.
        if (entry.depth > previous + 1) {
          fail(at, `entry "${entry.id}" is at depth ${entry.depth} under a row at depth ${previous}`);
        }
        if (!entry.name) fail(at, `entry "${entry.id}" has no name`);
        if (entry.role && !ROLES.includes(entry.role)) {
          fail(at, `entry "${entry.id}" has role "${entry.role}"`);
        }
        previous = entry.depth;
      }
      break;
    }
    case "matrix": {
      const width = frame.cells[0]?.length ?? 0;
      for (const [r, row] of frame.cells.entries()) {
        if (row.length !== width) fail(at, `row ${r} has ${row.length} cells where row 0 has ${width}`);
      }
      if (frame.rowLabels && frame.rowLabels.length !== frame.cells.length) {
        fail(at, `${frame.rowLabels.length} row labels for ${frame.cells.length} rows`);
      }
      if (frame.colLabels && frame.colLabels.length !== width) {
        fail(at, `${frame.colLabels.length} column labels for ${width} columns`);
      }
      for (const key of Object.keys(frame.roles)) {
        const [r, c] = key.split(",").map(Number);
        if (!Number.isInteger(r) || !Number.isInteger(c)
            || r < 0 || r >= frame.cells.length || c < 0 || c >= width) {
          fail(at, `role key "${key}" is outside the grid`);
        }
      }
      checkRoles(at, frame.roles);
      break;
    }
  }
}

function check(where: string, vis: Visualisation) {
  checked += 1;
  frameCount += vis.frames.length;
  if (!vis.summary || !vis.summary.trim()) fail(where, "has no summary");
  if (vis.frames.length < 2) {
    fail(where, `produced ${vis.frames.length} frame(s); there is nothing to animate`);
  }
  vis.frames.forEach((frame, i) => checkFrame(where, frame, i));
}

/* Every entry in every table, whether or not a lesson points at it: the picker
   can reach all of them. */
for (const [name, entry] of Object.entries(SORTERS)) {
  check(`sorting/${name}`, entry.run(DEFAULT_ARRAY));
}
for (const [name, entry] of Object.entries(SEARCHERS)) {
  const values = [...DEFAULT_SORTED].sort((a, b) => a - b);
  check(`searching/${name}`, entry.run(values, values[values.length - 2]));
}
for (const [family, { table }] of Object.entries(FAMILIES)) {
  for (const [name, entry] of Object.entries(table as Record<string, { run: () => Visualisation }>)) {
    check(`${family}/${name}`, entry.run());
  }
}
for (const kind of Object.keys(STRUCTURE_TITLE) as StructureKind[]) {
  check(`structure/${kind}`, runStructure(kind, { id: "probe", kind }, 0));
}

/* Then every spec a lesson actually declares, resolved the way the page does. */
function algorithmExists(spec: VisualSpec): boolean {
  if (!spec.algorithm) return true;
  if (spec.kind === "sorting") return spec.algorithm in SORTERS;
  if (spec.kind === "searching") return spec.algorithm in SEARCHERS;
  if (spec.kind in FAMILIES) {
    return spec.algorithm in FAMILIES[spec.kind as keyof typeof FAMILIES].table;
  }
  return false;   // structures take no algorithm, so naming one is a mistake
}

let specs = 0;
for (const track of tracks) {
  for (const mod of track.modules) {
    for (const lesson of mod.lessons) {
      for (const section of lesson.sections) {
        if (!section.visual) continue;
        specs += 1;
        const spec = section.visual;
        const where = `${track.slug}/${mod.slug}/${lesson.slug} › ${spec.id}`;
        if (!algorithmExists(spec)) {
          fail(where, `algorithm "${spec.algorithm}" is not offered by kind "${spec.kind}"`
            + (spec.lockAlgorithm ? " — and the picker is locked, so nothing on the page would say so" : ""));
          continue;
        }
        check(where, resolveVisual(spec));
      }
    }
  }
}

/* The language dropdown belongs to the tracks where one program genuinely
   exists in two languages, and nowhere else. A C++ course's examples are C++
   because that is the subject; offering to read one "in Python" would be
   incoherent, and the JS/TS track shows its two languages side by side rather
   than behind a picker.

   Two shapes qualify. DSA carries a translation per interview language. The
   framework tracks carry each example twice — as JSX and as TSX for React and
   Next, as JavaScript and TypeScript for Angular — because the same component
   really is written both ways, and the reader has already picked a side.

   The pairs are pinned per track rather than merely allowing a dropdown,
   because the failure worth catching is not "a dropdown appeared" but "a
   React example offers to be read in Python". */
const DROPDOWN_LANGUAGES = new Map<string, ReadonlySet<string>>([
  ["dsa", new Set(["python", "java", "cpp", "rust", "go", "javascript", "typescript", "asm"])],
  // jsx/tsx for components, javascript/typescript for the plain modules a
  // React lesson also carries — a hook file with no JSX in it is not JSX.
  ["react", new Set(["jsx", "tsx", "javascript", "typescript"])],
  ["nextjs", new Set(["jsx", "tsx", "javascript", "typescript"])],
  ["angular", new Set(["javascript", "typescript"])],
]);

let alternates = 0;
const dropdownsByTrack = new Map<string, number>();
for (const track of tracks) {
  const allowed = DROPDOWN_LANGUAGES.get(track.slug);
  for (const mod of track.modules) {
    for (const lesson of mod.lessons) {
      for (const section of lesson.sections) {
        for (const example of section.examples ?? []) {
          if (!example.alternates?.length) continue;
          alternates += 1;
          dropdownsByTrack.set(track.slug, (dropdownsByTrack.get(track.slug) ?? 0) + 1);
          const where = `${track.slug}/${mod.slug}/${lesson.slug} \u203a ${example.id}`;
          if (!allowed) {
            fail(where, `carries translations, but ${track.slug} has no language dropdown`);
            continue;
          }
          for (const lang of [example.lang, ...example.alternates.map((v) => v.lang)]) {
            if (lang && !allowed.has(lang)) {
              fail(where, `offers ${lang}, which is not one of ${track.slug}'s dropdown languages`);
            }
          }
        }
      }
    }
  }
}

console.log(`${checked} visualisations run, ${frameCount} frames checked, ${specs} lesson specs resolved.`);
const spread = [...dropdownsByTrack].map(([t, n]) => `${t} ${n}`).join(", ");
console.log(`${alternates} examples carry a language dropdown (${spread}).`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("no problems.");
