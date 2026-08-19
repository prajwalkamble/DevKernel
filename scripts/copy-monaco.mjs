/**
 * Copies the Monaco editor out of node_modules and into public/monaco.
 *
 * Monaco is loaded at runtime by an AMD loader that fetches its modules over
 * HTTP, so — exactly like Pyodide — the files have to sit at a URL rather than
 * merely exist in node_modules. Without this, `@monaco-editor/react` falls back
 * to its built-in default and pulls the editor off a public CDN, which has two
 * problems worth fixing rather than living with:
 *
 *   1. The playground and the practice console stop working the moment the CDN
 *      is unreachable — offline, behind a strict CSP, or on a locked-down
 *      network. An editor is not an enhancement on those pages; it *is* the page.
 *   2. That default is pinned to a version of its own. It has been serving
 *      0.55.1 while package.json pins 0.56.0, so the editor running in the
 *      browser was never the one this project declares or types against.
 *
 * Copied rather than committed for the same reason as Pyodide: it is a pinned
 * dependency's build output. public/monaco is gitignored, and `npm run dev` and
 * `npm run build` both run this first so a fresh clone works.
 */
import { createRequire } from "node:module";
import { copyFile, mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Directories under min/vs to leave behind.
 *
 * `nls/lang` is 1.7 MB of translated editor strings, and the loader only
 * requests one when `vs/nls.availableLanguages` names a locale — which nothing
 * here does, so every byte of it would be fetched never. Delete this line if
 * the editor is ever localised.
 */
const SKIP_DIRECTORIES = new Set(["nls/lang"]);

/** Type declarations ship beside the code and no browser ever asks for them. */
const SKIP_EXTENSIONS = new Set([".d.ts"]);

const require = createRequire(import.meta.url);
// monaco-editor's `exports` map sends every subpath — including ./package.json —
// into the ESM tree, so the manifest and the min/vs files cannot be asked for by
// name. The bare specifier can: its `require` condition is ./min/vs/index.js,
// which puts us exactly where the AMD build lives.
const source = path.dirname(require.resolve("monaco-editor"));
const target = path.join(process.cwd(), "public", "monaco", "vs");

let copied = 0;
let skipped = 0;

async function copyTree(from, to, relative) {
  await mkdir(to, { recursive: true });

  for (const entry of await readdir(from, { withFileTypes: true })) {
    const nested = relative ? `${relative}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(nested)) continue;
      await copyTree(path.join(from, entry.name), path.join(to, entry.name), nested);
      continue;
    }

    if ([...SKIP_EXTENSIONS].some((suffix) => entry.name.endsWith(suffix))) continue;

    const sourceFile = path.join(from, entry.name);
    const targetFile = path.join(to, entry.name);

    // Skip files already in place at the right size: this runs before every dev
    // server start, and re-copying 20 MB each time is pure latency.
    const [current, existing] = await Promise.all([
      stat(sourceFile),
      stat(targetFile).catch(() => null),
    ]);
    if (existing && existing.size === current.size) {
      skipped++;
      continue;
    }

    await copyFile(sourceFile, targetFile);
    copied++;
  }
}

await copyTree(source, target, "");

const manifest = JSON.parse(
  await readFile(path.join(source, "..", "..", "package.json"), "utf8")
);
console.log(
  `monaco-editor ${manifest.version} -> public/monaco/vs (${copied} copied, ${skipped} already current)`
);
