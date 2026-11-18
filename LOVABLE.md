# Tech Fluent hero → Lovable

A React version of `v2.html`'s hero (the card, glows, big word and spinning chair), for the Lovable project behind `ischool-new.lovable.app`.
The site's own navbar stays as it is. The hero leaves room for it.

Repository: https://github.com/Tobio-ux/tech-fluent-hero (current version `v1.1.0`)

## Update Lovable to v1.1.0 (one message)

Paste `chat/update-from-github.txt` into the Lovable chat. It tells Lovable to do four things:

1. Replace the 3 component files with the `v1.1.0` versions from GitHub.
2. Point `assetsBase` at `https://cdn.jsdelivr.net/gh/Tobio-ux/tech-fluent-hero@v1.1.0/public/tech-fluent-hero`.
3. Remove any space above the hero, and any `overflow-hidden`, `transform` or `filter` on elements around it.
4. Report each file's line count: TechFluentHero.tsx 347, frame-sequence.ts 144, tech-fluent-hero.css 270.

**If Lovable can't open the links**, send `chat/update-fallback-1.txt`, wait for it to finish, then send `chat/update-fallback-2.txt`.

### What changed in v1.1.0

- **No more jumping.** The hero stays on screen with CSS `position: sticky`, which the browser handles as it scrolls, instead of a JavaScript pin.
  - If an element around the hero clips or scrolls (`overflow: hidden` / `auto`), sticky can't work. The component then falls back to the JavaScript pin and logs a `[TechFluentHero]` warning in the console.
- **Calmer snapping.** When scrolling stops (after 0.25s), the page settles on a kid. A small nudge (under 15%, about 2 wheel notches) goes back to the same kid; anything more carries on to the next one.
- **Arabic.** Arabic words slide as whole words, so the letters stay joined. They have no letter spacing and a taller mask for alef, hamza and descenders, and get more space around them.
- **Any word length.** The big word is sized from its measured width, so long or short words fit the card.
- **Faster word swap,** so two words aren't on screen together for long.

## Arabic page

Paste `chat/arabic-page.txt` into the Lovable chat after the v1.1.0 update. It passes the Arabic text as props, only when the site language is Arabic:

```tsx
<TechFluentHero
  assetsBase="https://cdn.jsdelivr.net/gh/Tobio-ux/tech-fluent-hero@v1.1.0/public/tech-fluent-hero"
  kicker="التكنولوجيا لغة"
  words={[
    { text: "الأجيال", from: 0, rest: 0 },   // the girl
    { text: "المبدعين", from: 42, rest: 78 }, // the boy
  ]}
  imageLabel="طفلان يتناوبان الجلوس على كرسي برتقالي يدور"
/>
```

**Why this wording.** The small line stays while the big word changes, so it has to read correctly from top to bottom with both words: "التكنولوجيا لغة الأجيال" and "التكنولوجيا لغة المبدعين". This keeps the idea of "Tech Fluent" (fluent in the language of technology).

The site's earlier pattern, "أجيال تتحدث التكنولوجيا", doesn't work here for two reasons:
- With "تتحدث التكنولوجيا" on top, the line reads "technology speaks".
- Its verb would have to change to "يتحدثون" for "مبدعون".

**Tested** with this copy (RTL):

| Size | Under the small line | Head below the word | Side space |
|---|---|---|---|
| Desktop 1440 | 33px / 70px | Head in front of the word, as in English | |
| Tablet 768 | 41px / 73px | Head in front of the word, as in English | 60px or more |
| Phone 375 | 30px / 46px | 12–14px | 30px or more |

Nothing is clipped, and the hidden word never shows. Screen readers read the whole sentence.

**v1.0.0 on an Arabic page:** the English word shows reversed ("snoitareneG"), because the page's right-to-left direction flips the letter order. v1.1.0 sets each word's direction from its own text.

## Check it in Lovable's preview

- **Top of the page:** the card starts right under the top edge, with the navbar floating over it. There's no empty band above it.
- **Desktop:** the chair sits on the bottom edge of the card. Scrolling spins it from the girl to the boy, and "Generations" changes to "Creators". One wheel notch and a pause go back to the same kid; a longer scroll goes on to the next. Nothing jumps.
- **Phone:** the parts stack in a column, and the word sits fully above the kid's head.
- **Console:** no `[TechFluentHero]` warning.

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

## Changing it later

1. Edit the files, then rebuild the generated parts from `C:\chair-scroll`:
   - `node scripts/make-sheets.mjs "<video.mov>"` rebuilds the sprite sheets from the source video.
   - `node scripts/lovable-messages.mjs` rebuilds the chat messages. Update `TAG` in it first.
2. Commit, tag the new version and push the commit and the tag.
3. Send Lovable the new message. A pinned tag never changes, so jsDelivr caches it for good. A link to `@main` can keep serving an old copy for hours.

## Settings

| What | Where |
|---|---|
| Words, frames | Props `kicker`, `words` (`from` = frame where the word takes over, `rest` = frame to settle on) |
| Where the images load from | Prop `assetsBase`. Leave it out to use the project's own `public/tech-fluent-hero/` |
| Space for the navbar (phones/tablets) | `--tfh-nav-bottom` in the CSS: where the fixed header ends. 74px = `top-4` + 58px tall |
| Colours | `--tfh-navy`, `--tfh-sky`, `--tfh-page-bg` at the top of the CSS |
| Spin speed | `--tfh-steps` × `100vh` of scrolling (one screen per word), set by the component |
| Snapping | `NUDGE` (0.15) and `delay` (0.25s) in the component |
| Chair height on desktop | `--seat` on `.tfh-chair` (0.757 = the shell bottom sits on the card edge) |
| Phone spacing | The `max-width: 640px` blocks: `--overlap` (how far the head goes into the word) and `--kicker-gap` |

## Tested

Tested in a Vite + React 18 + TypeScript (strict) app with StrictMode, a Tailwind-like reset and a fixed header that copies the live site (top 16px, 58px tall):

| Check | Result |
|---|---|
| Type-check and build | No errors |
| Sticky | The hero stays at the top through the whole scroll, then the next section follows. Also with 80px of space above it, where it moves up smoothly and then sticks |
| Fallback | Inside an `overflow-x: hidden` wrapper it switches to the JavaScript pin and logs the warning |
| Snapping (simulated wheel) | 1 notch goes back, 3 notches go on, from either kid |
| English | Desktop: 182px word, chair on the card edge. Phone: 49px word, head 14px below it |
| Arabic (RTL, أجيال / مبدعون) | Words stay joined and aren't clipped, and the hidden word stays hidden. Clearance under the small line: 16px desktop, 19px tablet, 12px phone. The head is 12–14px below the word on phone |
| Images from jsDelivr | All load, with no console errors |
