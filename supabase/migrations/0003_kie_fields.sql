-- Поля под Kie.ai TTS-генерацию
alter table public.orders
  add column if not exists kie_task_id text,
  add column if not exists error_log text;

create index if not exists orders_kie_task_id_idx on public.orders (kie_task_id);

-- Новый статус generation_failed в допустимом наборе
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending','paid','processing','done','generation_failed','refunded','failed'));

-- Storage bucket для готовых файлов
insert into storage.buckets (id, name, public)
values ('order-files', 'order-files', true)
on conflict (id) do nothing;

-- Публичное чтение файлов заказа (запись — только service_role, RLS его не ограничивает)
drop policy if exists "Public read order files" on storage.objects;
create policy "Public read order files"
  on storage.objects for select
  using (bucket_id = 'order-files');
