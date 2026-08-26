/**
 * Runs every code example in the curriculum and checks its printed output.
 *
 * The rule this enforces: no `output` field in a lesson is ever written by hand.
 * A learner who types an example in and gets something different from what the
 * page promised has no way to tell whether they made a mistake or the page did,
 * and on the second occurrence they stop trusting the whole track. Recalled
 * output is the single easiest way to lose that trust, so it is checked by
 * machine instead.
 *
 *   node scripts/verify-lesson-code.mjs                       # every track
 *   node scripts/verify-lesson-code.mjs dsa                   # one track
 *   node scripts/verify-lesson-code.mjs dsa the-framework     # one module
 *
 * An example is checked when it declares a `lang` this runner has a toolchain
 * for *and* has an `output`. Examples with no `output` are illustrations rather
 * than promises and are skipped; so are the other languages, which have no
 * toolchain here.
 *
 * Not every example is a whole program — a lesson showing one method body is
 * still run before its output is written down, just inside a harness that is not
 * on the page. Those cannot be re-run standalone and will report a mismatch
 * here, which is why this takes a module filter: point it at the module you are
 * writing rather than reading the whole tree as a pass/fail gate.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();

/**
 * How long one example may take.
 *
 * Generous on purpose. The n-queens pruning example measures an unpruned
 * 19-million-node search and lands within a couple of seconds of two minutes,
 * so a 120s limit made it pass or fail depending on what else the machine was
 * doing. A slow example is a slow example; a flaky one is a broken signal.
 */
const RUN_TIMEOUT_MS = 300000;

/**
 * Languages checked for a lesson's *primary* example.
 *
 * Still deliberately short. Turning the full set on here also starts checking
 * the C++ and Rust tracks, whose examples are written against particular build
 * invocations this runner does not reproduce — `-Wall` for the warning
 * lessons, `g++ -E` for the preprocessor one, a deliberate non-zero exit for
 * another, and a few that print timings and so can never match. Those examples
 * are not wrong; this runner is simply not how they are meant to be built, and
 * making it so is its own piece of work.
 *
 * `tsx` and `jsx` are here because the React track's promise is the same as
 * every other track's: the markup printed under an example is what React
 * really produces for that tree, not what it was remembered to produce. See
 * `runReact`.
 */
const RUNNABLE = new Set(["java", "python", "go", "tsx", "jsx"]);

/**
 * Languages checked for a *translation*.
 *
 * Translations are plain programs written to be run exactly this way — no
 * diagnostics, no special flags — so the whole toolchain set is safe here.
 * Every one is a real compiler: the dropdown promises the same program in
 * another language, and an unverified translation makes that a lie.
 */
const TRANSLATABLE = new Set([
  "java", "python", "go", "cpp", "rust", "javascript", "typescript", "asm",
]);
const onlyTrack = process.argv[2];
const onlyModule = process.argv[3];

const build = mkdtempSync(path.join(tmpdir(), "devkernel-lessons-"));
const work = mkdtempSync(path.join(tmpdir(), "devkernel-run-"));

function cleanup() {
  rmSync(build, { recursive: true, force: true });
  rmSync(work, { recursive: true, force: true });
  rmSync(reactWork, { recursive: true, force: true });
}

/**
 * The content tree is TypeScript with `@/` imports. Compiling it to CommonJS and
 * resolving the alias by hand is a good deal simpler than adding a bundler, and
 * it means this script checks the same objects the site renders.
 */
function compileContent() {
  const tsconfig = path.join(build, "tsconfig.json");
  writeFileSync(
    tsconfig,
    JSON.stringify({
      compilerOptions: {
        target: "es2022",
        module: "commonjs",
        moduleResolution: "node",
        esModuleInterop: true,
        skipLibCheck: true,
        strict: false,
        baseUrl: ROOT,
        paths: { "@/*": ["./*"] },
        // Pinned, or tsc infers it from the inputs and drops the `content/`
        // prefix the `@/` alias then expects to find.
        rootDir: ROOT,
        outDir: path.join(build, "out"),
      },
      include: [path.join(ROOT, "content/**/*.ts")],
    })
  );
  execFileSync("npx", ["tsc", "-p", tsconfig], { stdio: "pipe" });
}

