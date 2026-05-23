-- Таблица заказов ПодариМомент
create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  product        text not null default 'gender',
  baby_gender    text,
  voice_type     text,
  scenario       text,
  parent_names   text,
  party_date     date,
  email          text,
  promo_code     text,
  payment_id     text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed')),
  file_url       text
);

create index if not exists orders_email_idx       on public.orders (email);
create index if not exists orders_status_idx      on public.orders (payment_status);
create index if not exists orders_created_at_idx  on public.orders (created_at desc);
create index if not exists orders_payment_id_idx  on public.orders (payment_id);

-- RLS: доступ к таблице только через service_role (серверные функции).
-- Анонимный/публичный ключ не должен читать или писать заказы напрямую.
alter table public.orders enable row level security;
-- Намеренно НЕ создаём политик для anon/authenticated — service_role обходит RLS.
