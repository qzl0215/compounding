---
name: design-system-generator
description: Generate complete design systems (colors, typography, patterns) from product descriptions using local CSV database. Built on ui-ux-pro-max.
origin: ui-ux-pro-max-skill
applicable_to: [claude-code, cursor, windsurf, codex, opencode, generic]
requires: [python3]
---

# Design System Generator

## When to Activate

- Starting a new frontend project
- Uncertain what visual style to use
- Need design system documentation
- Building UI for specific industry (fintech, healthcare, e-commerce)

## Quick Usage

### Python API (Recommended for Agents)

```python
import sys
sys.path.insert(0, '/path/to/resources/design')

from design_system import generate_design_system

# Generate design system from product description
result = generate_design_system(
    query="beauty spa wellness",
    project_name="Serenity Spa"
)

# Print result
print(format_markdown(result))
```

### CLI Usage

```bash
# Search for design resources
python3 design/search.py "fintech dashboard" --domain product
python3 design/search.py "glassmorphism" --domain style
python3 design/search.py "elegant" --domain typography

# Generate complete design system
python3 design/design_system.py "SaaS analytics platform"
```

## What It Returns

### Pattern & Layout
- Recommended page structure
- CTA placement strategy
- Section order

### Color Palette (Complete CSS Variables)
```css
:root {
  --color-primary: #E8B4B8;    /* Soft Pink */
  --color-secondary: #A8D5BA;  /* Sage Green */
  --color-accent: #D4AF37;      /* Gold */
  --color-background: #FFF5F5;  /* Warm White */
  --color-text: #2D3436;         /* Charcoal */
}
```

### Typography
```css
/* Heading: Cormorant Garamond */
/* Body: Montserrat */
@import url('https://fonts.google.com/...');
```

### Key Effects
- Recommended shadows
- Animation timing
- Hover states

### Anti-Patterns
```
❌ Bright neon colors
❌ Harsh animations
❌ Dark mode
❌ AI purple/pink gradients
```

## Domain Search Examples

| Domain | Query Examples |
|--------|----------------|
| `product` | "fintech dashboard", "e-commerce checkout", "healthcare portal" |
| `style` | "glassmorphism", "brutalist", "minimalist" |
| `color` | "luxury", "nature", "tech" |
| `typography` | "modern", "elegant", "playful" |
| `ux` | "form validation", "navigation patterns" |
| `chart` | "trends", "comparisons", "distributions" |

## Database Location

```
resources/design/data/
├── products.csv       # 161 product types
├── styles.csv         # 67 UI styles
├── colors.csv         # 161 color palettes
├── typography.csv     # 57 font pairings
├── landing.csv        # 24 landing page patterns
├── charts.csv         # 25 chart types
├── ux-guidelines.csv  # 99 UX guidelines
├── ui-reasoning.csv   # 161 industry reasoning rules
└── stacks/           # Framework-specific guidelines
    ├── react.csv
    ├── nextjs.csv
    ├── tailwind.csv
    └── ...
```

## Integration with TDD Workflow

Design system generation fits BEFORE coding phase:

```
1. Generate design system → design-system-generator
2. Write tests → tdd-workflow
3. Implement code → coding-standards
4. Security review → security-review-checklist
```

## Anti-Patterns Generated

The tool explicitly warns against:

| Category | Anti-Patterns |
|----------|---------------|
| Colors | Neon, harsh contrasts |
| Animation | Random, excessive |
| Layout | Generic card grids |
| Typography | Overused fonts (Space Grotesk) |

---

*Built on ui-ux-pro-max-skill - https://github.com/nextlevelbuilder/ui-ux-pro-max-skill*
