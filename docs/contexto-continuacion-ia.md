# Contexto de continuidad IA

Ultima actualizacion: 2026-07-20
Proyecto: compra_sanjuan_web (tratohechoSJ)

## Como se trabaja en este repo (leer primero)

- **Flujo de ramas activo desde julio 2026**: nada se commitea directo a `main` salvo fixes ya probados y de bajo riesgo. Features nuevas o riesgosas van en `feature/<nombre>` desde `main` actualizado, se prueban en el Preview Deployment de Vercel, y se mergean via Pull Request en GitHub. Ver seccion "Flujo de ramas y Pull Requests" en `README.md`.
- **Migraciones SQL**: ya no se aplican solo copiando/pegando a mano. Metodo preferido: `npm run db:migrate:status` (lista pendientes sin tocar la base) y `npm run db:migrate` (las aplica, requiere `SUPABASE_DB_URL` en `.env.local` — conexion via Session Pooler de Supabase, no la conexion directa, que es IPv6-only y falla en esta red). Detalle en `docs/database.md`.
- **Memoria persistente**: el agente IA tiene memoria entre sesiones (`~/.claude/.../memory/`). Si algo relevante para el largo plazo surge (preferencias del usuario, decisiones de producto, contexto de proyecto), ya deberia estar guardado ahi ademas de en este doc.

## Estado del repositorio (2026-07-20)

