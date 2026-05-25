-- Заметка администратора к заказу
alter table public.orders
  add column if not exists admin_note text;
