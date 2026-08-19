/**
 * Grades a solution file against a problem's real test cases, from Node.
 *
 * The console this exercises lives behind a React page and five language
 * pickers, which makes it slow to iterate on by hand. This calls the same
 * grading path the browser does — `runInterpreted`, then `gradeCases` — so a
 * verdict here is the verdict a learner would see.
 *
 *   node scripts/try-judge.mjs two-sum c   path/to/solution.c
 *   node scripts/try-judge.mjs two-sum java path/to/Main.java
 *
 * Exits non-zero unless every case passes, so it composes with a test script.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const [slug, language, file] = process.argv.slice(2);

if (!slug || !language || !file) {
  console.error("usage: node scripts/try-judge.mjs <problem-slug> <language> <file>");
  process.exit(2);
}

const build = mkdtempSync(path.join(tmpdir(), "devkernel-judge-"));
process.on("exit", () => rmSync(build, { recursive: true, force: true }));

writeFileSync(
  path.join(build, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      target: "es2022",
      module: "commonjs",
      moduleResolution: "node",
      esModuleInterop: true,
      skipLibCheck: true,
      strict: false,
      outDir: build,
      rootDir: ROOT,
      baseUrl: ROOT,
      paths: { "@/*": ["*"] },
    },
    include: [
      path.join(ROOT, "lib/judge/interpreted.ts"),
      path.join(ROOT, "lib/judge/grade.ts"),
      path.join(ROOT, "lib/judge/compare.ts"),
      path.join(ROOT, "lib/judge/types.ts"),
      path.join(ROOT, "lib/runtimes/**/*.ts"),
      path.join(ROOT, "content/practice/**/*.ts"),
    ],
  })
);

execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsc", "-p", path.join(build, "tsconfig.json")], {
  cwd: ROOT,
  stdio: "inherit",
});

const require = createRequire(import.meta.url);

// tsc's `paths` is compile-time only, so `@/…` survives into the emit and has
// to be resolved here the way the bundler would.
const Module = require("node:module");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) {
    return originalResolve.call(this, path.join(build, request.slice(2)), ...rest);
  }
  return originalResolve.call(this, request, ...rest);
};

const { getProblem } = require(path.join(build, "content/practice/index.js"));
const { runInterpreted, isInterpreted } = require(path.join(build, "lib/judge/interpreted.js"));
// From `grade.js` rather than `runner.js`: the runner builds Workers and uses
// `import.meta.url`, neither of which exists in the CommonJS emit below.
const { gradeCases, toSpec } = require(path.join(build, "lib/judge/grade.js"));

const problem = getProblem(slug);
if (!problem?.judge) {
  console.error(`no problem with a judge called \`${slug}\``);
  process.exit(2);
}
if (!isInterpreted(language)) {
  console.error(`\`${language}\` does not run on the interpreters`);
  process.exit(2);
}

// `toSpec` is what the browser hands a worker, so the harness grades through
// exactly the same shape rather than a privileged one.
const run = runInterpreted(toSpec(problem.judge), language, readFileSync(file, "utf8"));

if (run.status) {
  console.log(`${run.status.toUpperCase()}: ${run.message}`);
  process.exit(1);
}

const graded = gradeCases(problem.judge, run.cases, run.stdout);
for (const result of graded.cases) {
  const expected = problem.judge.cases[result.index].expected;
  const mark = result.status === "pass" ? "ok  " : "FAIL";
  const detail =
    result.status === "error"
      ? result.error
      : `got ${JSON.stringify(result.received)}  want ${JSON.stringify(expected)}`;
  console.log(`${mark} case ${result.index}: ${detail}`);
}
if (run.stdout.length) console.log("--- printed ---\n" + run.stdout.join("\n"));
console.log(`\n${graded.status}: ${graded.cases.filter((c) => c.status === "pass").length}/${graded.cases.length}`);
process.exit(graded.status === "passed" ? 0 : 1);
