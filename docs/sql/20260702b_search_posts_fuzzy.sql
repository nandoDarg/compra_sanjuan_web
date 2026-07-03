-- Migration: trigram fuzzy search (Capa 5 del buscador semantico por capas)
-- Date: 2026-07-02

create extension if not exists pg_trgm;

-- Aceleran tanto esta funcion como los ILIKE '%termino%' que ya usa el
-- buscador (Capas 1-4), que hoy hacen sequential scan.
create index if not exists posts_title_trgm_idx
  on public.posts using gin (title gin_trgm_ops);

create index if not exists posts_description_trgm_idx
  on public.posts using gin (description gin_trgm_ops);

-- Nota de escalabilidad: la comparacion usa unaccent(lower(...)) al vuelo,
-- por lo que no aprovecha 100% el indice GIN de arriba (que es sobre la
-- columna cruda). Para un catalogo chico/mediano (marketplace local) esto
-- sigue siendo rapido. Si el catalogo crece mucho, la siguiente optimizacion
-- es crear una columna generada o un indice de expresion sobre
-- unaccent(lower(title)) con una funcion wrapper marcada immutable.
create or replace function public.search_posts_fuzzy(
  search_term text,
  similarity_threshold real default 0.2,
  result_limit integer default 60
)
returns table (post_id uuid, similarity real)
language sql
stable
as $$
  select
    p.id as post_id,
    greatest(
      similarity(unaccent(lower(p.title)), unaccent(lower(search_term))),
      similarity(unaccent(lower(coalesce(p.description, ''))), unaccent(lower(search_term)))
    ) as similarity
  from public.posts p
  where similarity(unaccent(lower(p.title)), unaccent(lower(search_term))) > similarity_threshold
     or similarity(unaccent(lower(coalesce(p.description, ''))), unaccent(lower(search_term))) > similarity_threshold
  order by similarity desc
  limit result_limit;
$$;

revoke all on function public.search_posts_fuzzy(text, real, integer) from public;
grant execute on function public.search_posts_fuzzy(text, real, integer) to anon, authenticated;

comment on function public.search_posts_fuzzy(text, real, integer) is
'Busqueda tolerante a errores tipograficos (Capa 5) via similitud de trigramas sobre title/description. No requiere security definer: posts ya tiene RLS de lectura publica. Se usa como fallback cuando las capas exacta/morfologica/sinonimos no encuentran suficientes resultados.';
