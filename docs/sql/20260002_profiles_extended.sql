-- Extiende public.profiles con campos para configuracion avanzada de cuenta.
-- Mantiene compatibilidad legacy y evita cambios en RLS/politicas.

alter table public.profiles
add column if not exists display_name text,
add column if not exists first_name text,
add column if not exists last_name text,
add column if not exists dni text,
add column if not exists phone text,
add column if not exists show_phone boolean not null default true,
add column if not exists address_street text,
add column if not exists locality text,
add column if not exists email text;

-- Compatibilidad: si la base no tiene columnas legacy, se crean para evitar
-- errores durante los pasos de sincronizacion temporal.
alter table public.profiles
add column if not exists full_name text,
add column if not exists whatsapp_number text,
add column if not exists domicile text,
add column if not exists recovery_email text;

-- Backfill no destructivo desde columnas existentes.
update public.profiles
set
  display_name = coalesce(nullif(trim(display_name), ''), nullif(trim(full_name), ''), 'Usuario'),
  first_name = coalesce(nullif(trim(first_name), ''), split_part(coalesce(nullif(trim(full_name), ''), ''), ' ', 1)),
  last_name = coalesce(
    nullif(trim(last_name), ''),
    nullif(trim(replace(coalesce(nullif(trim(full_name), ''), ''), split_part(coalesce(nullif(trim(full_name), ''), ''), ' ', 1), '')), '')
  ),
  phone = coalesce(nullif(trim(phone), ''), nullif(trim(whatsapp_number), '')),
  address_street = coalesce(nullif(trim(address_street), ''), nullif(trim(domicile), '')),
  email = coalesce(nullif(trim(email), ''), nullif(trim(recovery_email), '')),
  show_phone = coalesce(show_phone, true)
where true;

-- Sincronizacion inicial legacy -> nuevo y nuevo -> legacy para minimizar regresiones.
update public.profiles
set
  full_name = coalesce(nullif(trim(full_name), ''), nullif(trim(concat_ws(' ', first_name, last_name)), ''), nullif(trim(display_name), ''), 'Usuario'),
  whatsapp_number = coalesce(nullif(trim(whatsapp_number), ''), nullif(trim(phone), ''), ''),
  domicile = coalesce(nullif(trim(domicile), ''), nullif(trim(address_street), ''), '')
where true;

-- Garantiza un display_name valido para filas existentes.
update public.profiles
set display_name = 'Usuario'
where display_name is null or char_length(trim(display_name)) = 0;
