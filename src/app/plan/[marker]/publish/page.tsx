import { redirect } from "next/navigation";

/** Publishing moved to the top of Settings; the old address follows it. */
export default async function Page({
  params,
}: {
  params: Promise<{ marker: string }>;
}) {
  const { marker } = await params;
  redirect(`/plan/${marker}/settings`);
}
