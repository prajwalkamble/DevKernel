/**
 * String matching, animated character by character.
 *
 * The whole point of KMP over the naive scan is what happens *after* a
 * mismatch, and that is invisible in prose — you have to watch the pattern
 * slide by more than one place.
 */
import { Recorder, type MatrixFrame, type Role, type Visualisation, cellKey } from "./types";

/** Text on the first row, pattern aligned under it on the second. */
function alignmentFrame(
  text: string, pattern: string, offset: number,
  roles: Record<string, Role>, note: string
): Omit<MatrixFrame, "stats"> {
  const top = [...text];
  const bottom = new Array(text.length).fill("");
  for (let i = 0; i < pattern.length; i++) {
    if (offset + i < text.length) bottom[offset + i] = pattern[i];
  }
  return {
    kind: "matrix",
    cells: [top, bottom],
    roles,
    colLabels: top.map((_, i) => String(i)),
    rowLabels: ["text", "pattern"],
    note,
  };
}

export function naiveSearch(text = "ABABDABACDABABCABAB", pattern = "ABABCABAB"): Visualisation {
  const rec = new Recorder<MatrixFrame>();
  rec.push(alignmentFrame(text, pattern, 0, {},
    `Naive matching: try the pattern at every position, and on a mismatch slide it one place right.`));

  for (let offset = 0; offset + pattern.length <= text.length; offset++) {
    let i = 0;
    while (i < pattern.length) {
      rec.bump("comparisons");
      const match = text[offset + i] === pattern[i];
      rec.push(alignmentFrame(text, pattern, offset, {
        [cellKey(0, offset + i)]: match ? "sorted" : "swap",
        [cellKey(1, offset + i)]: match ? "sorted" : "swap",
      }, match
        ? `'${pattern[i]}' matches at index ${offset + i}.`
        : `'${text[offset + i]}' ≠ '${pattern[i]}' — mismatch after ${i} matched character(s).`));
      if (!match) break;
      i++;
    }
    if (i === pattern.length) {
      const roles: Record<string, Role> = {};
      for (let k = 0; k < pattern.length; k++) {
        roles[cellKey(0, offset + k)] = "found";
        roles[cellKey(1, offset + k)] = "found";
      }
      rec.push(alignmentFrame(text, pattern, offset, roles, `Full match at index ${offset}.`));
      break;
    }
    rec.bump("slides");
  }
  return {
    frames: rec.frames,
    summary:
      "The naive scan throws away everything it learned on a mismatch and slides the pattern one place. Worst case O(n·m) — and the waste is visible: after matching seven characters it restarts one position later and re-checks six of them.",
  };
}

export function kmpSearch(text = "ABABDABACDABABCABAB", pattern = "ABABCABAB"): Visualisation {
  const rec = new Recorder<MatrixFrame>();

  // The failure table: for each prefix, the length of the longest proper
  // prefix that is also a suffix. That is what a mismatch falls back to.
  const lps = new Array(pattern.length).fill(0);
  {
    let len = 0;
    let i = 1;
    while (i < pattern.length) {
      if (pattern[i] === pattern[len]) {
        lps[i++] = ++len;
      } else if (len > 0) {
        len = lps[len - 1];
      } else {
        lps[i++] = 0;
      }
    }
  }
  rec.push({
    kind: "matrix",
    cells: [[...pattern], lps.map(String)],
    roles: {},
    rowLabels: ["pattern", "fallback"],
    colLabels: pattern.split("").map((_, i) => String(i)),
    note: "First build the fallback table: for each position, how much of the pattern's start is also its end here.",
  });

  let i = 0;
  let j = 0;
  while (i < text.length) {
    rec.bump("comparisons");
    const match = text[i] === pattern[j];
    rec.push(alignmentFrame(text, pattern, i - j, {
      [cellKey(0, i)]: match ? "sorted" : "swap",
      [cellKey(1, i)]: match ? "sorted" : "swap",
    }, match ? `'${pattern[j]}' matches at index ${i}.`
      : `'${text[i]}' ≠ '${pattern[j]}' after ${j} matched character(s).`));

    if (match) {
      i++;
      j++;
      if (j === pattern.length) {
        const roles: Record<string, Role> = {};
        for (let k = 0; k < pattern.length; k++) {
          roles[cellKey(0, i - pattern.length + k)] = "found";
          roles[cellKey(1, i - pattern.length + k)] = "found";
        }
        rec.push(alignmentFrame(text, pattern, i - pattern.length, roles,
          `Full match at index ${i - pattern.length}.`));
        break;
      }
    } else if (j > 0) {
      const skipped = j - lps[j - 1];
      j = lps[j - 1];
      rec.bump("slides");
      rec.push(alignmentFrame(text, pattern, i - j, {},
        `The first ${j} character(s) of the pattern already match here, so slide ${skipped} place(s) — and do not re-check the text.`));
    } else {
      i++;
      rec.bump("slides");
    }
  }
  return {
    frames: rec.frames,
    summary:
      "KMP never moves backwards in the text. On a mismatch after j matched characters, the fallback table says how much of that prefix is also a suffix — so the pattern slides by more than one and matching resumes without re-reading. O(n + m), and the table is the entire idea.",
  };
}

