/**
 * Presses Play on every visualisation and checks the animation actually runs.
 *
 * The frame generators are already covered: `verify-visual-frames.ts` runs every
 * one of them and proves each frame is well-formed. None of that can catch the
 * failure this script exists for, because
 * that failure lives in the player rather than the data — the frames were
 * perfect while the animation advanced one step and stalled.
 *
 * Playback is a chain of timeouts: arriving at a frame is what schedules the
 * frame after it. Drop the frame index from the effect's dependency list and
 * the chain is never re-armed. Nothing type-checks or lints its way to that
 * bug, and no assertion about frame contents can see it. Only wall-clock
 * observation of a real browser can.
 *
 *   node scripts/verify-visual-playback.mjs             # entries, then speeds
 *   node scripts/verify-visual-playback.mjs --entries   # gallery walk only
 *   node scripts/verify-visual-playback.mjs --speeds    # speed labels only
 *   node scripts/verify-visual-playback.mjs --url http://localhost:4000
 *
 * Needs a server already running (`npm run dev`, or `npm run build && npm start`).
 *
 * NEVER add --virtual-time-budget to the Chromium flags below. It fast-forwards
 * setTimeout, which is the exact mechanism under test: with it the run finishes
 * instantly and the script reports success whether or not playback works.
 * Every measurement here is deliberately real elapsed time, which is why it
 * takes a few minutes.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import WebSocket from "ws";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE = value("--url", "http://localhost:3000").replace(/\/$/, "");
const PORT = Number(value("--port", "9333"));
const runEntries = !flag("--speeds");
const runSpeeds = !flag("--entries");

/** What each speed button promises, in ms per frame. Mirrors SPEEDS in VisualPlayer.tsx. */
const SPEEDS = { "0.5×": 1200, "1×": 600, "2×": 280, "4×": 120 };

const CHROMES = [
  process.env.CHROME,
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const found = CHROMES.find((p) => existsSync(p));
  if (!found) {
    console.error(
      "No Chrome or Chromium found. Set CHROME=/path/to/chrome and re-run.\n" +
        "Looked in:\n  " + CHROMES.join("\n  ")
    );
    process.exit(2);
  }
  return found;
}

async function requireServer() {
  try {
    const res = await fetch(`${BASE}/visualize`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (error) {
    console.error(
      `Cannot reach ${BASE}/visualize (${error.message}).\n` +
        "Start the site first: npm run dev"
    );
    process.exit(2);
  }
}

/* ------------------------------------------------------------------- CDP -- */

function connect(chrome) {
  let nextId = 1;
  const pending = new Map();
  let ws;

  return {
    async open() {
      let list;
      for (let i = 0; i < 80; i++) {
        try {
          const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
          const json = await res.json();
          if (json.length) { list = json; break; }
        } catch { /* not listening yet */ }
        await sleep(250);
      }
      if (!list) {
        chrome.kill();
        throw new Error("Chrome never opened its debugging port");
      }
      const page = list.find((t) => t.type === "page") ?? list[0];
      ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        if (!msg.id || !pending.has(msg.id)) return;
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      });
      await new Promise((resolve, reject) => {
        ws.once("open", resolve);
        ws.once("error", reject);
      });
    },
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { ws?.close(); },
  };
}

/* ------------------------------------------------------------ page probes -- */

/**
 * Helpers injected into the page.
 *
 * They read the same DOM a learner sees — the step counter, the transport
 * buttons — rather than reaching into React state, so this measures what is on
 * screen and not what the component believes.
 */
const PROBES = String.raw`
  window.__fig = () => document.querySelector('figure[role="group"]');
  window.__counter = () => {
    const fig = window.__fig();
    if (!fig) return null;
    const span = [...fig.querySelectorAll('span')]
      .find((el) => /^\d+\/\d+$/.test(el.textContent.trim()));
    return span ? span.textContent.trim() : null;
  };
  window.__btn = (label) => {
    const fig = window.__fig();
    if (!fig) return null;
    return [...fig.querySelectorAll('button')]
      .find((b) => b.textContent.trim().startsWith(label)) || null;
  };
  window.__navItems = () =>
    [...document.querySelectorAll('nav[aria-label="Visualisations"] button')];
  true;
`;

const at = (counter) => (counter ? Number(counter.split("/")[0]) : NaN);
const of_ = (counter) => (counter ? Number(counter.split("/")[1]) : NaN);

/* ------------------------------------------------------------------ main -- */

const chromePath = findChrome();
await requireServer();

const chrome = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  "--no-sandbox",
  "--disable-gpu",
  "--window-size=1280,2400",
  "about:blank",
], { stdio: "ignore" });

const cdp = connect(chrome);
let failures = [];

try {
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  const evaluate = async (expression) => {
    const res = await cdp.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description ?? res.exceptionDetails.text);
    }
    return res.result.value;
  };

  const load = async () => {
    await cdp.send("Page.navigate", { url: `${BASE}/visualize` });
    // A dev server compiles the route on first hit, so give it room.
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      try {
        if (await evaluate(`!!document.querySelector('nav[aria-label="Visualisations"] button')`)) break;
      } catch { /* navigating */ }
    }
    await evaluate(PROBES);
  };

  await load();

  if (runEntries) failures.push(...(await walkGallery(evaluate)));
  if (runSpeeds) failures.push(...(await checkSpeeds(evaluate)));
} finally {
  cdp.close();
  chrome.kill();
}

