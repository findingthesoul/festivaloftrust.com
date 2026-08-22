import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Funding" };

export default function Page() {
  return <PageShell title="Funding" intro="For funders who believe trust is worth investing in, and want to see it grow at ground level." />;
}
