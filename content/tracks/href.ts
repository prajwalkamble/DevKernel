/**
 * Where a track and a lesson live, and nothing else.
 *
 * These two functions were defined identically in `index.ts` and `meta.ts`,
 * which is harmless until a Client Component wants one of them: importing
 * either module for a URL drags its data in as well, and `meta.ts` carries the
 * whole generated manifest. `SidebarNav` pays that on purpose — it renders the
 * entire curriculum in the browser — but a page that only needs to link
 * somewhere should not.
 *
 * So the shape of a URL lives here, in a module with no data in it at all, and
 * both `index.ts` and `meta.ts` re-export from it. One definition, and a client
 * import that costs a few bytes.
 */

export function lessonHref(trackSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `/learn/${trackSlug}/${moduleSlug}/${lessonSlug}`;
}

export function trackHref(trackSlug: string): string {
  return `/curriculum/${trackSlug}`;
}
