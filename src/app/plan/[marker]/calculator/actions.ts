"use server";

import { serverSupabase } from "@/lib/supabase/server";
import { accessTo, festivalByMarker } from "@/lib/festivals";

/**
 * Reading and writing the tenth area.
 *
 * `data` is the calculator's own snapshot, stored whole and never interpreted
 * here. The tool owns its format — that is what makes a new export a drop-in
 * replacement rather than a migration.
 *
 * Both actions re-check access. RLS enforces it too, but a server action is a
 * public endpoint and must not rely on the page that rendered it having asked.
 */
async function moneyAccessTo(marker: string) {
  const festival = await festivalByMarker(marker);
  if (!festival) return null;
  const access = await accessTo(festival);
  return access?.canSeeMoney ? festival : null;
}

export async function loadCalculator(marker: string): Promise<unknown | null> {
  const festival = await moneyAccessTo(marker);
  if (!festival) return null;

  const supabase = await serverSupabase();
  const { data } = await supabase
    .from("festival_calculator")
    .select("data")
    .eq("festival_id", festival.id)
    .maybeSingle();
  return (data as { data: unknown } | null)?.data ?? null;
}

export async function saveCalculator(
  marker: string,
  data: unknown,
): Promise<{ error?: string }> {
  const festival = await moneyAccessTo(marker);
  if (!festival) return { error: "not yours" };

  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("festival_calculator")
    .upsert(
      { festival_id: festival.id, data, updated_by: auth.user?.id },
      { onConflict: "festival_id" },
    );
  return error ? { error: error.message } : {};
}

export type CalcCurrency = {
  code: string;
  label: string;
  symbol: string;
  /** Exchange rate against the base: how many of this one base unit buys. */
  rate: number;
  /** Price level for the income group: 0.5 is half price locally. */
  ratio: number;
};

export type CalcPrices = Record<string, number>;

// What the fundamentals mean when the table is empty: the tool's own
// original literals.
const DEFAULT_PRICES: CalcPrices = {
  train_pp: 250,
  kit_pp_social: 25,
  kit_pp_commercial: 50,
  kit_min_social: 1000,
  kit_min_commercial: 2500,
  // Hours, not money: multiplied by the facilitator rate, never by the
  // currency ratio.
  organising_hours: 12,
};
const PRICE_KEYS = Object.keys(DEFAULT_PRICES);

/**
 * Everything the calculator page needs to speak currency: the workspace's
 * list, this festival's choice, and whether the caller is the admin who may
 * edit the fundamentals.
 */
export async function loadCurrencyContext(marker: string): Promise<{
  currencies: CalcCurrency[];
  current: string;
  isAdmin: boolean;
  prices: CalcPrices;
} | null> {
  const festival = await moneyAccessTo(marker);
  if (!festival) return null;

  const supabase = await serverSupabase();
  const { data: rows } = await supabase
    .from("calculator_currency")
    .select("code, label, symbol, ratio, rate")
    .order("code");
  const { data: calc } = await supabase
    .from("festival_calculator")
    .select("currency")
    .eq("festival_id", festival.id)
    .maybeSingle();
  const { data: auth } = await supabase.auth.getUser();
  const { data: me } = auth.user
    ? await supabase
        .from("organiser")
        .select("is_admin")
        .eq("id", auth.user.id)
        .maybeSingle()
    : { data: null };

  const { data: priceRows } = await supabase
    .from("calculator_price")
    .select("key, value");
  const prices: CalcPrices = { ...DEFAULT_PRICES };
  for (const row of (priceRows ?? []) as { key: string; value: number }[]) {
    if (PRICE_KEYS.includes(row.key)) prices[row.key] = Number(row.value);
  }

  return {
    currencies: ((rows ?? []) as CalcCurrency[]).map((c) => ({
      ...c,
      ratio: Number(c.ratio),
      rate: Number(c.rate ?? 1),
    })),
    current: (calc as { currency: string } | null)?.currency ?? "EUR",
    isAdmin: !!(me as { is_admin: boolean } | null)?.is_admin,
    prices,
  };
}

export async function setFestivalCurrency(
  marker: string,
  code: string,
): Promise<{ error?: string }> {
  const festival = await moneyAccessTo(marker);
  if (!festival) return { error: "not yours" };
  if (!/^[A-Z]{3}$/.test(code)) return { error: "not a currency code" };

  const supabase = await serverSupabase();
  const { error } = await supabase
    .from("festival_calculator")
    .upsert({ festival_id: festival.id, currency: code }, { onConflict: "festival_id" });
  return error ? { error: error.message } : {};
}

/**
 * The admin's fundamentals: replace the currency list wholesale. RLS backs
 * this, but the action checks too — it is a public endpoint.
 */
export async function saveFundamentals(payload: {
  currencies: CalcCurrency[];
  prices: CalcPrices;
}): Promise<{ error?: string }> {
  const list = payload?.currencies;
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "not signed in" };
  const { data: me } = await supabase
    .from("organiser")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!(me as { is_admin: boolean } | null)?.is_admin) {
    return { error: "only the admin may change the fundamentals" };
  }

  const clean = (Array.isArray(list) ? list : [])
    .map((c) => ({
      code: String(c.code ?? "").toUpperCase().trim(),
      label: String(c.label ?? "").trim(),
      symbol: String(c.symbol ?? "").trim(),
      ratio: Number(c.ratio),
      rate: Number(c.rate),
    }))
    .filter(
      (c) =>
        /^[A-Z]{3}$/.test(c.code) &&
        c.label &&
        c.symbol &&
        c.ratio > 0 &&
        c.rate > 0,
    );
  if (clean.length === 0) return { error: "the list needs at least one currency" };
  if (!clean.some((c) => c.code === "EUR")) {
    return { error: "the base currency (EUR) stays on the list" };
  }

  const { error } = await supabase
    .from("calculator_currency")
    .upsert(clean, { onConflict: "code" });
  if (error) return { error: error.message };

  const keep = clean.map((c) => c.code);
  const { error: delError } = await supabase
    .from("calculator_currency")
    .delete()
    .not("code", "in", `(${keep.join(",")})`);
  if (delError) return { error: delError.message };

  const priceRows = PRICE_KEYS.map((key) => ({
    key,
    value: Number(payload?.prices?.[key]),
  })).filter((r) => r.value > 0);
  if (priceRows.length) {
    const { error: priceError } = await supabase
      .from("calculator_price")
      .upsert(priceRows, { onConflict: "key" });
    if (priceError) return { error: priceError.message };
  }
  return {};
}
