/**
 * "Tech Fluent ___" hero (Figma: [Website] iSchool 2026, node 8613:20021).
 *
 * The section pins while you scroll. Scroll drives the chair (a canvas frame
 * sequence), and the big word behind the chair swaps each time the chair faces
 * away and a new kid sits down. When scrolling stops it settles on the nearest
 * kid facing the camera.
 *
 * Needs: gsap + @gsap/react, and the images in public/tech-fluent-hero/ (8 sprite
 * sheets + 2 glows). They can also load from a CDN: see the assetsBase prop.
 * The page font (Somar Rounded) is inherited from the site.
 */
import { useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { createFrameSequence, type SheetManifest } from "./frame-sequence";
import "./tech-fluent-hero.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);
// Don't recalculate when a phone's address bar shows/hides.
ScrollTrigger.config({ ignoreMobileResize: true });

export type HeroWord = {
  /** The big word. */
  text: string;
  /** Frame where this word takes over (the chair is facing away). */
  from: number;
  /** Frame the page settles on when scrolling stops (the kid faces the camera). */
  rest: number;
};

/**
 * Frames 0–78 (the girl, then the boy), packed 5 × 4 per sprite sheet:
 * sheets/lg-0…3.webp (750 × 660 per frame) and sheets/sm-0…3.webp (440 × 386).
 */
const FRAME_COUNT = 79;
const SHEET_COLS = 5;
const SHEET_ROWS = 4;
const FRAME_SETS = { lg: { width: 750, height: 660 }, sm: { width: 440, height: 386 } };

const DEFAULT_WORDS: HeroWord[] = [
  { text: "Generations", from: 0, rest: 0 },
  { text: "Creators", from: 42, rest: 78 },
];

/** Letters wait this far (in % of their height) above/below the mask when hidden. */
const HIDE = 175;

type Props = {
  /** Small line above the big word. */
  kicker?: string;
  /** Big words, in scroll order. The first must have from = 0. */
  words?: HeroWord[];
  /** Last frame of the sequence (78 = the second kid facing the camera). */
  endFrame?: number;
  /**
   * Folder that holds sheets/ and the glow SVGs. Default: the project's own
   * public/tech-fluent-hero/. Or the GitHub copy through jsDelivr:
   * "https://cdn.jsdelivr.net/gh/Tobio-ux/tech-fluent-hero@v1.0.0/public/tech-fluent-hero"
   */
  assetsBase?: string;
  /** Screen-reader description of the animation. */
  imageLabel?: string;
  className?: string;
};

export default function TechFluentHero({
  kicker = "Tech Fluent",
  words = DEFAULT_WORDS,
  endFrame = FRAME_COUNT - 1,
  assetsBase = "/tech-fluent-hero",
  imageLabel = "Two kids take turns on a spinning orange chair",
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const srRef = useRef<HTMLSpanElement>(null);
  const titleId = useId();
  const wordsKey = words.map((w) => `${w.text}:${w.from}:${w.rest}`).join("|");

  useGSAP(
    () => {
      const section = sectionRef.current;
      const canvas = canvasRef.current;
      if (!section || !canvas || words.length === 0) return;

      const LAST = Math.min(FRAME_COUNT - 1, Math.max(0, endFrame));
      const manifest: SheetManifest = {
        base: `${assetsBase}/sheets`,
        count: FRAME_COUNT,
        cols: SHEET_COLS,
        rows: SHEET_ROWS,
        sets: FRAME_SETS,
      };
      const seq = createFrameSequence(canvas, manifest, { lastFrame: LAST });

      // ------------------------------------------------------------ big words
      const wordEls = gsap.utils.toArray<HTMLElement>(".tfh-word", section);
      const ws = wordEls.map((el, i) => ({
        chars: gsap.utils.toArray<HTMLElement>(".tfh-ch", el),
        text: words[i].text,
        from: words[i].from,
        rest: Math.min(words[i].rest, LAST),
      }));
      ws.forEach((w, i) => gsap.set(w.chars, { yPercent: i === 0 ? 0 : HIDE }));
      if (srRef.current) srRef.current.textContent = ws[0].text;

      let active = 0;
      let reduceMotion = false;

      const wordAt = (f: number) => {
        let idx = 0;
        ws.forEach((w, i) => {
          if (f >= w.from) idx = i;
        });
        return idx;
      };

      const showWord = (idx: number) => {
        if (idx === active) return;
        const dir = idx > active ? 1 : -1;
        const prev = ws[active];
        const next = ws[idx];
        active = idx;
        if (srRef.current) srRef.current.textContent = next.text;

        const d = reduceMotion ? 0 : 1;
        const from = dir > 0 ? "start" : "end";
        gsap.to(prev.chars, {
          yPercent: -HIDE * dir,
          duration: 0.45 * d,
          ease: "power3.in",
          stagger: { each: 0.025 * d, from },
          overwrite: true,
        });
        // Hidden letters enter from the side we're scrolling towards. Letters still
        // on screen (the swap was reversed half-way) carry on from where they are,
        // so a quick back-and-forth never makes a half-visible word vanish.
        let reversing = false;
        next.chars.forEach((c) => {
          if (Math.abs(Number(gsap.getProperty(c, "yPercent"))) >= HIDE - 0.5) gsap.set(c, { yPercent: HIDE * dir });
          else reversing = true;
        });
        gsap.to(next.chars, {
          yPercent: 0,
          duration: 0.75 * d,
          ease: "power3.out",
          stagger: { each: 0.03 * d, from },
          delay: reversing ? 0 : 0.12 * d,
          overwrite: true,
        });
      };

      // ------------------------------------------------------- scroll timeline
      const state = { frame: 0 };
      const onFrame = () => {
        seq.show(state.frame);
        showWord(wordAt(Math.round(state.frame)));
      };

      const mm = gsap.matchMedia();
      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          reduceMotion = Boolean(context.conditions?.reduce);
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              // One screen of scrolling per kid. Raise the multiplier to slow the spin down.
              end: () => `+=${Math.round(window.innerHeight * ws.length)}`,
              pin: true,
              scrub: reduceMotion ? true : 0.6,
              // With reduced motion: no snapping, the scroll position is the frame.
              snap: reduceMotion
                ? undefined
                : {
                    snapTo: ws.map((w) => (LAST ? w.rest / LAST : 0)),
                    duration: { min: 0.3, max: 0.9 },
                    delay: 0.12,
                    ease: "power2.inOut",
                  },
              invalidateOnRefresh: true,
            },
          });
          tl.to(state, { frame: LAST, duration: 1, onUpdate: onFrame }, 0);
          onFrame();
        },
      );

      // Layout depends on the font, so measure again once it has loaded.
      let alive = true;
      document.fonts?.ready.then(() => {
        if (alive) ScrollTrigger.refresh();
      });

      return () => {
        alive = false;
        mm.revert();
        seq.destroy();
      };
    },
    { scope: wrapRef, dependencies: [wordsKey, endFrame, assetsBase], revertOnUpdate: true },
  );

  return (
    // The wrapper is what React mounts/unmounts; GSAP pins the <section> inside it.
    <div ref={wrapRef} className="tfh-wrap">
      <section ref={sectionRef} className={`tfh${className ? ` ${className}` : ""}`} aria-labelledby={titleId}>
        <div className="tfh-card">
          <div className="tfh-glow" aria-hidden="true">
            <div className="tfh-blob tfh-blob--blue">
              <img src={`${assetsBase}/glow-blue.svg`} alt="" />
            </div>
            <div className="tfh-blob tfh-blob--yellow">
              <img src={`${assetsBase}/glow-yellow.svg`} alt="" />
            </div>
          </div>

          <div className="tfh-frame">
            <h1 className="tfh-kicker" id={titleId}>
              {kicker} <span ref={srRef} className="tfh-sr-only" />
            </h1>

            <div className="tfh-words" aria-hidden="true">
              {words.map((w) => (
                <span key={w.text} className="tfh-word">
                  {[...w.text].map((c, i) => (
                    <span key={i} className="tfh-ch">
                      {c}
                    </span>
                  ))}
                </span>
              ))}
            </div>

            <div className="tfh-chair">
              <canvas ref={canvasRef} role="img" aria-label={imageLabel} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
