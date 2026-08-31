"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import closeUp from "@/assets/close-up.jpg";
import wordmark from "@/assets/festival-of-trust.png";
import { POSTER_FORMS as FORMS, POSTER_MARK as MARK, POSTER_RATIO } from "./composition";

/**
 * A photo in the rotation: url null means the built-in close-up. The logo is
 * the festival's claimed composition from the generator (cell units), which
 * the nine forms re-seat themselves into while that photo shows.
 */
export type HeroSlide = {
  url: string | null;
  credit: string | null;
  logo: { id: number; x: number; y: number; size: number }[] | null;
  /** Where the faces are (image fractions) — the forms keep away from it. */
  focus?: { x: number; y: number } | null;
};

/**
 * The poster, animated. The photo fills the whole screen, nav included; the
 * nine forms and the wordmark lie over it in white — star in brand yellow —
 * arranged as on the identity poster. Scrolling plays the composition: every
 * form flies to its seat in the small lockup — equal size, in the grid's own
 * order, beside the name — and the lockup docks white on the nav bar by the
 * time the bar has covered 80% of the photo, staying there for the rest of
 * the page.
 */

// The accent star is brand yellow on the poster and white in the docked
// lockup, so its colour rides the same progress as its position.
const YELLOW = [251, 172, 24];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Seat = { x: number; y: number; w: number };
const POSTER_SEATS: Seat[] = FORMS.map((f) => ({ x: f.x, y: f.y, w: f.w }));
// Height over width of the composition box, for keeping cells square when
// converting the logo's cell units into box fractions.
const BOX_A = 1536 / 1290;

/**
 * Where each form sits for a slide: the poster arrangement, or the
 * festival's own logo composition fitted into the upper part of the box.
 * Forms and logo shapes pair one to one — generator shape id N is the file
 * forms-0(N+1).
 */
