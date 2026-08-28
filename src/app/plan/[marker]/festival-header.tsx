import Link from "next/link";
import { FestivalTabs, type Tab } from "./tabs";
import type { Access, Festival } from "@/lib/festivals";

/** The name, the way back, and the tabs. Every tab renders this. */
export function FestivalHeader({
  festival,
  access,
  active,
}: {
  festival: Festival;
  access: Access;
  active: Tab;
}) {
  return (
    <>
      <Link
        href="/festivals"
        className="text-ink/60 hover:text-ink text-sm transition-colors"
      >
        ← Your festivals
      </Link>
      <h1 className="mt-4 text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.02em]">
        {festival.name}
      </h1>
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
