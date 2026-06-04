-- Migration: public profiles with display_name
-- Date: 2026-06-04

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_display_name_length_check
    check (char_length(trim(display_name)) between 3 and 40)
);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_display_name text;
begin
  raw_display_name := coalesce(trim(new.raw_user_meta_data ->> 'display_name'), '');

  if char_length(raw_display_name) < 3 or char_length(raw_display_name) > 40 then
    raw_display_name := 'Usuario';
  end if;

  insert into public.profiles (user_id, display_name)
  values (new.id, raw_display_name)
  on conflict (user_id) do update
  set display_name = excluded.display_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.profiles (user_id, display_name)
select
  u.id,
  case
    when char_length(trim(coalesce(u.raw_user_meta_data ->> 'display_name', ''))) between 3 and 40
      then trim(u.raw_user_meta_data ->> 'display_name')
    else 'Usuario'
  end as display_name
from auth.users u
on conflict (user_id) do update
set display_name = excluded.display_name;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
on public.profiles for select
to public
using (true);

drop policy if exists "profiles_insert_own_user" on public.profiles;
create policy "profiles_insert_own_user"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own_user" on public.profiles;
create policy "profiles_update_own_user"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
