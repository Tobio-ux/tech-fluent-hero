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
// Named import: on a server (SSR), "gsap" can load as CommonJS, where the default
// import is the whole module object and gsap.registerPlugin doesn't exist.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { createFrameSequence, type SheetManifest } from "./frame-sequence";
import "./tech-fluent-hero.css";

// Browser only: the server just renders the markup, and this runs when the file
// loads, so anything that fails here would take down every page.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  // Don't recalculate when a phone's address bar shows/hides.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

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
/** Arabic glyphs are taller (alef, hamza, descenders) and their mask is taller, so they wait further away. */
const HIDE_JOINED = 220;

/** Arabic letters join up, so splitting a word into letters would break it apart. */
const JOINED_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const isJoined = (text: string) => JOINED_SCRIPT.test(text);
/** The pieces that slide in and out: single letters, or whole words (with their space) for Arabic. */
const unitsOf = (text: string) => (isJoined(text) ? text.match(/\S+\s*/g) ?? [text] : [...text]);

/**
 * position: sticky only sticks to the page scroll if no ancestor clips or scrolls
 * (overflow other than visible/clip). <body>'s overflow doesn't count unless <html>
 * sets its own, because the browser then applies it to the viewport instead.
 */
function canStick(el: HTMLElement) {
  const root = document.documentElement;
  const rootStyle = getComputedStyle(root);
  const rootVisible = rootStyle.overflowX === "visible" && rootStyle.overflowY === "visible";
  let p = el.parentElement;
  while (p && p !== root) {
    const s = getComputedStyle(p);
    const clips = [s.overflowX, s.overflowY].some((v) => v !== "visible" && v !== "clip");
    if (clips && !(p === document.body && rootVisible)) return false;
    p = p.parentElement;
  }
  return true;
}

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
        hide: isJoined(words[i].text) ? HIDE_JOINED : HIDE,
      }));
      ws.forEach((w, i) => gsap.set(w.chars, { yPercent: i === 0 ? 0 : w.hide }));
      if (srRef.current) srRef.current.textContent = ws[0].text;

      // The layout sizes the big word from its width in em (--tfh-word-em), so any
      // word or language fits the card. Measure the widest one (offsets ignore the
      // slide transforms).
      const measureWords = () => {
        let widest = 0;
        wordEls.forEach((el) => {
          const units = el.querySelectorAll<HTMLElement>(".tfh-ch");
          const size = parseFloat(getComputedStyle(el).fontSize);
          if (!units.length || !size) return;
          let min = Infinity;
          let max = -Infinity;
          units.forEach((u) => {
            min = Math.min(min, u.offsetLeft);
            max = Math.max(max, u.offsetLeft + u.offsetWidth);
          });
          widest = Math.max(widest, (max - min) / size);
        });
        if (widest > 0) section.style.setProperty("--tfh-word-em", widest.toFixed(3));
      };
      measureWords();

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
          yPercent: -prev.hide * dir,
          duration: 0.35 * d,
          ease: "power3.in",
          stagger: { each: 0.02 * d, from },
          overwrite: true,
        });
        // Hidden letters enter from the side we're scrolling towards. Letters still
        // on screen (the swap was reversed half-way) carry on from where they are,
        // so a quick back-and-forth never makes a half-visible word vanish.
        let reversing = false;
        next.chars.forEach((c) => {
          if (Math.abs(Number(gsap.getProperty(c, "yPercent"))) >= next.hide - 0.5) gsap.set(c, { yPercent: next.hide * dir });
          else reversing = true;
        });
        gsap.to(next.chars, {
          yPercent: 0,
          duration: 0.55 * d,
          ease: "power3.out",
          stagger: { each: 0.025 * d, from },
          delay: reversing ? 0 : 0.08 * d,
          overwrite: true,
        });
      };

      // ------------------------------------------------------------- pinning
      // Preferred: CSS position: sticky. The browser holds the hero in place as it
      // scrolls, so it can't jump. The wrapper is made tall enough for the scroll.
      // Sticky fails inside an ancestor that clips or scrolls (overflow hidden/auto),
      // so then fall back to GSAP's pin.
      const wrap = wrapRef.current as HTMLDivElement;
      const sticky = canStick(wrap);
      wrap.style.setProperty("--tfh-steps", String(ws.length));
      wrap.classList.toggle("tfh-wrap--sticky", sticky);
      if (!sticky) {
        console.warn(
          "[TechFluentHero] An ancestor clips or scrolls (overflow other than visible/clip), so position: sticky " +
            "can't work. Falling back to a JavaScript pin, which can jitter on fast scrolls. Remove that overflow to fix it.",
        );
      }

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
          // Where the page settles when scrolling stops (progress of each kid facing the camera).
          // A nudge (under 15% of the way, about 2 wheel notches) goes back to the kid you
          // were on; anything more carries on to the next one in the direction you scrolled.
          const rests = ws.map((w) => (LAST ? w.rest / LAST : 0));
          const NUDGE = 0.15;
          const settle = (value: number, self?: ScrollTrigger) => {
            const below = rests.filter((r) => r <= value);
            const above = rests.filter((r) => r >= value);
            const lower = below.length ? Math.max(...below) : rests[0];
            const upper = above.length ? Math.min(...above) : rests[rests.length - 1];
            if (lower === upper) return lower;
            const goingDown = (self?.direction ?? 1) > 0;
            if (goingDown) return value - lower > NUDGE ? upper : lower;
            return upper - value > NUDGE ? lower : upper;
          };

          // One screen of scrolling per kid (--tfh-steps × 100vh in the CSS, or the pin length).
          const range = sticky
            ? { trigger: wrap, start: "top top", end: "bottom bottom" }
            : {
                trigger: section,
                start: "top top",
                end: () => `+=${Math.round(window.innerHeight * ws.length)}`,
                pin: true,
                anticipatePin: 1,
              };
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              ...range,
              scrub: reduceMotion ? true : 0.6,
              // When scrolling stops, settle on a kid facing the camera (see settle).
              // It waits 0.25s so it doesn't fight a mouse wheel between notches.
              // Reduced motion: no snapping.
              snap: reduceMotion
                ? undefined
                : {
                    snapTo: settle,
                    delay: 0.25,
                    duration: { min: 0.3, max: 0.8 },
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
        if (!alive) return;
        measureWords();
        ScrollTrigger.refresh();
      });

      return () => {
        alive = false;
        section.style.removeProperty("--tfh-word-em");
        wrap.classList.remove("tfh-wrap--sticky");
        wrap.style.removeProperty("--tfh-steps");
        mm.revert();
        seq.destroy();
      };
    },
    { scope: wrapRef, dependencies: [wordsKey, endFrame, assetsBase], revertOnUpdate: true },
  );

  return (
    // The wrapper holds the scroll length; the <section> inside it stays on screen
    // (sticky, or pinned by GSAP as a fallback).
    <div ref={wrapRef} className="tfh-wrap">
      <section
        ref={sectionRef}
        className={`tfh${words.some((w) => isJoined(w.text)) ? " tfh--joined" : ""}${className ? ` ${className}` : ""}`}
        aria-labelledby={titleId}
      >
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
            <h1 className="tfh-kicker" id={titleId} dir="auto">
              {kicker} <span ref={srRef} className="tfh-sr-only" />
            </h1>

            <div className="tfh-words" aria-hidden="true">
              {words.map((w) => (
                <span key={w.text} className={`tfh-word${isJoined(w.text) ? " tfh-word--joined" : ""}`} dir="auto">
                  {unitsOf(w.text).map((unit, i) => (
                    <span key={i} className="tfh-ch">
                      {unit}
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
