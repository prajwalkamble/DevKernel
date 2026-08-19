import type { Lesson } from "@/content/types";

export const keysAndHashingLesson: Lesson = {
  id: "dsa-ds-keys",
  slug: "what-makes-a-valid-key",
  moduleSlug: "introduction-to-data-structures",
  title: "What Makes a Valid Key",
  summary:
    "The equals/hashCode contract, why mutating a key loses the entry forever, and how to build the composite keys that problems actually need.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "State the equals/hashCode contract and why breaking it silently loses data",
    "Explain why keys must be immutable while they are in a map",
    "Use tuples, records and frozen dataclasses as composite keys",
    "Design a canonical key for a grouping problem",
  ],
  sections: [
    {
      id: "the-contract",
      heading: "The contract",
      body: [
        "A hash map finds an entry in two steps: it uses the hash to pick a bucket, then uses equality to find the entry within it. Both steps have to agree, and that gives one rule with two halves.",
        "**If two objects are equal, their hashes must be equal.** Otherwise equal keys land in different buckets and the lookup never finds the entry.",
        "**If two hashes are equal, the objects need not be.** That is just a collision, and it is handled.",
        "In Java this is the `equals`/`hashCode` contract, and **overriding one without the other is a bug** — the compiler will not stop you, and the symptom is a `HashSet` that contains obvious duplicates. In Python the same contract binds `__eq__` and `__hash__`, with one helpful difference: defining `__eq__` without `__hash__` makes the class *unhashable*, so the error is immediate instead of silent.",
      ],
      examples: [
        {
          id: "java-contract",
          title: "Java: what breaking it looks like",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static class BadPoint {
        int x, y;
        BadPoint(int x, int y) { this.x = x; this.y = y; }
    }

    static class GoodPoint {
        int x, y;
        GoodPoint(int x, int y) { this.x = x; this.y = y; }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof GoodPoint)) return false;
            GoodPoint p = (GoodPoint) o;
            return x == p.x && y == p.y;
        }

        @Override public int hashCode() { return Objects.hash(x, y); }

        @Override public String toString() { return "(" + x + "," + y + ")"; }
    }

    record Pt(int x, int y) {}

    public static void main(String[] args) {
        Set<BadPoint> bad = new HashSet<>();
        bad.add(new BadPoint(1, 2));
        bad.add(new BadPoint(1, 2));
        System.out.println("without equals/hashCode, size = " + bad.size());
        System.out.println("contains an equal point? " + bad.contains(new BadPoint(1, 2)));

        Set<GoodPoint> good = new HashSet<>();
        good.add(new GoodPoint(1, 2));
        good.add(new GoodPoint(1, 2));
        System.out.println("with equals/hashCode,   size = " + good.size());
        System.out.println("contains an equal point? " + good.contains(new GoodPoint(1, 2)));

        Set<Pt> rec = new HashSet<>();
        rec.add(new Pt(1, 2));
        rec.add(new Pt(1, 2));
        System.out.println("a record gives both for free, size = " + rec.size());
        System.out.println(rec);
    }
}`,
          output: `without equals/hashCode, size = 2
