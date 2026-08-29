// In its own module so the sitemap and the client nav can both read the list
// without pulling the server-only Supabase code along.
export const NAV = [
  { href: "/", label: "Home" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/for-society", label: "Society" },
  { href: "/for-organisations", label: "Organisations" },
  { href: "/funding", label: "Funding" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** Public pages for the sitemap: the nav plus entry points not shown in it. */
export const PUBLIC_PATHS = [...NAV.map((n) => n.href), "/join"];
