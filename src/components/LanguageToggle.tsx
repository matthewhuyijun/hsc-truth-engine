"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Languages } from "lucide-react";

const options: { locale: string; label: string }[] = [
  { locale: "en", label: "EN" },
  { locale: "zh", label: "中文" },
];

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const toggle = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="hidden sm:flex items-center gap-0.5 rounded-md border border-border/50 bg-surface p-0.5">
      {options.map(({ locale: l, label }) => (
        <button
          key={l}
          onClick={() => toggle(l)}
          className={`inline-flex h-7 items-center justify-center rounded-sm px-2 text-xs font-medium transition-colors ${
            locale === l
              ? "bg-background text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
          aria-label={label}
          title={label}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
