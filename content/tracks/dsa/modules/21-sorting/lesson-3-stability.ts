import type { Lesson } from "@/content/types";

export const stabilityLesson: Lesson = {
  id: "dsa-sort-stability",
  slug: "stability-and-when-it-matters",
  moduleSlug: "sorting",
  title: "Stability, and When It Silently Matters",
  summary:
    "A stable sort keeps equal elements in their original relative order. It sounds like a detail until you sort by two keys in sequence — and it is the property radix sort is built on.",
  estimatedMinutes: 25,
  objectives: [
    "Define stability precisely",
    "Use two stable passes to sort by two keys",
    "Name which common sorts are stable and which are not",
    "Recognise the bugs an unstable sort causes",
  ],
  sections: [
    {
      id: "definition",
      heading: "What stability is",
      body: [
        "A sort is **stable** if elements the comparator calls equal come out in the same relative order they went in.",
        "For bare numbers this is unobservable — one 3 is indistinguishable from another 3. It becomes visible the moment elements carry data the comparator does not look at: a record sorted by score still has a name attached.",
        "The consequence that makes it useful: sorting by key A, then stably by key B, leaves the result sorted by B with ties broken by A. Two simple passes give a compound ordering, without writing a compound comparator.",
      ],
      examples: [
        {
          id: "two-passes",
          title: "The same data, three ways",
          lang: "python",
          code: `people = [("cy", 30), ("ana", 25), ("bob", 30), ("dee", 25)]

by_age = sorted(people, key=lambda p: p[1])
print("by age, input order kept within ties:", [p[0] for p in by_age])

by_name_then_age = sorted(sorted(people, key=lambda p: p[0]), key=lambda p: p[1])
print("name first, then age:                ", [p[0] for p in by_name_then_age])

one_pass = sorted(people, key=lambda p: (p[1], p[0]))
print("single compound key:                 ", [p[0] for p in one_pass])`,
          output: `by age, input order kept within ties: ['ana', 'dee', 'cy', 'bob']
name first, then age:                 ['ana', 'dee', 'bob', 'cy']
single compound key:                  ['ana', 'dee', 'bob', 'cy']`,
          explanation:
            "Line one sorts by age alone: within age 30, `cy` still precedes `bob` because that was the input order — stability preserved it. Line two sorts by name first, then stably by age, and now age 30 reads `bob, cy`. **Sort by the least significant key first, most significant last** — the reverse of the intuitive order, and the source of the classic bug. Line three does it in one pass with a tuple key, which is what you should normally write; the two-pass version matters when the second key needs a comparator you cannot express as a tuple.",
          alternates: [
            {
              lang: "javascript",
              code: `const names = (ps) => "[" + ps.map(([n]) => \`'\${n}'\`).join(", ") + "]";

const people = [["cy", 30], ["ana", 25], ["bob", 30], ["dee", 25]];

// Array.prototype.sort is stable by specification, so ties keep input order.
const byAge = [...people].sort((a, b) => a[1] - b[1]);
console.log("by age, input order kept within ties:", names(byAge));

const byNameThenAge = [...people]
  .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  .sort((a, b) => a[1] - b[1]);
console.log("name first, then age:                ", names(byNameThenAge));

const onePass = [...people].sort(
  (a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
);
console.log("single compound key:                 ", names(onePass));`,
            },
            {
              lang: "typescript",
              code: `const names = (ps: [string, number][]): string => "[" + ps.map(([n]) => \`'\${n}'\`).join(", ") + "]";

const people: [string, number][] = [["cy", 30], ["ana", 25], ["bob", 30], ["dee", 25]];

// Array.prototype.sort is stable by specification, so ties keep input order.
const byAge = [...people].sort((a, b) => a[1] - b[1]);
console.log("by age, input order kept within ties:", names(byAge));

const byNameThenAge = [...people]
  .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  .sort((a, b) => a[1] - b[1]);
console.log("name first, then age:                ", names(byNameThenAge));

const onePass = [...people].sort(
  (a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
);
console.log("single compound key:                 ", names(onePass));`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    record Person(String name, int age) { }

    static String names(List<Person> ps) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < ps.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("'").append(ps.get(i).name()).append("'");
        }
        return sb.append("]").toString();
    }

    public static void main(String[] args) {
        List<Person> people = List.of(
                new Person("cy", 30), new Person("ana", 25),
                new Person("bob", 30), new Person("dee", 25));

        // List.sort is stable by contract, so ties keep input order.
        List<Person> byAge = new ArrayList<>(people);
        byAge.sort(Comparator.comparingInt(Person::age));
        System.out.println("by age, input order kept within ties: " + names(byAge));

        List<Person> byNameThenAge = new ArrayList<>(people);
        byNameThenAge.sort(Comparator.comparing(Person::name));
        byNameThenAge.sort(Comparator.comparingInt(Person::age));
        System.out.println("name first, then age:                 " + names(byNameThenAge));

        List<Person> onePass = new ArrayList<>(people);
        onePass.sort(Comparator.comparingInt(Person::age).thenComparing(Person::name));
        System.out.println("single compound key:                  " + names(onePass));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

using Person = pair<string, int>;

string names(const vector<Person>& ps) {
    string out = "[";
    for (size_t i = 0; i < ps.size(); i++) {
        if (i) out += ", ";
        out += "'" + ps[i].first + "'";
    }
    return out + "]";
}

int main() {
    vector<Person> people = {{"cy", 30}, {"ana", 25}, {"bob", 30}, {"dee", 25}};

    // stable_sort, not sort: only stable_sort promises ties keep input order.
    vector<Person> byAge = people;
    stable_sort(byAge.begin(), byAge.end(),
                [](const Person& a, const Person& b) { return a.second < b.second; });
    cout << "by age, input order kept within ties: " << names(byAge) << "\\n";

    vector<Person> byNameThenAge = people;
    stable_sort(byNameThenAge.begin(), byNameThenAge.end(),
                [](const Person& a, const Person& b) { return a.first < b.first; });
    stable_sort(byNameThenAge.begin(), byNameThenAge.end(),
                [](const Person& a, const Person& b) { return a.second < b.second; });
    cout << "name first, then age:                 " << names(byNameThenAge) << "\\n";

    vector<Person> onePass = people;
    stable_sort(onePass.begin(), onePass.end(), [](const Person& a, const Person& b) {
        return make_pair(a.second, a.first) < make_pair(b.second, b.first);
    });
    cout << "single compound key:                  " << names(onePass) << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `type Person = (String, i32);

fn names(ps: &[Person]) -> String {
    let parts: Vec<String> = ps.iter().map(|p| format!("'{}'", p.0)).collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    let people: Vec<Person> = vec![
        ("cy".into(), 30),
        ("ana".into(), 25),
        ("bob".into(), 30),
        ("dee".into(), 25),
    ];

    // \`sort_by\` is stable; \`sort_unstable_by\` is the one that is not.
    let mut by_age = people.clone();
    by_age.sort_by_key(|p| p.1);
    println!("by age, input order kept within ties: {}", names(&by_age));

    let mut by_name_then_age = people.clone();
    by_name_then_age.sort_by(|a, b| a.0.cmp(&b.0));
    by_name_then_age.sort_by_key(|p| p.1);
    println!("name first, then age:                 {}", names(&by_name_then_age));

    let mut one_pass = people.clone();
    one_pass.sort_by(|a, b| (a.1, &a.0).cmp(&(b.1, &b.0)));
    println!("single compound key:                  {}", names(&one_pass));
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"sort"
	"strings"
)

type person struct {
	name string
	age  int
}

func names(ps []person) string {
	parts := make([]string, len(ps))
	for i, p := range ps {
		parts[i] = "'" + p.name + "'"
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	people := []person{{"cy", 30}, {"ana", 25}, {"bob", 30}, {"dee", 25}}
	clone := func() []person { return append([]person(nil), people...) }

	// SliceStable, not Slice: only the stable one keeps ties in input order.
	byAge := clone()
	sort.SliceStable(byAge, func(i, j int) bool { return byAge[i].age < byAge[j].age })
	fmt.Println("by age, input order kept within ties:", names(byAge))

	byNameThenAge := clone()
	sort.SliceStable(byNameThenAge, func(i, j int) bool {
		return byNameThenAge[i].name < byNameThenAge[j].name
	})
	sort.SliceStable(byNameThenAge, func(i, j int) bool {
		return byNameThenAge[i].age < byNameThenAge[j].age
	})
	fmt.Println("name first, then age:                ", names(byNameThenAge))

	onePass := clone()
	sort.SliceStable(onePass, func(i, j int) bool {
		if onePass[i].age != onePass[j].age {
			return onePass[i].age < onePass[j].age
		}
		return onePass[i].name < onePass[j].name
	})
	fmt.Println("single compound key:                 ", names(onePass))
}`,
            },
          ],
        },
      ],
    },
    {
      id: "which-are-stable",
      heading: "Which sorts are stable",
      body: [
        "**Stable:** insertion, merge, counting (written carefully), bubble, TimSort.",
        "**Not stable:** quicksort, heap sort, selection sort, shell sort.",
        "The pattern is not arbitrary. Algorithms that move elements only between adjacent or ordered positions preserve relative order; algorithms that swap across long distances — quicksort's partition, heap sort's root-to-end exchange — destroy it.",
        "Counting sort is stable **only because of a deliberate choice**: walking the input backwards while decrementing the running counts. Walk forwards and you get a correct sort that is unstable. That detail is not cosmetic — radix sort is a stack of counting-sort passes, and if any pass is unstable the previous digit's ordering is lost and the whole algorithm returns garbage.",
        "Any unstable sort can be made stable by extending the key with the original index. It costs O(n) space and turns every equality into a tiebreak on position. That is the standard fix when you are stuck with an unstable sort and need determinism.",
      ],
      pitfalls: [
        {
          title: "Sorting the keys in the wrong order",
          body: "For a two-pass sort the *last* pass must be the primary key. Sorting by age then name gives you name-ordering with age as the tiebreak — the opposite of what was asked. If a multi-key sort comes out wrong, this is almost always why.",
        },
        {
          title: "Assuming your language's sort is stable",
          body: "Python's `sorted` and `list.sort`, Java's `Collections.sort` and `Arrays.sort` on objects, and JavaScript's `Array.sort` (since ES2019) are all stable by specification. C++'s `std::sort` is **not** — `std::stable_sort` is the stable one. Rust's `sort` is stable, `sort_unstable` is not. Getting this wrong produces output that is right on your test data and wrong on the grader's.",
        },
        {
          title: "Relying on stability with an inconsistent comparator",
          body: "Stability is defined relative to the comparator's notion of equality. A comparator that returns 0 for elements you consider different will happily preserve input order among them — which is stability working correctly and probably not what you meant.",
        },
      ],
    },
    {
      id: "when-it-matters",
      heading: "Where this actually bites",
      body: [
        "**Multi-key sorting**, as above. The most common case by far.",
        "**Re-sorting a displayed table.** A user sorts by name, then by department. Stability is what makes departments come out alphabetised internally, and its absence is what makes a table appear to shuffle randomly.",
        "**Radix sort.** Not a convenience but a correctness requirement, as described above.",
        "**Deterministic output.** Two runs on the same input must produce the same order, including among ties. Unstable sorts can differ between implementations, versions and even array sizes — TimSort's behaviour on small inputs is insertion sort, and above the threshold it is not.",
        "**Grading and diffing.** A test comparing output line by line fails on a legitimate but differently-ordered answer. If a solution is correct and the judge disagrees, an unstable tiebreak is a candidate.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does it mean for a sort to be stable?",
      answer:
        "Elements the comparator calls equal keep their original relative order. It is unobservable for bare values and matters as soon as elements carry data outside the comparison key.",
    },
    {
      question: "How do you sort by two keys using a stable sort?",
      answer:
        "Two passes, least significant key first. Sort by the secondary key, then stably by the primary; the primary ordering wins and ties fall back to the earlier pass. A single compound key is usually clearer — the two-pass form matters when the secondary ordering needs a comparator you cannot express as a tuple.",
    },
    {
      question: "Why must the counting sort inside radix sort be stable?",
      answer:
        "Radix sort processes digits from least to most significant, relying on each pass to preserve the ordering established by the previous one. An unstable pass discards that ordering and the result is wrong, not merely differently arranged.",
    },
  ],
  takeaways: [
    "Stable means equal elements keep their input order",
    "Sort by the least significant key first, most significant last",
    "Merge, insertion and TimSort are stable; quick, heap and selection are not",
    "std::sort is unstable — std::stable_sort is the stable one",
    "Counting sort is stable only because it walks the input backwards",
    "Extend the key with the original index to force stability",
  ],
  status: "available",
};
