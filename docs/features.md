# Features implementadas

Ultima actualizacion: Junio 2026.

## Marketplace publico

- Feed de publicaciones publico (`/`).
- Vista detalle publica (`/post/[id]`).
- Busqueda por texto con fallback para evitar resultado vacio.
- Busqueda fuzzy + expansion semantica de sinonimos (cliente/API layer antes de query Supabase).
- Filtros por categoria y orden.
- Filtros jerarquicos por categoria principal y subcategoria (mobile y desktop).
- Related posts por categoria en detalle.
- Sugerencias y ranking local por historial/interacciones en busqueda.

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
- Boton WhatsApp en detalle con mensaje precargado.
- Boton compartir con Web Share API y fallback a copiar URL.

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
- Reputacion.
- Pagos.
- IA.
