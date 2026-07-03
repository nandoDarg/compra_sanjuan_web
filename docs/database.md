# Supabase - Modulo Publicaciones

Ultima actualizacion: Junio 2026.

Ejecuta este bloque en el SQL Editor de Supabase en este orden.

## Nota importante

Si aparece el error `42P01: relation \"public.posts\" does not exist`, ejecuta el bloque completo desde esta guia empezando por `create table if not exists public.posts`.
No ejecutar `alter table` aislado si la tabla aun no fue creada.

## 1) Tabla posts

```sql
create extension if not exists pgcrypto;

create table if not exists public.posts (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	title text not null,
	description text not null,
	price numeric(12,2) not null check (price >= 0),
	category text not null,
	whatsapp_number text,
	location_department text,
	location_maps_url text,
	image_url text,
	created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.post_images (
	id uuid primary key default gen_random_uuid(),
	post_id uuid not null references public.posts(id) on delete cascade,
	image_url text not null,
	position integer not null default 1,
	created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vehicle_details (
	id uuid primary key default gen_random_uuid(),
	post_id uuid not null unique references public.posts(id) on delete cascade,
	brand text not null,
	model text not null,
	year integer not null,
	mileage integer not null default 0,
	fuel_type text not null,
	transmission text not null,
	condition text not null,
	first_owner boolean not null default false,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_vehicle_details_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = timezone('utc', now());
	return new;
end;
$$;

drop trigger if exists trg_vehicle_details_updated_at on public.vehicle_details;
create trigger trg_vehicle_details_updated_at
before update on public.vehicle_details
for each row
execute function public.set_vehicle_details_updated_at();

alter table public.posts
add column if not exists whatsapp_number text;

alter table public.posts
add column if not exists location_department text;

alter table public.posts
add column if not exists location_maps_url text;

alter table public.posts
add column if not exists subcategory text;

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists posts_category_subcategory_idx on public.posts (category, subcategory);
create index if not exists post_images_post_id_idx on public.post_images (post_id, position);
create index if not exists vehicle_details_post_id_idx on public.vehicle_details (post_id);

alter table public.posts enable row level security;
alter table public.post_images enable row level security;
alter table public.vehicle_details enable row level security;

drop policy if exists "posts_select_authenticated" on public.posts;
drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
on public.posts for select
to public
using (true);

drop policy if exists "posts_insert_own_user" on public.posts;
create policy "posts_insert_own_user"
on public.posts for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "posts_update_own_user" on public.posts;
create policy "posts_update_own_user"
on public.posts for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "posts_delete_own_user" on public.posts;
create policy "posts_delete_own_user"
on public.posts for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "post_images_select_public" on public.post_images;
create policy "post_images_select_public"
on public.post_images for select
to public
using (true);

drop policy if exists "post_images_insert_owner" on public.post_images;
create policy "post_images_insert_owner"
on public.post_images for insert
to authenticated
with check (
	exists (
		select 1
		from public.posts p
		where p.id = post_id
		and p.user_id = auth.uid()
	)
);

drop policy if exists "post_images_update_owner" on public.post_images;
create policy "post_images_update_owner"
on public.post_images for update
to authenticated
using (
	exists (
		select 1
		from public.posts p
		where p.id = post_id
		and p.user_id = auth.uid()
	)
)
with check (
	exists (
		select 1
		from public.posts p
		where p.id = post_id
		and p.user_id = auth.uid()
	)
);

drop policy if exists "post_images_delete_owner" on public.post_images;
create policy "post_images_delete_owner"
on public.post_images for delete
to authenticated
using (
	exists (
		select 1
		from public.posts p
		where p.id = post_id
		and p.user_id = auth.uid()
	)
);

drop policy if exists "vehicle_details_select_public" on public.vehicle_details;
create policy "vehicle_details_select_public"
on public.vehicle_details for select
to public
using (true);

drop policy if exists "vehicle_details_insert_owner" on public.vehicle_details;
create policy "vehicle_details_insert_owner"
on public.vehicle_details for insert
to authenticated
with check (
	exists (
		select 1
		from public.posts p
		where p.id = post_id
		and p.user_id = auth.uid()
	)
);

drop policy if exists "vehicle_details_update_owner" on public.vehicle_details;
create policy "vehicle_details_update_owner"
on public.vehicle_details for update
to authenticated
using (
	exists (
		select 1
		from public.posts p
		where p.id = post_id
		and p.user_id = auth.uid()
	)
)
with check (
	exists (
		select 1
		from public.posts p
		where p.id = post_id
		and p.user_id = auth.uid()
	)
);

drop policy if exists "vehicle_details_delete_owner" on public.vehicle_details;
create policy "vehicle_details_delete_owner"
on public.vehicle_details for delete
to authenticated
using (
	exists (
		select 1
		from public.posts p
		where p.id = post_id
		and p.user_id = auth.uid()
	)
);
```

### Pasos exactos en Supabase (obligatorio para vehiculos)

