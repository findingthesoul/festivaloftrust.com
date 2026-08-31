import { redirect } from "next/navigation";

/** Publishing moved onto the Webpage tab; the old address follows it. */
export default async function Page({
  params,
}: {
  params: Promise<{ marker: string }>;
}) {
  const { marker } = await params;
  redirect(`/plan/${marker}/webpage`);
}
