import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Header } from "@/components/layout/Header";

// A plain UI sans for everything that is prose, and a real coding face for
// everything that is code. Keeping those two jobs in two fonts is the whole
// point -- the reading font should not look like a terminal.
const uiSans = Inter({
  variable: "--font-ui-sans",
  subsets: ["latin"],
  display: "swap",
});

const codeMono = JetBrains_Mono({
  variable: "--font-code-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DevKernel — Master the Core of Software Engineering",
    template: "%s",
  },
  description:
    "From-scratch curricula in JavaScript & TypeScript, React, Next.js, Angular, C++, Rust and x86-64 Assembly, plus short-form revision for Java — deep explanations, the pitfalls nobody warns you about, and a playground that runs all six languages in your browser.",
};

export const viewport: Viewport = {
  // Matches --background in globals.css, so mobile browser chrome does not
  // sit against a colour the page never uses.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d14" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${uiSans.variable} ${codeMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
