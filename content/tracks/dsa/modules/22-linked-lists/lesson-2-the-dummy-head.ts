import type { Lesson } from "@/content/types";

export const dummyHeadLesson: Lesson = {
  id: "dsa-ll-dummy",
  slug: "the-dummy-head",
  moduleSlug: "linked-lists",
  title: "The Dummy Head",
  summary:
    "One extra node in front of the list gives the real first node a predecessor, and half the special cases disappear. It is the highest-value trick in this module and takes one line.",
  estimatedMinutes: 25,
  objectives: [
    "Explain which edge case the dummy head removes and why",
    "Write a deletion loop with and without one, and compare",
    "Recognise the problems where a dummy head simplifies the code",
    "Remember to return dummy.next rather than dummy",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The head is always the special case",
      body: [
        "Deletion rewires the previous node's `next`. Every node has a previous node — except the head, which is why every deletion routine grows a separate branch for it.",
        "That branch is where bugs live. It is easy to handle the head once and forget that after removing it the *new* head might also need removing, which is why the naive version below needs a `while` and not an `if`.",
        "The fix is to give the head a predecessor. Allocate one node in front of the list whose value is never read, do the loop uniformly, and return `dummy.next` at the end. The real head is now an ordinary node.",
      ],
      examples: [
        {
          id: "with-and-without",
          title: "The same function, twice",
          lang: "python",
          code: `class Node:
    def __init__(self, val, nxt=None):
        self.val, self.next = val, nxt

def build(vals):
    head = None
    for v in reversed(vals):
        head = Node(v, head)
    return head

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

def remove_all_naive(head, target):
    while head and head.val == target:
        head = head.next
    cur = head
    while cur and cur.next:
        if cur.next.val == target:
            cur.next = cur.next.next
        else:
            cur = cur.next
    return head

def remove_all_dummy(head, target):
    dummy = Node(0, head)
    cur = dummy
    while cur.next:
        if cur.next.val == target:
            cur.next = cur.next.next
        else:
            cur = cur.next
    return dummy.next

for fn in (remove_all_naive, remove_all_dummy):
    print(fn.__name__)
    print("  ", to_list(fn(build([7, 1, 7, 2, 7]), 7)))
    print("  ", to_list(fn(build([7, 7, 7]), 7)))
    print("  ", to_list(fn(build([1, 2, 3]), 7)))`,
          output: `remove_all_naive
   [1, 2]
   []
   [1, 2, 3]
remove_all_dummy
   [1, 2]
   []
   [1, 2, 3]`,
          explanation:
            "Identical results — that is the point. The dummy version is not more capable, it is **one loop instead of two**. The naive version's leading `while` exists solely to strip target values off the front, and it has to be a `while` rather than an `if` because `[7,7,7]` would otherwise leave a 7 behind. That subtlety is exactly the class of bug the dummy head deletes along with the branch.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";

class Node {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function build(vals) {
  let head = null;
  for (let i = vals.length - 1; i >= 0; i--) head = new Node(vals[i], head);
  return head;
}

function toList(head) {
  const out = [];
  while (head) {
    out.push(head.val);
    head = head.next;
  }
  return out;
}

function removeAllNaive(head, target) {
  while (head && head.val === target) head = head.next;
  let cur = head;
  while (cur && cur.next) {
    if (cur.next.val === target) cur.next = cur.next.next;
    else cur = cur.next;
  }
  return head;
}

function removeAllDummy(head, target) {
  const dummy = new Node(0, head);
  let cur = dummy;
  while (cur.next) {
    if (cur.next.val === target) cur.next = cur.next.next;
    else cur = cur.next;
  }
  return dummy.next;
}

for (const [name, fn] of [["remove_all_naive", removeAllNaive], ["remove_all_dummy", removeAllDummy]]) {
  console.log(name);
  console.log("  ", list(toList(fn(build([7, 1, 7, 2, 7]), 7))));
  console.log("  ", list(toList(fn(build([7, 7, 7]), 7))));
  console.log("  ", list(toList(fn(build([1, 2, 3]), 7))));
}`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

class Node {
  val: number;
  next: Node | null;

  constructor(val: number, next: Node | null = null) {
    this.val = val;
    this.next = next;
  }
}

function build(vals: number[]): Node | null {
  let head: Node | null = null;
  for (let i = vals.length - 1; i >= 0; i--) head = new Node(vals[i], head);
  return head;
}

function toList(head: Node | null): number[] {
  const out: number[] = [];
  while (head) {
    out.push(head.val);
    head = head.next;
  }
  return out;
}

function removeAllNaive(head: Node | null, target: number): Node | null {
  while (head && head.val === target) head = head.next;
  let cur: Node | null = head;
  while (cur && cur.next) {
    if (cur.next.val === target) cur.next = cur.next.next;
    else cur = cur.next;
  }
  return head;
}

function removeAllDummy(head: Node | null, target: number): Node | null {
  const dummy = new Node(0, head);
  let cur = dummy;
  while (cur.next) {
    if (cur.next.val === target) cur.next = cur.next.next;
    else cur = cur.next;
  }
  return dummy.next;
}

const impls: [string, (h: Node | null, t: number) => Node | null][] = [
  ["remove_all_naive", removeAllNaive],
  ["remove_all_dummy", removeAllDummy],
];
for (const [name, fn] of impls) {
  console.log(name);
  console.log("  ", list(toList(fn(build([7, 1, 7, 2, 7]), 7))));
  console.log("  ", list(toList(fn(build([7, 7, 7]), 7))));
  console.log("  ", list(toList(fn(build([1, 2, 3]), 7))));
}`,
            },
            {
              lang: "java",
              code: `import java.util.*;
import java.util.function.BiFunction;

public class Main {
    static class Node {
        int val;
        Node next;

        Node(int val, Node next) {
            this.val = val;
            this.next = next;
        }
    }

    static Node build(int[] vals) {
        Node head = null;
        for (int i = vals.length - 1; i >= 0; i--) head = new Node(vals[i], head);
        return head;
    }

    static String toList(Node head) {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        while (head != null) {
            if (!first) sb.append(", ");
            sb.append(head.val);
            first = false;
            head = head.next;
        }
        return sb.append("]").toString();
    }

    static Node removeAllNaive(Node head, int target) {
        while (head != null && head.val == target) head = head.next;
        Node cur = head;
        while (cur != null && cur.next != null) {
            if (cur.next.val == target) cur.next = cur.next.next;
            else cur = cur.next;
        }
        return head;
    }

    static Node removeAllDummy(Node head, int target) {
        Node dummy = new Node(0, head);
        Node cur = dummy;
        while (cur.next != null) {
            if (cur.next.val == target) cur.next = cur.next.next;
            else cur = cur.next;
        }
        return dummy.next;
    }

    public static void main(String[] args) {
        String[] names = {"remove_all_naive", "remove_all_dummy"};
        List<BiFunction<Node, Integer, Node>> impls = List.of(Main::removeAllNaive, Main::removeAllDummy);
        for (int k = 0; k < names.length; k++) {
            BiFunction<Node, Integer, Node> fn = impls.get(k);
            System.out.println(names[k]);
            System.out.println("   " + toList(fn.apply(build(new int[]{7, 1, 7, 2, 7}), 7)));
            System.out.println("   " + toList(fn.apply(build(new int[]{7, 7, 7}), 7)));
            System.out.println("   " + toList(fn.apply(build(new int[]{1, 2, 3}), 7)));
        }
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <functional>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Node {
    int val;
    Node* next;
    Node(int val, Node* next = nullptr) : val(val), next(next) {}
};

Node* build(const vector<int>& vals) {
    Node* head = nullptr;
    for (int i = (int)vals.size() - 1; i >= 0; i--) head = new Node(vals[i], head);
    return head;
}

string toList(Node* head) {
    string out = "[";
    bool first = true;
    while (head) {
        if (!first) out += ", ";
        out += to_string(head->val);
        first = false;
        head = head->next;
    }
    return out + "]";
}

Node* removeAllNaive(Node* head, int target) {
    while (head && head->val == target) head = head->next;
    Node* cur = head;
    while (cur && cur->next) {
        if (cur->next->val == target) cur->next = cur->next->next;
        else cur = cur->next;
    }
    return head;
}

Node* removeAllDummy(Node* head, int target) {
    Node dummy(0, head);
    Node* cur = &dummy;
    while (cur->next) {
        if (cur->next->val == target) cur->next = cur->next->next;
        else cur = cur->next;
    }
    return dummy.next;
}

int main() {
    vector<pair<string, function<Node*(Node*, int)>>> impls = {
        {"remove_all_naive", removeAllNaive}, {"remove_all_dummy", removeAllDummy}};
    for (const auto& [name, fn] : impls) {
        cout << name << "\\n";
        cout << "   " << toList(fn(build({7, 1, 7, 2, 7}), 7)) << "\\n";
        cout << "   " << toList(fn(build({7, 7, 7}), 7)) << "\\n";
        cout << "   " << toList(fn(build({1, 2, 3}), 7)) << "\\n";
    }
}`,
            },
            {
              lang: "rust",
              code: `// \`Option<Box<Node>>\`: each node owns the rest of the list.
struct Node {
    val: i32,
    next: Option<Box<Node>>,
}

fn build(vals: &[i32]) -> Option<Box<Node>> {
    let mut head = None;
    for &v in vals.iter().rev() {
        head = Some(Box::new(Node { val: v, next: head }));
    }
    head
}

fn to_list(head: &Option<Box<Node>>) -> String {
    let mut parts: Vec<String> = Vec::new();
    let mut cur = head;
    while let Some(node) = cur {
        parts.push(node.val.to_string());
        cur = &node.next;
    }
    format!("[{}]", parts.join(", "))
}

fn remove_all_naive(mut head: Option<Box<Node>>, target: i32) -> Option<Box<Node>> {
    while head.as_ref().is_some_and(|n| n.val == target) {
        head = head.unwrap().next;
    }
    let mut cur = head.as_mut();
    while let Some(node) = cur {
        if node.next.as_ref().is_some_and(|n| n.val == target) {
            let dead = node.next.take().unwrap();
            node.next = dead.next;
            cur = Some(node);
        } else {
            cur = node.next.as_mut();
        }
    }
    head
}

fn remove_all_dummy(head: Option<Box<Node>>, target: i32) -> Option<Box<Node>> {
    let mut dummy = Box::new(Node { val: 0, next: head });
    let mut cur = &mut dummy;
    while cur.next.is_some() {
        if cur.next.as_ref().unwrap().val == target {
            let dead = cur.next.take().unwrap();
            cur.next = dead.next;
        } else {
            cur = cur.next.as_mut().unwrap();
        }
    }
    dummy.next
}

fn main() {
    let impls: [(&str, fn(Option<Box<Node>>, i32) -> Option<Box<Node>>); 2] = [
        ("remove_all_naive", remove_all_naive),
        ("remove_all_dummy", remove_all_dummy),
    ];
    for (name, f) in impls {
        println!("{}", name);
        println!("   {}", to_list(&f(build(&[7, 1, 7, 2, 7]), 7)));
        println!("   {}", to_list(&f(build(&[7, 7, 7]), 7)));
        println!("   {}", to_list(&f(build(&[1, 2, 3]), 7)));
    }
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

type Node struct {
	val  int
	next *Node
}

func build(vals []int) *Node {
	var head *Node
	for i := len(vals) - 1; i >= 0; i-- {
		head = &Node{vals[i], head}
	}
	return head
}

func toList(head *Node) string {
	var parts []string
	for head != nil {
		parts = append(parts, fmt.Sprint(head.val))
		head = head.next
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func removeAllNaive(head *Node, target int) *Node {
	for head != nil && head.val == target {
		head = head.next
	}
	cur := head
	for cur != nil && cur.next != nil {
		if cur.next.val == target {
			cur.next = cur.next.next
		} else {
			cur = cur.next
		}
	}
	return head
}

func removeAllDummy(head *Node, target int) *Node {
	dummy := &Node{0, head}
	cur := dummy
	for cur.next != nil {
		if cur.next.val == target {
			cur.next = cur.next.next
		} else {
			cur = cur.next
		}
	}
	return dummy.next
}

func main() {
	type impl struct {
		name string
		fn   func(*Node, int) *Node
	}
	for _, im := range []impl{{"remove_all_naive", removeAllNaive}, {"remove_all_dummy", removeAllDummy}} {
		fmt.Println(im.name)
		fmt.Println("  ", toList(im.fn(build([]int{7, 1, 7, 2, 7}), 7)))
		fmt.Println("  ", toList(im.fn(build([]int{7, 7, 7}), 7)))
		fmt.Println("  ", toList(im.fn(build([]int{1, 2, 3}), 7)))
	}
}`,
            },
          ],
        },
      ],
    },
    {
      id: "when-to-use",
      heading: "When to reach for one",
      body: [
        "The signal is simple: **whenever the head might change**, or whenever you are building a new list by appending.",
        "**Removing nodes by value or position.** As above.",
        "**Building a result list.** Merging two sorted lists, partitioning around a value, filtering — all want a `dummy` and a `tail` cursor so the first append is not a special case.",
        "**Removing the nth node from the end.** The nth from the end may be the head. With a dummy, the two-pointer version needs no check at all.",
        "**Reversing in groups, swapping pairs.** The first group's new head is not the old head, so the dummy holds the connection.",
        "Where it does *not* help: pure traversal, reversing the whole list, and the fast/slow pointer problems that only read. If the head cannot change, the dummy is noise.",
        "One habit worth forming: write `dummy = Node(0, head)` and `return dummy.next` **first**, before the loop. Writing the loop first and retrofitting the dummy is how you end up returning `dummy`.",
      ],
      pitfalls: [
        {
          title: "Returning dummy instead of dummy.next",
          body: "The single most common slip. The result gains a phantom leading element whose value is whatever you initialised the dummy with — usually 0, which looks plausible enough in a list of numbers to pass a casual glance.",
        },
        {
          title: "Advancing the dummy",
          body: "The dummy must stay put; walk with a separate cursor. Advance the dummy itself and you lose the handle on the list's start, which is the one thing it existed to hold.",
        },
        {
          title: "Using a dummy where the head cannot change",
          body: "For a read-only traversal or an in-place reversal the dummy adds a node and a line and removes nothing. Use it because the head might move, not out of habit.",
        },
        {
          title: "Forgetting to terminate the built list",
          body: "When constructing a result by appending, the final node's `next` may still point into the source list — which can create a cycle. Either set `tail.next = None` at the end, or make the last assignment do it explicitly.",
        },
      ],
    },
    {
      id: "tail-cursor",
      heading: "The companion trick: a tail cursor",
      body: [
        "The dummy head's partner is a `tail` pointer that always refers to the last node of the list being built.",
        "Appending is then `tail.next = node; tail = tail.next` with no branch for the empty case, because the dummy guarantees `tail` is never null. Without it, every append needs \"is this the first one?\".",
        "Together the two turn list construction into a loop with no special cases at either end — which is why merge, partition and filter all look like the same six lines once you have seen one of them.",
        "Keeping a tail reference is also what makes appending to a list O(1) rather than O(n) in the first place. A list class that supports fast `push_back` maintains exactly this.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What problem does a dummy head solve?",
      answer:
        "It gives the real first node a predecessor, so deletion and insertion at the head stop being special cases. The loop becomes uniform and the separate head-handling branch — a common source of bugs, especially when several leading nodes need removing — disappears.",
    },
    {
      question: "When would you not use one?",
      answer:
        "When the head cannot change: read-only traversals, full-list reversal, fast/slow pointer problems that only inspect. There it adds a node and a line and removes no case.",
    },
    {
      question: "What is the classic dummy-head bug?",
      answer:
        "Returning `dummy` instead of `dummy.next`, which prefixes the result with a phantom node holding the placeholder value. Writing the return line at the same time as the allocation avoids it.",
    },
  ],
  takeaways: [
    "A dummy head gives the first node a predecessor",
    "It replaces two loops with one and deletes a class of bug",
    "Use it whenever the head might change or you are building a list",
    "Return dummy.next, and write that line first",
    "Pair it with a tail cursor to make appends branch-free",
    "Terminate the built list, or you can leave a cycle behind",
  ],
  status: "available",
};
