import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { ScrollToTop } from "@/components/ScrollToTop";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  return {
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
}

export default async function LocaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
      <Header />
      <div className="h-14" />
      <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                href="/changelog"
                className="text-xs text-muted/70 hover:text-foreground transition-colors"
              >
                Changelog
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
                target:
                  "https://hscdata.org/honor-roll?search={search_term_string}",
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
    </NextIntlClientProvider>
  );
}
