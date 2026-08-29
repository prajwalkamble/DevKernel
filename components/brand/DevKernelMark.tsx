import type { SVGProps } from "react";

/**
 * The DevKernel mark: `{</>}`.
 *
 * Braces drawn on lucide's system (r=2 arcs, round caps and joins) so the mark
 * shares the stroke language of every icon beside it. The two braces and the
 * two chevrons are exact mirrors about x=22 — the right-hand paths are written
 * out rather than transformed, and were checked pixel-for-pixel against a
 * `scale(-1 1)` copy.
 *
 * Spacing is by sidebearing, not by eye: the ink boxes of `{`, `<`, `/`, `>`
 * and `}` are separated by an equal 1.75 units, which puts the ink at
 * x 0.90–43.10 and y 1.90–22.10 — centred, and 2.09:1.
 *
 * The stroke is a single gradient swept across the whole mark in user space,
 * so the colour runs continuously from the left brace to the right one. Per
 * path it would restart on each, and both braces would repeat the same sweep.
 * The stops are theme variables, so the mark follows light and dark without a
 * second copy of the artwork.
 */
export function DevKernelMark({
  gradientId = "devkernel-mark",
  strokeWidth = 2.2,
  ...props
}: SVGProps<SVGSVGElement> & { gradientId?: string }) {
  return (
    <svg
      viewBox="0 0 44 24"
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="44"
          y2="0"
        >
          <stop offset="0" stopColor="var(--brand-from)" />
          <stop offset="0.5" stopColor="var(--brand-mid)" />
          <stop offset="1" stopColor="var(--brand-to)" />
        </linearGradient>
      </defs>
      <path d="M7 3H6a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
      <path d="M37 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
      <path d="M15.95 6.5 10.75 12l5.2 5.5" />
      <path d="M28.05 6.5 33.25 12l-5.2 5.5" />
      <path d="M24.3 5.75 19.7 18.25" />
    </svg>
  );
}
