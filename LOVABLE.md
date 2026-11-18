# Tech Fluent hero → Lovable

A React version of `v2.html`'s hero (the card, glows, big word and spinning chair), for the Lovable project behind `ischool-new.lovable.app`.
The site's own navbar stays as it is. The hero leaves room for it.

Repository: https://github.com/Tobio-ux/tech-fluent-hero (version `v1.0.0`)

## Add it in Lovable (one message)

Paste `chat/lovable-from-github.txt` into the Lovable chat. It tells Lovable to do four things:

1. Install `gsap` and `@gsap/react`.
2. Fetch the 3 component files from this repository (pinned to `v1.0.0`) into `src/components/tech-fluent-hero/`.
3. Replace the home page hero with `<TechFluentHero assetsBase="https://cdn.jsdelivr.net/gh/Tobio-ux/tech-fluent-hero@v1.0.0/public/tech-fluent-hero" />`.
4. Report each file's line count, to check nothing was cut off: TechFluentHero.tsx 248, frame-sequence.ts 144, tech-fluent-hero.css 230.

The images (8 sprite sheets and 2 glows) stay in this repository and load through jsDelivr, so nothing is uploaded to Lovable.

**If Lovable can't open the links**, send `chat/fallback-1.txt`, wait for it to finish, then send `chat/fallback-2.txt`. They do the same thing with the code pasted in.

## Check it in Lovable's preview

- **Desktop:** the chair sits on the bottom edge of the card. Scrolling spins it from the girl to the boy, and "Generations" changes to "Creators". If you stop half-way, the page settles on the nearer kid.
- **Phone:** the parts stack in a column, and the word sits fully above the kid's head.
- **Scrolling on:** after the boy, the next section scrolls in normally.

## Files

| Path | What it is |
|---|---|
| `src/components/tech-fluent-hero/TechFluentHero.tsx` | The component |
| `src/components/tech-fluent-hero/frame-sequence.ts` | Draws the chair frames from the sprite sheets on the canvas |
| `src/components/tech-fluent-hero/tech-fluent-hero.css` | Styles. Every class starts with `tfh-`, so nothing clashes with Tailwind |
| `public/tech-fluent-hero/sheets/lg-0…3.webp` | Frames 0–78 at 750 × 660, 20 per sheet (5 × 4), 2.5 MB in total |
| `public/tech-fluent-hero/sheets/sm-0…3.webp` | The same frames at 440 × 386, 1.3 MB (small screens, Data Saver) |
| `public/tech-fluent-hero/glow-blue.svg`, `glow-yellow.svg` | The background glows from Figma |
| `chat/` | The messages to paste into Lovable |

A visitor loads one set: 4 sheets and 2 glows.

## Changing it later

1. Edit the files, then rebuild the generated parts from `C:\chair-scroll`:
   - `node scripts/make-sheets.mjs "<video.mov>"` rebuilds the sprite sheets from the source video.
   - `node scripts/lovable-messages.mjs` rebuilds the chat messages. Update `TAG` in it first.
2. Commit, tag the new version (for example `v1.1.0`) and push the commit and the tag.
3. In Lovable, change `@v1.0.0` in `assetsBase` to the new tag.

A pinned tag never changes, so jsDelivr can cache it for good. A link to `@main` can keep serving an old copy for hours after a change.

## Settings

| What | Where |
|---|---|
| Words, frames | Props: `<TechFluentHero kicker="Tech Fluent" words={[{ text: "Generations", from: 0, rest: 0 }, { text: "Creators", from: 42, rest: 78 }]} />` |
| Where the images load from | Prop `assetsBase`. Leave it out to use the project's own `public/tech-fluent-hero/` |
| Space for the navbar (phones/tablets) | `--tfh-nav-bottom` in the CSS: where the fixed header ends. 74px = `top-4` + 58px tall |
| Colours | `--tfh-navy`, `--tfh-sky`, `--tfh-page-bg` at the top of the CSS |
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
| Desktop 1440 × 757 | Word 182px. The chair's bottom is on the card edge |
| Motion | Snap goes both ways, the word swaps, and the next section follows the hero |
| Unmount and remount | Cleans up and runs again (one pin each time) |
| Phone 375 × 812 | Stacked layout. The head starts 14px under the word. No sideways scroll |
