# HSC Truth Engine — Design System

> Reference this document when building any new page or component.
> Follow these rules. Don't invent new patterns.

---

## Philosophy

The site should feel like a high-quality indie developer tool — not a corporate SaaS template, not a content farm.

**Inspiration:** Linear.app, Vercel.com, early Stripe docs.

**Key qualities:**
- Restrained use of color. Black, white, gray, and one accent tone.
- Generous whitespace. Content breathes.
- Typography does the work, not decorations.
- Fast, snappy, no bloat.

---

## Color System

### CSS Variables (defined in `globals.css`)

| Variable | Light Mode | Dark Mode | Purpose |
|----------|-----------|-----------|---------|
| `--background` | `#ffffff` | `#09090b` | Page background |
| `--foreground` | `#09090b` | `#fafafa` | Primary text |
| `--muted` | `#71717a` | `#71717a` | Secondary text, labels |
| `--border` | `#e4e4e7` | `#27272a` | Borders, dividers |
| `--surface` | `#fafafa` | `#121212` | Card/section backgrounds |
| `--surface-hover` | `#f4f4f5` | `#1a1a1a` | Hover states |
| `--accent` | `#18181b` | `#ffffff` | Inverse text, CTA bg |
| `--accent-dim` | `#f4f4f5` | `#27272a` | Subtle accent bg |
| `--terminal-bg` | `#fafafa` | `#0c0c0c` | Code/math block bg |

### Usage Rules

- **Body text:** Always `text-foreground`
- **Subtext/labels:** Always `text-muted`
- **Borders:** Always `border-border`
- **Cards:** Always `bg-surface` with optional `border border-border`
- **Hover:** Transition to `bg-surface-hover`
- **Inverse/CTA:** `bg-foreground text-background` or `bg-accent text-background`

**Never use these colors:**
- ❌ Blue (`blue-500`, `blue-600`) — screams AI-generated SaaS
- ❌ Slate (`slate-200` etc) — outdated, overused
- ❌ Emerald, Amber, Rose accents — reserved for specific semantic uses only

---

## Typography

### Font Stack

```css
font-family: var(--font-geist-sans), -apple-system, system-ui, sans-serif;  /* Body */
font-family: var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace; /* Code/Numbers */
```

### Scale

| Element | Size | Weight | Line Height | Notes |
|---------|------|--------|-------------|-------|
| Page title (H1) | `text-3xl` | `font-bold` (700) | `leading-tight` | Hero only |
| Section title (H2) | `text-2xl` | `font-bold` (700) | `leading-tight` | Major sections |
| Card title (H3) | `text-base` | `font-semibold` (600) | `leading-snug` | Card headers |
| Body | `text-sm` | `font-normal` (400) | `leading-relaxed` | Default paragraphs |
| Label/Caption | `text-xs` | `font-medium` (500) | `leading-normal` | Uppercase with `tracking-wider` |
| Mono/Numbers | `text-sm` | `font-normal` | `leading-normal` | Stats, values, formulas |

### Label Convention

```tsx
<span className="text-xs font-medium uppercase tracking-wider text-muted">
  label text
</span>
```

Use this for:
- Section labels ("Myth 1", "Step 01")
- Stat labels ("ATAR", "Aggregate")
- Metadata ("Data sourced from NESA")

---

## Spacing

### Container

```tsx
<div className="mx-auto max-w-5xl px-4">
  {/* Content */}
</div>
```

- **Max width:** `max-w-5xl` (1024px) for content
- **Padding:** `px-4` mobile, no need for `sm:` breakpoint unless content is very wide

### Section Spacing

```tsx
<section className="py-16 sm:py-24">
  {/* Content */}
</section>
```

- **Vertical padding:** `py-16` (64px) minimum, `py-24` (96px) for major sections
- **Never use:** Random padding values like `py-20`, `py-28` etc

### Card Spacing

```tsx
<div className="rounded-xl border border-border bg-surface p-6">
  {/* Content */}
</div>
```

- **Border radius:** `rounded-xl` (12px) for cards, `rounded-lg` (8px) for small elements
- **Padding:** `p-6` (24px) standard, `p-8` (32px) for featured cards

---

## Components

### Navigation (`layout.tsx`)

```tsx
<header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
  <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
    {/* Logo + Nav Links */}
  </div>
</header>
```

