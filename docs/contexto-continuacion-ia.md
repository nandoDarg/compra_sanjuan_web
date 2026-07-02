# Contexto de continuidad IA

Ultima actualizacion: 2026-07-01
Proyecto: compra_sanjuan_web (tratohechoSJ)

## Resumen de sesiones recientes

### Sesion 2026-07-01: Bug camara Android + Features varias

#### Bug: foto de camara no se cargaba en formulario de publicacion
- **Causa raiz confirmada**: `capture="environment"` hace que Android abra la camara como Intent nativo. Al aceptar la foto, Android recarga la pagina del browser completamente (evidencia: aparecia el panel "Cargando publicacion..." del edit page). Todo el estado de React se pierde y el archivo de camara tambien.
- **Intentos fallidos**:
  - Fix MIME type en `ensureFileWithinBudget` → no era el problema real
  - Cambiar botones a `<label htmlFor>` → idem, el reload ocurre antes de que el onChange pueda disparar
  - Remover `capture="environment"` → Android 13 abre Google Fotos sin opcion de camara
- **Solucion implementada**: componente `CameraModal` que usa `getUserMedia()` para acceder a la camara dentro del browser, sin salir de la pagina. La foto se captura directamente como File en memoria y se pasa a `addImageFiles`. No hay reload de pagina.
- **Archivos modificados**:
  - `src/components/ui/camera-modal.tsx` — nuevo componente (video fullscreen + boton captura circular)
  - `src/components/post-form.tsx` — importa CameraModal, agrega estado `showCamera`, los botones "Tomar foto" llaman `setShowCamera(true)`
- **Estado**: implementado, pendiente prueba en celular via ngrok (getUserMedia requiere HTTPS; no funciona en `192.168.100.11:3000`)
- **Como probar**: ejecutar `ngrok http 3000` en terminal separada mientras corre el dev server, acceder desde celular a la URL HTTPS de ngrok
- **Cambio adicional**: `capture="environment"` eliminado del input de camara (que queda como fallback hidden, sin uso en el flujo normal)

#### Feature: Herramienta de feedback/sugerencias
- Accesible desde el menu de 3 puntos (mobile) y desde el dropdown "Cuenta" y boton 💡 (desktop).
- Modal con formulario: tipo de envio (anonimo por defecto / con usuario si hay sesion), tipo de mensaje (sugerencia/problema/funcion/otro), textarea de mensaje.
- API route `src/app/api/feedback/route.ts`: guarda en tabla `feedback` de Supabase, envia email via Resend a `nandodclavijo@gmail.com`.
- **SQL pendiente de aplicar manualmente en Supabase**: `docs/sql/20260701_feedback.sql` (tabla feedback + RLS: insert abierto, select bloqueado).
- Archivos: `src/components/ui/feedback-modal.tsx`, `src/app/api/feedback/route.ts`, `docs/sql/20260701_feedback.sql`.
- `RESEND_API_KEY` ya agregada a `.env.local` por el usuario.

#### Feature: Rediseno filtros en Home
- Se elimino el bloque `thsj-panel` con dropdowns de categoria/orden/condicion.
- Se agrego `CategoryIconBar`: barra horizontal compacta con iconos de categorias (Todas + 4 raices), solo visible en mobile (`lg:hidden`).
- Se agrego `ContextualFilterBar`: barra de sort + chips condicion que solo aparece cuando hay busqueda activa o categoria seleccionada.
- Archivos: `src/components/ui/category-icon-bar.tsx`, `src/components/ui/contextual-filter-bar.tsx`, `src/app/page.tsx`.

#### Feature: Subcategorias de Computacion
- Dentro de `makeRoot('Articulos')`, se agrego `makeBranch('Computacion', [...10 subcategorias...])`.
- Subcategorias: Laptops y Accesorios, PC de Escritorio, Monitores y Accesorios, Componentes de PC, Almacenamiento, Impresoras y Escaneres, Redes e Inalambrico, Tablets y Accesorios, Software, Servidores y NAS.
- Archivo: `src/lib/hierarchical-categories.ts`.

