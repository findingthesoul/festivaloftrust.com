"use client";

import { useState } from "react";
import type { Attendee } from "@/lib/festivals";

/**
 * The guest list as a list of guests: name, email, phone, selectable rows,
 * and two ways onto paper — a plain participant list and name tags. Printing
 * hides everything but the chosen sheet via the print variants; with nothing
 * selected, everyone prints.
 */
export function RegistrationList({
  attendees,
  festivalName,
  platformCount,
}: {
  attendees: Attendee[];
  festivalName: string;
  platformCount: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printMode, setPrintMode] = useState<"list" | "tags">("list");

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allSelected = selected.size === attendees.length && attendees.length > 0;
  const toPrint =
    selected.size > 0 ? attendees.filter((a) => selected.has(a.id)) : attendees;

  const print = (mode: "list" | "tags") => {
    setPrintMode(mode);
    // Let the print sheet re-render before the dialog opens.
    setTimeout(() => window.print(), 50);
  };

  return (
    <div>
      <div className="print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-ink/60 text-sm">
            {attendees.length} {attendees.length === 1 ? "person" : "people"}
            {platformCount > attendees.length &&
              ` — plus ${platformCount - attendees.length} registered before the book existed, known only to The Thread`}
          </p>
          {attendees.length > 0 && (
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

        {attendees.length > 0 && (
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
                        allSelected
                          ? new Set()
                          : new Set(attendees.map((a) => a.id)),
                      )
                    }
                  />
                </th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Email</th>
                <th className="py-2 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-ink/10 divide-y">
              {attendees.map((a) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
