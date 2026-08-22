import type { Lesson } from "@/content/types";

export const hashingYourOwnTypesLesson: Lesson = {
  id: "dsa-hash-own-types",
  slug: "hashing-your-own-types",
  moduleSlug: "hashing",
  title: "Hashing Your Own Types",
  summary:
    "The equals/hashCode contract, and what breaks when you satisfy one without the other. The failure is silent: the entry is in the map and no lookup will ever find it.",
  estimatedMinutes: 25,
  objectives: [
    "State the equals/hashCode contract in both directions",
    "Predict what goes wrong when only one is overridden",
    "Use records, data classes and tuples to get both for free",
    "Explain why hash keys should be immutable",
  ],
  sections: [
    {
      id: "the-contract",
      heading: "The contract",
      body: [
        "**If two objects are equal, they must have the same hash code.** This one is mandatory. A map finds the bucket by hash and only then compares with equality — so if equal objects hash differently, they land in different buckets and the map never even gets to the comparison.",
        "**If two objects have the same hash code, they need not be equal.** That is a collision, which is expected and handled.",
        "The asymmetry catches people. Equality is the strong relation and hashing is the fast approximation to it. The approximation is allowed to be imprecise in one direction only.",
        "The practical failure mode is worth spelling out. Override `equals` alone and every instance keeps the default identity hash, so two equal keys go to different buckets: `map.put(a, 1)` followed by `map.get(b)` returns null even though `a.equals(b)`. The entry is in the map, occupying memory, permanently unreachable.",
      ],
      examples: [
        {
          id: "record-vs-class",
          title: "What the default gives you",
          lang: "java",
          code: `import java.util.*;

public class Main {
    record Point(int x, int y) { }

    static class Bad {
        final int x;
        Bad(int x) { this.x = x; }
    }

    public static void main(String[] args) {
        Set<Point> good = new HashSet<>();
        good.add(new Point(1, 2));
        good.add(new Point(1, 2));
        System.out.println("record set size: " + good.size());
        System.out.println("record equals: " + new Point(1, 2).equals(new Point(1, 2)));

        Set<Bad> bad = new HashSet<>();
        bad.add(new Bad(1));
        bad.add(new Bad(1));
        System.out.println("plain class set size: " + bad.size());
    }
}`,
          output: `record set size: 1
record equals: true
plain class set size: 2`,
          explanation:
            "A `record` generates `equals`, `hashCode` and `toString` from its components, so two points with the same coordinates are one entry. The plain class inherits `Object`'s identity-based versions, so two objects with identical contents are two entries — the set has silently failed to deduplicate. Nothing threw; the count is just wrong.",
        },
      ],
    },
    {
      id: "getting-it-free",
      heading: "Getting both for free",
      body: [
        "Hand-writing these is a solved problem in every modern language, and hand-writing them is how they get out of sync.",
        "**Java** — `record Point(int x, int y) {}`. Both generated from the components. Before records, `Objects.hash(x, y)` and `Objects.equals` inside hand-written overrides.",
        "**Python** — `@dataclass(frozen=True)`. Frozen is what makes it hashable; a mutable dataclass deliberately sets `__hash__` to None so you cannot use it as a key. Plain tuples are hashable already and are the right answer for an ad-hoc composite key.",
        "**Go** — structs of comparable fields are usable as map keys directly, with equality and hashing defined structurally. A struct containing a slice or a map is not comparable and will not compile as a key, which is the language refusing to let you make this mistake.",
        "**C++** — needs `operator==` plus a specialisation of `std::hash`, which is enough friction that `std::map` with `operator<` is often the pragmatic choice. Or key on a `std::pair`/`std::tuple`, which already has both.",
        "**Rust** — `#[derive(PartialEq, Eq, Hash)]`. The derive attribute is the whole answer.",
        "For interview problems the shortcut is usually to sidestep custom types entirely: encode the composite key as a tuple, or as a string like `f\"{row},{col}\"`. Slightly slower, impossible to get wrong.",
      ],
    },
    {
      id: "immutability",
      heading: "Why keys must be immutable",
      body: [
        "An entry lives in the bucket its hash chose *at insertion time*. Mutate a field the hash depends on and the object now hashes to a different bucket — but nothing moves it.",
        "The entry is now unreachable through lookup, still reachable through iteration, and will not be removed by `remove` either, because `remove` goes to the new bucket and finds nothing. It is a memory leak with a correctness bug attached.",
        "This is why Python refuses to hash lists and dicts, why frozen dataclasses are the hashable kind, and why Go rejects structs containing slices as keys. These are not arbitrary restrictions — each is a language declining to let you build this bug.",
        "The rule that follows: **key types should be immutable, or at least immutable in the fields that participate in the hash**. If you must key on a mutable object, key on a snapshot of its identifying fields instead.",
      ],
      pitfalls: [
        {
          title: "Overriding equals without hashCode",
          body: "The canonical Java bug. Every IDE warns about it and it still happens. Lookups miss, sets fail to deduplicate, and nothing throws — the only symptom is a count that is too high or a get that returns null.",
        },
        {
          title: "Using an array as a map key in Java",
          body: "`int[]` inherits identity equality and identity hash, so two arrays with the same contents are different keys. Use `List<Integer>`, `Arrays.toString`, or a record. This bites hardest in grid problems where the obvious key is a coordinate pair.",
        },
        {
          title: "A hash code that is expensive to compute",
          body: "`hashCode` runs on every lookup and every insertion. Hashing a long string or walking a collection each time turns O(1) map operations into O(k). Cache the value in a final field if the type is immutable — which is another reason immutability pays.",
        },
        {
          title: "Returning a constant from hashCode",
          body: "`return 0` satisfies the contract — equal objects do hash the same — and is technically correct. It also puts every key in one bucket, which is lesson 2's worst case by construction. Correct and unusable.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the equals/hashCode contract?",
      answer:
        "Equal objects must have equal hash codes. The converse does not hold — equal hash codes do not imply equality, that is a collision. Breaking the first direction makes entries unreachable in hash-based collections.",
    },
    {
      question: "What happens if you override equals but not hashCode?",
      answer:
        "Equal objects keep distinct identity hashes and land in different buckets. `map.get` on an equal-but-not-identical key returns null, and `HashSet` stops deduplicating. It fails silently — no exception, just wrong results.",
    },
    {
      question: "Why must hash map keys be immutable?",
      answer:
        "The entry stays in the bucket chosen at insertion. Mutating a field the hash depends on changes where lookups go, so the entry becomes unreachable and cannot even be removed. Languages enforce this to varying degrees — Python refuses to hash lists, Go rejects non-comparable structs as keys.",
    },
  ],
  takeaways: [
    "Equal implies same hash; same hash does not imply equal",
    "Overriding equals alone makes entries silently unreachable",
    "Records, frozen dataclasses and derives generate both correctly",
    "Java arrays hash by identity — never use one as a key",
    "Mutating a key after insertion leaks the entry",
    "A constant hashCode is correct and unusable",
  ],
  status: "available",
};
