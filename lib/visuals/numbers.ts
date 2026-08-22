/**
 * The bit and number-theory work the DSA track teaches, animated.
 *
 * These are the module-14 shapes. Two of them are pictures of a *number* rather
 * than of a collection — a mask's eight bits, an accumulator flipping — which is
 * the whole difficulty the lesson is trying to remove: a bitmask stops being
 * confusing the moment you stop reading it as a quantity.
 *
 * As everywhere in `lib/visuals`, the frames fall out of the algorithm actually
 * running. Nothing here is a drawing of what bitwise AND is supposed to do.
 */
import {
  Recorder, cellKey, type ArrayFrame, type MatrixFrame, type Role, type Visualisation,
} from "./types";

const WIDTH = 8;

function arrayRecorder() {
  const rec = new Recorder<ArrayFrame>();
  const emit = (
    values: number[], roles: Record<number, Role>, note: string, markers?: Record<number, string>
  ) => rec.push({ kind: "array", values: [...values], roles, note, markers });
  return { rec, emit };
}

function matrixRecorder() {
  const rec = new Recorder<MatrixFrame>();
  const emit = (
    cells: string[][], roles: Record<string, Role>, note: string,
    rowLabels?: string[], colLabels?: string[]
  ) => rec.push({
    kind: "matrix", cells: cells.map((r) => [...r]), roles, note,
    rowLabels: rowLabels && [...rowLabels], colLabels: colLabels && [...colLabels],
  });
  return { rec, emit };
}

/** Bit `i` of `n`, as the cell index that draws it. Index 0 is the high bit. */
const cellOf = (i: number) => WIDTH - 1 - i;

function bitsOf(n: number): number[] {
  return Array.from({ length: WIDTH }, (_, c) => (n >> cellOf(c)) & 1);
}

/** Bit positions written under the cells, so `bit 5` can be pointed at. */
const BIT_LABELS: Record<number, string> = Object.fromEntries(
  Array.from({ length: WIDTH }, (_, c) => [c, String(cellOf(c))])
);

const binary = (n: number) => bitsOf(n).join("");

/* --------------------------------------------------------- the five bit ops -- */

export function bitOperations(): Visualisation {
  const { rec, emit } = arrayRecorder();
  let mask = 0;
  const show = (roles: Record<number, Role>, note: string) =>
    emit(bitsOf(mask), roles, note, BIT_LABELS);

  show({}, "A mask is a set, not a number. Eight bits, all clear: the empty set.");

  for (const i of [0, 2, 5]) {
    rec.bump("writes");
    mask |= 1 << i;
    show({ [cellOf(i)]: "swap" },
      `Add ${i} to the set: mask |= 1 << ${i}. OR can only turn bits on, so adding twice is the same as adding once. Mask is now ${binary(mask)}.`);
  }

  for (const i of [2, 3]) {
    const present = ((mask >> i) & 1) === 1;
    show({ [cellOf(i)]: present ? "found" : "compare" },
      `Is ${i} in the set? (mask >> ${i}) & 1 is ${present ? 1 : 0} — ${present ? "yes" : "no"}. Testing changes nothing.`);
  }

  mask &= ~(1 << 2);
  rec.bump("writes");
  show({ [cellOf(2)]: "discarded" },
    `Remove 2: mask &= ~(1 << 2). The complement is all ones except bit 2, so AND keeps every other bit and forces that one to 0. Mask is now ${binary(mask)}.`);

  mask ^= 1 << 0;
  rec.bump("writes");
  show({ [cellOf(0)]: "swap" },
    `Toggle 0: mask ^= 1 << 0. XOR flips exactly the bits the operand has set — the one operation that does not care which way the bit was pointing. Mask is now ${binary(mask)}.`);

  /* The two tricks get their own value, because they need more than one bit set
     to show anything at all. */
  const m = 0b10110000;
  emit(bitsOf(m), {}, `Now a different mask, ${binary(m)}, for the two tricks worth memorising.`, BIT_LABELS);

  const lowest = m & -m;
  emit(bitsOf(lowest), { [cellOf(4)]: "found" },
    `m & -m = ${binary(lowest)}. Negation is invert-then-add-one, which leaves the lowest set bit alone and flips everything above it — so the AND keeps exactly that bit.`,
    BIT_LABELS);

  const cleared = m & (m - 1);
  emit(bitsOf(cleared), { [cellOf(4)]: "discarded" },
    `m & (m − 1) = ${binary(cleared)}. Subtracting one borrows through the trailing zeros, so the AND clears the lowest set bit and leaves the rest.`,
    BIT_LABELS);

  let n = m;
  let count = 0;
  while (n) {
    n &= n - 1;
    count += 1;
    rec.bump("iterations");
    emit(bitsOf(n), {}, `Kernighan's count: clear the lowest set bit and tally. ${count} so far, ${binary(n)} left.`, BIT_LABELS);
  }
  emit(bitsOf(0), {}, `Empty after ${count} iterations — one per set bit, not one per bit. That is the whole point of the trick.`, BIT_LABELS);

  return {
    frames: rec.frames,
    summary:
      "Five operations, each `1 << i` combined with the mask a different way: OR adds, AND with a complement removes, XOR toggles, and a shift-and-mask tests. The two tricks come from how borrowing works in two's complement — `m & -m` keeps the lowest set bit and `m & (m - 1)` clears it, which turns popcount into one iteration per set bit rather than one per bit.",
  };
}

