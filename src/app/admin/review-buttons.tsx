"use client";

import { useTransition } from "react";
import { decideFestival, decideOrganiser } from "./actions";

export function OrganiserButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => void (await decideOrganiser(id, "approved")))}
        className="bg-green text-cream px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => void (await decideOrganiser(id, "declined")))}
        className="border-ink/25 hover:border-ink/50 border px-3 py-1.5 text-sm disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}

export function FestivalButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => void (await decideFestival(id, "live")))}
        className="bg-green text-cream px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        Put live
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => void (await decideFestival(id, "draft")))}
        className="border-ink/25 hover:border-ink/50 border px-3 py-1.5 text-sm disabled:opacity-50"
      >
        Send back
      </button>
    </div>
  );
}
