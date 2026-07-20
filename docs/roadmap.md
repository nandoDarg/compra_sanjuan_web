# Roadmap de continuidad

Ultima actualizacion: 2026-07-20.

## Estado actual

- MVP web en produccion, funcional y validado end-to-end.
- Deploy oficial en Vercel sobre `nandoDarg/compra_sanjuan_web`, con flujo de ramas + Pull Requests + Preview Deployments ya en uso (ver `README.md`).
- Exploracion publica habilitada para marketplace (`/` y `/post/[id]`).
- Gestion de publicaciones autenticada (`/create-post`, `/my-posts`, `/my-posts/[id]/edit`).
- Contacto vendedor por WhatsApp implementado, con login obligatorio antes de contactar.
- **Sistema de reputacion bidireccional** implementado y en produccion: confirmacion mutua de operacion + calificacion 1-5 estrellas con comentario publico opcional (`/mis-operaciones`). Ver `docs/database.md` seccion 3d.
- **Favoritos** implementados (`/favoritos`, conteo agregado publico via RPC). Ver `docs/database.md` seccion 3b.
- Busqueda semantica/fuzzy activa (normalizacion + sinonimos + Levenshtein <= 2 + expansion conceptual marca/modelo → categoria).
- Multi-imagen completo (crear/editar/detalle) con limites y compresion.
- **Editor de recorte de imagenes libre estilo galeria nativa** (marco redimensionable, no imagen-dentro-de-marco-fijo) — implementado en rama `feature/editor-recorte-libre-imagenes`, pendiente de mergear (ver `docs/contexto-continuacion-ia.md`).
- Flujo de importacion por URL publica/Google Drive habilitado.
- Modulo de vehiculos en produccion de codigo (ficha tecnica + render en detalle).
- Instrumentacion de analytics con PostHog activa.
- Taxonomia jerarquica implementada en frontend (categoria principal + subcategoria + terciaria), con drill-down tambien en mobile (paridad con desktop).
- Filtros jerarquicos desplegables en feed (mobile y desktop), con toggle abrir/cerrar.
- Herramienta semi-automatica de migraciones SQL (`npm run db:migrate`) — ya no se aplica todo a mano.

## Fase actual - Validacion real de mercado

Objetivo: conseguir uso real y aprender del comportamiento de usuarios.

- Conseguir 20-50 usuarios iniciales.
- Difusion en grupos locales y WhatsApp.
- Medir:
	- publicaciones creadas
	- clics/contactos WhatsApp
	- abandonos en create-post
	- conversion de busqueda a apertura de detalle
	- conversion de detalle a contacto
	- fricciones UX reportadas

## Fase siguiente (despues de feedback real)

- Notificaciones simples.
- Afinar taxonomia de categorias segun datos reales de busqueda/publicacion.
- Moderacion basica/reportes.
- SEO basico.

## No priorizar todavia

- Chat interno.
- Realtime complejo.
- IA avanzada.
- Pagos.
- Arquitectura enterprise.

## Android wrapper (siguiente bloque tecnico)

Estrategia: Capacitor sobre la web actual (sin migrar a React Native).

Estado:

- Capacitor configurado.
- Plataforma Android creada.
- Pendiente: build de APK debug final por entorno Java/JDK.

## Pendientes tecnicos inmediatos

Detalle completo y con contexto en `docs/contexto-continuacion-ia.md`. Resumen:

1. Arreglar el Preview Deployment de Vercel roto por variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`) faltantes en el entorno Preview, y mergear `feature/editor-recorte-libre-imagenes` una vez validado.
2. Borrar ramas ya mergeadas a `main` que no se vayan a reusar (`feature/reputacion-bidireccional`, `feature/migraciones-sql-semiautomaticas`).
3. Verificar eventos de PostHog en ambiente de produccion.
4. Medir precision de busqueda fuzzy/semantica y ajustar sinonimos en `src/lib/search/synonym-map.ts` con datos reales de uso.

## Primera lista de tareas para proxima sesion

1. Confirmar JDK 17 instalado y `JAVA_HOME` correcto.
2. Ejecutar build de APK debug y verificar instalacion en dispositivo/emulador.
3. Test rapido Android sobre flujo minimo:
	 - login
	 - explorar feed
	 - detalle
	 - WhatsApp
4. Documentar comando final de build y ubicacion del APK generado.
