"use server";

import { revalidatePath } from "next/cache";
import { createFestival, takenMarkers } from "@/lib/festivals";
import { isValidMarker, suggestMarkers } from "@/lib/marker";

export type NewFestivalState = {
  status: "idle" | "error";
  message?: string;
  suggestions?: string[];
  values?: { name: string; marker: string };
};

export async function newFestival(
  _prev: NewFestivalState,
  formData: FormData,
): Promise<NewFestivalState> {
  const name = String(formData.get("name") ?? "").trim();
  const marker = String(formData.get("marker") ?? "").trim().toLowerCase();

  if (!name) return { status: "error", message: "Give the festival a name." };

  const taken = await takenMarkers();
  const suggestions = suggestMarkers(name, taken, new Date().getFullYear());

  if (!marker) {
    return {
      status: "error",
      message: "Choose an address.",
      suggestions,
      values: { name, marker: "" },
    };
  }
  if (!isValidMarker(marker)) {
    return {
      status: "error",
      message:
        "An address is lowercase letters, numbers and hyphens, and cannot be one of the site's own pages.",
      suggestions,
      values: { name, marker },
    };
  }

  const result = await createFestival({ name, marker });
  if ("error" in result) {
    return {
      status: "error",
      message: result.error,
      suggestions: suggestions.filter((s) => s !== marker),
      values: { name, marker },
    };
  }

  revalidatePath("/festivals");
  return { status: "idle" };
}
