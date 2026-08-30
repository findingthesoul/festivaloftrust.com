"use client";

import { useState, useTransition } from "react";
import { admit, turnAway } from "./actions";

/**
 * The guest list as a list of guests: name, email, phone, selectable rows,
 * and two ways onto paper — a plain participant list and name tags. Rows
 * still waiting for the organiser's decision carry Admit and Decline, which
 * speak to The Thread's own machinery through the app key. Printing hides
 * everything but the chosen sheet; with nothing selected, everyone prints.
 */

export type GuestRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  awaiting: boolean;
  /** The platform's enrolment row id, when the platform knows this guest. */
  enrolmentRowId: string | null;
};

export function RegistrationList({
  marker,
  rows,
  festivalName,
  canReview,
}: {
  marker: string;
  rows: GuestRow[];
  festivalName: string;
  canReview: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printMode, setPrintMode] = useState<"list" | "tags">("list");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allSelected = selected.size === rows.length && rows.length > 0;
  const toPrint = selected.size > 0 ? rows.filter((a) => selected.has(a.id)) : rows;

  const print = (mode: "list" | "tags") => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 50);
  };

  const decide = (row: GuestRow, yes: boolean) =>
    start(async () => {
      if (!row.enrolmentRowId) return;
      const r = yes
        ? await admit(marker, row.enrolmentRowId)
        : await turnAway(marker, row.enrolmentRowId);
      setError(r.error ?? null);
    });

  const waiting = rows.filter((r) => r.awaiting).length;

  return (
    <div>
      <div className="print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-ink/60 text-sm">
            {rows.length} {rows.length === 1 ? "person" : "people"}
            {waiting > 0 && ` — ${waiting} waiting for your decision`}
          </p>
          {rows.length > 0 && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => print("list")}
                className="border-ink/20 hover:border-ink/50 rounded-lg border bg-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Print list
              </button>
              <button
                type="button"
                onClick={() => print("tags")}
                className="border-ink/20 hover:border-ink/50 rounded-lg border bg-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Print name tags
              </button>
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <table className="border-ink/10 mt-4 w-full border-y text-sm">
            <thead>
              <tr className="text-ink/60 text-left">
                <th className="w-10 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select everyone"
                    checked={allSelected}
                    onChange={() =>
                      setSelected(
                        allSelected ? new Set() : new Set(rows.map((a) => a.id)),
                      )
                    }
                  />
                </th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Email</th>
                <th className="py-2 font-medium">Phone</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-ink/10 divide-y">
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Select ${a.name}`}
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                    />
                  </td>
                  <td className="py-2.5 font-medium">{a.name}</td>
                  <td className="py-2.5">{a.email}</td>
                  <td className="text-ink/70 py-2.5">{a.phone ?? "—"}</td>
                  <td className="py-2.5 text-right">
                    {a.awaiting &&
                      (canReview && a.enrolmentRowId ? (
                        <span className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => decide(a, true)}
                            className="bg-green text-cream rounded px-3 py-1 text-xs font-bold transition-opacity hover:opacity-85 disabled:opacity-50"
                          >
                            Admit
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => decide(a, false)}
                            className="border-ink/25 text-ink/70 rounded border px-3 py-1 text-xs font-medium transition-colors hover:border-ink/60 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </span>
                      ) : (
                        <span className="text-ink/50 text-xs">waiting</span>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        {selected.size > 0 && (
          <p className="text-ink/50 mt-2 text-xs">
            {selected.size} selected — printing prints the selection.
          </p>
        )}
      </div>

      {/* The paper versions: invisible on screen, the only thing on print. */}
      <div className="hidden print:block">
        {printMode === "list" ? (
          <>
            <h1 className="text-2xl font-bold">{festivalName}</h1>
            <p className="mt-1 text-sm">
              Participants — {toPrint.length}{" "}
              {toPrint.length === 1 ? "person" : "people"}
            </p>
            <table className="mt-6 w-full text-sm">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1.5 pr-2 font-bold">Name</th>
                  <th className="py-1.5 pr-2 font-bold">Email</th>
                  <th className="py-1.5 pr-2 font-bold">Phone</th>
                  <th className="w-24 py-1.5 font-bold">Present</th>
                </tr>
              </thead>
              <tbody>
                {toPrint.map((a) => (
                  <tr key={a.id} className="border-b border-black/20">
                    <td className="py-2 pr-2">{a.name}</td>
                    <td className="py-2 pr-2">{a.email}</td>
                    <td className="py-2 pr-2">{a.phone ?? ""}</td>
                    <td className="py-2">☐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {toPrint.map((a) => (
              <div
                key={a.id}
                className="flex h-40 flex-col justify-between border border-black/30 p-4"
                style={{ breakInside: "avoid" }}
              >
                <p className="text-2xl leading-tight font-bold">{a.name}</p>
                <p className="text-xs tracking-[0.15em] uppercase">
                  {festivalName}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
