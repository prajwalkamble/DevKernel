import type { TrackAccent } from "@/content/types";

/**
 * Per-track colour pairs. Written as complete literals rather than composed
 * strings so Tailwind's scanner can find them.
 */
export const TRACK_BADGE_CLASS: Record<TrackAccent, string> = {
  js: "bg-js-soft text-js",
  ts: "bg-ts-soft text-ts",
  cpp: "bg-cpp-soft text-cpp",
  asm: "bg-asm-soft text-asm",
  rust: "bg-rust-soft text-rust",
  go: "bg-go-soft text-go",
  java: "bg-java-soft text-java",
  spring: "bg-spring-soft text-spring",
  dsa: "bg-dsa-soft text-dsa",
  system: "bg-system-soft text-system",
  react: "bg-react-soft text-react",
  next: "bg-next-soft text-next",
  angular: "bg-angular-soft text-angular",
};

export const TRACK_ACCENT_TEXT: Record<TrackAccent, string> = {
  js: "text-js",
  ts: "text-ts",
  cpp: "text-cpp",
  asm: "text-asm",
  rust: "text-rust",
  go: "text-go",
  java: "text-java",
  spring: "text-spring",
  dsa: "text-dsa",
  system: "text-system",
  react: "text-react",
  next: "text-next",
  angular: "text-angular",
};

export const TRACK_ACCENT_BG: Record<TrackAccent, string> = {
  js: "bg-js",
  ts: "bg-ts",
  cpp: "bg-cpp",
  asm: "bg-asm",
  rust: "bg-rust",
  go: "bg-go",
  java: "bg-java",
  spring: "bg-spring",
  dsa: "bg-dsa",
  system: "bg-system",
  react: "bg-react",
  next: "bg-next",
  angular: "bg-angular",
};
