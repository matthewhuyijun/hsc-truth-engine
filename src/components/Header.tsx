"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { label: "Insights", href: "/insights" },
  { label: "Calculator", href: "/calculator" },
  { label: "Scaling", href: "/scaling-graphs" },
  { label: "Honor Roll", href: "/honor-roll" },
  { label: "Compare", href: "/compare" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold text-foreground hover:opacity-70 transition-opacity"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-foreground text-background font-mono text-xs font-bold">
            &gt;_
          </span>
          <span>HSC Data</span>
          <span className="rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-muted uppercase tracking-wider">
            Beta
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
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden inline-flex h-7 w-7 items-center justify-center rounded text-muted hover:text-foreground transition-colors"
            aria-label="Toggle menu"
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
