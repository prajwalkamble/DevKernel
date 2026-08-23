import type { Lesson } from "@/content/types";

export const countingBucketRadixLesson: Lesson = {
  id: "dsa-sort-linear",
  slug: "counting-bucket-and-radix",
  moduleSlug: "sorting",
  title: "Counting, Bucket and Radix",
  summary:
    "Three sorts that use the key as an address rather than comparing it. Each is linear under a condition, and knowing the condition is what stops you reaching for them when they do not apply.",
  estimatedMinutes: 30,
  objectives: [
    "Implement counting sort and explain why it is stable",
    "State the condition each linear sort requires",
    "Explain radix sort as repeated stable counting sort",
    "Recognise a bounded key range in a problem statement",
  ],
  sections: [
    {
      id: "counting",
      heading: "Counting sort",
      body: [
        "Tally how many of each key there are, turn the tallies into running totals so each key knows where its block ends, then place elements into position. O(n + k) for keys in 0..k, and no comparison anywhere.",
        "The stability detail matters more than it looks. Walking the input **backwards** while decrementing the running count puts the last equal element at the end of its block, preserving input order. Forwards gives a correct sort with equal elements reversed — fine on bare integers, fatal inside radix sort.",
        "It is worth writing once, because the running-total step is the same prefix-sum idea that appears throughout this track, and because the visualization of it makes the placement step click in a way the code does not.",
      ],
      visual: {
        id: "radix-visual",
        kind: "sorting",
        algorithm: "radix",
        title: "Radix sort: one stable pass per digit",
      },
    },
    {
      id: "bucket",
      heading: "Bucket sort",
      body: [
        "Split the key range into buckets, drop each element into the bucket its key selects, sort each bucket, then concatenate.",
        "It is O(n) **on average when the keys are roughly uniform** across the range — with n buckets and n uniform keys, each bucket holds a constant number of elements and sorting them is constant work. Skewed keys pile into one bucket and the cost collapses to whatever the inner sort costs, typically O(n²) or O(n log n).",
        "So bucket sort's condition is a distributional assumption, not a structural one. That makes it fragile in a way counting and radix sort are not, and it is why it shows up mostly for floating-point keys known to be uniform in [0, 1).",
        "Its most useful appearance in interviews is not as a sort at all. **Top K Frequent Elements** buckets values by their frequency — index `i` holds every value occurring exactly `i` times — and reads down from the top. Since no count can exceed n, the bucket array is bounded, and the whole thing is O(n) where sorting the counts would be O(d log d).",
      ],
    },
    {
      id: "radix",
      heading: "Radix sort",
      body: [
        "Counting sort is useless for large key ranges, because the counter array is sized by the range. Radix sort fixes that by sorting one **digit** at a time — each pass a stable counting sort over a small alphabet of digits.",
        "Least-significant-digit first is the usual form. After the pass on the ones digit, the array is ordered by ones. The pass on the tens digit is stable, so among elements with the same tens digit the ones ordering survives. Continue to the most significant digit and the array is fully sorted.",
        "That is the entire algorithm, and it rests completely on stability. It is the clearest reason to care about stability at all.",
        "Cost is O(d · (n + b)) for d digits in base b. For 32-bit integers in base 256 that is four passes. Linear in n with a real constant — which is why it wins on millions of fixed-width keys and loses to quicksort on thousands.",
        "The same idea sorts fixed-length strings, dates, and tuples: each field is a digit, sorted least significant first.",
      ],
      pitfalls: [
        {
          title: "Sizing the counter array by n instead of k",
          body: "Counting sort's array is indexed by *key*, so it must be `k + 1` long, not `n`. Sorting `[1000000]` needs a million counters for a single element. This is the check that tells you whether counting sort is applicable at all.",
        },
        {
          title: "Forgetting negative keys",
          body: "`counts[x]` with a negative x indexes before the array. Offset by the minimum — `counts[x - lo]` — and remember the offset when reading back. Radix sort on signed integers needs the sign handled explicitly too, usually by biasing the values.",
        },
        {
          title: "Using an unstable inner pass in radix sort",
          body: "The single fatal bug. Each pass must preserve the previous digit's ordering; an unstable pass discards it and the output is not sorted at all. If a radix implementation returns garbage, check the direction of the placement loop first.",
        },
        {
          title: "Assuming bucket sort is linear",
          body: "It is linear only for roughly uniform keys. Clustered input puts everything in one bucket and the complexity becomes the inner sort's. Unlike counting sort, whose condition you can check from the constraints, bucket sort's condition is about the *distribution* and is usually an assumption rather than a guarantee.",
        },
      ],
    },
    {
      id: "recognising",
      heading: "Spotting the opportunity",
      body: [
        "The signal is a stated bound on the **values**, not on n. Read the constraints looking for it.",
        "\"0 ≤ nums[i] ≤ 100\" or \"ages between 1 and 120\" — counting sort territory, and often the intended solution.",
        "\"lowercase English letters\" — a 26-element tally, which the hashing module already leaned on.",
        "\"colours are 0, 1 or 2\" — the Dutch National Flag problem, which is counting sort's idea collapsed into a single in-place pass with three pointers.",
        "\"fixed-length strings\" or \"32-bit integers, n in the millions\" — radix sort.",
        "\"frequencies\" — bucket by count, as in Top K Frequent.",
        "When you see one of these, say it out loud in an interview even if you then use the library sort. Recognising that the key range permits a linear sort is the observation being tested, whether or not you implement it.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When is counting sort appropriate, and what does it cost?",
      answer:
        "When keys are integers in a small known range 0..k. O(n + k) time and O(k) space. It becomes unusable as k grows regardless of n, because the counter array is sized by the key range rather than the element count.",
    },
    {
      question: "Why must radix sort's per-digit pass be stable?",
      answer:
        "It sorts least significant digit first and relies on each pass preserving the ordering from the previous one. An unstable pass discards that ordering and the final result is not sorted.",
    },
    {
      question: "Top K Frequent Elements in O(n) — how?",
      answer:
        "Count frequencies, then bucket by count: index i holds the values appearing i times. No count exceeds n, so the array is bounded, and reading down from the top gives the answer in O(n) — better than the O(d log d) of sorting all distinct counts.",
    },
  ],
  takeaways: [
    "Counting sort is O(n + k) — sized by the key range, not by n",
    "Walking the input backwards is what makes counting sort stable",
    "Bucket sort is linear only for roughly uniform keys",
    "Radix sort is repeated stable counting sort, least significant digit first",
    "Bucketing by frequency solves top-k in O(n)",
    "The signal is a bound on the values, not on n",
  ],
  status: "available",
};
