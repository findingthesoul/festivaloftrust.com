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
  const tabs: { key: Tab; label: string; href: string; show: boolean }[] = [
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

  return (
    <nav aria-label="This festival" className="border-ink/10 mt-6 flex gap-1 overflow-x-auto border-b">
      {tabs
        .filter((t) => t.show)
        .map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={t.key === active ? "page" : undefined}
            className={
              t.key === active
                ? "border-green -mb-px border-b-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap"
                : "text-ink/60 hover:text-ink -mb-px border-b-2 border-transparent px-4 py-2.5 text-sm whitespace-nowrap transition-colors"
            }
          >
            {t.label}
          </Link>
        ))}
    </nav>
  );
}
