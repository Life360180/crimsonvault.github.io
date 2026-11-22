-- Crimson Vault: run this whole file once in Supabase -> SQL Editor -> New query -> Run.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  val bigint not null default 0,
  uniq int not null default 0,
  opened int not null default 0,
  best int not null default -1,
  bid int not null default 0,
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_name_key on profiles (lower(name));

create table if not exists player_data (
  id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists inbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  msg jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from admins where id = auth.uid());
$$;

-- Counts one more "everyone gets a gift" drop (gift, shower, admincard, hacker). Admins only.
create or replace function bump_drop(k text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  insert into config (key, value) values ('drops', jsonb_build_object(k, 1))
  on conflict (key) do update
    set value = jsonb_set(config.value, array[k], to_jsonb(coalesce((config.value ->> k)::int, 0) + 1)),
        updated_at = now();
end $$;
revoke all on function bump_drop(text) from public, anon;
grant execute on function bump_drop(text) to authenticated;

alter table profiles    enable row level security;
alter table player_data enable row level security;
alter table admins      enable row level security;
alter table config      enable row level security;
alter table inbox       enable row level security;

create policy "profiles readable by players" on profiles for select to authenticated using (true);
create policy "profiles insert own"          on profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own"          on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "player_data select own" on player_data for select to authenticated using (id = auth.uid());
create policy "player_data insert own" on player_data for insert to authenticated with check (id = auth.uid());
create policy "player_data update own" on player_data for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "admins see own row" on admins for select to authenticated using (id = auth.uid());

create policy "config readable by players" on config for select to authenticated using (true);
create policy "config written by admins"   on config for all    to authenticated using (is_admin()) with check (is_admin());

create policy "inbox read own"       on inbox for select to authenticated using (user_id = auth.uid());
create policy "inbox delete own"     on inbox for delete to authenticated using (user_id = auth.uid());
create policy "inbox insert by admin" on inbox for insert to authenticated with check (is_admin());

-- Live updates (events, gifts, admin messages reach everyone instantly).
alter publication supabase_realtime add table config;
alter publication supabase_realtime add table inbox;