export function rabinKarp(text = "ABABDABACDABABCABAB", pattern = "ABABC"): Visualisation {
  const rec = new Recorder<MatrixFrame>();
  const BASE = 26;
  const MOD = 101;
  const m = pattern.length;

  let patternHash = 0;
  let windowHash = 0;
  let high = 1;
  for (let i = 0; i < m - 1; i++) high = (high * BASE) % MOD;
  for (let i = 0; i < m; i++) {
    patternHash = (BASE * patternHash + pattern.charCodeAt(i)) % MOD;
    windowHash = (BASE * windowHash + text.charCodeAt(i)) % MOD;
  }

  rec.push(alignmentFrame(text, pattern, 0, {},
    `Rabin–Karp compares hashes, not characters. The pattern hashes to ${patternHash}.`));

  for (let offset = 0; offset + m <= text.length; offset++) {
    rec.bump("hashes");
    const roles: Record<string, Role> = {};
    for (let k = 0; k < m; k++) roles[cellKey(0, offset + k)] = "window";
    if (windowHash === patternHash) {
      rec.push(alignmentFrame(text, pattern, offset, roles,
        `Window hash ${windowHash} equals the pattern hash — a candidate. Now verify character by character, because hashes can collide.`));
      let ok = true;
      for (let k = 0; k < m; k++) {
        rec.bump("comparisons");
        if (text[offset + k] !== pattern[k]) { ok = false; break; }
      }
      if (ok) {
        const found: Record<string, Role> = {};
        for (let k = 0; k < m; k++) {
          found[cellKey(0, offset + k)] = "found";
          found[cellKey(1, offset + k)] = "found";
        }
        rec.push(alignmentFrame(text, pattern, offset, found, `Verified — a real match at index ${offset}.`));
        break;
      }
      rec.push(alignmentFrame(text, pattern, offset, roles,
        `The hashes agreed but the characters did not — a spurious hit. Keep going.`));
    } else {
      rec.push(alignmentFrame(text, pattern, offset, roles,
        `Window hash ${windowHash} ≠ ${patternHash}, so this position cannot match. No characters compared.`));
    }
    if (offset + m < text.length) {
      windowHash = (BASE * (windowHash - text.charCodeAt(offset) * high) + text.charCodeAt(offset + m)) % MOD;
      if (windowHash < 0) windowHash += MOD;
    }
  }
  return {
    frames: rec.frames,
    summary:
      "Rabin–Karp hashes the pattern once and rolls a hash along the text, so each new window costs O(1) rather than O(m). A hash mismatch rules a position out with no character comparison at all; a hash match still has to be verified, because collisions happen. Average O(n + m), worst case O(n·m) when every window collides.",
  };
}

export const STRING_ALGOS = {
  naive: { label: "Naive matching", run: () => naiveSearch() },
  kmp: { label: "Knuth–Morris–Pratt", run: () => kmpSearch() },
  rabinkarp: { label: "Rabin–Karp", run: () => rabinKarp() },
} as const;

export type StringAlgoName = keyof typeof STRING_ALGOS;
