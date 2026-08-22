/** Shared frame for the inner pages, so they stay consistent while they are
 *  still placeholders. */
export function PageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
        {title}
      </h1>
      {intro ? (
        <p className="mt-6 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
          {intro}
        </p>
      ) : null}
      {children}
      <p className="text-ink/50 mt-16 text-sm">More on this page soon.</p>
    </main>
  );
}
