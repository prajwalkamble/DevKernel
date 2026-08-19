import type { Lesson } from "@/content/types";

export const fetchNetworkingLesson: Lesson = {
  id: "dom-fetch",
  slug: "fetch-and-networking",
  moduleSlug: "dom-browser",
  title: "fetch, Requests & Responses",
  summary:
    "The networking API the platform gives you: what fetch does and does not treat as an error, reading a body exactly once, sending JSON and form data, cancelling with AbortSignal, and the CORS rules that will eventually confuse you.",
  estimatedMinutes: 35,
  objectives: [
    "Make requests and read responses in each available format",
    "Explain why fetch does not reject on a 404 or a 500",
    "Write an error-handling wrapper that treats HTTP errors as errors",
    "Send JSON and FormData, and know which sets its own headers",
    "Cancel and time out requests with AbortSignal",
    "Explain what CORS is checking and why the failure looks like nothing",
  ],
  sections: [
    {
      id: "basics",
      heading: "The shape of a request",
      body: [
        "`fetch(url, options)` returns a promise for a `Response`. The promise resolves **as soon as the headers arrive** — before the body has downloaded. That is why reading the body is a second, separate await.",
        "A `Response` body can be read as `json()`, `text()`, `blob()`, `arrayBuffer()` or `formData()`, and each returns a promise. **You may read it once.** The body is a stream, and consuming it consumes it.",
      ],
      examples: [
        {
          id: "fetch-basic",
          title: "A request, and the two awaits",
          js: `// First await: headers have arrived.
const response = await fetch("/api/users/1");

// Second await: the body has downloaded and been parsed.
const user = await response.json();

console.log(response.ok, response.status, JSON.stringify(user));`,
          ts: `interface User {
  id: number;
  name: string;
}

const response = await fetch("/api/users/1");

// \`json()\` returns Promise<any> — TypeScript cannot know the shape,
// so this annotation is a claim you are making, not a check.
const user: User = await response.json();

console.log(response.ok, response.status, JSON.stringify(user));`,
          output: `true 200 {"id":1,"name":"Ada"}`,
          explanation:
            "Note what TypeScript does *not* do here. `response.json()` is typed as `Promise<any>`, so annotating the result silently asserts a shape the server may not have sent. If the response matters, validate it at runtime — Zod or Valibot — and let the validated type flow from that. An annotation alone is a comment the compiler happens to believe.",
        },
        {
          id: "read-once",
          title: "The body can only be read once",
          js: `const response = await fetch("/api/users/1");

await response.json();      // fine

try {
  await response.json();    // the stream is already consumed
} catch (error) {
  console.log(error.name, "|", error.message);
}

// If you genuinely need it twice, clone before reading:
//   const copy = response.clone();`,
          output: `TypeError | Body is unusable: Body has already been read`,
          explanation:
            "This bites most often in error handling: a `catch` block that tries to read the body for a message after something upstream already read it. `response.clone()` before the first read is the fix, though usually the better fix is to read once and pass the value around.",
        },
      ],
    },
    {
      id: "errors",
      heading: "fetch does not reject on HTTP errors",
      body: [
        "This is the single most important thing about `fetch`, and it catches everyone.",
        "**A 404 is a successful fetch. So is a 500.** The request went out, a response came back — as far as `fetch` is concerned, that worked. The promise only rejects when the request could not be made at all: no network, DNS failure, CORS refusal, or an abort.",
        "So `try/catch` alone does not do what you expect. You must check `response.ok` (true for statuses 200–299) yourself.",
      ],
      examples: [
        {
          id: "fetch-errors",
          title: "What actually throws, and what does not",
          js: `const missing = await fetch("/api/missing");
console.log("404 ->", missing.ok, missing.status, "| fetch did NOT throw");

const boom = await fetch("/api/boom");
console.log("500 ->", boom.ok, boom.status, JSON.stringify(await boom.text()));

// Only this rejects: the request could not be made.
try {
  await fetch("http://localhost:1/nope");
} catch (error) {
  console.log("network ->", error.name);
}`,
          output: `404 -> false 404 | fetch did NOT throw
500 -> false 500 "server error"
network -> TypeError`,
          explanation:
            "Note that a network failure throws a bare `TypeError` with a deliberately vague message. Browsers do this on purpose: a detailed reason would let a page probe your internal network. It also means \"Failed to fetch\" is the least informative error message on the web, and is almost always either CORS or a genuinely unreachable host.",
        },
        {
          id: "fetch-wrapper",
          title: "The wrapper worth writing once",
          js: `async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    // Read the body for a server-supplied message, but do not let a
    // non-JSON error page turn into a confusing parse error.
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      // ignore
    }
    throw new HttpError(response.status, response.statusText, detail);
  }

  // 204 No Content has no body; json() would throw.
  if (response.status === 204) return null;

  return response.json();
}

class HttpError extends Error {
  constructor(status, statusText, detail) {
    super(\`HTTP \${status} \${statusText}\${detail ? \`: \${detail}\` : ""}\`);
    this.name = "HttpError";
    this.status = status;
    this.detail = detail;
  }
}`,
          ts: `class HttpError extends Error {
  constructor(
    readonly status: number,
    statusText: string,
    readonly detail: string
  ) {
    super(\`HTTP \${status} \${statusText}\${detail ? \`: \${detail}\` : ""}\`);
    this.name = "HttpError";
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new HttpError(response.status, response.statusText, detail);
  }

  if (response.status === 204) return null;
  return response.json() as Promise<T>;
}

const user = await request<User>("/api/users/1");`,
          explanation:
            "Two details worth keeping. The `204` check — `json()` on an empty body throws a parse error, and 204 is the normal response to a successful DELETE. And a custom error class carrying `status`, so callers can branch on 401 versus 404 without string-matching a message.",
        },
      ],
      pitfalls: [
        {
          title: "A generic type parameter is a promise you are making",
          body: "`request<User>(…)` looks like it validates, and it does not — `<T>` only tells TypeScript what to *pretend* the value is. If the API returns something else, you get `undefined` deep inside your code with no error at the boundary. Generics on a fetch wrapper are for ergonomics; runtime validation is for correctness.",
        },
      ],
    },
    {
      id: "sending",
      heading: "Sending data",
      body: [
        "Anything other than a GET needs `method`, and usually a `body`. The rule that matters is about headers: **set `Content-Type` yourself for JSON, and never set it for `FormData`.**",
        "`FormData` sends as `multipart/form-data`, and that format requires a boundary string in the header that the browser generates. Set the header manually and you overwrite it with one that has no boundary, and the server cannot parse the request — a genuinely baffling bug the first time.",
      ],
      examples: [
        {
          id: "sending-json",
          title: "JSON and FormData",
          js: `// JSON: set the header, stringify the body.
const created = await fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Grace" }),
});
console.log(created.status, JSON.stringify(await created.json()));

// FormData: do NOT set Content-Type. The browser adds it with a boundary.
const form = new FormData(document.querySelector("#profile-form"));
form.append("avatar", fileInput.files[0]);

await fetch("/api/profile", { method: "POST", body: form });

// URL-encoded, if that is what the endpoint wants:
await fetch("/api/search", {
  method: "POST",
  body: new URLSearchParams({ q: "typescript", page: "2" }),
});`,
          output: `201 {"received":{"name":"Grace"},"contentType":"application/json"}`,
          explanation:
            "`new FormData(formElement)` collects every named field in the form, which is far less error-prone than reading inputs one by one. `URLSearchParams` sets `application/x-www-form-urlencoded` for you, the same way `FormData` sets its own type.",
        },
        {
          id: "query-params",
          title: "Building URLs without string concatenation",
          js: `// Manual concatenation breaks on the first value containing & or a space.
const params = new URLSearchParams({
  q: "hello world",
  tags: "a,b",
  page: "2",
});

const url = new URL("/api/search", location.origin);
url.search = params.toString();

console.log(url.toString());
// Reading them back, wherever you are:
console.log(new URL(location.href).searchParams.get("q"));`,
          output: `https://example.com/api/search?q=hello+world&tags=a%2Cb&page=2`,
          explanation:
            "`URLSearchParams` encodes every value correctly — note the space became `+` and the comma became `%2C`. `URL` resolves relative paths against a base, so you never have to think about whether you need a leading slash.",
        },
      ],
    },
    {
      id: "aborting",
      heading: "Cancelling and timing out",
      body: [
        "`fetch` has no timeout by default. A request against a server that has stopped responding will hang until the browser's own limit, which is measured in minutes.",
        "**`AbortSignal.timeout(ms)`** is the one-liner: it produces a signal that aborts itself after the given time. For manual cancellation — a search-as-you-type that should drop the previous request — use an `AbortController` and call `abort()` yourself.",
        "An aborted request rejects, so it lands in your `catch`. Distinguish it by name: `TimeoutError` for the timeout helper, `AbortError` for a manual abort. Treating a cancellation as a failure and showing an error message is a common polish bug.",
      ],
      examples: [
        {
          id: "abort",
          title: "Timeouts, and cancelling a superseded request",
          js: `// A timeout, in one line.
try {
  await fetch("/api/slow", { signal: AbortSignal.timeout(300) });
} catch (error) {
  console.log("timeout ->", error.name, "|", error.message);
}

// Search-as-you-type: cancel the previous request on each keystroke.
let inFlight = null;

async function search(query) {
  inFlight?.abort();
  inFlight = new AbortController();

  try {
    const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`, {
      signal: inFlight.signal,
    });
    render(await response.json());
  } catch (error) {
    // A cancelled request is not a failure — say nothing.
    if (error.name === "AbortError") return;
    showError(error);
  }
}

// Combine several reasons to stop:
//   AbortSignal.any([userCancel.signal, AbortSignal.timeout(5000)])`,
          output: `timeout -> TimeoutError | The operation was aborted due to timeout`,
          explanation:
            "Cancelling the previous request also fixes an ordering bug people usually solve much more awkwardly: without it, a slow response for `\"ca\"` can arrive after a fast one for `\"cat\"` and overwrite the correct results.",
        },
      ],
    },
    {
      id: "cors",
      heading: "CORS, in the amount you need",
      body: [
        "A browser will not let one origin read a response from another origin unless that other origin allows it. An **origin** is scheme, host and port together — `https://a.com` and `https://api.a.com` are different origins, and so are ports 3000 and 8080 on localhost.",
        "The permission comes from **response headers set by the server**: `Access-Control-Allow-Origin`, and friends. Nothing you write on the client can grant it — the request is not blocked, the *reading of the response* is.",
        "For anything beyond a simple GET or POST — a custom header, a `PUT`, `Content-Type: application/json` — the browser first sends a **preflight** `OPTIONS` request asking whether the real one is permitted. A server that does not handle `OPTIONS` fails every one of these while simple GETs keep working, which is a confusing signature until you have seen it once.",
        "`credentials: \"include\"` sends cookies cross-origin, and requires the server to send `Access-Control-Allow-Credentials: true` **and** a specific origin rather than `*`.",
      ],
      pitfalls: [
        {
          title: "\"Failed to fetch\" with nothing in the network tab is almost always CORS",
          body: "The error is a bare `TypeError` with no detail, because exposing the reason would leak information about the target. Look in the browser console for the separate CORS message, and check the response headers on the request itself — you will often find the request succeeded with a 200 and the browser simply refused to hand you the body. During development a proxy in your dev server is usually simpler than configuring CORS.",
        },
      ],
    },
    {
      id: "parallel",
      heading: "Sequential against parallel",
      body: [
        "Two independent requests written with two `await`s on consecutive lines run **one after the other**, and the page waits for the sum. This is the most common accidental performance problem in front-end code, and it is invisible — the code looks perfectly reasonable.",
        "Start both promises first, then await them together.",
      ],
      examples: [
        {
          id: "parallel-requests",
          title: "The same two requests, half the time",
          js: `// Sequential: 200ms + 200ms = 400ms. The second request has not even
// been sent while the first is in flight.
const user = await fetch("/api/user").then((r) => r.json());
const posts = await fetch("/api/posts").then((r) => r.json());

// Parallel: both start immediately; total is the slower of the two.
const [user2, posts2] = await Promise.all([
  fetch("/api/user").then((r) => r.json()),
  fetch("/api/posts").then((r) => r.json()),
]);

// When one failure should not lose the others' results:
const results = await Promise.allSettled([
  fetch("/api/user"),
  fetch("/api/posts"),
  fetch("/api/flaky"),
]);

for (const result of results) {
  if (result.status === "fulfilled") use(result.value);
  else console.warn("one request failed:", result.reason);
}`,
          explanation:
            "The rule: **sequential only when the second request needs the first one's result.** Otherwise start them together. `Promise.all` rejects as soon as any one rejects; `Promise.allSettled` waits for all and reports each outcome, which is what you want for independent widgets on a dashboard.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Does fetch reject on a 404?",
      answer:
        "No. A 404 is a completed HTTP exchange, so the promise resolves with a `Response` whose `ok` is false and `status` is 404. `fetch` only rejects when the request could not be completed at all — network failure, DNS failure, CORS refusal, or an abort. You have to check `response.ok` yourself, which is why almost every codebase has a small wrapper that throws on non-2xx.",
    },
    {
      question: "Why can you only read a response body once?",
      answer:
        "The body is a readable stream, and reading it consumes it. Calling `json()` or `text()` a second time throws a `TypeError` saying the body has already been read. Use `response.clone()` before the first read if you genuinely need it twice — most often when an error handler wants the body that something upstream already consumed.",
    },
    {
      question: "Why should you not set Content-Type when sending FormData?",
      answer:
        "`multipart/form-data` requires a boundary string in the header that separates the parts, and the browser generates it when it serialises the `FormData`. Setting the header manually replaces it with one that has no boundary, so the server cannot parse the body. Leave it off and the browser sets the complete header itself.",
    },
    {
      question: "How do you add a timeout to a fetch?",
      answer:
        "Pass `signal: AbortSignal.timeout(ms)`. There is no built-in timeout, so without it a request can hang for minutes. For manual cancellation use an `AbortController` and call `abort()`; combine reasons with `AbortSignal.any([…])`. Check `error.name` in the catch so a cancellation is not reported to the user as a failure.",
    },
    {
      question: "What is a CORS preflight and when does it happen?",
      answer:
        "An `OPTIONS` request the browser sends before the real one, asking whether the cross-origin request is permitted. It is triggered by anything beyond a simple request — a method other than GET/HEAD/POST, custom headers, or a `Content-Type` other than the three simple ones, which includes `application/json`. A server that does not handle `OPTIONS` will fail all of these while simple GETs continue to work.",
    },
  ],
  takeaways: [
    "`fetch` resolves when headers arrive; reading the body is a second await, and it can only be done once",
    "HTTP errors are not rejections — check `response.ok`, and wrap `fetch` once so the rest of the codebase does not have to",
    "A rejected fetch means the request failed entirely: network, DNS, CORS or abort, reported as a deliberately vague `TypeError`",
    "Set `Content-Type` for JSON; never set it for `FormData`, because the browser must supply the multipart boundary",
    "`URL` and `URLSearchParams` encode correctly — never build query strings by concatenation",
    "There is no default timeout; `AbortSignal.timeout(ms)` adds one, and an `AbortController` cancels superseded requests",
    "CORS is enforced by the browser on the basis of server response headers, and preflights are triggered by anything non-simple, including JSON bodies",
    "Consecutive awaits run sequentially — use `Promise.all` for independent requests, `allSettled` when partial failure is acceptable",
  ],
  status: "available",
};
