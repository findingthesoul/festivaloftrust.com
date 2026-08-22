import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "For society" };

export default function Page() {
  return <PageShell title="For society" intro="How a community hosts a Festival of Trust in its own place, with the backing of a funder." />;
}