function loadTracks() {
  const require = createRequire(import.meta.url);
  const outRoot = path.join(build, "out");
  // tsc leaves `@/…` specifiers in the emit untouched, so they are resolved here.
  const Module = require("node:module");
  const original = Module._resolveFilename;
  Module._resolveFilename = function (request, ...rest) {
    if (request.startsWith("@/")) {
      return original.call(this, path.join(outRoot, request.slice(2)), ...rest);
    }
    return original.call(this, request, ...rest);
  };
  return require(path.join(outRoot, "content/tracks/index.js")).tracks;
}

/** Wraps a bare Java snippet in the smallest class that will run it. */
function javaProgram(code) {
  if (/\b(class|interface|enum|record)\s+\w/.test(code)) return code;
  const indented = code
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : `        ${line}`))
    .join("\n");
  return `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n${indented}\n    }\n}\n`;
}

function runJava(code) {
  const dir = path.join(work, "java");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "Main.java");
  writeFileSync(file, javaProgram(code));
  const result = spawnSync("java", [file], {
    encoding: "utf8",
    timeout: RUN_TIMEOUT_MS,
    maxBuffer: 16 * 1024 * 1024,
  });
  return { text: (result.stdout ?? "") + (result.stderr ?? ""), status: result.status };
}

/**
 * Go examples run as whole programs rather than as snippets.
 *
 * Unlike the Java and Python runners, nothing is wrapped: a Go example already
 * carries its `package main` and its imports, because Go refuses to compile an
 * unused import and so a snippet cannot be given a fixed preamble. Each example
 * gets its own directory so that two of them declaring `main` never collide.
 */
let goSeq = 0;

function runGo(code) {
  const dir = path.join(work, `go${goSeq++}`);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "main.go");
  writeFileSync(file, code);
  const result = spawnSync("go", ["run", file], {
    encoding: "utf8",
    timeout: RUN_TIMEOUT_MS,
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, GOFLAGS: "-mod=mod", GOTOOLCHAIN: "local" },
  });
  return { text: (result.stdout ?? "") + (result.stderr ?? ""), status: result.status };
}

function runPython(code) {
  const file = path.join(work, "snippet.py");
  writeFileSync(file, code);
  const result = spawnSync("python3", [file], {
    encoding: "utf8",
    timeout: RUN_TIMEOUT_MS,
    maxBuffer: 16 * 1024 * 1024,
  });
  return { text: (result.stdout ?? "") + (result.stderr ?? ""), status: result.status };
}

let cppSeq = 0;

function runCpp(code) {
  const dir = path.join(work, `cpp${cppSeq++}`);
  mkdirSync(dir, { recursive: true });
  const src = path.join(dir, "main.cpp");
  const bin = path.join(dir, "a.out");
  writeFileSync(src, code);
  const compiled = spawnSync("g++", ["-std=c++20", "-O0", "-o", bin, src], {
    encoding: "utf8", timeout: RUN_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024,
  });
  if (compiled.status !== 0) {
    return { text: (compiled.stdout ?? "") + (compiled.stderr ?? ""), status: compiled.status };
  }
  const result = spawnSync(bin, [], {
    encoding: "utf8", timeout: RUN_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024,
  });
  return { text: (result.stdout ?? "") + (result.stderr ?? ""), status: result.status };
}

let rustSeq = 0;

function runRust(code) {
  const dir = path.join(work, `rust${rustSeq++}`);
  mkdirSync(dir, { recursive: true });
  const src = path.join(dir, "main.rs");
  const bin = path.join(dir, "main");
  writeFileSync(src, code);
  const compiled = spawnSync("rustc", ["--edition", "2021", "-o", bin, src], {
    encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024,
  });
  if (compiled.status !== 0) {
    return { text: (compiled.stdout ?? "") + (compiled.stderr ?? ""), status: compiled.status };
  }
  const result = spawnSync(bin, [], {
    encoding: "utf8", timeout: RUN_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024,
  });
  return { text: (result.stdout ?? "") + (result.stderr ?? ""), status: result.status };
}

