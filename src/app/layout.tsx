import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollToTop } from "@/components/ScrollToTop";
import { JsonLd } from "@/components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HSC Data — NSW ATAR Calculator & Scaling Data",
    template: "%s | HSC Data",
  },
  description:
    "Understand how the HSC and ATAR actually work. Free ATAR calculator, interactive scaling graphs, Band 6 honor roll, and data-driven insights. No myths — just mathematics sourced from NESA and UAC reports.",
  metadataBase: new URL("https://hscdata.org"),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "HSC",
    "ATAR calculator",
    "scaling",
    "HSC scaling",
    "NSW HSC",
    "Band 6",
    "honor roll",
    "distinguished achievers",
    "all rounders",
    "UAC",
    "NESA",
  ],
  authors: [{ name: "Matthew Hu" }],
  creator: "Matthew Hu",
  publisher: "HSC Data",
  openGraph: {
    type: "website",
    siteName: "HSC Data",
    title: "HSC Data — NSW ATAR Calculator & Scaling Data",
    description:
      "Understand how the HSC and ATAR actually work. Free ATAR calculator, scaling graphs, honor roll, and data-driven insights.",
    url: "https://hscdata.org",
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "HSC Data — NSW ATAR Calculator & Scaling Data",
    description:
      "Understand how the HSC and ATAR actually work. No myths — just mathematics.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
              <span>HSC Data</span>
              <span className="rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-muted uppercase tracking-wider">
                Beta
              </span>
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
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p className="text-xs text-muted">
                Data sourced from NESA. Not affiliated with NESA or UAC.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/matthewhuyijun/hsc-truth-engine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted/70 hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="mailto:hscmathsguy@gmail.com"
                  className="text-xs text-muted/70 hover:text-foreground transition-colors"
                >
                  Contact / Feedback
                </a>
              </div>
            </div>
          </div>
          </footer>

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                name: "HSC Data",
                url: "https://hscdata.org",
                description:
                  "Understand how the HSC and ATAR actually work. ATAR calculator, scaling graphs, honor roll, and data-driven insights.",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://hscdata.org/honor-roll?search={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                name: "HSC Data",
                url: "https://hscdata.org",
                description:
                  "Independent, data-driven HSC and ATAR analysis. Not affiliated with NESA or UAC.",
                sameAs: ["https://github.com/matthewhuyijun/hsc-truth-engine"],
              },
            ],
          }}
        />
      </body>
    </html>
  );
}
