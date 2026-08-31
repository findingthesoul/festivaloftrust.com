import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the people behind the Festival of Trust.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return (
    <PageShell title="Contact" intro="Get in touch about hosting, funding or joining a Festival of Trust.">
      <p className="mt-8">
        <a
          href="mailto:hello@festivaloftrust.com"
          className="text-green text-lg font-medium underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
        >
          hello@festivaloftrust.com
        </a>
      </p>
    </PageShell>
  );
}
