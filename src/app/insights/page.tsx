import type { Metadata } from "next";
import { KatexBlock } from "@/components/KatexRenderer";
import { Terminal, AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Users, History, Ruler, Award, BarChart3, Calculator, ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Insights — How HSC Scaling & ATAR Work",
  description:
    "The definitive guide to HSC scaling, moderation, and ATAR calculation. Debunking myths with data. Learn how your HSC marks are actually determined.",
  alternates: {
    canonical: "/insights",
  },
  openGraph: {
    title: "HSC Insights — How Scaling & ATAR Actually Work",
    description:
      "The definitive guide to HSC scaling, moderation, and ATAR calculation. No myths — just the mathematical reality.",
    url: "https://hscdata.org/insights",
  },
};

const myths = [
  {
    id: 1,
    icon: AlertTriangle,
    myth: "Some subjects are 'scaled down' by the system",
    points: [
      "Scaling is not set by NESA or UAC — it is a mathematical outcome",
      "A subject's scaled mean reflects the competitive strength of its candidature",
      "If you rank first, you receive the highest scaled mark regardless of the subject",
    ]
  },
  {
    id: 2,
    icon: Users,
    myth: "My school's generous marking will boost my HSC",
    points: [
      "Schools submit only your rank, not your internal marks",
      "Internal absolute marks are completely discarded during moderation",
      "Your moderated mark depends entirely on your rank and your cohort's exam performance",
    ]
  },
  {
    id: 3,
    icon: TrendingDown,
    myth: "The bottom of my cohort will drag me down",
    points: [
      "Bottom students only anchor the minimum — your position is unaffected",
      "Moderation uses three points: top exam mark, mean exam mark, bottom exam mark",
      "Your moderated mark depends on your rank position, not on how weak the lowest student is",
    ]
  },
  {
    id: 4,
    icon: History,
    myth: "This school or subject always scales badly — this year will too",
    points: [
      "Moderation is recalculated fresh every year using that cohort's actual exam results",
      "No school-level historical data carries over into a new year's moderation",
      "Last year's scaling report has zero predictive power for this year's outcome",
    ]
  },
  {
    id: 5,
    icon: Ruler,
    myth: "Being rank 2 with a big gap to #1 hurts the same as a small gap",
    points: [
      "The quadratic moderation curve preserves relative gaps between ranks",
      "A 5% internal gap to rank 1 stays proportionally larger than a 1% gap after moderation",
      "The tighter you close the gap, the closer your moderated mark to the person above you",
    ]
  },
  {
    id: 6,
    icon: Award,
    myth: "Only the top 10% of students get Band 6",
    points: [
      "Performance bands are standards-referenced — no fixed percentages, no quotas",
      "Band cut-offs are decided each year by judging panels who review actual student responses against band descriptors",
      "If every student meets the Band 6 standard, every student gets Band 6 — a course could have 50% B6 one year and 2% the next",
    ]
  }
];

