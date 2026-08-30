-- ============================================================================
-- Two additions for the event page and the calculator.
--
-- practical_info: address, times, what to bring — its own card on the page.
--
-- calculator_currency: the workspace's currency list, kept by the admin in
-- the calculator's Fundamentals tab. Each currency carries a ratio against
-- the base prices: a festival that chooses it starts from the base defaults
-- times that ratio (South Africa at 0.5 starts from half the base rates).
-- Readable by any signed-in organiser — the calculator needs the list —
-- and written only by an admin.
-- ============================================================================

alter table public.festival
  add column if not exists practical_info text;

create table if not exists public.calculator_currency (
  code       text primary key check (char_length(code) = 3),
  label      text not null,
  symbol     text not null,
  ratio      numeric not null check (ratio > 0),
  created_at timestamptz not null default now()
);

alter table public.calculator_currency enable row level security;

drop policy if exists calculator_currency_read on public.calculator_currency;
create policy calculator_currency_read on public.calculator_currency
  for select using (auth.uid() is not null);

drop policy if exists calculator_currency_write on public.calculator_currency;
create policy calculator_currency_write on public.calculator_currency
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.calculator_currency (code, label, symbol, ratio)
  values ('EUR', 'Euro', E'€', 1.0)
  on conflict (code) do nothing;

-- Which currency a festival's figures are in. On the calculator row, since
-- that is where the money lives and who may see it is already decided there.
alter table public.festival_calculator
  add column if not exists currency text not null default 'EUR';
