-- CRM: лиды и воронка продаж
create table if not exists public.crm_leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),

  -- Контакт
  name text,
  email text,
  phone text,
  source text,  -- 'avito' | 'vk' | 'telegram' | 'direct' | 'referral'

  -- Этап воронки: new → contacted → interested → ordered → done → lost
  stage text default 'new'
    check (stage in ('new','contacted','interested','ordered','done','lost')),

  -- Детали
  notes text,
  lost_reason text,
  order_id uuid references public.orders(id),

  -- Менеджер
  assigned_to text default 'admin',

  -- Тайм-метки этапов
  contacted_at  timestamptz,
  interested_at timestamptz,
  ordered_at    timestamptz,
  done_at       timestamptz,
  lost_at       timestamptz
);

create index if not exists crm_leads_stage_idx   on public.crm_leads (stage);
create index if not exists crm_leads_email_idx   on public.crm_leads (email);
create index if not exists crm_leads_created_idx on public.crm_leads (created_at desc);

-- RLS: доступ только через service_role (серверные функции)
alter table public.crm_leads enable row level security;
