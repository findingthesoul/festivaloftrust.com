"use client";

import { usePathname } from "next/navigation";

/**
 * Which chrome a page gets: the website's, or the workspace's.
 *
 * Both live in the root layout, so until 065ac6c they wrapped everything —
 * including the review screens and a festival's planning pages, where a
 * "Home · Upcoming · Funding" bar is somebody else's website appearing in the
 * middle of your workspace.
 *
 * That release removed the bar from those pages entirely, and took the account
 * control with it, since the two share one bar. So the choice is not
 * nav-or-nothing but which nav: NavSwitch hands backend pages a bar carrying
 * only the account control, and the footer stays off them.
 *
 * WHY CLIENT COMPONENTS AND NOT ROUTE GROUPS
 * The tidy Next answer is to move every public page into a `(site)` group whose
 * layout carries the chrome, leaving the root layout bare. That is a directory
 * move across a dozen routes, and this repo currently has two people working in
 * it — a move that size would collide with everything in flight. This is two
 * small components and no moves. If the routes are ever regrouped for other
 * reasons, both should go.
 *
 * usePathname works during server rendering of a client component, so the
 * decision is made before the HTML is sent and nothing flashes.
 *
 * The cost, stated: both bars are rendered on the server before they reach
 * NavSwitch, and only one is shown. They are cheap markup around one shared
 * session lookup — SiteNav does that lookup once and passes the result to
 * both — so this is duplicated rendering, not duplicated querying.
 */

/** Everything behind a sign-in: reviewing, planning, your own account. */
const BACKEND = ["/admin", "/plan", "/festivals", "/account"];

export function isBackendPath(pathname: string): boolean {
  return BACKEND.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** The website's bar, or the workspace's — never both. */
export function NavSwitch({
  publicNav,
  backendNav,
}: {
  publicNav: React.ReactNode;
  backendNav: React.ReactNode;
}) {
  return <>{isBackendPath(usePathname() ?? "/") ? backendNav : publicNav}</>;
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
      {nav}
      {children}
      {!backend && footer}
    </>
  );
}
