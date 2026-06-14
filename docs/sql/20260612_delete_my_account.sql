-- Migration: authenticated self-service account deletion
-- Date: 2026-06-12

create or replace function public.delete_my_account_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  deleted_posts_count integer := 0;
  deleted_profile_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'delete_my_account_data requiere una sesion autenticada';
  end if;

  -- Orden auditado:
  -- 1) posts primero, para que ON DELETE CASCADE limpie post_images y vehicle_details en la misma transaccion.
  -- 2) profiles despues, ya sin dependencias colgantes en tablas de negocio.
  -- 3) auth.users y Storage se resuelven fuera de PostgreSQL desde el backend seguro.
  with deleted_posts as (
    delete from public.posts
    where user_id = current_user_id
    returning id
  )
  select count(*) into deleted_posts_count
  from deleted_posts;

  delete from public.profiles
  where user_id = current_user_id;

  get diagnostics deleted_profile_count = row_count;

  return jsonb_build_object(
    'user_id', current_user_id,
    'deleted_posts', deleted_posts_count,
    'deleted_profile', deleted_profile_count > 0
  );
end;
$$;

revoke all on function public.delete_my_account_data() from public;
grant execute on function public.delete_my_account_data() to authenticated;

comment on function public.delete_my_account_data() is
'Borra los datos relacionales del usuario autenticado en una transaccion. Riesgo residual: Storage y auth.users se limpian fuera de PostgreSQL y no comparten rollback con esta funcion.';