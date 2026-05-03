import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { KatexBlock } from "@/components/KatexRenderer";
import { Terminal, AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Users, History, Ruler, Award, BarChart3, Calculator, ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("insightsTitle"),
    description: t("insightsDescription"),
    alternates: { canonical: "/insights" },
    openGraph: {
      title: t("insightsOgTitle"),
      description: t("insightsOgDescription"),
      url: "https://hscdata.org/insights",
    },
  };
}

export default async function InsightsPage() {
  const t = await getTranslations("Insights");

  const myths = [
    {
      id: 1,
      icon: AlertTriangle,
      myth: t("myth1Statement"),
      points: [t("myth1p1"), t("myth1p2"), t("myth1p3")],
    },
    {
      id: 2,
      icon: Users,
      myth: t("myth2Statement"),
      points: [t("myth2p1"), t("myth2p2"), t("myth2p3")],
    },
    {
      id: 3,
      icon: TrendingDown,
      myth: t("myth3Statement"),
      points: [t("myth3p1"), t("myth3p2"), t("myth3p3")],
    },
    {
      id: 4,
      icon: History,
      myth: t("myth4Statement"),
      points: [t("myth4p1"), t("myth4p2"), t("myth4p3")],
    },
    {
      id: 5,
      icon: Ruler,
      myth: t("myth5Statement"),
      points: [t("myth5p1"), t("myth5p2"), t("myth5p3")],
    },
    {
      id: 6,
      icon: Award,
      myth: t("myth6Statement"),
      points: [t("myth6p1"), t("myth6p2"), t("myth6p3")],
    },
  ];

  const timeline = [
    {
      step: "01",
      title: t("step01Title"),
      statTerm: t("step01StatTerm"),
      formula: "r_i \\in \\{1, 2, \\dots, n\\}",
      plain: t("step01Plain"),
      takeaway: t("step01Takeaway"),
      points: [t("step01p1"), t("step01p2"), t("step01p3")],
    },
    {
      step: "02",
      title: t("step02Title"),
      statTerm: t("step02StatTerm"),
      formula: "x_i \\in [0, x_{\\max}]",
      plain: t("step02Plain"),
      points: [t("step02p1"), t("step02p2"), t("step02p3")],
    },
    {
      step: "03",
      title: t("step03Title"),
      statTerm: t("step03StatTerm"),
      formula: "M_i = a r_i^2 + b r_i + c",
      plain: t("step03Plain"),
      points: [t("step03p1"), t("step03p2"), t("step03p3")],
    },
    {
      step: "04",
      title: t("step04Title"),
      statTerm: t("step04StatTerm"),
      formula: "A(x) = B_{\\text{lower}} + \\frac{x - R_{\\text{lower}}}{R_{\\text{upper}} - R_{\\text{lower}}} \\times (B_{\\text{upper}} - B_{\\text{lower}})",
      plain: t("step04Plain"),
      points: [t("step04p1"), t("step04p2"), t("step04p3")],
    },
    {
      step: "05",
      title: t("step05Title"),
      statTerm: t("step05StatTerm"),
      formula: "\\text{HSC}_i = \\left\\lceil \\frac{\\text{Moderated}_i + \\text{AlignedExam}_i}{2} \\right\\rceil",
      plain: t("step05Plain"),
      takeaway: t("step05Takeaway"),
      points: [t("step05p1"), t("step05p2"), t("step05p3")],
    },
    {
      step: "06",
      title: t("step06Title"),
      statTerm: t("step06StatTerm"),
      formula: "\\text{Raw}_i = \\frac{\\text{RawExam}_i + \\text{RawModerated}_i}{2}",
      plain: t("step06Plain"),
      takeaway: t("step06Takeaway"),
      points: [t("step06p1"), t("step06p2"), t("step06p3")],
    },
    {
      step: "07",
      title: t("step07Title"),
      statTerm: t("step07StatTerm"),
      formula: "z_i = \\frac{x_i - \\mu_j}{\\sigma_j} \\quad \\rightarrow \\quad \\mu=25, \\sigma=12",
      plain: t("step07Plain"),
      points: [t("step07p1"), t("step07p2"), t("step07p3")],
    },
    {
      step: "08",
      title: t("step08Title"),
      statTerm: t("step08StatTerm"),
      formula: "\\mu_j^{\\text{scaled}} = \\frac{1}{n_j} \\sum_{i} \\bar{s}_i^{(k)}",
      plain: t("step08Plain"),
      points: [t("step08p1"), t("step08p2"), t("step08p3")],
    },
    {
      step: "09",
      title: t("step09Title"),
      statTerm: t("step09StatTerm"),
      formula: "\\text{Agg} = \\sum_{\\text{Best 2U English}} + \\sum_{\\text{Best 8U Remaining}}",
      plain: t("step09Plain"),
      points: [t("step09p1"), t("step09p2"), t("step09p3")],
    },
    {
      step: "10",
      title: t("step10Title"),
      statTerm: t("step10StatTerm"),
      formula: "P(x) = \\begin{cases} \\frac{x^3}{(1000\\alpha)^2} & 0 \\leq x \\leq 100\\alpha \\\\ 1 - \\frac{(100-x)^3}{(1000-1000\\alpha)^2} & 100\\alpha \\leq x \\leq 100 \\end{cases}",
      plain: t("step10Plain"),
      points: [t("step10p1"), t("step10p2"), t("step10p3")],
    },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="h-5 w-5 text-accent" />
            <span className="text-sm font-mono font-medium text-accent uppercase tracking-wider">{t("badge")}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground max-w-3xl leading-[1.1]">
            {t("heroLine")}{" "}
            <span className="text-accent">{t("heroHSC")}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted leading-relaxed">
            {t("heroDescription")}
          </p>
          <div className="mt-8 flex items-center gap-4 text-sm font-mono text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              {t("heroCallout1")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              {t("heroCallout2")}
            </span>
          </div>
        </div>
      </section>

      {/* ===== THREE MYTHS ===== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-12">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("mythsHeading")}</h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {myths.map((m) => (
              <div 
                key={m.id}
                className="group relative rounded-xl border border-border bg-surface overflow-hidden hover:border-accent/30 transition-colors"
              >
                {/* Myth header */}
                <div className="border-b border-border bg-rose-500/[0.03] dark:bg-rose-500/[0.05] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      {t("mythN", { n: m.id })}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-rose-500 transition-colors">
                    {m.myth}
                  </h3>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center -my-3 relative z-10">
                  <div className="bg-background dark:bg-background rounded-full p-1">
                    <ChevronRight className="h-4 w-4 text-accent rotate-90" />
                  </div>
                </div>

                {/* Truth body */}
                <div className="p-6 pt-8">
                  <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-accent/10 text-accent mb-4">
                    {t("truth")}
                  </span>
                  <ul className="space-y-2">
                    {m.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/90 leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TIMELINE: NESA ===== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-accent" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("pipelineHeading")}</h2>
          </div>
          <p className="text-muted mb-4 max-w-2xl">
            {t("pipelineSubheading")}
          </p>

          {/* NESA Domain */}
          <div className="mb-2">
            <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-accent/10 text-accent mb-8">
              {t("pipelineNesaDomain")}
            </span>
          </div>

          <div className="space-y-6 max-w-full overflow-hidden">
            {timeline.slice(0, 5).map((item) => (
              <div 
                key={item.step}
                className="grid gap-6 lg:grid-cols-2 rounded-xl border border-border bg-surface overflow-hidden hover:border-accent/20 transition-colors"
              >
                <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-border bg-terminal-bg/50 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent text-sm font-mono font-bold">
                      {item.step}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-xs text-accent font-mono uppercase tracking-wider truncate">{item.statTerm}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4 overflow-x-auto">
                    <KatexBlock latex={item.formula} displayMode />
                  </div>
                </div>
                <div className="p-6 lg:p-8 flex items-start min-w-0">
                  <div>
                    <p className="text-base font-medium text-foreground mb-4 leading-relaxed">{item.plain}</p>
                    <ul className="space-y-2">
                      {item.points.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/90 leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                    {"takeaway" in item && (
                      <p className="mt-3 text-sm italic text-accent/80 leading-relaxed">{item.takeaway}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-12">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-mono text-muted uppercase tracking-widest shrink-0">{t("pipelineUacTakesOver")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* UAC Domain */}
          <div className="mb-2">
            <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-accent/10 text-accent mb-8">
              {t("pipelineUacDomain")}
            </span>
          </div>

          <div className="space-y-6 max-w-full overflow-hidden">
            {timeline.slice(5).map((item) => (
              <div 
                key={item.step}
                className="grid gap-6 lg:grid-cols-2 rounded-xl border border-border bg-surface overflow-hidden hover:border-accent/20 transition-colors"
              >
                <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-border bg-terminal-bg/50 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent text-sm font-mono font-bold">
                      {item.step}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-xs text-accent font-mono uppercase tracking-wider truncate">{item.statTerm}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4 overflow-x-auto">
                    <KatexBlock latex={item.formula} displayMode />
                  </div>
                </div>
                <div className="p-6 lg:p-8 flex items-start min-w-0">
                  <div>
                    <p className="text-base font-medium text-foreground mb-4 leading-relaxed">{item.plain}</p>
                    <ul className="space-y-2">
                      {item.points.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/90 leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                    {"takeaway" in item && (
                      <p className="mt-3 text-sm italic text-accent/80 leading-relaxed">{item.takeaway}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER CTA ===== */}
      <section className="border-t border-border py-16 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <BarChart3 className="h-10 w-10 text-accent mx-auto mb-6" />
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            {t("footerCtaHeading")}
          </h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            {t("footerCtaDesc")}
          </p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-background shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-accent/40"
          >
            <Calculator className="h-4 w-4" />
            {t("footerCtaButton")}
          </Link>
        </div>
      </section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: myths.map((m) => ({
            "@type": "Question",
            name: m.myth,
            acceptedAnswer: {
              "@type": "Answer",
              text: m.points.join(". ") + ".",
            },
          })),
        }}
      />
    </div>
  );
}