/* ------------------------------------------------------------ XOR cancelling -- */

export function xorCancellation(values = [4, 1, 2, 1, 2]): Visualisation {
  const { rec, emit } = matrixRecorder();
  const rows: string[][] = [];
  const labels: string[] = [];
  const colLabels = Array.from({ length: WIDTH }, (_, c) => String(cellOf(c)));

  let acc = 0;
  rows.push(bitsOf(acc).map(String));
  labels.push("0");
  emit(rows, {}, "Start from 0, which XOR leaves alone. Each row is the accumulator after one more value.", labels, colLabels);

  for (const v of values) {
    const before = acc;
    acc ^= v;
    rec.bump("xors");
    rows.push(bitsOf(acc).map(String));
    labels.push(`^ ${v}`);
    const flipped: Record<string, Role> = {};
    for (let c = 0; c < WIDTH; c++) {
      if (((before >> cellOf(c)) & 1) !== ((acc >> cellOf(c)) & 1)) flipped[cellKey(rows.length - 1, c)] = "swap";
    }
    emit(rows, flipped, `XOR ${v} (${binary(v)}): the highlighted bits flipped. Accumulator is ${acc} — ${binary(acc)}.`,
      labels, colLabels);
  }

  const survivors: Record<string, Role> = {};
  for (let c = 0; c < WIDTH; c++) {
    if (((acc >> cellOf(c)) & 1) === 1) survivors[cellKey(rows.length - 1, c)] = "found";
  }
  emit(rows, survivors,
    `Every value that appeared twice flipped its bits back. What is left, ${acc}, is the one that appeared once.`,
    labels, colLabels);

  return {
    frames: rec.frames,
    summary:
      "Three identities do all the work: `x ^ x = 0`, `x ^ 0 = x`, and XOR is commutative and associative — so the order of the array cannot matter and every pair annihilates wherever it sits. Watching a column flip on and back off is the proof: the accumulator carries no record of what it has seen, only of what has not yet been cancelled. O(n) time, one integer of space.",
  };
}

/* ------------------------------------------------------------------- sieve -- */

