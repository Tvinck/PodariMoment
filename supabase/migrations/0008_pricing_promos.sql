-- Цены тарифов и промокоды

create table if not exists public.pricing (
  id uuid default gen_random_uuid() primary key,
  tariff text unique not null,   -- basic | premium | vip
  price int not null,            -- в рублях
  old_price int,                 -- зачёркнутая цена
  is_active boolean default true,
  badge text,                    -- «Хит» | «-20%» | null
  description text
);

create table if not exists public.promo_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  discount_type text not null,   -- 'percent' | 'fixed'
  discount_value int not null,   -- % или рубли
  max_uses int default 1,        -- 0 = безлимит
  uses_count int default 0,
  valid_until timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  description text
);

-- discount_amount в заказах (для аналитики)
alter table public.orders add column if not exists discount_amount int default 0;

alter table public.pricing enable row level security;
alter table public.promo_codes enable row level security;

insert into public.pricing (tariff, price, badge, description) values
('basic', 399, null, 'Шаблонный текст, 1 голос, ~45 сек'),
('premium', 599, 'Хит', 'Персонализированный текст, 5 голосов, ~90 сек'),
('vip', 999, null, 'GPT-текст, все голоса, до 3 минут')
on conflict (tariff) do nothing;
