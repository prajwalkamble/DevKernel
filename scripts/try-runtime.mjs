/**
 * Runs a source file through one of the browser language runtimes, from Node.
 *
 * The runtimes exist to be called from a React page, which makes them awkward
 * to iterate on: the edit-check loop would otherwise be "start the dev server,
 * click into the playground, paste, read the console". This compiles the same
 * TypeScript the site ships and calls straight into it.
 *
 *   node scripts/try-runtime.mjs java path/to/Main.java
 *   node scripts/try-runtime.mjs cpp  path/to/main.cpp
 *   echo 'fn main(){ println!("hi"); }' | node scripts/try-runtime.mjs rust -
 *
 * Exit status is the program's own, so this composes with a test script.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const [language, file] = process.argv.slice(2);

if (!language || !file) {
  console.error("usage: node scripts/try-runtime.mjs <rust|cpp|java|c|go> <file|->");
  process.exit(2);
}

const source = file === "-" ? readFileSync(0, "utf8") : readFileSync(file, "utf8");

const build = mkdtempSync(path.join(tmpdir(), "devkernel-runtime-"));
process.on("exit", () => rmSync(build, { recursive: true, force: true }));

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
      outDir: build,
      rootDir: ROOT,
      // The runtimes reach for `@/lib/...` the way the app does.
      baseUrl: ROOT,
      paths: { "@/*": ["*"] },
    },
    // Absolute, because `include` resolves against the tsconfig's own
    // directory and this one lives in a temp dir.
    include: [path.join(ROOT, "lib/runtimes/**/*.ts")],
  })
);

execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsc", "-p", tsconfig],
  { cwd: ROOT, stdio: "inherit" }
);

const require = createRequire(import.meta.url);
const dialects = require(path.join(build, "lib/runtimes/dialects.js"));

const RUNNERS = {
  rust: dialects.runRust,
  cpp: dialects.runCpp,
  java: dialects.runJava,
  c: dialects.runC,
  go: dialects.runGo,
};

const run = RUNNERS[language];
if (!run) {
  console.error(`unknown language \`${language}\`; expected one of ${Object.keys(RUNNERS).join(", ")}`);
  process.exit(2);
}

const result = run(source);
for (const line of result.lines) {
  const stream = line.level === "error" || line.level === "warn" ? process.stderr : process.stdout;
  stream.write(line.text + "\n");
}
process.exit(result.exitCode ?? 0);
