import type { Lesson } from "@/content/types";

export const problemsThatRewireLesson: Lesson = {
  id: "dsa-ll-rewire",
  slug: "problems-that-rewire",
  moduleSlug: "linked-lists",
  title: "Problems That Rewire",
  summary:
    "A set of problems whose solutions look like tricks until you see what each one is exploiting: two cursors that swap lists, digits stored backwards on purpose, and a copy interleaved with its own original.",
  estimatedMinutes: 30,
  objectives: [
    "Find where two lists intersect without measuring their lengths",
    "Add numbers held as digit lists, in either digit order",
    "Copy a list with random pointers in O(1) extra space",
    "Recognise what each trick is actually exploiting",
  ],
  sections: [
    {
      id: "intersection",
      heading: "Two cursors that switch lists",
      body: [
        "Two lists that share a tail intersect at a node — the same object, not merely an equal value. The obvious solution measures both lengths, advances the longer by the difference, then walks in step.",
        "The elegant one: run a cursor along each list, and when either reaches the end, restart it at the *other* list's head. Both cursors then travel exactly `lenA + lenB` nodes before the second lap ends, so they arrive at the intersection simultaneously.",
        "The reason it works is a length argument. Cursor A walks `a + shared` then `b`; cursor B walks `b + shared` then `a`. Both have covered `a + b + shared` when they reach the junction. If the lists never intersect, both hit null after `a + b` steps and the loop ends with `p is q is None`, which is why the same code reports \"no intersection\" without a special case.",
      ],
      examples: [
        {
          id: "rewire-pair",
          title: "Intersection, and addition without reversal",
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
        out.append(head.val); head = head.next
    return out

def intersection(a, b):
    """Two cursors that switch lists on reaching the end meet at the join."""
    p, q = a, b
    while p is not q:
        p = p.next if p else b
        q = q.next if q else a
    return p.val if p else None

# a: 1 -> 2 -> 8 -> 9 ;  b: 5 -> 8 -> 9   (shared tail from 8)
shared = build([8, 9])
a = Node(1, Node(2, shared))
b = Node(5, shared)
def show(v):
    return "-" if v is None else str(v)

print("intersect at:", show(intersection(a, b)))
print("disjoint:    ", show(intersection(build([1, 2]), build([3, 4]))))

def add_two_numbers(a, b):
    """Digits stored least significant first, so no reversal is needed."""
    dummy = Node(0)
    tail = dummy
    carry = 0
    while a or b or carry:
        total = carry
        if a: total += a.val; a = a.next
        if b: total += b.val; b = b.next
        carry, digit = divmod(total, 10)
        tail.next = Node(digit)
        tail = tail.next
    return dummy.next

# 342 + 465 = 807, stored reversed
print("342+465 ->", to_list(add_two_numbers(build([2, 4, 3]), build([5, 6, 4]))))
print("99+1   ->", to_list(add_two_numbers(build([9, 9]), build([1]))))`,
          output: `intersect at: 8
disjoint:     -
342+465 -> [7, 0, 8]
99+1   -> [0, 0, 1]`,
          explanation:
            "`p is not q` compares **identity**. Comparing values would stop at the first node whose value happens to match, which is a different and wrong question. In the addition, `while a or b or carry` handles unequal lengths and the final carry in one condition — 99 + 1 produces a third digit that neither input had, and dropping the `or carry` is the standard bug. The digits being stored least-significant-first is what makes this a single forward pass; the variant that stores them most-significant-first genuinely does need reversal or a stack.",
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

// Two cursors that switch lists on reaching the end meet at the join.
function intersection(a, b) {
  let p = a;
  let q = b;
  while (p !== q) {
    p = p ? p.next : b;
    q = q ? q.next : a;
  }
  return p ? p.val : null;
}

const show = (v) => (v === null ? "-" : String(v));

// a: 1 -> 2 -> 8 -> 9 ;  b: 5 -> 8 -> 9   (shared tail from 8)
const shared = build([8, 9]);
const a = new Node(1, new Node(2, shared));
const b = new Node(5, shared);
console.log("intersect at:", show(intersection(a, b)));
console.log("disjoint:    ", show(intersection(build([1, 2]), build([3, 4]))));

// Digits stored least significant first, so no reversal is needed.
function addTwoNumbers(a, b) {
  const dummy = new Node(0);
  let tail = dummy;
  let carry = 0;
  while (a || b || carry) {
    let total = carry;
    if (a) {
      total += a.val;
      a = a.next;
    }
    if (b) {
      total += b.val;
      b = b.next;
    }
    carry = Math.floor(total / 10);
    tail.next = new Node(total % 10);
    tail = tail.next;
  }
  return dummy.next;
}

// 342 + 465 = 807, stored reversed
console.log("342+465 ->", list(toList(addTwoNumbers(build([2, 4, 3]), build([5, 6, 4])))));
console.log("99+1   ->", list(toList(addTwoNumbers(build([9, 9]), build([1])))));`,
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

// Two cursors that switch lists on reaching the end meet at the join.
function intersection(a: Node | null, b: Node | null): number | null {
  let p: Node | null = a;
  let q: Node | null = b;
  while (p !== q) {
    p = p ? p.next : b;
    q = q ? q.next : a;
  }
  return p ? p.val : null;
}

const show = (v: number | null): string => (v === null ? "-" : String(v));

// a: 1 -> 2 -> 8 -> 9 ;  b: 5 -> 8 -> 9   (shared tail from 8)
const shared = build([8, 9]);
const a = new Node(1, new Node(2, shared));
const b = new Node(5, shared);
console.log("intersect at:", show(intersection(a, b)));
console.log("disjoint:    ", show(intersection(build([1, 2]), build([3, 4]))));

// Digits stored least significant first, so no reversal is needed.
function addTwoNumbers(a: Node | null, b: Node | null): Node | null {
  const dummy = new Node(0);
  let tail = dummy;
  let carry = 0;
  while (a || b || carry) {
    let total = carry;
    if (a) {
      total += a.val;
      a = a.next;
    }
    if (b) {
      total += b.val;
      b = b.next;
    }
    carry = Math.floor(total / 10);
    tail.next = new Node(total % 10);
    tail = tail.next;
  }
  return dummy.next;
}

// 342 + 465 = 807, stored reversed
console.log("342+465 ->", list(toList(addTwoNumbers(build([2, 4, 3]), build([5, 6, 4])))));
console.log("99+1   ->", list(toList(addTwoNumbers(build([9, 9]), build([1])))));`,
            },
            {
              lang: "java",
              code: `public class Main {
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

    /** Two cursors that switch lists on reaching the end meet at the join. */
    static Integer intersection(Node a, Node b) {
        Node p = a, q = b;
        while (p != q) {
            p = p != null ? p.next : b;
            q = q != null ? q.next : a;
        }
        return p != null ? p.val : null;
    }

    static String show(Integer v) {
        return v == null ? "-" : String.valueOf(v);
    }

    /** Digits stored least significant first, so no reversal is needed. */
    static Node addTwoNumbers(Node a, Node b) {
        Node dummy = new Node(0, null);
        Node tail = dummy;
        int carry = 0;
        while (a != null || b != null || carry != 0) {
            int total = carry;
            if (a != null) {
                total += a.val;
                a = a.next;
            }
            if (b != null) {
                total += b.val;
                b = b.next;
            }
            carry = total / 10;
            tail.next = new Node(total % 10, null);
            tail = tail.next;
        }
        return dummy.next;
    }

    public static void main(String[] args) {
        // a: 1 -> 2 -> 8 -> 9 ;  b: 5 -> 8 -> 9   (shared tail from 8)
        Node shared = build(new int[]{8, 9});
        Node a = new Node(1, new Node(2, shared));
        Node b = new Node(5, shared);
        System.out.println("intersect at: " + show(intersection(a, b)));
        System.out.println("disjoint:     "
                + show(intersection(build(new int[]{1, 2}), build(new int[]{3, 4}))));

        // 342 + 465 = 807, stored reversed
        System.out.println("342+465 -> "
                + toList(addTwoNumbers(build(new int[]{2, 4, 3}), build(new int[]{5, 6, 4}))));
        System.out.println("99+1   -> "
                + toList(addTwoNumbers(build(new int[]{9, 9}), build(new int[]{1}))));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <optional>
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

// Two cursors that switch lists on reaching the end meet at the join.
optional<int> intersection(Node* a, Node* b) {
    Node* p = a;
    Node* q = b;
    while (p != q) {
        p = p ? p->next : b;
        q = q ? q->next : a;
    }
    return p ? optional<int>(p->val) : nullopt;
}

string show(const optional<int>& v) { return v ? to_string(*v) : "-"; }

// Digits stored least significant first, so no reversal is needed.
Node* addTwoNumbers(Node* a, Node* b) {
    Node dummy(0);
    Node* tail = &dummy;
    int carry = 0;
    while (a || b || carry) {
        int total = carry;
        if (a) {
            total += a->val;
            a = a->next;
        }
        if (b) {
            total += b->val;
            b = b->next;
        }
        carry = total / 10;
        tail->next = new Node(total % 10);
        tail = tail->next;
    }
    return dummy.next;
}

int main() {
    // a: 1 -> 2 -> 8 -> 9 ;  b: 5 -> 8 -> 9   (shared tail from 8)
    Node* shared = build({8, 9});
    Node* a = new Node(1, new Node(2, shared));
    Node* b = new Node(5, shared);
    cout << "intersect at: " << show(intersection(a, b)) << "\\n";
    cout << "disjoint:     " << show(intersection(build({1, 2}), build({3, 4}))) << "\\n";

    // 342 + 465 = 807, stored reversed
    cout << "342+465 -> " << toList(addTwoNumbers(build({2, 4, 3}), build({5, 6, 4}))) << "\\n";
    cout << "99+1   -> " << toList(addTwoNumbers(build({9, 9}), build({1}))) << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `// \`Rc<RefCell<Node>>\`, not \`Option<Box<Node>>\`: the two lists here share a
// tail, and a \`Box\` owns its successor outright, so no two lists can point at
// the same node.
use std::cell::RefCell;
use std::rc::Rc;

type Link = Option<Rc<RefCell<Node>>>;

struct Node {
    val: i32,
    next: Link,
}

fn node(val: i32, next: Link) -> Link {
    Some(Rc::new(RefCell::new(Node { val, next })))
}

fn build(vals: &[i32]) -> Link {
    let mut head: Link = None;
    for &v in vals.iter().rev() {
        head = node(v, head);
    }
    head
}

fn next_of(link: &Link) -> Link {
    link.as_ref().and_then(|n| n.borrow().next.clone())
}

fn to_list(head: &Link) -> String {
    let mut parts: Vec<String> = Vec::new();
    let mut cur = head.clone();
    while let Some(n) = cur {
        parts.push(n.borrow().val.to_string());
        cur = n.borrow().next.clone();
    }
    format!("[{}]", parts.join(", "))
}

fn same(a: &Link, b: &Link) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(x), Some(y)) => Rc::ptr_eq(x, y),
        _ => false,
    }
}

/// Two cursors that switch lists on reaching the end meet at the join.
fn intersection(a: &Link, b: &Link) -> Option<i32> {
    let mut p = a.clone();
    let mut q = b.clone();
    while !same(&p, &q) {
        p = if p.is_some() { next_of(&p) } else { b.clone() };
        q = if q.is_some() { next_of(&q) } else { a.clone() };
    }
    p.map(|n| n.borrow().val)
}

fn show(v: Option<i32>) -> String {
    match v {
        None => "-".to_string(),
        Some(x) => x.to_string(),
    }
}

/// Digits stored least significant first, so no reversal is needed.
fn add_two_numbers(a: &Link, b: &Link) -> Link {
    let dummy = node(0, None).unwrap();
    let mut tail = dummy.clone();
    let mut carry = 0;
    let mut p = a.clone();
    let mut q = b.clone();
    while p.is_some() || q.is_some() || carry != 0 {
        let mut total = carry;
        if let Some(n) = p.clone() {
            total += n.borrow().val;
            p = n.borrow().next.clone();
        }
        if let Some(n) = q.clone() {
            total += n.borrow().val;
            q = n.borrow().next.clone();
        }
        carry = total / 10;
        let fresh = node(total % 10, None).unwrap();
        tail.borrow_mut().next = Some(fresh.clone());
        tail = fresh;
    }
    let out = dummy.borrow().next.clone();
    out
}

fn main() {
    // a: 1 -> 2 -> 8 -> 9 ;  b: 5 -> 8 -> 9   (shared tail from 8)
    let shared = build(&[8, 9]);
    let a = node(1, node(2, shared.clone()));
    let b = node(5, shared);
    println!("intersect at: {}", show(intersection(&a, &b)));
    println!("disjoint:     {}", show(intersection(&build(&[1, 2]), &build(&[3, 4]))));

    // 342 + 465 = 807, stored reversed
    println!("342+465 -> {}", to_list(&add_two_numbers(&build(&[2, 4, 3]), &build(&[5, 6, 4]))));
    println!("99+1   -> {}", to_list(&add_two_numbers(&build(&[9, 9]), &build(&[1]))));
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

// Two cursors that switch lists on reaching the end meet at the join.
func intersection(a, b *Node) *int {
	p, q := a, b
	for p != q {
		if p != nil {
			p = p.next
		} else {
			p = b
		}
		if q != nil {
			q = q.next
		} else {
			q = a
		}
	}
	if p == nil {
		return nil
	}
	return &p.val
}

func show(v *int) string {
	if v == nil {
		return "-"
	}
	return fmt.Sprint(*v)
}

// Digits stored least significant first, so no reversal is needed.
func addTwoNumbers(a, b *Node) *Node {
	dummy := &Node{}
	tail := dummy
	carry := 0
	for a != nil || b != nil || carry != 0 {
		total := carry
		if a != nil {
			total += a.val
			a = a.next
		}
		if b != nil {
			total += b.val
			b = b.next
		}
		carry = total / 10
		tail.next = &Node{val: total % 10}
		tail = tail.next
	}
	return dummy.next
}

func main() {
	// a: 1 -> 2 -> 8 -> 9 ;  b: 5 -> 8 -> 9   (shared tail from 8)
	shared := build([]int{8, 9})
	a := &Node{1, &Node{2, shared}}
	b := &Node{5, shared}
	fmt.Println("intersect at:", show(intersection(a, b)))
	fmt.Println("disjoint:    ", show(intersection(build([]int{1, 2}), build([]int{3, 4}))))

	// 342 + 465 = 807, stored reversed
	fmt.Println("342+465 ->", toList(addTwoNumbers(build([]int{2, 4, 3}), build([]int{5, 6, 4}))))
	fmt.Println("99+1   ->", toList(addTwoNumbers(build([]int{9, 9}), build([]int{1}))))
}`,
            },
          ],
        },
      ],
    },
    {
      id: "random-pointer",
      heading: "Copy a list with random pointers",
      body: [
        "Each node has a `next` and a `random` pointing anywhere in the list or nowhere. Produce a deep copy.",
        "The straightforward answer is a hash map from original node to copied node: one pass to create the copies, a second to wire up `next` and `random` by looking each original up. O(n) time, O(n) space, and perfectly acceptable.",
        "The O(1)-space version is the memorable one, and it works by **interleaving the copy with the original**. Three passes:",
        "**One** — after every original node, splice in its copy, so the list reads `A, A', B, B', C, C'`.",
        "**Two** — set each copy's random: `node.next.random = node.random.next`. The copy of whatever `node.random` points at is sitting immediately after it, which is exactly what the interleaving arranged.",
        "**Three** — unzip the two lists apart, restoring the original's `next` pointers as you go.",
        "The trick being exploited is that the interleaving *is* the map. Instead of storing \"original → copy\" in a hash table, the relationship is encoded in the list's own structure, one node apart.",
      ],
      pitfalls: [
        {
          title: "Comparing values instead of identity",
          body: "Intersection asks whether two lists share a *node*. `p.val == q.val` finds the first coincidence of values, which is almost never the junction. Use `is` in Python, reference equality in Java, pointer comparison in C++.",
        },
        {
          title: "Dropping the final carry",
          body: "`while a or b` misses the case where the last addition carries — 99 + 1 loses its leading digit and returns 00. The carry belongs in the loop condition, not only inside it.",
        },
        {
          title: "Forgetting to restore the original in the interleaving trick",
          body: "The unzip pass must repair every original node's `next`. Leaving them pointing at copies mutates the caller's list, and most graders check it afterwards.",
        },
        {
          title: "Assuming random is never null",
          body: "`node.random.next` throws when `random` is null. Guard it — the null case is in the test data precisely because it is easy to miss.",
        },
      ],
    },
    {
      id: "the-rest",
      heading: "The rest of the family",
      body: [
        "**Rotate List by k.** Connect the tail to the head to make a ring, walk to the new tail at position `n − k % n`, then break. Making it circular first turns a fiddly index problem into two steps, and taking `k % n` first is what stops a large k from being an O(k) walk.",
        "**Flatten a Multilevel Doubly Linked List.** Depth-first: when a node has a child, splice the whole child list in after it and push the old `next` onto a stack. The `prev` pointers must be repaired too, which is the half people forget.",
        "**Remove Nth Node From End.** The gap form of fast/slow, with a dummy head so removing the head itself needs no branch.",
        "**Reorder List.** Three known pieces composed: find the middle, reverse the second half, then interleave. Almost every hard list problem decomposes into pieces from this module.",
        "**Split Linked List in Parts.** Length, then division and remainder to decide part sizes. Unglamorous and a good check that you can cut a list cleanly.",
        "The recurring lesson: when a list problem looks like it needs extra structure, ask whether the list's own links can be made to carry the information instead — as a ring, an interleaving, or a temporarily reversed section.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Find where two linked lists intersect, without computing lengths.",
      answer:
        "Run a cursor on each; when one reaches the end, restart it at the other list's head. Both then travel lenA + lenB + shared before reaching the junction, so they arrive together. If the lists are disjoint both become null simultaneously and the loop ends naturally.",
    },
    {
      question: "Copy a list with random pointers in O(1) extra space.",
      answer:
        "Interleave each copy directly after its original, so every original's copy is one step away. Set each copy's random with `node.next.random = node.random.next`, then unzip the two lists apart while restoring the originals' next pointers. The interleaving replaces the hash map.",
    },
    {
      question: "Why is Add Two Numbers easier with digits reversed?",
      answer:
        "Addition carries from least significant to most, which is the direction a list traverses when the least significant digit is at the head. Stored most-significant-first, you need a reversal or a stack to process them in carry order.",
    },
  ],
  takeaways: [
    "Switching cursors between lists equalises path lengths",
    "Compare node identity, never values",
    "`while a or b or carry` handles both lengths and the final carry",
    "Interleaving a copy with its original replaces the hash map",
    "Making a list circular simplifies rotation",
    "Hard list problems decompose into middle, reverse and merge",
  ],
  status: "available",
};
