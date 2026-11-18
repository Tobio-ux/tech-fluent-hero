# Tech Fluent hero

A scroll-driven hero for the iSchool site (React + GSAP ScrollTrigger). The page pins while you scroll, the orange chair spins from one kid to the next, and the big word behind it changes from "Generations" to "Creators".

Figma: [Website] iSchool 2026, node 8613:20021.

## Files

| Path | What it is |
|---|---|
| `src/components/tech-fluent-hero/TechFluentHero.tsx` | The component |
| `src/components/tech-fluent-hero/frame-sequence.ts` | Draws the chair frames from the sprite sheets on a canvas |
| `src/components/tech-fluent-hero/glows.ts` | The two background glows (inline SVG) |
| `src/components/tech-fluent-hero/tech-fluent-hero.css` | Styles (all classes start with `tfh-`) |
| `public/tech-fluent-hero/sheets/` | 8 sprite sheets: frames 0–78, 20 per sheet, large (`lg-*`) and small (`sm-*`) |

## Use it in a Lovable / Vite + React project

1. Install `gsap` and `@gsap/react`.
2. Copy the 4 files in `src/components/tech-fluent-hero/` into the same folder of your project.
3. Render the hero. The sprite sheets can stay in this repository and load through jsDelivr:

```tsx
import TechFluentHero from "@/components/tech-fluent-hero/TechFluentHero";

<TechFluentHero assetsBase="https://cdn.jsdelivr.net/gh/Tobio-ux/tech-fluent-hero@main/public/tech-fluent-hero" />
```

Alternatively, copy `public/tech-fluent-hero/` into your project's `public/` and leave out `assetsBase`.

More detail (settings, how it works, how it was tested) is in `LOVABLE.md`.
