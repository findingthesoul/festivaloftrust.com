import Link from "next/link";
import { FestivalTabs, type Tab } from "./tabs";
import { organiserFor, type Access, type Festival } from "@/lib/festivals";

/** The name, the way back, and the tabs. Every tab renders this. */
export async function FestivalHeader({
  festival,
  access,
  active,
}: {
  festival: Festival;
  access: Access;
  active: Tab;
}) {
  // Whose festival this is. Absent for a host looking at somebody else's — the
  // organiser row is not theirs to read — so the line simply does not appear
  // rather than showing a blank or an id.
  const owner = await organiserFor(festival.owner_id);
  // The organisation carries the festival, not the person — the name only
  // stands in while no organisation is filled in on the profile.
  const ownerName =
    owner?.organisation?.trim() || owner?.full_name || owner?.email || null;

  return (
    <>
      <Link
        href="/festivals"
        className="text-ink/60 hover:text-ink text-sm transition-colors"
      >
        ← Your festivals
      </Link>
      {ownerName && (
        <p className="text-ink/55 mt-4 text-sm">{ownerName}</p>
      )}
      <div className={`${ownerName ? "mt-1" : "mt-4"} flex items-start justify-between gap-4`}>
        <h1 className="text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.02em]">
          {festival.name}
        </h1>
        {/* The page as the public meets it — or, while it is a draft, the
            preview only its own people can open. Same address either way,
            which is the point of looking. */}
        <a
          href={`/${festival.marker}`}
          target="_blank"
          rel="noreferrer"
          title={
            festival.status === "live"
              ? `Open festivaloftrust.com/${festival.marker}`
              : "Preview the page — not public yet"
          }
          aria-label={
            festival.status === "live" ? "Open the public page" : "Preview the page"
          }
          className="text-ink/45 hover:text-ink mt-2 shrink-0 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-6"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
        </a>
      </div>
      <FestivalTabs
        marker={festival.marker}
        active={active}
        canSeeMoney={access.canSeeMoney}
        isOrganiser={access.role === "organiser"}
        status={festival.status}
      />
    </>
  );
}
