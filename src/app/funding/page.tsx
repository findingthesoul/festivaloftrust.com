import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Funding",
  description:
    "Why funders back Festivals of Trust, and how funding a community's festival works.",
  alternates: { canonical: "/funding" },
};

export default function Page() {
  return <PageShell title="Funding" intro="For funders who believe trust is worth investing in, and want to see it grow at ground level." />;
}
