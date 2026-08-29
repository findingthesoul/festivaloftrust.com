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

/**
 * Top-level pages that take the plain centred nav. Any other single-segment
 * path is a festival's marker, whose page opens on a full-screen photo — the
 * nav floats over it in cream there, like the home page, but scrolls away
 * with it.
 */
export const PLAIN_PATHS = [
  ...PUBLIC_PATHS,
  "/sign-in",
  "/apply",
  "/festivals",
  "/account",
  "/admin",
];
