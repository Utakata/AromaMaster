-- AromaMaster 初期スキーマ
-- すべてのユーザーデータは RLS で本人 (auth.uid()) のみに制限する。

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  safety jsonb not null default '{"pregnancy":false,"children":false,"pets":false,"epilepsy":false}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text,
  kind text not null check (kind in ('oil', 'ethanol', 'stick', 'bottle')),
  oil_id text,
  brand text not null,
  label text not null,
  size numeric not null check (size > 0),
  unit text not null check (unit in ('mL', '本')),
  remaining numeric check (remaining is null or remaining >= 0),
  status text not null check (status in ('new', 'in_use', 'unknown', 'empty')),
  low_threshold numeric,
  asin text,
  custom_url text,
  updated_at timestamptz not null default now()
);
create index if not exists inventory_items_user_idx on public.inventory_items (user_id);

create table if not exists public.recipes (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  device text not null check (device in ('reed', 'nebulizer', 'ultrasonic')),
  capacity_ml numeric not null,
  ofnr jsonb not null,
  blend jsonb not null
);
create index if not exists recipes_user_idx on public.recipes (user_id);

create table if not exists public.usage_logs (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id text references public.recipes (id) on delete set null,
  made_at timestamptz not null default now(),
  deductions jsonb not null default '[]'::jsonb
);
create index if not exists usage_logs_user_idx on public.usage_logs (user_id);

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- 通知の重複抑止（アイテム × アラート種別ごとの最終送信時刻）
create table if not exists public.notifications_sent (
  user_id uuid not null references auth.users (id) on delete cascade,
  inventory_item_id text not null references public.inventory_items (id) on delete cascade,
  level text not null check (level in ('empty', 'low', 'unknown')),
  sent_at timestamptz not null default now(),
  primary key (user_id, inventory_item_id, level)
);

alter table public.profiles enable row level security;
alter table public.inventory_items enable row level security;
alter table public.recipes enable row level security;
alter table public.usage_logs enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications_sent enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own inventory" on public.inventory_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own recipes" on public.recipes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own usage" on public.usage_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own push subscriptions" on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read own notifications" on public.notifications_sent
  for select using (user_id = auth.uid());
