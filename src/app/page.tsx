export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Coming soon
        </p>

        <h1 className="mt-6 text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl">
          Festival of Trust
        </h1>

        <hr className="my-8 border-0 border-t border-rule" />

        <p className="max-w-md text-base leading-relaxed text-muted text-pretty">
          A gathering about trust — how we build it, lose it, and rebuild it
          together.
        </p>

        <p className="mt-10 font-mono text-xs text-muted">
          <a
            href="mailto:hello@festivaloftrust.com"
            className="underline decoration-rule underline-offset-4 transition-colors hover:text-foreground hover:decoration-current"
          >
            hello@festivaloftrust.com
          </a>
        </p>
      </div>
    </main>
  );
}
