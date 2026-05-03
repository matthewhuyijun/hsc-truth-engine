import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { AtarCalculator } from "@/components/AtarCalculator";
import { ExternalLink } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("calculatorTitle"),
    description: t("calculatorDescription"),
    alternates: { canonical: "/calculator" },
    openGraph: {
      title: t("calculatorOgTitle"),
      description: t("calculatorOgDescription"),
      url: "https://hscdata.org/calculator",
    },
  };
}

export default async function CalculatorPage() {
  const t = await getTranslations("Calculator");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("heading")}</h1>
        <p className="mt-1 max-w-xl text-sm text-muted leading-relaxed">
          {t("description")}
        </p>

        <div className="mt-4 rounded-lg border border-border bg-surface p-3 flex items-start gap-3">
          <ExternalLink className="h-4 w-4 text-muted flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted leading-relaxed">
            {t("uacCalloutBefore")}{" "}
            <a
              href="https://www.uac.edu.au/atar-compass"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium text-foreground hover:opacity-70"
            >
              {t("uacCalloutLink")}
            </a>
            {t("uacCalloutAfter")}
          </p>
        </div>

        <div className="mt-10">
          <AtarCalculator />
        </div>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "HSC ATAR Calculator",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          description:
            "Estimate your ATAR from expected HSC marks using 2019–2025 UAC scaling data.",
          url: "https://hscdata.org/calculator",
        }}
      />
    </div>
  );
}
