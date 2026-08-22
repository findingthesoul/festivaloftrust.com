import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Upcoming" };

export default function Page() {
  return <PageShell title="Upcoming" intro="Festivals being planned and hosted, community by community." />;
}
