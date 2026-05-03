import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("changelogTitle"),
    description: t("changelogDescription"),
    alternates: { canonical: "/changelog" },
  };
}

export default async function ChangelogPage() {
  const t = await getTranslations("Changelog");
  const releases = t.raw("releases") as { date: string; items: string[] }[];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("description")}</p>

        <div className="mt-8 space-y-8">
          {(releases || []).map((release, i) => (
            <div key={i}>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">{release.date}</h2>
              <ul className="mt-3 space-y-2">
                {release.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                    <ArrowRight className="h-4 w-4 text-muted/40 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-muted/50">{t("comingSoon")}</p>
      </div>
    </div>
  );
}
