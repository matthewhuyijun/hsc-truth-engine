import { AtarCalculator } from "@/components/AtarCalculator";
import { ExternalLink } from "lucide-react";

export default function CalculatorPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          Tool
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">ATAR Calculator</h1>
        <p className="mt-2 max-w-xl text-sm text-muted leading-relaxed">
          Estimate your ATAR from expected HSC marks using 2019–2025 UAC scaling data.
        </p>

        {/* UAC Compass callout */}
        <div className="mt-4 rounded-lg border border-border bg-surface p-3 flex items-start gap-3">
          <ExternalLink className="h-4 w-4 text-muted flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted leading-relaxed">
            For the most accurate ATAR estimate, use the official{" "}
            <a
              href="https://www.uac.edu.au/atar-compass"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium text-foreground hover:opacity-70"
            >
              UAC ATAR Compass
            </a>
            . This calculator uses historical data and is a best-effort estimate. Results may differ.
          </p>
        </div>

        <div className="mt-10">
          <AtarCalculator />
        </div>
      </div>
    </div>
  );
}
