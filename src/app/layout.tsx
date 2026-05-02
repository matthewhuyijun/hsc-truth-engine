import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollToTop } from "@/components/ScrollToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HSC Truth Engine",
  description: "Transparent HSC data. No myths. Just mathematics.",
};

const navItems = [
  { label: "Insights", href: "/insights" },
  { label: "Calculator", href: "/calculator" },
  { label: "Scaling", href: "/scaling-graphs" },
  { label: "Honor Roll", href: "/honor-roll" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme:dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        {/* Navigation */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-sm font-semibold text-foreground hover:opacity-70 transition-opacity"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-foreground text-background font-mono text-xs font-bold">
                &gt;_
              </span>
              <span>HSC Truth Engine</span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div className="h-14" />

        {/* Main Content */}
        <main className="min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-xs text-muted">
                Data sourced from NESA. Not affiliated with NESA or UAC.
              </p>
              <p className="text-xs text-muted/70">
                Built with Next.js
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