function runNode(code) {
  const file = path.join(work, `snippet${nodeSeq++}.mjs`);
  writeFileSync(file, code);
  const result = spawnSync("node", [file], {
    encoding: "utf8", timeout: RUN_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024,
  });
  return { text: (result.stdout ?? "") + (result.stderr ?? ""), status: result.status };
}

let nodeSeq = 0;
let tsSeq = 0;

/**
 * TypeScript runs through the tsx loader already in devDependencies, which
 * type-strips rather than type-checks — the repo's own `tsc --noEmit` is what
 * checks types, and running a second full type-check per example would make
 * this script unusably slow.
 */
function runTypeScript(code) {
  const file = path.join(work, `snippet${tsSeq++}.ts`);
  writeFileSync(file, code);
  // The local binary directly: `npx tsx` re-resolves the package on every call,
  // which costs more than the type-strip does and adds up once many examples
  // carry a TypeScript translation.
  const result = spawnSync(path.join(ROOT, "node_modules", ".bin", "tsx"), [file], {
    encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024,
    cwd: ROOT,
  });
  return { text: (result.stdout ?? "") + (result.stderr ?? ""), status: result.status };
}

let reactSeq = 0;

/**
 * Where React examples run.
 *
 * Unlike every other language here, this one cannot use the system temp
 * directory. `import React from "react"` resolves by walking up from the file,
 * and esbuild finds the `"jsx": "react-jsx"` setting by walking up for a
 * tsconfig — so a file in /tmp gets `Cannot find module 'react'` and no JSX
 * transform. It therefore lives under the repo, inside `node_modules`, which
 * git, tsconfig and eslint already ignore; nothing else has to learn about it.
 */
const reactWork = path.join(ROOT, "node_modules", ".devkernel-verify");

/**
 * Finds the component an example means to show, if it means to show one.
 *
 * The contract, which module 1 already followed and the rest of the track
 * keeps:
 *
 *   - An example that declares `App` renders `App`. That is the root, however
 *     many other components it defines and whatever else it prints.
 *   - Otherwise, an example that prints nothing of its own renders its last
 *     top-level component — the shape of every "here is a component" example.
 *   - An example that prints for itself and has no `App` renders nothing. Such
 *     an example is inspecting components rather than displaying them, and
 *     appending markup to its output would be noise.
 *
 * Requiring a lowercase letter in the name keeps `const MAX_ROWS = 10` from
 * being taken for a component, and the initialiser test keeps out any other
 * capitalised constant that is not a function.
 */
function reactRoot(code) {
  const found = [];
  const patterns = [
    /^(?:export\s+)?(?:default\s+)?function\s+([A-Z][A-Za-z0-9]*)/gm,
    /^(?:export\s+)?const\s+([A-Z][A-Za-z0-9]*)\s*(?::[^=]+)?=\s*(?:function\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]+)?=>)/gm,
  ];
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      if (/[a-z]/.test(match[1])) found.push({ name: match[1], at: match.index });
    }
  }
  if (found.length === 0) return null;
  if (found.some((c) => c.name === "App")) return "App";
  if (/\bconsole\.\w+\(/.test(code)) return null;
  return found.sort((a, b) => a.at - b.at).at(-1).name;
}

/**
 * Renders a React example to the HTML the page claims it produces.
 *
 * Two modes, chosen by what the example reaches for.
 *
 * By default it is rendered once with `renderToStaticMarkup`. That is React's
 * own renderer, so `className` becoming `class`, and a `0` appearing where
 * `&&` short-circuited, are real behaviours rather than a re-implementation of
 * them — and it covers JSX, props, composition, lists and keys, which is most
 * of the track.
 *
 * An example that mentions the DOM, `react-dom/client` or `act` gets a real
 * one, from jsdom, loaded through node's `--import` so it is installed before
 * the example is evaluated. Such an example drives React itself: mount, click,
 * set state, print what changed. That is the only way to show a *re-render*,
 * which is the whole subject of several modules, and the reason the state
 * lessons can demonstrate rather than assert.
 *
 * The DOM roughly doubles the time an example takes, hence loading it only for
 * the ones that say they want it.
 */