function seatsFor(
  logo: HeroSlide["logo"],
  focus: { x: number; y: number } | null,
  box: HTMLElement | null,
): Seat[] {
  if (!logo || logo.length === 0) return POSTER_SEATS.map((s) => ({ ...s }));
  const minX = Math.min(...logo.map((i) => i.x));
  const minY = Math.min(...logo.map((i) => i.y));
  const gw = Math.max(...logo.map((i) => i.x + i.size)) - minX;
  const gh = Math.max(...logo.map((i) => i.y + i.size)) - minY;
  // On short windows the composition box's top rises above the viewport, so
  // a seat near the box top would sail through the nav bar. The ceiling is
  // measured in screen space — just under the menu — and translated into
  // box fractions; the cluster shrinks if that is what fitting takes.
  let topY = 0.02;
  if (box && typeof window !== "undefined") {
    const b = box.getBoundingClientRect();
    if (b.height > 0) {
      let navH = 64;
      for (const bar of document.querySelectorAll<HTMLElement>("[data-nav-bar]")) {
        navH = Math.max(navH, bar.offsetHeight);
      }
      topY = Math.max(topY, (navH + 16 - b.top) / b.height);
    }
  }
  const availY = Math.max(0.12, 0.58 - topY);
  const u = Math.min(0.86 / gw, (availY * BOX_A) / gh);
  let ox = (1 - gw * u) / 2;
  // Keep the composition off the faces: when the photo says where they are,
  // aim the cluster's centre at the emptier half of the screen, translated
  // into box fractions (the box is the coordinate space everything flies in).
  if (focus && box && typeof window !== "undefined") {
    const b = box.getBoundingClientRect();
    if (b.width > 0) {
      const targetScreen = focus.x >= 0.5 ? 0.26 : 0.74;
      ox = (targetScreen * window.innerWidth - b.left) / b.width - (gw * u) / 2;
    }
  }
  const oy = topY + Math.max(0, (availY - (gh * u) / BOX_A) / 2);
  const out = POSTER_SEATS.map((s) => ({ ...s }));
  for (const it of logo) {
    const idx = FORMS.findIndex((f) => f.file === `forms-0${it.id + 1}`);
    if (idx < 0) continue;
    out[idx] = {
      x: ox + (it.x - minX) * u,
      y: oy + ((it.y - minY) * u) / BOX_A,
      w: it.size * u,
    };
  }
  return out;
}

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
    const t = Math.min(1, (now - started) / 2400);
    // behavior: "instant" is load-bearing — the page's own scroll-smooth
    // would otherwise re-smooth every frame and race ahead at the browser's
    // quick pace, exactly the jump this handler exists to replace.
    window.scrollTo({ top: lerp(from, to, ease(t)), behavior: "instant" });
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function HeroPoster({ slides }: { slides?: HeroSlide[] }) {
  const heroRef = useRef<HTMLElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const markRef = useRef<HTMLHeadingElement | null>(null);
  const formRefs = useRef<(HTMLDivElement | null)[]>([]);
  const all: HeroSlide[] =
    slides && slides.length > 0
      ? slides
      : [{ url: null, credit: null, logo: null }];
  const [idx, setIdx] = useState(0);
  // Where each form currently starts from (box fractions) — the poster
  // arrangement until a slide with a logo composition re-seats them.
  const seatsRef = useRef<Seat[]>(POSTER_SEATS.map((s) => ({ ...s })));
  const frameRef = useRef<() => void>(() => {});

  // The rotation: a new photo every 15 seconds, unless motion is reduced or
  // there is nothing to rotate to.
  useEffect(() => {
    if (all.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % all.length), 15000);
    return () => clearInterval(t);
  }, [all.length]);

  // The forms re-seat themselves for the slide on show: a short flight from
  // wherever they stand to the slide's arrangement, drawn through the same
  // frame() the scroll animation uses, so the two never disagree.
  useEffect(() => {
    const target = seatsFor(
      all[idx]?.logo ?? null,
      all[idx]?.focus ?? null,
      boxRef.current,
    );
    const from = seatsRef.current.map((s) => ({ ...s }));
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 1800);
      const e = ease(t);
      seatsRef.current = from.map((f, i) => ({
        x: lerp(f.x, target[i].x, e),
        y: lerp(f.y, target[i].y, e),
        w: lerp(f.w, target[i].w, e),
      }));
      frameRef.current();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // all changes identity every render; the slide index is the real signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

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
    const takeOver = (el: HTMLElement, minWidth = 0) => {
      el.style.width = `${Math.max(el.getBoundingClientRect().width, minWidth)}px`;
      el.style.position = "fixed";
      el.style.left = "0";
      el.style.top = "0";
      el.style.bottom = "auto";
      el.style.transformOrigin = "top left";
      el.style.willChange = "transform";
    };
    takeOver(mark);
    // A mask rasterises at layout size; transform scale only magnifies the
    // pixels it got. The poster's smallest forms grow far past their layout
    // size when a logo composition seats them large, and arrive blurry — so
    // every form's layout width is generous enough that the flight only
    // ever scales DOWN.
    const boxW = box.getBoundingClientRect().width;
    for (const el of forms) if (el) takeOver(el, 0.6 * boxW);

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
        const seat = seatsRef.current[i] ?? spec;
        const w0 = parseFloat(el.style.width) || 1;
        const qi = settle(0.03 + i * 0.028);
        place(
          el,
          lerp(brect.left + seat.x * brect.width, dockLeft + (i % 3) * tile, qi),
          lerp(
            brect.top + seat.y * brect.height,
            (navH - dockH) / 2 + Math.floor(i / 3) * tile,
            qi,
          ),
          lerp((seat.w * brect.width) / w0, tile / w0, qi),
        );
        if (spec.accent && el.firstElementChild) {
          (el.firstElementChild as HTMLElement).style.backgroundColor = `rgb(${YELLOW.map((c) =>
            Math.round(lerp(c, 255, qi)),
          ).join(",")})`;
        }
      });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    frameRef.current = frame;
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
      {/* The rotation: every photo stays mounted, one is on top. A slow
          three-second fade carries each hand-over; the built-in close-up is
          the slide with no url. */}
      {all.map((s, i) => (
        <Image
          key={i}
          src={s.url ?? closeUp}
          alt={
            s.url
              ? ""
              : "A child in bright pink sunglasses, standing close among others at a festival."
          }
          fill
          preload={i === 0}
          sizes="100vw"
          // Held above centre: faces usually sit in the top third of a
          // close-up, and a plain centre crop takes the tops of heads off.
          className={`object-[center_30%] object-cover transition-opacity duration-[3000ms] ease-linear ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {all[idx]?.credit && (
        <p
          key={idx}
          className="text-cream/75 absolute right-4 bottom-4 z-10 text-[11px] tracking-wide"
        >
          Credits: {all[idx].credit}
        </p>
      )}

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
        className="pointer-events-none absolute bottom-[8%] left-[7%] z-50 w-[clamp(300px,46vw,600px)]"
        style={{ aspectRatio: POSTER_RATIO }}
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
            style={{
              left: `${spec.x * 100}%`,
              top: `${spec.y * 100}%`,
              width: `${spec.w * 100}%`,
            }}
          >
            {/* Cut with a mask instead of drawn as an image, so each form
                can be painted any brand colour — white with one yellow star.
                Rotation, where the cluster asks for it, lives on this inner
                layer so the flight's transform stays untouched. */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: spec.accent ? "rgb(251,172,24)" : "#fff",
                transform: spec.rot ? `rotate(${spec.rot}deg)` : undefined,
                maskImage: `url(/brand/shapes/${spec.file}.svg)`,
                maskSize: "100% 100%",
                WebkitMaskImage: `url(/brand/shapes/${spec.file}.svg)`,
                WebkitMaskSize: "100% 100%",
              }}
            />
          </div>
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