Rules:
- Height: `h-14` (56px)
- Logo: Monogram + text name
- Nav links: Regular weight, muted color, hover to foreground
- Right side: Theme toggle only
- Body needs: `<div className="h-14" />` spacer

### Card

```tsx
<div className="rounded-xl border border-border bg-surface overflow-hidden hover:border-foreground/20 transition-colors">
  {/* Content */}
</div>
```

- Always rounded-xl
- Always border + bg-surface
- Optional hover: border darkens slightly
- Don't use shadow — shadows are old school

### Terminal / Code Block

```tsx
<div className="rounded-lg border border-terminal-border bg-terminal-bg p-4 font-mono text-sm overflow-x-auto">
  {/* Code, math, or terminal output */}
</div>
```

- Font: `font-mono`
- Size: `text-sm`
- Background: `--terminal-bg`
- Border: `--terminal-border`
- Padding: `p-4`

Use for:
- LaTeX formulas
- Code snippets
- Terminal-style output
- Data tables (small)

### Section with Label

```tsx
<section>
  <div className="mx-auto max-w-5xl px-4">
    <span className="text-xs font-medium uppercase tracking-wider text-muted">
      Section Label
    </span>
    <h2 className="mt-2 text-2xl font-bold">Section Title</h2>
    {/* Content */}
  </div>
</section>
```

- Label + Title is the standard pattern
- Label is always uppercase, muted, tracking-wider

---

## Layout Patterns

### Two-Column Split (Math Left, Explain Right)

```tsx
<div className="grid gap-6 lg:grid-cols-2 rounded-xl border border-border bg-surface overflow-hidden">
  {/* Left: Math/Formula */}
  <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-border bg-terminal-bg/50">
    <KatexBlock latex="your-formula-here" displayMode />
  </div>
  
  {/* Right: Explanation */}
  <div className="p-6 lg:p-8 flex items-center">
    <p className="text-foreground/90 leading-relaxed">
      Explanation in plain English...
    </p>
  </div>
</div>
```

Use this for:
- Timeline steps
- Formula explanations
- Before/after comparisons

### Grid of Cards

```tsx
<div className="grid gap-6 lg:grid-cols-3">
  {items.map(item => (
    <div key={item.id} className="rounded-xl border border-border bg-surface p-6">
      {/* Card content */}
    </div>
  ))}
</div>
```

### Stats Row

```tsx
<div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
  {stats.map(stat => (
    <div key={stat.label}>
      <div className="text-3xl font-bold font-mono">{stat.value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted">{stat.label}</div>
    </div>
  ))}
</div>
```

---

## Animation & Interaction

### Transitions

```css
transition-colors duration-200
```

- Default: 200ms
- Use for: hover states, theme changes
- Never exceed 300ms

### Hover

```tsx
<button className="bg-surface hover:bg-surface-hover transition-colors duration-200">
  {/* Content */}
</button>
```

- Always color/background transition
- Never transform (no scale, no translate)
- Keep it subtle

### No Animations On Mount

- No fade-in on load
- No stagger delays
- No scroll-triggered reveals
- Content should be instantly visible

---

## Content Writing

### Tone

- Direct. No fluff.
- "Scaling is NOT set by NESA" — not "It is a common misconception that..."
- Use bold for emphasis, not all caps

### Technical Terms

- Define terms in parentheses on first use
- Example: "moderation (adjusting school marks to a common scale)"
- After that, use the term directly

### Data Citations

- Always cite source: "UAC 2024 Scaling Report, Section 3.2"
- Use small text: `text-xs text-muted`
- Position at bottom of section or inline

---

## Anti-Patterns (NEVER DO)

1. ❌ **Shadows on cards** — use borders only
2. ❌ **Gradient buttons** — solid fills only
3. ❌ **Colorful icons** — monochrome only
4. ❌ **Rounded-full buttons** — use rounded-lg or rounded-xl
5. ❌ **Emoji as icons** — use Lucide React only
6. ❌ **Blue anywhere** — especially not for links or accents
7. ❌ **Multiple font sizes in one card** — maximum 2 sizes
8. ❌ **Center-aligned body text** — left-align only
9. ❌ **More than 3 lines per paragraph** — break it up
10. ❌ **Decorative graphics** — no illustrations, no patterns
