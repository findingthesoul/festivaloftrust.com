import Image from "next/image";
import Link from "next/link";
import { StepMark } from "@/components/StepMark";
import type { Festival } from "@/lib/festivals";

const STATUS: Record<Festival["status"], { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-ink/10 text-ink/70" },
  submitted: { label: "Awaiting approval", className: "bg-yellow/25 text-ink" },
  live: { label: "Live", className: "bg-green text-cream" },
};

/**
 * A festival at a glance.
 *
 * Where there is no cover yet the nine marks stand in — the festival still has
 * a face, and it is the one the whole system is built from, rather than a grey
 * rectangle apologising for a missing upload.
 */
export function FestivalCard({ festival }: { festival: Festival }) {
  const status = STATUS[festival.status];

  return (
    <Link
      href={`/plan/${festival.marker}`}
      className="border-ink/15 hover:border-ink/40 group flex flex-col border bg-white/40 transition-colors"
    >
      <div className="bg-cream relative aspect-[3/2] overflow-hidden border-b border-ink/10">
        {festival.cover_url ? (
          <Image
            src={festival.cover_url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-2 p-5 opacity-90">
            {Array.from({ length: 9 }, (_, i) => (
              <StepMark key={i} step={i + 1} className="h-full w-full" />
            ))}
          </div>
        )}
        <span
          className={`absolute top-3 right-3 px-2 py-0.5 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold group-hover:underline underline-offset-4">
          {festival.name}
        </h3>
        {festival.place && (
          <p className="text-ink/70 mt-1 text-sm">{festival.place}</p>
        )}
        <p className="text-ink/50 mt-auto pt-4 font-mono text-xs">/{festival.marker}</p>
      </div>
    </Link>
  );
}
