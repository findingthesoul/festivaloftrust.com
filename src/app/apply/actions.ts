"use server";

import { redirect } from "next/navigation";
import { apply } from "@/lib/organiser";

export type ApplyState = { status: "idle" | "error"; message?: string };

export async function submitApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { status: "error", message: "Please give your name." };

  const result = await apply({
    fullName,
    organisation: String(formData.get("organisation") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    reason: String(formData.get("reason") ?? "").trim(),
  });
  if ("error" in result) return { status: "error", message: result.error };

  redirect("/festivals");
}
