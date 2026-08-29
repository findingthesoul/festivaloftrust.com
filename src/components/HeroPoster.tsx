"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import closeUp from "@/assets/close-up.jpg";
import wordmark from "@/assets/festival-of-trust.png";

/**
 * The poster, animated. The photo fills the whole screen, nav included; the
 * nine forms and the wordmark lie over it in white — star in brand yellow —
 * arranged as on the identity poster. Scrolling plays the composition: every
 * form flies to its seat in the small lockup — equal size, in the grid's own
 * order, beside the name — and the lockup docks white on the nav bar by the
 * time the bar has covered 80% of the photo, staying there for the rest of
 * the page.
 */

// The identity composition, one entry per form in grid order (the order they
// take in the docked 3×3). x/y/w are fractions of the composition box, taken
// from the identity artwork: forms live on an 80-grid, only double or halve
// in size, and each leans on at least one other form — keep that grammar
// when tuning numbers here.
const FORMS: {
  file: string;
  x: number;
  y: number;
  w: number;
  accent?: boolean;
}[] = [
  { file: "forms-01", x: 0.07, y: 0.228, w: 0.18 },
  { file: "forms-02", x: 0.25, y: 0.084, w: 0.25 },
  { file: "forms-03", x: 0.5, y: 0.193, w: 0.126 },
  { file: "forms-05", x: 0.244, y: 0.333, w: 0.089 },
  { file: "forms-06", x: 0.333, y: 0.299, w: 0.333, accent: true },
  { file: "forms-04", x: 0.667, y: 0.368, w: 0.083 },
  { file: "forms-09", x: 0.202, y: 0.404, w: 0.132 },
  { file: "forms-07", x: 0.626, y: 0.299, w: 0.084 },
  { file: "forms-08", x: 0.709, y: 0.439, w: 0.043 },
];

// The wordmark's place inside the same composition box.
const MARK = { x: 0.093, y: 0.602, w: 0.682 };

// The accent star is brand yellow on the poster and white in the docked
// lockup, so its colour rides the same progress as its position.
const YELLOW = [251, 172, 24];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * The read-more click drives its own scroll: the browser's smooth scroll is
 * too quick for the lockup's flight to read as a movement, and its speed
 * cannot be set. A wheel or touch from the reader cancels it — their hand on
 * the page wins.
 */
