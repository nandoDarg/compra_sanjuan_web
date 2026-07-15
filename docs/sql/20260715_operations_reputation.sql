-- Migration: reputacion bidireccional (operaciones + calificaciones)
-- Date: 2026-07-15

-- ─── Tabla operations ────────────────────────────────────────────────────────
-- Una fila = "posible operacion" entre un comprador y un vendedor sobre una
-- publicacion puntual. Se crea al presionar "Contactar por WhatsApp" (siempre
-- que el comprador este logueado). NO significa que la venta se concreto.

create table if not exists public.operations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'closed', 'expired')),
  buyer_confirmed boolean,
  seller_confirmed boolean,
  buyer_confirmed_at timestamptz,
  seller_confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint operations_buyer_seller_distinct check (buyer_id <> seller_id),
  constraint operations_buyer_post_unique unique (buyer_id, post_id)
);

create index if not exists operations_buyer_id_idx on public.operations (buyer_id);
create index if not exists operations_seller_id_idx on public.operations (seller_id);
create index if not exists operations_post_id_idx on public.operations (post_id);
create index if not exists operations_status_created_at_idx on public.operations (status, created_at);

create or replace function public.set_operations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_operations_updated_at on public.operations;
create trigger trg_operations_updated_at
before update on public.operations
for each row
execute function public.set_operations_updated_at();

alter table public.operations enable row level security;

-- Solo comprador y vendedor de esa operacion pueden verla.
drop policy if exists "operations_select_participants" on public.operations;
create policy "operations_select_participants"
on public.operations for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Solo el comprador puede crear el registro inicial (se hace al contactar).
drop policy if exists "operations_insert_buyer" on public.operations;
create policy "operations_insert_buyer"
on public.operations for insert
to authenticated
with check (auth.uid() = buyer_id);

-- Sin policy de update: las confirmaciones se escriben unicamente a traves
-- de confirm_operation() (security definer), nunca con un update directo del
-- cliente. RLS no puede restringir "que columna" se actualiza, asi que la
-- maquina de estados vive en la funcion, no en una policy.

comment on table public.operations is
'Posibles operaciones de compraventa entre dos usuarios sobre una publicacion. Se crean al contactar por WhatsApp; solo pasan a "confirmed" cuando ambas partes lo confirman via confirm_operation().';

-- ─── Tabla operation_ratings ─────────────────────────────────────────────────
-- Una fila = la calificacion que un participante le da al otro, por una
-- operacion ya confirmada. Publica (comentario incluido) una vez enviada.

create table if not exists public.operation_ratings (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.operations(id) on delete cascade,
  rater_id uuid not null references auth.users(id) on delete cascade,
  ratee_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('buyer_to_seller', 'seller_to_buyer')),
  overall_rating smallint not null check (overall_rating between 1 and 5),
  aspect_communication smallint not null check (aspect_communication between 1 and 5),
  aspect_two smallint not null check (aspect_two between 1 and 5),
  aspect_three smallint not null check (aspect_three between 1 and 5),
  comment text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint operation_ratings_unique unique (operation_id, rater_id)
);

create index if not exists operation_ratings_ratee_id_idx on public.operation_ratings (ratee_id);
create index if not exists operation_ratings_operation_id_idx on public.operation_ratings (operation_id);

alter table public.operation_ratings enable row level security;

-- Publica: los comentarios y calificaciones se muestran en el perfil de
-- quien fue calificado, visibles para cualquiera (decision de producto).
drop policy if exists "operation_ratings_select_public" on public.operation_ratings;
create policy "operation_ratings_select_public"
on public.operation_ratings for select
to public
using (true);

-- Solo un participante de una operacion ya CONFIRMADA puede calificar a su
-- contraparte (no a si mismo, no a un tercero, no antes de confirmar).
drop policy if exists "operation_ratings_insert_participant" on public.operation_ratings;
create policy "operation_ratings_insert_participant"
on public.operation_ratings for insert
to authenticated
with check (
  auth.uid() = rater_id
  and exists (
    select 1 from public.operations o
    where o.id = operation_id
      and o.status = 'confirmed'
      and (
        (auth.uid() = o.buyer_id and ratee_id = o.seller_id and role = 'buyer_to_seller')
        or
        (auth.uid() = o.seller_id and ratee_id = o.buyer_id and role = 'seller_to_buyer')
      )
  )
);

