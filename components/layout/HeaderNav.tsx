"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

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
 *
 * Below `md` the six links become a menu. Measured rather than guessed, and
 * measured three times, because the answer moved each time the header did.
 * The row of links needs about 480px on its own, so behind no breakpoint at
 * all it pushed a 375px screen 63px wider than the viewport and every page
 * scrolled sideways. Behind `sm` the last link still ran to 691px inside a
 * 640px viewport, because the wordmark and the controls share the row — the
 * same bug moved rather than fixed. `md` is where the whole row fits.
 *
 * It fits with a sixth link now only because the progress bar that used to sit
 * beside the theme toggle is gone: the dashboard says all of that properly, so
 * a second, smaller copy of it in the header was one summary too many. Adding
 * a seventh link would need this measured again — at 768px the row ends at
 * 696px, so there is about 70px of slack and no more.
 */
const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
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
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const panelId = useId();

  // Navigating is the usual way out of the menu, and leaving it open over the
  // new page would hide what the reader just asked for.
  //
  // Adjusted during render rather than in an effect: React re-runs this
  // component immediately without painting the intermediate state, so the menu
  // is already closed on the first frame of the new page. An effect would
  // close it one paint later, which is a visible flash.
  if (pathname !== openedAt) {
    setOpenedAt(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <nav className="hidden min-w-0 items-center gap-0.5 text-sm md:flex md:gap-1">
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

      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-hover md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Fixed rather than absolute: the header is sticky and 3.5rem tall, so
          this sits directly under it without depending on which ancestor
          happens to be positioned. */}
      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 top-14 z-40 border-b border-border bg-background shadow-lg md:hidden"
      >
        <nav className="flex flex-col p-2">
          {LINKS.map(({ href, label, ...rest }) => {
            const active = isActive(pathname, href, "also" in rest ? rest.also : []);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  // Comfortably past the 44px minimum for a touch target.
                  "flex min-h-12 items-center rounded-md px-3 text-base font-medium transition-colors",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-foreground/80 hover:bg-surface-hover hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
