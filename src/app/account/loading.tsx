/**
 * What a tab shows the instant it is clicked, while the server thinks. The
 * shape of the page it stands for, in shimmer — the click answers now, the
 * data follows into it.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 animate-pulse px-6 py-12 sm:px-10 sm:py-16">
      <div className="bg-ink/10 h-4 w-28 rounded" />
      <div className="bg-ink/10 mt-5 h-10 w-2/3 rounded" />
      <div className="border-ink/10 mt-7 flex gap-6 border-b pb-3">
        <div className="bg-ink/10 h-4 w-16 rounded" />
        <div className="bg-ink/10 h-4 w-16 rounded" />
        <div className="bg-ink/10 h-4 w-20 rounded" />
        <div className="bg-ink/10 h-4 w-16 rounded" />
      </div>
      <div className="border-ink/10 mt-8 h-52 rounded-xl border bg-white/40" />
      <div className="border-ink/10 mt-6 h-36 rounded-xl border bg-white/40" />
    </main>
  );
}