if (failures.length) {
  console.log(`\n${failures.length} problem(s):\n  ` + failures.join("\n  "));
  process.exit(1);
}
console.log("\nplayback is healthy");
process.exit(0);

/**
 * Every gallery entry: press Play, confirm it keeps advancing, and confirm it
 * reaches the final frame on its own.
 *
 * Runs at 4x so a 50-frame animation finishes in seconds. The stalling bug is
 * speed-independent — it fails to schedule at all — so the fast setting costs
 * no sensitivity.
 */
async function walkGallery(evaluate) {
  const SAMPLE = 1200;         // ms of real time to watch before judging
  const MIN_ADVANCE = 4;       // at 120ms/frame, expect ~10
  const PATIENCE = 12_000;     // longest we wait for a run to finish

  const labels = await evaluate(`window.__navItems().map((b) => b.textContent.trim())`);
  if (!labels.length) return ["no gallery entries found on /visualize"];

  console.log(`Playing ${labels.length} visualisations at 4× (real time, no fast-forward)\n`);
  const bad = [];

  for (let i = 0; i < labels.length; i++) {
    await evaluate(`window.__navItems()[${i}].click(); true`);
    await sleep(700);

    const start = await evaluate(`window.__counter()`);
    if (!start) {
      console.log(`  skip  ${labels[i]} — no player rendered`);
      continue;
    }

    await evaluate(`{ const b = window.__btn('4×'); if (b) b.click(); true }`);
    await evaluate(`(window.__btn('Play') || window.__btn('Replay')).click(); true`);

    await sleep(SAMPLE);
    const mid = await evaluate(`window.__counter()`);
    const advanced = at(mid) - at(start);
    // Short animations can legitimately be over before the sample ends.
    let finished = at(mid) >= of_(mid);
    const kept = advanced >= MIN_ADVANCE || finished;

    let waited = 0;
    while (!finished && waited < PATIENCE) {
      await sleep(1000);
      waited += 1000;
      const now = await evaluate(`window.__counter()`);
      finished = at(now) >= of_(now);
    }

    const ok = kept && finished;
    if (!ok) {
      bad.push(
        `${labels[i]}: advanced ${advanced} frame(s) in ${SAMPLE}ms` +
          (finished ? "" : `, never reached the end (stopped at ${await evaluate(`window.__counter()`)})`)
      );
    }
    const name = `${labels[i]} (${of_(start)} frames)`;
    console.log(
      `  ${ok ? "ok  " : "FAIL"}  ${name.padEnd(40)} +${String(advanced).padStart(2)} in ${SAMPLE}ms, ran to end: ${finished}`
    );

    // Leave it stopped so the next entry starts from a clean player.
    await evaluate(`{ const b = window.__btn('Pause'); if (b) b.click(); true }`);
  }
  return bad;
}

/**
 * Each speed button against a clock.
 *
 * The window has to span several ticks, or the measurement straddles a tick
 * boundary and a correct 0.5x reports as a failure. The tolerance is wide and
 * one-sided in practice: every frame costs a React render on top of its
 * timeout, so the measured period always runs a little long. What is being
 * checked is that the buttons are honestly labelled, not that timers are exact.
 */
async function checkSpeeds(evaluate) {
  const WINDOW = 6200;
  const bad = [];
  console.log(`\nSpeed settings, measured over ${WINDOW}ms each\n`);

  // The first entry is the 50-frame sort — long enough not to end mid-window.
  await evaluate(`window.__navItems()[0].click(); true`);
  await sleep(700);

  for (const [label, expected] of Object.entries(SPEEDS)) {
    await evaluate(`
      (() => { const f = window.__fig(); f.focus();
        f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
        return true; })()
    `);
    await sleep(300);
    await evaluate(`window.__btn('${label}').click(); true`);

    const before = await evaluate(`window.__counter()`);
    await evaluate(`(window.__btn('Play') || window.__btn('Replay')).click(); true`);
    const t0 = Date.now();
    await sleep(WINDOW);
    const after = await evaluate(`window.__counter()`);
    const elapsed = Date.now() - t0;
    await evaluate(`{ const b = window.__btn('Pause'); if (b) b.click(); true }`);

    const advanced = at(after) - at(before);
    const perFrame = advanced > 0 ? Math.round(elapsed / advanced) : Infinity;
    const slack = Math.max(150, expected * 0.4);
    const ok = advanced > 0 && Math.abs(perFrame - expected) <= slack;
    if (!ok) bad.push(`${label}: ~${perFrame}ms per frame, expected ${expected}ms`);
    console.log(
      `  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(5)} ${String(before).padStart(7)} -> ${String(after).padEnd(7)} ` +
        `+${String(advanced).padStart(2)}  ~${perFrame}ms/frame, labelled ${expected}ms`
    );
    await sleep(200);
  }
  return bad;
}
