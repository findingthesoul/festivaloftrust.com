"use client";

import { useActionState, useTransition } from "react";
import {
  cancelInvite,
  dropMember,
  inviteCollaborator,
  type InviteState,
} from "./actions";
import type { Invite, Member } from "@/lib/festivals";

const initial: InviteState = { status: "idle" };

const ROLE_NOTE: Record<Member["role"], string> = {
  organiser: "Runs the festival. Sees everything, including the budget.",
  host: "Helps run it. Sees the plan and the people, not the money.",
};

export function Collaborators({
  marker,
  members,
  invites,
  meId,
}: {
  marker: string;
  members: Member[];
  invites: Invite[];
  meId: string;
}) {
  const [state, action, pending] = useActionState(
    inviteCollaborator.bind(null, marker),
    initial,
  );
  const [busy, start] = useTransition();

  return (
    <section>
      <h2 className="text-xl font-bold">People on this festival</h2>
      <p className="text-ink/60 mt-2 text-sm leading-relaxed text-pretty">
        A festival is stewarded by a group, not a person. Invite the others.
      </p>

      <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
        {members.map((m) => (
          <li key={m.user_id} className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {m.email ?? "—"}
                {m.user_id === meId && <span className="text-ink/50"> (you)</span>}
              </p>
              <p className="text-ink/60 text-sm capitalize">{m.role}</p>
            </div>
            {m.user_id !== meId && (
              <button
                type="button"
                disabled={busy}
                onClick={() => start(async () => void (await dropMember(marker, m.user_id)))}
                className="text-ink/50 hover:text-red shrink-0 text-sm disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </li>
        ))}

        {invites.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{i.email}</p>
              <p className="text-ink/60 text-sm capitalize">
                {i.role} · invited, not yet joined
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => start(async () => void (await cancelInvite(marker, i.id)))}
              className="text-ink/50 hover:text-red shrink-0 text-sm disabled:opacity-50"
            >
              Withdraw
            </button>
          </li>
        ))}

        {members.length === 0 && invites.length === 0 && (
          <li className="text-ink/60 py-4 text-sm">Nobody else yet.</li>
        )}
      </ul>

      <form action={action} className="mt-6 max-w-lg">
        <label htmlFor="email" className="font-medium">
          Invite someone
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id="email"
            name="email"
            type="email"
            placeholder="their@email.com"
            required
            className="focus:border-green min-w-0 flex-1 border border-ink/25 bg-white/60 px-3 py-2 text-base outline-none"
          />
          <select
            name="role"
            defaultValue="host"
            aria-label="Role"
            className="border border-ink/25 bg-white/60 px-3 py-2 text-base"
          >
            <option value="host">Host</option>
            <option value="organiser">Organiser</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="bg-green text-cream px-5 py-2 font-medium disabled:opacity-50"
          >
            Invite
          </button>
        </div>
        {state.status === "error" && (
          <p className="text-red mt-2 text-sm">{state.message}</p>
        )}
        <dl className="text-ink/60 mt-4 space-y-1 text-sm">
          {(Object.keys(ROLE_NOTE) as Member["role"][]).map((r) => (
            <div key={r} className="flex gap-2">
              <dt className="font-medium capitalize">{r}:</dt>
              <dd className="text-pretty">{ROLE_NOTE[r]}</dd>
            </div>
          ))}
        </dl>
      </form>
    </section>
  );
}
