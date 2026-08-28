import type { ModuleDefinition } from "@/content/types";
import { capstoneRequirementsLesson } from "./lesson-1-requirements";
import { capstoneBackendLesson } from "./lesson-2-backend";
import { capstoneDataLayerLesson } from "./lesson-3-data-layer";
import { capstoneComponentsLesson } from "./lesson-4-components";
import { capstoneTriageLesson } from "./lesson-5-triage";

/**
 * One project, specified before it is built.
 *
 * Everything above this module is material; this is the pass where it is all
 * used at once, on something with enough shape to force decisions. The order
 * is the order the types flow — schemas, then the database, then the API,
 * then the data layer, then the screens — because building the other way
 * round means writing every line against a shape that does not exist yet.
 *
 * The triage queue comes last on purpose. It is the screen that makes the
 * product a bug tracker rather than a list, and it is the only one that needs
 * every earlier decision at once: an ordering the database cannot guess, a
 * cache key of its own, an optimistic update that removes a row, and a
 * rollback that a test can only prove against a fake that remembers.
 */
export const reactCapstoneModule: ModuleDefinition = {
  id: "react-capstone",
  slug: "capstone-project",
  title: "Capstone: Build a Bug Tracker",
  description:
    "Tracer — a bug tracker for one small team, in the shape of a small Bugzilla, Jira or GitHub Issues. Specified with numbered functional and non-functional requirements, then built: a shared schema package, a Hono and SQLite backend, and a React and TypeScript front end with filters in the URL, a triage queue ordered worst-first, two optimistic mutations and one deliberately not, and tests that fake the network rather than the modules.",
  order: 15,
  status: "available",
  lessons: [
    capstoneRequirementsLesson,
    capstoneBackendLesson,
    capstoneDataLayerLesson,
    capstoneComponentsLesson,
    capstoneTriageLesson,
  ],
};
