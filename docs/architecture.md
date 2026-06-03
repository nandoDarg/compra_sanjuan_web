# Arquitectura actual

Ultima actualizacion: Junio 2026.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Storage)
- PostHog (analytics de producto)

## Modelo de acceso

Rutas publicas:

- `/`
- `/post/[id]`

Rutas privadas (requieren sesion):

- `/create-post`
- `/my-posts`
- `/my-posts/[id]/edit`

La proteccion se resuelve en `AppShell` con whitelist de rutas publicas y matcher para rutas dinamicas publicas.

## Estructura de frontend

- `src/app/*`: rutas App Router.
- `src/components/*`: componentes UI y de dominio reutilizables.
- `src/components/ui/*`: componentes atomicos/estados visuales.
- `src/lib/*`: helpers de Supabase e infraestructura cliente.
- `src/lib/analytics/*`: helper de tracking tipado para eventos de producto.

## Datos y storage

- Tabla principal: `public.posts`.
- Tabla de galeria por publicacion: `public.post_images`.
- Tabla relacional para vehiculos: `public.vehicle_details` (1 a 1 con `posts`).
- Bucket de imagenes: `post-images`.
- RLS habilitado para aislamiento por usuario en operaciones de escritura.

## Flujo de imagenes

- Carga local de multiples imagenes desde formulario (maximo 10).
- Compresion cliente para mantener cada imagen en <= 2.5 MB.
- Carga a Supabase Storage (`post-images`) y persistencia de orden en `post_images`.
- En edicion:
	- se pueden quitar imagenes ya persistidas
	- se pueden agregar nuevas imagenes
	- se reconstruye galeria final respetando orden y ownership
- Importacion por URL publica mediante endpoint server-side `src/app/api/import-image/route.ts`.

## Modulo vehiculos

- Deteccion por categoria vehicular para activar seccion tecnica en formulario.
- Persistencia desacoplada en `vehicle_details` para mantener compatibilidad con publicaciones no vehiculares.
- Render de ficha tecnica en detalle publico cuando existen datos asociados.

## Analytics y observabilidad funcional

- `posthog-provider` inicializa cliente analytics en layout global.
- Tracking centralizado en `src/lib/analytics/tracking.ts`.
- Eventos clave:
	- registro/login
	- creacion de publicacion
	- apertura de detalle
	- click WhatsApp
	- compartir
	- busqueda y filtros por categoria

## Principios de diseño activos

- Sencillez tecnica (queries simples Supabase).
- Reutilizacion de componentes.
- Mobile-first real.
- Evitar sobre-ingenieria prematura.

## Estado Android wrapper

- Capacitor configurado sobre la app web desplegada.
- Plataforma Android agregada.
- Pendiente: cerrar pipeline de APK debug por entorno Java/JDK local.
