"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/client";
import { secondary } from "@/components/ui";

export function SignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await browserSupabase().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
      className={secondary}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
