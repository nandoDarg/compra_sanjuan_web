-- Añade la tabla y los campos obligatorios del perfil de usuario.
-- Ejecutar en Supabase SQL Editor.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  full_name text,
  whatsapp_number text,
  domicile text,
  recovery_email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
add column if not exists full_name text,
add column if not exists whatsapp_number text,
add column if not exists domicile text,
add column if not exists recovery_email text,
add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.profiles
set
  full_name = coalesce(nullif(trim(full_name), ''), display_name, 'Usuario'),
  whatsapp_number = coalesce(nullif(trim(whatsapp_number), ''), ''),
  domicile = coalesce(nullif(trim(domicile), ''), ''),
  recovery_email = coalesce(nullif(trim(recovery_email), ''), '')
where full_name is null or whatsapp_number is null or domicile is null or recovery_email is null;

alter table public.profiles
alter column full_name set not null,
alter column whatsapp_number set not null,
alter column domicile set not null,
alter column recovery_email set not null;

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

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Indice unico parcial: muchos perfiles existentes quedan con
-- recovery_email = '' tras la normalizacion de arriba (nunca lo cargaron),
-- y un indice unico comun los rechaza a todos entre si. Solo exige unicidad
-- cuando el valor es un email real.
create unique index if not exists profiles_recovery_email_key
on public.profiles (recovery_email)
where recovery_email <> '';
