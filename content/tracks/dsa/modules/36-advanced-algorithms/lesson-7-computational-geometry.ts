import type { Lesson } from "@/content/types";

export const computationalGeometryLesson: Lesson = {
  id: "dsa-advanced-algorithms-computational-geometry",
  slug: "computational-geometry",
  moduleSlug: "advanced-algorithms",
  title: "Computational Geometry: Orientation, Convex Hull, Segment Intersection",
  summary:
    "One integer function — the sign of a cross product — decides left turn, right turn or collinear, and the standard primitives are built from it. Measured: a segment test that handles only proper crossings was wrong on 4,530 of 20,000 grid pairs, and gift wrapping spent 3,998,000 orientation tests where monotone chain spent 3,996.",
  estimatedMinutes: 40,
  status: "available",
  objectives: [
    "Compute the orientation of three points exactly with integers",
    "Test segment intersection including touching and collinear cases",
    "Build a convex hull with monotone chain and compare it with gift wrapping",
    "Avoid the floating-point and collinearity mistakes that break geometry code",
  ],
  sections: [
    {
      id: "orientation",
      heading: "Orientation",
      body: [
        "For points `o`, `a`, `b`, the cross product `(a.x - o.x)(b.y - o.y) - (a.y - o.y)(b.x - o.x)` is twice the signed area of the triangle they form. Its sign says which way the path `o \u2192 a \u2192 b` turns: positive is a left (counter-clockwise) turn, negative a right turn, zero means the three points are collinear.",
        "With integer coordinates this is exact: no division, no square roots, no rounding. Every primitive in this lesson reduces to signs of cross products, and keeping coordinates integral keeps every decision exact.",
        "The only numeric concern is overflow. The product of two coordinate differences can be as large as the square of the coordinate range, so coordinates up to 10^9 need 64-bit arithmetic; beyond about 3 \u00d7 10^9 they need 128-bit or arbitrary precision.",
      ],
    },
    {
      id: "segments",
      heading: "Segment intersection",
      body: [
        "Segments `p1p2` and `p3p4` **properly cross** when `p1` and `p2` lie strictly on opposite sides of the line through `p3p4`, and `p3` and `p4` lie strictly on opposite sides of the line through `p1p2`. That is four orientations, with each pair of signs opposite.",
        "That test misses every case where an orientation is zero: an endpoint touching the other segment, a T-junction, two collinear segments overlapping. Each is handled by one extra check: if an orientation is zero, the point is on the other segment's line, and it intersects if it lies within that segment's bounding box.",
      ],
      examples: [
        {
          id: "orientation-hull-and-intersection",
          title: "Segment intersection against a parametric solution, hulls against gift wrapping, and the cost of each hull",
          lang: "python",
          code: `# Three geometric primitives on integer coordinates, each built on one
# function: the orientation of three points. Segment intersection is checked
# against a second method, the convex hull against a second algorithm, and
# the orientation tests each hull algorithm spends are counted.

work = [0]


def cross(o, a, b):
    # > 0: o -> a -> b turns left; < 0: right; 0: the three are collinear
    work[0] += 1
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])


def sign(x):
    return (x > 0) - (x < 0)


# --- segment intersection ------------------------------------------------

def on_segment(p, q, r):
    # r is known to be collinear with p and q; is it between them?
    return min(p[0], q[0]) <= r[0] <= max(p[0], q[0]) and min(p[1], q[1]) <= r[1] <= max(p[1], q[1])


def intersects(p1, p2, p3, p4):
    d1 = sign(cross(p3, p4, p1))
    d2 = sign(cross(p3, p4, p2))
    d3 = sign(cross(p1, p2, p3))
    d4 = sign(cross(p1, p2, p4))
    if d1 * d2 < 0 and d3 * d4 < 0:
        return True                      # the general case: they properly cross
    if d1 == 0 and on_segment(p3, p4, p1):
        return True                      # the rest: an endpoint lies on the other
    if d2 == 0 and on_segment(p3, p4, p2):
        return True
    if d3 == 0 and on_segment(p1, p2, p3):
        return True
    if d4 == 0 and on_segment(p1, p2, p4):
        return True
    return False


def intersects_general_case_only(p1, p2, p3, p4):
    d1 = sign(cross(p3, p4, p1))
    d2 = sign(cross(p3, p4, p2))
    d3 = sign(cross(p1, p2, p3))
    d4 = sign(cross(p1, p2, p4))
    return d1 * d2 < 0 and d3 * d4 < 0


def intersects_by_parameters(p1, p2, p3, p4):
    # solve p1 + t(p2 - p1) = p3 + u(p4 - p3) with t, u in [0, 1], in integers
    rx = p2[0] - p1[0]
    ry = p2[1] - p1[1]
    sx = p4[0] - p3[0]
    sy = p4[1] - p3[1]
    qx = p3[0] - p1[0]
    qy = p3[1] - p1[1]
    denom = rx * sy - ry * sx
    t_num = qx * sy - qy * sx
    u_num = qx * ry - qy * rx
    if denom != 0:
        if denom < 0:
            denom = -denom
            t_num = -t_num
            u_num = -u_num
        return 0 <= t_num <= denom and 0 <= u_num <= denom
    if t_num != 0 or u_num != 0:
        return False                     # parallel, on different lines
    # collinear: project onto whichever axis the first segment varies along
    axis = 0 if rx != 0 else 1
    a0, a1 = sorted([p1[axis], p2[axis]])
    b0, b1 = sorted([p3[axis], p4[axis]])
    return max(a0, b0) <= min(a1, b1)


# --- convex hull ---------------------------------------------------------

def monotone_chain(points):
    pts = sorted(points)
    if len(pts) <= 2:
        return pts
    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]       # counter-clockwise, no repeated ends


def gift_wrapping(points):
    if len(points) <= 2:
        return sorted(points)
    start = min(points)
    hull = []
    p = start
    while True:
        hull.append(p)
        q = points[0] if points[0] != p else points[1]
        for r in points:
            if r == p:
                continue
            c = cross(p, q, r)
            far_r = (r[0] - p[0]) ** 2 + (r[1] - p[1]) ** 2
            far_q = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2
            if c < 0 or (c == 0 and far_r > far_q):
                q = r                    # r is further clockwise, or further along
        p = q
        if p == start:
            return hull


def doubled_area(hull):
    total = 0
    for i in range(len(hull)):
        a = hull[i]
        b = hull[(i + 1) % len(hull)]
        total += a[0] * b[1] - a[1] * b[0]
    return abs(total)


def is_valid_hull(hull, points):
    # strictly convex, and every point inside or on the boundary
    if len(hull) < 3:
        return True
    for i in range(len(hull)):
        a = hull[i]
        b = hull[(i + 1) % len(hull)]
        c = hull[(i + 2) % len(hull)]
        if cross(a, b, c) <= 0:
            return False
        for p in points:
            if cross(a, b, p) < 0:
                return False
    return True


# The same linear congruential generator in every language, so the points
# below are the same points whichever translation is run.
seed = 10300057


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def random_point(limit):
    x = rand(limit)
    y = rand(limit)
    return (x, y)


PAIRS = 20000
agree = 0
general_wrong = 0
for _ in range(PAIRS):
    ends = []
    while len(ends) < 4:
        a = random_point(5)
        b = random_point(5)
        if a != b:
            ends.append(a)
            ends.append(b)
    p1, p2, p3, p4 = ends
    full = intersects(p1, p2, p3, p4)
    if full == intersects_by_parameters(p1, p2, p3, p4):
        agree += 1
    if full != intersects_general_case_only(p1, p2, p3, p4):
        general_wrong += 1
print("%d random segment pairs on a 5 x 5 grid" % PAIRS)
print("  orientation test agreed with solving for the parameters  %d" % agree)
print("  pairs the general-case-only test got wrong                %d" % general_wrong)
print()

HULLS = 1000
valid = 0
same = 0
for _ in range(HULLS):
    count = 3 + rand(30)
    unique = {}
    for _ in range(count):
        unique[random_point(20)] = True
    points = list(unique.keys())
    a = monotone_chain(points)
    b = gift_wrapping(points)
    if is_valid_hull(a, points):
        valid += 1
    if len(a) == len(b) and doubled_area(a) == doubled_area(b):
        same += 1
print("%d random point sets on a 20 x 20 grid" % HULLS)
print("  monotone chain hull strictly convex and containing every point  %d" % valid)
print("  same vertex count and area as gift wrapping                     %d" % same)
print()
print("         n   points                 hull size   monotone chain   gift wrapping")
for n in [500, 1000, 2000]:
    square = {}
    while len(square) < n:
        square[random_point(1000000)] = True
    parabola = [(i, i * i) for i in range(n)]
    for name, points in [["random in a square", list(square.keys())],
                         ["on a parabola", parabola]]:
        work[0] = 0
        hull = monotone_chain(points)
        chain = work[0]
        work[0] = 0
        gift_wrapping(points)
        print("%10d   %-22s %9d %16d %15d" % (n, name, len(hull), chain, work[0]))
`,
          output: `20000 random segment pairs on a 5 x 5 grid
  orientation test agreed with solving for the parameters  20000
  pairs the general-case-only test got wrong                4530

1000 random point sets on a 20 x 20 grid
  monotone chain hull strictly convex and containing every point  1000
  same vertex count and area as gift wrapping                     1000

         n   points                 hull size   monotone chain   gift wrapping
       500   random in a square            13             1977            6487
       500   on a parabola                500              996          249500
      1000   random in a square            18             3973           17982
      1000   on a parabola               1000             1996          999000
      2000   random in a square            18             7970           35982
      2000   on a parabola               2000             3996         3998000`,
          explanation:
            "On 20,000 random segment pairs on a 5 by 5 grid, the full orientation test agreed with solving for the two line parameters in integers on all 20,000. The test that handles only proper crossings was wrong on 4,530 \u2014 nearly a quarter, because small integer grids are full of touching and collinear segments. On 1,000 random point sets, every monotone chain hull was strictly convex and contained every point, and matched gift wrapping in vertex count and area. The last table counts orientation tests, not including the sort. Monotone chain spent about 2n in every row. Gift wrapping spends n per hull vertex: 35,982 for a hull of 18 points at n = 2,000, and 3,998,000 when all 2,000 points lie on a parabola and are all on the hull.",
          alternates: [
            {
              lang: "javascript",
              code: `// Three geometric primitives on integer coordinates, each built on one
// function: the orientation of three points. Segment intersection is checked
// against a second method, the convex hull against a second algorithm, and
// the orientation tests each hull algorithm spends are counted.

let work = 0;

function cross(o, a, b) {
  // > 0: o -> a -> b turns left; < 0: right; 0: the three are collinear
  work += 1;
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function sign(x) {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

// --- segment intersection ------------------------------------------------

function onSegment(p, q, r) {
  // r is known to be collinear with p and q; is it between them?
  return (
    Math.min(p[0], q[0]) <= r[0] && r[0] <= Math.max(p[0], q[0]) &&
    Math.min(p[1], q[1]) <= r[1] && r[1] <= Math.max(p[1], q[1])
  );
}

function intersects(p1, p2, p3, p4) {
  const d1 = sign(cross(p3, p4, p1));
  const d2 = sign(cross(p3, p4, p2));
  const d3 = sign(cross(p1, p2, p3));
  const d4 = sign(cross(p1, p2, p4));
  if (d1 * d2 < 0 && d3 * d4 < 0) return true; // the general case: they properly cross
  if (d1 === 0 && onSegment(p3, p4, p1)) return true; // the rest: an endpoint lies on the other
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;
  return false;
}

function intersectsGeneralCaseOnly(p1, p2, p3, p4) {
  const d1 = sign(cross(p3, p4, p1));
  const d2 = sign(cross(p3, p4, p2));
  const d3 = sign(cross(p1, p2, p3));
  const d4 = sign(cross(p1, p2, p4));
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function intersectsByParameters(p1, p2, p3, p4) {
  // solve p1 + t(p2 - p1) = p3 + u(p4 - p3) with t, u in [0, 1], in integers
  const rx = p2[0] - p1[0];
  const ry = p2[1] - p1[1];
  const sx = p4[0] - p3[0];
  const sy = p4[1] - p3[1];
  const qx = p3[0] - p1[0];
  const qy = p3[1] - p1[1];
  let denom = rx * sy - ry * sx;
  let tNum = qx * sy - qy * sx;
  let uNum = qx * ry - qy * rx;
  if (denom !== 0) {
    if (denom < 0) {
      denom = -denom;
      tNum = -tNum;
      uNum = -uNum;
    }
    return tNum >= 0 && tNum <= denom && uNum >= 0 && uNum <= denom;
  }
  if (tNum !== 0 || uNum !== 0) return false; // parallel, on different lines
  // collinear: project onto whichever axis the first segment varies along
  const axis = rx !== 0 ? 0 : 1;
  const a0 = Math.min(p1[axis], p2[axis]);
  const a1 = Math.max(p1[axis], p2[axis]);
  const b0 = Math.min(p3[axis], p4[axis]);
  const b1 = Math.max(p3[axis], p4[axis]);
  return Math.max(a0, b0) <= Math.min(a1, b1);
}

// --- convex hull ---------------------------------------------------------

function byXThenY(a, b) {
  return a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1];
}

function monotoneChain(points) {
  const pts = points.slice().sort(byXThenY);
  if (pts.length <= 2) return pts;
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1)); // counter-clockwise, no repeated ends
}

function samePoint(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function giftWrapping(points) {
  if (points.length <= 2) return points.slice().sort(byXThenY);
  let start = points[0];
  for (const p of points) {
    if (byXThenY(p, start) < 0) start = p;
  }
  const hull = [];
  let p = start;
  for (;;) {
    hull.push(p);
    let q = samePoint(points[0], p) ? points[1] : points[0];
    for (const r of points) {
      if (samePoint(r, p)) continue;
      const c = cross(p, q, r);
      const farR = (r[0] - p[0]) ** 2 + (r[1] - p[1]) ** 2;
      const farQ = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
      if (c < 0 || (c === 0 && farR > farQ)) q = r; // r is further clockwise, or further along
    }
    p = q;
    if (samePoint(p, start)) return hull;
  }
}

function doubledArea(hull) {
  let total = 0;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    total += a[0] * b[1] - a[1] * b[0];
  }
  return Math.abs(total);
}

function isValidHull(hull, points) {
  // strictly convex, and every point inside or on the boundary
  if (hull.length < 3) return true;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const c = hull[(i + 2) % hull.length];
    if (cross(a, b, c) <= 0) return false;
    for (const p of points) {
      if (cross(a, b, p) < 0) return false;
    }
  }
  return true;
}

// The same linear congruential generator in every language, so the points
// below are the same points whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 10300057n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function randomPoint(limit) {
  const x = rand(limit);
  const y = rand(limit);
  return [x, y];
}

function pad(s, width) {
  let out = String(s);
  while (out.length < width) out += " ";
  return out;
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

// distinct points, in the order they were first drawn
function addPoint(seen, list, p) {
  const key = p[0] + "," + p[1];
  if (!seen.has(key)) {
    seen.add(key);
    list.push(p);
  }
}

const PAIRS = 20000;
let agree = 0;
let generalWrong = 0;
for (let t = 0; t < PAIRS; t++) {
  const ends = [];
  while (ends.length < 4) {
    const a = randomPoint(5);
    const b = randomPoint(5);
    if (!samePoint(a, b)) {
      ends.push(a);
      ends.push(b);
    }
  }
  const [p1, p2, p3, p4] = ends;
  const full = intersects(p1, p2, p3, p4);
  if (full === intersectsByParameters(p1, p2, p3, p4)) agree += 1;
  if (full !== intersectsGeneralCaseOnly(p1, p2, p3, p4)) generalWrong += 1;
}
console.log(PAIRS + " random segment pairs on a 5 x 5 grid");
console.log("  orientation test agreed with solving for the parameters  " + agree);
console.log("  pairs the general-case-only test got wrong                " + generalWrong);
console.log();

const HULLS = 1000;
let valid = 0;
let same = 0;
for (let t = 0; t < HULLS; t++) {
  const count = 3 + rand(30);
  const seen = new Set();
  const points = [];
  for (let i = 0; i < count; i++) addPoint(seen, points, randomPoint(20));
  const a = monotoneChain(points);
  const b = giftWrapping(points);
  if (isValidHull(a, points)) valid += 1;
  if (a.length === b.length && doubledArea(a) === doubledArea(b)) same += 1;
}
console.log(HULLS + " random point sets on a 20 x 20 grid");
console.log("  monotone chain hull strictly convex and containing every point  " + valid);
console.log("  same vertex count and area as gift wrapping                     " + same);
console.log();
console.log("         n   points                 hull size   monotone chain   gift wrapping");
for (const n of [500, 1000, 2000]) {
  const seen = new Set();
  const square = [];
  while (square.length < n) addPoint(seen, square, randomPoint(1000000));
  const parabola = [];
  for (let i = 0; i < n; i++) parabola.push([i, i * i]);
  const inputs = [
    ["random in a square", square],
    ["on a parabola", parabola],
  ];
  for (const [name, points] of inputs) {
    work = 0;
    const hull = monotoneChain(points);
    const chain = work;
    work = 0;
    giftWrapping(points);
    console.log(
      padLeft(n, 10) + "   " + pad(name, 22) + " " + padLeft(hull.length, 9) + " " +
        padLeft(chain, 16) + " " + padLeft(work, 15),
    );
  }
}
`,
            },
            {
              lang: "typescript",
              code: `// Three geometric primitives on integer coordinates, each built on one
// function: the orientation of three points. Segment intersection is checked
// against a second method, the convex hull against a second algorithm, and
// the orientation tests each hull algorithm spends are counted.

type Point = [number, number];

let work = 0;

function cross(o: Point, a: Point, b: Point): number {
  // > 0: o -> a -> b turns left; < 0: right; 0: the three are collinear
  work += 1;
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function sign(x: number): number {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

// --- segment intersection ------------------------------------------------

function onSegment(p: Point, q: Point, r: Point): boolean {
  // r is known to be collinear with p and q; is it between them?
  return (
    Math.min(p[0], q[0]) <= r[0] && r[0] <= Math.max(p[0], q[0]) &&
    Math.min(p[1], q[1]) <= r[1] && r[1] <= Math.max(p[1], q[1])
  );
}

function intersects(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = sign(cross(p3, p4, p1));
  const d2 = sign(cross(p3, p4, p2));
  const d3 = sign(cross(p1, p2, p3));
  const d4 = sign(cross(p1, p2, p4));
  if (d1 * d2 < 0 && d3 * d4 < 0) return true; // the general case: they properly cross
  if (d1 === 0 && onSegment(p3, p4, p1)) return true; // the rest: an endpoint lies on the other
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;
  return false;
}

function intersectsGeneralCaseOnly(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = sign(cross(p3, p4, p1));
  const d2 = sign(cross(p3, p4, p2));
  const d3 = sign(cross(p1, p2, p3));
  const d4 = sign(cross(p1, p2, p4));
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function intersectsByParameters(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  // solve p1 + t(p2 - p1) = p3 + u(p4 - p3) with t, u in [0, 1], in integers
  const rx = p2[0] - p1[0];
  const ry = p2[1] - p1[1];
  const sx = p4[0] - p3[0];
  const sy = p4[1] - p3[1];
  const qx = p3[0] - p1[0];
  const qy = p3[1] - p1[1];
  let denom = rx * sy - ry * sx;
  let tNum = qx * sy - qy * sx;
  let uNum = qx * ry - qy * rx;
  if (denom !== 0) {
    if (denom < 0) {
      denom = -denom;
      tNum = -tNum;
      uNum = -uNum;
    }
    return tNum >= 0 && tNum <= denom && uNum >= 0 && uNum <= denom;
  }
  if (tNum !== 0 || uNum !== 0) return false; // parallel, on different lines
  // collinear: project onto whichever axis the first segment varies along
  const axis = rx !== 0 ? 0 : 1;
  const a0 = Math.min(p1[axis], p2[axis]);
  const a1 = Math.max(p1[axis], p2[axis]);
  const b0 = Math.min(p3[axis], p4[axis]);
  const b1 = Math.max(p3[axis], p4[axis]);
  return Math.max(a0, b0) <= Math.min(a1, b1);
}

// --- convex hull ---------------------------------------------------------

function byXThenY(a: Point, b: Point): number {
  return a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1];
}

function monotoneChain(points: Point[]): Point[] {
  const pts = points.slice().sort(byXThenY);
  if (pts.length <= 2) return pts;
  const lower: Point[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Point[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1)); // counter-clockwise, no repeated ends
}

function samePoint(a: Point, b: Point): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function giftWrapping(points: Point[]): Point[] {
  if (points.length <= 2) return points.slice().sort(byXThenY);
  let start = points[0];
  for (const p of points) {
    if (byXThenY(p, start) < 0) start = p;
  }
  const hull: Point[] = [];
  let p = start;
  for (;;) {
    hull.push(p);
    let q = samePoint(points[0], p) ? points[1] : points[0];
    for (const r of points) {
      if (samePoint(r, p)) continue;
      const c = cross(p, q, r);
      const farR = (r[0] - p[0]) ** 2 + (r[1] - p[1]) ** 2;
      const farQ = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
      if (c < 0 || (c === 0 && farR > farQ)) q = r; // r is further clockwise, or further along
    }
    p = q;
    if (samePoint(p, start)) return hull;
  }
}

function doubledArea(hull: Point[]): number {
  let total = 0;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    total += a[0] * b[1] - a[1] * b[0];
  }
  return Math.abs(total);
}

function isValidHull(hull: Point[], points: Point[]): boolean {
  // strictly convex, and every point inside or on the boundary
  if (hull.length < 3) return true;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const c = hull[(i + 2) % hull.length];
    if (cross(a, b, c) <= 0) return false;
    for (const p of points) {
      if (cross(a, b, p) < 0) return false;
    }
  }
  return true;
}

// The same linear congruential generator in every language, so the points
// below are the same points whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 10300057n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function randomPoint(limit: number): Point {
  const x = rand(limit);
  const y = rand(limit);
  return [x, y];
}

function pad(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out += " ";
  return out;
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

// distinct points, in the order they were first drawn
function addPoint(seen: Set<string>, list: Point[], p: Point): void {
  const key = p[0] + "," + p[1];
  if (!seen.has(key)) {
    seen.add(key);
    list.push(p);
  }
}

const PAIRS = 20000;
let agree = 0;
let generalWrong = 0;
for (let t = 0; t < PAIRS; t++) {
  const ends: Point[] = [];
  while (ends.length < 4) {
    const a = randomPoint(5);
    const b = randomPoint(5);
    if (!samePoint(a, b)) {
      ends.push(a);
      ends.push(b);
    }
  }
  const [p1, p2, p3, p4] = ends;
  const full = intersects(p1, p2, p3, p4);
  if (full === intersectsByParameters(p1, p2, p3, p4)) agree += 1;
  if (full !== intersectsGeneralCaseOnly(p1, p2, p3, p4)) generalWrong += 1;
}
console.log(PAIRS + " random segment pairs on a 5 x 5 grid");
console.log("  orientation test agreed with solving for the parameters  " + agree);
console.log("  pairs the general-case-only test got wrong                " + generalWrong);
console.log();

const HULLS = 1000;
let valid = 0;
let same = 0;
for (let t = 0; t < HULLS; t++) {
  const count = 3 + rand(30);
  const seen = new Set<string>();
  const points: Point[] = [];
  for (let i = 0; i < count; i++) addPoint(seen, points, randomPoint(20));
  const a = monotoneChain(points);
  const b = giftWrapping(points);
  if (isValidHull(a, points)) valid += 1;
  if (a.length === b.length && doubledArea(a) === doubledArea(b)) same += 1;
}
console.log(HULLS + " random point sets on a 20 x 20 grid");
console.log("  monotone chain hull strictly convex and containing every point  " + valid);
console.log("  same vertex count and area as gift wrapping                     " + same);
console.log();
console.log("         n   points                 hull size   monotone chain   gift wrapping");
for (const n of [500, 1000, 2000]) {
  const seen = new Set<string>();
  const square: Point[] = [];
  while (square.length < n) addPoint(seen, square, randomPoint(1000000));
  const parabola: Point[] = [];
  for (let i = 0; i < n; i++) parabola.push([i, i * i]);
  const inputs: Array<[string, Point[]]> = [
    ["random in a square", square],
    ["on a parabola", parabola],
  ];
  for (const [name, points] of inputs) {
    work = 0;
    const hull = monotoneChain(points);
    const chain = work;
    work = 0;
    giftWrapping(points);
    console.log(
      padLeft(n, 10) + "   " + pad(name, 22) + " " + padLeft(hull.length, 9) + " " +
        padLeft(chain, 16) + " " + padLeft(work, 15),
    );
  }
}
`,
            },
            {
              lang: "java",
              code: `// Three geometric primitives on integer coordinates, each built on one
// function: the orientation of three points. Segment intersection is checked
// against a second method, the convex hull against a second algorithm, and
// the orientation tests each hull algorithm spends are counted.

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Main {
  static long work = 0;

  static long cross(long[] o, long[] a, long[] b) {
    // > 0: o -> a -> b turns left; < 0: right; 0: the three are collinear
    work += 1;
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }

  static int sign(long x) {
    return Long.signum(x);
  }

  // --- segment intersection ------------------------------------------------

  static boolean onSegment(long[] p, long[] q, long[] r) {
    // r is known to be collinear with p and q; is it between them?
    return Math.min(p[0], q[0]) <= r[0] && r[0] <= Math.max(p[0], q[0])
        && Math.min(p[1], q[1]) <= r[1] && r[1] <= Math.max(p[1], q[1]);
  }

  static boolean intersects(long[] p1, long[] p2, long[] p3, long[] p4) {
    int d1 = sign(cross(p3, p4, p1));
    int d2 = sign(cross(p3, p4, p2));
    int d3 = sign(cross(p1, p2, p3));
    int d4 = sign(cross(p1, p2, p4));
    if (d1 * d2 < 0 && d3 * d4 < 0) {
      return true; // the general case: they properly cross
    }
    if (d1 == 0 && onSegment(p3, p4, p1)) {
      return true; // the rest: an endpoint lies on the other
    }
    if (d2 == 0 && onSegment(p3, p4, p2)) {
      return true;
    }
    if (d3 == 0 && onSegment(p1, p2, p3)) {
      return true;
    }
    return d4 == 0 && onSegment(p1, p2, p4);
  }

  static boolean intersectsGeneralCaseOnly(long[] p1, long[] p2, long[] p3, long[] p4) {
    int d1 = sign(cross(p3, p4, p1));
    int d2 = sign(cross(p3, p4, p2));
    int d3 = sign(cross(p1, p2, p3));
    int d4 = sign(cross(p1, p2, p4));
    return d1 * d2 < 0 && d3 * d4 < 0;
  }

  static boolean intersectsByParameters(long[] p1, long[] p2, long[] p3, long[] p4) {
    // solve p1 + t(p2 - p1) = p3 + u(p4 - p3) with t, u in [0, 1], in integers
    long rx = p2[0] - p1[0];
    long ry = p2[1] - p1[1];
    long sx = p4[0] - p3[0];
    long sy = p4[1] - p3[1];
    long qx = p3[0] - p1[0];
    long qy = p3[1] - p1[1];
    long denom = rx * sy - ry * sx;
    long tNum = qx * sy - qy * sx;
    long uNum = qx * ry - qy * rx;
    if (denom != 0) {
      if (denom < 0) {
        denom = -denom;
        tNum = -tNum;
        uNum = -uNum;
      }
      return tNum >= 0 && tNum <= denom && uNum >= 0 && uNum <= denom;
    }
    if (tNum != 0 || uNum != 0) {
      return false; // parallel, on different lines
    }
    // collinear: project onto whichever axis the first segment varies along
    int axis = rx != 0 ? 0 : 1;
    long a0 = Math.min(p1[axis], p2[axis]);
    long a1 = Math.max(p1[axis], p2[axis]);
    long b0 = Math.min(p3[axis], p4[axis]);
    long b1 = Math.max(p3[axis], p4[axis]);
    return Math.max(a0, b0) <= Math.min(a1, b1);
  }

  // --- convex hull ---------------------------------------------------------

  static int byXThenY(long[] a, long[] b) {
    return a[0] != b[0] ? Long.compare(a[0], b[0]) : Long.compare(a[1], b[1]);
  }

  static List<long[]> monotoneChain(List<long[]> points) {
    List<long[]> pts = new ArrayList<>(points);
    pts.sort(Main::byXThenY);
    if (pts.size() <= 2) {
      return pts;
    }
    List<long[]> lower = new ArrayList<>();
    for (long[] p : pts) {
      while (lower.size() >= 2
          && cross(lower.get(lower.size() - 2), lower.get(lower.size() - 1), p) <= 0) {
        lower.remove(lower.size() - 1);
      }
      lower.add(p);
    }
    List<long[]> upper = new ArrayList<>();
    for (int i = pts.size() - 1; i >= 0; i--) {
      long[] p = pts.get(i);
      while (upper.size() >= 2
          && cross(upper.get(upper.size() - 2), upper.get(upper.size() - 1), p) <= 0) {
        upper.remove(upper.size() - 1);
      }
      upper.add(p);
    }
    List<long[]> hull = new ArrayList<>(lower.subList(0, lower.size() - 1));
    hull.addAll(upper.subList(0, upper.size() - 1)); // counter-clockwise, no repeated ends
    return hull;
  }

  static boolean samePoint(long[] a, long[] b) {
    return a[0] == b[0] && a[1] == b[1];
  }

  static List<long[]> giftWrapping(List<long[]> points) {
    if (points.size() <= 2) {
      List<long[]> sorted = new ArrayList<>(points);
      sorted.sort(Main::byXThenY);
      return sorted;
    }
    long[] start = points.get(0);
    for (long[] p : points) {
      if (byXThenY(p, start) < 0) {
        start = p;
      }
    }
    List<long[]> hull = new ArrayList<>();
    long[] p = start;
    while (true) {
      hull.add(p);
      long[] q = samePoint(points.get(0), p) ? points.get(1) : points.get(0);
      for (long[] r : points) {
        if (samePoint(r, p)) {
          continue;
        }
        long c = cross(p, q, r);
        long farR = (r[0] - p[0]) * (r[0] - p[0]) + (r[1] - p[1]) * (r[1] - p[1]);
        long farQ = (q[0] - p[0]) * (q[0] - p[0]) + (q[1] - p[1]) * (q[1] - p[1]);
        if (c < 0 || (c == 0 && farR > farQ)) {
          q = r; // r is further clockwise, or further along
        }
      }
      p = q;
      if (samePoint(p, start)) {
        return hull;
      }
    }
  }

  static long doubledArea(List<long[]> hull) {
    long total = 0;
    for (int i = 0; i < hull.size(); i++) {
      long[] a = hull.get(i);
      long[] b = hull.get((i + 1) % hull.size());
      total += a[0] * b[1] - a[1] * b[0];
    }
    return Math.abs(total);
  }

  static boolean isValidHull(List<long[]> hull, List<long[]> points) {
    // strictly convex, and every point inside or on the boundary
    if (hull.size() < 3) {
      return true;
    }
    for (int i = 0; i < hull.size(); i++) {
      long[] a = hull.get(i);
      long[] b = hull.get((i + 1) % hull.size());
      long[] c = hull.get((i + 2) % hull.size());
      if (cross(a, b, c) <= 0) {
        return false;
      }
      for (long[] p : points) {
        if (cross(a, b, p) < 0) {
          return false;
        }
      }
    }
    return true;
  }

  // The same linear congruential generator in every language, so the points
  // below are the same points whichever translation is run.
  static long seed = 10300057L;

  static long rand(long n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return seed / 65536L % n;
  }

  static long[] randomPoint(long limit) {
    long x = rand(limit);
    long y = rand(limit);
    return new long[] {x, y};
  }

  // distinct points, in the order they were first drawn
  static void addPoint(Set<String> seen, List<long[]> list, long[] p) {
    if (seen.add(p[0] + "," + p[1])) {
      list.add(p);
    }
  }

  public static void main(String[] args) {
    final int pairs = 20000;
    int agree = 0;
    int generalWrong = 0;
    for (int t = 0; t < pairs; t++) {
      List<long[]> ends = new ArrayList<>();
      while (ends.size() < 4) {
        long[] a = randomPoint(5);
        long[] b = randomPoint(5);
        if (!samePoint(a, b)) {
          ends.add(a);
          ends.add(b);
        }
      }
      boolean full = intersects(ends.get(0), ends.get(1), ends.get(2), ends.get(3));
      if (full == intersectsByParameters(ends.get(0), ends.get(1), ends.get(2), ends.get(3))) {
        agree += 1;
      }
      if (full != intersectsGeneralCaseOnly(ends.get(0), ends.get(1), ends.get(2), ends.get(3))) {
        generalWrong += 1;
      }
    }
    System.out.printf("%d random segment pairs on a 5 x 5 grid%n", pairs);
    System.out.println("  orientation test agreed with solving for the parameters  " + agree);
    System.out.println("  pairs the general-case-only test got wrong                " + generalWrong);
    System.out.println();

    final int hulls = 1000;
    int valid = 0;
    int same = 0;
    for (int t = 0; t < hulls; t++) {
      long count = 3 + rand(30);
      Set<String> seen = new HashSet<>();
      List<long[]> points = new ArrayList<>();
      for (int i = 0; i < count; i++) {
        addPoint(seen, points, randomPoint(20));
      }
      List<long[]> a = monotoneChain(points);
      List<long[]> b = giftWrapping(points);
      if (isValidHull(a, points)) {
        valid += 1;
      }
      if (a.size() == b.size() && doubledArea(a) == doubledArea(b)) {
        same += 1;
      }
    }
    System.out.printf("%d random point sets on a 20 x 20 grid%n", hulls);
    System.out.println("  monotone chain hull strictly convex and containing every point  " + valid);
    System.out.println("  same vertex count and area as gift wrapping                     " + same);
    System.out.println();
    System.out.println("         n   points                 hull size   monotone chain   gift wrapping");
    int[] sizes = {500, 1000, 2000};
    for (int n : sizes) {
      Set<String> seen = new HashSet<>();
      List<long[]> square = new ArrayList<>();
      while (square.size() < n) {
        addPoint(seen, square, randomPoint(1000000));
      }
      List<long[]> parabola = new ArrayList<>();
      for (long i = 0; i < n; i++) {
        parabola.add(new long[] {i, i * i});
      }
      String[] names = {"random in a square", "on a parabola"};
      List<List<long[]>> inputs = List.of(square, parabola);
      for (int k = 0; k < 2; k++) {
        work = 0;
        List<long[]> hull = monotoneChain(inputs.get(k));
        long chain = work;
        work = 0;
        giftWrapping(inputs.get(k));
        System.out.printf("%10d   %-22s %9d %16d %15d%n", n, names[k], hull.size(), chain, work);
      }
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Three geometric primitives on integer coordinates, each built on one
// function: the orientation of three points. Segment intersection is checked
// against a second method, the convex hull against a second algorithm, and
// the orientation tests each hull algorithm spends are counted.

#include <algorithm>
#include <cstdio>
#include <cstdlib>
#include <set>
#include <string>
#include <utility>
#include <vector>

typedef std::pair<long long, long long> Point;

long long work = 0;

long long cross(const Point& o, const Point& a, const Point& b) {
  // > 0: o -> a -> b turns left; < 0: right; 0: the three are collinear
  work += 1;
  return (a.first - o.first) * (b.second - o.second) - (a.second - o.second) * (b.first - o.first);
}

int sign(long long x) {
  return (x > 0) - (x < 0);
}

// --- segment intersection ------------------------------------------------

bool onSegment(const Point& p, const Point& q, const Point& r) {
  // r is known to be collinear with p and q; is it between them?
  return std::min(p.first, q.first) <= r.first && r.first <= std::max(p.first, q.first) &&
         std::min(p.second, q.second) <= r.second && r.second <= std::max(p.second, q.second);
}

bool intersects(const Point& p1, const Point& p2, const Point& p3, const Point& p4) {
  int d1 = sign(cross(p3, p4, p1));
  int d2 = sign(cross(p3, p4, p2));
  int d3 = sign(cross(p1, p2, p3));
  int d4 = sign(cross(p1, p2, p4));
  if (d1 * d2 < 0 && d3 * d4 < 0) {
    return true;  // the general case: they properly cross
  }
  if (d1 == 0 && onSegment(p3, p4, p1)) {
    return true;  // the rest: an endpoint lies on the other
  }
  if (d2 == 0 && onSegment(p3, p4, p2)) {
    return true;
  }
  if (d3 == 0 && onSegment(p1, p2, p3)) {
    return true;
  }
  return d4 == 0 && onSegment(p1, p2, p4);
}

bool intersectsGeneralCaseOnly(const Point& p1, const Point& p2, const Point& p3, const Point& p4) {
  int d1 = sign(cross(p3, p4, p1));
  int d2 = sign(cross(p3, p4, p2));
  int d3 = sign(cross(p1, p2, p3));
  int d4 = sign(cross(p1, p2, p4));
  return d1 * d2 < 0 && d3 * d4 < 0;
}

bool intersectsByParameters(const Point& p1, const Point& p2, const Point& p3, const Point& p4) {
  // solve p1 + t(p2 - p1) = p3 + u(p4 - p3) with t, u in [0, 1], in integers
  long long rx = p2.first - p1.first;
  long long ry = p2.second - p1.second;
  long long sx = p4.first - p3.first;
  long long sy = p4.second - p3.second;
  long long qx = p3.first - p1.first;
  long long qy = p3.second - p1.second;
  long long denom = rx * sy - ry * sx;
  long long tNum = qx * sy - qy * sx;
  long long uNum = qx * ry - qy * rx;
  if (denom != 0) {
    if (denom < 0) {
      denom = -denom;
      tNum = -tNum;
      uNum = -uNum;
    }
    return tNum >= 0 && tNum <= denom && uNum >= 0 && uNum <= denom;
  }
  if (tNum != 0 || uNum != 0) {
    return false;  // parallel, on different lines
  }
  // collinear: project onto whichever axis the first segment varies along
  bool useX = rx != 0;
  long long a0 = useX ? std::min(p1.first, p2.first) : std::min(p1.second, p2.second);
  long long a1 = useX ? std::max(p1.first, p2.first) : std::max(p1.second, p2.second);
  long long b0 = useX ? std::min(p3.first, p4.first) : std::min(p3.second, p4.second);
  long long b1 = useX ? std::max(p3.first, p4.first) : std::max(p3.second, p4.second);
  return std::max(a0, b0) <= std::min(a1, b1);
}

// --- convex hull ---------------------------------------------------------

std::vector<Point> monotoneChain(const std::vector<Point>& points) {
  std::vector<Point> pts = points;
  std::sort(pts.begin(), pts.end());
  if (pts.size() <= 2) {
    return pts;
  }
  std::vector<Point> lower;
  for (const Point& p : pts) {
    while (lower.size() >= 2 && cross(lower[lower.size() - 2], lower[lower.size() - 1], p) <= 0) {
      lower.pop_back();
    }
    lower.push_back(p);
  }
  std::vector<Point> upper;
  for (int i = (int)pts.size() - 1; i >= 0; i--) {
    const Point& p = pts[i];
    while (upper.size() >= 2 && cross(upper[upper.size() - 2], upper[upper.size() - 1], p) <= 0) {
      upper.pop_back();
    }
    upper.push_back(p);
  }
  std::vector<Point> hull(lower.begin(), lower.end() - 1);
  hull.insert(hull.end(), upper.begin(), upper.end() - 1);  // counter-clockwise, no repeated ends
  return hull;
}

std::vector<Point> giftWrapping(const std::vector<Point>& points) {
  if (points.size() <= 2) {
    std::vector<Point> sorted = points;
    std::sort(sorted.begin(), sorted.end());
    return sorted;
  }
  Point start = *std::min_element(points.begin(), points.end());
  std::vector<Point> hull;
  Point p = start;
  while (true) {
    hull.push_back(p);
    Point q = points[0] == p ? points[1] : points[0];
    for (const Point& r : points) {
      if (r == p) {
        continue;
      }
      long long c = cross(p, q, r);
      long long dxr = r.first - p.first;
      long long dyr = r.second - p.second;
      long long dxq = q.first - p.first;
      long long dyq = q.second - p.second;
      if (c < 0 || (c == 0 && dxr * dxr + dyr * dyr > dxq * dxq + dyq * dyq)) {
        q = r;  // r is further clockwise, or further along
      }
    }
    p = q;
    if (p == start) {
      return hull;
    }
  }
}

long long doubledArea(const std::vector<Point>& hull) {
  long long total = 0;
  for (size_t i = 0; i < hull.size(); i++) {
    const Point& a = hull[i];
    const Point& b = hull[(i + 1) % hull.size()];
    total += a.first * b.second - a.second * b.first;
  }
  return std::llabs(total);
}

bool isValidHull(const std::vector<Point>& hull, const std::vector<Point>& points) {
  // strictly convex, and every point inside or on the boundary
  if (hull.size() < 3) {
    return true;
  }
  for (size_t i = 0; i < hull.size(); i++) {
    const Point& a = hull[i];
    const Point& b = hull[(i + 1) % hull.size()];
    const Point& c = hull[(i + 2) % hull.size()];
    if (cross(a, b, c) <= 0) {
      return false;
    }
    for (const Point& p : points) {
      if (cross(a, b, p) < 0) {
        return false;
      }
    }
  }
  return true;
}

// The same linear congruential generator in every language, so the points
// below are the same points whichever translation is run.
long long seed = 10300057LL;

long long rand_below(long long n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return seed / 65536LL % n;
}

Point randomPoint(long long limit) {
  long long x = rand_below(limit);
  long long y = rand_below(limit);
  return Point(x, y);
}

// distinct points, in the order they were first drawn
void addPoint(std::set<Point>& seen, std::vector<Point>& list, const Point& p) {
  if (seen.insert(p).second) {
    list.push_back(p);
  }
}

int main() {
  const int pairs = 20000;
  int agree = 0;
  int generalWrong = 0;
  for (int t = 0; t < pairs; t++) {
    std::vector<Point> ends;
    while (ends.size() < 4) {
      Point a = randomPoint(5);
      Point b = randomPoint(5);
      if (a != b) {
        ends.push_back(a);
        ends.push_back(b);
      }
    }
    bool full = intersects(ends[0], ends[1], ends[2], ends[3]);
    if (full == intersectsByParameters(ends[0], ends[1], ends[2], ends[3])) {
      agree += 1;
    }
    if (full != intersectsGeneralCaseOnly(ends[0], ends[1], ends[2], ends[3])) {
      generalWrong += 1;
    }
  }
  std::printf("%d random segment pairs on a 5 x 5 grid\\n", pairs);
  std::printf("  orientation test agreed with solving for the parameters  %d\\n", agree);
  std::printf("  pairs the general-case-only test got wrong                %d\\n", generalWrong);
  std::printf("\\n");

  const int hulls = 1000;
  int valid = 0;
  int same = 0;
  for (int t = 0; t < hulls; t++) {
    long long count = 3 + rand_below(30);
    std::set<Point> seen;
    std::vector<Point> points;
    for (long long i = 0; i < count; i++) {
      addPoint(seen, points, randomPoint(20));
    }
    std::vector<Point> a = monotoneChain(points);
    std::vector<Point> b = giftWrapping(points);
    if (isValidHull(a, points)) {
      valid += 1;
    }
    if (a.size() == b.size() && doubledArea(a) == doubledArea(b)) {
      same += 1;
    }
  }
  std::printf("%d random point sets on a 20 x 20 grid\\n", hulls);
  std::printf("  monotone chain hull strictly convex and containing every point  %d\\n", valid);
  std::printf("  same vertex count and area as gift wrapping                     %d\\n", same);
  std::printf("\\n");
  std::printf("         n   points                 hull size   monotone chain   gift wrapping\\n");
  int sizes[3] = {500, 1000, 2000};
  for (int n : sizes) {
    std::set<Point> seen;
    std::vector<Point> square;
    while ((int)square.size() < n) {
      addPoint(seen, square, randomPoint(1000000));
    }
    std::vector<Point> parabola;
    for (long long i = 0; i < n; i++) {
      parabola.push_back(Point(i, i * i));
    }
    std::vector<std::pair<std::string, std::vector<Point> > > inputs = {
        {"random in a square", square},
        {"on a parabola", parabola},
    };
    for (const std::pair<std::string, std::vector<Point> >& input : inputs) {
      work = 0;
      std::vector<Point> hull = monotoneChain(input.second);
      long long chain = work;
      work = 0;
      giftWrapping(input.second);
      std::printf("%10d   %-22s %9d %16lld %15lld\\n", n, input.first.c_str(), (int)hull.size(),
                  chain, work);
    }
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Three geometric primitives on integer coordinates, each built on one
// function: the orientation of three points. Segment intersection is checked
// against a second method, the convex hull against a second algorithm, and
// the orientation tests each hull algorithm spends are counted.

use std::collections::HashSet;

type Point = (i64, i64);

static mut WORK: i64 = 0;

fn take_work() -> i64 {
    unsafe {
        let spent = WORK;
        WORK = 0;
        spent
    }
}

fn cross(o: Point, a: Point, b: Point) -> i64 {
    // > 0: o -> a -> b turns left; < 0: right; 0: the three are collinear
    unsafe {
        WORK += 1;
    }
    (a.0 - o.0) * (b.1 - o.1) - (a.1 - o.1) * (b.0 - o.0)
}

// --- segment intersection ------------------------------------------------

fn on_segment(p: Point, q: Point, r: Point) -> bool {
    // r is known to be collinear with p and q; is it between them?
    p.0.min(q.0) <= r.0 && r.0 <= p.0.max(q.0) && p.1.min(q.1) <= r.1 && r.1 <= p.1.max(q.1)
}

fn intersects(p1: Point, p2: Point, p3: Point, p4: Point) -> bool {
    let d1 = cross(p3, p4, p1).signum();
    let d2 = cross(p3, p4, p2).signum();
    let d3 = cross(p1, p2, p3).signum();
    let d4 = cross(p1, p2, p4).signum();
    if d1 * d2 < 0 && d3 * d4 < 0 {
        return true; // the general case: they properly cross
    }
    if d1 == 0 && on_segment(p3, p4, p1) {
        return true; // the rest: an endpoint lies on the other
    }
    if d2 == 0 && on_segment(p3, p4, p2) {
        return true;
    }
    if d3 == 0 && on_segment(p1, p2, p3) {
        return true;
    }
    d4 == 0 && on_segment(p1, p2, p4)
}

fn intersects_general_case_only(p1: Point, p2: Point, p3: Point, p4: Point) -> bool {
    let d1 = cross(p3, p4, p1).signum();
    let d2 = cross(p3, p4, p2).signum();
    let d3 = cross(p1, p2, p3).signum();
    let d4 = cross(p1, p2, p4).signum();
    d1 * d2 < 0 && d3 * d4 < 0
}

fn intersects_by_parameters(p1: Point, p2: Point, p3: Point, p4: Point) -> bool {
    // solve p1 + t(p2 - p1) = p3 + u(p4 - p3) with t, u in [0, 1], in integers
    let (rx, ry) = (p2.0 - p1.0, p2.1 - p1.1);
    let (sx, sy) = (p4.0 - p3.0, p4.1 - p3.1);
    let (qx, qy) = (p3.0 - p1.0, p3.1 - p1.1);
    let mut denom = rx * sy - ry * sx;
    let mut t_num = qx * sy - qy * sx;
    let mut u_num = qx * ry - qy * rx;
    if denom != 0 {
        if denom < 0 {
            denom = -denom;
            t_num = -t_num;
            u_num = -u_num;
        }
        return t_num >= 0 && t_num <= denom && u_num >= 0 && u_num <= denom;
    }
    if t_num != 0 || u_num != 0 {
        return false; // parallel, on different lines
    }
    // collinear: project onto whichever axis the first segment varies along
    let pick = |p: Point| if rx != 0 { p.0 } else { p.1 };
    let (a0, a1) = (pick(p1).min(pick(p2)), pick(p1).max(pick(p2)));
    let (b0, b1) = (pick(p3).min(pick(p4)), pick(p3).max(pick(p4)));
    a0.max(b0) <= a1.min(b1)
}

// --- convex hull ---------------------------------------------------------

fn monotone_chain(points: &[Point]) -> Vec<Point> {
    let mut pts = points.to_vec();
    pts.sort();
    if pts.len() <= 2 {
        return pts;
    }
    let mut lower: Vec<Point> = Vec::new();
    for &p in pts.iter() {
        while lower.len() >= 2 && cross(lower[lower.len() - 2], lower[lower.len() - 1], p) <= 0 {
            lower.pop();
        }
        lower.push(p);
    }
    let mut upper: Vec<Point> = Vec::new();
    for &p in pts.iter().rev() {
        while upper.len() >= 2 && cross(upper[upper.len() - 2], upper[upper.len() - 1], p) <= 0 {
            upper.pop();
        }
        upper.push(p);
    }
    lower.pop();
    upper.pop();
    lower.extend(upper); // counter-clockwise, no repeated ends
    lower
}

fn gift_wrapping(points: &[Point]) -> Vec<Point> {
    if points.len() <= 2 {
        let mut sorted = points.to_vec();
        sorted.sort();
        return sorted;
    }
    let start = *points.iter().min().unwrap();
    let mut hull = Vec::new();
    let mut p = start;
    loop {
        hull.push(p);
        let mut q = if points[0] == p { points[1] } else { points[0] };
        for &r in points.iter() {
            if r == p {
                continue;
            }
            let c = cross(p, q, r);
            let far_r = (r.0 - p.0).pow(2) + (r.1 - p.1).pow(2);
            let far_q = (q.0 - p.0).pow(2) + (q.1 - p.1).pow(2);
            if c < 0 || (c == 0 && far_r > far_q) {
                q = r; // r is further clockwise, or further along
            }
        }
        p = q;
        if p == start {
            return hull;
        }
    }
}

fn doubled_area(hull: &[Point]) -> i64 {
    let mut total = 0;
    for i in 0..hull.len() {
        let a = hull[i];
        let b = hull[(i + 1) % hull.len()];
        total += a.0 * b.1 - a.1 * b.0;
    }
    total.abs()
}

fn is_valid_hull(hull: &[Point], points: &[Point]) -> bool {
    // strictly convex, and every point inside or on the boundary
    if hull.len() < 3 {
        return true;
    }
    for i in 0..hull.len() {
        let a = hull[i];
        let b = hull[(i + 1) % hull.len()];
        let c = hull[(i + 2) % hull.len()];
        if cross(a, b, c) <= 0 {
            return false;
        }
        for &p in points.iter() {
            if cross(a, b, p) < 0 {
                return false;
            }
        }
    }
    true
}

// The same linear congruential generator in every language, so the points
// below are the same points whichever translation is run.
static mut SEED: i64 = 10300057;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn random_point(limit: i64) -> Point {
    let x = rand_below(limit);
    let y = rand_below(limit);
    (x, y)
}

// distinct points, in the order they were first drawn
fn add_point(seen: &mut HashSet<Point>, list: &mut Vec<Point>, p: Point) {
    if seen.insert(p) {
        list.push(p);
    }
}

fn main() {
    let pairs = 20000;
    let mut agree = 0;
    let mut general_wrong = 0;
    for _ in 0..pairs {
        let mut ends: Vec<Point> = Vec::new();
        while ends.len() < 4 {
            let a = random_point(5);
            let b = random_point(5);
            if a != b {
                ends.push(a);
                ends.push(b);
            }
        }
        let full = intersects(ends[0], ends[1], ends[2], ends[3]);
        if full == intersects_by_parameters(ends[0], ends[1], ends[2], ends[3]) {
            agree += 1;
        }
        if full != intersects_general_case_only(ends[0], ends[1], ends[2], ends[3]) {
            general_wrong += 1;
        }
    }
    println!("{} random segment pairs on a 5 x 5 grid", pairs);
    println!("  orientation test agreed with solving for the parameters  {}", agree);
    println!("  pairs the general-case-only test got wrong                {}", general_wrong);
    println!();

    let hulls = 1000;
    let mut valid = 0;
    let mut same = 0;
    for _ in 0..hulls {
        let count = 3 + rand_below(30);
        let mut seen = HashSet::new();
        let mut points = Vec::new();
        for _ in 0..count {
            add_point(&mut seen, &mut points, random_point(20));
        }
        let a = monotone_chain(&points);
        let b = gift_wrapping(&points);
        if is_valid_hull(&a, &points) {
            valid += 1;
        }
        if a.len() == b.len() && doubled_area(&a) == doubled_area(&b) {
            same += 1;
        }
    }
    println!("{} random point sets on a 20 x 20 grid", hulls);
    println!("  monotone chain hull strictly convex and containing every point  {}", valid);
    println!("  same vertex count and area as gift wrapping                     {}", same);
    println!();
    println!("         n   points                 hull size   monotone chain   gift wrapping");
    for &n in [500i64, 1000, 2000].iter() {
        let mut seen = HashSet::new();
        let mut square = Vec::new();
        while (square.len() as i64) < n {
            add_point(&mut seen, &mut square, random_point(1000000));
        }
        let parabola: Vec<Point> = (0..n).map(|i| (i, i * i)).collect();
        for (name, points) in [("random in a square", &square), ("on a parabola", &parabola)].iter() {
            take_work();
            let hull = monotone_chain(points);
            let chain = take_work();
            gift_wrapping(points);
            let wrapping = take_work();
            println!("{:>10}   {:<22} {:>9} {:>16} {:>15}", n, name, hull.len(), chain, wrapping);
        }
    }
}
`,
            },
            {
              lang: "go",
              code: `// Three geometric primitives on integer coordinates, each built on one
// function: the orientation of three points. Segment intersection is checked
// against a second method, the convex hull against a second algorithm, and
// the orientation tests each hull algorithm spends are counted.

package main

import (
	"fmt"
	"sort"
)

type point struct{ x, y int64 }

var work int64

func cross(o, a, b point) int64 {
	// > 0: o -> a -> b turns left; < 0: right; 0: the three are collinear
	work++
	return (a.x-o.x)*(b.y-o.y) - (a.y-o.y)*(b.x-o.x)
}

func sign(x int64) int {
	if x > 0 {
		return 1
	}
	if x < 0 {
		return -1
	}
	return 0
}

// --- segment intersection ------------------------------------------------

func onSegment(p, q, r point) bool {
	// r is known to be collinear with p and q; is it between them?
	return min(p.x, q.x) <= r.x && r.x <= max(p.x, q.x) && min(p.y, q.y) <= r.y && r.y <= max(p.y, q.y)
}

func intersects(p1, p2, p3, p4 point) bool {
	d1 := sign(cross(p3, p4, p1))
	d2 := sign(cross(p3, p4, p2))
	d3 := sign(cross(p1, p2, p3))
	d4 := sign(cross(p1, p2, p4))
	if d1*d2 < 0 && d3*d4 < 0 {
		return true // the general case: they properly cross
	}
	if d1 == 0 && onSegment(p3, p4, p1) {
		return true // the rest: an endpoint lies on the other
	}
	if d2 == 0 && onSegment(p3, p4, p2) {
		return true
	}
	if d3 == 0 && onSegment(p1, p2, p3) {
		return true
	}
	return d4 == 0 && onSegment(p1, p2, p4)
}

func intersectsGeneralCaseOnly(p1, p2, p3, p4 point) bool {
	d1 := sign(cross(p3, p4, p1))
	d2 := sign(cross(p3, p4, p2))
	d3 := sign(cross(p1, p2, p3))
	d4 := sign(cross(p1, p2, p4))
	return d1*d2 < 0 && d3*d4 < 0
}

func intersectsByParameters(p1, p2, p3, p4 point) bool {
	// solve p1 + t(p2 - p1) = p3 + u(p4 - p3) with t, u in [0, 1], in integers
	rx, ry := p2.x-p1.x, p2.y-p1.y
	sx, sy := p4.x-p3.x, p4.y-p3.y
	qx, qy := p3.x-p1.x, p3.y-p1.y
	denom := rx*sy - ry*sx
	tNum := qx*sy - qy*sx
	uNum := qx*ry - qy*rx
	if denom != 0 {
		if denom < 0 {
			denom, tNum, uNum = -denom, -tNum, -uNum
		}
		return tNum >= 0 && tNum <= denom && uNum >= 0 && uNum <= denom
	}
	if tNum != 0 || uNum != 0 {
		return false // parallel, on different lines
	}
	// collinear: project onto whichever axis the first segment varies along
	pick := func(p point) int64 {
		if rx != 0 {
			return p.x
		}
		return p.y
	}
	a0, a1 := min(pick(p1), pick(p2)), max(pick(p1), pick(p2))
	b0, b1 := min(pick(p3), pick(p4)), max(pick(p3), pick(p4))
	return max(a0, b0) <= min(a1, b1)
}

// --- convex hull ---------------------------------------------------------

func less(a, b point) bool {
	if a.x != b.x {
		return a.x < b.x
	}
	return a.y < b.y
}

func monotoneChain(points []point) []point {
	pts := append([]point{}, points...)
	sort.Slice(pts, func(i, j int) bool { return less(pts[i], pts[j]) })
	if len(pts) <= 2 {
		return pts
	}
	lower := []point{}
	for _, p := range pts {
		for len(lower) >= 2 && cross(lower[len(lower)-2], lower[len(lower)-1], p) <= 0 {
			lower = lower[:len(lower)-1]
		}
		lower = append(lower, p)
	}
	upper := []point{}
	for i := len(pts) - 1; i >= 0; i-- {
		p := pts[i]
		for len(upper) >= 2 && cross(upper[len(upper)-2], upper[len(upper)-1], p) <= 0 {
			upper = upper[:len(upper)-1]
		}
		upper = append(upper, p)
	}
	return append(lower[:len(lower)-1], upper[:len(upper)-1]...) // counter-clockwise, no repeated ends
}

func giftWrapping(points []point) []point {
	if len(points) <= 2 {
		sorted := append([]point{}, points...)
		sort.Slice(sorted, func(i, j int) bool { return less(sorted[i], sorted[j]) })
		return sorted
	}
	start := points[0]
	for _, p := range points {
		if less(p, start) {
			start = p
		}
	}
	hull := []point{}
	p := start
	for {
		hull = append(hull, p)
		q := points[0]
		if q == p {
			q = points[1]
		}
		for _, r := range points {
			if r == p {
				continue
			}
			c := cross(p, q, r)
			farR := (r.x-p.x)*(r.x-p.x) + (r.y-p.y)*(r.y-p.y)
			farQ := (q.x-p.x)*(q.x-p.x) + (q.y-p.y)*(q.y-p.y)
			if c < 0 || (c == 0 && farR > farQ) {
				q = r // r is further clockwise, or further along
			}
		}
		p = q
		if p == start {
			return hull
		}
	}
}

func doubledArea(hull []point) int64 {
	var total int64
	for i := range hull {
		a := hull[i]
		b := hull[(i+1)%len(hull)]
		total += a.x*b.y - a.y*b.x
	}
	if total < 0 {
		return -total
	}
	return total
}

func isValidHull(hull, points []point) bool {
	// strictly convex, and every point inside or on the boundary
	if len(hull) < 3 {
		return true
	}
	for i := range hull {
		a := hull[i]
		b := hull[(i+1)%len(hull)]
		c := hull[(i+2)%len(hull)]
		if cross(a, b, c) <= 0 {
			return false
		}
		for _, p := range points {
			if cross(a, b, p) < 0 {
				return false
			}
		}
	}
	return true
}

// The same linear congruential generator in every language, so the points
// below are the same points whichever translation is run.
var seed int64 = 10300057

func randBelow(n int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % n
}

func randomPoint(limit int64) point {
	x := randBelow(limit)
	y := randBelow(limit)
	return point{x, y}
}

// distinct points, in the order they were first drawn
func addPoint(seen map[point]bool, list []point, p point) []point {
	if !seen[p] {
		seen[p] = true
		list = append(list, p)
	}
	return list
}

func main() {
	const pairs = 20000
	agree := 0
	generalWrong := 0
	for t := 0; t < pairs; t++ {
		ends := []point{}
		for len(ends) < 4 {
			a := randomPoint(5)
			b := randomPoint(5)
			if a != b {
				ends = append(ends, a, b)
			}
		}
		full := intersects(ends[0], ends[1], ends[2], ends[3])
		if full == intersectsByParameters(ends[0], ends[1], ends[2], ends[3]) {
			agree++
		}
		if full != intersectsGeneralCaseOnly(ends[0], ends[1], ends[2], ends[3]) {
			generalWrong++
		}
	}
	fmt.Printf("%d random segment pairs on a 5 x 5 grid\\n", pairs)
	fmt.Printf("  orientation test agreed with solving for the parameters  %d\\n", agree)
	fmt.Printf("  pairs the general-case-only test got wrong                %d\\n", generalWrong)
	fmt.Println()

	const hulls = 1000
	valid := 0
	same := 0
	for t := 0; t < hulls; t++ {
		count := 3 + randBelow(30)
		seen := map[point]bool{}
		points := []point{}
		for i := int64(0); i < count; i++ {
			points = addPoint(seen, points, randomPoint(20))
		}
		a := monotoneChain(points)
		b := giftWrapping(points)
		if isValidHull(a, points) {
			valid++
		}
		if len(a) == len(b) && doubledArea(a) == doubledArea(b) {
			same++
		}
	}
	fmt.Printf("%d random point sets on a 20 x 20 grid\\n", hulls)
	fmt.Printf("  monotone chain hull strictly convex and containing every point  %d\\n", valid)
	fmt.Printf("  same vertex count and area as gift wrapping                     %d\\n", same)
	fmt.Println()
	fmt.Println("         n   points                 hull size   monotone chain   gift wrapping")
	for _, n := range []int{500, 1000, 2000} {
		seen := map[point]bool{}
		square := []point{}
		for len(square) < n {
			square = addPoint(seen, square, randomPoint(1000000))
		}
		parabola := []point{}
		for i := int64(0); i < int64(n); i++ {
			parabola = append(parabola, point{i, i * i})
		}
		names := []string{"random in a square", "on a parabola"}
		for k, points := range [][]point{square, parabola} {
			work = 0
			hull := monotoneChain(points)
			chain := work
			work = 0
			giftWrapping(points)
			fmt.Printf("%10d   %-22s %9d %16d %15d\\n", n, names[k], len(hull), chain, work)
		}
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "convex-hull",
      heading: "Convex hull",
      body: [
        "The convex hull is the smallest convex polygon containing every point. Two algorithms, with different cost shapes.",
        "**Monotone chain.** Sort points by x, then y. Sweep left to right building the lower hull: append each point, but first pop the last point while the last two points and the new one do not make a left turn. Sweep right to left the same way for the upper hull. Joined, they are the hull in counter-clockwise order. Each point is pushed once and popped at most once, so after the `O(n log n)` sort the sweep costs about `2n` orientation tests \u2014 which is what the table shows.",
        "**Gift wrapping.** Start from the lowest point. From the current hull point, scan every other point for the one that has all others to its left; that is the next hull point. Repeat until back at the start. Each step costs `n`, and there are `h` steps for a hull of `h` points: `O(nh)`. That is excellent when the hull is small \u2014 a random square gave hulls of 13 to 18 points \u2014 and quadratic when every point is on the hull.",
        "**Collinear points on the hull boundary** are the usual source of bugs. Popping on `<= 0` (not a strict left turn) drops them, as here; popping on `< 0` keeps them. Pick one deliberately, because gift wrapping must make the same choice \u2014 here by taking the farthest of several collinear candidates \u2014 or the two algorithms disagree.",
      ],
      pitfalls: [
        {
          title: "Testing only proper crossings",
          body: "Measured: wrong on 4,530 of 20,000 pairs. Handle each zero orientation with an on-segment check.",
        },
        {
          title: "Floating-point coordinates in orientation tests",
          body: "A nearly collinear triple can get the wrong sign from rounding, and a hull algorithm fed inconsistent answers can loop or produce a non-convex polygon. Use integers, or exact rationals, whenever inputs allow.",
        },
        {
          title: "Duplicate points",
          body: "Both hull algorithms assume distinct points. Remove duplicates first, as the program does.",
        },
      ],
    },
    {
      id: "more-primitives",
      heading: "Other primitives from the same function",
      body: [
        "**Polygon area.** The shoelace formula sums cross products of consecutive vertices: twice the signed area is the sum of `x_i\u00b7y_(i+1) - x_(i+1)\u00b7y_i`. The sign gives the vertex order; the absolute value halved gives the area. The program uses it to compare hulls.",
        "**Point in a convex polygon.** The point is inside if it is on the left of every edge taken counter-clockwise, which is `n` orientation tests, or `O(log n)` with a binary search over the fan of triangles from one vertex.",
        "**Point in an arbitrary polygon.** Cast a ray to the right and count edge crossings; odd means inside. The edge cases are rays passing exactly through vertices, handled by counting an edge only when one endpoint is strictly above the ray and the other is on or below it.",
        "**The intersection point itself.** Deciding whether segments intersect is exact in integers. Computing where they intersect needs division: the point is `p1 + t(p2 - p1)` with `t = cross(p3 - p1, p4 - p3) / cross(p2 - p1, p4 - p3)`. Keep the numerator and denominator as integers for as long as possible, and divide only for output.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you test whether two line segments intersect?",
      answer:
        "With orientations, which are signs of cross products and exact in integers. If each segment's endpoints lie strictly on opposite sides of the other segment's line, they properly cross. Otherwise, for every orientation that is zero, check whether that endpoint lies within the other segment's bounding box -- that covers touching endpoints, T-junctions and collinear overlaps. I checked the full test against solving the two line parameters in integers on 20,000 grid pairs and they agreed on all of them; the proper-crossing test alone was wrong on 4,530.",
    },
    {
      question: "Compare monotone chain and gift wrapping for the convex hull.",
      answer:
        "Monotone chain sorts the points, then builds the lower and upper hulls with a stack, popping while the last two points and the new one fail to turn left. After the O(n log n) sort it costs about 2n orientation tests, and I measured exactly that at every size. Gift wrapping walks the hull, scanning all n points to find each next vertex, so it is O(nh) for h hull points: 35,982 tests for a hull of 18 points at n = 2,000, but 3,998,000 when all 2,000 points were on a parabola. Gift wrapping wins only when the hull is known to be tiny; monotone chain is the default.",
    },
  ],
  takeaways: [
    "The sign of a cross product decides left turn, right turn or collinear, exactly",
    "Coordinates up to 10^9 need 64-bit cross products",
    "Proper crossing is four opposite-sign orientations; zeros need on-segment checks",
    "Measured: the proper-crossing test alone was wrong on 4,530 of 20,000 pairs",
    "Monotone chain: sort, then about 2n orientation tests",
    "Gift wrapping is O(nh): 3,998,000 tests when all 2,000 points were on the hull",
    "Decide how collinear boundary points are treated, and treat them the same everywhere",
  ],
};
