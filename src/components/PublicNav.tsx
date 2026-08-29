"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "./nav-links";

/**
 * The signed-out navigation. On the home page it floats over the full-screen
 * poster, menu to the right so the docking logo owns the left: transparent
 * while the page rests at the top, then a dark blur over the photo the moment
 * scrolling starts, so the cream menu stays legible on any part of the
 * picture. Everywhere else it is the plain centred bar in the flow of the
 * page it always was. On phones the menu folds into a hamburger.
 */
export function PublicNav() {
  const overlay = usePathname() === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const read = () => setScrolled(window.scrollY > 8);
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [overlay]);

  const close = () => setOpen(false);

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
        overlay
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
        <li className="mt-2 flex gap-4">
          <Link href="/join" onClick={close} className="font-medium">
            Join
          </Link>
          <Link
            href="/sign-in"
            onClick={close}
            className={`font-medium ${overlay ? "text-yellow" : "text-green"}`}
          >
            Sign in
          </Link>
        </li>
      </ul>
    </div>
  );

  if (!overlay) {
    return (
      <nav aria-label="Main" className="w-full">
        <div
          data-nav-bar
          className="flex h-14 items-center justify-between px-4 sm:hidden"
        >
          <Link href="/" className="text-sm font-bold tracking-[-0.01em]">
            Festival of Trust
          </Link>
          {burger}
        </div>
        {panel}
        <div
          data-nav-bar
          className="mx-auto hidden max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 py-5 text-sm sm:flex sm:gap-x-7 sm:px-10"
        >
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:gap-x-7">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="decoration-2 underline-offset-4 transition-opacity hover:underline hover:opacity-70"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <span className="text-ink/20">|</span>
          <Link
            href="/join"
            className="decoration-2 underline-offset-4 transition-opacity hover:underline hover:opacity-70"
          >
            Join
          </Link>
          <Link
            href="/sign-in"
            className="text-green font-medium hover:opacity-70"
          >
            Sign in
          </Link>
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
        className="flex h-14 items-center justify-end px-4 sm:hidden"
      >
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
        <span
          className={`ml-5 rounded-sm bg-white px-3 py-1.5 font-medium ${
            scrolled ? "text-yellow" : "text-indigo"
          }`}
        >
          <Link href="/join" className="hover:opacity-70">
            Join
          </Link>
          /
          <Link href="/sign-in" className="hover:opacity-70">
            Sign in
          </Link>
        </span>
      </div>
    </nav>
  );
}
