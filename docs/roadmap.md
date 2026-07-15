# Roadmap de continuidad

Ultima actualizacion: Junio 2026.

## Estado actual

- MVP web en produccion, funcional y validado end-to-end.
- Deploy oficial en Vercel sobre `nandoDarg/compra_sanjuan_web`.
- Exploracion publica habilitada para marketplace (`/` y `/post/[id]`).
- Gestion de publicaciones autenticada (`/create-post`, `/my-posts`, `/my-posts/[id]/edit`).
- Contacto vendedor por WhatsApp implementado.
- Busqueda semantica/fuzzy activa (normalizacion + sinonimos + Levenshtein <= 2).
- Multi-imagen completo (crear/editar/detalle) con limites y compresion.
- Flujo de importacion por URL publica/Google Drive habilitado.
- Modulo de vehiculos en produccion de codigo (ficha tecnica + render en detalle).
- Instrumentacion de analytics con PostHog activa.
- Taxonomia jerarquica implementada en frontend (categoria principal + subcategoria).
- Filtros jerarquicos desplegables en feed (mobile y desktop), con toggle abrir/cerrar.

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

- Favoritos.
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

1. Ejecutar/validar SQL completo de `docs/database.md` en Supabase (si falta `vehicle_details` o politicas nuevas).
2. Ejecutar `docs/sql/20260609_posts_subcategory.sql` en cualquier entorno que aun no tenga `posts.subcategory`.
2. Correr prueba E2E manual de flujo vehiculo:
	- crear
	- editar (incluyendo quitar imagenes existentes)
	- visualizar detalle con ficha tecnica
3. Verificar eventos de PostHog en ambiente de produccion.
4. Medir precision de busqueda fuzzy/semantica y ajustar sinonimos en `src/lib/search/synonym-map.ts`.

## Primera lista de tareas para proxima sesion

1. Confirmar JDK 17 instalado y `JAVA_HOME` correcto.
2. Ejecutar build de APK debug y verificar instalacion en dispositivo/emulador.
3. Test rapido Android sobre flujo minimo:
	 - login
	 - explorar feed
	 - detalle
	 - WhatsApp
4. Documentar comando final de build y ubicacion del APK generado.
