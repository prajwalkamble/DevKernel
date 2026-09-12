import type { Lesson } from "@/content/types";

export const theKvCacheLesson: Lesson = {
  id: "dsa-gen-ai-the-kv-cache",
  slug: "the-kv-cache",
  moduleSlug: "algorithms-behind-gen-ai",
  title: "The KV Cache: A Growing Array, and Why Context Costs",
  summary:
    "Three separate costs that get confused with each other. Measured: the cache turns cubic generation into quadratic, does nothing about the quadratic, and is itself a textbook dynamic array at 0.99 moves per token.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Explain what the KV cache stores and what it saves",
    "Separate the cost the cache removes from the cost it cannot",
    "Show the cache is a dynamic array with the usual amortised argument",
    "Compute the memory a context length costs, per conversation",
  ],
  sections: [
    {
      id: "what-it-caches",
      heading: "What is being cached",
      body: [
        "When a model generates text it produces one token at a time, and each new token attends to every token before it. Attention needs two arrays per earlier token \u2014 its **key** and its **value** \u2014 and those arrays depend on that token and the ones before it, never on anything generated later.",
        "So they never change once computed. That is the entire justification for the cache: a value that is expensive, reused every step, and immutable is the textbook case for storing it.",
        "Without the cache, generating token 500 means recomputing keys and values for all 499 earlier tokens, and that recomputation happened at token 499 too, and at 498. With the cache, each token's key and value are computed once and appended.",
        "The program counts the operations rather than describing them, and then counts two other things that are routinely confused with this one.",
      ],
    },
    {
      id: "counted",
      heading: "Three costs, counted separately",
      body: [
      ],
      examples: [
        {
          id: "what-the-cache-saves-and-what-it-does-not",
          title: "The work with and without the cache, the per-token cost, the append, and the memory",
          lang: "python",
          code: `# The KV cache is a growing array, and the reason context length is
# expensive is entirely visible from counting what the loops do.

WIDTH = 64            # the model's hidden size, kept small so the counts read
LAYERS = 32           # a mid-sized model
BYTES_PER_NUMBER = 2  # fp16


def without_cache(tokens):
    # every new token re-runs attention over the whole prefix from scratch
    work = 0
    for step in range(tokens):
        for position in range(step + 1):
            # this position attends to every position at or before it
            work += 2 * WIDTH * (position + 1)
    return work


def with_cache(tokens):
    # keys and values for earlier tokens are already stored, so the new
    # token attends to the cache and nothing else is recomputed
    work = 0
    for step in range(tokens):
        work += 2 * WIDTH * (step + 1)
    return work


def per_token(step):
    return 2 * WIDTH * (step + 1)


print("counting multiply-accumulates for generating one sequence")
print("(hidden size %d, one layer)" % WIDTH)
print()
print("   tokens   no cache   x   with cache   x    saving")
sizes = [64, 128, 256, 512]
previous = [0, 0]
for tokens in sizes:
    slow = without_cache(tokens)
    fast = with_cache(tokens)
    if previous[0] == 0:
        slow_ratio = "  -"
        fast_ratio = "  -"
    else:
        a = slow * 10 // previous[0]
        b = fast * 10 // previous[1]
        slow_ratio = "%d.%d" % (a // 10, a % 10)
        fast_ratio = "%d.%d" % (b // 10, b % 10)
    saving = slow // fast
    print("%9d %10d %3s %12d %3s %8dx" % (tokens, slow, slow_ratio, fast, fast_ratio, saving))
    previous = [slow, fast]
print()
print("the cache does not make generation cheap, it makes it quadratic")
print("instead of cubic. what one token costs, with the cache:")
print()
print("  position     work   x the first token")
for step in [0, 63, 255, 1023, 4095]:
    print("%10d %8d %18d" % (step + 1, per_token(step), per_token(step) // per_token(0)))
print()

# --- the cache itself is a growing array --------------------------------

def copies_growing_by_one(tokens):
    copies = 0
    length = 0
    for _ in range(tokens):
        # a fresh array one longer, then everything moved across
        copies += length
        length += 1
    return copies


def copies_doubling(tokens):
    copies = 0
    length = 0
    capacity = 1
    for _ in range(tokens):
        if length == capacity:
            copies += length
            capacity *= 2
        length += 1
    return copies


print("appending tokens to the cache one at a time, counting entries moved:")
print()
print("   tokens   grow by one     doubling   moves per token")
for tokens in [1024, 2048, 4096, 8192]:
    one = copies_growing_by_one(tokens)
    two = copies_doubling(tokens)
    per = two * 100 // tokens
    print("%9d %13d %12d %11d.%02d" % (tokens, one, two, per // 100, per % 100))
print()

# --- and what it costs in memory ---------------------------------------

REAL_WIDTH = 4096
print("memory for one sequence's cache, %d layers of width %d, two"
      % (LAYERS, REAL_WIDTH))
print("arrays per layer for keys and values, %d bytes a number:"
      % BYTES_PER_NUMBER)
print()
print("   context        bytes    megabytes")
for context in [1024, 8192, 32768, 131072]:
    total = 2 * LAYERS * REAL_WIDTH * context * BYTES_PER_NUMBER
    print("%10d %12d %12d" % (context, total, total // 1024 // 1024))
print()
print("""Three separate costs, and they are usually confused with each other.

The first table is the cache doing its job. Without it, every new token
re-runs attention over the entire prefix, and the count grows by 7.9
each time the sequence doubles -- cubic. With it, the earlier keys and
values are already stored, the new token attends to them, and the count
grows by 3.9 -- quadratic. At 512 tokens that is a factor of 171, and
the factor keeps widening.

The second table is the cost the cache does not remove, and it is the
one that matters for long context. One token at position 4096 costs
4096 times what the first token cost, because it attends to 4096
cached entries. Generation does not slow down because the model is
tired; it slows down because the loop it runs is over the cache, and
the cache is longer. Every claim about quadratic context length is
this one line: attention over a prefix is linear in the prefix, and
doing it for every token in the prefix is quadratic in total.

The third table is the growing array from early in this track, and it
is the reason nobody worries about the append itself. Growing the
cache by exactly one entry per token moves 33 million entries over
8192 tokens. Doubling the capacity when it fills moves 8191 -- 0.99
moves per token, amortised constant, and the number stays at 0.99 at
every size. That is the dynamic array's amortised argument, unchanged,
applied to the single hottest buffer in a language model runtime.

The last table is why context length is sold rather than given away.
One sequence at 128k context on a 32-layer model of width 4096 needs
64 gigabytes of cache, in fp16, for one user. That is not the model's
weights -- the weights are loaded once and shared -- it is per
conversation, and it is why serving long contexts is a memory problem
before it is a compute problem. Grouped-query attention, which shares
one set of keys and values across several query heads, exists to
divide precisely this table.""")
`,
          output: `counting multiply-accumulates for generating one sequence
(hidden size 64, one layer)

   tokens   no cache   x   with cache   x    saving
       64    5857280   -       266240   -       22x
      128   45793280 7.8      1056768 3.9       43x
      256  362119168 7.9      4210688 3.9       86x
      512 2880110592 7.9     16809984 3.9      171x

the cache does not make generation cheap, it makes it quadratic
instead of cubic. what one token costs, with the cache:

  position     work   x the first token
         1      128                  1
        64     8192                 64
       256    32768                256
      1024   131072               1024
      4096   524288               4096

appending tokens to the cache one at a time, counting entries moved:

   tokens   grow by one     doubling   moves per token
     1024        523776         1023           0.99
     2048       2096128         2047           0.99
     4096       8386560         4095           0.99
     8192      33550336         8191           0.99

memory for one sequence's cache, 32 layers of width 4096, two
arrays per layer for keys and values, 2 bytes a number:

   context        bytes    megabytes
      1024    536870912          512
      8192   4294967296         4096
     32768  17179869184        16384
    131072  68719476736        65536

Three separate costs, and they are usually confused with each other.

The first table is the cache doing its job. Without it, every new token
re-runs attention over the entire prefix, and the count grows by 7.9
each time the sequence doubles -- cubic. With it, the earlier keys and
values are already stored, the new token attends to them, and the count
grows by 3.9 -- quadratic. At 512 tokens that is a factor of 171, and
the factor keeps widening.

The second table is the cost the cache does not remove, and it is the
one that matters for long context. One token at position 4096 costs
4096 times what the first token cost, because it attends to 4096
cached entries. Generation does not slow down because the model is
tired; it slows down because the loop it runs is over the cache, and
the cache is longer. Every claim about quadratic context length is
this one line: attention over a prefix is linear in the prefix, and
doing it for every token in the prefix is quadratic in total.

The third table is the growing array from early in this track, and it
is the reason nobody worries about the append itself. Growing the
cache by exactly one entry per token moves 33 million entries over
8192 tokens. Doubling the capacity when it fills moves 8191 -- 0.99
moves per token, amortised constant, and the number stays at 0.99 at
every size. That is the dynamic array's amortised argument, unchanged,
applied to the single hottest buffer in a language model runtime.

The last table is why context length is sold rather than given away.
One sequence at 128k context on a 32-layer model of width 4096 needs
64 gigabytes of cache, in fp16, for one user. That is not the model's
weights -- the weights are loaded once and shared -- it is per
conversation, and it is why serving long contexts is a memory problem
before it is a compute problem. Grouped-query attention, which shares
one set of keys and values across several query heads, exists to
divide precisely this table.`,
          explanation:
            "The first table is the cache working: without it the count grows by 7.9 each time the sequence doubles, which is cubic; with it, 3.9, which is quadratic. At 512 tokens that is a factor of 171 and it keeps widening. The second table is the cost the cache does not remove -- a token at position 4096 costs 4096 times what the first token cost, because it attends to 4096 cached entries. The third is the append itself: growing the cache by one entry per token moves 33 million entries over 8192 tokens, while doubling the capacity moves 8191, which is 0.99 per token at every size. The last is memory: 64 GB of cache for one 128k-token conversation on a 32-layer model of width 4096 — in fp16, with every head keeping its own keys and values. Grouped-query attention, which most current models use, divides that by the number of heads sharing a key-value pair.",
          alternates: [
            {
              lang: "javascript",
              code: `// The KV cache is a growing array, and the reason context length is
// expensive is entirely visible from counting what the loops do.

const WIDTH = 64; // the model's hidden size, kept small so the counts read
const LAYERS = 32; // a mid-sized model
const BYTES_PER_NUMBER = 2; // fp16

function withoutCache(tokens) {
  // every new token re-runs attention over the whole prefix from scratch
  let work = 0;
  for (let step = 0; step < tokens; step++) {
    for (let position = 0; position <= step; position++) {
      // this position attends to every position at or before it
      work += 2 * WIDTH * (position + 1);
    }
  }
  return work;
}

function withCache(tokens) {
  // keys and values for earlier tokens are already stored, so the new
  // token attends to the cache and nothing else is recomputed
  let work = 0;
  for (let step = 0; step < tokens; step++) work += 2 * WIDTH * (step + 1);
  return work;
}

function perToken(step) {
  return 2 * WIDTH * (step + 1);
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

console.log("counting multiply-accumulates for generating one sequence");
console.log("(hidden size " + WIDTH + ", one layer)");
console.log();
console.log("   tokens   no cache   x   with cache   x    saving");
const sizes = [64, 128, 256, 512];
let previousSlow = 0;
let previousFast = 0;
for (const tokens of sizes) {
  const slow = withoutCache(tokens);
  const fast = withCache(tokens);
  let slowRatio = "  -";
  let fastRatio = "  -";
  if (previousSlow !== 0) {
    const a = Math.floor((slow * 10) / previousSlow);
    const b = Math.floor((fast * 10) / previousFast);
    slowRatio = Math.floor(a / 10) + "." + (a % 10);
    fastRatio = Math.floor(b / 10) + "." + (b % 10);
  }
  const saving = Math.floor(slow / fast);
  console.log(
    padLeft(tokens, 9) + " " + padLeft(slow, 10) + " " + padLeft(slowRatio, 3) + " " +
      padLeft(fast, 12) + " " + padLeft(fastRatio, 3) + " " + padLeft(saving, 8) + "x",
  );
  previousSlow = slow;
  previousFast = fast;
}
console.log();
console.log("the cache does not make generation cheap, it makes it quadratic");
console.log("instead of cubic. what one token costs, with the cache:");
console.log();
console.log("  position     work   x the first token");
for (const step of [0, 63, 255, 1023, 4095]) {
  console.log(
    padLeft(step + 1, 10) + " " + padLeft(perToken(step), 8) + " " +
      padLeft(Math.floor(perToken(step) / perToken(0)), 18),
  );
}
console.log();

// --- the cache itself is a growing array --------------------------------

function copiesGrowingByOne(tokens) {
  let copies = 0;
  let length = 0;
  for (let t = 0; t < tokens; t++) {
    // a fresh array one longer, then everything moved across
    copies += length;
    length += 1;
  }
  return copies;
}

function copiesDoubling(tokens) {
  let copies = 0;
  let length = 0;
  let capacity = 1;
  for (let t = 0; t < tokens; t++) {
    if (length === capacity) {
      copies += length;
      capacity *= 2;
    }
    length += 1;
  }
  return copies;
}

console.log("appending tokens to the cache one at a time, counting entries moved:");
console.log();
console.log("   tokens   grow by one     doubling   moves per token");
for (const tokens of [1024, 2048, 4096, 8192]) {
  const one = copiesGrowingByOne(tokens);
  const two = copiesDoubling(tokens);
  const per = Math.floor((two * 100) / tokens);
  const fraction = per % 100;
  console.log(
    padLeft(tokens, 9) + " " + padLeft(one, 13) + " " + padLeft(two, 12) + " " +
      padLeft(Math.floor(per / 100), 11) + "." + (fraction < 10 ? "0" : "") + fraction,
  );
}
console.log();

// --- and what it costs in memory ---------------------------------------

const REAL_WIDTH = 4096;
console.log(
  "memory for one sequence's cache, " + LAYERS + " layers of width " + REAL_WIDTH + ", two",
);
console.log("arrays per layer for keys and values, " + BYTES_PER_NUMBER + " bytes a number:");
console.log();
console.log("   context        bytes    megabytes");
for (const context of [1024, 8192, 32768, 131072]) {
  const total = 2 * LAYERS * REAL_WIDTH * context * BYTES_PER_NUMBER;
  console.log(
    padLeft(context, 10) + " " + padLeft(total, 12) + " " +
      padLeft(Math.floor(total / 1024 / 1024), 12),
  );
}
console.log();
console.log(
  [
    "Three separate costs, and they are usually confused with each other.",
    "",
    "The first table is the cache doing its job. Without it, every new token",
    "re-runs attention over the entire prefix, and the count grows by 7.9",
    "each time the sequence doubles -- cubic. With it, the earlier keys and",
    "values are already stored, the new token attends to them, and the count",
    "grows by 3.9 -- quadratic. At 512 tokens that is a factor of 171, and",
    "the factor keeps widening.",
    "",
    "The second table is the cost the cache does not remove, and it is the",
    "one that matters for long context. One token at position 4096 costs",
    "4096 times what the first token cost, because it attends to 4096",
    "cached entries. Generation does not slow down because the model is",
    "tired; it slows down because the loop it runs is over the cache, and",
    "the cache is longer. Every claim about quadratic context length is",
    "this one line: attention over a prefix is linear in the prefix, and",
    "doing it for every token in the prefix is quadratic in total.",
    "",
    "The third table is the growing array from early in this track, and it",
    "is the reason nobody worries about the append itself. Growing the",
    "cache by exactly one entry per token moves 33 million entries over",
    "8192 tokens. Doubling the capacity when it fills moves 8191 -- 0.99",
    "moves per token, amortised constant, and the number stays at 0.99 at",
    "every size. That is the dynamic array's amortised argument, unchanged,",
    "applied to the single hottest buffer in a language model runtime.",
    "",
    "The last table is why context length is sold rather than given away.",
    "One sequence at 128k context on a 32-layer model of width 4096 needs",
    "64 gigabytes of cache, in fp16, for one user. That is not the model's",
    "weights -- the weights are loaded once and shared -- it is per",
    "conversation, and it is why serving long contexts is a memory problem",
    "before it is a compute problem. Grouped-query attention, which shares",
    "one set of keys and values across several query heads, exists to",
    "divide precisely this table.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "typescript",
              code: `// The KV cache is a growing array, and the reason context length is
// expensive is entirely visible from counting what the loops do.

const WIDTH = 64; // the model's hidden size, kept small so the counts read
const LAYERS = 32; // a mid-sized model
const BYTES_PER_NUMBER = 2; // fp16

function withoutCache(tokens: number): number {
  // every new token re-runs attention over the whole prefix from scratch
  let work = 0;
  for (let step = 0; step < tokens; step++) {
    for (let position = 0; position <= step; position++) {
      // this position attends to every position at or before it
      work += 2 * WIDTH * (position + 1);
    }
  }
  return work;
}

function withCache(tokens: number): number {
  // keys and values for earlier tokens are already stored, so the new
  // token attends to the cache and nothing else is recomputed
  let work = 0;
  for (let step = 0; step < tokens; step++) work += 2 * WIDTH * (step + 1);
  return work;
}

function perToken(step: number): number {
  return 2 * WIDTH * (step + 1);
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

console.log("counting multiply-accumulates for generating one sequence");
console.log("(hidden size " + WIDTH + ", one layer)");
console.log();
console.log("   tokens   no cache   x   with cache   x    saving");
const sizes = [64, 128, 256, 512];
let previousSlow = 0;
let previousFast = 0;
for (const tokens of sizes) {
  const slow = withoutCache(tokens);
  const fast = withCache(tokens);
  let slowRatio = "  -";
  let fastRatio = "  -";
  if (previousSlow !== 0) {
    const a = Math.floor((slow * 10) / previousSlow);
    const b = Math.floor((fast * 10) / previousFast);
    slowRatio = Math.floor(a / 10) + "." + (a % 10);
    fastRatio = Math.floor(b / 10) + "." + (b % 10);
  }
  const saving = Math.floor(slow / fast);
  console.log(
    padLeft(tokens, 9) + " " + padLeft(slow, 10) + " " + padLeft(slowRatio, 3) + " " +
      padLeft(fast, 12) + " " + padLeft(fastRatio, 3) + " " + padLeft(saving, 8) + "x",
  );
  previousSlow = slow;
  previousFast = fast;
}
console.log();
console.log("the cache does not make generation cheap, it makes it quadratic");
console.log("instead of cubic. what one token costs, with the cache:");
console.log();
console.log("  position     work   x the first token");
for (const step of [0, 63, 255, 1023, 4095]) {
  console.log(
    padLeft(step + 1, 10) + " " + padLeft(perToken(step), 8) + " " +
      padLeft(Math.floor(perToken(step) / perToken(0)), 18),
  );
}
console.log();

// --- the cache itself is a growing array --------------------------------

function copiesGrowingByOne(tokens: number): number {
  let copies = 0;
  let length = 0;
  for (let t = 0; t < tokens; t++) {
    // a fresh array one longer, then everything moved across
    copies += length;
    length += 1;
  }
  return copies;
}

function copiesDoubling(tokens: number): number {
  let copies = 0;
  let length = 0;
  let capacity = 1;
  for (let t = 0; t < tokens; t++) {
    if (length === capacity) {
      copies += length;
      capacity *= 2;
    }
    length += 1;
  }
  return copies;
}

console.log("appending tokens to the cache one at a time, counting entries moved:");
console.log();
console.log("   tokens   grow by one     doubling   moves per token");
for (const tokens of [1024, 2048, 4096, 8192]) {
  const one = copiesGrowingByOne(tokens);
  const two = copiesDoubling(tokens);
  const per = Math.floor((two * 100) / tokens);
  const fraction = per % 100;
  console.log(
    padLeft(tokens, 9) + " " + padLeft(one, 13) + " " + padLeft(two, 12) + " " +
      padLeft(Math.floor(per / 100), 11) + "." + (fraction < 10 ? "0" : "") + fraction,
  );
}
console.log();

// --- and what it costs in memory ---------------------------------------

const REAL_WIDTH = 4096;
console.log(
  "memory for one sequence's cache, " + LAYERS + " layers of width " + REAL_WIDTH + ", two",
);
console.log("arrays per layer for keys and values, " + BYTES_PER_NUMBER + " bytes a number:");
console.log();
console.log("   context        bytes    megabytes");
for (const context of [1024, 8192, 32768, 131072]) {
  const total = 2 * LAYERS * REAL_WIDTH * context * BYTES_PER_NUMBER;
  console.log(
    padLeft(context, 10) + " " + padLeft(total, 12) + " " +
      padLeft(Math.floor(total / 1024 / 1024), 12),
  );
}
console.log();
console.log(
  [
    "Three separate costs, and they are usually confused with each other.",
    "",
    "The first table is the cache doing its job. Without it, every new token",
    "re-runs attention over the entire prefix, and the count grows by 7.9",
    "each time the sequence doubles -- cubic. With it, the earlier keys and",
    "values are already stored, the new token attends to them, and the count",
    "grows by 3.9 -- quadratic. At 512 tokens that is a factor of 171, and",
    "the factor keeps widening.",
    "",
    "The second table is the cost the cache does not remove, and it is the",
    "one that matters for long context. One token at position 4096 costs",
    "4096 times what the first token cost, because it attends to 4096",
    "cached entries. Generation does not slow down because the model is",
    "tired; it slows down because the loop it runs is over the cache, and",
    "the cache is longer. Every claim about quadratic context length is",
    "this one line: attention over a prefix is linear in the prefix, and",
    "doing it for every token in the prefix is quadratic in total.",
    "",
    "The third table is the growing array from early in this track, and it",
    "is the reason nobody worries about the append itself. Growing the",
    "cache by exactly one entry per token moves 33 million entries over",
    "8192 tokens. Doubling the capacity when it fills moves 8191 -- 0.99",
    "moves per token, amortised constant, and the number stays at 0.99 at",
    "every size. That is the dynamic array's amortised argument, unchanged,",
    "applied to the single hottest buffer in a language model runtime.",
    "",
    "The last table is why context length is sold rather than given away.",
    "One sequence at 128k context on a 32-layer model of width 4096 needs",
    "64 gigabytes of cache, in fp16, for one user. That is not the model's",
    "weights -- the weights are loaded once and shared -- it is per",
    "conversation, and it is why serving long contexts is a memory problem",
    "before it is a compute problem. Grouped-query attention, which shares",
    "one set of keys and values across several query heads, exists to",
    "divide precisely this table.",
  ].join("\\n"),
);
`,
            },
            {
              lang: "java",
              code: `// The KV cache is a growing array, and the reason context length is
// expensive is entirely visible from counting what the loops do.

public class Main {
  static final int WIDTH = 64; // the model's hidden size, kept small so the counts read
  static final int LAYERS = 32; // a mid-sized model
  static final int BYTES_PER_NUMBER = 2; // fp16

  static long withoutCache(int tokens) {
    // every new token re-runs attention over the whole prefix from scratch
    long work = 0;
    for (int step = 0; step < tokens; step++) {
      for (int position = 0; position <= step; position++) {
        // this position attends to every position at or before it
        work += 2L * WIDTH * (position + 1);
      }
    }
    return work;
  }

  static long withCache(int tokens) {
    // keys and values for earlier tokens are already stored, so the new
    // token attends to the cache and nothing else is recomputed
    long work = 0;
    for (int step = 0; step < tokens; step++) {
      work += 2L * WIDTH * (step + 1);
    }
    return work;
  }

  static long perToken(int step) {
    return 2L * WIDTH * (step + 1);
  }

  static long copiesGrowingByOne(int tokens) {
    long copies = 0;
    long length = 0;
    for (int t = 0; t < tokens; t++) {
      // a fresh array one longer, then everything moved across
      copies += length;
      length += 1;
    }
    return copies;
  }

  static long copiesDoubling(int tokens) {
    long copies = 0;
    long length = 0;
    long capacity = 1;
    for (int t = 0; t < tokens; t++) {
      if (length == capacity) {
        copies += length;
        capacity *= 2;
      }
      length += 1;
    }
    return copies;
  }

  public static void main(String[] args) {
    System.out.println("counting multiply-accumulates for generating one sequence");
    System.out.printf("(hidden size %d, one layer)%n", WIDTH);
    System.out.println();
    System.out.println("   tokens   no cache   x   with cache   x    saving");
    int[] sizes = {64, 128, 256, 512};
    long previousSlow = 0;
    long previousFast = 0;
    for (int tokens : sizes) {
      long slow = withoutCache(tokens);
      long fast = withCache(tokens);
      String slowRatio = "  -";
      String fastRatio = "  -";
      if (previousSlow != 0) {
        long a = slow * 10 / previousSlow;
        long b = fast * 10 / previousFast;
        slowRatio = String.format("%d.%d", a / 10, a % 10);
        fastRatio = String.format("%d.%d", b / 10, b % 10);
      }
      long saving = slow / fast;
      System.out.printf(
          "%9d %10d %3s %12d %3s %8dx%n", tokens, slow, slowRatio, fast, fastRatio, saving);
      previousSlow = slow;
      previousFast = fast;
    }
    System.out.println();
    System.out.println("the cache does not make generation cheap, it makes it quadratic");
    System.out.println("instead of cubic. what one token costs, with the cache:");
    System.out.println();
    System.out.println("  position     work   x the first token");
    int[] positions = {0, 63, 255, 1023, 4095};
    for (int step : positions) {
      System.out.printf(
          "%10d %8d %18d%n", step + 1, perToken(step), perToken(step) / perToken(0));
    }
    System.out.println();

    System.out.println("appending tokens to the cache one at a time, counting entries moved:");
    System.out.println();
    System.out.println("   tokens   grow by one     doubling   moves per token");
    int[] lengths = {1024, 2048, 4096, 8192};
    for (int tokens : lengths) {
      long one = copiesGrowingByOne(tokens);
      long two = copiesDoubling(tokens);
      long per = two * 100 / tokens;
      System.out.printf("%9d %13d %12d %11d.%02d%n", tokens, one, two, per / 100, per % 100);
    }
    System.out.println();

    final int realWidth = 4096;
    System.out.printf(
        "memory for one sequence's cache, %d layers of width %d, two%n", LAYERS, realWidth);
    System.out.printf(
        "arrays per layer for keys and values, %d bytes a number:%n", BYTES_PER_NUMBER);
    System.out.println();
    System.out.println("   context        bytes    megabytes");
    int[] contexts = {1024, 8192, 32768, 131072};
    for (int context : contexts) {
      long total = 2L * LAYERS * realWidth * context * BYTES_PER_NUMBER;
      System.out.printf("%10d %12d %12d%n", context, total, total / 1024 / 1024);
    }
    System.out.println();
    System.out.println(String.join("\\n",
        "Three separate costs, and they are usually confused with each other.",
        "",
        "The first table is the cache doing its job. Without it, every new token",
        "re-runs attention over the entire prefix, and the count grows by 7.9",
        "each time the sequence doubles -- cubic. With it, the earlier keys and",
        "values are already stored, the new token attends to them, and the count",
        "grows by 3.9 -- quadratic. At 512 tokens that is a factor of 171, and",
        "the factor keeps widening.",
        "",
        "The second table is the cost the cache does not remove, and it is the",
        "one that matters for long context. One token at position 4096 costs",
        "4096 times what the first token cost, because it attends to 4096",
        "cached entries. Generation does not slow down because the model is",
        "tired; it slows down because the loop it runs is over the cache, and",
        "the cache is longer. Every claim about quadratic context length is",
        "this one line: attention over a prefix is linear in the prefix, and",
        "doing it for every token in the prefix is quadratic in total.",
        "",
        "The third table is the growing array from early in this track, and it",
        "is the reason nobody worries about the append itself. Growing the",
        "cache by exactly one entry per token moves 33 million entries over",
        "8192 tokens. Doubling the capacity when it fills moves 8191 -- 0.99",
        "moves per token, amortised constant, and the number stays at 0.99 at",
        "every size. That is the dynamic array's amortised argument, unchanged,",
        "applied to the single hottest buffer in a language model runtime.",
        "",
        "The last table is why context length is sold rather than given away.",
        "One sequence at 128k context on a 32-layer model of width 4096 needs",
        "64 gigabytes of cache, in fp16, for one user. That is not the model's",
        "weights -- the weights are loaded once and shared -- it is per",
        "conversation, and it is why serving long contexts is a memory problem",
        "before it is a compute problem. Grouped-query attention, which shares",
        "one set of keys and values across several query heads, exists to",
        "divide precisely this table."));
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// The KV cache is a growing array, and the reason context length is
// expensive is entirely visible from counting what the loops do.

#include <cstdio>
#include <iostream>
#include <string>

static const int WIDTH = 64;            // the model's hidden size, kept small so the counts read
static const int LAYERS = 32;           // a mid-sized model
static const int BYTES_PER_NUMBER = 2;  // fp16

long long withoutCache(int tokens) {
  // every new token re-runs attention over the whole prefix from scratch
  long long work = 0;
  for (int step = 0; step < tokens; step++) {
    for (int position = 0; position <= step; position++) {
      // this position attends to every position at or before it
      work += 2LL * WIDTH * (position + 1);
    }
  }
  return work;
}

long long withCache(int tokens) {
  // keys and values for earlier tokens are already stored, so the new
  // token attends to the cache and nothing else is recomputed
  long long work = 0;
  for (int step = 0; step < tokens; step++) {
    work += 2LL * WIDTH * (step + 1);
  }
  return work;
}

long long perToken(int step) {
  return 2LL * WIDTH * (step + 1);
}

long long copiesGrowingByOne(int tokens) {
  long long copies = 0;
  long long length = 0;
  for (int t = 0; t < tokens; t++) {
    // a fresh array one longer, then everything moved across
    copies += length;
    length += 1;
  }
  return copies;
}

long long copiesDoubling(int tokens) {
  long long copies = 0;
  long long length = 0;
  long long capacity = 1;
  for (int t = 0; t < tokens; t++) {
    if (length == capacity) {
      copies += length;
      capacity *= 2;
    }
    length += 1;
  }
  return copies;
}

int main() {
  std::printf("counting multiply-accumulates for generating one sequence\\n");
  std::printf("(hidden size %d, one layer)\\n", WIDTH);
  std::printf("\\n");
  std::printf("   tokens   no cache   x   with cache   x    saving\\n");
  int sizes[4] = {64, 128, 256, 512};
  long long previousSlow = 0;
  long long previousFast = 0;
  for (int s = 0; s < 4; s++) {
    int tokens = sizes[s];
    long long slow = withoutCache(tokens);
    long long fast = withCache(tokens);
    std::string slowRatio = "  -";
    std::string fastRatio = "  -";
    char buffer[32];
    if (previousSlow != 0) {
      long long a = slow * 10 / previousSlow;
      long long b = fast * 10 / previousFast;
      std::snprintf(buffer, sizeof(buffer), "%lld.%lld", a / 10, a % 10);
      slowRatio = buffer;
      std::snprintf(buffer, sizeof(buffer), "%lld.%lld", b / 10, b % 10);
      fastRatio = buffer;
    }
    long long saving = slow / fast;
    std::printf("%9d %10lld %3s %12lld %3s %8lldx\\n", tokens, slow, slowRatio.c_str(), fast,
                fastRatio.c_str(), saving);
    previousSlow = slow;
    previousFast = fast;
  }
  std::printf("\\n");
  std::printf("the cache does not make generation cheap, it makes it quadratic\\n");
  std::printf("instead of cubic. what one token costs, with the cache:\\n");
  std::printf("\\n");
  std::printf("  position     work   x the first token\\n");
  int positions[5] = {0, 63, 255, 1023, 4095};
  for (int p = 0; p < 5; p++) {
    int step = positions[p];
    std::printf("%10d %8lld %18lld\\n", step + 1, perToken(step), perToken(step) / perToken(0));
  }
  std::printf("\\n");

  std::printf("appending tokens to the cache one at a time, counting entries moved:\\n");
  std::printf("\\n");
  std::printf("   tokens   grow by one     doubling   moves per token\\n");
  int lengths[4] = {1024, 2048, 4096, 8192};
  for (int l = 0; l < 4; l++) {
    int tokens = lengths[l];
    long long one = copiesGrowingByOne(tokens);
    long long two = copiesDoubling(tokens);
    long long per = two * 100 / tokens;
    std::printf("%9d %13lld %12lld %11lld.%02lld\\n", tokens, one, two, per / 100, per % 100);
  }
  std::printf("\\n");

  const int realWidth = 4096;
  std::printf("memory for one sequence's cache, %d layers of width %d, two\\n", LAYERS, realWidth);
  std::printf("arrays per layer for keys and values, %d bytes a number:\\n", BYTES_PER_NUMBER);
  std::printf("\\n");
  std::printf("   context        bytes    megabytes\\n");
  int contexts[4] = {1024, 8192, 32768, 131072};
  for (int c = 0; c < 4; c++) {
    long long total = 2LL * LAYERS * realWidth * contexts[c] * BYTES_PER_NUMBER;
    std::printf("%10d %12lld %12lld\\n", contexts[c], total, total / 1024 / 1024);
  }
  std::printf("\\n");
    std::cout
        << "Three separate costs, and they are usually confused with each other." << "\\n"
        << "" << "\\n"
        << "The first table is the cache doing its job. Without it, every new token" << "\\n"
        << "re-runs attention over the entire prefix, and the count grows by 7.9" << "\\n"
        << "each time the sequence doubles -- cubic. With it, the earlier keys and" << "\\n"
        << "values are already stored, the new token attends to them, and the count" << "\\n"
        << "grows by 3.9 -- quadratic. At 512 tokens that is a factor of 171, and" << "\\n"
        << "the factor keeps widening." << "\\n"
        << "" << "\\n"
        << "The second table is the cost the cache does not remove, and it is the" << "\\n"
        << "one that matters for long context. One token at position 4096 costs" << "\\n"
        << "4096 times what the first token cost, because it attends to 4096" << "\\n"
        << "cached entries. Generation does not slow down because the model is" << "\\n"
        << "tired; it slows down because the loop it runs is over the cache, and" << "\\n"
        << "the cache is longer. Every claim about quadratic context length is" << "\\n"
        << "this one line: attention over a prefix is linear in the prefix, and" << "\\n"
        << "doing it for every token in the prefix is quadratic in total." << "\\n"
        << "" << "\\n"
        << "The third table is the growing array from early in this track, and it" << "\\n"
        << "is the reason nobody worries about the append itself. Growing the" << "\\n"
        << "cache by exactly one entry per token moves 33 million entries over" << "\\n"
        << "8192 tokens. Doubling the capacity when it fills moves 8191 -- 0.99" << "\\n"
        << "moves per token, amortised constant, and the number stays at 0.99 at" << "\\n"
        << "every size. That is the dynamic array's amortised argument, unchanged," << "\\n"
        << "applied to the single hottest buffer in a language model runtime." << "\\n"
        << "" << "\\n"
        << "The last table is why context length is sold rather than given away." << "\\n"
        << "One sequence at 128k context on a 32-layer model of width 4096 needs" << "\\n"
        << "64 gigabytes of cache, in fp16, for one user. That is not the model's" << "\\n"
        << "weights -- the weights are loaded once and shared -- it is per" << "\\n"
        << "conversation, and it is why serving long contexts is a memory problem" << "\\n"
        << "before it is a compute problem. Grouped-query attention, which shares" << "\\n"
        << "one set of keys and values across several query heads, exists to" << "\\n"
        << "divide precisely this table." << "\\n"
        ;
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The KV cache is a growing array, and the reason context length is
// expensive is entirely visible from counting what the loops do.

const WIDTH: i64 = 64; // the model's hidden size, kept small so the counts read
const LAYERS: i64 = 32; // a mid-sized model
const BYTES_PER_NUMBER: i64 = 2; // fp16

fn without_cache(tokens: i64) -> i64 {
    // every new token re-runs attention over the whole prefix from scratch
    let mut work = 0;
    for step in 0..tokens {
        for position in 0..=step {
            // this position attends to every position at or before it
            work += 2 * WIDTH * (position + 1);
        }
    }
    work
}

fn with_cache(tokens: i64) -> i64 {
    // keys and values for earlier tokens are already stored, so the new
    // token attends to the cache and nothing else is recomputed
    let mut work = 0;
    for step in 0..tokens {
        work += 2 * WIDTH * (step + 1);
    }
    work
}

fn per_token(step: i64) -> i64 {
    2 * WIDTH * (step + 1)
}

fn copies_growing_by_one(tokens: i64) -> i64 {
    let mut copies = 0;
    let mut length = 0;
    for _ in 0..tokens {
        // a fresh array one longer, then everything moved across
        copies += length;
        length += 1;
    }
    copies
}

fn copies_doubling(tokens: i64) -> i64 {
    let mut copies = 0;
    let mut length = 0;
    let mut capacity = 1;
    for _ in 0..tokens {
        if length == capacity {
            copies += length;
            capacity *= 2;
        }
        length += 1;
    }
    copies
}

fn main() {
    println!("counting multiply-accumulates for generating one sequence");
    println!("(hidden size {}, one layer)", WIDTH);
    println!();
    println!("   tokens   no cache   x   with cache   x    saving");
    let sizes = [64i64, 128, 256, 512];
    let mut previous_slow = 0;
    let mut previous_fast = 0;
    for &tokens in sizes.iter() {
        let slow = without_cache(tokens);
        let fast = with_cache(tokens);
        let mut slow_ratio = String::from("  -");
        let mut fast_ratio = String::from("  -");
        if previous_slow != 0 {
            let a = slow * 10 / previous_slow;
            let b = fast * 10 / previous_fast;
            slow_ratio = format!("{}.{}", a / 10, a % 10);
            fast_ratio = format!("{}.{}", b / 10, b % 10);
        }
        let saving = slow / fast;
        println!(
            "{:>9} {:>10} {:>3} {:>12} {:>3} {:>8}x",
            tokens, slow, slow_ratio, fast, fast_ratio, saving
        );
        previous_slow = slow;
        previous_fast = fast;
    }
    println!();
    println!("the cache does not make generation cheap, it makes it quadratic");
    println!("instead of cubic. what one token costs, with the cache:");
    println!();
    println!("  position     work   x the first token");
    for &step in [0i64, 63, 255, 1023, 4095].iter() {
        println!(
            "{:>10} {:>8} {:>18}",
            step + 1,
            per_token(step),
            per_token(step) / per_token(0)
        );
    }
    println!();

    println!("appending tokens to the cache one at a time, counting entries moved:");
    println!();
    println!("   tokens   grow by one     doubling   moves per token");
    for &tokens in [1024i64, 2048, 4096, 8192].iter() {
        let one = copies_growing_by_one(tokens);
        let two = copies_doubling(tokens);
        let per = two * 100 / tokens;
        println!("{:>9} {:>13} {:>12} {:>11}.{:02}", tokens, one, two, per / 100, per % 100);
    }
    println!();

    let real_width: i64 = 4096;
    println!(
        "memory for one sequence's cache, {} layers of width {}, two",
        LAYERS, real_width
    );
    println!(
        "arrays per layer for keys and values, {} bytes a number:",
        BYTES_PER_NUMBER
    );
    println!();
    println!("   context        bytes    megabytes");
    for &context in [1024i64, 8192, 32768, 131072].iter() {
        let total = 2 * LAYERS * real_width * context * BYTES_PER_NUMBER;
        println!("{:>10} {:>12} {:>12}", context, total, total / 1024 / 1024);
    }
    println!();
    println!("{}", [
        "Three separate costs, and they are usually confused with each other.",
        "",
        "The first table is the cache doing its job. Without it, every new token",
        "re-runs attention over the entire prefix, and the count grows by 7.9",
        "each time the sequence doubles -- cubic. With it, the earlier keys and",
        "values are already stored, the new token attends to them, and the count",
        "grows by 3.9 -- quadratic. At 512 tokens that is a factor of 171, and",
        "the factor keeps widening.",
        "",
        "The second table is the cost the cache does not remove, and it is the",
        "one that matters for long context. One token at position 4096 costs",
        "4096 times what the first token cost, because it attends to 4096",
        "cached entries. Generation does not slow down because the model is",
        "tired; it slows down because the loop it runs is over the cache, and",
        "the cache is longer. Every claim about quadratic context length is",
        "this one line: attention over a prefix is linear in the prefix, and",
        "doing it for every token in the prefix is quadratic in total.",
        "",
        "The third table is the growing array from early in this track, and it",
        "is the reason nobody worries about the append itself. Growing the",
        "cache by exactly one entry per token moves 33 million entries over",
        "8192 tokens. Doubling the capacity when it fills moves 8191 -- 0.99",
        "moves per token, amortised constant, and the number stays at 0.99 at",
        "every size. That is the dynamic array's amortised argument, unchanged,",
        "applied to the single hottest buffer in a language model runtime.",
        "",
        "The last table is why context length is sold rather than given away.",
        "One sequence at 128k context on a 32-layer model of width 4096 needs",
        "64 gigabytes of cache, in fp16, for one user. That is not the model's",
        "weights -- the weights are loaded once and shared -- it is per",
        "conversation, and it is why serving long contexts is a memory problem",
        "before it is a compute problem. Grouped-query attention, which shares",
        "one set of keys and values across several query heads, exists to",
        "divide precisely this table.",
    ].join("\\n"));
}
`,
            },
            {
              lang: "go",
              code: `// The KV cache is a growing array, and the reason context length is
// expensive is entirely visible from counting what the loops do.

package main

import (
	"fmt"
	"strings"
)

const width = 64         // the model's hidden size, kept small so the counts read
const layers = 32        // a mid-sized model
const bytesPerNumber = 2 // fp16

func withoutCache(tokens int64) int64 {
	// every new token re-runs attention over the whole prefix from scratch
	var work int64
	for step := int64(0); step < tokens; step++ {
		for position := int64(0); position <= step; position++ {
			// this position attends to every position at or before it
			work += 2 * width * (position + 1)
		}
	}
	return work
}

func withCache(tokens int64) int64 {
	// keys and values for earlier tokens are already stored, so the new
	// token attends to the cache and nothing else is recomputed
	var work int64
	for step := int64(0); step < tokens; step++ {
		work += 2 * width * (step + 1)
	}
	return work
}

func perToken(step int64) int64 {
	return 2 * width * (step + 1)
}

func copiesGrowingByOne(tokens int64) int64 {
	var copies int64
	var length int64
	for t := int64(0); t < tokens; t++ {
		// a fresh array one longer, then everything moved across
		copies += length
		length++
	}
	return copies
}

func copiesDoubling(tokens int64) int64 {
	var copies int64
	var length int64
	var capacity int64 = 1
	for t := int64(0); t < tokens; t++ {
		if length == capacity {
			copies += length
			capacity *= 2
		}
		length++
	}
	return copies
}

func main() {
	fmt.Println("counting multiply-accumulates for generating one sequence")
	fmt.Printf("(hidden size %d, one layer)\\n", width)
	fmt.Println()
	fmt.Println("   tokens   no cache   x   with cache   x    saving")
	var previousSlow int64
	var previousFast int64
	for _, tokens := range []int64{64, 128, 256, 512} {
		slow := withoutCache(tokens)
		fast := withCache(tokens)
		slowRatio := "  -"
		fastRatio := "  -"
		if previousSlow != 0 {
			a := slow * 10 / previousSlow
			b := fast * 10 / previousFast
			slowRatio = fmt.Sprintf("%d.%d", a/10, a%10)
			fastRatio = fmt.Sprintf("%d.%d", b/10, b%10)
		}
		saving := slow / fast
		fmt.Printf("%9d %10d %3s %12d %3s %8dx\\n", tokens, slow, slowRatio, fast, fastRatio, saving)
		previousSlow = slow
		previousFast = fast
	}
	fmt.Println()
	fmt.Println("the cache does not make generation cheap, it makes it quadratic")
	fmt.Println("instead of cubic. what one token costs, with the cache:")
	fmt.Println()
	fmt.Println("  position     work   x the first token")
	for _, step := range []int64{0, 63, 255, 1023, 4095} {
		fmt.Printf("%10d %8d %18d\\n", step+1, perToken(step), perToken(step)/perToken(0))
	}
	fmt.Println()

	fmt.Println("appending tokens to the cache one at a time, counting entries moved:")
	fmt.Println()
	fmt.Println("   tokens   grow by one     doubling   moves per token")
	for _, tokens := range []int64{1024, 2048, 4096, 8192} {
		one := copiesGrowingByOne(tokens)
		two := copiesDoubling(tokens)
		per := two * 100 / tokens
		fmt.Printf("%9d %13d %12d %11d.%02d\\n", tokens, one, two, per/100, per%100)
	}
	fmt.Println()

	var realWidth int64 = 4096
	fmt.Printf("memory for one sequence's cache, %d layers of width %d, two\\n", layers, realWidth)
	fmt.Printf("arrays per layer for keys and values, %d bytes a number:\\n", bytesPerNumber)
	fmt.Println()
	fmt.Println("   context        bytes    megabytes")
	for _, context := range []int64{1024, 8192, 32768, 131072} {
		total := 2 * layers * realWidth * context * bytesPerNumber
		fmt.Printf("%10d %12d %12d\\n", context, total, total/1024/1024)
	}
	fmt.Println()
	fmt.Println(strings.Join([]string{
		"Three separate costs, and they are usually confused with each other.",
		"",
		"The first table is the cache doing its job. Without it, every new token",
		"re-runs attention over the entire prefix, and the count grows by 7.9",
		"each time the sequence doubles -- cubic. With it, the earlier keys and",
		"values are already stored, the new token attends to them, and the count",
		"grows by 3.9 -- quadratic. At 512 tokens that is a factor of 171, and",
		"the factor keeps widening.",
		"",
		"The second table is the cost the cache does not remove, and it is the",
		"one that matters for long context. One token at position 4096 costs",
		"4096 times what the first token cost, because it attends to 4096",
		"cached entries. Generation does not slow down because the model is",
		"tired; it slows down because the loop it runs is over the cache, and",
		"the cache is longer. Every claim about quadratic context length is",
		"this one line: attention over a prefix is linear in the prefix, and",
		"doing it for every token in the prefix is quadratic in total.",
		"",
		"The third table is the growing array from early in this track, and it",
		"is the reason nobody worries about the append itself. Growing the",
		"cache by exactly one entry per token moves 33 million entries over",
		"8192 tokens. Doubling the capacity when it fills moves 8191 -- 0.99",
		"moves per token, amortised constant, and the number stays at 0.99 at",
		"every size. That is the dynamic array's amortised argument, unchanged,",
		"applied to the single hottest buffer in a language model runtime.",
		"",
		"The last table is why context length is sold rather than given away.",
		"One sequence at 128k context on a 32-layer model of width 4096 needs",
		"64 gigabytes of cache, in fp16, for one user. That is not the model's",
		"weights -- the weights are loaded once and shared -- it is per",
		"conversation, and it is why serving long contexts is a memory problem",
		"before it is a compute problem. Grouped-query attention, which shares",
		"one set of keys and values across several query heads, exists to",
		"divide precisely this table.",
	}, "\\n"))
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "the-quadratic",
      heading: "Where the quadratic actually comes from",
      body: [
        "The second table is the one worth being precise about, because \"attention is quadratic\" gets said a lot and is usually explained badly.",
        "One token's attention step is **linear in the length of the cache** \u2014 it computes a score against every stored key and then a weighted sum over every stored value. That is the loop, and it is `O(t)` at position `t`.",
        "Generating a sequence runs that loop once per token, so the total is the sum of `1 + 2 + ... + n`, which is `O(n^2)`. There is nothing mysterious in it: **the quadratic is a linear loop run a linear number of times**, and it is visible in the measured column where position 4096 costs 4096 times position 1.",
        "This is also why generation visibly slows down as a conversation gets longer. Each token is doing strictly more work than the one before it, and the growth is linear in the conversation so far. The model is not degrading; the loop is longer.",
        "And it is why the cache cannot fix it. The cache removed the *recomputation* of earlier keys and values \u2014 a cubic cost \u2014 and left the *attention over them*, which is the quadratic one. Removing that requires changing attention itself, which is what sliding-window attention, sparse attention and the various linear-attention schemes are all attempts at.",
      ],
      pitfalls: [
        {
          title: "Saying the cache makes generation linear",
          body: "It makes it quadratic instead of cubic. The measured doubling ratios are 7.9 without and 3.9 with, and 3.9 is not 2.0.",
        },
        {
          title: "Confusing the model's weights with the cache",
          body: "Weights are loaded once and shared across every request. The cache is per conversation, and the memory table is per conversation.",
        },
        {
          title: "Assuming a longer context window is free once supported",
          body: "The last table is the price: 512 MB at 1k tokens, 64 GB at 128k, for one sequence — before grouped-query attention, which divides it. Support for long context is a memory purchase.",
        },
      ],
    },
    {
      id: "the-array",
      heading: "The cache is a dynamic array",
      body: [
        "The third table is the earliest data structure in this track, appearing in the hottest buffer in a language model runtime.",
        "The cache is appended to once per token and never has an entry removed mid-sequence. That is a dynamic array, and the growth policy question is the same one: how much capacity to allocate when it fills.",
        "Growing by exactly one entry per token means copying the whole cache on every token, and the measured total is 33 million entry moves over 8,192 tokens. Doubling the capacity when full moves 8,191 \u2014 **0.99 per token, and it stays at 0.99 at every size measured.** That is the amortised argument, unchanged, and it is why nobody profiling a model runtime ever sees the append.",
        "Real implementations do one thing differently that is worth knowing, because it is a data structure decision too. Doubling a 32 GB cache to 64 GB means briefly holding 96 GB, which is not acceptable, and a conversation that ends leaves a hole no other conversation quite fits. So serving systems use **paged attention**: the cache is stored in fixed-size blocks with a table mapping logical positions to blocks, and it grows one block at a time.",
        "That is virtual memory, applied to a tensor. It gives up contiguity, which attention did not need, and gets back the ability to allocate in fixed units and share blocks between requests with a common prefix \u2014 the same system prompt cached once for every user of it.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the KV cache and what does it save?",
      answer:
        "Each token's key and value depend on it and the tokens before it and never on what comes after, so they never change once computed -- expensive, reused every step, immutable, which is the textbook case for caching. Without it, generating token 500 recomputes keys and values for all 499 earlier tokens, and it did that at token 499 too. I counted it: without the cache the work grows by 7.9 each time the sequence doubles, which is cubic; with it, 3.9, which is quadratic. At 512 tokens that is a factor of 171. What it does not do is make generation cheap -- it turns cubic into quadratic, and 3.9 is not 2.0.",
    },
    {
      question: "Why is context length quadratic?",
      answer:
        "Because attention for one token is linear in the cache length -- a score against every stored key and a weighted sum over every stored value -- and generation runs that loop once per token. A linear loop run a linear number of times is quadratic. In my measurement, a token at position 4096 costs exactly 4096 times what the first token cost. That is also why generation visibly slows down in a long conversation: each token does strictly more work than the last. The cache cannot fix it, because the cache removed the recomputation of earlier keys and values and left the attention over them. Fixing that means changing attention -- sliding windows, sparsity, linear attention.",
    },
    {
      question: "How is the KV cache managed in memory?",
      answer:
        "It is a dynamic array: appended once per token, never shortened mid-sequence. Growing by one entry per token moves 33 million entries over 8192 tokens; doubling the capacity moves 8191, which is 0.99 moves per token at every size -- the standard amortised argument, which is why nobody profiling a runtime sees the append. Real systems do not double, though, because doubling a 32 GB cache to 64 GB means briefly holding 96 GB. They use paged attention: fixed-size blocks with a table from logical position to block, grown one block at a time. That is virtual memory applied to a tensor, and it also lets two requests with the same system prompt share the blocks for it.",
    },
  ],
  takeaways: [
    "Keys and values never depend on later tokens, so they never change once computed",
    "Measured doubling ratios: 7.9 without the cache, 3.9 with — cubic to quadratic",
    "The quadratic is a linear loop run a linear number of times",
    "A token at position 4096 costs 4096 times the first token",
    "The cache is a dynamic array: 0.99 moves per token when doubling",
    "128k context on a 32-layer model of width 4096 is 64 GB, per conversation",
    "Paged attention is virtual memory for the cache: fixed blocks, shared prefixes",
  ],
};
