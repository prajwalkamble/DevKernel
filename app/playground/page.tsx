import type { Metadata } from "next";
import { PlaygroundClient } from "@/components/playground/PlaygroundClient";

export const metadata: Metadata = {
  title: "Playground — DevKernel",
  description:
    "Run JavaScript, TypeScript and JSX in your browser, and draft Rust, x86-64 Assembly, C++ and Java with the commands to build them locally.",
};

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
