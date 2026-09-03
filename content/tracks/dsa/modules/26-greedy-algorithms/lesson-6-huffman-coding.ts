import type { Lesson } from "@/content/types";

export const huffmanLesson: Lesson = {
  id: "dsa-greedy-huffman",
  slug: "huffman-coding-built-from-a-heap",
  moduleSlug: "greedy-algorithms",
  title: "Huffman Coding, Built from a Heap",
  summary:
    "The greedy algorithm that is actually deployed — in every zip file, JPEG and HTTP/2 header. One rule, a heap, and a proof that the rule is optimal rather than merely good.",
  estimatedMinutes: 35,
  objectives: [
    "Say what a prefix code is and show why a code without the property cannot be decoded",
    "Build a Huffman tree with a heap, and read the codes off it",
    "Explain why a symbol's code length is its depth, and what that makes the cost function",
    "State the greedy choice property for Huffman and check it rather than assert it",
  ],
  sections: [
    {
      id: "why-prefix-free",
      heading: "What a code has to promise before it can be short",
      body: [
        "Six symbols and a fixed-width code needs three bits each, whatever the text says. That is obviously wasteful when one symbol appears 45 times and another 5 — the common one is paying the same as the rare one — and the fix is obvious too: shorter codes for commoner symbols.",
        "The trap is that most ways of doing it produce something that cannot be read back. A decoder sees a run of bits with no separators, so it has to know where each code ends from the bits alone. If one symbol's code is a prefix of another's, it cannot.",
        "So the requirement is precise: no code may be a prefix of any other. Such a code is called *prefix-free*, and the useful way to picture one is a binary tree with every symbol at a leaf — a leaf is never on the path to another leaf, so the property holds by construction. The question this lesson answers is which tree is best.",
      ],
      visual: {
        id: "greedy-huffman",
        kind: "greedy",
        algorithm: "huffman",
        title: "Building a Huffman tree from a heap",
        lockAlgorithm: true,
      },
      examples: [
        {
          id: "why-prefix-free",
          title: "The requirement a code has to meet",
          lang: "python",
          code: `freq = [("a", 5), ("b", 9), ("c", 12), ("d", 13), ("e", 16), ("f", 45)]
total = sum(n for _, n in freq)

# Six symbols need three bits each if every code is the same length.
width = 1
while 2 ** width < len(freq):
    width += 1
print(f"{len(freq)} symbols, {total} of them in the text")
print(f"a fixed-width code needs {width} bits each: {total} x {width} = {total * width} bits")
print()

# The obvious improvement: shorter codes for commoner symbols. Done carelessly,
# it produces something that cannot be read back.
naive = {"f": "0", "e": "1", "d": "00", "c": "01", "b": "10", "a": "11"}
print("shorter codes for commoner symbols, assigned by hand:")
print("  " + "  ".join(f"{s}={naive[s]}" for s, _ in freq))
cost = sum(n * len(naive[s]) for s, n in freq)
print(f"  that would be {cost} bits — but it does not work at all")
print()

stream = "00"   # f then f, or d — the code cannot say
print(f"the bitstream {stream!r} is two symbols or one, and nothing says which:")
for reading in [("f", "f"), ("d",)]:
    bits = "".join(naive[s] for s in reading)
    print(f"  {' + '.join(reading):<8} encodes to {bits!r}")
print("  a code is only decodable if no code is a prefix of another —")
print("  '0' is a prefix of '00', so the stream is ambiguous")
print()

# A prefix-free code is exactly a code whose symbols are all at leaves.
huffman = {"f": "0", "c": "100", "d": "101", "a": "1100", "b": "1101", "e": "111"}
print("a prefix-free code for the same frequencies:")
print(f"  {'symbol':<7} {'count':>6} {'code':>6} {'bits':>5} {'total':>7}")
used = 0
for s, n in freq:
    used += n * len(huffman[s])
    print(f"  {s:<7} {n:>6} {huffman[s]:>6} {len(huffman[s]):>5} {n * len(huffman[s]):>7}")
print(f"  {'':<7} {'':>6} {'':>6} {'':>5} {used:>7}")
print()

for s in huffman:
    for other in huffman:
        if s != other and huffman[other].startswith(huffman[s]):
            print(f"  PREFIX CLASH: {s} is a prefix of {other}")
print("no code is a prefix of any other, so the stream reads back one way only")
print()
print(f"{used} bits against {total * width}, a saving of "
      f"{100 * (total * width - used) // (total * width)}%")
print("and the commonest symbol got the shortest code, which is the whole idea.")`,
          output: `6 symbols, 100 of them in the text
a fixed-width code needs 3 bits each: 100 x 3 = 300 bits

shorter codes for commoner symbols, assigned by hand:
  a=11  b=10  c=01  d=00  e=1  f=0
  that would be 139 bits — but it does not work at all

the bitstream '00' is two symbols or one, and nothing says which:
  f + f    encodes to '00'
  d        encodes to '00'
  a code is only decodable if no code is a prefix of another —
  '0' is a prefix of '00', so the stream is ambiguous

a prefix-free code for the same frequencies:
  symbol   count   code  bits   total
  a            5   1100     4      20
  b            9   1101     4      36
  c           12    100     3      36
  d           13    101     3      39
  e           16    111     3      48
  f           45      0     1      45
                                  224

no code is a prefix of any other, so the stream reads back one way only

224 bits against 300, a saving of 25%
and the commonest symbol got the shortest code, which is the whole idea.`,
          explanation:
            "The middle block is the one worth sitting with. Assigning shorter codes to commoner symbols is the right instinct, and done by hand it produces something that scores 139 bits and cannot be read back at all — because `0` is a prefix of `00`, the bitstream `00` is both `f f` and `d`, and no amount of cleverness at the decoder recovers which was meant. The prefix-free requirement is not a technicality; it is the entire difference between a compression scheme and a lossy one. The last block checks it by brute force rather than by inspection: every pair of codes, against every other.",
          alternates: [
            {
              lang: "javascript",
              code: `const freq = [["a", 5], ["b", 9], ["c", 12], ["d", 13], ["e", 16], ["f", 45]];
const total = freq.reduce((s, [, n]) => s + n, 0);

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);

// Six symbols need three bits each if every code is the same length.
let width = 1;
while (2 ** width < freq.length) width += 1;
console.log(\`\${freq.length} symbols, \${total} of them in the text\`);
console.log(\`a fixed-width code needs \${width} bits each: \${total} x \${width} = \${total * width} bits\`);
console.log();

// The obvious improvement: shorter codes for commoner symbols. Done carelessly,
// it produces something that cannot be read back.
const naive = { f: "0", e: "1", d: "00", c: "01", b: "10", a: "11" };
console.log("shorter codes for commoner symbols, assigned by hand:");
console.log("  " + freq.map(([s]) => \`\${s}=\${naive[s]}\`).join("  "));
const cost = freq.reduce((acc, [s, n]) => acc + n * naive[s].length, 0);
console.log(\`  that would be \${cost} bits — but it does not work at all\`);
console.log();

const stream = "00"; // f then f, or d — the code cannot say
console.log(\`the bitstream '\${stream}' is two symbols or one, and nothing says which:\`);
for (const reading of [["f", "f"], ["d"]]) {
  const bits = reading.map((s) => naive[s]).join("");
  console.log(\`  \${padR(reading.join(" + "), 8)} encodes to '\${bits}'\`);
}
console.log("  a code is only decodable if no code is a prefix of another —");
console.log("  '0' is a prefix of '00', so the stream is ambiguous");
console.log();

// A prefix-free code is exactly a code whose symbols are all at leaves.
const huffman = { f: "0", c: "100", d: "101", a: "1100", b: "1101", e: "111" };
console.log("a prefix-free code for the same frequencies:");
console.log(\`  \${padR("symbol", 7)} \${padL("count", 6)} \${padL("code", 6)} \${padL("bits", 5)} \${padL("total", 7)}\`);
let used = 0;
for (const [s, n] of freq) {
  used += n * huffman[s].length;
  console.log(\`  \${padR(s, 7)} \${padL(n, 6)} \${padL(huffman[s], 6)} \${padL(huffman[s].length, 5)} \${padL(n * huffman[s].length, 7)}\`);
}
console.log(\`  \${padR("", 7)} \${padL("", 6)} \${padL("", 6)} \${padL("", 5)} \${padL(used, 7)}\`);
console.log();

for (const s of Object.keys(huffman)) {
  for (const other of Object.keys(huffman)) {
    if (s !== other && huffman[other].startsWith(huffman[s])) {
      console.log(\`  PREFIX CLASH: \${s} is a prefix of \${other}\`);
    }
  }
}
console.log("no code is a prefix of any other, so the stream reads back one way only");
console.log();
console.log(\`\${used} bits against \${total * width}, a saving of \`
  + \`\${Math.floor((100 * (total * width - used)) / (total * width))}%\`);
console.log("and the commonest symbol got the shortest code, which is the whole idea.");`,
            },
            {
              lang: "typescript",
              code: `type Count = [string, number];

const freq: Count[] = [["a", 5], ["b", 9], ["c", 12], ["d", 13], ["e", 16], ["f", 45]];
const total = freq.reduce((s, [, n]) => s + n, 0);

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);

// Six symbols need three bits each if every code is the same length.
let width = 1;
while (2 ** width < freq.length) width += 1;
console.log(\`\${freq.length} symbols, \${total} of them in the text\`);
console.log(\`a fixed-width code needs \${width} bits each: \${total} x \${width} = \${total * width} bits\`);
console.log();

// The obvious improvement: shorter codes for commoner symbols. Done carelessly,
// it produces something that cannot be read back.
const naive: Record<string, string> = { f: "0", e: "1", d: "00", c: "01", b: "10", a: "11" };
console.log("shorter codes for commoner symbols, assigned by hand:");
console.log("  " + freq.map(([s]) => \`\${s}=\${naive[s]}\`).join("  "));
const cost = freq.reduce((acc, [s, n]) => acc + n * naive[s].length, 0);
console.log(\`  that would be \${cost} bits — but it does not work at all\`);
console.log();

const stream = "00"; // f then f, or d — the code cannot say
console.log(\`the bitstream '\${stream}' is two symbols or one, and nothing says which:\`);
for (const reading of [["f", "f"], ["d"]]) {
  const bits = reading.map((s) => naive[s]).join("");
  console.log(\`  \${padR(reading.join(" + "), 8)} encodes to '\${bits}'\`);
}
console.log("  a code is only decodable if no code is a prefix of another —");
console.log("  '0' is a prefix of '00', so the stream is ambiguous");
console.log();

// A prefix-free code is exactly a code whose symbols are all at leaves.
const huffman: Record<string, string> = { f: "0", c: "100", d: "101", a: "1100", b: "1101", e: "111" };
console.log("a prefix-free code for the same frequencies:");
console.log(\`  \${padR("symbol", 7)} \${padL("count", 6)} \${padL("code", 6)} \${padL("bits", 5)} \${padL("total", 7)}\`);
let used = 0;
for (const [s, n] of freq) {
  used += n * huffman[s].length;
  console.log(\`  \${padR(s, 7)} \${padL(n, 6)} \${padL(huffman[s], 6)} \${padL(huffman[s].length, 5)} \${padL(n * huffman[s].length, 7)}\`);
}
console.log(\`  \${padR("", 7)} \${padL("", 6)} \${padL("", 6)} \${padL("", 5)} \${padL(used, 7)}\`);
console.log();

for (const s of Object.keys(huffman)) {
  for (const other of Object.keys(huffman)) {
    if (s !== other && huffman[other].startsWith(huffman[s])) {
      console.log(\`  PREFIX CLASH: \${s} is a prefix of \${other}\`);
    }
  }
}
console.log("no code is a prefix of any other, so the stream reads back one way only");
console.log();
console.log(\`\${used} bits against \${total * width}, a saving of \`
  + \`\${Math.floor((100 * (total * width - used)) / (total * width))}%\`);
console.log("and the commonest symbol got the shortest code, which is the whole idea.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Main {
    record Count(String symbol, int n) {}

    public static void main(String[] args) {
        List<Count> freq = List.of(new Count("a", 5), new Count("b", 9), new Count("c", 12),
                new Count("d", 13), new Count("e", 16), new Count("f", 45));
        int total = 0;
        for (Count c : freq) total += c.n();

        // Six symbols need three bits each if every code is the same length.
        int width = 1;
        while (Math.pow(2, width) < freq.size()) width += 1;
        System.out.println(freq.size() + " symbols, " + total + " of them in the text");
        System.out.println("a fixed-width code needs " + width + " bits each: "
                + total + " x " + width + " = " + total * width + " bits");
        System.out.println();

        // The obvious improvement: shorter codes for commoner symbols. Done carelessly,
        // it produces something that cannot be read back.
        Map<String, String> naive = new LinkedHashMap<>();
        naive.put("f", "0"); naive.put("e", "1"); naive.put("d", "00");
        naive.put("c", "01"); naive.put("b", "10"); naive.put("a", "11");
        System.out.println("shorter codes for commoner symbols, assigned by hand:");
        List<String> shown = new ArrayList<>();
        for (Count c : freq) shown.add(c.symbol() + "=" + naive.get(c.symbol()));
        System.out.println("  " + String.join("  ", shown));
        int cost = 0;
        for (Count c : freq) cost += c.n() * naive.get(c.symbol()).length();
        System.out.println("  that would be " + cost + " bits — but it does not work at all");
        System.out.println();

        String stream = "00";   // f then f, or d — the code cannot say
        System.out.println("the bitstream '" + stream
                + "' is two symbols or one, and nothing says which:");
        for (List<String> reading : List.of(List.of("f", "f"), List.of("d"))) {
            StringBuilder bits = new StringBuilder();
            for (String s : reading) bits.append(naive.get(s));
            System.out.printf("  %-8s encodes to '%s'%n", String.join(" + ", reading), bits);
        }
        System.out.println("  a code is only decodable if no code is a prefix of another —");
        System.out.println("  '0' is a prefix of '00', so the stream is ambiguous");
        System.out.println();

        // A prefix-free code is exactly a code whose symbols are all at leaves.
        Map<String, String> huffman = new LinkedHashMap<>();
        huffman.put("f", "0"); huffman.put("c", "100"); huffman.put("d", "101");
        huffman.put("a", "1100"); huffman.put("b", "1101"); huffman.put("e", "111");
        System.out.println("a prefix-free code for the same frequencies:");
        System.out.printf("  %-7s %6s %6s %5s %7s%n", "symbol", "count", "code", "bits", "total");
        int used = 0;
        for (Count c : freq) {
            String code = huffman.get(c.symbol());
            used += c.n() * code.length();
            System.out.printf("  %-7s %6d %6s %5d %7d%n",
                    c.symbol(), c.n(), code, code.length(), c.n() * code.length());
        }
        System.out.printf("  %-7s %6s %6s %5s %7d%n", "", "", "", "", used);
        System.out.println();

        for (String s : huffman.keySet()) {
            for (String other : huffman.keySet()) {
                if (!s.equals(other) && huffman.get(other).startsWith(huffman.get(s))) {
                    System.out.println("  PREFIX CLASH: " + s + " is a prefix of " + other);
                }
            }
        }
        System.out.println("no code is a prefix of any other, so the stream reads back one way only");
        System.out.println();
        System.out.println(used + " bits against " + total * width + ", a saving of "
                + (100 * (total * width - used) / (total * width)) + "%");
        System.out.println("and the commonest symbol got the shortest code, which is the whole idea.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <cmath>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <utility>
#include <vector>

int main() {
    std::vector<std::pair<std::string, int>> freq = {
        {"a", 5}, {"b", 9}, {"c", 12}, {"d", 13}, {"e", 16}, {"f", 45},
    };
    int total = 0;
    for (const auto& [s, n] : freq) total += n;

    // Six symbols need three bits each if every code is the same length.
    int width = 1;
    while (std::pow(2, width) < static_cast<double>(freq.size())) width += 1;
    std::cout << freq.size() << " symbols, " << total << " of them in the text\\n";
    std::cout << "a fixed-width code needs " << width << " bits each: " << total << " x "
              << width << " = " << total * width << " bits\\n\\n";

    // The obvious improvement: shorter codes for commoner symbols. Done carelessly,
    // it produces something that cannot be read back.
    std::map<std::string, std::string> naive = {
        {"f", "0"}, {"e", "1"}, {"d", "00"}, {"c", "01"}, {"b", "10"}, {"a", "11"},
    };
    std::cout << "shorter codes for commoner symbols, assigned by hand:\\n  ";
    for (std::size_t i = 0; i < freq.size(); i++) {
        std::cout << (i ? "  " : "") << freq[i].first << "=" << naive[freq[i].first];
    }
    std::cout << '\\n';
    int cost = 0;
    for (const auto& [s, n] : freq) cost += n * static_cast<int>(naive[s].size());
    std::cout << "  that would be " << cost << " bits — but it does not work at all\\n\\n";

    const std::string stream = "00";   // f then f, or d — the code cannot say
    std::cout << "the bitstream '" << stream
              << "' is two symbols or one, and nothing says which:\\n";
    for (const std::vector<std::string>& reading : {std::vector<std::string>{"f", "f"},
                                                    std::vector<std::string>{"d"}}) {
        std::string bits, label;
        for (std::size_t i = 0; i < reading.size(); i++) {
            bits += naive[reading[i]];
            label += (i ? " + " : "") + reading[i];
        }
        std::cout << "  " << std::left << std::setw(8) << label << std::right
                  << " encodes to '" << bits << "'\\n";
    }
    std::cout << "  a code is only decodable if no code is a prefix of another —\\n";
    std::cout << "  '0' is a prefix of '00', so the stream is ambiguous\\n\\n";

    // A prefix-free code is exactly a code whose symbols are all at leaves.
    std::map<std::string, std::string> huffman = {
        {"f", "0"}, {"c", "100"}, {"d", "101"}, {"a", "1100"}, {"b", "1101"}, {"e", "111"},
    };
    std::cout << "a prefix-free code for the same frequencies:\\n";
    std::cout << "  " << std::left << std::setw(7) << "symbol" << std::right << ' '
              << std::setw(6) << "count" << ' ' << std::setw(6) << "code" << ' '
              << std::setw(5) << "bits" << ' ' << std::setw(7) << "total" << '\\n';
    int used = 0;
    for (const auto& [s, n] : freq) {
        const std::string& code = huffman[s];
        used += n * static_cast<int>(code.size());
        std::cout << "  " << std::left << std::setw(7) << s << std::right << ' '
                  << std::setw(6) << n << ' ' << std::setw(6) << code << ' '
                  << std::setw(5) << code.size() << ' '
                  << std::setw(7) << n * static_cast<int>(code.size()) << '\\n';
    }
    std::cout << "  " << std::left << std::setw(7) << "" << std::right << ' '
              << std::setw(6) << "" << ' ' << std::setw(6) << "" << ' '
              << std::setw(5) << "" << ' ' << std::setw(7) << used << "\\n\\n";

    for (const auto& [s, code] : huffman) {
        for (const auto& [other, otherCode] : huffman) {
            if (s != other && otherCode.rfind(code, 0) == 0) {
                std::cout << "  PREFIX CLASH: " << s << " is a prefix of " << other << '\\n';
            }
        }
    }
    std::cout << "no code is a prefix of any other, so the stream reads back one way only\\n\\n";
    std::cout << used << " bits against " << total * width << ", a saving of "
              << 100 * (total * width - used) / (total * width) << "%\\n";
    std::cout << "and the commonest symbol got the shortest code, which is the whole idea.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::collections::BTreeMap;

fn main() {
    let freq: Vec<(&str, i32)> = vec![("a", 5), ("b", 9), ("c", 12), ("d", 13), ("e", 16), ("f", 45)];
    let total: i32 = freq.iter().map(|(_, n)| n).sum();

    // Six symbols need three bits each if every code is the same length.
    let mut width = 1u32;
    while 2usize.pow(width) < freq.len() {
        width += 1;
    }
    println!("{} symbols, {} of them in the text", freq.len(), total);
    println!("a fixed-width code needs {} bits each: {} x {} = {} bits",
             width, total, width, total * width as i32);
    println!();

    // The obvious improvement: shorter codes for commoner symbols. Done carelessly,
    // it produces something that cannot be read back.
    let naive: BTreeMap<&str, &str> = [
        ("f", "0"), ("e", "1"), ("d", "00"), ("c", "01"), ("b", "10"), ("a", "11"),
    ].into_iter().collect();
    println!("shorter codes for commoner symbols, assigned by hand:");
    let shown: Vec<String> = freq.iter().map(|(s, _)| format!("{}={}", s, naive[s])).collect();
    println!("  {}", shown.join("  "));
    let cost: i32 = freq.iter().map(|(s, n)| n * naive[s].len() as i32).sum();
    println!("  that would be {} bits — but it does not work at all", cost);
    println!();

    let stream = "00";   // f then f, or d — the code cannot say
    println!("the bitstream '{}' is two symbols or one, and nothing says which:", stream);
    for reading in [vec!["f", "f"], vec!["d"]] {
        let bits: String = reading.iter().map(|s| naive[s]).collect();
        println!("  {:<8} encodes to '{}'", reading.join(" + "), bits);
    }
    println!("  a code is only decodable if no code is a prefix of another —");
    println!("  '0' is a prefix of '00', so the stream is ambiguous");
    println!();

    // A prefix-free code is exactly a code whose symbols are all at leaves.
    let huffman: BTreeMap<&str, &str> = [
        ("f", "0"), ("c", "100"), ("d", "101"), ("a", "1100"), ("b", "1101"), ("e", "111"),
    ].into_iter().collect();
    println!("a prefix-free code for the same frequencies:");
    println!("  {:<7} {:>6} {:>6} {:>5} {:>7}", "symbol", "count", "code", "bits", "total");
    let mut used = 0;
    for (s, n) in &freq {
        let code = huffman[s];
        used += n * code.len() as i32;
        println!("  {:<7} {:>6} {:>6} {:>5} {:>7}", s, n, code, code.len(), n * code.len() as i32);
    }
    println!("  {:<7} {:>6} {:>6} {:>5} {:>7}", "", "", "", "", used);
    println!();

    for (s, code) in &huffman {
        for (other, other_code) in &huffman {
            if s != other && other_code.starts_with(code) {
                println!("  PREFIX CLASH: {} is a prefix of {}", s, other);
            }
        }
    }
    println!("no code is a prefix of any other, so the stream reads back one way only");
    println!();
    println!("{} bits against {}, a saving of {}%",
             used, total * width as i32,
             100 * (total * width as i32 - used) / (total * width as i32));
    println!("and the commonest symbol got the shortest code, which is the whole idea.");
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

type count struct {
	symbol string
	n      int
}

func main() {
	freq := []count{{"a", 5}, {"b", 9}, {"c", 12}, {"d", 13}, {"e", 16}, {"f", 45}}
	total := 0
	for _, c := range freq {
		total += c.n
	}

	// Six symbols need three bits each if every code is the same length.
	width := 1
	for 1<<width < len(freq) {
		width++
	}
	fmt.Printf("%d symbols, %d of them in the text\\n", len(freq), total)
	fmt.Printf("a fixed-width code needs %d bits each: %d x %d = %d bits\\n",
		width, total, width, total*width)
	fmt.Println()

	// The obvious improvement: shorter codes for commoner symbols. Done carelessly,
	// it produces something that cannot be read back.
	naive := map[string]string{"f": "0", "e": "1", "d": "00", "c": "01", "b": "10", "a": "11"}
	fmt.Println("shorter codes for commoner symbols, assigned by hand:")
	shown := make([]string, len(freq))
	for i, c := range freq {
		shown[i] = c.symbol + "=" + naive[c.symbol]
	}
	fmt.Println("  " + strings.Join(shown, "  "))
	cost := 0
	for _, c := range freq {
		cost += c.n * len(naive[c.symbol])
	}
	fmt.Printf("  that would be %d bits — but it does not work at all\\n", cost)
	fmt.Println()

	stream := "00" // f then f, or d — the code cannot say
	fmt.Printf("the bitstream '%s' is two symbols or one, and nothing says which:\\n", stream)
	for _, reading := range [][]string{{"f", "f"}, {"d"}} {
		bits := ""
		for _, s := range reading {
			bits += naive[s]
		}
		fmt.Printf("  %-8s encodes to '%s'\\n", strings.Join(reading, " + "), bits)
	}
	fmt.Println("  a code is only decodable if no code is a prefix of another —")
	fmt.Println("  '0' is a prefix of '00', so the stream is ambiguous")
	fmt.Println()

	// A prefix-free code is exactly a code whose symbols are all at leaves.
	huffman := map[string]string{"f": "0", "c": "100", "d": "101",
		"a": "1100", "b": "1101", "e": "111"}
	fmt.Println("a prefix-free code for the same frequencies:")
	fmt.Printf("  %-7s %6s %6s %5s %7s\\n", "symbol", "count", "code", "bits", "total")
	used := 0
	for _, c := range freq {
		code := huffman[c.symbol]
		used += c.n * len(code)
		fmt.Printf("  %-7s %6d %6s %5d %7d\\n", c.symbol, c.n, code, len(code), c.n*len(code))
	}
	fmt.Printf("  %-7s %6s %6s %5s %7d\\n", "", "", "", "", used)
	fmt.Println()

	// Map order is randomised in Go, so the scan is over sorted keys.
	keys := make([]string, 0, len(huffman))
	for k := range huffman {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, s := range keys {
		for _, other := range keys {
			if s != other && strings.HasPrefix(huffman[other], huffman[s]) {
				fmt.Printf("  PREFIX CLASH: %s is a prefix of %s\\n", s, other)
			}
		}
	}
	fmt.Println("no code is a prefix of any other, so the stream reads back one way only")
	fmt.Println()
	fmt.Printf("%d bits against %d, a saving of %d%%\\n",
		used, total*width, 100*(total*width-used)/(total*width))
	fmt.Println("and the commonest symbol got the shortest code, which is the whole idea.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "build-from-a-heap",
      heading: "The rule: join the two rarest",
      body: [
        "Put every symbol in a min-heap as a one-node tree weighted by its frequency. Then repeat: pop the two lightest, join them under a new node whose weight is their sum, push it back. When one tree remains, that is the code.",
        "The greedy choice is the pop, and what makes it the right one is what a merge costs. A symbol's code is the path from the root to it, so its code length is its depth, and the total cost is the sum of frequency times depth over every symbol. Joining two trees pushes every symbol in both one level deeper — which adds exactly the sum of their weights to the total. Joining the two lightest is therefore the cheapest merge available at that step.",
        "The heap is there for one question, asked n − 1 times: what are the two lightest trees left. That is O(n log n), and the initial heapify is O(n).",
      ],
      examples: [
        {
          id: "build-from-a-heap",
          title: "Pop the two lightest, join, push back",
          lang: "python",
          code: `import heapq

freq = [("a", 5), ("b", 9), ("c", 12), ("d", 13), ("e", 16), ("f", 45)]

# Each node is (weight, id); the tree lives in these two side tables.
label = {i: s for i, (s, _) in enumerate(freq)}
kids = {}
heap = [(n, i) for i, (_, n) in enumerate(freq)]
heapq.heapify(heap)
next_id = len(freq)

print("the pool, as a min-heap ordered by weight:")
print(f"  {', '.join(f'{s}={n}' for s, n in freq)}")
print()
print("repeatedly: pop the two lightest, join them, push the result back")
print(f"  {'step':>4} {'popped':>13} {'new node':>10} {'pool after':>34}")

step = 1
while len(heap) > 1:
    w1, x = heapq.heappop(heap)
    w2, y = heapq.heappop(heap)
    node = next_id
    next_id += 1
    label[node] = "*"
    kids[node] = (x, y)          # left is the lighter of the two
    heapq.heappush(heap, (w1 + w2, node))
    pool = ", ".join(f"{label[i]}{w}" for w, i in sorted(heap))
    print(f"  {step:>4} {f'{label[x]}={w1} + {label[y]}={w2}':>13} {w1 + w2:>10} {pool:>34}")
    step += 1

root = heap[0][1]
print()

# A symbol's code is the path to it: 0 for a left child, 1 for a right one.
codes = {}


def walk(node, prefix):
    if node not in kids:
        codes[label[node]] = prefix or "0"
        return
    left, right = kids[node]
    walk(left, prefix + "0")
    walk(right, prefix + "1")


walk(root, "")
print(f"  {'symbol':<7} {'count':>6} {'code':>6} {'depth':>6}")
bits = 0
for s, n in freq:
    bits += n * len(codes[s])
    print(f"  {s:<7} {n:>6} {codes[s]:>6} {len(codes[s]):>6}")

print()
print(f"total {bits} bits. every symbol is a leaf, so no code is a prefix of another,")
print("and the depth a symbol ends at is exactly the length of its code — which is")
print("why joining the two rarest first is the right move: it pushes the symbols")
print("that matter least the furthest down.")`,
          output: `the pool, as a min-heap ordered by weight:
  a=5, b=9, c=12, d=13, e=16, f=45

repeatedly: pop the two lightest, join them, push the result back
  step        popped   new node                         pool after
     1     a=5 + b=9         14            c12, d13, *14, e16, f45
     2   c=12 + d=13         25                 *14, e16, *25, f45
     3   *=14 + e=16         30                      *25, *30, f45
     4   *=25 + *=30         55                           f45, *55
     5   f=45 + *=55        100                               *100

  symbol   count   code  depth
  a            5   1100      4
  b            9   1101      4
  c           12    100      3
  d           13    101      3
  e           16    111      3
  f           45      0      1

total 224 bits. every symbol is a leaf, so no code is a prefix of another,
and the depth a symbol ends at is exactly the length of its code — which is
why joining the two rarest first is the right move: it pushes the symbols
that matter least the furthest down.`,
          explanation:
            "The whole algorithm is five lines inside a loop, and the heap answers the only question it ever asks: what are the two lightest trees left. Each merge removes two nodes and adds one, so `n` symbols take exactly `n − 1` merges — five here — and each is two pops and a push at O(log n), giving O(n log n) overall. Watch the pool column rather than the tree: `a` and `b`, the two rarest, are joined immediately and are then carried as a single weight-14 node that sinks no further, which is why they end up deepest and longest-coded. `f`, at 45, survives untouched until the final merge and gets a one-bit code.",
          alternates: [
            {
              lang: "javascript",
              code: `const freq = [["a", 5], ["b", 9], ["c", 12], ["d", 13], ["e", 16], ["f", 45]];

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);

// Each node is {w, id}; the tree lives in these two side tables.
const label = new Map(freq.map(([s], i) => [i, s]));
const kids = new Map();
// JavaScript has no built-in heap. A sorted array gives the same answers with
// O(n) inserts instead of O(log n) — fine at six symbols, wrong at a million.
const heap = freq.map(([, n], i) => ({ w: n, id: i })).sort((a, b) => a.w - b.w || a.id - b.id);
let nextId = freq.length;

console.log("the pool, as a min-heap ordered by weight:");
console.log(\`  \${freq.map(([s, n]) => \`\${s}=\${n}\`).join(", ")}\`);
console.log();
console.log("repeatedly: pop the two lightest, join them, push the result back");
console.log(\`  \${padL("step", 4)} \${padL("popped", 13)} \${padL("new node", 10)} \${padL("pool after", 34)}\`);

let step = 1;
while (heap.length > 1) {
  const { w: w1, id: x } = heap.shift();
  const { w: w2, id: y } = heap.shift();
  const node = nextId++;
  label.set(node, "*");
  kids.set(node, [x, y]); // left is the lighter of the two
  heap.push({ w: w1 + w2, id: node });
  heap.sort((a, b) => a.w - b.w || a.id - b.id);
  const pool = heap.map(({ w, id }) => \`\${label.get(id)}\${w}\`).join(", ");
  console.log(\`  \${padL(step, 4)} \${padL(\`\${label.get(x)}=\${w1} + \${label.get(y)}=\${w2}\`, 13)} \${padL(w1 + w2, 10)} \${padL(pool, 34)}\`);
  step += 1;
}

const root = heap[0].id;
console.log();

// A symbol's code is the path to it: 0 for a left child, 1 for a right one.
const codes = new Map();

function walk(node, prefix) {
  if (!kids.has(node)) {
    codes.set(label.get(node), prefix || "0");
    return;
  }
  const [left, right] = kids.get(node);
  walk(left, prefix + "0");
  walk(right, prefix + "1");
}

walk(root, "");
console.log(\`  \${padR("symbol", 7)} \${padL("count", 6)} \${padL("code", 6)} \${padL("depth", 6)}\`);
let bits = 0;
for (const [s, n] of freq) {
  const code = codes.get(s);
  bits += n * code.length;
  console.log(\`  \${padR(s, 7)} \${padL(n, 6)} \${padL(code, 6)} \${padL(code.length, 6)}\`);
}

console.log();
console.log(\`total \${bits} bits. every symbol is a leaf, so no code is a prefix of another,\`);
console.log("and the depth a symbol ends at is exactly the length of its code — which is");
console.log("why joining the two rarest first is the right move: it pushes the symbols");
console.log("that matter least the furthest down.");`,
            },
            {
              lang: "typescript",
              code: `type Count = [string, number];
interface Node {
  w: number;
  id: number;
}

const freq: Count[] = [["a", 5], ["b", 9], ["c", 12], ["d", 13], ["e", 16], ["f", 45]];

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);

// Each node is {w, id}; the tree lives in these two side tables.
const label = new Map<number, string>(freq.map(([s], i) => [i, s]));
const kids = new Map<number, [number, number]>();
// JavaScript has no built-in heap. A sorted array gives the same answers with
// O(n) inserts instead of O(log n) — fine at six symbols, wrong at a million.
const heap: Node[] = freq.map(([, n], i) => ({ w: n, id: i })).sort((a, b) => a.w - b.w || a.id - b.id);
let nextId = freq.length;

console.log("the pool, as a min-heap ordered by weight:");
console.log(\`  \${freq.map(([s, n]) => \`\${s}=\${n}\`).join(", ")}\`);
console.log();
console.log("repeatedly: pop the two lightest, join them, push the result back");
console.log(\`  \${padL("step", 4)} \${padL("popped", 13)} \${padL("new node", 10)} \${padL("pool after", 34)}\`);

let step = 1;
while (heap.length > 1) {
  const { w: w1, id: x } = heap.shift()!;
  const { w: w2, id: y } = heap.shift()!;
  const node = nextId++;
  label.set(node, "*");
  kids.set(node, [x, y]); // left is the lighter of the two
  heap.push({ w: w1 + w2, id: node });
  heap.sort((a, b) => a.w - b.w || a.id - b.id);
  const pool = heap.map(({ w, id }) => \`\${label.get(id)}\${w}\`).join(", ");
  console.log(\`  \${padL(step, 4)} \${padL(\`\${label.get(x)}=\${w1} + \${label.get(y)}=\${w2}\`, 13)} \${padL(w1 + w2, 10)} \${padL(pool, 34)}\`);
  step += 1;
}

const root = heap[0].id;
console.log();

// A symbol's code is the path to it: 0 for a left child, 1 for a right one.
const codes = new Map<string, string>();

function walk(node: number, prefix: string): void {
  if (!kids.has(node)) {
    codes.set(label.get(node)!, prefix || "0");
    return;
  }
  const [left, right] = kids.get(node)!;
  walk(left, prefix + "0");
  walk(right, prefix + "1");
}

walk(root, "");
console.log(\`  \${padR("symbol", 7)} \${padL("count", 6)} \${padL("code", 6)} \${padL("depth", 6)}\`);
let bits = 0;
for (const [s, n] of freq) {
  const code = codes.get(s)!;
  bits += n * code.length;
  console.log(\`  \${padR(s, 7)} \${padL(n, 6)} \${padL(code, 6)} \${padL(code.length, 6)}\`);
}

console.log();
console.log(\`total \${bits} bits. every symbol is a leaf, so no code is a prefix of another,\`);
console.log("and the depth a symbol ends at is exactly the length of its code — which is");
console.log("why joining the two rarest first is the right move: it pushes the symbols");
console.log("that matter least the furthest down.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

public class Main {
    record Node(int weight, int id) {}

    static final Map<Integer, String> LABEL = new HashMap<>();
    static final Map<Integer, int[]> KIDS = new HashMap<>();
    static final Map<String, String> CODES = new HashMap<>();

    // A symbol's code is the path to it: 0 for a left child, 1 for a right one.
    static void walk(int node, String prefix) {
        if (!KIDS.containsKey(node)) {
            CODES.put(LABEL.get(node), prefix.isEmpty() ? "0" : prefix);
            return;
        }
        int[] pair = KIDS.get(node);
        walk(pair[0], prefix + "0");
        walk(pair[1], prefix + "1");
    }

    public static void main(String[] args) {
        String[] symbols = {"a", "b", "c", "d", "e", "f"};
        int[] counts = {5, 9, 12, 13, 16, 45};

        // Each node is (weight, id); the tree lives in these two side tables.
        PriorityQueue<Node> heap = new PriorityQueue<>(
                Comparator.comparingInt(Node::weight).thenComparingInt(Node::id));
        List<String> shown = new ArrayList<>();
        for (int i = 0; i < symbols.length; i++) {
            LABEL.put(i, symbols[i]);
            heap.add(new Node(counts[i], i));
            shown.add(symbols[i] + "=" + counts[i]);
        }
        int nextId = symbols.length;

        System.out.println("the pool, as a min-heap ordered by weight:");
        System.out.println("  " + String.join(", ", shown));
        System.out.println();
        System.out.println("repeatedly: pop the two lightest, join them, push the result back");
        System.out.printf("  %4s %13s %10s %34s%n", "step", "popped", "new node", "pool after");

        int step = 1;
        while (heap.size() > 1) {
            Node first = heap.poll();
            Node second = heap.poll();
            int node = nextId++;
            LABEL.put(node, "*");
            KIDS.put(node, new int[] {first.id(), second.id()});   // left is the lighter
            heap.add(new Node(first.weight() + second.weight(), node));

            List<Node> ordered = new ArrayList<>(heap);
            ordered.sort(Comparator.comparingInt(Node::weight).thenComparingInt(Node::id));
            List<String> pool = new ArrayList<>();
            for (Node n : ordered) pool.add(LABEL.get(n.id()) + n.weight());
            System.out.printf("  %4d %13s %10d %34s%n", step,
                    LABEL.get(first.id()) + "=" + first.weight() + " + "
                            + LABEL.get(second.id()) + "=" + second.weight(),
                    first.weight() + second.weight(), String.join(", ", pool));
            step += 1;
        }

        int root = heap.peek().id();
        System.out.println();

        walk(root, "");
        System.out.printf("  %-7s %6s %6s %6s%n", "symbol", "count", "code", "depth");
        int bits = 0;
        for (int i = 0; i < symbols.length; i++) {
            String code = CODES.get(symbols[i]);
            bits += counts[i] * code.length();
            System.out.printf("  %-7s %6d %6s %6d%n", symbols[i], counts[i], code, code.length());
        }

        System.out.println();
        System.out.println("total " + bits
                + " bits. every symbol is a leaf, so no code is a prefix of another,");
        System.out.println("and the depth a symbol ends at is exactly the length of its code — which is");
        System.out.println("why joining the two rarest first is the right move: it pushes the symbols");
        System.out.println("that matter least the furthest down.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iomanip>
#include <iostream>
#include <map>
#include <queue>
#include <string>
#include <utility>
#include <vector>

std::map<int, std::string> label;
std::map<int, std::pair<int, int>> kids;
std::map<std::string, std::string> codes;

// A symbol's code is the path to it: 0 for a left child, 1 for a right one.
void walk(int node, const std::string& prefix) {
    if (!kids.count(node)) {
        codes[label[node]] = prefix.empty() ? "0" : prefix;
        return;
    }
    walk(kids[node].first, prefix + "0");
    walk(kids[node].second, prefix + "1");
}

int main() {
    const std::vector<std::string> symbols = {"a", "b", "c", "d", "e", "f"};
    const std::vector<int> counts = {5, 9, 12, 13, 16, 45};

    // Each node is (weight, id); the tree lives in these two side tables.
    using Node = std::pair<int, int>;
    std::priority_queue<Node, std::vector<Node>, std::greater<Node>> heap;
    std::string shown;
    for (std::size_t i = 0; i < symbols.size(); i++) {
        label[static_cast<int>(i)] = symbols[i];
        heap.push({counts[i], static_cast<int>(i)});
        shown += (i ? ", " : "") + symbols[i] + "=" + std::to_string(counts[i]);
    }
    int nextId = static_cast<int>(symbols.size());

    std::cout << "the pool, as a min-heap ordered by weight:\\n  " << shown << "\\n\\n";
    std::cout << "repeatedly: pop the two lightest, join them, push the result back\\n";
    std::cout << "  " << std::setw(4) << "step" << ' ' << std::setw(13) << "popped" << ' '
              << std::setw(10) << "new node" << ' ' << std::setw(34) << "pool after" << '\\n';

    int step = 1;
    while (heap.size() > 1) {
        auto [w1, x] = heap.top(); heap.pop();
        auto [w2, y] = heap.top(); heap.pop();
        int node = nextId++;
        label[node] = "*";
        kids[node] = {x, y};                       // left is the lighter of the two
        heap.push({w1 + w2, node});

        std::vector<Node> ordered;
        auto copy = heap;
        while (!copy.empty()) { ordered.push_back(copy.top()); copy.pop(); }
        std::sort(ordered.begin(), ordered.end());
        std::string pool;
        for (std::size_t i = 0; i < ordered.size(); i++) {
            pool += (i ? ", " : "") + label[ordered[i].second] + std::to_string(ordered[i].first);
        }
        std::cout << "  " << std::setw(4) << step << ' ' << std::setw(13)
                  << (label[x] + "=" + std::to_string(w1) + " + " + label[y] + "=" + std::to_string(w2))
                  << ' ' << std::setw(10) << w1 + w2 << ' ' << std::setw(34) << pool << '\\n';
        step += 1;
    }

    int root = heap.top().second;
    std::cout << '\\n';

    walk(root, "");
    std::cout << "  " << std::left << std::setw(7) << "symbol" << std::right << ' '
              << std::setw(6) << "count" << ' ' << std::setw(6) << "code" << ' '
              << std::setw(6) << "depth" << '\\n';
    int bits = 0;
    for (std::size_t i = 0; i < symbols.size(); i++) {
        const std::string& code = codes[symbols[i]];
        bits += counts[i] * static_cast<int>(code.size());
        std::cout << "  " << std::left << std::setw(7) << symbols[i] << std::right << ' '
                  << std::setw(6) << counts[i] << ' ' << std::setw(6) << code << ' '
                  << std::setw(6) << code.size() << '\\n';
    }

    std::cout << "\\ntotal " << bits
              << " bits. every symbol is a leaf, so no code is a prefix of another,\\n";
    std::cout << "and the depth a symbol ends at is exactly the length of its code — which is\\n";
    std::cout << "why joining the two rarest first is the right move: it pushes the symbols\\n";
    std::cout << "that matter least the furthest down.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::cmp::Reverse;
use std::collections::{BinaryHeap, HashMap};

// A symbol's code is the path to it: 0 for a left child, 1 for a right one.
fn walk(
    node: usize,
    prefix: &str,
    label: &HashMap<usize, String>,
    kids: &HashMap<usize, (usize, usize)>,
    codes: &mut HashMap<String, String>,
) {
    match kids.get(&node) {
        None => {
            let code = if prefix.is_empty() { "0".to_string() } else { prefix.to_string() };
            codes.insert(label[&node].clone(), code);
        }
        Some(&(left, right)) => {
            walk(left, &format!("{}0", prefix), label, kids, codes);
            walk(right, &format!("{}1", prefix), label, kids, codes);
        }
    }
}

fn main() {
    let symbols = ["a", "b", "c", "d", "e", "f"];
    let counts = [5, 9, 12, 13, 16, 45];

    // Each node is (weight, id); the tree lives in these two side tables.
    let mut label: HashMap<usize, String> = HashMap::new();
    let mut kids: HashMap<usize, (usize, usize)> = HashMap::new();
    let mut heap: BinaryHeap<Reverse<(i32, usize)>> = BinaryHeap::new();
    let mut shown: Vec<String> = Vec::new();
    for (i, sym) in symbols.iter().enumerate() {
        label.insert(i, sym.to_string());
        heap.push(Reverse((counts[i], i)));
        shown.push(format!("{}={}", sym, counts[i]));
    }
    let mut next_id = symbols.len();

    println!("the pool, as a min-heap ordered by weight:");
    println!("  {}", shown.join(", "));
    println!();
    println!("repeatedly: pop the two lightest, join them, push the result back");
    println!("  {:>4} {:>13} {:>10} {:>34}", "step", "popped", "new node", "pool after");

    let mut step = 1;
    while heap.len() > 1 {
        let Reverse((w1, x)) = heap.pop().unwrap();
        let Reverse((w2, y)) = heap.pop().unwrap();
        let node = next_id;
        next_id += 1;
        label.insert(node, "*".to_string());
        kids.insert(node, (x, y)); // left is the lighter of the two
        heap.push(Reverse((w1 + w2, node)));

        let mut ordered: Vec<(i32, usize)> = heap.iter().map(|Reverse(v)| *v).collect();
        ordered.sort();
        let pool: Vec<String> = ordered.iter().map(|(w, i)| format!("{}{}", label[i], w)).collect();
        println!("  {:>4} {:>13} {:>10} {:>34}", step,
                 format!("{}={} + {}={}", label[&x], w1, label[&y], w2),
                 w1 + w2, pool.join(", "));
        step += 1;
    }

    let root = heap.peek().unwrap().0.1;
    println!();

    let mut codes: HashMap<String, String> = HashMap::new();
    walk(root, "", &label, &kids, &mut codes);
    println!("  {:<7} {:>6} {:>6} {:>6}", "symbol", "count", "code", "depth");
    let mut bits = 0;
    for (i, sym) in symbols.iter().enumerate() {
        let code = &codes[*sym];
        bits += counts[i] * code.len() as i32;
        println!("  {:<7} {:>6} {:>6} {:>6}", sym, counts[i], code, code.len());
    }

    println!();
    println!("total {} bits. every symbol is a leaf, so no code is a prefix of another,", bits);
    println!("and the depth a symbol ends at is exactly the length of its code — which is");
    println!("why joining the two rarest first is the right move: it pushes the symbols");
    println!("that matter least the furthest down.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"container/heap"
	"fmt"
	"sort"
	"strings"
)

type node struct {
	weight, id int
}

// nodeHeap is the min-heap container/heap drives; ties break on id so the
// order is the same every run.
type nodeHeap []node

func (h nodeHeap) Len() int { return len(h) }
func (h nodeHeap) Less(i, j int) bool {
	if h[i].weight != h[j].weight {
		return h[i].weight < h[j].weight
	}
	return h[i].id < h[j].id
}
func (h nodeHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *nodeHeap) Push(x interface{}) { *h = append(*h, x.(node)) }
func (h *nodeHeap) Pop() interface{} {
	old := *h
	n := len(old)
	item := old[n-1]
	*h = old[:n-1]
	return item
}

var (
	label = map[int]string{}
	kids  = map[int][2]int{}
	codes = map[string]string{}
)

// walk gives a symbol its code: 0 for a left child, 1 for a right one.
func walk(n int, prefix string) {
	pair, internal := kids[n]
	if !internal {
		code := prefix
		if code == "" {
			code = "0"
		}
		codes[label[n]] = code
		return
	}
	walk(pair[0], prefix+"0")
	walk(pair[1], prefix+"1")
}

func main() {
	symbols := []string{"a", "b", "c", "d", "e", "f"}
	counts := []int{5, 9, 12, 13, 16, 45}

	// Each node is (weight, id); the tree lives in these two side tables.
	h := &nodeHeap{}
	heap.Init(h)
	shown := make([]string, len(symbols))
	for i, s := range symbols {
		label[i] = s
		heap.Push(h, node{counts[i], i})
		shown[i] = fmt.Sprintf("%s=%d", s, counts[i])
	}
	nextID := len(symbols)

	fmt.Println("the pool, as a min-heap ordered by weight:")
	fmt.Println("  " + strings.Join(shown, ", "))
	fmt.Println()
	fmt.Println("repeatedly: pop the two lightest, join them, push the result back")
	fmt.Printf("  %4s %13s %10s %34s\\n", "step", "popped", "new node", "pool after")

	step := 1
	for h.Len() > 1 {
		first := heap.Pop(h).(node)
		second := heap.Pop(h).(node)
		id := nextID
		nextID++
		label[id] = "*"
		kids[id] = [2]int{first.id, second.id} // left is the lighter of the two
		heap.Push(h, node{first.weight + second.weight, id})

		ordered := append(nodeHeap(nil), *h...)
		sort.Sort(ordered)
		pool := make([]string, len(ordered))
		for i, n := range ordered {
			pool[i] = fmt.Sprintf("%s%d", label[n.id], n.weight)
		}
		fmt.Printf("  %4d %13s %10d %34s\\n", step,
			fmt.Sprintf("%s=%d + %s=%d", label[first.id], first.weight, label[second.id], second.weight),
			first.weight+second.weight, strings.Join(pool, ", "))
		step++
	}

	root := (*h)[0].id
	fmt.Println()

	walk(root, "")
	fmt.Printf("  %-7s %6s %6s %6s\\n", "symbol", "count", "code", "depth")
	bits := 0
	for i, s := range symbols {
		code := codes[s]
		bits += counts[i] * len(code)
		fmt.Printf("  %-7s %6d %6s %6d\\n", s, counts[i], code, len(code))
	}

	fmt.Println()
	fmt.Printf("total %d bits. every symbol is a leaf, so no code is a prefix of another,\\n", bits)
	fmt.Println("and the depth a symbol ends at is exactly the length of its code — which is")
	fmt.Println("why joining the two rarest first is the right move: it pushes the symbols")
	fmt.Println("that matter least the furthest down.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "decode-and-why",
      heading: "Reading it back, and why the rule is right",
      body: [
        "Decoding is where the prefix property pays. Walk down from the root taking the left branch on a 0 and the right on a 1; the moment you reach a leaf, emit that symbol and go back to the root. There is no lookahead and no backtracking, and the cost is one step per bit.",
        "For correctness, the exchange argument runs as it did in lesson 2. In any optimal tree the two deepest leaves are siblings — if one had no sibling it could be moved up, making the tree cheaper, so an optimal tree has none of those. Swap the two rarest symbols into those two deepest positions: the swap moves rarer symbols down and commoner ones up, so the total cannot increase. Therefore some optimal tree has the two rarest as sibling leaves at the greatest depth, which is exactly what joining them first produces.",
        "The example below checks the consequence directly. Fix the code lengths the tree produced and try every way of handing them to the six symbols: Huffman's assignment is the cheapest of all 720, and the worst assignment of the same lengths costs more than half again as much.",
      ],
      examples: [
        {
          id: "decode-and-why-deepest",
          title: "Reading it back, and why the rarest belong deepest",
          lang: "python",
          code: `from itertools import permutations

freq = [("a", 5), ("b", 9), ("c", 12), ("d", 13), ("e", 16), ("f", 45)]
codes = {"f": "0", "c": "100", "d": "101", "a": "1100", "b": "1101", "e": "111"}

# Decoding needs no separators and no lookahead: walk the bits, and the moment
# what you have read is a code, it can only be that symbol.
message = "faced"
stream = "".join(codes[c] for c in message)
print(f"encoding {message!r}: {stream}  ({len(stream)} bits)")

by_code = {v: k for k, v in codes.items()}
out, buffer = [], ""
print()
print("decoding, one bit at a time:")
for bit in stream:
    buffer += bit
    if buffer in by_code:
        print(f"  {buffer:<5} -> {by_code[buffer]}")
        out.append(by_code[buffer])
        buffer = ""
print(f"decoded: {''.join(out)!r}  ({'matches' if ''.join(out) == message else 'DIFFERS'})")
print()

# Why the rarest symbols belong deepest, checked over every alternative.
depths = sorted(len(codes[s]) for s, _ in freq)
print(f"the tree fixes a multiset of code lengths: {depths}")
print("those lengths can be handed to the six symbols in 720 ways. cost is")
print("sum(count x length), so the question is which pairing is cheapest.")
print()

results = []
for perm in permutations(depths):
    cost = sum(n * d for (_, n), d in zip(freq, perm))
    results.append((cost, perm))
results.sort()

huffman_cost = sum(n * len(codes[s]) for s, n in freq)
print(f"  {'pairing':<34} {'cost':>5}")
best_cost, best_perm = results[0]
worst_cost, worst_perm = results[-1]
for tag, (cost, perm) in [("cheapest", results[0]), ("dearest", results[-1])]:
    shown = " ".join(f"{s}:{d}" for (s, _), d in zip(freq, perm))
    print(f"  {shown:<34} {cost:>5}  {tag}")
print(f"  {'what Huffman built':<34} {huffman_cost:>5}")
print()
print(f"Huffman's assignment is the cheapest of all {len(results)}: "
      f"{'yes' if huffman_cost == best_cost else 'NO'}")
print(f"the worst pairing of the same lengths costs {worst_cost}, "
      f"{worst_cost - best_cost} more")
print()
print("that is the greedy choice property for Huffman, stated concretely: given")
print("the shape of the tree, the cheapest way to fill it gives the shortest")
print("code to the commonest symbol — so joining the two rarest, which is what")
print("sends them deepest, never blocks an optimal answer.")`,
          output: `encoding 'faced': 01100100111101  (14 bits)

decoding, one bit at a time:
  0     -> f
  1100  -> a
  100   -> c
  111   -> e
  101   -> d
decoded: 'faced'  (matches)

the tree fixes a multiset of code lengths: [1, 3, 3, 3, 4, 4]
those lengths can be handed to the six symbols in 720 ways. cost is
sum(count x length), so the question is which pairing is cheapest.

  pairing                             cost
  a:4 b:4 c:3 d:3 e:3 f:1              224  cheapest
  a:1 b:3 c:3 d:3 e:4 f:4              351  dearest
  what Huffman built                   224

Huffman's assignment is the cheapest of all 720: yes
the worst pairing of the same lengths costs 351, 127 more

that is the greedy choice property for Huffman, stated concretely: given
the shape of the tree, the cheapest way to fill it gives the shortest
code to the commonest symbol — so joining the two rarest, which is what
sends them deepest, never blocks an optimal answer.`,
          explanation:
            "Decoding is the payoff for the prefix property: read bits until what you hold is a code, emit, reset. No separators, no lookahead, no backtracking. The second half turns the greedy choice property into something checkable. Fix the multiset of code lengths the tree produced, hand those lengths to the six symbols in all 720 ways, and Huffman's pairing is the cheapest of them — while the worst pairing of the *same* lengths costs 351. That is what \"join the two rarest\" buys: given any tree shape, the cheapest way to fill it puts the shortest code on the commonest symbol, so sending the rarest deepest never blocks an optimal answer.",
          alternates: [
            {
              lang: "javascript",
              code: `const freq = [["a", 5], ["b", 9], ["c", 12], ["d", 13], ["e", 16], ["f", 45]];
const codes = { f: "0", c: "100", d: "101", a: "1100", b: "1101", e: "111" };

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);

// Decoding needs no separators and no lookahead: walk the bits, and the moment
// what you have read is a code, it can only be that symbol.
const message = "faced";
const stream = [...message].map((c) => codes[c]).join("");
console.log(\`encoding '\${message}': \${stream}  (\${stream.length} bits)\`);

const byCode = new Map(Object.entries(codes).map(([k, v]) => [v, k]));
const out = [];
let buffer = "";
console.log();
console.log("decoding, one bit at a time:");
for (const bit of stream) {
  buffer += bit;
  if (byCode.has(buffer)) {
    console.log(\`  \${padR(buffer, 5)} -> \${byCode.get(buffer)}\`);
    out.push(byCode.get(buffer));
    buffer = "";
  }
}
console.log(\`decoded: '\${out.join("")}'  (\${out.join("") === message ? "matches" : "DIFFERS"})\`);
console.log();

// Why the rarest symbols belong deepest, checked over every alternative.
const depths = freq.map(([s]) => codes[s].length).sort((a, b) => a - b);
console.log(\`the tree fixes a multiset of code lengths: [\${depths.join(", ")}]\`);
console.log("those lengths can be handed to the six symbols in 720 ways. cost is");
console.log("sum(count x length), so the question is which pairing is cheapest.");
console.log();

/** Every permutation of the positions, so repeated lengths still count separately. */
function permutations(n) {
  const idx = Array.from({ length: n }, (_, i) => i);
  const all = [idx.slice()];
  for (;;) {
    let i = n - 2;
    while (i >= 0 && idx[i] >= idx[i + 1]) i -= 1;
    if (i < 0) return all;
    let j = n - 1;
    while (idx[j] <= idx[i]) j -= 1;
    [idx[i], idx[j]] = [idx[j], idx[i]];
    for (let lo = i + 1, hi = n - 1; lo < hi; lo++, hi--) {
      [idx[lo], idx[hi]] = [idx[hi], idx[lo]];
    }
    all.push(idx.slice());
  }
}

const results = permutations(depths.length).map((perm) => {
  const lengths = perm.map((p) => depths[p]);
  const cost = freq.reduce((acc, [, n], i) => acc + n * lengths[i], 0);
  return { cost, lengths };
});
// Ties are broken on the lengths themselves, so the pick is the same every run.
const key = (r) => [r.cost, ...r.lengths];
const cmp = (a, b) => {
  const ka = key(a);
  const kb = key(b);
  for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
  return 0;
};
results.sort(cmp);

const huffmanCost = freq.reduce((acc, [s, n]) => acc + n * codes[s].length, 0);
console.log(\`  \${padR("pairing", 34)} \${padL("cost", 5)}\`);
const best = results[0];
const worst = results[results.length - 1];
for (const [tag, r] of [["cheapest", best], ["dearest", worst]]) {
  const shown = freq.map(([s], i) => \`\${s}:\${r.lengths[i]}\`).join(" ");
  console.log(\`  \${padR(shown, 34)} \${padL(r.cost, 5)}  \${tag}\`);
}
console.log(\`  \${padR("what Huffman built", 34)} \${padL(huffmanCost, 5)}\`);
console.log();
console.log(\`Huffman's assignment is the cheapest of all \${results.length}: \`
  + \`\${huffmanCost === best.cost ? "yes" : "NO"}\`);
console.log(\`the worst pairing of the same lengths costs \${worst.cost}, \`
  + \`\${worst.cost - best.cost} more\`);
console.log();
console.log("that is the greedy choice property for Huffman, stated concretely: given");
console.log("the shape of the tree, the cheapest way to fill it gives the shortest");
console.log("code to the commonest symbol — so joining the two rarest, which is what");
console.log("sends them deepest, never blocks an optimal answer.");`,
            },
            {
              lang: "typescript",
              code: `type Count = [string, number];
interface Pairing {
  cost: number;
  lengths: number[];
}

const freq: Count[] = [["a", 5], ["b", 9], ["c", 12], ["d", 13], ["e", 16], ["f", 45]];
const codes: Record<string, string> = { f: "0", c: "100", d: "101", a: "1100", b: "1101", e: "111" };

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);

// Decoding needs no separators and no lookahead: walk the bits, and the moment
// what you have read is a code, it can only be that symbol.
const message = "faced";
const stream = [...message].map((c) => codes[c]).join("");
console.log(\`encoding '\${message}': \${stream}  (\${stream.length} bits)\`);

const byCode = new Map(Object.entries(codes).map(([k, v]) => [v, k]));
const out: string[] = [];
let buffer = "";
console.log();
console.log("decoding, one bit at a time:");
for (const bit of stream) {
  buffer += bit;
  if (byCode.has(buffer)) {
    console.log(\`  \${padR(buffer, 5)} -> \${byCode.get(buffer)}\`);
    out.push(byCode.get(buffer)!);
    buffer = "";
  }
}
console.log(\`decoded: '\${out.join("")}'  (\${out.join("") === message ? "matches" : "DIFFERS"})\`);
console.log();

// Why the rarest symbols belong deepest, checked over every alternative.
const depths = freq.map(([s]) => codes[s].length).sort((a, b) => a - b);
console.log(\`the tree fixes a multiset of code lengths: [\${depths.join(", ")}]\`);
console.log("those lengths can be handed to the six symbols in 720 ways. cost is");
console.log("sum(count x length), so the question is which pairing is cheapest.");
console.log();

/** Every permutation of the positions, so repeated lengths still count separately. */
function permutations(n: number): number[][] {
  const idx = Array.from({ length: n }, (_, i) => i);
  const all = [idx.slice()];
  for (;;) {
    let i = n - 2;
    while (i >= 0 && idx[i] >= idx[i + 1]) i -= 1;
    if (i < 0) return all;
    let j = n - 1;
    while (idx[j] <= idx[i]) j -= 1;
    [idx[i], idx[j]] = [idx[j], idx[i]];
    for (let lo = i + 1, hi = n - 1; lo < hi; lo++, hi--) {
      [idx[lo], idx[hi]] = [idx[hi], idx[lo]];
    }
    all.push(idx.slice());
  }
}

const results = permutations(depths.length).map((perm) => {
  const lengths = perm.map((p) => depths[p]);
  const cost = freq.reduce((acc, [, n], i) => acc + n * lengths[i], 0);
  return { cost, lengths };
});
// Ties are broken on the lengths themselves, so the pick is the same every run.
const key = (r: Pairing): number[] => [r.cost, ...r.lengths];
const cmp = (a: Pairing, b: Pairing): number => {
  const ka = key(a);
  const kb = key(b);
  for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
  return 0;
};
results.sort(cmp);

const huffmanCost = freq.reduce((acc, [s, n]) => acc + n * codes[s].length, 0);
console.log(\`  \${padR("pairing", 34)} \${padL("cost", 5)}\`);
const best = results[0];
const worst = results[results.length - 1];
for (const [tag, r] of [["cheapest", best], ["dearest", worst]] as [string, Pairing][]) {
  const shown = freq.map(([s], i) => \`\${s}:\${r.lengths[i]}\`).join(" ");
  console.log(\`  \${padR(shown, 34)} \${padL(r.cost, 5)}  \${tag}\`);
}
console.log(\`  \${padR("what Huffman built", 34)} \${padL(huffmanCost, 5)}\`);
console.log();
console.log(\`Huffman's assignment is the cheapest of all \${results.length}: \`
  + \`\${huffmanCost === best.cost ? "yes" : "NO"}\`);
console.log(\`the worst pairing of the same lengths costs \${worst.cost}, \`
  + \`\${worst.cost - best.cost} more\`);
console.log();
console.log("that is the greedy choice property for Huffman, stated concretely: given");
console.log("the shape of the tree, the cheapest way to fill it gives the shortest");
console.log("code to the commonest symbol — so joining the two rarest, which is what");
console.log("sends them deepest, never blocks an optimal answer.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {
    record Pairing(int cost, int[] lengths) {}

    /** Every permutation of the positions, so repeated lengths still count separately. */
    static List<int[]> permutations(int n) {
        int[] idx = new int[n];
        for (int i = 0; i < n; i++) idx[i] = i;
        List<int[]> all = new ArrayList<>();
        all.add(idx.clone());
        while (true) {
            int i = n - 2;
            while (i >= 0 && idx[i] >= idx[i + 1]) i -= 1;
            if (i < 0) return all;
            int j = n - 1;
            while (idx[j] <= idx[i]) j -= 1;
            int t = idx[i]; idx[i] = idx[j]; idx[j] = t;
            for (int lo = i + 1, hi = n - 1; lo < hi; lo++, hi--) {
                t = idx[lo]; idx[lo] = idx[hi]; idx[hi] = t;
            }
            all.add(idx.clone());
        }
    }

    public static void main(String[] args) {
        String[] symbols = {"a", "b", "c", "d", "e", "f"};
        int[] counts = {5, 9, 12, 13, 16, 45};
        Map<String, String> codes = new HashMap<>(Map.of(
                "f", "0", "c", "100", "d", "101", "a", "1100", "b", "1101", "e", "111"));

        // Decoding needs no separators and no lookahead: walk the bits, and the moment
        // what you have read is a code, it can only be that symbol.
        String message = "faced";
        StringBuilder stream = new StringBuilder();
        for (char c : message.toCharArray()) stream.append(codes.get(String.valueOf(c)));
        System.out.println("encoding '" + message + "': " + stream
                + "  (" + stream.length() + " bits)");

        Map<String, String> byCode = new HashMap<>();
        for (Map.Entry<String, String> e : codes.entrySet()) byCode.put(e.getValue(), e.getKey());
        StringBuilder out = new StringBuilder();
        String buffer = "";
        System.out.println();
        System.out.println("decoding, one bit at a time:");
        for (char bit : stream.toString().toCharArray()) {
            buffer += bit;
            if (byCode.containsKey(buffer)) {
                System.out.printf("  %-5s -> %s%n", buffer, byCode.get(buffer));
                out.append(byCode.get(buffer));
                buffer = "";
            }
        }
        System.out.println("decoded: '" + out + "'  ("
                + (out.toString().equals(message) ? "matches" : "DIFFERS") + ")");
        System.out.println();

        // Why the rarest symbols belong deepest, checked over every alternative.
        int[] depths = new int[symbols.length];
        for (int i = 0; i < symbols.length; i++) depths[i] = codes.get(symbols[i]).length();
        Arrays.sort(depths);
        List<String> shownDepths = new ArrayList<>();
        for (int d : depths) shownDepths.add(String.valueOf(d));
        System.out.println("the tree fixes a multiset of code lengths: ["
                + String.join(", ", shownDepths) + "]");
        System.out.println("those lengths can be handed to the six symbols in 720 ways. cost is");
        System.out.println("sum(count x length), so the question is which pairing is cheapest.");
        System.out.println();

        List<Pairing> results = new ArrayList<>();
        for (int[] perm : permutations(depths.length)) {
            int[] lengths = new int[perm.length];
            int cost = 0;
            for (int i = 0; i < perm.length; i++) {
                lengths[i] = depths[perm[i]];
                cost += counts[i] * lengths[i];
            }
            results.add(new Pairing(cost, lengths));
        }
        // Ties are broken on the lengths themselves, so the pick is the same every run.
        results.sort((a, b) -> {
            if (a.cost() != b.cost()) return Integer.compare(a.cost(), b.cost());
            for (int i = 0; i < a.lengths().length; i++) {
                if (a.lengths()[i] != b.lengths()[i]) {
                    return Integer.compare(a.lengths()[i], b.lengths()[i]);
                }
            }
            return 0;
        });

        int huffmanCost = 0;
        for (int i = 0; i < symbols.length; i++) {
            huffmanCost += counts[i] * codes.get(symbols[i]).length();
        }
        System.out.printf("  %-34s %5s%n", "pairing", "cost");
        Pairing best = results.get(0);
        Pairing worst = results.get(results.size() - 1);
        String[] tags = {"cheapest", "dearest"};
        Pairing[] picks = {best, worst};
        for (int k = 0; k < 2; k++) {
            List<String> parts = new ArrayList<>();
            for (int i = 0; i < symbols.length; i++) {
                parts.add(symbols[i] + ":" + picks[k].lengths()[i]);
            }
            System.out.printf("  %-34s %5d  %s%n",
                    String.join(" ", parts), picks[k].cost(), tags[k]);
        }
        System.out.printf("  %-34s %5d%n", "what Huffman built", huffmanCost);
        System.out.println();
        System.out.println("Huffman's assignment is the cheapest of all " + results.size() + ": "
                + (huffmanCost == best.cost() ? "yes" : "NO"));
        System.out.println("the worst pairing of the same lengths costs " + worst.cost() + ", "
                + (worst.cost() - best.cost()) + " more");
        System.out.println();
        System.out.println("that is the greedy choice property for Huffman, stated concretely: given");
        System.out.println("the shape of the tree, the cheapest way to fill it gives the shortest");
        System.out.println("code to the commonest symbol — so joining the two rarest, which is what");
        System.out.println("sends them deepest, never blocks an optimal answer.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

struct Pairing {
    int cost;
    std::vector<int> lengths;
};

int main() {
    const std::vector<std::string> symbols = {"a", "b", "c", "d", "e", "f"};
    const std::vector<int> counts = {5, 9, 12, 13, 16, 45};
    std::map<std::string, std::string> codes = {
        {"f", "0"}, {"c", "100"}, {"d", "101"}, {"a", "1100"}, {"b", "1101"}, {"e", "111"},
    };

    // Decoding needs no separators and no lookahead: walk the bits, and the moment
    // what you have read is a code, it can only be that symbol.
    const std::string message = "faced";
    std::string stream;
    for (char c : message) stream += codes[std::string(1, c)];
    std::cout << "encoding '" << message << "': " << stream
              << "  (" << stream.size() << " bits)\\n";

    std::map<std::string, std::string> byCode;
    for (const auto& [k, v] : codes) byCode[v] = k;
    std::string out, buffer;
    std::cout << "\\ndecoding, one bit at a time:\\n";
    for (char bit : stream) {
        buffer += bit;
        if (byCode.count(buffer)) {
            std::cout << "  " << std::left << std::setw(5) << buffer << std::right
                      << " -> " << byCode[buffer] << '\\n';
            out += byCode[buffer];
            buffer.clear();
        }
    }
    std::cout << "decoded: '" << out << "'  ("
              << (out == message ? "matches" : "DIFFERS") << ")\\n\\n";

    // Why the rarest symbols belong deepest, checked over every alternative.
    std::vector<int> depths;
    for (const std::string& s : symbols) depths.push_back(static_cast<int>(codes[s].size()));
    std::sort(depths.begin(), depths.end());
    std::cout << "the tree fixes a multiset of code lengths: [";
    for (std::size_t i = 0; i < depths.size(); i++) {
        std::cout << (i ? ", " : "") << depths[i];
    }
    std::cout << "]\\n";
    std::cout << "those lengths can be handed to the six symbols in 720 ways. cost is\\n";
    std::cout << "sum(count x length), so the question is which pairing is cheapest.\\n\\n";

    // Permuting the positions, not the values: next_permutation over a vector with
    // repeats would yield the 60 distinct orderings rather than all 720.
    std::vector<int> idx(depths.size());
    for (std::size_t i = 0; i < idx.size(); i++) idx[i] = static_cast<int>(i);
    std::vector<Pairing> results;
    do {
        std::vector<int> lengths(idx.size());
        int cost = 0;
        for (std::size_t i = 0; i < idx.size(); i++) {
            lengths[i] = depths[static_cast<std::size_t>(idx[i])];
            cost += counts[i] * lengths[i];
        }
        results.push_back({cost, lengths});
    } while (std::next_permutation(idx.begin(), idx.end()));

    // Ties are broken on the lengths themselves, so the pick is the same every run.
    std::stable_sort(results.begin(), results.end(), [](const Pairing& a, const Pairing& b) {
        if (a.cost != b.cost) return a.cost < b.cost;
        return a.lengths < b.lengths;
    });

    int huffmanCost = 0;
    for (std::size_t i = 0; i < symbols.size(); i++) {
        huffmanCost += counts[i] * static_cast<int>(codes[symbols[i]].size());
    }
    std::cout << "  " << std::left << std::setw(34) << "pairing" << std::right
              << ' ' << std::setw(5) << "cost" << '\\n';
    const Pairing& best = results.front();
    const Pairing& worst = results.back();
    const std::vector<std::pair<std::string, const Pairing*>> picks = {
        {"cheapest", &best}, {"dearest", &worst},
    };
    for (const auto& [tag, r] : picks) {
        std::string shown;
        for (std::size_t i = 0; i < symbols.size(); i++) {
            shown += (i ? " " : "") + symbols[i] + ":" + std::to_string(r->lengths[i]);
        }
        std::cout << "  " << std::left << std::setw(34) << shown << std::right
                  << ' ' << std::setw(5) << r->cost << "  " << tag << '\\n';
    }
    std::cout << "  " << std::left << std::setw(34) << "what Huffman built" << std::right
              << ' ' << std::setw(5) << huffmanCost << "\\n\\n";
    std::cout << "Huffman's assignment is the cheapest of all " << results.size() << ": "
              << (huffmanCost == best.cost ? "yes" : "NO") << '\\n';
    std::cout << "the worst pairing of the same lengths costs " << worst.cost << ", "
              << worst.cost - best.cost << " more\\n\\n";
    std::cout << "that is the greedy choice property for Huffman, stated concretely: given\\n";
    std::cout << "the shape of the tree, the cheapest way to fill it gives the shortest\\n";
    std::cout << "code to the commonest symbol — so joining the two rarest, which is what\\n";
    std::cout << "sends them deepest, never blocks an optimal answer.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::collections::BTreeMap;

struct Pairing {
    cost: i32,
    lengths: Vec<i32>,
}

/// Every permutation of the positions, so repeated lengths still count separately.
fn permutations(n: usize) -> Vec<Vec<usize>> {
    let mut idx: Vec<usize> = (0..n).collect();
    let mut all = vec![idx.clone()];
    loop {
        let mut i = match n.checked_sub(2) {
            None => return all,
            Some(v) => v as isize,
        };
        while i >= 0 && idx[i as usize] >= idx[i as usize + 1] {
            i -= 1;
        }
        if i < 0 {
            return all;
        }
        let i = i as usize;
        let mut j = n - 1;
        while idx[j] <= idx[i] {
            j -= 1;
        }
        idx.swap(i, j);
        idx[i + 1..].reverse();
        all.push(idx.clone());
    }
}

fn main() {
    let symbols = ["a", "b", "c", "d", "e", "f"];
    let counts = [5, 9, 12, 13, 16, 45];
    let codes: BTreeMap<&str, &str> = [
        ("f", "0"), ("c", "100"), ("d", "101"), ("a", "1100"), ("b", "1101"), ("e", "111"),
    ].into_iter().collect();

    // Decoding needs no separators and no lookahead: walk the bits, and the moment
    // what you have read is a code, it can only be that symbol.
    let message = "faced";
    let stream: String = message.chars().map(|c| codes[&c.to_string()[..]]).collect();
    println!("encoding '{}': {}  ({} bits)", message, stream, stream.len());

    let by_code: BTreeMap<&str, &str> = codes.iter().map(|(k, v)| (*v, *k)).collect();
    let mut out = String::new();
    let mut buffer = String::new();
    println!();
    println!("decoding, one bit at a time:");
    for bit in stream.chars() {
        buffer.push(bit);
        if let Some(sym) = by_code.get(&buffer[..]) {
            println!("  {:<5} -> {}", buffer, sym);
            out.push_str(sym);
            buffer.clear();
        }
    }
    println!("decoded: '{}'  ({})", out, if out == message { "matches" } else { "DIFFERS" });
    println!();

    // Why the rarest symbols belong deepest, checked over every alternative.
    let mut depths: Vec<i32> = symbols.iter().map(|s| codes[s].len() as i32).collect();
    depths.sort();
    let shown: Vec<String> = depths.iter().map(|d| d.to_string()).collect();
    println!("the tree fixes a multiset of code lengths: [{}]", shown.join(", "));
    println!("those lengths can be handed to the six symbols in 720 ways. cost is");
    println!("sum(count x length), so the question is which pairing is cheapest.");
    println!();

    let mut results: Vec<Pairing> = permutations(depths.len())
        .into_iter()
        .map(|perm| {
            let lengths: Vec<i32> = perm.iter().map(|&p| depths[p]).collect();
            let cost = counts.iter().zip(&lengths).map(|(n, d)| n * d).sum();
            Pairing { cost, lengths }
        })
        .collect();
    // Ties are broken on the lengths themselves, so the pick is the same every run.
    results.sort_by(|a, b| (a.cost, &a.lengths).cmp(&(b.cost, &b.lengths)));

    let huffman_cost: i32 = symbols.iter().zip(&counts)
        .map(|(s, n)| n * codes[s].len() as i32)
        .sum();
    println!("  {:<34} {:>5}", "pairing", "cost");
    let best = &results[0];
    let worst = &results[results.len() - 1];
    for (tag, r) in [("cheapest", best), ("dearest", worst)] {
        let parts: Vec<String> = symbols.iter().zip(&r.lengths)
            .map(|(s, d)| format!("{}:{}", s, d))
            .collect();
        println!("  {:<34} {:>5}  {}", parts.join(" "), r.cost, tag);
    }
    println!("  {:<34} {:>5}", "what Huffman built", huffman_cost);
    println!();
    println!("Huffman's assignment is the cheapest of all {}: {}",
             results.len(), if huffman_cost == best.cost { "yes" } else { "NO" });
    println!("the worst pairing of the same lengths costs {}, {} more",
             worst.cost, worst.cost - best.cost);
    println!();
    println!("that is the greedy choice property for Huffman, stated concretely: given");
    println!("the shape of the tree, the cheapest way to fill it gives the shortest");
    println!("code to the commonest symbol — so joining the two rarest, which is what");
    println!("sends them deepest, never blocks an optimal answer.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
)

type pairing struct {
	cost    int
	lengths []int
}

// permutations returns every ordering of the positions, so repeated lengths
// still count separately — permuting the values would give 60, not 720.
func permutations(n int) [][]int {
	idx := make([]int, n)
	for i := range idx {
		idx[i] = i
	}
	all := [][]int{append([]int(nil), idx...)}
	for {
		i := n - 2
		for i >= 0 && idx[i] >= idx[i+1] {
			i--
		}
		if i < 0 {
			return all
		}
		j := n - 1
		for idx[j] <= idx[i] {
			j--
		}
		idx[i], idx[j] = idx[j], idx[i]
		for lo, hi := i+1, n-1; lo < hi; lo, hi = lo+1, hi-1 {
			idx[lo], idx[hi] = idx[hi], idx[lo]
		}
		all = append(all, append([]int(nil), idx...))
	}
}

func main() {
	symbols := []string{"a", "b", "c", "d", "e", "f"}
	counts := []int{5, 9, 12, 13, 16, 45}
	codes := map[string]string{"f": "0", "c": "100", "d": "101",
		"a": "1100", "b": "1101", "e": "111"}

	// Decoding needs no separators and no lookahead: walk the bits, and the moment
	// what you have read is a code, it can only be that symbol.
	message := "faced"
	stream := ""
	for _, c := range message {
		stream += codes[string(c)]
	}
	fmt.Printf("encoding '%s': %s  (%d bits)\\n", message, stream, len(stream))

	byCode := map[string]string{}
	for k, v := range codes {
		byCode[v] = k
	}
	out, buffer := "", ""
	fmt.Println()
	fmt.Println("decoding, one bit at a time:")
	for _, bit := range stream {
		buffer += string(bit)
		if sym, ok := byCode[buffer]; ok {
			fmt.Printf("  %-5s -> %s\\n", buffer, sym)
			out += sym
			buffer = ""
		}
	}
	verdict := "DIFFERS"
	if out == message {
		verdict = "matches"
	}
	fmt.Printf("decoded: '%s'  (%s)\\n", out, verdict)
	fmt.Println()

	// Why the rarest symbols belong deepest, checked over every alternative.
	depths := make([]int, len(symbols))
	for i, s := range symbols {
		depths[i] = len(codes[s])
	}
	sort.Ints(depths)
	shown := make([]string, len(depths))
	for i, d := range depths {
		shown[i] = strconv.Itoa(d)
	}
	fmt.Println("the tree fixes a multiset of code lengths: [" + strings.Join(shown, ", ") + "]")
	fmt.Println("those lengths can be handed to the six symbols in 720 ways. cost is")
	fmt.Println("sum(count x length), so the question is which pairing is cheapest.")
	fmt.Println()

	var results []pairing
	for _, perm := range permutations(len(depths)) {
		lengths := make([]int, len(perm))
		cost := 0
		for i, p := range perm {
			lengths[i] = depths[p]
			cost += counts[i] * lengths[i]
		}
		results = append(results, pairing{cost, lengths})
	}
	// Ties are broken on the lengths themselves, so the pick is the same every run.
	sort.SliceStable(results, func(a, b int) bool {
		if results[a].cost != results[b].cost {
			return results[a].cost < results[b].cost
		}
		for i := range results[a].lengths {
			if results[a].lengths[i] != results[b].lengths[i] {
				return results[a].lengths[i] < results[b].lengths[i]
			}
		}
		return false
	})

	huffmanCost := 0
	for i, s := range symbols {
		huffmanCost += counts[i] * len(codes[s])
	}
	fmt.Printf("  %-34s %5s\\n", "pairing", "cost")
	best, worst := results[0], results[len(results)-1]
	for _, pick := range []struct {
		tag string
		r   pairing
	}{{"cheapest", best}, {"dearest", worst}} {
		parts := make([]string, len(symbols))
		for i, s := range symbols {
			parts[i] = fmt.Sprintf("%s:%d", s, pick.r.lengths[i])
		}
		fmt.Printf("  %-34s %5d  %s\\n", strings.Join(parts, " "), pick.r.cost, pick.tag)
	}
	fmt.Printf("  %-34s %5d\\n", "what Huffman built", huffmanCost)
	fmt.Println()
	cheapest := "NO"
	if huffmanCost == best.cost {
		cheapest = "yes"
	}
	fmt.Printf("Huffman's assignment is the cheapest of all %d: %s\\n", len(results), cheapest)
	fmt.Printf("the worst pairing of the same lengths costs %d, %d more\\n",
		worst.cost, worst.cost-best.cost)
	fmt.Println()
	fmt.Println("that is the greedy choice property for Huffman, stated concretely: given")
	fmt.Println("the shape of the tree, the cheapest way to fill it gives the shortest")
	fmt.Println("code to the commonest symbol — so joining the two rarest, which is what")
	fmt.Println("sends them deepest, never blocks an optimal answer.")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a prefix code and why does Huffman need one?",
      answer:
        "A prefix code is one where no symbol's code is a prefix of another's. It is what makes a bitstream decodable without separators: read bits until what you hold is a code, and it can only be that symbol, because nothing longer starts the same way. Without the property the stream is genuinely ambiguous — with f=0 and d=00, the bits 00 are either two f's or one d and nothing distinguishes them. Huffman gets the property for free by construction: every symbol ends at a leaf, and no leaf is on the path to another leaf.",
    },
    {
      question: "Why join the two least frequent trees rather than any other pair?",
      answer:
        "Because a symbol's code length is its depth, so the total cost is the sum of frequency times depth, and joining two trees pushes both of them one level deeper. Joining the two lightest therefore adds the least possible cost at that step. The exchange argument makes it a proof: in any optimal tree the two deepest leaves are siblings, and swapping the two rarest symbols into those positions never increases the total — so some optimal tree begins with the two rarest joined, which is exactly the greedy choice property.",
    },
    {
      question: "How do you decode, and what does the heap cost?",
      answer:
        "Decoding walks the tree from the root, taking the left child on a 0 and the right on a 1, and emitting a symbol whenever it reaches a leaf; then it starts again at the root. That is O(bits) with no backtracking, which is the payoff for the prefix property. Building the tree is n − 1 merges, each two pops and a push on a heap of at most n items, so O(n log n) — and the initial heapify is O(n). The heap is doing one job the whole way through: answering \"what are the two lightest things left\", which is the only question the algorithm ever asks.",
    },
  ],
  takeaways: [
    "No code may be a prefix of another, or the bitstream is ambiguous. Putting every symbol at a leaf gives that for free.",
    "A symbol's code length is its depth, so the cost is the sum of frequency times depth.",
    "Joining two trees pushes both one level deeper and adds exactly their combined weight, so joining the two lightest is the cheapest merge.",
    "n symbols take exactly n − 1 merges; the heap answers one question throughout, at O(n log n).",
    "In any optimal tree the two deepest leaves are siblings — which is what lets the two rarest be exchanged into them.",
    "Decoding walks the tree one step per bit, with no lookahead and no backtracking.",
  ],
  status: "available",
};
