"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The header's primary navigation, split out so it can be a client component.
 *
 * `Header` itself stays on the server — it reads the content tree to count
 * lessons — and only this part needs the current path. The active link is
 * marked two ways on purpose: an underline for the eye, and `aria-current` for
 * a screen reader, which the underline alone tells nothing.
 *
 * The underline is a positioned bar rather than `text-decoration`, because a
 * text decoration cannot be animated — it is there or it is not. A bar can be
 * scaled from nothing to full width, so hovering wipes it in and the current
 * section simply starts at full width and stays there.
 */
const LINKS = [
  { href: "/roadmap", label: "Roadmap" },
  /* A lesson lives under /learn but is reached through Tracks, so the section
     stays lit while you are reading one. */
  { href: "/curriculum", label: "Tracks", also: ["/learn"] },
  { href: "/practice", label: "Problems" },
  { href: "/visualize", label: "Visualize" },
  { href: "/playground", label: "Playground" },
] as const;

function isActive(pathname: string, href: string, also: readonly string[] = []) {
  // Prefix matching, but on whole segments: /practice must not light up for a
  // hypothetical /practices, and every prefix has to end at a boundary.
  return [href, ...also].some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
}

export function HeaderNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex min-w-0 items-center gap-0.5 text-sm sm:gap-1">
      {LINKS.map(({ href, label, ...rest }) => {
        const active = isActive(pathname, href, "also" in rest ? rest.also : []);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={[
              "group relative rounded-md px-2 py-1.5 font-medium transition-colors sm:px-3",
              active ? "text-foreground" : "text-foreground/80 hover:text-foreground",
            ].join(" ")}
          >
            {label}
            <span
              aria-hidden
              className={[
                "pointer-events-none absolute inset-x-2 bottom-0.5 h-0.5 rounded-full bg-accent sm:inset-x-3",
                "origin-left transition-transform duration-200 ease-out motion-reduce:transition-none",
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
              ].join(" ")}
            />
          </Link>
        );
      })}
    </nav>
  );
}
