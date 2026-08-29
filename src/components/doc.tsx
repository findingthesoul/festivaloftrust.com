/**
 * The frame for the legal pages, so terms, privacy and cookies read as one
 * voice. Pages inside write plain h2/p/ul; the styling lives here once.
 */
export function Doc({
  title,
  standfirst,
  updated,
  children,
}: {
  title: string;
  standfirst: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
        {title}
      </h1>
      <p className="mt-6 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
        {standfirst}
      </p>
      <p className="text-ink/50 mt-3 text-sm">Last updated {updated}</p>
      <div className="mt-4 leading-relaxed text-pretty [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </main>
  );
}
