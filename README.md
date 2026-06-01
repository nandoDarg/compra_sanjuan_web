# tratohechoSJ

Marketplace web construido con Next.js + Supabase.

## Estado actual (Mayo 2026)

- Produccion online y validada con usuarios reales.
- Marketplace publico para exploracion sin login:
	- `/`
	- `/post/[id]`
- Rutas privadas para gestion de publicaciones:
	- `/create-post`
	- `/my-posts`
	- `/my-posts/[id]/edit`
- CRUD de publicaciones funcionando:
	- crear
	- editar
	- eliminar (con confirmacion)
- Contacto simple funcionando:
	- campo `whatsapp_number` en publicaciones
	- boton WhatsApp en detalle
	- boton compartir con Web Share API + fallback copiar enlace
- Deploy de Vercel relinkeado al repo oficial.
- Wrapper Android con Capacitor iniciado (pendiente cerrar build de APK por entorno Java).

## Stack

- Next.js 16 (App Router)
- TypeScript
- Supabase (Auth, Postgres, Storage)

## Flujo local

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
NEXT_PUBLIC_POSTHOG_KEY=<tu-posthog-project-api-key>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Tambien puedes copiar la plantilla base:

```bash
cp .env.example .env.local
```

3. Levantar entorno local:

```bash
npm run dev
```

4. Build de validacion:

```bash
npm run build
```

## Rutas principales

- `/`
- `/post/[id]`
- `/login`
- `/register`
- `/create-post`
- `/my-posts`
- `/my-posts/[id]/edit`

## Deploy

Guia detallada en `docs/deploy-vercel.md`.

## Android wrapper

Este proyecto usa Capacitor como wrapper Android remoto sobre la app desplegada en Vercel.

Comandos utiles:

```bash
npm run cap:add
npm run cap:sync
npm run cap:open
```

El wrapper carga directamente (URL actual en produccion):

`https://comprasanjuanwebvercel.vercel.app`

Estado wrapper Android:

- Configuracion de Capacitor creada.
- Plataforma Android agregada y sincronizada.
- Build APK pendiente de cierre por instalacion/configuracion de JDK en entorno local.

## Source of truth de deploy

El proyecto en Vercel debe estar vinculado al repositorio oficial:

- `nandoDarg/tratohechoSJ`

No usar repositorios espejo para deploy, porque desincronizan rutas/features y generan diferencias entre produccion y `main`.