contains an equal point? false
with equals/hashCode,   size = 1
contains an equal point? true
a record gives both for free, size = 1
[Pt[x=1, y=2]]`,
          explanation:
            "A set with two identical points in it, and `contains` returning false for a point that is visibly present. The default `equals` is identity — two separately constructed objects are never equal — so the set is behaving correctly given a class that never declared what equality means. **A `record` generates `equals`, `hashCode` and `toString` from its components**, which makes it the right way to declare a composite key in modern Java.",
        },
      ],
      pitfalls: [
        {
          title: "Overriding `equals` without `hashCode`",
          body: "The class then reports two objects equal while giving them different hashes, so a `HashSet` keeps both and `HashMap.get` returns null for a key that is present. Nothing warns you — the code compiles, the objects compare equal in an `if`, and only the collection misbehaves. Every IDE generates the pair together for this reason; let it.",
        },
      ],
    },
    {
      id: "immutability",
      heading: "Why keys must not change",
      body: [
        "A key's hash decides which bucket holds the entry. **If the key changes after insertion, its hash changes, and the entry is now in the wrong bucket** — the map looks in the new bucket, finds nothing, and reports the key as absent.",
        "The entry is not deleted. It still occupies memory, still counts toward `size()`, and is still visible when iterating. It is simply unreachable by lookup. That is a genuine memory leak with no error message.",
        "**Python prevents this** by requiring keys to be hashable, and mutable built-ins deliberately are not: lists and sets cannot be keys, while tuples and frozensets can.",
        "**Java does not prevent it.** A `List` is perfectly legal as a `HashMap` key, and mutating it afterwards silently loses the entry. The discipline is yours to keep.",
      ],
      examples: [
        {
          id: "mutation",
          title: "Java: losing an entry by mutating its key",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<List<Integer>, String> map = new HashMap<>();
        List<Integer> key = new ArrayList<>(List.of(1, 2));
        map.put(key, "value");
        System.out.println("found before mutation: " + map.get(key));

        key.add(3);
        System.out.println("found after mutation : " + map.get(key));
        System.out.println("map still reports size " + map.size() + ": " + map);
        System.out.println("but the entry is unreachable by any key");
    }
}`,
          output: `found before mutation: value
found after mutation : null
map still reports size 1: {[1, 2, 3]=value}
but the entry is unreachable by any key`,
          explanation:
            "The map prints its own entry and then cannot find it — the lookup hashes `[1, 2, 3]`, gets a different bucket, and finds nothing there. This is the concrete reason strings make good keys and mutable collections do not, and it is the payoff of the immutability discussion from the strings lesson.",
        },
        {
          id: "python-hashable",
          title: "Python: hashability enforced",
          lang: "python",
          code: `print("hashable:", hash((1, 2)) == hash((1, 2)))
try:
    {[1, 2]: "v"}
except TypeError as e:
    print("list as key:", e)
try:
    {{1, 2}: "v"}
except TypeError as e:
    print("set as key :", e)
print("frozenset works:", {frozenset({1, 2}): "v"}[frozenset({2, 1})])

print()
print("tuple keys are the idiom for coordinates:")
grid = {(0, 0): "start", (2, 3): "goal"}
print("  ", grid[(2, 3)], "|", grid.get((9, 9), "empty"))`,
          output: `hashable: True
list as key: unhashable type: 'list'
set as key : unhashable type: 'set'
frozenset works: v

tuple keys are the idiom for coordinates:
   goal | empty`,
          explanation:
            "The error arrives at insertion rather than as a silent loss later, which is the better design. Note the frozenset lookup succeeds with the elements in the other order — a set has no order, so `frozenset({2, 1})` and `frozenset({1, 2})` are the same value and hash identically. That makes frozensets the natural key when a group's membership matters and its order does not.",
        },
      ],
    },
    {
      id: "composite-keys",
      heading: "Composite keys",
      body: [
        "Problems constantly need a key made of several values: a grid coordinate, a (row, colour) pair, a state in a search.",
        "**Python:** a tuple. `visited.add((r, c))` is the idiom for grid traversal and it needs no setup at all. For something with named fields, a `@dataclass(frozen=True)` generates `__eq__` and `__hash__` and refuses mutation.",
        "**Java:** a `record`, which generates the pair for you. Before records, the common hacks were a `Map<Integer, Map<Integer, V>>` or encoding two ints into one — `r * cols + c`, or `r * 1000L + c` — and the encoding trick is still worth knowing because it is faster and allocation-free.",
        "The general question for a grouping problem is: **what canonical form makes exactly the things that should group together produce the same key?** Sorted characters for anagrams. A reduced fraction for slopes. A frozenset for unordered membership.",
      ],
      examples: [
        {
          id: "python-composite",
          title: "Python: three ways to make a value-equal key",
          lang: "python",
          code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y


a, b = Point(1, 2), Point(1, 2)
print("default identity equality:", a == b, len({a, b}))


class ValuePoint:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        return isinstance(other, ValuePoint) and (self.x, self.y) == (other.x, other.y)

    def __hash__(self):
        return hash((self.x, self.y))


c, d = ValuePoint(1, 2), ValuePoint(1, 2)
print("value equality           :", c == d, len({c, d}))

from dataclasses import dataclass


@dataclass(frozen=True)
class FrozenPoint:
    x: int
    y: int


e, f = FrozenPoint(1, 2), FrozenPoint(1, 2)
print("a frozen dataclass       :", e == f, len({e, f}), e)

print()
print("and the version you will actually write:")
visited = set()
for cell in [(0, 0), (1, 1), (0, 0)]:
    visited.add(cell)
print("  visited:", sorted(visited), "size", len(visited))`,
          output: `default identity equality: False 2
value equality           : True 1
a frozen dataclass       : True 1 FrozenPoint(x=1, y=2)

and the version you will actually write:
  visited: [(0, 0), (1, 1)] size 2`,
          explanation:
            "Three levels of ceremony for the same idea, and the last block is the one that appears in real solutions — a plain tuple in a set, no class at all. Write the class only when the key has meaning worth naming; in a 45-minute problem, a tuple is correct and faster to type. Note `hash((self.x, self.y))` delegates to the tuple's hash, which is the right way to combine fields rather than inventing arithmetic.",
        },
      ],
      pitfalls: [
        {
          title: "Hashing on a field you later change",
          body: "Even a correct `hashCode` breaks if it reads a mutable field that changes while the object is in a map. The rule is to hash only on fields that are final, or to not put the object in a map at all. This is the argument for records and frozen dataclasses: they make the mistake impossible rather than merely discouraged.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the equals/hashCode contract?",
      answer:
        "If two objects are equal they must have the same hash code; the converse need not hold, since equal hashes are just a collision. It exists because a hash map finds an entry by hashing to a bucket and then comparing for equality within it — if equal keys hash differently they land in different buckets and the lookup fails. Overriding one without the other compiles fine and produces a `HashSet` containing visible duplicates and a `get` that returns null for a present key.",
    },
    {
      question: "Why must a hash map key be immutable?",
      answer:
        "Because the hash decides the bucket. Mutating a key after insertion changes its hash, so the entry sits in a bucket the lookup will never check — it still occupies memory and counts toward the size, but is unreachable. Python enforces this by making mutable built-ins unhashable, so a list cannot be a key at all. Java does not enforce it: a `List` is a legal `HashMap` key and mutating it silently loses the entry.",
    },
    {
      question: "How would you use a pair of coordinates as a map key?",
      answer:
        "In Python, a tuple — `visited.add((r, c))` — which is hashable and needs no setup. In Java, a `record Point(int r, int c)`, which generates `equals` and `hashCode` from its components. The allocation-free alternative in Java is encoding the pair into a single number, `r * cols + c` or `r * 1000L + c`, which is faster for tight loops and is worth mentioning. Whichever you choose, the key must be immutable.",
    },
  ],
  takeaways: [
    "Equal objects must have equal hashes; equal hashes need not mean equal objects",
    "Overriding `equals` without `hashCode` compiles and silently breaks every hash collection",
    "Python binds `__eq__` and `__hash__`; defining only `__eq__` makes the class unhashable",
    "A mutated key leaves its entry unreachable — memory held, size counted, lookup failing",
    "Python enforces this by refusing lists and sets as keys; Java does not enforce it at all",
    "Use a tuple in Python and a `record` in Java for composite keys",
    "`hash((self.x, self.y))` — delegate to the tuple rather than inventing arithmetic",
    "For grouping, ask what canonical form makes exactly the right things collide",
  ],
};
