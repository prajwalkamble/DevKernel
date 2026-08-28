import type { ModuleDefinition } from "@/content/types";
import { capstoneRequirementsLesson } from "./lesson-1-requirements";
import { capstoneBackendLesson } from "./lesson-2-backend";
import { capstoneDataLayerLesson } from "./lesson-3-data-layer";
import { capstoneComponentsLesson } from "./lesson-4-components";

/**
 * One project, specified before it is built.
 *
 * Everything above this module is material; this is the pass where it is all
 * used at once, on something with enough shape to force decisions. The order
 * is the order the types flow — schemas, then the database, then the API,
 * then the data layer, then the screens — because building the other way
 * round means writing every line against a shape that does not exist yet.
 */
export const reactCapstoneModule: ModuleDefinition = {
  id: "react-capstone",
  slug: "capstone-project",
  title: "Capstone: Build an Issue Tracker",
  description:
    "Tracer — a bug and task tracker for one small team, in the shape of a small GitHub Issues, Jira or Linear. Specified with numbered functional and non-functional requirements, then built: a shared schema package, a Hono and SQLite backend, and a React and TypeScript front end with filters in the URL, one optimistic mutation and one deliberately not, and tests that fake the network rather than the modules.",
  order: 15,
  status: "available",
  lessons: [
    capstoneRequirementsLesson,
    capstoneBackendLesson,
    capstoneDataLayerLesson,
    capstoneComponentsLesson,
  ],
};