#### Fix: busqueda mobile con teclado Android
- Input de busqueda mobile envuelto en `<form role="search" onSubmit>` con `type="search"` y `enterKeyHint="search"`.
- El handler `onSubmit` ejecuta la busqueda y llama `.blur()` para bajar el teclado.
- Archivo: `src/components/navbar.tsx`.

### Sesion 2026-06-30: Refactor Navbar (mobile + desktop)

- Mobile: Logo | Buscador (flex-1) | Menu 3 puntos. Busqueda con Enter. Menu unificado.
- Desktop sin sesion: Publicar (primary) | Ingresar (ghost) | 💡 (feedback). Sin boton Registro separado.
- Commit: `7d1d1c5`

### Sesion 2026-06-27: Fix hidratacion FAB + ajuste visual

- Patron `mounted` en navbar para portal del FAB (evita hydration mismatch SSR).
- FAB: circulo naranja 50% opacidad, icono + color marca.

### Sesion 2026-06-24 a 2026-06-26: FAB Movil + Correcciones Tipado

- FAB en esquina inferior izquierda via React Portal.
- Fix tipado Supabase en favoritos: helper `pickFavoritePost` en `src/lib/post-images.ts`.

### Sesion previa (2026-06-11): Categorias jerarquicas + Busqueda semantica

- Recuperacion de contraseña (`/reset-password`).
- Taxonomia jerarquica (categoria + subcategoria) con compatibilidad legacy.
- Busqueda fuzzy + sinonimos.

## Cambios funcionales clave

### 1) Navbar (actualizado 2026-06-30)
- Mobile: Logo | Buscador | ⋮ (menu 3 puntos). Busqueda ejecuta con Enter + baja teclado.
- Desktop sin sesion: Publicar (→ login?next=/create-post) | Ingresar | 💡
- Desktop con sesion: Publicar | Cuenta (dropdown con Configuracion, Favoritos, Mis publicaciones, Cerrar sesion, 💡 Ayudanos a mejorar)
- Archivo: [src/components/navbar.tsx](src/components/navbar.tsx)

### 2) FAB Movil
- Portal a document.body desde navbar. Circulo naranja. Solo mobile, excluido en rutas auth y create-post.
- Archivo: [src/components/navbar.tsx](src/components/navbar.tsx)

### 3) Home — filtros y categorias
- `CategoryIconBar`: iconos de categoria siempre visibles en mobile.
- `ContextualFilterBar`: sort + condicion, solo visible cuando hay busqueda o categoria activa.
- Archivos: [src/components/ui/category-icon-bar.tsx](src/components/ui/category-icon-bar.tsx), [src/components/ui/contextual-filter-bar.tsx](src/components/ui/contextual-filter-bar.tsx), [src/app/page.tsx](src/app/page.tsx)

### 4) Feedback/sugerencias
- Acceso desde navbar (mobile: menu 3 puntos; desktop: 💡 o dropdown Cuenta).
- Modal: anonimo por defecto, tipo + mensaje, envia a Supabase + email Resend.
- Archivos: [src/components/ui/feedback-modal.tsx](src/components/ui/feedback-modal.tsx), [src/app/api/feedback/route.ts](src/app/api/feedback/route.ts)
- **PENDIENTE**: aplicar `docs/sql/20260701_feedback.sql` en Supabase SQL Editor.

### 5) Camara en formulario de publicacion
- `CameraModal`: acceso a camara via `getUserMedia()`, sin salir de la pagina, sin reload.
- Requiere HTTPS (ngrok o produccion). En HTTP local no funcionara (browser lo bloquea).
- Archivos: [src/components/ui/camera-modal.tsx](src/components/ui/camera-modal.tsx), [src/components/post-form.tsx](src/components/post-form.tsx)
- **PENDIENTE**: probar en celular via ngrok y confirmar funcionamiento.

### 6) Categorias jerarquicas + Computacion
- Arbol en [src/lib/hierarchical-categories.ts](src/lib/hierarchical-categories.ts).
- Computacion es un `makeBranch` dentro de Articulos con 10 subcategorias.

