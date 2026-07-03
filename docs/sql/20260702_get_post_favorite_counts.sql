-- Migration: aggregate-only favorite counts RPC for relevance sorting
-- Date: 2026-07-02

create or replace function public.get_post_favorite_counts(post_ids uuid[])
returns table (post_id uuid, favorite_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select f.post_id, count(*)::bigint as favorite_count
  from public.favorites f
  where f.post_id = any(post_ids)
  group by f.post_id;
$$;

revoke all on function public.get_post_favorite_counts(uuid[]) from public;
grant execute on function public.get_post_favorite_counts(uuid[]) to anon, authenticated;

comment on function public.get_post_favorite_counts(uuid[]) is
'Devuelve solo conteos agregados de favoritos por post_id, sin exponer identidad de usuarios que marcaron favorito. Bypassa la RLS owner-only de favorites de forma segura (security definer + solo agregados). Usado para el ordenamiento "Mas relevantes" en el feed.';
