# Roadmap de continuidad

Ultima actualizacion: Junio 2026.

## Estado actual

- MVP web en produccion, funcional y validado end-to-end.
- Deploy oficial en Vercel sobre `nandoDarg/tratohechoSJ`.
- Exploracion publica habilitada para marketplace (`/` y `/post/[id]`).
- Gestion de publicaciones autenticada (`/create-post`, `/my-posts`, `/my-posts/[id]/edit`).
- Contacto vendedor por WhatsApp implementado.
- Busqueda sin resultado vacio + sugerencias personalizadas locales.
- Multi-imagen completo (crear/editar/detalle) con limites y compresion.
- Flujo de importacion por URL publica/Google Drive habilitado.
- Modulo de vehiculos en produccion de codigo (ficha tecnica + render en detalle).
- Instrumentacion de analytics con PostHog activa.

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
- Mejora de taxonomia de categorias (aprovechando normalizacion ya implementada).
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
2. Correr prueba E2E manual de flujo vehiculo:
	- crear
	- editar (incluyendo quitar imagenes existentes)
	- visualizar detalle con ficha tecnica
3. Verificar eventos de PostHog en ambiente de produccion.

## Primera lista de tareas para proxima sesion

1. Confirmar JDK 17 instalado y `JAVA_HOME` correcto.
2. Ejecutar build de APK debug y verificar instalacion en dispositivo/emulador.
3. Test rapido Android sobre flujo minimo:
	 - login
	 - explorar feed
	 - detalle
	 - WhatsApp
4. Documentar comando final de build y ubicacion del APK generado.
