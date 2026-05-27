# Compra San Juan Web

Marketplace web construido con Next.js + Supabase.

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
- `/login`
- `/register`
- `/create-post`
- `/my-posts`
- `/my-posts/[id]/edit`

## Deploy

Guia detallada en `docs/deploy-vercel.md`.

## Source of truth de deploy

El proyecto en Vercel debe estar vinculado al repositorio oficial:

- `nandoDarg/compra_sanjuan_web`

No usar repositorios espejo para deploy, porque desincronizan rutas/features y generan diferencias entre produccion y `main`.
