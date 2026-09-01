"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkInPlatformGuest, checkInThreadCode, setArrived, setEnrolmentArrived } from "./actions";
import { input } from "@/components/ui";

export type DoorGuest = {
  key: string;
  name: string;
  email: string | null;
  /** The book row, when the site knows this guest; the door can make one. */
  attendeeId: string | null;
  /** The platform's enrolment row, when the platform knows this guest. */
  enrolmentRowId: string | null;
  arrived: boolean;
};

// Every ticket is The Thread's: a 32-hex check-in code in its address.
const THREAD_CODE = /(?:checkin\/)?([0-9a-f]{32})/i;

/**
 * The list at the door, and the camera above it. Scanning prefers the
 * browser's own BarcodeDetector and falls back to jsQR frame-grabs where
 * the browser has none (Safari, mostly) — either way a ticket's QR carries
 * its own address, and the id inside it is the guest.
 */
export function CheckinList({
  marker,
  guests,
}: {
  marker: string;
  guests: DoorGuest[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  // The scan's answer, written across the whole screen for a moment — the
  // person at the door sees it from an arm's length, phone tilted away.
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFlash = (ok: boolean, text: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ ok, text });
    try {
      navigator.vibrate?.(ok ? 80 : [60, 60, 60]);
    } catch {}
    flashTimer.current = setTimeout(() => setFlash(null), 2200);
  };
  const [scanning, setScanning] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const lastCode = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const arrivedCount = guests.filter((g) => g.arrived).length;
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? guests.filter(
        (g) =>
          g.name.toLowerCase().includes(needle) ||
          (g.email ?? "").toLowerCase().includes(needle),
      )
    : guests;

  const toggle = (g: DoorGuest) =>
    start(async () => {
      // The platform's guests check in on the platform's book, so The
      // Thread's door and ours agree; the site's own guests use the site's.
      const r = g.enrolmentRowId
        ? await setEnrolmentArrived(marker, g.enrolmentRowId, !g.arrived)
        : g.attendeeId
          ? await setArrived(marker, g.attendeeId, !g.arrived)
          : await checkInPlatformGuest(marker, { name: g.name, email: g.email });
      if (r.error) {
        setNote(r.error);
        return;
      }
      setNote(
        r.arrived ? `${r.name ?? g.name} is in ✓` : `${r.name ?? g.name} checked out`,
      );
      router.refresh();
    });

  // The camera loop lives and dies with the scanning flag.
  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | null = null;
    let stop = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onCode = (raw: string) => {
      const code = THREAD_CODE.exec(raw)?.[1];
      if (!code) {
        setNote("That QR code is not a ticket for this festival.");
        return;
      }
      const now = Date.now();
      if (lastCode.current.code === code && now - lastCode.current.at < 4000) return;
      lastCode.current = { code, at: now };
      start(async () => {
        const r = await checkInThreadCode(marker, code);
        setNote(r.error ? r.error : `${r.name ?? "Guest"} is in ✓`);
        showFlash(!r.error, r.error ? r.error : (r.name ?? "Guest"));
        if (!r.error) router.refresh();
      });
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (stop || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();

        // BarcodeDetector is a trap on desktop browsers: the constructor
        // exists while the implementation does not, and detect() answers []
        // forever. Only trust it when it names qr_code as supported — and
        // keep the JavaScript decoder loaded as the working fallback.
        const Detector = (
          window as Window & {
            BarcodeDetector?: {
              new (o: { formats: string[] }): {
                detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
              };
              getSupportedFormats?: () => Promise<string[]>;
            };
          }
        ).BarcodeDetector;
        let detector: { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } | null =
          null;
        if (Detector) {
          try {
            const formats = (await Detector.getSupportedFormats?.()) ?? [];
            if (formats.includes("qr_code")) {
              detector = new Detector({ formats: ["qr_code"] });
            }
          } catch {}
        }
        const jsqr = detector ? null : (await import("jsqr")).default;
        const canvas = document.createElement("canvas");

        const tick = async () => {
          if (stop || !video.current) return;
          try {
            if (detector) {
              const codes = await detector.detect(video.current);
              for (const c of codes) onCode(c.rawValue);
            } else if (jsqr && video.current.videoWidth) {
              canvas.width = video.current.videoWidth;
              canvas.height = video.current.videoHeight;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(video.current, 0, 0);
                const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const hit = jsqr(img.data, img.width, img.height);
                if (hit?.data) onCode(hit.data);
              }
            }
          } catch {}
          timer = setTimeout(tick, 350);
        };
        void tick();
      } catch {
        setNote("The camera could not be opened — check the browser's permission.");
        setScanning(false);
      }
    })();

    return () => {
      stop = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // marker is stable for the page's life; start/router are stable by React.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  return (
    <div>
      {flash && (
        <div
          aria-live="assertive"
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center px-8 text-center ${
            flash.ok ? "bg-green" : "bg-red"
          } text-cream`}
          onClick={() => setFlash(null)}
        >
          <span className="text-[clamp(4rem,20vw,9rem)] leading-none" aria-hidden="true">
            {flash.ok ? "✓" : "✕"}
          </span>
          <p className="mt-4 text-[clamp(1.5rem,6vw,3rem)] leading-tight font-bold text-balance">
            {flash.text}
          </p>
          <p className="mt-3 text-sm opacity-80">
            {flash.ok ? "Checked in" : "Not admitted"}
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">The door</h2>
          <p className="text-ink/60 mt-0.5 text-sm" aria-live="polite">
            {arrivedCount} of {guests.length} checked in
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScanning((s) => !s)}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-opacity hover:opacity-85 ${
            scanning ? "border-ink/25 border bg-white" : "bg-green text-cream"
          }`}
        >
          {scanning ? "Stop scanning" : "Scan tickets"}
        </button>
      </div>

      {scanning && (
        <p className="text-ink/55 mt-3 text-sm">
          One door at a time: while the camera scans, the hand check-in is
          off — stop scanning to tap a name.
        </p>
      )}
      {scanning && (
        <div className="border-ink/15 mt-4 overflow-hidden rounded-xl border bg-black">
          {/* The mirror is for selfies; a document scan reads straight. */}
          <video ref={video} playsInline muted className="max-h-80 w-full object-cover" />
        </div>
      )}

      {note && (
        <p className="bg-green/10 text-green mt-4 rounded-lg px-4 py-2.5 text-sm font-medium" aria-live="polite">
          {note}
        </p>
      )}

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Find a name…"
        aria-label="Search guests"
        className={`${input} mt-5`}
      />

      <ul className="divide-ink/10 mt-3 divide-y">
        {shown.map((g) => (
          <li key={g.key} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className={`truncate font-medium ${g.arrived ? "text-ink/45" : ""}`}>
                {g.name}
              </p>
              {g.email && (
                <p className="text-ink/45 truncate text-xs">{g.email}</p>
              )}
            </div>
            <button
              type="button"
              disabled={pending || scanning}
              onClick={() => toggle(g)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-opacity hover:opacity-85 disabled:opacity-50 ${
                g.arrived
                  ? "border-ink/20 text-ink/60 border bg-white"
                  : "bg-ink text-cream"
              }`}
            >
              {g.arrived ? "✓ In" : "Check in"}
            </button>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="text-ink/50 py-6 text-sm">
            {guests.length === 0 ? "Nobody registered yet." : "No name matches."}
          </li>
        )}
      </ul>
    </div>
  );
}
