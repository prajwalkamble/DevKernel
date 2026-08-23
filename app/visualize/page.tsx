import type { Metadata } from "next";
import { VisualizeGallery } from "@/components/visuals/VisualizeGallery";

export const metadata: Metadata = {
  title: "Visualize — DevKernel",
  description:
    "Watch sorting and searching algorithms run step by step, and build stacks, queues, linked lists, trees, tries, heaps and hash tables one operation at a time.",
};

export default function VisualizePage() {
  return <VisualizeGallery />;
}
