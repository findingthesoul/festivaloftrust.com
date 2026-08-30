"use client";

import { usePathname } from "next/navigation";

/**
 * The public site's nav and footer, on public pages only.
 *
 * They live in the root layout, so until now they wrapped everything —
 * including the review screens and a festival's planning pages, where a
 * "Home · Upcoming · Funding" bar is somebody else's website appearing in the
 * middle of your workspace.
 *
 * WHY A CLIENT COMPONENT AND NOT ROUTE GROUPS
 * The tidy Next answer is to move every public page into a `(site)` group whose
 * layout carries the chrome, leaving the root layout bare. That is a directory
 * move across a dozen routes, and this repo currently has two people working in
 * it — a move that size would collide with everything in flight. This is one
 * file and no moves. If the routes are ever regrouped for other reasons, this
 * should go.
 *
 * usePathname works during server rendering of a client component, so the
 * decision is made before the HTML is sent and nothing flashes.
 *
 * The cost, stated: `nav` and `footer` are rendered on the server before they
 * reach here, so SiteNav still runs its session lookup on a backend page even
 * though nothing is shown. One query, no output. Cheap enough to accept and
 * worth knowing about.
 */

/** Everything behind a sign-in: reviewing, planning, your own account. */
const BACKEND = ["/admin", "/plan", "/festivals", "/account"];

export function isBackendPath(pathname: string): boolean {
  return BACKEND.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function Chrome({
  nav,
  footer,
  children,
}: {
  nav: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const backend = isBackendPath(usePathname() ?? "/");
  return (
    <>
      {!backend && nav}
      {children}
      {!backend && footer}
    </>
  );
}
