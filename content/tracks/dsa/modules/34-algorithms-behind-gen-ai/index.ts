import type { ModuleDefinition } from "@/content/types";

import { tokenisationLesson } from "./lesson-1-tokenisation";
import { embeddingsAndDistanceLesson } from "./lesson-2-embeddings-and-distance";
import { exactKnnLesson } from "./lesson-3-exact-knn";
import { approximateNeighboursLesson } from "./lesson-4-approximate-neighbours";
import { vectorQuantisationLesson } from "./lesson-5-vector-quantisation";
import { theKvCacheLesson } from "./lesson-6-the-kv-cache";
import { decodingStrategiesLesson } from "./lesson-7-decoding-strategies";
import { retrievalPipelinesLesson } from "./lesson-8-retrieval-pipelines";

export const algorithmsBehindGenAiModule: ModuleDefinition = {
  id: "dsa-gen-ai",
  slug: "algorithms-behind-gen-ai",
  title: "The Data Structures & Algorithms Behind Gen AI",
  description:
    "Everything in this track, applied to the systems everyone is now building on. A vector database is a graph search, tokenisation is a greedy merge over a frequency map, and sampling a token is a heap. Every lesson is measured: greedy byte-pair merges are optimal 2,687 times in 3,000, cosine survives rescaling 3,000 times in 3,000 where the dot product survives 1,190, a bounded heap spends 1.04 comparisons a document while the distance count stays at exactly n, and fusing a strong ranking with a weak one scores worse than the strong one alone.",
  order: 34,
  status: "available",
  phase: "Module 1 · The Grind",
  lessons: [
    tokenisationLesson,
    embeddingsAndDistanceLesson,
    exactKnnLesson,
    approximateNeighboursLesson,
    vectorQuantisationLesson,
    theKvCacheLesson,
    decodingStrategiesLesson,
    retrievalPipelinesLesson,
  ],
};
