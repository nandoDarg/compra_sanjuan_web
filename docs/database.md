# Supabase - Modulo Publicaciones

Ejecuta este bloque en el SQL Editor de Supabase en este orden.

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
	image_url text,
	created_at timestamptz not null default timezone('utc', now())
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);

alter table public.posts enable row level security;

drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated"
on public.posts for select
to authenticated
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
```

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

## 3) CRUD que ya quedo cableado en frontend

- Crear publicacion: /create-post
- Subida de imagen al bucket: post-images
- Guardado en tabla: posts
- Feed principal: /

No se agrego chat, reputacion, favoritos, pagos ni IA.
