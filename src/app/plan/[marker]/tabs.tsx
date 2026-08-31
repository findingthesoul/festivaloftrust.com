import Link from "next/link";

/**
 * The festival's own navigation.
 *
 * Links rather than client-side tabs: each one is a real page with its own
 * access rules, and a host who cannot see the money must not be able to reach
 * the calculator by clicking a tab that never re-checks.
 */
export type Tab =
  | "planner"
  | "calculator"
  | "registrations"
  | "settings"
  | "webpage"
  | "publish";

export function FestivalTabs({
  marker,
  active,
  canSeeMoney,
  isOrganiser,
  status,
}: {
  marker: string;
  active: Tab;
  canSeeMoney: boolean;
  isOrganiser: boolean;
  status: "draft" | "submitted" | "live";
}) {
  const tabs: {
    key: Tab;
    label: string;
    shortLabel?: string;
    href: string;
    show: boolean;
  }[] = [
    { key: "planner", label: "Planner", href: `/plan/${marker}`, show: true },
    {
      key: "calculator",
      label: "Calculator",
      href: `/plan/${marker}/calculator`,
      show: canSeeMoney,
    },
    {
      key: "registrations",
      label: "Registrations",
      shortLabel: "Guests",
      href: `/plan/${marker}/registrations`,
      show: true,
    },
    {
      key: "settings",
      label: "Settings",
      href: `/plan/${marker}/settings`,
      show: isOrganiser,
    },
    {
      key: "webpage",
      label: "Webpage",
      href: `/plan/${marker}/webpage`,
      show: isOrganiser,
    },
    {
      // The label is the act, not the state: an organiser reads it to know what
      // pressing it will do.
      key: "publish",
      label: status === "live" ? "Unpublish" : "Publish",
      href: `/plan/${marker}/publish`,
      show: isOrganiser,
    },
  ];

  const shown = tabs.filter((t) => t.show);

  return (
    <>
      <nav
        aria-label="This festival"
        className="border-ink/10 mt-6 hidden gap-1 overflow-x-auto border-b sm:flex"
      >
        {shown.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={t.key === active ? "page" : undefined}
            className={`flex items-center gap-2 whitespace-nowrap ${
              t.key === active
                ? "border-green -mb-px border-b-2 px-4 py-2.5 text-sm font-bold"
                : "text-ink/60 hover:text-ink -mb-px border-b-2 border-transparent px-4 py-2.5 text-sm transition-colors"
            }`}
          >
            <TabIcon tab={t.key} className="h-4.5 w-4.5" />
            {t.label}
          </Link>
        ))}
      </nav>

      {/* On a phone the festival is an app: its sections dock at the bottom
          of the screen, icons under the thumb. globals.css gives any main
          that holds this dock the bottom room it needs. */}
      <nav
        data-festival-dock
        aria-label="This festival"
        className="border-ink/10 bg-cream fixed inset-x-0 bottom-0 z-40 flex justify-around border-t pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(24,23,23,0.06)] sm:hidden"
      >
        {shown.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={t.key === active ? "page" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 pt-2 pb-1 text-[10px] font-medium ${
              t.key === active ? "text-green" : "text-ink/55"
            }`}
          >
            <TabIcon tab={t.key} />
            <span className="max-w-full truncate">{t.shortLabel ?? t.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

/** One stroke icon per section — drawn, not imported, to stay dependency-free. */
function TabIcon({ tab, className = "h-5.5 w-5.5" }: { tab: Tab; className?: string }) {
  const paths: Record<Tab, React.ReactNode> = {
    planner: (
      <>
        <path d="M9 20l-6-2V5l6 2 6-2 6 2v13l-6-2-6 2z" />
        <path d="M9 7v13M15 5v13" />
      </>
    ),
    calculator: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" />
      </>
    ),
    registrations: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="M16.5 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2c1.8.8 3 2.6 3 5.8" />
      </>
    ),
    settings: (
      <>
        <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
        <circle cx="16" cy="8" r="2.2" />
        <circle cx="8" cy="16" r="2.2" />
      </>
    ),
    webpage: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9z" />
      </>
    ),
    publish: (
      <>
        <path d="M12 16V5M7 10l5-5 5 5" />
        <path d="M5 19h14" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[tab]}
    </svg>
  );
}
