# Tech Fluent hero → Lovable

A React version of `v2.html`'s hero (the card, glows, big word and spinning chair), ready for the Lovable project behind `ischool-new.lovable.app`.
The site's own navbar stays as it is. The hero leaves room for it.

## Through the Lovable chat (3 messages)

Send the messages in order, each one only after Lovable has finished the previous one.

| # | Attach | Paste |
|---|---|---|
| 1 | The 8 images in `public/tech-fluent-hero/sheets/` | `chat/message-1.txt` |
| 2 | Nothing | `chat/message-2.txt` (3 code files) |
| 3 | Nothing | `chat/message-3.txt` (installs GSAP, adds the component and puts it on the home page) |

After message 1, check that Lovable lists exactly `lg-0.webp` … `lg-3.webp` and `sm-0.webp` … `sm-3.webp` in `public/tech-fluent-hero/sheets/`. If it renamed or moved them, tell it to fix that before you go on.

If Lovable says a message is too long, send its files one at a time with the same wording.

## Through GitHub

Copy `src/` and `public/` into the repository root, then push. Then send only the step 1 and step 3 parts of `chat/message-3.txt`: install the packages and put `<TechFluentHero />` on the home page.

## What's in this folder

| Path | What it is |
|---|---|
| `src/components/tech-fluent-hero/TechFluentHero.tsx` | The component |
| `src/components/tech-fluent-hero/frame-sequence.ts` | Draws the chair frames from the sprite sheets on the canvas |
| `src/components/tech-fluent-hero/glows.ts` | The two Figma glows, embedded as SVG data, so there are no extra files |
| `src/components/tech-fluent-hero/tech-fluent-hero.css` | Styles. Every class starts with `tfh-`, so nothing clashes with Tailwind |
| `public/tech-fluent-hero/sheets/lg-0…3.webp` | Frames 0–78 at 750 × 660, 20 per sheet (5 × 4), 2.5 MB in total |
| `public/tech-fluent-hero/sheets/sm-0…3.webp` | The same frames at 440 × 386, 1.3 MB (small screens, Data Saver) |
| `chat/message-1…3.txt` | The messages to paste, built from the files above |

A visitor loads only one set: 4 images.

To rebuild after a change, run these from `C:\chair-scroll`:
- `node scripts/make-sheets.mjs "<video.mov>"` rebuilds the sheets from the source video.
- `node scripts/lovable-messages.mjs` rebuilds the chat messages from `src/`.

## Check it in Lovable's preview

- **Desktop:** the chair sits on the bottom edge of the card. Scrolling spins it from the girl to the boy, and "Generations" changes to "Creators". If you stop half-way, the page settles on the nearer kid.
- **Phone:** the parts stack in a column, and the word sits fully above the kid's head.
- **Scrolling on:** after the boy, the next section scrolls in normally.

## Settings

| What | Where |
|---|---|
| Words, frames | Props: `<TechFluentHero kicker="Tech Fluent" words={[{ text: "Generations", from: 0, rest: 0 }, { text: "Creators", from: 42, rest: 78 }]} />` |
| Space for the navbar (phones/tablets) | `--tfh-nav-bottom` in the CSS: where the fixed header ends. 74px = `top-4` + 58px tall |
| Colours | `--tfh-navy`, `--tfh-sky`, `--tfh-page-bg` at the top of the CSS |
| Where the sheets are served from | Prop `assetsBase` (default `/tech-fluent-hero`). Set it to a CDN folder if they live elsewhere |
| Spin speed | `window.innerHeight * ws.length` in the component (one screen of scrolling per kid) |
| Chair height on desktop | `--seat` on `.tfh-chair` (0.757 = the shell bottom sits on the card edge) |
| Phone spacing | The `max-width: 640px` block: `--overlap` (how far the head goes into the word) and `--kicker-gap` |

## How it works

- `useGSAP` runs the setup and reverts it on unmount, which removes the pin and the ScrollTrigger. The frame loader is stopped too.
- The site already loads Somar Rounded (400, 500, 600), so the hero inherits the font.
- With "reduce motion" turned on in the OS, scrolling drives the frames directly, with no snap and an instant word swap.

## Tested

Tested in a Vite + React 18 + TypeScript (strict) app with StrictMode, a Tailwind-like reset and a fixed header that copies the live site (top 16px, 58px tall):

| Check | Result |
|---|---|
| Type-check and build | No errors |
| Sheet cells | Frames 0, 19, 20, 42, 59, 60 and 78 match the original frames (mean difference ≤ 1.3, against 11.4 for a neighbouring frame) |
| Desktop 1440 × 757 | Word 182px. The chair's bottom is on the card edge. 4 image requests |
| Motion | Snap goes both ways, the word swaps, and the next section follows the hero |
| Unmount and remount | Cleans up and runs again (one pin each time) |
| Phone 375 × 812 | Stacked layout. The head starts 14px under the word. No sideways scroll |
