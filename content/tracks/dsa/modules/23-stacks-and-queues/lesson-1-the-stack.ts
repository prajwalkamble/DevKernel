import type { Lesson } from "@/content/types";

export const theStackLesson: Lesson = {
  id: "dsa-sq-stack",
  slug: "the-stack-and-nesting",
  moduleSlug: "stacks-and-queues",
  title: "The Stack, and Problems That Are Secretly About Nesting",
  summary:
    "One rule — last in, first out — and it turns out to be the exact shape of every problem involving nesting, matching or undo. Recognising nesting is the skill; the stack is three method calls.",
  estimatedMinutes: 30,
  objectives: [
    "State the stack's operations and their costs",
    "Recognise nesting as the signal for a stack",
    "Write bracket matching and explain both failure modes",
    "Name the structures that are stacks under another name",
  ],
  sections: [
    {
      id: "the-rule",
      heading: "One rule",
      body: [
        "Push adds to the top, pop removes from the top, peek reads it. All O(1). There is no other access — you cannot reach the middle, and that restriction is the whole value.",
        "A stack is the right structure whenever the most recently opened thing must be the first one closed. That is **nesting**, and once you start looking for it you find it constantly: brackets, HTML tags, function calls, undo history, directory traversal, the parse of an arithmetic expression.",
        "The recognition rule is worth stating plainly. If the problem involves things that **open and close**, and an inner one must finish before an outer one, it is a stack problem — whatever the surface story is about.",
      ],
      examples: [
        {
          id: "brackets",
          title: "Bracket matching, and its two failure modes",
          lang: "python",
          code: `def is_balanced(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack

for case in ["()[]{}", "([{}])", "(]", "([)]", "(((", "", "())("]:
    print(f"{case!r:10s} {is_balanced(case)}")`,
          output: `'()[]{}'   True
'([{}])'   True
'(]'       False
'([)]'     False
'((('      False
''         True
'())('     False`,
      alternates: [
        {
          lang: "javascript",
          code: `function isBalanced(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of s) {
    if ("([{".includes(ch)) {
      stack.push(ch);
    } else if (ch in pairs) {
      if (!stack.length || stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;          // leftovers are the second failure mode
}

for (const c of ["()[]{}", "([{}])", "(]", "([)]", "(((", "", "())("]) {
  console.log(\`'\${c}'\`.padEnd(10) + " " + isBalanced(c));
}`,
          output: `'()[]{}'   true
'([{}])'   true
'(]'       false
'([)]'     false
'((('      false
''         true
'())('     false`,
        },
        {
          lang: "typescript",
          code: `function isBalanced(s: string): boolean {
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [];
  for (const ch of s) {
    if ("([{".includes(ch)) {
      stack.push(ch);
    } else if (ch in pairs) {
      if (!stack.length || stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;          // leftovers are the second failure mode
}

for (const c of ["()[]{}", "([{}])", "(]", "([)]", "(((", "", "())("]) {
  console.log(\`'\${c}'\`.padEnd(10) + " " + isBalanced(c));
}`,
          output: `'()[]{}'   true
'([{}])'   true
'(]'       false
'([)]'     false
'((('      false
''         true
'())('     false`,
        },
        {
          lang: "java",
          code: `import java.util.*;

public class Main {
    static boolean isBalanced(String s) {
        Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
        Deque<Character> stack = new ArrayDeque<>();
        for (char ch : s.toCharArray()) {
            if (ch == '(' || ch == '[' || ch == '{') {
                stack.push(ch);
            } else if (pairs.containsKey(ch)) {
                if (stack.isEmpty() || stack.pop() != pairs.get(ch)) return false;
            }
        }
        return stack.isEmpty();      // leftovers are the second failure mode
    }

    public static void main(String[] args) {
        for (String c : new String[]{"()[]{}", "([{}])", "(]", "([)]", "(((", "", "())("}) {
            String quoted = "'" + c + "'";
            System.out.printf("%-10s %b%n", quoted, isBalanced(c));
        }
    }
}`,
          output: `'()[]{}'   true
'([{}])'   true
'(]'       false
'([)]'     false
'((('      false
''         true
'())('     false`,
        },
        {
          lang: "cpp",
          code: `#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>
using namespace std;

bool isBalanced(const string& s) {
    map<char, char> pairs{{')', '('}, {']', '['}, {'}', '{'}};
    vector<char> stack;
    for (char ch : s) {
        if (ch == '(' || ch == '[' || ch == '{') {
            stack.push_back(ch);
        } else if (pairs.count(ch)) {
            if (stack.empty() || stack.back() != pairs[ch]) return false;
            stack.pop_back();
        }
    }
    return stack.empty();            // leftovers are the second failure mode
}

int main() {
    cout << boolalpha;
    for (const string& c : {"()[]{}", "([{}])", "(]", "([)]", "(((", "", "())("}) {
        string quoted = "'" + c + "'";
        cout << left << setw(10) << quoted << " " << isBalanced(c) << "\\n";
    }
}`,
          output: `'()[]{}'   true
'([{}])'   true
'(]'       false
'([)]'     false
'((('      false
''         true
'())('     false`,
        },
        {
          lang: "rust",
          code: `fn is_balanced(s: &str) -> bool {
    let mut stack: Vec<char> = Vec::new();
    for ch in s.chars() {
        match ch {
            '(' | '[' | '{' => stack.push(ch),
            ')' | ']' | '}' => {
                let want = match ch {
                    ')' => '(',
                    ']' => '[',
                    _ => '{',
                };
                if stack.pop() != Some(want) {
                    return false;
                }
            }
            _ => {}
        }
    }
    stack.is_empty() // leftovers are the second failure mode
}

fn main() {
    for c in ["()[]{}", "([{}])", "(]", "([)]", "(((", "", "())("] {
        let quoted = format!("'{}'", c);
        println!("{:<10} {}", quoted, is_balanced(c));
    }
}`,
          output: `'()[]{}'   true
'([{}])'   true
'(]'       false
'([)]'     false
'((('      false
''         true
'())('     false`,
        },
        {
          lang: "go",
          code: `package main

import "fmt"

func isBalanced(s string) bool {
	pairs := map[rune]rune{')': '(', ']': '[', '}': '{'}
	stack := []rune{}
	for _, ch := range s {
		switch ch {
		case '(', '[', '{':
			stack = append(stack, ch)
		default:
			if want, ok := pairs[ch]; ok {
				if len(stack) == 0 || stack[len(stack)-1] != want {
					return false
				}
				stack = stack[:len(stack)-1]
			}
		}
	}
	return len(stack) == 0 // leftovers are the second failure mode
}

func main() {
	for _, c := range []string{"()[]{}", "([{}])", "(]", "([)]", "(((", "", "())("} {
		fmt.Printf("%-10s %t\\n", "'"+c+"'", isBalanced(c))
	}
}`,
          output: `'()[]{}'   true
'([{}])'   true
'(]'       false
'([)]'     false
'((('      false
''         true
'())('     false`,
        },
      ],
          explanation:
            "There are **two** ways to be unbalanced and both need handling. A closer with nothing open, or the wrong opener on top — caught inside the loop. And openers left over at the end — caught by `return not stack`, which is the check people forget, and `'((('` is the case that catches them. `'([)]'` is the one that proves a counter cannot replace the stack: the counts are all correct and the nesting is not.",
        },
      ],
      visual: {
        id: "stack-visual",
        kind: "stack",
        title: "Push and pop, and why only the top is reachable",
      },
    },
    {
      id: "expressions",
      heading: "Expressions, and the two-stack evaluator",
      body: [
        "Arithmetic is nesting with precedence rules, so it is a stack problem twice over.",
        "**Postfix (RPN) evaluation** is the easy half: push numbers, and on an operator pop two, apply, push the result. No precedence rules and no parentheses, because the ordering is already encoded in the sequence. Get the operand order right — the *second* pop is the left operand, which matters for `-` and `/`.",
        "**Infix evaluation** needs two stacks, one for numbers and one for operators, or the shunting-yard algorithm to convert to postfix first. The rule: on reading an operator, first apply any stacked operator of greater or equal precedence, then push the new one. A closing parenthesis applies everything back to its opener.",
        "**Basic Calculator** in its several LeetCode variants is exactly this, and the version with parentheses and unary minus is a genuinely fiddly problem worth doing once carefully rather than three times quickly.",
        "The insight worth carrying: precedence is just a rule about *when to stop popping*. Once you see that, all the calculator variants are the same algorithm with a different precedence table.",
      ],
      pitfalls: [
        {
          title: "Forgetting the leftovers check",
          body: "`'((('` has no mismatched closer, so a loop that only validates closers returns True. The final `return not stack` is what rejects it, and it is the most commonly omitted line in this problem.",
        },
        {
          title: "Popping an empty stack",
          body: "A closing bracket with nothing open. `if not stack` must come before the pop, and short-circuit evaluation is what makes `not stack or stack.pop() != ...` safe in that order.",
        },
        {
          title: "Counting instead of stacking",
          body: "A counter works for one bracket type and fails the moment there are several — `'([)]'` has balanced counts and invalid nesting. If the problem has more than one kind of bracket, a counter cannot be correct.",
        },
        {
          title: "Reversed operands in postfix evaluation",
          body: "`b = pop(); a = pop(); a - b`. The second value popped is the left operand. Addition and multiplication hide the bug; subtraction and division expose it.",
        },
      ],
    },
    {
      id: "in-disguise",
      heading: "Stacks under other names",
      body: [
        "**The call stack.** Function calls nest, so the runtime keeps a stack of frames. Converting a recursion to an iteration means managing that stack yourself — which is why the recursion module and this one meet here.",
        "**Depth-first search.** DFS is a stack-driven traversal; recursion just borrows the call stack to hold it. An explicit stack is the same algorithm without the depth limit.",
        "**Undo history.** The most recent action is the first undone. Redo is a second stack.",
        "**Backtracking.** Choose, explore, un-choose — the un-choose step is a pop, and the path being built is the stack.",
        "**Browser history, the operating system's process stack, the JVM's operand stack.** All the same rule.",
        "The point of the list is recognition. When a problem describes a process that goes deeper and then must come back out in reverse, you already know the structure before you know the algorithm.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you validate nested brackets, and what are the edge cases?",
      answer:
        "Push openers, and on a closer check the stack is non-empty and its top is the matching opener. Two failure modes: a closer with nothing open, and openers left at the end — so the function returns `stack.isEmpty()`, not `true`. A counter is not sufficient once there is more than one bracket type.",
    },
    {
      question: "Why can't a counter replace the stack for bracket matching?",
      answer:
        "A counter tracks how many are open but not which kind or in what order. `([)]` has correct counts for both types and is invalid — only a stack records the nesting order that has to be respected.",
    },
    {
      question: "How do you evaluate an infix expression with precedence?",
      answer:
        "Two stacks, values and operators. On an operator, apply any stacked operator of greater or equal precedence before pushing the new one; a closing parenthesis applies everything back to its opener. Precedence is only a rule about when to stop popping.",
    },
  ],
  takeaways: [
    "Push, pop, peek — all O(1), and the middle is deliberately unreachable",
    "Nesting is the signal: things that open and close in reverse order",
    "Bracket matching has two failure modes, and the leftovers check is one",
    "A counter fails as soon as there are two bracket types",
    "In postfix, the second pop is the left operand",
    "Call stack, DFS, undo and backtracking are all this structure",
  ],
  status: "available",
};
