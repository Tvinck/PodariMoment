-- Шаблоны текстов и конфигурация голосов

create table if not exists public.prompt_templates (
  id uuid default gen_random_uuid() primary key,
  scenario text not null,      -- formal | funny | warm | mysterious
  baby_gender text not null,   -- boy | girl | surprise
  template text not null,
  is_active boolean default true,
  updated_at timestamptz default now(),
  unique (scenario, baby_gender)
);

create table if not exists public.voice_config (
  id uuid default gen_random_uuid() primary key,
  voice_key text unique not null,   -- male | female | child | solemn | soft
  voice_name text not null,         -- Adam | Rachel | Gigi | Antoni | Domi
  display_name text not null,       -- Мужской | Женский ...
  tariffs text[] default '{basic,premium,vip}',
  is_active boolean default true,
  stability float default 0.6,
  similarity_boost float default 0.8,
  style float default 0.4,
  speed float default 0.9
);

alter table public.prompt_templates enable row level security;
alter table public.voice_config enable row level security;

-- 12 шаблонов (4 сценария × 3 пола). {parent_names}, {party_date}, {baby_gender}.
insert into public.prompt_templates (scenario, baby_gender, template) values
('formal','boy','Дорогие {parent_names}! Я ваш сыночек, и я уже не могу дождаться встречи с вами. Совсем скоро, {party_date}, вы узнаете, кто я. Я люблю вас!'),
('formal','girl','Дорогие {parent_names}! Я ваша доченька, и я уже не могу дождаться встречи с вами. Совсем скоро, {party_date}, вы узнаете, кто я. Я люблю вас!'),
('formal','surprise','Дорогие {parent_names}! Я ваш малыш, и я уже не могу дождаться встречи с вами. Совсем скоро, {party_date}, вы узнаете, кто я. Я люблю вас!'),
('funny','boy','Эй, {parent_names}! Это я, ваш сыночек! Да-да, тот самый, из животика! Готовьтесь — {party_date} я раскрою главный секрет года. Я уже смеюсь!'),
('funny','girl','Эй, {parent_names}! Это я, ваша доченька! Да-да, та самая, из животика! Готовьтесь — {party_date} я раскрою главный секрет года. Я уже смеюсь!'),
('funny','surprise','Эй, {parent_names}! Это я, ваш малыш! Да-да, тот самый, из животика! Готовьтесь — {party_date} я раскрою главный секрет года. Я уже смеюсь!'),
('warm','boy','Мамочка и папочка, {parent_names}... Я чувствую вашу любовь каждый день. {party_date} вы узнаете, кто будет любить вас всю жизнь — ваш сыночек.'),
('warm','girl','Мамочка и папочка, {parent_names}... Я чувствую вашу любовь каждый день. {party_date} вы узнаете, кто будет любить вас всю жизнь — ваша доченька.'),
('warm','surprise','Мамочка и папочка, {parent_names}... Я чувствую вашу любовь каждый день. {party_date} вы узнаете, кто будет любить вас всю жизнь — ваш малыш.'),
('mysterious','boy','Тссс... {parent_names}. Секрет хранится совсем недолго. {party_date} всё откроется. Я жду не дождусь нашей встречи... ваш сыночек.'),
('mysterious','girl','Тссс... {parent_names}. Секрет хранится совсем недолго. {party_date} всё откроется. Я жду не дождусь нашей встречи... ваша доченька.'),
('mysterious','surprise','Тссс... {parent_names}. Секрет хранится совсем недолго. {party_date} всё откроется. Я жду не дождусь нашей встречи... ваш малыш.')
on conflict (scenario, baby_gender) do nothing;

-- 5 голосов
insert into public.voice_config (voice_key, voice_name, display_name, tariffs) values
('male','Adam','Мужской','{basic,premium,vip}'),
('female','Rachel','Женский','{basic,premium,vip}'),
('child','Gigi','Детский','{basic,premium,vip}'),
('solemn','Antoni','Торжественный','{premium,vip}'),
('soft','Domi','Мягкий','{premium,vip}')
on conflict (voice_key) do nothing;