1. Abre SQL Editor en Supabase.
2. Ejecuta el bloque completo de la seccion **1) Tabla posts** (incluye `vehicle_details`).
3. Si usas entorno existente, verifica que ya exista `post_images`; no la elimines.
4. Publica cambios y valida que no haya errores.
5. Prueba crear una publicacion en categoria `Autos`, `Camionetas`, `Motos`, `Camiones` o `Utilitarios`.
6. Verifica en tabla `vehicle_details` que se guarde un registro con `post_id` de la publicacion.

## 2) Bucket de imagenes

Nombre: post-images
Visibilidad: publico

```sql
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "post_images_public_read" on storage.objects;
create policy "post_images_public_read"
on storage.objects for select
to public
using (bucket_id = 'post-images');

drop policy if exists "post_images_auth_upload" on storage.objects;
create policy "post_images_auth_upload"
on storage.objects for insert
to authenticated
with check (
	bucket_id = 'post-images'
	and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "post_images_auth_update" on storage.objects;
create policy "post_images_auth_update"
on storage.objects for update
to authenticated
using (
	bucket_id = 'post-images'
	and owner = auth.uid()
)
with check (
	bucket_id = 'post-images'
	and owner = auth.uid()
);

drop policy if exists "post_images_auth_delete" on storage.objects;
create policy "post_images_auth_delete"
on storage.objects for delete
to authenticated
using (
	bucket_id = 'post-images'
	and owner = auth.uid()
);
```

## 3) Perfil publico de usuario (display_name)

Para ocultar identificadores internos y mostrar nombre publico del vendedor, ejecutar:

- `docs/sql/20260604_profiles_display_name.sql`

Esta migracion:

- crea `public.profiles` con `display_name` obligatorio
- agrega trigger en `auth.users` para crear/sincronizar perfil al registrarse
- habilita RLS y politicas para lectura publica y edicion del propio usuario
- hace backfill de usuarios existentes con fallback `Usuario`

## 3b) Conteo de favoritos para ordenamiento por relevancia

`favorites` tiene RLS owner-only (cada usuario solo lee sus propios favoritos), asi que no hay forma de contar favoritos por publicacion de forma publica. Para el ordenamiento "Mas relevantes" del feed se agrego:

- `docs/sql/20260702_get_post_favorite_counts.sql`

Esta migracion crea `public.get_post_favorite_counts(post_ids uuid[])`, una funcion `security definer` que devuelve solo `post_id` + conteo agregado (nunca expone que usuario marco favorito), otorgada a `anon` y `authenticated`. Se llama desde el cliente con `supabase.rpc('get_post_favorite_counts', { post_ids: [...] })`.

## 3c) Busqueda semantica por capas (Capa 5: fuzzy/trigramas)

El buscador (`src/lib/search/expand-query.ts`) combina 4 capas en JS (coincidencia exacta por palabra, variantes de singular/plural/diminutivo en `src/lib/search/stem.ts`, y sinonimos via `SYNONYM_MAP`). Para tolerar errores de tipeo sobre palabras que no estan en el diccionario de sinonimos (ej. "retriver" en vez de "retriever"), se agrego:

- `docs/sql/20260702b_search_posts_fuzzy.sql`

Esta migracion instala `pg_trgm`, crea indices GIN de trigramas en `posts.title` y `posts.description`, y define `public.search_posts_fuzzy(search_term, similarity_threshold, result_limit)`, que devuelve `post_id` + `similarity` ordenado por similitud. Se usa desde `src/app/page.tsx` (`runFuzzySearch`) como capa adicional dentro del fallback de "0 resultados", antes de caer al ranking por historial/recencia.

## 4) CRUD que ya quedo cableado en frontend

- Crear publicacion: /create-post
- Subida de imagenes al bucket: post-images
- Guardado en tabla: posts
- Ubicacion por publicacion: location_department + location_maps_url
- Imagenes extra por publicacion: post_images
- Datos tecnicos de vehiculos: vehicle_details
- Feed principal: /

## 5) SQL de migracion puntual (solo ubicacion)

Si solo necesitas agregar ubicacion en un entorno ya existente, ejecuta:

```sql
alter table public.posts
add column if not exists location_department text;

alter table public.posts
add column if not exists location_maps_url text;
```

## 6) SQL de migracion para categorias jerarquicas

Para habilitar `subcategory` y migrar publicaciones existentes de categoria plana a `categoria > subcategoria`, ejecutar:

- `docs/sql/20260609_posts_subcategory.sql`

Notas:

- No requiere cambios en funciones Supabase ni paquetes externos.
- Mantiene compatibilidad con publicaciones existentes.
- Crea indice compuesto `posts_category_subcategory_idx` para filtros.

## 7) SQL de correccion para feed publico (sin login)

Si los usuarios anonimos no ven publicaciones en `/`, ejecuta:

```sql
alter table public.posts enable row level security;

drop policy if exists "posts_select_authenticated" on public.posts;
drop policy if exists "posts_select_public" on public.posts;

create policy "posts_select_public"
on public.posts for select
to public
using (true);
```

No se agrego chat, reputacion, favoritos, pagos ni IA.
