/**
 * Copies the Pyodide runtime out of node_modules and into public/pyodide.
 *
 * The practice console runs real CPython, compiled to WebAssembly, in a Web
 * Worker. Pyodide fetches its own payload over HTTP at load time, so the files
 * have to be reachable at a URL rather than merely present in node_modules —
 * hence a copy into public/ rather than an import.
 *
 * They are copied instead of committed because they are ~13 MB of build output
 * belonging to a pinned dependency: public/pyodide is gitignored, and `npm run
 * dev` and `npm run build` both run this first so a fresh clone works.
 *
 * Only these five files are needed. The package also ships source maps, two
 * demo pages, the ESM/CJS variants we do not load and the type declarations,
 * which together are most of its weight.
 */
import { createRequire } from "node:module";
import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const FILES = [
  "pyodide.mjs",
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
];

const require = createRequire(import.meta.url);
const source = path.dirname(require.resolve("pyodide/package.json"));
const target = path.join(process.cwd(), "public", "pyodide");

await mkdir(target, { recursive: true });

let copied = 0;
let skipped = 0;

for (const name of FILES) {
  const from = path.join(source, name);
  const to = path.join(target, name);

  // Skip files already in place at the right size: this runs before every dev
  // server start, and re-copying 9.6 MB of wasm each time is pure latency.
  const [src, dest] = await Promise.all([stat(from), stat(to).catch(() => null)]);
  if (dest && dest.size === src.size) {
    skipped++;
    continue;
  }

  await copyFile(from, to);
  copied++;
}

const version = require("pyodide/package.json").version;
console.log(
  `pyodide ${version} -> public/pyodide (${copied} copied, ${skipped} already current)`
);
