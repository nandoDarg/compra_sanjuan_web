# Features implementadas

Ultima actualizacion: 2026-07-20.

## Marketplace publico

- Feed de publicaciones publico (`/`).
- Vista detalle publica (`/post/[id]`).
- Busqueda por texto con fallback para evitar resultado vacio.
- Busqueda fuzzy + expansion semantica de sinonimos, incluyendo expansion conceptual marca/modelo → categoria (ej. "celu" encuentra iPhone/Samsung, "camioneta" encuentra Hilux/Ranger) (cliente/API layer antes de query Supabase).
- Filtros por categoria y orden.
- Filtros jerarquicos por categoria principal, subcategoria y subcategoria terciaria (mobile y desktop, con paridad de drill-down entre ambos).
- Related posts por categoria en detalle.
- Sugerencias y ranking local por historial/interacciones en busqueda.
- Favoritos (`/favoritos`), con conteo agregado publico via RPC `get_post_favorite_counts` (RLS de `favorites` es owner-only, el conteo se expone sin filtrar por usuario).

## Autenticacion

- Registro y login con Supabase Auth.
- Navbar dinamica por estado de sesion.
- Login mejorado: mostrar/ocultar password, submit con Enter y errores inline.

## Publicaciones (usuario autenticado)

- Crear publicacion (`/create-post`).
- Subida de multiples imagenes a Supabase Storage (`post-images`).
- Mis publicaciones (`/my-posts`).
- Editar publicacion (`/my-posts/[id]/edit`).
- Eliminar publicacion con confirmacion.
- Edicion con eliminacion de imagenes ya persistidas.
- Limites de imagen:
	- maximo 10 imagenes por publicacion
	- maximo 2.5 MB por imagen luego de compresion cliente
- Importacion de imagen por URL/Google Drive (enlace publico) via API `import-image`.
- UX de imagenes simplificada tipo marketplace:
	- miniaturas en grilla
	- boton de cierre para quitar en un click
- Editor de recorte libre estilo galeria nativa Android/iOS (marco redimensionable arrastrando bordes/esquinas, imagen fija, zoom/pan multitactil, selector Libre/1:1/Original), se abre automaticamente al agregar cada foto — en rama `feature/editor-recorte-libre-imagenes`, pendiente de mergear a `main`.

## Modulo de vehiculos

- Categorias vehiculares dedicadas:
	- Autos
	- Camionetas
	- Motos
	- Camiones
	- Utilitarios
- Ficha tecnica condicional por categoria (create/edit):
	- marca, modelo, anio, kilometraje
	- combustible, transmision, condicion
	- primer duenio
- Render de ficha tecnica en detalle publico de publicacion.
- Persistencia en tabla relacional `vehicle_details` (1 a 1 con `posts`).
- Mensaje de error explicito cuando falta la tabla `vehicle_details` en Supabase.

## Datos y normalizacion

- Tabla principal: `posts`.
- Tabla de galeria: `post_images`.
- Tabla de vehiculos: `vehicle_details`.
- Columna adicional: `posts.subcategory` (migracion SQL dedicada).
- Taxonomia jerarquica local (arbol) y normalizacion de categorias legacy a `categoria > subcategoria`.
- Compatibilidad hacia atras cuando `subcategory` aun no existe en BD.

## Taxonomia jerarquica

- Categoria principal visible en sidebar.
- Subcategorias desplegables por categoria (toggle abrir/cerrar con segundo click).
- Formulario create/edit con seleccion obligatoria de categoria principal y subcategoria.
- Feed y detalle muestran ruta `Categoria > Subcategoria` cuando existe.

## Contacto y conversion

- Campo `whatsapp_number` por publicacion.
- Boton WhatsApp en detalle con mensaje precargado. Requiere login (redirige a `/login?next=...` si no hay sesion).
- Boton compartir con Web Share API y fallback a copiar URL.

## Reputacion bidireccional comprador/vendedor

- Al contactar por WhatsApp se crea una "operacion" (`public.operations`) entre comprador y vendedor.
- A partir de los 5 dias del contacto, cualquiera de las dos partes puede confirmar desde `/mis-operaciones` que la operacion se concreto. Recien cuando ambas confirman, la operacion queda habilitada para calificar.
- Calificacion: 1-5 estrellas + 3 aspectos + comentario opcional, publico y visible en el perfil del calificado.
- Promedio y conteo de calificaciones visibles en el detalle de cada publicacion del vendedor.
- Operaciones sin resolver expiran automaticamente a los 15 dias.
- Archivos: `src/lib/operations.ts`, `src/lib/reputation-config.ts`, `src/app/mis-operaciones/page.tsx`. SQL: `docs/sql/20260715_operations_reputation.sql`.

## Analytics

- Integracion de PostHog a nivel aplicacion.
- Eventos clave instrumentados:
	- registro exitoso
	- login exitoso
	- publicacion creada
	- detalle abierto
	- click WhatsApp
	- compartir publicacion
	- busqueda
	- seleccion de categoria

## UX/UI

- Mobile first.
- Cards reutilizables.
- Skeletons y estados vacios.
- Diseño moderno tipo marketplace.

## No implementado (intencionalmente)

- Chat interno.
- Realtime.
- Notificaciones.
- Pagos.
- IA.
