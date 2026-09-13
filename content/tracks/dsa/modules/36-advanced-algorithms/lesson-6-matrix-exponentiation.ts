import type { Lesson } from "@/content/types";

export const matrixExponentiationLesson: Lesson = {
  id: "dsa-advanced-algorithms-matrix-exponentiation",
  slug: "matrix-exponentiation",
  moduleSlug: "advanced-algorithms",
  title: "Matrix Exponentiation for Linear Recurrences",
  summary:
    "A recurrence that combines the previous k terms is a k by k matrix applied repeatedly, and repeated squaring applies it n times in about log n products. Measured: Fibonacci at n = 10^18 in 664 scalar multiplications, and F(10^18) mod 1,000,000,007 = 209,783,453.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Write a linear recurrence as a companion matrix",
    "Raise a matrix to a large power by repeated squaring",
    "Count the products and scalar multiplications that costs",
    "Extend the method to constant terms and to counting paths in a graph",
  ],
  sections: [
    {
      id: "the-matrix",
      heading: "A recurrence as a matrix",
      body: [
        "A linear recurrence computes each term as a fixed combination of the previous `k`. Collect those `k` terms into a vector; one step of the recurrence is multiplication by a fixed `k \u00d7 k` matrix.",
        "**Fibonacci.** The state `(F(n+1), F(n))` becomes `(F(n+2), F(n+1))` under `[[1, 1], [1, 0]]`. Applying it `n` times to `(F(1), F(0)) = (1, 0)` gives `F(n)` as the top-right entry of `[[1, 1], [1, 0]]^n`.",
        "**Tribonacci**, `T(n) = T(n-1) + T(n-2) + T(n-3)`. The state `(T(n+2), T(n+1), T(n))` advances under `[[1, 1, 1], [1, 0, 0], [0, 1, 0]]`: the first row forms the new sum, the other rows shift the old terms down. In general the first row holds the recurrence's coefficients and a diagonal of ones below it does the shifting \u2014 the **companion matrix**.",
        "So the `n`-th term is one entry of the `n`-th power of that matrix, times the initial state.",
      ],
    },
    {
      id: "repeated-squaring",
      heading: "Repeated squaring",
      body: [
        "`M^n` does not need `n` products. Write `n` in binary. Keep a result matrix, initially the identity, and a base matrix, initially `M`. For each bit from lowest to highest: if the bit is set, multiply the result by the base; then square the base.",
        "That is `floor(log2 n)` squarings plus one multiplication per set bit. For `n = 10^18`, which has 60 bits of which 24 are set, it is 59 squarings and 24 multiplications: 83 matrix products.",
        "A product of `k \u00d7 k` matrices costs `k^3` scalar multiplications, so the total is `O(k^3 log n)`. Reduce modulo `M` after every multiplication, or products overflow.",
      ],
      examples: [
        {
          id: "matrix-power-against-stepping",
          title: "Fibonacci and tribonacci by matrix power, checked against stepping, with multiplications counted",
          lang: "python",
          code: `# A linear recurrence advanced one term at a time costs n steps. Written as a
# matrix and raised to the n-th power by repeated squaring, it costs about
# log n matrix products. Both are checked against each other, and the scalar
# multiplications are counted.

MOD = 1000000007
work = [0]


def multiply(a, b):
    size = len(a)
    out = [[0] * size for _ in range(size)]
    for i in range(size):
        for j in range(size):
            total = 0
            for k in range(size):
                work[0] += 1
                total += a[i][k] * b[k][j]
            out[i][j] = total % MOD
    return out


def power(matrix, exponent):
    size = len(matrix)
    result = [[1 if i == j else 0 for j in range(size)] for i in range(size)]
    base = matrix
    while exponent > 0:
        if exponent & 1:
            result = multiply(result, base)
        exponent >>= 1
        if exponent > 0:
            base = multiply(base, base)
    return result


def fibonacci_by_matrix(n):
    # [F(n+1) F(n); F(n) F(n-1)] = [[1, 1], [1, 0]] ^ n
    return power([[1, 1], [1, 0]], n)[0][1]


def tribonacci_by_matrix(n):
    # T(n) = T(n-1) + T(n-2) + T(n-3), with T(0) = 0, T(1) = 0, T(2) = 1.
    # M^n maps (T2, T1, T0) = (1, 0, 0) to (T(n+2), T(n+1), T(n)), so T(n)
    # is the bottom entry of the first column.
    m = power([[1, 1, 1], [1, 0, 0], [0, 1, 0]], n)
    return m[2][0]


def fibonacci_by_steps(n):
    a = 0
    b = 1
    for _ in range(n):
        work[0] += 1
        a, b = b, (a + b) % MOD
    return a


def tribonacci_by_steps(n):
    a = 0
    b = 0
    c = 1
    for _ in range(n):
        work[0] += 1
        a, b, c = b, c, (a + b + c) % MOD
    return a


agree = 0
for n in range(300):
    if fibonacci_by_matrix(n) == fibonacci_by_steps(n) and \\
       tribonacci_by_matrix(n) == tribonacci_by_steps(n):
        agree += 1
print("matrix power matched step-by-step for fibonacci and tribonacci, n = 0..299: %d of 300"
      % agree)
print()
print("                        n   steps one term at a time   multiplications, 2x2   3x3")
for n in [10, 1000, 100000, 10 ** 9, 10 ** 18]:
    if n <= 100000:
        work[0] = 0
        fibonacci_by_steps(n)
        steps = "%d" % work[0]
    else:
        steps = "not run"
    work[0] = 0
    fibonacci_by_matrix(n)
    two = work[0]
    work[0] = 0
    tribonacci_by_matrix(n)
    three = work[0]
    print("%25d %26s %22d %5d" % (n, steps, two, three))
print()
print("fibonacci(10^18) mod 1000000007 = %d" % fibonacci_by_matrix(10 ** 18))
`,
          output: `matrix power matched step-by-step for fibonacci and tribonacci, n = 0..299: 300 of 300

                        n   steps one term at a time   multiplications, 2x2   3x3
                       10                         10                     40   135
                     1000                       1000                    120   405
                   100000                     100000                    176   594
               1000000000                    not run                    336  1134
      1000000000000000000                    not run                    664  2241

fibonacci(10^18) mod 1000000007 = 209783453`,
          explanation:
            "Matrix power matched step-by-step computation for both recurrences at every n from 0 to 299. Stepping costs n steps: 100,000 at n = 100,000, and it was not run beyond that. The 2 by 2 matrix power costs 176 scalar multiplications at 100,000, 336 at 10^9 and 664 at 10^18; the 3 by 3 costs 594, 1,134 and 2,241. The 3 by 3 figures are 27/8 of the 2 by 2 ones, the ratio of k^3. F(10^18) mod 1,000,000,007 is 209,783,453.",
          alternates: [
            {
              lang: "javascript",
              code: `// A linear recurrence advanced one term at a time costs n steps. Written as a
// matrix and raised to the n-th power by repeated squaring, it costs about
// log n matrix products. Both are checked against each other, and the scalar
// multiplications are counted.

// BigInt throughout: products of two values below 1000000007 run past 2^53.
const MOD = 1000000007n;
let work = 0;

function multiply(a, b) {
  const size = a.length;
  const out = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      let total = 0n;
      for (let k = 0; k < size; k++) {
        work += 1;
        total += a[i][k] * b[k][j];
      }
      row.push(total % MOD);
    }
    out.push(row);
  }
  return out;
}

function power(matrix, exponent) {
  const size = matrix.length;
  let result = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) row.push(i === j ? 1n : 0n);
    result.push(row);
  }
  let base = matrix;
  while (exponent > 0n) {
    if (exponent & 1n) result = multiply(result, base);
    exponent >>= 1n;
    if (exponent > 0n) base = multiply(base, base);
  }
  return result;
}

function fibonacciByMatrix(n) {
  // [F(n+1) F(n); F(n) F(n-1)] = [[1, 1], [1, 0]] ^ n
  return power([[1n, 1n], [1n, 0n]], n)[0][1];
}

function tribonacciByMatrix(n) {
  // T(n) = T(n-1) + T(n-2) + T(n-3), with T(0) = 0, T(1) = 0, T(2) = 1.
  // M^n maps (T2, T1, T0) = (1, 0, 0) to (T(n+2), T(n+1), T(n)), so T(n)
  // is the bottom entry of the first column.
  return power([[1n, 1n, 1n], [1n, 0n, 0n], [0n, 1n, 0n]], n)[2][0];
}

function fibonacciBySteps(n) {
  let a = 0n;
  let b = 1n;
  for (let i = 0; i < n; i++) {
    work += 1;
    [a, b] = [b, (a + b) % MOD];
  }
  return a;
}

function tribonacciBySteps(n) {
  let a = 0n;
  let b = 0n;
  let c = 1n;
  for (let i = 0; i < n; i++) {
    work += 1;
    [a, b, c] = [b, c, (a + b + c) % MOD];
  }
  return a;
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

let agree = 0;
for (let n = 0; n < 300; n++) {
  if (
    fibonacciByMatrix(BigInt(n)) === fibonacciBySteps(n) &&
    tribonacciByMatrix(BigInt(n)) === tribonacciBySteps(n)
  ) {
    agree += 1;
  }
}
console.log(
  "matrix power matched step-by-step for fibonacci and tribonacci, n = 0..299: " + agree +
    " of 300",
);
console.log();
console.log("                        n   steps one term at a time   multiplications, 2x2   3x3");
for (const n of [10n, 1000n, 100000n, 10n ** 9n, 10n ** 18n]) {
  let steps = "not run";
  if (n <= 100000n) {
    work = 0;
    fibonacciBySteps(Number(n));
    steps = String(work);
  }
  work = 0;
  fibonacciByMatrix(n);
  const two = work;
  work = 0;
  tribonacciByMatrix(n);
  const three = work;
  console.log(padLeft(n, 25) + " " + padLeft(steps, 26) + " " + padLeft(two, 22) + " " + padLeft(three, 5));
}
console.log();
console.log("fibonacci(10^18) mod 1000000007 = " + fibonacciByMatrix(10n ** 18n));
`,
            },
            {
              lang: "typescript",
              code: `// A linear recurrence advanced one term at a time costs n steps. Written as a
// matrix and raised to the n-th power by repeated squaring, it costs about
// log n matrix products. Both are checked against each other, and the scalar
// multiplications are counted.

// BigInt throughout: products of two values below 1000000007 run past 2^53.
const MOD = 1000000007n;
let work = 0;

function multiply(a: bigint[][], b: bigint[][]): bigint[][] {
  const size = a.length;
  const out: bigint[][] = [];
  for (let i = 0; i < size; i++) {
    const row: bigint[] = [];
    for (let j = 0; j < size; j++) {
      let total = 0n;
      for (let k = 0; k < size; k++) {
        work += 1;
        total += a[i][k] * b[k][j];
      }
      row.push(total % MOD);
    }
    out.push(row);
  }
  return out;
}

function power(matrix: bigint[][], exponent: bigint): bigint[][] {
  const size = matrix.length;
  let result: bigint[][] = [];
  for (let i = 0; i < size; i++) {
    const row: bigint[] = [];
    for (let j = 0; j < size; j++) row.push(i === j ? 1n : 0n);
    result.push(row);
  }
  let base = matrix;
  while (exponent > 0n) {
    if (exponent & 1n) result = multiply(result, base);
    exponent >>= 1n;
    if (exponent > 0n) base = multiply(base, base);
  }
  return result;
}

function fibonacciByMatrix(n: bigint): bigint {
  // [F(n+1) F(n); F(n) F(n-1)] = [[1, 1], [1, 0]] ^ n
  return power([[1n, 1n], [1n, 0n]], n)[0][1];
}

function tribonacciByMatrix(n: bigint): bigint {
  // T(n) = T(n-1) + T(n-2) + T(n-3), with T(0) = 0, T(1) = 0, T(2) = 1.
  // M^n maps (T2, T1, T0) = (1, 0, 0) to (T(n+2), T(n+1), T(n)), so T(n)
  // is the bottom entry of the first column.
  return power([[1n, 1n, 1n], [1n, 0n, 0n], [0n, 1n, 0n]], n)[2][0];
}

function fibonacciBySteps(n: number): bigint {
  let a = 0n;
  let b = 1n;
  for (let i = 0; i < n; i++) {
    work += 1;
    [a, b] = [b, (a + b) % MOD];
  }
  return a;
}

function tribonacciBySteps(n: number): bigint {
  let a = 0n;
  let b = 0n;
  let c = 1n;
  for (let i = 0; i < n; i++) {
    work += 1;
    [a, b, c] = [b, c, (a + b + c) % MOD];
  }
  return a;
}

function padLeft(s: string | number | bigint, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

let agree = 0;
for (let n = 0; n < 300; n++) {
  if (
    fibonacciByMatrix(BigInt(n)) === fibonacciBySteps(n) &&
    tribonacciByMatrix(BigInt(n)) === tribonacciBySteps(n)
  ) {
    agree += 1;
  }
}
console.log(
  "matrix power matched step-by-step for fibonacci and tribonacci, n = 0..299: " + agree +
    " of 300",
);
console.log();
console.log("                        n   steps one term at a time   multiplications, 2x2   3x3");
for (const n of [10n, 1000n, 100000n, 10n ** 9n, 10n ** 18n]) {
  let steps = "not run";
  if (n <= 100000n) {
    work = 0;
    fibonacciBySteps(Number(n));
    steps = String(work);
  }
  work = 0;
  fibonacciByMatrix(n);
  const two = work;
  work = 0;
  tribonacciByMatrix(n);
  const three = work;
  console.log(padLeft(n, 25) + " " + padLeft(steps, 26) + " " + padLeft(two, 22) + " " + padLeft(three, 5));
}
console.log();
console.log("fibonacci(10^18) mod 1000000007 = " + fibonacciByMatrix(10n ** 18n));
`,
            },
            {
              lang: "java",
              code: `// A linear recurrence advanced one term at a time costs n steps. Written as a
// matrix and raised to the n-th power by repeated squaring, it costs about
// log n matrix products. Both are checked against each other, and the scalar
// multiplications are counted.

public class Main {
  static final long MOD = 1000000007L;
  static long work = 0;

  static long[][] multiply(long[][] a, long[][] b) {
    int size = a.length;
    long[][] out = new long[size][size];
    for (int i = 0; i < size; i++) {
      for (int j = 0; j < size; j++) {
        long total = 0;
        for (int k = 0; k < size; k++) {
          work += 1;
          total = (total + a[i][k] * b[k][j]) % MOD;
        }
        out[i][j] = total;
      }
    }
    return out;
  }

  static long[][] power(long[][] matrix, long exponent) {
    int size = matrix.length;
    long[][] result = new long[size][size];
    for (int i = 0; i < size; i++) {
      result[i][i] = 1;
    }
    long[][] base = matrix;
    while (exponent > 0) {
      if ((exponent & 1) == 1) {
        result = multiply(result, base);
      }
      exponent >>= 1;
      if (exponent > 0) {
        base = multiply(base, base);
      }
    }
    return result;
  }

  static long fibonacciByMatrix(long n) {
    // [F(n+1) F(n); F(n) F(n-1)] = [[1, 1], [1, 0]] ^ n
    return power(new long[][] {{1, 1}, {1, 0}}, n)[0][1];
  }

  static long tribonacciByMatrix(long n) {
    // T(n) = T(n-1) + T(n-2) + T(n-3), with T(0) = 0, T(1) = 0, T(2) = 1.
    // M^n maps (T2, T1, T0) = (1, 0, 0) to (T(n+2), T(n+1), T(n)), so T(n)
    // is the bottom entry of the first column.
    return power(new long[][] {{1, 1, 1}, {1, 0, 0}, {0, 1, 0}}, n)[2][0];
  }

  static long fibonacciBySteps(long n) {
    long a = 0;
    long b = 1;
    for (long i = 0; i < n; i++) {
      work += 1;
      long next = (a + b) % MOD;
      a = b;
      b = next;
    }
    return a;
  }

  static long tribonacciBySteps(long n) {
    long a = 0;
    long b = 0;
    long c = 1;
    for (long i = 0; i < n; i++) {
      work += 1;
      long next = (a + b + c) % MOD;
      a = b;
      b = c;
      c = next;
    }
    return a;
  }

  public static void main(String[] args) {
    int agree = 0;
    for (long n = 0; n < 300; n++) {
      if (fibonacciByMatrix(n) == fibonacciBySteps(n) && tribonacciByMatrix(n) == tribonacciBySteps(n)) {
        agree += 1;
      }
    }
    System.out.printf(
        "matrix power matched step-by-step for fibonacci and tribonacci, n = 0..299: %d of 300%n",
        agree);
    System.out.println();
    System.out.println(
        "                        n   steps one term at a time   multiplications, 2x2   3x3");
    long[] sizes = {10L, 1000L, 100000L, 1000000000L, 1000000000000000000L};
    for (long n : sizes) {
      String steps = "not run";
      if (n <= 100000L) {
        work = 0;
        fibonacciBySteps(n);
        steps = String.valueOf(work);
      }
      work = 0;
      fibonacciByMatrix(n);
      long two = work;
      work = 0;
      tribonacciByMatrix(n);
      long three = work;
      System.out.printf("%25d %26s %22d %5d%n", n, steps, two, three);
    }
    System.out.println();
    System.out.printf(
        "fibonacci(10^18) mod 1000000007 = %d%n", fibonacciByMatrix(1000000000000000000L));
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// A linear recurrence advanced one term at a time costs n steps. Written as a
// matrix and raised to the n-th power by repeated squaring, it costs about
// log n matrix products. Both are checked against each other, and the scalar
// multiplications are counted.

#include <cstdio>
#include <string>
#include <vector>

typedef std::vector<std::vector<long long> > Matrix;

static const long long MOD = 1000000007LL;
long long work = 0;

Matrix multiply(const Matrix& a, const Matrix& b) {
  size_t size = a.size();
  Matrix out(size, std::vector<long long>(size, 0));
  for (size_t i = 0; i < size; i++) {
    for (size_t j = 0; j < size; j++) {
      long long total = 0;
      for (size_t k = 0; k < size; k++) {
        work += 1;
        total = (total + a[i][k] * b[k][j]) % MOD;
      }
      out[i][j] = total;
    }
  }
  return out;
}

Matrix power(const Matrix& matrix, long long exponent) {
  size_t size = matrix.size();
  Matrix result(size, std::vector<long long>(size, 0));
  for (size_t i = 0; i < size; i++) {
    result[i][i] = 1;
  }
  Matrix base = matrix;
  while (exponent > 0) {
    if (exponent & 1) {
      result = multiply(result, base);
    }
    exponent >>= 1;
    if (exponent > 0) {
      base = multiply(base, base);
    }
  }
  return result;
}

long long fibonacciByMatrix(long long n) {
  // [F(n+1) F(n); F(n) F(n-1)] = [[1, 1], [1, 0]] ^ n
  return power({{1, 1}, {1, 0}}, n)[0][1];
}

long long tribonacciByMatrix(long long n) {
  // T(n) = T(n-1) + T(n-2) + T(n-3), with T(0) = 0, T(1) = 0, T(2) = 1.
  // M^n maps (T2, T1, T0) = (1, 0, 0) to (T(n+2), T(n+1), T(n)), so T(n)
  // is the bottom entry of the first column.
  return power({{1, 1, 1}, {1, 0, 0}, {0, 1, 0}}, n)[2][0];
}

long long fibonacciBySteps(long long n) {
  long long a = 0;
  long long b = 1;
  for (long long i = 0; i < n; i++) {
    work += 1;
    long long next = (a + b) % MOD;
    a = b;
    b = next;
  }
  return a;
}

long long tribonacciBySteps(long long n) {
  long long a = 0;
  long long b = 0;
  long long c = 1;
  for (long long i = 0; i < n; i++) {
    work += 1;
    long long next = (a + b + c) % MOD;
    a = b;
    b = c;
    c = next;
  }
  return a;
}

int main() {
  int agree = 0;
  for (long long n = 0; n < 300; n++) {
    if (fibonacciByMatrix(n) == fibonacciBySteps(n) &&
        tribonacciByMatrix(n) == tribonacciBySteps(n)) {
      agree += 1;
    }
  }
  std::printf(
      "matrix power matched step-by-step for fibonacci and tribonacci, n = 0..299: %d of 300\\n",
      agree);
  std::printf("\\n");
  std::printf("                        n   steps one term at a time   multiplications, 2x2   3x3\\n");
  long long sizes[5] = {10LL, 1000LL, 100000LL, 1000000000LL, 1000000000000000000LL};
  for (long long n : sizes) {
    std::string steps = "not run";
    if (n <= 100000LL) {
      work = 0;
      fibonacciBySteps(n);
      steps = std::to_string(work);
    }
    work = 0;
    fibonacciByMatrix(n);
    long long two = work;
    work = 0;
    tribonacciByMatrix(n);
    long long three = work;
    std::printf("%25lld %26s %22lld %5lld\\n", n, steps.c_str(), two, three);
  }
  std::printf("\\n");
  std::printf("fibonacci(10^18) mod 1000000007 = %lld\\n", fibonacciByMatrix(1000000000000000000LL));
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// A linear recurrence advanced one term at a time costs n steps. Written as a
// matrix and raised to the n-th power by repeated squaring, it costs about
// log n matrix products. Both are checked against each other, and the scalar
// multiplications are counted.

const MOD: i64 = 1000000007;

type Matrix = Vec<Vec<i64>>;

fn multiply(a: &Matrix, b: &Matrix, work: &mut i64) -> Matrix {
    let size = a.len();
    let mut out = vec![vec![0i64; size]; size];
    for i in 0..size {
        for j in 0..size {
            let mut total = 0;
            for k in 0..size {
                *work += 1;
                total = (total + a[i][k] * b[k][j]) % MOD;
            }
            out[i][j] = total;
        }
    }
    out
}

fn power(matrix: Matrix, mut exponent: u64, work: &mut i64) -> Matrix {
    let size = matrix.len();
    let mut result = vec![vec![0i64; size]; size];
    for i in 0..size {
        result[i][i] = 1;
    }
    let mut base = matrix;
    while exponent > 0 {
        if exponent & 1 == 1 {
            result = multiply(&result, &base, work);
        }
        exponent >>= 1;
        if exponent > 0 {
            base = multiply(&base, &base, work);
        }
    }
    result
}

fn fibonacci_by_matrix(n: u64, work: &mut i64) -> i64 {
    // [F(n+1) F(n); F(n) F(n-1)] = [[1, 1], [1, 0]] ^ n
    power(vec![vec![1, 1], vec![1, 0]], n, work)[0][1]
}

fn tribonacci_by_matrix(n: u64, work: &mut i64) -> i64 {
    // T(n) = T(n-1) + T(n-2) + T(n-3), with T(0) = 0, T(1) = 0, T(2) = 1.
    // M^n maps (T2, T1, T0) = (1, 0, 0) to (T(n+2), T(n+1), T(n)), so T(n)
    // is the bottom entry of the first column.
    power(vec![vec![1, 1, 1], vec![1, 0, 0], vec![0, 1, 0]], n, work)[2][0]
}

fn fibonacci_by_steps(n: u64, work: &mut i64) -> i64 {
    let mut a = 0;
    let mut b = 1;
    for _ in 0..n {
        *work += 1;
        let next = (a + b) % MOD;
        a = b;
        b = next;
    }
    a
}

fn tribonacci_by_steps(n: u64, work: &mut i64) -> i64 {
    let mut a = 0;
    let mut b = 0;
    let mut c = 1;
    for _ in 0..n {
        *work += 1;
        let next = (a + b + c) % MOD;
        a = b;
        b = c;
        c = next;
    }
    a
}

fn main() {
    let mut ignored = 0;
    let mut agree = 0;
    for n in 0..300u64 {
        if fibonacci_by_matrix(n, &mut ignored) == fibonacci_by_steps(n, &mut ignored)
            && tribonacci_by_matrix(n, &mut ignored) == tribonacci_by_steps(n, &mut ignored)
        {
            agree += 1;
        }
    }
    println!(
        "matrix power matched step-by-step for fibonacci and tribonacci, n = 0..299: {} of 300",
        agree
    );
    println!();
    println!("                        n   steps one term at a time   multiplications, 2x2   3x3");
    for &n in [10u64, 1000, 100000, 1000000000, 1000000000000000000].iter() {
        let mut steps = String::from("not run");
        if n <= 100000 {
            let mut work = 0;
            fibonacci_by_steps(n, &mut work);
            steps = work.to_string();
        }
        let mut two = 0;
        fibonacci_by_matrix(n, &mut two);
        let mut three = 0;
        tribonacci_by_matrix(n, &mut three);
        println!("{:>25} {:>26} {:>22} {:>5}", n, steps, two, three);
    }
    println!();
    println!(
        "fibonacci(10^18) mod 1000000007 = {}",
        fibonacci_by_matrix(1000000000000000000, &mut ignored)
    );
}
`,
            },
            {
              lang: "go",
              code: `// A linear recurrence advanced one term at a time costs n steps. Written as a
// matrix and raised to the n-th power by repeated squaring, it costs about
// log n matrix products. Both are checked against each other, and the scalar
// multiplications are counted.

package main

import "fmt"

const mod = 1000000007

var work int64

func multiply(a, b [][]int64) [][]int64 {
	size := len(a)
	out := make([][]int64, size)
	for i := range out {
		out[i] = make([]int64, size)
		for j := 0; j < size; j++ {
			var total int64
			for k := 0; k < size; k++ {
				work++
				total = (total + a[i][k]*b[k][j]) % mod
			}
			out[i][j] = total
		}
	}
	return out
}

func power(matrix [][]int64, exponent int64) [][]int64 {
	size := len(matrix)
	result := make([][]int64, size)
	for i := range result {
		result[i] = make([]int64, size)
		result[i][i] = 1
	}
	base := matrix
	for exponent > 0 {
		if exponent&1 == 1 {
			result = multiply(result, base)
		}
		exponent >>= 1
		if exponent > 0 {
			base = multiply(base, base)
		}
	}
	return result
}

func fibonacciByMatrix(n int64) int64 {
	// [F(n+1) F(n); F(n) F(n-1)] = [[1, 1], [1, 0]] ^ n
	return power([][]int64{{1, 1}, {1, 0}}, n)[0][1]
}

func tribonacciByMatrix(n int64) int64 {
	// T(n) = T(n-1) + T(n-2) + T(n-3), with T(0) = 0, T(1) = 0, T(2) = 1.
	// M^n maps (T2, T1, T0) = (1, 0, 0) to (T(n+2), T(n+1), T(n)), so T(n)
	// is the bottom entry of the first column.
	return power([][]int64{{1, 1, 1}, {1, 0, 0}, {0, 1, 0}}, n)[2][0]
}

func fibonacciBySteps(n int64) int64 {
	var a, b int64 = 0, 1
	for i := int64(0); i < n; i++ {
		work++
		a, b = b, (a+b)%mod
	}
	return a
}

func tribonacciBySteps(n int64) int64 {
	var a, b, c int64 = 0, 0, 1
	for i := int64(0); i < n; i++ {
		work++
		a, b, c = b, c, (a+b+c)%mod
	}
	return a
}

func main() {
	agree := 0
	for n := int64(0); n < 300; n++ {
		if fibonacciByMatrix(n) == fibonacciBySteps(n) && tribonacciByMatrix(n) == tribonacciBySteps(n) {
			agree++
		}
	}
	fmt.Printf("matrix power matched step-by-step for fibonacci and tribonacci, n = 0..299: %d of 300\\n", agree)
	fmt.Println()
	fmt.Println("                        n   steps one term at a time   multiplications, 2x2   3x3")
	for _, n := range []int64{10, 1000, 100000, 1000000000, 1000000000000000000} {
		steps := "not run"
		if n <= 100000 {
			work = 0
			fibonacciBySteps(n)
			steps = fmt.Sprint(work)
		}
		work = 0
		fibonacciByMatrix(n)
		two := work
		work = 0
		tribonacciByMatrix(n)
		three := work
		fmt.Printf("%25d %26s %22d %5d\\n", n, steps, two, three)
	}
	fmt.Println()
	fmt.Printf("fibonacci(10^18) mod 1000000007 = %d\\n", fibonacciByMatrix(1000000000000000000))
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "extensions",
      heading: "Extensions",
      body: [
        "**A constant term.** `a(n) = a(n-1) + a(n-2) + 5` is not linear in the previous terms, but it is linear in `(a(n-1), a(n-2), 1)`. Add the constant 1 to the state and a row that keeps it 1; the matrix grows by one.",
        "**A term in n.** `a(n) = a(n-1) + n` is linear in `(a(n-1), n, 1)`, since `n + 1 = n + 1\u00b71`. Polynomials in `n` of degree `d` need `d + 1` extra state entries.",
        "**Counting walks in a graph.** The entry `(i, j)` of the adjacency matrix raised to the power `L` counts walks of length exactly `L` from `i` to `j`. The same squaring counts walks of length `10^18` in a small graph.",
        "**When not to use it.** The `k^3` factor grows fast. With `k = 100` a single product is a million multiplications, so n = 10\u2076 costs 26 of them \u2014 26 million \u2014 against 100 million for stepping a 100-term recurrence that far. Counted against each other, matrix power wins from about n = 200,000 and loses below it. The method is for small `k` and very large `n`.",
      ],
      pitfalls: [
        {
          title: "Reducing only at the end",
          body: "Entries grow exponentially with the power. Take the remainder after every multiplication and addition, and make sure one product of two reduced values fits the integer type.",
        },
        {
          title: "Starting the result at the base instead of the identity",
          body: "That computes M^(n+1). The empty product is the identity.",
        },
        {
          title: "Using it when k is large and n is moderate",
          body: "At k = 100, one matrix product costs 10^6 multiplications, and the crossover against simply stepping the recurrence is near n = 200,000 — measure rather than assume it is astronomically far away.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you compute the n-th Fibonacci number for n around 10^18?",
      answer:
        "Write the recurrence as a matrix: (F(n+1), F(n)) advances under [[1, 1], [1, 0]], so F(n) is the top-right entry of that matrix to the n-th power. Raise it by repeated squaring -- square the base for each bit of n and multiply it into the result where the bit is set, reducing modulo the prime after every multiplication. For 10^18 that is 59 squarings and 24 multiplications. I measured 664 scalar multiplications in total and got 209,783,453 modulo 1,000,000,007, checked against stepping for every n below 300.",
    },
    {
      question: "How does matrix exponentiation generalise, and when does it stop paying off?",
      answer:
        "Any recurrence linear in its previous k terms uses a k by k companion matrix: coefficients in the first row, ones on the diagonal below to shift the older terms. Constant terms and polynomial terms in n are absorbed by adding state entries that stay 1 or count up. Powers of an adjacency matrix count walks of a given length. The cost is k^3 multiplications per product times about log n products, so it pays off for small k and huge n; I measured the 3 by 3 case at 27/8 the cost of 2 by 2. At k = 100 each product is a million multiplications, so stepping wins below about n = 200,000 and loses above it.",
    },
  ],
  takeaways: [
    "One step of a k-term linear recurrence is a k by k matrix",
    "The companion matrix: coefficients on top, a shifting diagonal below",
    "Repeated squaring: log n squarings plus one product per set bit",
    "Measured at n = 10^18: 664 multiplications for 2 by 2, 2,241 for 3 by 3",
    "Cost is O(k^3 log n); reduce after every multiplication",
    "Constant and polynomial terms become extra state entries",
    "Adjacency matrix powers count walks of an exact length",
  ],
};
