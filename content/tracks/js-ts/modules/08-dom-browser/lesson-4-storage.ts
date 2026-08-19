import type { Lesson } from "@/content/types";

export const storageLesson: Lesson = {
  id: "dom-storage",
  slug: "browser-storage",
  moduleSlug: "dom-browser",
  title: "localStorage, sessionStorage & Cookies",
  summary:
    "The three places a browser will keep data for you, what each is actually for, the string-only constraint that produces `[object Object]`, and why none of them is a safe place for a token.",
  estimatedMinutes: 30,
  objectives: [
    "Use the Storage API and handle its string-only nature",
    "Choose between localStorage, sessionStorage, cookies and IndexedDB",
    "Handle quota errors and unavailable storage without crashing",
    "Read and write cookies, and explain HttpOnly, Secure and SameSite",
    "Say why storing an auth token in localStorage is a security decision",
    "Sync state between tabs with the storage event",
  ],
  sections: [
    {
      id: "web-storage",
      heading: "The Storage API",
      body: [
        "`localStorage` and `sessionStorage` share one interface and differ in exactly one respect: **lifetime**.",
        "**`localStorage`** persists until something deletes it — across reloads, tabs and browser restarts. It is shared by every tab on the same origin.",
        "**`sessionStorage`** is scoped to a single tab and cleared when that tab closes. Two tabs on the same site have entirely separate `sessionStorage`, which makes it right for things like \"which step of this wizard am I on\".",
        "Both are **synchronous** and both store **strings only**. Both are limited to roughly 5–10 MB per origin depending on the browser.",
      ],
      examples: [
        {
          id: "storage-strings",
          title: "Everything becomes a string",
          js: `localStorage.setItem("count", 42);
console.log(JSON.stringify(localStorage.getItem("count")), typeof localStorage.getItem("count"));

// The classic bug: an object is coerced with String(), not serialised.
localStorage.setItem("user", { name: "Ada" });
console.log(JSON.stringify(localStorage.getItem("user")));

// Serialise explicitly.
localStorage.setItem("user", JSON.stringify({ name: "Ada" }));
console.log(JSON.parse(localStorage.getItem("user")).name);

// A missing key is null, not undefined — which matters for \`??\` and JSON.parse.
console.log(JSON.stringify(localStorage.getItem("nope")));

console.log(localStorage.length, localStorage.key(0));
localStorage.removeItem("count");
console.log(localStorage.length);`,
          output: `"42" string
"[object Object]"
Ada
null
2 count
1`,
          explanation:
            "`[object Object]` in storage is one of the most recognisable bugs in front-end work, and it is always a missing `JSON.stringify`. Note also that `42` came back as the *string* `\"42\"` — comparing it with `=== 42` fails, and `+` concatenates. Always convert on the way out.",
        },
        {
          id: "storage-wrapper",
          title: "A wrapper that does not throw",
          js: `const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      // Unavailable storage, or a value that is not valid JSON —
      // often left by an older version of your own code.
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      // QuotaExceededError, or Safari private mode historically.
      console.warn("could not persist", key, error.name);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};`,
          ts: `const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },

  set(key: string, value: unknown): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("could not persist", key, (error as Error).name);
      return false;
    }
  },
};

// As with fetch, \`<T>\` is an assertion rather than a check. Data written by
// a previous version of your app is exactly where that assumption breaks, so
// validate anything whose shape has ever changed.
const settings = storage.get("settings", { theme: "system" });`,
          explanation:
            "Every access is wrapped because **all three operations can throw**. Storage can be disabled entirely by browser settings, blocked in some embedded contexts, and `setItem` throws `QuotaExceededError` when full. Code that assumes `localStorage` always works fails for a small but real slice of users, and it fails at startup.",
        },
      ],
      pitfalls: [
        {
          title: "Synchronous means it blocks the main thread",
          body: "Every read and write is synchronous, so a large value is parsed on the thread that also renders. Storing a megabyte of JSON and reading it on every route change is a real cause of jank. For anything beyond small settings, use IndexedDB, which is asynchronous and has a much larger quota.",
        },
      ],
    },
    {
      id: "storage-event",
      heading: "Syncing tabs with the storage event",
      body: [
        "When `localStorage` changes, every **other** tab on the same origin receives a `storage` event. The tab that made the change does not — which is the detail people miss when testing.",
        "It is the simplest way to keep tabs consistent: log out in one tab and the others notice.",
      ],
      examples: [
        {
          id: "storage-event-example",
          title: "Reacting to a change in another tab",
          js: `window.addEventListener("storage", (event) => {
  // Fires only in OTHER tabs, never in the one that wrote.
  if (event.key === "auth") {
    if (event.newValue === null) {
      redirectToLogin();          // logged out elsewhere
    } else {
      refreshSession(JSON.parse(event.newValue));
    }
  }

  // event.key is null when storage.clear() was called.
  if (event.key === null) reloadEverything();
});`,
          explanation:
            "The event carries `key`, `oldValue`, `newValue` and `url`. For richer cross-tab messaging that is not tied to persistence, `BroadcastChannel` is the better tool — it sends structured data directly and does not require writing to storage at all.",
        },
      ],
    },
    {
      id: "cookies",
      heading: "Cookies",
      body: [
        "Cookies predate everything else here and are still the only client storage that is **sent to the server automatically** with each request. That single property is what they are for; as general-purpose storage they are worse than `localStorage` in every way.",
        "They are small — about 4 KB each, with a per-domain limit — and because they ride along on every request, a page with several large cookies pays for them on every asset it loads.",
        "The `document.cookie` API is genuinely unpleasant: reading gives you one semicolon-delimited string of every readable cookie, and writing one at a time looks like an assignment but appends.",
        "The modern replacement is the **Cookie Store API** (`cookieStore.get`/`set`), which is promise-based and sane; check support before relying on it.",
      ],
      examples: [
        {
          id: "cookie-api",
          title: "Reading and writing cookies",
          js: `// Writing looks like assignment but appends a single cookie.
document.cookie = "theme=dark; path=/; max-age=31536000; SameSite=Lax";

// Reading gives you everything at once, as one string.
console.log(document.cookie);
// "theme=dark; locale=en-GB"

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

// Deleting is setting an expiry in the past — with the SAME path and domain.
document.cookie = "theme=; path=/; max-age=0";

// The modern API, where supported:
//   await cookieStore.set({ name: "theme", value: "dark", path: "/" });
//   const cookie = await cookieStore.get("theme");`,
          explanation:
            "The deletion detail catches people: a cookie is identified by name **plus path plus domain**, so deleting with the wrong path silently creates a second cookie instead of removing the first. You then have two, and the wrong one wins.",
        },
      ],
    },
    {
      id: "cookie-attributes",
      heading: "The cookie attributes that are actually security controls",
      body: [
        "**`HttpOnly`** makes a cookie invisible to JavaScript — `document.cookie` cannot read it. It can only be set by the server. This is the attribute that matters most, and it is why session cookies belong to the server rather than to your front-end code.",
        "**`Secure`** sends the cookie only over HTTPS.",
        "**`SameSite`** controls whether the cookie is attached to cross-site requests, and is the main defence against cross-site request forgery. `Strict` never sends cross-site; `Lax` (the modern default) sends on top-level navigations only; `None` always sends and **requires `Secure`**.",
        "**`Max-Age`** or **`Expires`** set the lifetime; with neither, the cookie disappears when the browser session ends.",
      ],
      pitfalls: [
        {
          title: "localStorage is readable by any script on your page",
          body: "There is no `HttpOnly` equivalent for `localStorage`. Any script that runs on your origin — including one pulled in by a compromised dependency, an analytics snippet, or a successful XSS — can read every key. Storing an access token there means one injected script is a full account takeover. The safer pattern is a session in an `HttpOnly; Secure; SameSite` cookie that JavaScript never touches. If you must hold a token in memory, hold it in a variable rather than persisting it.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing between them",
      body: [
        "**`sessionStorage`** — state for one tab that should not outlive it: wizard progress, scroll position, a draft that belongs to this visit.",
        "**`localStorage`** — small preferences that should persist: theme, locale, dismissed banners, a feature-tour flag. Small, non-sensitive, and tolerable to lose.",
        "**Cookies** — anything the *server* needs to see on every request. In practice: sessions, set by the server, `HttpOnly`.",
        "**IndexedDB** — anything large, structured, or queried. Asynchronous, transactional, hundreds of megabytes, and it stores real objects rather than strings, so no serialisation. The raw API is unpleasant enough that a wrapper such as `idb` is worth the dependency.",
        "**Cache API** — HTTP responses, usually driven by a service worker for offline support.",
        "The question that decides it: *who needs this data, how big is it, and what happens if it disappears?* Everything here can be cleared by the user at any moment, so nothing in the browser is a source of truth.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between localStorage and sessionStorage?",
      answer:
        "Only lifetime and scope. `localStorage` persists indefinitely and is shared by every tab on the origin; `sessionStorage` is per-tab and cleared when that tab closes. The API, the string-only constraint, the synchronous behaviour and the roughly 5–10 MB quota are identical.",
    },
    {
      question: "Why does storing an object in localStorage produce `[object Object]`?",
      answer:
        "`setItem` coerces its value to a string with `String()`, which for a plain object gives `\"[object Object]\"`. It does not serialise. You have to call `JSON.stringify` on the way in and `JSON.parse` on the way out — and remember that primitives come back as strings too, so a stored `42` returns `\"42\"`.",
    },
    {
      question: "Is localStorage a safe place for an authentication token?",
      answer:
        "No. Any script running on the origin can read it, so a single XSS or a compromised dependency exposes the token. Cookies have `HttpOnly`, which makes them unreadable from JavaScript entirely — that is why sessions belong in an `HttpOnly; Secure; SameSite` cookie set by the server. Tokens that must live on the client are safer in a variable than in persistent storage.",
    },
    {
      question: "What does SameSite do?",
      answer:
        "It controls whether a cookie is attached to requests originating from another site, which is the main defence against CSRF. `Strict` never sends cross-site, `Lax` — the modern default — sends only on top-level navigations, and `None` always sends but requires `Secure`.",
    },
    {
      question: "When does the storage event fire?",
      answer:
        "When `localStorage` changes, in every *other* tab on the same origin — never in the tab that made the change. It carries `key`, `oldValue`, `newValue` and `url`, with `key` null when `clear()` was called. It is the simplest cross-tab sync mechanism; `BroadcastChannel` is better when you want messaging without persistence.",
    },
  ],
  takeaways: [
    "`localStorage` and `sessionStorage` share one API and differ only in lifetime and scope",
    "Both store strings only — `JSON.stringify` on the way in, `JSON.parse` on the way out, or you get `[object Object]`",
    "A missing key returns `null`, and every operation can throw, so wrap access rather than assuming it works",
    "Both are synchronous and block the main thread; use IndexedDB for anything large",
    "The `storage` event fires in other tabs only, never the one that wrote",
    "Cookies exist because they are sent to the server automatically; that is their only real advantage",
    "`HttpOnly` is the attribute that matters — `localStorage` has no equivalent, so any script on your origin can read everything in it",
    "Nothing stored in a browser is a source of truth; the user can clear all of it at any time",
  ],
  status: "available",
};