-- Sin policy de update/delete: una calificacion enviada es inmutable (mismo
-- criterio que la tabla feedback).

comment on table public.operation_ratings is
'Calificaciones mutuas entre comprador y vendedor de una operacion confirmada. Publicas (promedio, cantidad y comentario) en el perfil de quien fue calificado. Una unica calificacion por usuario y operacion (constraint operation_ratings_unique).';

-- ─── Funcion: confirmar operacion ───────────────────────────────────────────
-- Toda la maquina de estados vive aca (security definer) porque RLS no puede
-- restringir que columna se actualiza: sin esto, cualquiera de las dos partes
-- podria en teoria pisar la respuesta de la otra con un update directo.

create or replace function public.confirm_operation(operation_id uuid, confirmed boolean)
returns public.operations
language plpgsql
security definer
set search_path = public
as $$
declare
  op public.operations;
  caller uuid := auth.uid();
begin
  select * into op from public.operations where id = operation_id for update;

  if op.id is null then
    raise exception 'Operacion no encontrada';
  end if;

  if caller is null or (caller <> op.buyer_id and caller <> op.seller_id) then
    raise exception 'No autorizado para confirmar esta operacion';
  end if;

  if op.status <> 'pending' then
    return op;
  end if;

  if caller = op.buyer_id then
    update public.operations
    set buyer_confirmed = confirmed, buyer_confirmed_at = timezone('utc', now())
    where id = operation_id
    returning * into op;
  else
    update public.operations
    set seller_confirmed = confirmed, seller_confirmed_at = timezone('utc', now())
    where id = operation_id
    returning * into op;
  end if;

  if confirmed = false then
    update public.operations set status = 'closed' where id = operation_id returning * into op;
  elsif op.buyer_confirmed = true and op.seller_confirmed = true then
    update public.operations set status = 'confirmed' where id = operation_id returning * into op;
  end if;

  return op;
end;
$$;

revoke all on function public.confirm_operation(uuid, boolean) from public;
grant execute on function public.confirm_operation(uuid, boolean) to authenticated;

comment on function public.confirm_operation(uuid, boolean) is
'Registra la confirmacion (si/no) de comprador o vendedor sobre una operacion pendiente y recalcula su estado (confirmed si ambas partes dicen que si, closed si alguna dice que no). Unico camino permitido para modificar confirmaciones -- no hay policy de update directa sobre operations.';

-- ─── Funcion: expirar operaciones sin resolver ──────────────────────────────
-- Sin cron/Edge Functions en este proyecto: se llama de forma perezosa al
-- principio de la consulta que trae "mis operaciones pendientes", asi el
-- estado se corrige justo cuando alguna de las partes vuelve a abrir la app.
-- Mantener el intervalo sincronizado con OPERATION_EXPIRATION_DAYS en
-- src/lib/reputation-config.ts.

create or replace function public.expire_stale_operations()
returns void
language sql
security definer
set search_path = public
as $$
  update public.operations
  set status = 'expired'
  where status = 'pending'
    and created_at < timezone('utc', now()) - interval '15 days';
$$;

revoke all on function public.expire_stale_operations() from public;
grant execute on function public.expire_stale_operations() to authenticated;

comment on function public.expire_stale_operations() is
'Marca como expired las operaciones pendientes de mas de 15 dias sin resolverse. Se invoca de forma perezosa (no hay cron) cada vez que un usuario consulta sus operaciones pendientes.';

-- ─── Funcion: reputacion agregada por perfil ────────────────────────────────
-- No requiere security definer: operation_ratings ya es de lectura publica.
-- Mismo patron de agregados en batch que get_post_favorite_counts.

create or replace function public.get_profile_reputation(user_ids uuid[])
returns table (user_id uuid, average_rating numeric, ratings_count bigint)
language sql
stable
set search_path = public
as $$
  select
    r.ratee_id as user_id,
    round(avg(r.overall_rating)::numeric, 2) as average_rating,
    count(*)::bigint as ratings_count
  from public.operation_ratings r
  where r.ratee_id = any(user_ids)
  group by r.ratee_id;
$$;

revoke all on function public.get_profile_reputation(uuid[]) from public;
grant execute on function public.get_profile_reputation(uuid[]) to anon, authenticated;

comment on function public.get_profile_reputation(uuid[]) is
'Devuelve promedio y cantidad de calificaciones recibidas por cada user_id solicitado. Agregado en batch, mismo patron que get_post_favorite_counts.';