- `main` (origin al dia) incluye: sistema de reputacion bidireccional, herramienta de migraciones SQL, fix `middleware.ts` → `proxy.ts` (Next.js 16), drill-down de subcategorias mobile, expansion conceptual del buscador. Ultimo commit: `c7e5cc1` (merge de PR #1).
- Rama abierta sin mergear: **`feature/editor-recorte-libre-imagenes`** (commit `564b785`, pusheada). Ver seccion siguiente.
- Ramas de trabajo ya mergeadas a `main` (se pueden borrar si no se van a reusar): `feature/reputacion-bidireccional`, `feature/migraciones-sql-semiautomaticas`.
- Hay una rama `agents/refactor-category-navigation-to-params` en el remoto de origen desconocido para esta sesion (no fue creada por el asistente en las sesiones documentadas aca) — revisar de que se trata antes de tocarla o borrarla.
- Archivo suelto sin trackear en el repo: `docs/correo_gmail_tratohechosj.png` (no relacionado a ningun trabajo de este agente, dejarlo como esta salvo indicacion contraria del usuario).

## Sesion 2026-07-14 a 2026-07-20: Reputacion, migraciones SQL, editor de imagenes

### 1) Sistema de reputacion bidireccional comprador/vendedor (en `main`)

Spec completa implementada: al contactar por WhatsApp se crea una "operacion" (`public.operations`), a los 5 dias se puede pedir confirmacion mutua (comprador y vendedor confirman independientemente), y una vez confirmada ambas partes pueden calificarse (1-5 estrellas + 3 aspectos + comentario opcional publico).

- Requiere login antes de contactar por WhatsApp (cambio de comportamiento respecto a antes, confirmado con el usuario).
- SQL: `docs/sql/20260715_operations_reputation.sql` (tablas `operations`/`operation_ratings`, RPCs `confirm_operation`, `expire_stale_operations`, `get_profile_reputation`) — **ya aplicada** en la base real via `npm run db:migrate`.
- Archivos clave: `src/lib/operations.ts`, `src/lib/reputation-config.ts`, `src/lib/use-pending-operations.ts`, `src/components/ui/star-rating.tsx`, `src/components/ui/operation-card.tsx`, `src/app/mis-operaciones/page.tsx`.
- Integrado en navbar (badge de pendientes) y en `src/app/post/[id]/page.tsx` (rating del vendedor + gate de login en el boton de WhatsApp).
- Documentado en `docs/database.md` seccion "3d".
- **Verificado end-to-end** con dos cuentas de seed reales (contacto → confirmacion mutua → calificacion → reflejo del promedio en la publicacion).

### 2) Herramienta semi-automatica de migraciones SQL (en `main`)

- `npm run db:migrate` / `npm run db:migrate:status`, script en `scripts/db/migrate.ts`, tabla de control `public._migrations` en la base.
- Requiere `SUPABASE_DB_URL` en `.env.local` — usa el **Session Pooler** de Supabase (`aws-1-us-east-2.pooler.supabase.com:5432`, usuario `postgres.<project-ref>`), no la conexion directa (falla por DNS IPv6-only en esta red).
- Al usarla por primera vez se aplicaron las 10 migraciones historicas que nunca se habian corrido todas juntas, y se encontro/corrigio un bug real: `docs/sql/20260616_profiles_user_account_fields.sql` tenia un indice unico sobre `recovery_email` que rechazaba los perfiles con ese campo vacio (17 de 46). Se corrigio a indice unico parcial (`where recovery_email <> ''`).
- Documentado en `docs/database.md` seccion "Como aplicar migraciones nuevas".

### 3) Rediseno del editor de recorte de imagenes (rama `feature/editor-recorte-libre-imagenes`, SIN MERGEAR)

Reemplaza `react-easy-crop` (imagen se mueve dentro de un marco fijo 1:1) por `react-advanced-cropper` (marco redimensionable arrastrando cualquiera de los 4 bordes o esquinas, imagen fija, pan/zoom multitactil), inspirado en el editor de adjuntos de WhatsApp.

- El editor se abre automaticamente al agregar cada foto (en cola si se seleccionan varias juntas, una por una). El icono de lapiz se mantuvo para reeditar el recorte de una foto ya agregada (decision explicita del usuario, no eliminarlo).
- Selector rapido de proporcion: Libre / 1:1 / Original.
- Archivos nuevos: `src/components/ui/image-crop-modal.tsx`, `src/hooks/use-image-crop-queue.ts`. Modificado: `src/components/post-form.tsx`. Dependencia: `react-advanced-cropper` (reemplaza a `react-easy-crop`, ya removida de `package.json`).
- Verificado con Playwright contra el dev server real (login, apertura automatica, cola multi-imagen, arrastre de handles, selector de aspecto, reedicion manual) — todo funciona.
- Plan completo de diseño (justificacion de la libreria elegida, alternativas evaluadas) en `C:\Users\Lenovo\.claude\plans\implementar-un-sistema-de-cozy-pond.md` (fuera del repo, en el home del usuario).

## Pendientes para la proxima sesion

### Prioridad 1: Resolver el Preview Deployment roto en Vercel

El build de `feature/editor-recorte-libre-imagenes` en Vercel Preview falla con:
```
Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```
Causa: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` probablemente estan configuradas en Vercel solo para el entorno **Production**, no para **Preview**. No es un bug de codigo.

Pasos pendientes (el usuario los tiene que hacer desde el dashboard de Vercel, el agente no tiene esas credenciales):
1. Vercel → Settings → Environment Variables → activar esas dos variables tambien para **Preview**.
2. Redeploy del build fallido.
3. Confirmar que el Preview levanta y probar el editor de imagenes en un celular real (no emulacion) contra esa URL.

### Prioridad 2: Mergear `feature/editor-recorte-libre-imagenes`

Una vez validado el Preview: abrir PR (`https://github.com/nandoDarg/compra_sanjuan_web/pull/new/feature/editor-recorte-libre-imagenes` si no existe todavia) y mergear a `main` siguiendo el flujo de ramas ya establecido.

### Prioridad 3: Limpieza de ramas ya mergeadas

`feature/reputacion-bidireccional` y `feature/migraciones-sql-semiautomaticas` ya estan dentro de `main` (via PR #1) — se pueden borrar tanto local como remotamente si no se van a reusar.

### Prioridad 4 (sin urgencia, heredada de sesiones previas — verificar si sigue vigente)

- Build de APK Android debug (Capacitor ya configurado, pendiente por entorno Java/JDK local) — ver `docs/roadmap.md`.
- Revisar la rama desconocida `agents/refactor-category-navigation-to-params` en el remoto.

## Archivos clave de referencia

- Formulario de publicacion + editor de imagenes: [src/components/post-form.tsx](src/components/post-form.tsx), [src/components/ui/image-crop-modal.tsx](src/components/ui/image-crop-modal.tsx), [src/hooks/use-image-crop-queue.ts](src/hooks/use-image-crop-queue.ts)
- Reputacion: [src/lib/operations.ts](src/lib/operations.ts), [src/lib/reputation-config.ts](src/lib/reputation-config.ts), [src/app/mis-operaciones/page.tsx](src/app/mis-operaciones/page.tsx)
- Migraciones: [scripts/db/migrate.ts](scripts/db/migrate.ts), [docs/database.md](docs/database.md)
- Categorias: [src/lib/hierarchical-categories.ts](src/lib/hierarchical-categories.ts)
- Busqueda semantica: [src/lib/search/synonym-map.ts](src/lib/search/synonym-map.ts), [src/lib/search/expand-query.ts](src/lib/search/expand-query.ts), [src/lib/search/relevance-score.ts](src/lib/search/relevance-score.ts)
- Proxy (ex-middleware): [src/proxy.ts](src/proxy.ts)
