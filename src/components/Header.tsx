"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

export function Header() {
  const t = useTranslations("Header");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { label: t("insights"), href: "/insights" },
    { label: t("calculator"), href: "/calculator" },
    { label: t("scaling"), href: "/scaling-graphs" },
    { label: t("honorRoll"), href: "/honor-roll" },
    { label: t("compare"), href: "/compare" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold text-foreground hover:opacity-70 transition-opacity"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-foreground text-background font-mono text-xs font-bold">
            &gt;_
          </span>
          <span>{t("siteName")}</span>
          <span className="rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-muted uppercase tracking-wider">
            {t("beta")}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors hover:text-foreground ${
                pathname === item.href
                  ? "text-foreground bg-surface"
                  : "text-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden inline-flex h-7 w-7 items-center justify-center rounded text-muted hover:text-foreground transition-colors"
            aria-label={t("toggleMenu")}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="sm:hidden border-t border-border/50 bg-background">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 text-sm border-b border-border/50 transition-colors ${
                pathname === item.href
                  ? "text-foreground bg-surface"
                  : "text-muted hover:text-foreground hover:bg-surface-hover/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
