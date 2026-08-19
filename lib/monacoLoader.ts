"use client";

import { loader } from "@monaco-editor/react";

/**
 * Points Monaco at the copy this project ships instead of a public CDN.
 *
 * `@monaco-editor/react` defaults to fetching the editor from jsDelivr, which
 * makes both editors on this site depend on a third party being reachable —
 * and on the playground and the practice console the editor is not a nicety,
 * it is the feature. It also pins its own version, so the browser was running
 * an editor a minor release behind the one package.json declares and the types
 * describe.
 *
 * scripts/copy-monaco.mjs puts the matching build under public/monaco, and this
 * points the AMD loader at it. Import this module from any file that renders an
 * editor; the call is idempotent, and it must happen before the first `Editor`
 * mounts, which importing it alongside the component guarantees.
 */
loader.config({ paths: { vs: "/monaco/vs" } });

export {};
