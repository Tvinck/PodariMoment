-- Тариф и тайм-метки для трекинга
alter table public.orders
  add column if not exists tariff text default 'premium',
  add column if not exists paid_at timestamptz,
  add column if not exists done_at timestamptz;

create index if not exists orders_tariff_idx on public.orders (tariff);