function readOn(e: React.MouseEvent<HTMLAnchorElement>) {
  const story = document.getElementById("story");
  if (!story) return;
  e.preventDefault();
  history.pushState(null, "", "#story");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    story.scrollIntoView();
    return;
  }
  const from = window.scrollY;
  // 80 matches the story's scroll-mt-20, so both routes land the same.
  const to = story.getBoundingClientRect().top + from - 80;
  const started = performance.now();
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };
  window.addEventListener("wheel", cancel, { once: true, passive: true });
  window.addEventListener("touchstart", cancel, { once: true, passive: true });
  const step = (now: number) => {
    if (cancelled) return;
    const t = Math.min(1, (now - started) / 1600);
    // Ease-out: the page leaves at reading speed and settles softly, which
    // gives the lockup's landing its weight.
    window.scrollTo(0, lerp(from, to, 1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function HeroPoster() {
  const heroRef = useRef<HTMLElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const markRef = useRef<HTMLHeadingElement | null>(null);
  const formRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const hero = heroRef.current;
    const box = boxRef.current;
    const mark = markRef.current;
    if (!hero || !box || !mark) return;
    const forms = formRefs.current;

    // The server renders everything as percentages inside the composition box
    // — the resting poster. From here on each element hangs fixed in viewport
    // space with its width frozen in pixels, so one set of numbers carries it
    // from riding the photo up to sitting still under the nav, with no
    // hand-over jump between positioning schemes. The box itself stays in the
    // photo's flow as the anchor the start positions are measured from.
    const takeOver = (el: HTMLElement) => {
      el.style.width = `${el.getBoundingClientRect().width}px`;
      el.style.position = "fixed";
      el.style.left = "0";
      el.style.top = "0";
      el.style.bottom = "auto";
      el.style.transformOrigin = "top left";
      el.style.willChange = "transform";
    };
    takeOver(mark);
    for (const el of forms) if (el) takeOver(el);

    const place = (el: HTMLElement, x: number, y: number, k: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${k})`;
    };

    let raf = 0;
    const frame = () => {
      raf = 0;
      const heroRect = hero.getBoundingClientRect();
      const brect = box.getBoundingClientRect();
      const vw = window.innerWidth;
      let navH = 64;
      for (const bar of document.querySelectorAll<HTMLElement>(
        "[data-nav-bar]",
      )) {
        navH = Math.max(navH, bar.offsetHeight);
      }
      const small = vw < 640;
      const dockH = small ? 28 : 36;
      const dockLeft = small ? 16 : 24;
      const tile = dockH / 3;

      // Fully docked when the nav bar has covered 80% of the photo.
      const p = clamp01(
        -heroRect.top / Math.max(1, 0.8 * heroRect.height - navH),
      );
      // The wordmark leads and the forms settle one by one, so the grid
      // assembles in its own order rather than arriving as a block.
      const settle = (delay: number) => ease(clamp01((p - delay) / 0.72));

      const mw = parseFloat(mark.style.width) || 1;
      const mh = mark.offsetHeight || 1;
      const q = settle(0);
      place(
        mark,
        lerp(brect.left + MARK.x * brect.width, dockLeft + dockH + 10, q),
        lerp(brect.top + MARK.y * brect.height, (navH - dockH) / 2, q),
        lerp((MARK.w * brect.width) / mw, dockH / mh, q),
      );

      FORMS.forEach((spec, i) => {
        const el = forms[i];
        if (!el) return;
        const w0 = parseFloat(el.style.width) || 1;
        const qi = settle(0.03 + i * 0.028);
        place(
          el,
          lerp(brect.left + spec.x * brect.width, dockLeft + (i % 3) * tile, qi),
          lerp(
            brect.top + spec.y * brect.height,
            (navH - dockH) / 2 + Math.floor(i / 3) * tile,
            qi,
          ),
          lerp((spec.w * brect.width) / w0, tile / w0, qi),
        );
        if (spec.accent) {
          el.style.backgroundColor = `rgb(${YELLOW.map((c) =>
            Math.round(lerp(c, 255, qi)),
          ).join(",")})`;
        }
      });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={heroRef} className="relative h-dvh w-full">
      <Image
        src={closeUp}
        alt="A child in bright pink sunglasses, standing close among others at a festival."
        fill
        preload
        sizes="100vw"
        // Held above centre: the faces sit in the top third of the frame, and
        // a plain centre crop takes the tops of their heads off.
        className="object-[center_30%] object-cover"
      />

      {/* The photo's top edge is a bright sky band on some crops, and the
          menu floats there without a background until scrolling starts — a
          soft dark fade keeps the cream menu readable on any crop. */}
      <div
        aria-hidden="true"
        className="from-ink/50 pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b to-transparent"
      />

      {/* The composition box: everything inside is placed in fractions of it,
          so the whole poster scales as one piece and the animation measures
          its start positions from this box's rect. */}
      <div
        ref={boxRef}
        className="pointer-events-none absolute bottom-[8%] left-[7%] z-50 w-[clamp(280px,34vw,460px)]"
        style={{ aspectRatio: "1290 / 1536" }}
      >
        <h1
          ref={markRef}
          className="absolute"
          style={{
            left: `${MARK.x * 100}%`,
            top: `${MARK.y * 100}%`,
            width: `${MARK.w * 100}%`,
            filter: "brightness(0) invert(1)",
          }}
        >
          <Image
            src={wordmark}
            alt="Festival of Trust"
            sizes="(max-width: 640px) 60vw, 320px"
            loading="eager"
          />
        </h1>

        {FORMS.map((spec, i) => (
          <div
            key={spec.file}
            ref={(el) => {
              formRefs.current[i] = el;
            }}
            aria-hidden="true"
            className="absolute aspect-square"
            // Each form is cut with a mask instead of drawn as an image, so
            // it can be painted any brand colour — the poster wants them
            // white with one yellow star, no filter tricks.
            style={{
              left: `${spec.x * 100}%`,
              top: `${spec.y * 100}%`,
              width: `${spec.w * 100}%`,
              backgroundColor: spec.accent ? "rgb(251,172,24)" : "#fff",
              maskImage: `url(/brand/shapes/${spec.file}.svg)`,
              maskSize: "100% 100%",
              WebkitMaskImage: `url(/brand/shapes/${spec.file}.svg)`,
              WebkitMaskSize: "100% 100%",
            }}
          />
        ))}
      </div>

      <a
        href="#story"
        aria-label="Scroll down to read more"
        onClick={readOn}
        className="text-cream absolute bottom-5 left-1/2 z-10 inline-flex -translate-x-1/2 flex-col items-center gap-1"
      >
        <span className="text-xs tracking-[0.15em] lowercase">read more</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6 animate-bounce motion-reduce:animate-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
