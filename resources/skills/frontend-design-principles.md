---
name: frontend-design-principles
description: Design before code - establish bold aesthetic direction before writing any frontend code. Extracted from anthropic/frontend-design.
origin: anthropic/frontend-design
applicable_to: [claude-code, cursor, windsurf, codex, opencode, generic]
---

# Frontend Design Principles

## When to Activate

- Building web components
- Creating pages or applications
- Designing any user-facing UI
- Styling with CSS/Tailwind

## Core Rule: Design BEFORE Code

**Never start coding until you have committed to a BOLD aesthetic direction.**

### Step 1: Establish Design Direction

Answer these questions before writing any code:

1. **Purpose**: What problem does this solve? Who uses it?
2. **Tone**: Pick ONE extreme aesthetic direction:

   | Direction | Characteristics |
   |-----------|----------------|
   | Brutalist | Raw, anti-design, big type, visible borders, no rounded corners |
   | Editorial | Serif headlines, magazine grid, muted palette, pull quotes |
   | Dark OLED Luxury | True #000 bg, gold/cream accents, thin serif fonts |
   | Retro-Futuristic | Gradient meshes, chrome, geometric shapes, purple/teal |
   | Organic/Natural | Earth tones, rounded shapes, warm shadows |
   | Minimalist | Extreme whitespace, limited palette, precision |
   | Maximalist | Bold colors, dense layouts, mixed typefaces |

3. **Differentiation**: What makes this **UNFORGETTABLE**?

### Step 2: Typography Matters

| ✅ DO | ❌ NEVER |
|-------|---------|
| Distinctive Google Fonts | Inter, Roboto, Arial, system-ui |
| Pair: 1 display font + 1 body font | Same font everywhere |
| Purposeful font sizes | Arbitrary sizing |

**Good Examples:**
- Display: Playfair Display, Bebas Neue, Space Grotesk
- Body: Source Sans Pro, Lato, Merriweather

### Step 3: Color System

**Commit to CSS variables for your entire color system:**

```css
:root {
  --color-primary: #2563EB;
  --color-secondary: #7C3AED;
  --color-accent: #F59E0B;
  --color-background: #0F172A;
  --color-text: #F8FAFC;
  /* ... */
}
```

| ✅ DO | ❌ NEVER |
|-------|---------|
| Bold color choices with sharp accents | Timid, evenly-distributed palettes |
| Atmosphere and depth | Flat, solid backgrounds |
| Gradient meshes, noise textures | Plain white backgrounds |

### Step 4: Motion Philosophy

| ✅ DO | ❌ NEVER |
|-------|---------|
| One well-orchestrated page load reveal | Scattered micro-interactions everywhere |
| High-impact moments | Animation for animation's sake |
| Staggered reveals | Random transitions |

### Step 5: Layout & Spatial

| ✅ DO | ❌ NEVER |
|-------|---------|
| Asymmetry, overlap, diagonal flow | Predictable centered layouts |
| Grid-breaking layouts | Same 12-column card grid |
| Generous negative space OR controlled density | Mediocrity in between |

## The NEVER List

```
🚫 Inter, Roboto, Arial, or system fonts as primary typography
🚫 Purple gradients on white backgrounds
🚫 Rounded cards and cookie-cutter component patterns
🚫 Space Grotesk (overused by AI)
🚫 Flat, solid-color backgrounds
🚫 Scattered micro-interactions
🚫 Predictable "AI slop" aesthetics
```

## Quick Reference

| Design Element | Good | Bad |
|---------------|------|-----|
| Font | Bebas Neue + Source Sans | Inter everywhere |
| Background | Gradient mesh + noise texture | Solid white |
| Cards | Asymmetric layout | Centered grid |
| Animation | Single orchestrated reveal | Random popups |

## Implementation Checklist

Before delivering any frontend work:

- [ ] Distinctive display font + refined body font paired
- [ ] CSS variables for entire color system
- [ ] High-impact animation on load
- [ ] Atmosphere created (textures, gradients, shadows)
- [ ] Asymmetric or grid-breaking layout
- [ ] One memorable "unforgettable" design element
- [ ] NOT on the NEVER list

---

*Extracted from anthropic/frontend-design - Anthropic's official Claude Code skill*