export function sieve(n = 30): Visualisation {
  const { rec, emit } = arrayRecorder();
  const values = Array.from({ length: n - 1 }, (_, i) => i + 2);   // 2..n
  const at = (v: number) => v - 2;
  const composite = new Array(n + 1).fill(false);
  const roles: Record<number, Role> = {};

  emit(values, {}, `Every number from 2 to ${n}. Rather than testing each one, cross out what cannot be prime.`);

  const limit = Math.floor(Math.sqrt(n));
  for (let p = 2; p <= limit; p++) {
    if (composite[p]) {
      emit(values, { ...roles, [at(p)]: "discarded" },
        `${p} is already crossed out, so it has a smaller factor and everything it would cross out is gone too. Skip it.`);
      continue;
    }
    roles[at(p)] = "sorted";
    emit(values, { ...roles, [at(p)]: "active" },
      `${p} survived, so it is prime. Cross out its multiples — starting at ${p}², because every smaller multiple already has a smaller factor and was crossed out by it.`);

    for (let m = p * p; m <= n; m += p) {
      composite[m] = true;
      roles[at(m)] = "discarded";
      rec.bump("crossings");
      emit(values, { ...roles, [at(m)]: "compare", [at(p)]: "active" },
        `${m} = ${p} × ${m / p}, so it is not prime.`);
    }
  }

  emit(values, roles,
    `Stopping at ${limit}: any composite up to ${n} has a factor no larger than √${n}, so nothing past that could cross out anything new.`);

  const primes: number[] = [];
  for (const v of values) {
    if (!composite[v]) {
      primes.push(v);
      roles[at(v)] = "found";
    }
  }
  emit(values, roles, `Whatever is left is prime: ${primes.join(", ")}. ${primes.length} of them below ${n + 1}.`);

  return {
    frames: rec.frames,
    summary:
      "Crossing out beats testing: each composite is reached from its prime factors rather than searched for. The two refinements are not micro-optimisations — starting at p² skips work already done by smaller primes, and stopping the outer loop at √n is what makes the whole thing O(n log log n) rather than O(n√n).",
  };
}

/* --------------------------------------------------------------- Euclid -- */

export function euclid(a = 252, b = 105): Visualisation {
  const { rec, emit } = matrixRecorder();
  const rows: string[][] = [];
  const colLabels = ["a", "b", "a mod b"];
  const labels: string[] = [];

  const opening = `gcd(${a}, ${b}). Each step replaces (a, b) with (b, a mod b), and loses no common divisor doing it.`;

  let step = 0;
  while (b !== 0) {
    const r = a % b;
    rows.push([String(a), String(b), String(r)]);
    labels.push(`step ${step + 1}`);
    rec.bump("divisions");
    emit(rows, { [cellKey(step, 2)]: "active" },
      `${step === 0 ? `${opening} ` : ""}${a} = ${Math.floor(a / b)} × ${b} + ${r}. `
      + (r === 0
        ? `${b} divides ${a} exactly, so ${b} is the largest thing dividing both — and the recursion has bottomed out.`
        : `Any number dividing ${a} and ${b} also divides ${r}, so the pair (${b}, ${r}) has the same divisors — and is smaller.`),
      labels, colLabels);
    a = b;
    b = r;
    step += 1;
  }

  emit(rows, { [cellKey(step - 1, 1)]: "found" },
    `b reached 0, so a is the answer: gcd is ${a}. It took ${step} divisions.`,
    labels, colLabels);

  return {
    frames: rec.frames,
    summary:
      "The invariant is that gcd(a, b) = gcd(b, a mod b): a common divisor of the first pair divides the remainder too, and vice versa, so no divisor is lost on the way down. It terminates fast because a mod b is always less than half of a when b ≤ a/2, and is b's own successor otherwise — either way the pair at least halves every two steps, which is where the O(log min(a, b)) comes from.",
  };
}

export const NUMBER_ALGOS = {
  bitops: { label: "The five bit operations", run: () => bitOperations() },
  xor: { label: "XOR cancellation", run: () => xorCancellation() },
  sieve: { label: "Sieve of Eratosthenes", run: () => sieve() },
  euclid: { label: "Euclid's algorithm", run: () => euclid() },
} as const;

export type NumberAlgoName = keyof typeof NUMBER_ALGOS;