function runReact(lang, code) {
  mkdirSync(reactWork, { recursive: true });
  // The repo's own tsconfig excludes node_modules, so without this the loader
  // falls back to the *classic* transform and every example compiles to
  // `React.createElement`. That is not what the site ships or what the lessons
  // describe, and it hides the automatic runtime's behaviour — `key` being
  // lifted out of props, `jsx` against `jsxs`. Pin it instead.
  const tsconfig = path.join(reactWork, "tsconfig.json");
  writeFileSync(
    tsconfig,
    JSON.stringify({ compilerOptions: { jsx: "react-jsx", target: "ES2022" } })
  );
  const file = path.join(reactWork, `example${reactSeq++}.${lang === "jsx" ? "jsx" : "tsx"}`);
  const root = reactRoot(code);
  // Everything this harness adds goes *after* the example, because ES module
  // imports are hoisted: the bindings exist before the first line runs either
  // way, and appending keeps every line number in a stack trace or a compiler
  // diagnostic equal to the line the learner is reading on the page.
  //
  // `React` is only wanted by examples that name it — `React.createElement`, a
  // type, a memo call — since the automatic runtime compiles JSX without it.
  // An example that imports React itself already has the binding, and a second
  // one would be a redeclaration.
  const harness = [
    /^\s*import\s+React\b/m.test(code) ? null : 'import React from "react";',
    root ? 'import { renderToStaticMarkup as __markup } from "react-dom/server";' : null,
    root ? `console.log(__markup(<${root} />));` : null,
  ]
    .filter(Boolean)
    .join("\n");
  writeFileSync(file, `${code}\n${harness}\n`);
  // `--tsconfig` cannot be used alongside `--import`: tsx forwards the latter
  // to node, and node then rejects the former as an unknown flag. The
  // environment variable is the same setting by another route.
  const needsDom = /react-dom\/client|\bdocument\b|\bwindow\b|\bact\s*\(/.test(code);
  const domEnv = pathToFileURL(path.join(ROOT, "scripts", "react-dom-env.mjs")).href;
  const result = spawnSync(
    path.join(ROOT, "node_modules", ".bin", "tsx"),
    needsDom ? ["--import", domEnv, file] : [file],
    {
      encoding: "utf8", timeout: RUN_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024,
      cwd: ROOT,
      env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig },
    }
  );
  return { text: (result.stdout ?? "") + (result.stderr ?? ""), status: result.status };
}

let asmSeq = 0;

/**
 * x86-64 assembly, assembled with NASM and linked bare — no libc, so examples
 * exit through the syscall rather than through `main` returning.
 */
function runAsm(code) {
  const dir = path.join(work, `asm${asmSeq++}`);
  mkdirSync(dir, { recursive: true });
  const src = path.join(dir, "main.asm");
  const obj = path.join(dir, "main.o");
  const bin = path.join(dir, "main");
  writeFileSync(src, code);
  const assembled = spawnSync("nasm", ["-f", "elf64", "-o", obj, src], {
    encoding: "utf8", timeout: RUN_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024,
  });
  if (assembled.status !== 0) {
    return { text: (assembled.stdout ?? "") + (assembled.stderr ?? ""), status: assembled.status };
  }
  const linked = spawnSync("ld", ["-o", bin, obj], {
    encoding: "utf8", timeout: RUN_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024,
  });
  if (linked.status !== 0) {
    return { text: (linked.stdout ?? "") + (linked.stderr ?? ""), status: linked.status };
  }
  const result = spawnSync(bin, [], {
    encoding: "utf8", timeout: RUN_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024,
  });
  return { text: (result.stdout ?? "") + (result.stderr ?? ""), status: result.status };
}

/** Dispatches to whichever toolchain the language needs. */
function runIn(lang, code) {
  switch (lang) {
    case "java": return runJava(code);
    case "go": return runGo(code);
    case "python": return runPython(code);
    case "cpp": return runCpp(code);
    case "rust": return runRust(code);
    case "javascript": return runNode(code);
    case "typescript": return runTypeScript(code);
    case "asm": return runAsm(code);
    case "tsx": return runReact("tsx", code);
    case "jsx": return runReact("jsx", code);
    default: throw new Error(`no runner for ${lang}`);
  }
}

/**
 * Trailing whitespace is not a difference worth failing on, and neither is the
 * scratch directory this happened to run in. Error messages quote a path, and
 * the page should show the filename a learner would see rather than a temp
 * directory that differs on every run.
 */
