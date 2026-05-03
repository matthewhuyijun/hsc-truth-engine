import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

const CHANGES = [
  {
    date: "May 2026",
    items: [
      "Added Chinese (中文) localization — switch between English and Chinese via the header toggle. Translates all page content, UI labels, and SEO metadata (/zh/* routes).",
      "SEO: dynamic metadata (title, description, Open Graph) now generated for every school and course detail page.",
      "SEO: sitemap expanded to include all school detail pages, course detail pages, and changelog with hreflang alternates for bilingual indexing.",
      "SEO: Open Graph social preview image added — dark-themed card shown when sharing links on social media.",
      "SEO: BreadcrumbList structured data added to school and course detail pages for richer Google search results.",
      "Fixed Band 1-6 incorrectly showing for Extension courses. Extension courses now correctly display E1-E4 band distribution for all years (2001-2025).",
      "Added enrollment distribution and band performance charts to course detail views.",
      "State rank mapping fixed — 2,200+ missing state ranks restored across school detail data.",
      "Course name aliases expanded to 26 mappings covering all NESA course renames.",
      "Legacy course codes (e.g. Mathematics → Mathematics Advanced) now merge into unified year-by-year data.",
      "Honour Roll page rewritten with single-select year/school/course pickers and intersection views.",
      "SPaRO school average data restored with rank badges and public school sourcing notes.",
      "Added Compare page with bar charts, school maps, and category-based colour coding (currently hidden from nav).",
      "Fixed enrollment distribution data — non_binary field was incorrectly storing total enrolment numbers.",
    ],
  },
];

export default async function ChangelogPage() {
  const t = await getTranslations("Changelog");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("description")}</p>

        <div className="mt-8 space-y-8">
          {CHANGES.map((release, i) => (
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
