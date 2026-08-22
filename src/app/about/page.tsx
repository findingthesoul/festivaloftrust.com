import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return <PageShell title="About" intro="Festival of Trust is a grassroots movement: finding trust where it already lives, and building it where it is missing." />;
}