const timeline = [
  {
    step: "01",
    title: "School Assessment",
    statTerm: "Rank Vector",
    formula: "r_i \\in \\{1, 2, \\dots, n\\}",
    plain: "Your school submits a list of where everyone sits — first, second, third. That's it. The actual numbers are thrown away.",
    takeaway: "Both rank and internal marks matter — unless you are rank 1.",
    points: [
      "Your school submits your relative position in each course",
      "Absolute internal marks (90 vs 95) are irrelevant — only the ranking matters",
      "If ranked #1, your moderated mark anchors to the highest exam mark in your cohort",
    ]
  },
  {
    step: "02",
    title: "HSC Examination",
    statTerm: "Raw Score",
    formula: "x_i \\in [0, x_{\\max}]",
    plain: "This is your one totally fair moment — same paper, same conditions, same clock, against every other student in NSW.",
    points: [
      "Your true performance under identical conditions across the entire state",
      "Raw marks are not reported to students",
      "Serves as the anchor for moderation and the input for scaling",
    ]
  },
  {
    step: "03",
    title: "Moderation",
    statTerm: "Quadratic Transformation",
    formula: "M_i = a r_i^2 + b r_i + c",
    plain: "Your school's internal marks don't survive. NESA uses your rank and your cohort's actual exam results to work backwards and assign you a fair mark.",
    points: [
      "A quadratic curve maps your rank to a moderated mark using three anchor points",
      "The state-wide exam is the calibration — the fairest possible reference point because every school is measured against the same yardstick",
      "Rank order and relative gaps are preserved; school generosity is erased",
    ]
  },
  {
    step: "04",
    title: "Alignment",
    statTerm: "Standards-Referenced Mapping",
    formula: "A(x) = B_{\\text{lower}} + \\frac{x - R_{\\text{lower}}}{R_{\\text{upper}} - R_{\\text{lower}}} \\times (B_{\\text{upper}} - B_{\\text{lower}})",
    plain: "Raw marks get translated into the familiar 0–100 band scale. No quotas. If everyone deserves a Band 6, everyone gets one.",
    points: [
      "A judging panel reviews real student responses each year to decide the raw mark that meets Band 6 standard",
      "Band cutoffs are standards-referenced — no curve, no quota. If every student meets the descriptor, every student gets Band 6",
      "The aligned marks you see on your HSC report are NOT used by UAC for ATAR calculation",
    ]
  },
  {
    step: "05",
    title: "HSC Mark",
    statTerm: "Arithmetic Mean",
    formula: "\\text{HSC}_i = \\left\\lceil \\frac{\\text{Moderated}_i + \\text{AlignedExam}_i}{2} \\right\\rceil",
    plain: "The number on your certificate — the one everyone talks about. But UAC glances at it and immediately ignores it.",
    takeaway: "The HSC mark on your certificate is for show. UAC is already looking past it.",
    points: [
      "This is what NESA reports — the number you actually see",
      "Critical: UAC does NOT use this aligned mark for ATAR calculation",
      "UAC goes back to the raw marks. The aligned HSC mark is for reporting only",
    ]
  },
  {
    step: "06",
    title: "Raw Marks for UAC",
    statTerm: "Hidden Input",
    formula: "\\text{Raw}_i = \\frac{\\text{RawExam}_i + \\text{RawModerated}_i}{2}",
    plain: "Behind the curtain, UAC takes the untouched raw marks — the ones you'll never see — and begins the actual ATAR calculation from scratch.",
    takeaway: "You will live your entire life not knowing the numbers that actually determined your ATAR.",
    points: [
      "UAC receives your raw marks from NESA — before alignment to performance bands",
      "You will never see these values, yet they determine your entire ATAR",
      "The raw HSC mark is the mean of your raw exam and raw moderated assessment",
    ]
  },
  {
    step: "07",
    title: "Initial Standardisation",
    statTerm: "Z-Score Normalisation (per unit)",
    formula: "z_i = \\frac{x_i - \\mu_j}{\\sigma_j} \\quad \\rightarrow \\quad \\mu=25, \\sigma=12",
    plain: "Every subject gets placed on the exact same ruler — same average, same spread — so a 70 in Physics can be compared to a 70 in Drama.",
    points: [
      "All courses are standardised to a common baseline: mean 25, SD 12 per unit",
      "This is a linear shift — it does NOT change your rank within the course",
      "Enables cross-subject comparison by putting all courses on the same scale",
    ]
  },
  {
    step: "08",
    title: "Scaling Algorithm",
    statTerm: "Simultaneous Equations (Iterative)",
    formula: "\\mu_j^{\\text{scaled}} = \\frac{1}{n_j} \\sum_{i} \\bar{s}_i^{(k)}",
    plain: "Scaling isn't set by a person. It's a mirror: a subject is 'strong' if the students who take it are strong across all their subjects. No one decides this — the data reveals it.",
    points: [
      "A course's scaled mean = average scaled achievement of its students across ALL their subjects",
      "This creates a system of simultaneous equations solved iteratively until convergence",
      "A course's scaled mean rises when its students perform strongly in their other courses",
    ]
  },
  {
    step: "09",
    title: "Aggregate",
    statTerm: "Best 10 Units",
    formula: "\\text{Agg} = \\sum_{\\text{Best 2U English}} + \\sum_{\\text{Best 8U Remaining}}",
    plain: "Your total score. Best 10 units added up, with English guaranteed a seat at the table. Weak subjects simply don't count.",
    points: [
      "Best 2 units of English + best 8 units from remaining courses (maximum 500)",
      "In 2024, 99.95 ATAR required an aggregate of 477.4",
      "Only the strongest subset of your results counts — weak subjects are discarded",
    ]
  },
  {
    step: "10",
    title: "ATAR",
    statTerm: "Percentile Rank via Cubic Spline",
    formula: "P(x) = \\begin{cases} \\frac{x^3}{(1000\\alpha)^2} & 0 \\leq x \\leq 100\\alpha \\\\ 1 - \\frac{(100-x)^3}{(1000-1000\\alpha)^2} & 100\\alpha \\leq x \\leq 100 \\end{cases}",
    plain: "This is not a mark. It is a percentile: what fraction of your entire age group you beat. ATAR 99.95 means only 0.05% of the state did better.",
    points: [
      "ATAR is not a mark — it is a percentile rank against the entire HSC-aged population (ages 16-20)",
      "ATAR 99.95 means you outperformed 99.95% of the age cohort assuming they all sat the HSC",
      "In 2024, only 53 students achieved 99.95 across the entire state",
    ]
  }
];

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden border-b border-border">
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="h-5 w-5 text-accent" />
            <span className="text-sm font-mono font-medium text-accent uppercase tracking-wider">HSC Data</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground max-w-3xl leading-[1.1]">
            The Truth About{" "}
            <span className="text-accent">HSC</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted leading-relaxed">
            Not what you have heard. Not what your tutor told you. 
            What actually happens — derived directly from NESA and UAC technical documentation.
          </p>
          <div className="mt-8 flex items-center gap-4 text-sm font-mono text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Primary sources only
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Mathematical derivations
            </span>
          </div>
        </div>
      </section>

      {/* ===== THREE MYTHS ===== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-12">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Myths That Refuse to Die</h2>
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
                      Myth {m.id}
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
                    The Truth
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
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">The Complete Pipeline</h2>
          </div>
          <p className="text-muted mb-4 max-w-2xl">
            From the moment you sit your school assessment to the day you receive your ATAR.
          </p>

          {/* NESA Domain */}
          <div className="mb-2">
            <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-8">
              NESA Domain — What happens inside NESA
            </span>
          </div>

          <div className="space-y-6">
            {timeline.slice(0, 5).map((item) => (
              <div 
                key={item.step}
                className="grid gap-6 lg:grid-cols-2 rounded-xl border border-border bg-surface overflow-hidden hover:border-accent/20 transition-colors"
              >
                <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-border bg-terminal-bg/50">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent text-sm font-mono font-bold">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-xs text-accent font-mono uppercase tracking-wider">{item.statTerm}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4 overflow-x-auto">
                    <KatexBlock latex={item.formula} displayMode />
                  </div>
                </div>
                <div className="p-6 lg:p-8 flex items-start">
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
            <span className="text-xs font-mono text-muted uppercase tracking-widest shrink-0">UAC takes over</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* UAC Domain */}
          <div className="mb-2">
            <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-accent/10 text-accent mb-8">
              UAC Domain — What happens inside UAC
            </span>
          </div>

          <div className="space-y-6">
            {timeline.slice(5).map((item) => (
              <div 
                key={item.step}
                className="grid gap-6 lg:grid-cols-2 rounded-xl border border-border bg-surface overflow-hidden hover:border-accent/20 transition-colors"
              >
                <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-border bg-terminal-bg/50">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent text-sm font-mono font-bold">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-xs text-accent font-mono uppercase tracking-wider">{item.statTerm}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4 overflow-x-auto">
                    <KatexBlock latex={item.formula} displayMode />
                  </div>
                </div>
                <div className="p-6 lg:p-8 flex items-start">
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
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <BarChart3 className="h-10 w-10 text-accent mx-auto mb-6" />
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Want to run the numbers yourself?
          </h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            Use the ATAR Calculator to estimate your aggregate based on historical scaling data 
            from the 2024 UAC Scaling Report.
          </p>
          <a 
            href="/calculator"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-accent/40"
          >
            <Calculator className="h-4 w-4" />
            Open Calculator
          </a>
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