### 7) Plan Perfil Extendido (Pendiente implementacion)
- Migracion SQL: [docs/sql/20260002_profiles_extended.sql](docs/sql/20260002_profiles_extended.sql)
- Nuevos campos: display_name, first_name, last_name, dni, phone, show_phone, address_street, locality, email.
- Refactor configuracion, prefill localidad en create-post/edit-post.

### 8) Vehiculos
- Ficha tecnica en `vehicle_details`. Detalle renderiza ficha cuando existe.

### 9) Busqueda semantica/fuzzy
- `src/lib/search/synonym-map.ts` + `src/lib/search/expand-query.ts`.
- Pipeline: normalizar → stop-words → fuzzy → sinonimos → OR multi-termino en Supabase.

## SQL/migraciones

| Archivo | Estado |
|---|---|
| `docs/sql/20260604_profiles_display_name.sql` | Aplicada |
| `docs/sql/20260605_posts_condition.sql` | Aplicada |
| `docs/sql/20260609_posts_subcategory.sql` | Aplicada |
| `docs/sql/20260616_profiles_user_account_fields.sql` | Aplicada |
| `docs/sql/20260701_feedback.sql` | **PENDIENTE — aplicar en Supabase SQL Editor** |
| `docs/sql/20260002_profiles_extended.sql` | PENDIENTE (plan perfil extendido) |

## Estado del repositorio (2026-07-01)

- Commit publicado en origin/main: `d75d235` (fix primer intento camara — ya superado por la nueva implementacion)
- Cambios locales SIN commitear:
  - `src/components/post-form.tsx` — integracion CameraModal, removeCapture, estado showCamera
  - `src/components/ui/camera-modal.tsx` — nuevo archivo (sin rastrear)
- **Accion pendiente**: hacer commit y push de los cambios de camara una vez confirmado que funciona via ngrok.

## Pendientes para proxima sesion

### Priority 1: Confirmar camara en Android
1. Ejecutar `ngrok http 3000` + `npm run dev` simultaneamente.
2. Desde celular, ir a la URL HTTPS de ngrok.
3. Ir a crear/editar publicacion → "Tomar foto" → debe abrir overlay negro con vista de camara en el browser.
4. Capturar foto con boton circular blanco → imagen debe aparecer en formulario sin recarga.
5. Si funciona: commit + push de `post-form.tsx` y `camera-modal.tsx`.

### Priority 2: Aplicar SQL de feedback
- Entrar a Supabase SQL Editor y ejecutar `docs/sql/20260701_feedback.sql`.
- Verificar que la tabla `feedback` se crea con RLS habilitado.
- Probar envio de sugerencia desde el modal (anonimo y con usuario).

### Priority 3: Plan Perfil Extendido (7 fases)
1. Aplicar `docs/sql/20260002_profiles_extended.sql` en Supabase.
2. Crear modulo `src/lib/san-juan-departments.ts` (19 departamentos).
3. Refactorizar `src/lib/user-profile.ts` para esquema extendido.
4. Refactor `src/app/configuracion/page.tsx` (info personal + acceso unificado).
5. Prefill localidad en `src/app/create-post/page.tsx`.
6. Fallback localidad en `src/app/my-posts/[id]/edit/page.tsx`.
7. Verificacion tecnica y funcional.

### Archivos clave de referencia
- Navbar: [src/components/navbar.tsx](src/components/navbar.tsx)
- Formulario publicacion: [src/components/post-form.tsx](src/components/post-form.tsx)
- Modal camara: [src/components/ui/camera-modal.tsx](src/components/ui/camera-modal.tsx)
- Modal feedback: [src/components/ui/feedback-modal.tsx](src/components/ui/feedback-modal.tsx)
- API feedback: [src/app/api/feedback/route.ts](src/app/api/feedback/route.ts)
- Categorias: [src/lib/hierarchical-categories.ts](src/lib/hierarchical-categories.ts)
- Migracion perfil extendido: [docs/sql/20260002_profiles_extended.sql](docs/sql/20260002_profiles_extended.sql)
