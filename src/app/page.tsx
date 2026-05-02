import Link from "next/link";
import { ArrowRight, BarChart3, Calculator, Award } from "lucide-react";

const modules = [
  {
    icon: BarChart3,
    title: "Insights",
    description: "How HSC and ATAR actually work. Not myths — the mathematical reality.",
    href: "/insights",
  },
  {
    icon: Calculator,
    title: "Calculator",
    description: "Estimate your ATAR from expected marks using 2025 UAC scaling data.",
    href: "/calculator",
  },
  {
    icon: Award,
    title: "Honor Roll",
    description: "Band 6 achievements across NSW schools. Filter by year and subject.",
    href: "/honor-roll",
  },
];

export default function HomePage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto snap-y snap-mandatory scroll-smooth">
      {/* Hero */}
      <section className="snap-start min-h-screen flex items-center relative border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-24 sm:py-32 w-full">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            HSC Data
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            The Mathematics Behind
            <br />
            <span className="text-muted">Your Results</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted leading-relaxed">
            No myths. No rumours. Just the actual statistical mechanics 
            of how NESA and UAC calculate your marks.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:opacity-80"
            >
              Read the Truth
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
            >
              Try Calculator
            </Link>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="snap-start min-h-screen flex items-center border-b border-border">
        <div className="mx-auto max-w-5xl px-4 w-full">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Three Tools
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Choose Your Path
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
                  Open
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Acknowledgements */}
      <section className="snap-start min-h-screen flex items-center border-b border-border">
        <div className="mx-auto max-w-3xl px-4 w-full">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Acknowledgements
          </span>
          <div className="mt-8 space-y-5 text-foreground/85 leading-relaxed">
            <p>
              This project was built with respect for the teachers who made the HSC what it is — the ones who
              stayed back, wrote detailed feedback, and treated their students' results like they mattered. If you
              had one, you get it.
            </p>
            <p>
              It's also for every student who cared enough to grind. The late nights, the early mornings — none of
              that disappears. If you earned a place on this list, it stays. If you're class of 2025 like me, maybe
              that pushes you to leave your name here too.
            </p>
            <p>
              The HSC has no prerequisites. No connections, no background checks, no shortcuts — just turn up and do
              the work. It's a system that rewards effort, and that's worth acknowledging. This site compares you
              against thousands of others, but the only thing you control is yourself. Getting better than you were
              yesterday: that's the actual win.
            </p>
            <p className="pt-2 text-muted">
              — Matthew
            </p>
          </div>
        </div>
      </section>

      {/* Source */}
      <section className="snap-start min-h-screen flex items-center">
        <div className="mx-auto max-w-5xl px-4 w-full">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Data Sources
          </span>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium">NESA</p>
              <p className="mt-1 text-sm text-muted">
                NSW Education Standards Authority — examination and moderation methodology
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium">UAC</p>
              <p className="mt-1 text-sm text-muted">
                Universities Admissions Centre — scaling algorithms and ATAR calculation
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium">SPaRO</p>
              <p className="mt-1 text-sm text-muted">
                School Planning and Reporting Online — NSW public school annual reports
              </p>
            </div>
          </div>
          <p className="mt-6 text-xs text-muted">
            All data derived from official publications. Not affiliated with NESA, UAC, or any school.
          </p>
        </div>
      </section>
    </div>
  );
}
