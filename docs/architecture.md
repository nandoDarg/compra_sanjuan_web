# Arquitectura actual

Ultima actualizacion: Mayo 2026.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Storage)

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

## Datos y storage

- Tabla principal: `public.posts`.
- Bucket de imagenes: `post-images`.
- RLS habilitado para aislamiento por usuario en operaciones de escritura.

## Principios de diseño activos

- Sencillez tecnica (queries simples Supabase).
- Reutilizacion de componentes.
- Mobile-first real.
- Evitar sobre-ingenieria prematura.

## Estado Android wrapper

- Capacitor configurado sobre la app web desplegada.
- Plataforma Android agregada.
- Pendiente: cerrar pipeline de APK debug por entorno Java/JDK local.
