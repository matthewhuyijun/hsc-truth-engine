import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowRight, BarChart3, Calculator, Award } from "lucide-react";

export default async function HomePage() {
  const t = await getTranslations("Home");

  const modules = [
    {
      icon: BarChart3,
      title: t("moduleInsightsTitle"),
      description: t("moduleInsightsDesc"),
      href: "/insights" as const,
    },
    {
      icon: Calculator,
      title: t("moduleCalculatorTitle"),
      description: t("moduleCalculatorDesc"),
      href: "/calculator" as const,
    },
    {
      icon: Award,
      title: t("moduleHonorRollTitle"),
      description: t("moduleHonorRollDesc"),
      href: "/honor-roll" as const,
    },
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto snap-y snap-mandatory scroll-smooth">
      <section className="snap-start min-h-screen flex items-center relative border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 w-full">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("badge")}
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("heroLine1")}
            <br />
            <span className="text-muted">{t("heroLine2")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted leading-relaxed">
            {t("heroDescription")}
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:opacity-80"
            >
              {t("ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      <section className="snap-start min-h-screen flex items-center border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("modulesBadge")}
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            {t("modulesHeading")}
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {modules.map((mod) => (
              <Link
                key={mod.title}
                href={mod.href}
                className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-foreground/20"
              >
                <mod.icon className="h-5 w-5 text-muted" />
                <h3 className="mt-4 font-semibold">{mod.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {mod.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                  {t("moduleOpen")}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="snap-start min-h-screen flex items-center border-b border-border">
        <div className="mx-auto max-w-3xl px-4 w-full">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("ackBadge")}
          </span>
          <div className="mt-8 space-y-5 text-foreground/85 leading-relaxed">
            <p>{t("ackP1")}</p>
            <p>{t("ackP2")}</p>
            <p>{t("ackP3")}</p>
            <p className="pt-2 text-muted">{t("ackSignature")}</p>
          </div>
        </div>
      </section>

      <section className="snap-start min-h-screen flex items-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("sourcesBadge")}
          </span>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium">{t("sourceNesaTitle")}</p>
              <p className="mt-1 text-sm text-muted">
                {t("sourceNesaDesc")}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium">{t("sourceUacTitle")}</p>
              <p className="mt-1 text-sm text-muted">
                {t("sourceUacDesc")}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium">{t("sourceSparoTitle")}</p>
              <p className="mt-1 text-sm text-muted">
                {t("sourceSparoDesc")}
              </p>
            </div>
          </div>
          <p className="mt-6 text-xs text-muted">
            {t("sourcesDisclaimer")}
          </p>
        </div>
      </section>
    </div>
  );
}
