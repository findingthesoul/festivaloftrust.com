"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountMenu } from "./AccountMenu";
import { NAV, PLAIN_PATHS } from "./nav-links";

/**
 * The one navigation, signed in or out. On the home page it floats over the
 * full-screen poster, menu to the right so the docking logo owns the left:
 * transparent while the page rests at the top, then a dark blur over the
 * photo the moment scrolling starts. On a festival's page the top stays
 * clean — nothing but the account control when someone is signed in; the
 * footer carries the menu. Everywhere else it is the plain centred bar.
 * Signed in, the JOIN or SIGN IN pill gives way to the account control —
 * same bar, one seat changes.
 */
export function PublicNav({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const home = pathname === "/";
  const event =
    !home &&
    pathname.split("/").filter(Boolean).length === 1 &&
    !PLAIN_PATHS.includes(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!home) return;
    const read = () => setScrolled(window.scrollY > 8);
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [home]);

  const close = () => setOpen(false);

  if (event) {
    if (!email) return null;
    return (
      <nav aria-label="Main" className="absolute inset-x-0 top-0 z-40">
        <div className="flex justify-end px-6 py-4 sm:px-10">
          <AccountMenu email={email} />
        </div>
      </nav>
    );
  }

  const burger = (
    <button
      type="button"
      aria-expanded={open}
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={() => setOpen((o) => !o)}
      className="p-2 sm:hidden"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        {open ? (
          <path d="M5 5l14 14M19 5L5 19" />
        ) : (
          <path d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  );

  const panel = open && (
    <div
      className={`sm:hidden ${
        home
          ? "bg-ink/90 text-cream backdrop-blur-md"
          : "bg-background border-ink/10 border-b"
      }`}
    >
      <ul className="flex flex-col gap-1 px-6 py-4">
        {NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={close}
              className="block py-1.5 transition-opacity hover:opacity-70"
            >
              {item.label}
            </Link>
          </li>
        ))}
        {!email && (
          <li className="mt-2 flex gap-4">
            <Link href="/join" onClick={close} className="font-medium">
              Join
            </Link>
            <Link
              href="/sign-in"
              onClick={close}
              className={`font-medium ${home ? "text-yellow" : "text-green"}`}
            >
              Sign in
            </Link>
          </li>
        )}
      </ul>
    </div>
  );

  if (!home) {
    return (
      <nav aria-label="Main" className="w-full">
        <div
          data-nav-bar
          className="flex h-14 items-center justify-between px-4 sm:hidden"
        >
          <Link href="/" className="text-sm font-bold tracking-[-0.01em]">
            Festival of Trust
          </Link>
          <div className="flex items-center gap-2">
            {email && <AccountMenu email={email} />}
            {burger}
          </div>
        </div>
        {panel}
        {/* The same right-aligned row as the home page's floating bar, just
            ink on cream and in the page's flow — the menu must not move
            between pages. */}
        <div
          data-nav-bar
          className="mx-auto hidden min-h-16 max-w-7xl flex-wrap items-center justify-end gap-y-1 px-6 py-2 text-sm sm:flex sm:px-10"
        >
          <ul className="flex flex-wrap items-center justify-end">
            {NAV.map((item, i) => (
              <li key={item.href} className="flex items-center">
                {i > 0 && (
                  <span aria-hidden="true" className="text-ink/25 px-2">
                    |
                  </span>
                )}
                <Link
                  href={item.href}
                  className="transition-opacity hover:opacity-70"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {email ? (
            <span className="ml-5">
              <AccountMenu email={email} />
            </span>
          ) : (
            <span className="border-ink/15 text-indigo ml-5 rounded-sm border bg-white px-3 py-1.5 font-medium">
              <Link href="/join" className="hover:opacity-70">
                JOIN
              </Link>{" "}
              <span className="font-normal lowercase">or</span>{" "}
              <Link href="/sign-in" className="hover:opacity-70">
                SIGN IN
              </Link>
            </span>
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main"
      className={`text-cream fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled || open ? "bg-ink/60 backdrop-blur-md" : ""
      }`}
    >
      <div
        data-nav-bar
        className="flex h-14 items-center justify-end gap-2 px-4 sm:hidden"
      >
        {email && <AccountMenu email={email} />}
        {burger}
      </div>
      {panel}
      <div
        data-nav-bar
        className="mx-auto hidden min-h-16 max-w-7xl flex-wrap items-center justify-end gap-y-1 px-6 py-2 text-sm sm:flex sm:px-10"
      >
        <ul className="flex flex-wrap items-center justify-end">
          {NAV.map((item, i) => (
            <li key={item.href} className="flex items-center">
              {i > 0 && (
                <span aria-hidden="true" className="text-cream/50 px-2">
                  |
                </span>
              )}
              <Link
                href={item.href}
                className="transition-opacity hover:opacity-70"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        {email ? (
          <span className="ml-5">
            <AccountMenu email={email} />
          </span>
        ) : (
          <span
            className={`ml-5 rounded-sm bg-white px-3 py-1.5 font-medium ${
              scrolled ? "text-yellow" : "text-indigo"
            }`}
          >
            <Link href="/join" className="hover:opacity-70">
              JOIN
            </Link>{" "}
            <span className="font-normal lowercase">or</span>{" "}
            <Link href="/sign-in" className="hover:opacity-70">
              SIGN IN
            </Link>
          </span>
        )}
      </div>
    </nav>
  );
}
