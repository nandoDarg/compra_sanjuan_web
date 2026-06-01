# Features implementadas

Ultima actualizacion: Mayo 2026.

## Marketplace publico

- Feed de publicaciones publico (`/`).
- Vista detalle publica (`/post/[id]`).
- Busqueda por texto.
- Filtros por categoria y orden.
- Related posts por categoria en detalle.

## Autenticacion

- Registro y login con Supabase Auth.
- Navbar dinamica por estado de sesion.

## Publicaciones (usuario autenticado)

- Crear publicacion (`/create-post`).
- Subida de imagen a Supabase Storage (`post-images`).
- Mis publicaciones (`/my-posts`).
- Editar publicacion (`/my-posts/[id]/edit`).
- Eliminar publicacion con confirmacion.

## Contacto y conversion

- Campo `whatsapp_number` por publicacion.
- Boton WhatsApp en detalle con mensaje precargado.
- Boton compartir con Web Share API y fallback a copiar URL.

## UX/UI

- Mobile first.
- Cards reutilizables.
- Skeletons y estados vacios.
- Diseño moderno tipo marketplace.

## No implementado (intencionalmente)

- Chat interno.
- Realtime.
- Notificaciones.
- Reputacion.
- Pagos.
- IA.