function normalise(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replaceAll(work, "")
    .replace(/^\/+/gm, "")
    .replace(/(^|[^\w/])\/*(?:java\/)?Main\.java/g, "$1Main.java")
    .replace(/(^|[^\w/])\/*snippet\.py/g, "$1main.py")
    // Go compiles each example in its own scratch directory, and both compiler
    // errors and panic stack traces quote the path. A learner runs `go run
    // main.go` in a directory of their own, so that is the name to compare.
    .replace(/(^|[^\w/])\.?\/*(?:go\d+\/)?main\.go/g, "$1main.go")
    // The same courtesy for the C++ and Rust scratch directories, so a
    // diagnostic quotes the filename a learner would see.
    .replace(/(^|[^\w/])\.?\/*(?:cpp\d+\/)?main\.cpp/g, "$1main.cpp")
    .replace(/(^|[^\w/])\.?\/*(?:rust\d+\/)?main\.rs/g, "$1main.rs")
    // React examples run inside node_modules (see `reactWork`), which is not a
    // path any learner would recognise. They read as a component file.
    .replaceAll(reactWork, "")
    .replace(/(^|[^\w/])\.?\/*example\d+\.(tsx|jsx)/g, "$1App.$2")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

function main() {
  process.stdout.write("compiling content… ");
  compileContent();
  const tracks = loadTracks();
  process.stdout.write("done\n\n");

  let checked = 0;
  let failed = 0;
  let skipped = 0;

  for (const track of tracks) {
    if (onlyTrack && track.slug !== onlyTrack) continue;
    for (const mod of track.modules) {
      if (onlyModule && mod.slug !== onlyModule) continue;
      for (const lesson of mod.lessons) {
        for (const section of lesson.sections ?? []) {
          for (const example of section.examples ?? []) {
            const base = `${track.slug}/${mod.slug}/${lesson.slug} › ${example.id}`;

            /**
             * The primary program and every translation of it are checked the
             * same way, against the same expected output. A translation that
             * has drifted from the original is the failure this is here to
             * catch — the dropdown promises the same program in another
             * language, and an unverified translation makes that a lie.
             */
            const runs = [
              { lang: example.lang, code: example.code, output: example.output,
                requires: example.requires, label: base, allowed: RUNNABLE },
              ...(example.alternates ?? []).map((v) => ({
                lang: v.lang,
                code: v.code,
                output: v.output ?? example.output,
                requires: v.requires,
                label: `${base} [${v.lang}]`,
                allowed: TRANSLATABLE,
              })),
            ];

            for (const run of runs) {
              if (!run.lang || !run.allowed.has(run.lang) || !run.code) continue;
              if (run.output === undefined) {
                skipped++;
                continue;
              }

              // Verified against a toolchain this harness cannot stand up. Say
              // so rather than reporting a mismatch nobody can act on.
              if (run.requires) {
                skipped++;
                console.log(`skip  ${run.label}  (needs ${run.requires})`);
                continue;
              }

              const { text, status } = runIn(run.lang, run.code);

              checked++;
              const actual = normalise(text);
              const expected = normalise(run.output);

              // The output is the whole contract, and a non-zero exit is not a
              // failure here: several lessons teach an error message on
              // purpose, and those examples are supposed to fail.
              if (actual !== expected) {
                failed++;
                console.log(
                  `FAIL  ${run.label}\n      expected:\n${indent(expected)}\n      actual:\n${indent(actual)}\n`
                );
              } else {
                console.log(
                  `ok    ${run.label}${status === 0 ? "" : `  (exit ${status}, as intended)`}`
                );
              }
            }
          }
        }
      }
    }
  }

  console.log(
    `\n${checked} examples run, ${failed} mismatched, ${skipped} skipped (no declared output).`
  );
  return failed === 0 ? 0 : 1;
}

function indent(text) {
  return text
    .split("\n")
    .map((line) => `        ${line}`)
    .join("\n");
}

let code = 1;
try {
  code = main();
} catch (error) {
  console.error(error.stdout?.toString() ?? error.message ?? error);
} finally {
  cleanup();
}
process.exit(code);
