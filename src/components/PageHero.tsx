import Image, { type StaticImageData } from "next/image";

/**
 * A page's opening sheet: full screen, a photograph edge to edge with the
 * cream nav floating over it, the title the largest thing on it. The photo
 * is per page — one import to swap when the real pictures arrive.
 */
export function PageHero({
  photo,
  photoAlt = "",
  title,
  intro,
}: {
  photo: StaticImageData | string;
  photoAlt?: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="relative flex min-h-dvh w-full snap-start items-end">
      <Image
        src={photo}
        alt={photoAlt}
        fill
        preload
        sizes="100vw"
        className="object-cover"
      />
      {/* Soft fades where type sits on the photograph. */}
      <div
        aria-hidden="true"
        className="from-ink/50 pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b to-transparent"
      />
      <div
        aria-hidden="true"
        className="from-ink/60 pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t to-transparent"
      />

      <div className="text-cream relative z-10 mx-auto w-full max-w-5xl px-6 pt-28 pb-16 sm:px-10 sm:pb-20">
        <h1 className="text-[clamp(2.4rem,7vw,4.5rem)] leading-[1.02] font-bold tracking-[-0.02em] text-balance">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.6vw,1.35rem)] leading-relaxed text-pretty">
          {intro}
        </p>
      </div>
    </section>
  );
}
