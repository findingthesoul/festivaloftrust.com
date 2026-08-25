import Link from "next/link";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/for-society", label: "For society" },
  { href: "/for-organisations", label: "For organisations" },
  { href: "/funding", label: "Funding" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** Public pages for the sitemap: the nav plus entry points not shown in it. */
export const PUBLIC_PATHS = [...NAV.map((n) => n.href), "/join"];

export function SiteNav() {
  return (
    <nav aria-label="Main" className="w-full">
      <ul className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 py-5 text-sm sm:gap-x-7 sm:px-10">
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
    </nav>
  );
}
