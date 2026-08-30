-- ============================================================================
-- The base prices, kept where the currencies already live: fundamentals the
-- workspace admin sets in the calculator's third tab. The trust training per
-- person, and the kit — per person and minimum, social and commercial. A
-- festival in another currency gets these times its currency's ratio.
-- ============================================================================

create table if not exists public.calculator_price (
  key   text primary key,
  value numeric not null check (value > 0)
);

alter table public.calculator_price enable row level security;

drop policy if exists calculator_price_read on public.calculator_price;
create policy calculator_price_read on public.calculator_price
  for select using (auth.uid() is not null);

drop policy if exists calculator_price_write on public.calculator_price;
create policy calculator_price_write on public.calculator_price
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.calculator_price (key, value) values
  ('train_pp', 250),
  ('kit_pp_social', 25),
  ('kit_pp_commercial', 50),
  ('kit_min_social', 1000),
  ('kit_min_commercial', 2500)
  on conflict (key) do nothing;

-- Two numbers per currency, not one: the exchange rate against the base
-- (EUR to rand), and the price level for the income group (0.5 = half
-- price locally). Effective prices are base times both.
alter table public.calculator_currency
  add column if not exists rate numeric not null default 1 check (rate > 0);
