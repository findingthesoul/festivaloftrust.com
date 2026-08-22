import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "For organisations" };

export default function Page() {
  return <PageShell title="For organisations" intro="How an organisation hosts a Festival of Trust inside its own walls, to grow trust among its own people." />;
}
