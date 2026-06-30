# Contexto de continuidad IA

Ultima actualizacion: 2026-06-30
Proyecto: compra_sanjuan_web (tratohechoSJ)

## Resumen de sesiones recientes

### Sesion 2026-06-30: Refactor Navbar (mobile + desktop)

- **Mobile — barra superior simplificada**:
  - Se elimino el boton lupa (busqueda ejecuta con Enter del teclado movil).
  - Se elimino el boton de usuario separado (icono de persona).
  - El menu de 3 puntos ahora contiene TODAS las opciones:
    - Sin sesion: "Iniciar sesion" / "Registrarse"
    - Con sesion: "Publicar" (destacado) / separador / "Configuracion y seguridad" / "Favoritos" / "Mis publicaciones" / separador / "Cerrar sesion"
  - Resultado: solo quedan Logo | Buscador (ancho, flex-1) | ⋮

- **Desktop — botones de accion sin sesion**:
  - "Explorar" (sin utilidad) reemplazado por "Publicar" con estilo primario (naranja).
    - Dirige a `/login?next=%2Fcreate-post` — tras login redirige a create-post.
  - "Login" renombrado a "Ingresar" (estilo ghost).
  - "Registro" eliminado — el registro sigue accesible desde la pagina de login.
  - Orden final: **Publicar** (primary, izquierda) | **Ingresar** (ghost, derecha)
  - Con sesion: sin cambios (Publicar → /create-post + menu Cuenta).

- **Commit**: `7d1d1c5` — feat: refactoriza navbar movil y desktop
- **Deploy**: push a main, Vercel despliega automaticamente.

### Sesion 2026-06-27: Fix de hidratacion en Navbar + ajuste visual FAB

- **Hydration fix en portal del FAB**:
  - Se detecto mismatch SSR/cliente en el render del boton flotante por condicion basada en entorno.
  - En `src/components/navbar.tsx` se reemplazo gating del portal por estado de montaje:
    - `const [mounted, setMounted] = useState(false)`
    - `useEffect(() => { setMounted(true) }, [])`
    - condicion del portal: `mounted && ... ? createPortal(...) : null`
  - Objetivo cumplido: durante SSR y primer render cliente no se renderiza el portal; aparece despues del mount.

- **Ajuste visual FAB completado** (pendiente de sesion anterior):
  - FAB movil con circulo relleno naranja al 50% de opacidad: `bg-[rgba(255,122,26,0.5)]`
  - Border naranja sutil: `border-[rgba(255,122,26,0.72)]`
  - Icono + con color de marca: `stroke="currentColor"` sobre `text-[rgb(7,94,90)]`

### Sesion 2026-06-24 a 2026-06-26: FAB Movil + Correcciones de Tipado

- **FAB Movil (Floating Action Button)**:
  - Implementado en esquina inferior izquierda de dispositivos moviles.
  - Renderizado via React Portal a document.body para evitar ser atrapado por filters/blur del navbar.
  - Navegacion auth-aware: usuario logueado va a `/create-post`, invitado va a `/login?next=%2Fcreate-post`.
  - Oculto en rutas de auth y en `/create-post`.
  - Desde 2026-06-27, patron de portal actualizado para SSR: gating por `mounted` para evitar hydration mismatch.
  
- **Correcciones de Tipado**:
  - Favoritos page: normalizacion de relacion `post` de Supabase que puede venir como objeto o array.
  - Implementado helper `pickFavoritePost` en [src/lib/post-images.ts](src/lib/post-images.ts) para garantizar objeto consistente.
  - Build `npm run build` validado exitosamente post-fix.

### Sesion previa (2026-06-11): Categorias jerarquicas + Busqueda semantica

- Se agrego recuperacion de contraseña con nueva ruta `/reset-password`.
- Se implemento taxonomia jerarquica (categoria principal + subcategoria) con compatibilidad hacia atras.
- Se agrego migracion SQL para `posts.subcategory` y mapeo de categorias legacy.
- Se mejoro busqueda con normalizacion + fuzzy matching (Levenshtein <= 2) + expansion semantica por sinonimos.

## Cambios funcionales clave

### 1) Navbar Mobile (actualizado 2026-06-30)

- Estructura: Logo | Buscador (flex-1) | Menu 3 puntos
- Busqueda ejecuta con Enter (sin boton lupa).
- Menu 3 puntos unificado:
  - Sin sesion: Iniciar sesion / Registrarse
  - Con sesion: Publicar / Configuracion y seguridad / Favoritos / Mis publicaciones / Cerrar sesion
- Archivo: [src/components/navbar.tsx](src/components/navbar.tsx)

### 2) Navbar Desktop (actualizado 2026-06-30)

- Sin sesion: **Publicar** (primary → `/login?next=/create-post`) | **Ingresar** (ghost → `/login`)
- Con sesion: sin cambios — Publicar (→ /create-post) + dropdown Cuenta
- Registro ya no es boton separado; accesible desde pagina de login.
- Archivo: [src/components/navbar.tsx](src/components/navbar.tsx)

### 3) FAB Movil (Floating Action Button)

- Ubicado en esquina inferior izquierda (bottom-5, left-4) del viewport.
- Portal a document.body renderizado desde [src/components/navbar.tsx](src/components/navbar.tsx).
- Estilo: circulo naranja al 50% de opacidad (`bg-[rgba(255,122,26,0.5)]`), icono + con color de marca.
- Hidratacion SSR corregida con render condicional por estado `mounted`.
- Comportamiento: autenticado → create-post; invitado → login?next=/create-post.
- Excluido en rutas auth y en create-post; solo visible en mobile (md:hidden).

### 4) Favoritos - Tipado de Supabase

- Relacion `post` normalizada con helper `pickFavoritePost` en [src/lib/post-images.ts](src/lib/post-images.ts).
- Resuelve mismatch donde Supabase puede retornar relacion como objeto o array.

### 5) Plan Perfil Extendido (Pendiente implementacion)

- Migracion SQL: [docs/sql/20260002_profiles_extended.sql](docs/sql/20260002_profiles_extended.sql)
  - Nuevos campos: display_name, first_name, last_name, dni, phone, show_phone, address_street, locality, email.
  - Compatibilidad: full_name, whatsapp_number, domicile, recovery_email (legacy).
  - Backfill no destructivo + sincronizacion temporal.
- Modulo unico de departamentos: [src/lib/san-juan-departments.ts](src/lib/san-juan-departments.ts) (19 departamentos).
- Refactor configuracion:
  - Nueva seccion "Informacion personal" con campos ordenados + localidad select.
  - Panel unificado "Acceso y contraseña": email inmutable + cambio de contraseña integrado.
  - Sin email de recuperacion en configuracion.
  - Prefill de localidad en create-post y fallback en edit-post.

### 6) Vehiculos

- Create/edit guardan ficha tecnica en `vehicle_details`.
- Detalle renderiza ficha tecnica cuando existe.
- Si falta la tabla `vehicle_details`, ahora se muestra error explicito para ejecutar migracion.

### 7) Categorias jerarquicas

- Arbol local en `src/lib/hierarchical-categories.ts`.
- Formularios guardan `category` y `subcategory`.
- Feed/sidebar filtran por categoria principal y subcategoria.
- Feed/detalle muestran ruta `Categoria > Subcategoria`.
- Compatibilidad activa para entornos sin `subcategory`.

### 8) Busqueda semantica/fuzzy

- Mapa extensible en `src/lib/search/synonym-map.ts`.
- Helper en `src/lib/search/expand-query.ts`.
- Pipeline: normalizar texto → remover stop-words → fuzzy a termino canonico → expandir sinonimos.
- Query Supabase construida con OR multi-termino antes de enviar.

## SQL/migraciones relevantes

- `docs/sql/20260604_profiles_display_name.sql` (ya aplicada)
- `docs/sql/20260605_posts_condition.sql` (ya aplicada)
- `docs/sql/20260609_posts_subcategory.sql` (ya aplicada)
- `docs/sql/20260616_profiles_user_account_fields.sql` (ya aplicada)
- `docs/sql/20260002_profiles_extended.sql` (PENDIENTE: agregar campos nuevos y legacy, backfill, sincronizacion)

## Commits publicados hasta 2026-06-30

- `7d1d1c5` - feat: refactoriza navbar movil y desktop (2026-06-30)
- `f2fd108` - feat: ajusta FAB movil y actualiza contexto de continuidad (2026-06-27)
- `34f443b` - docs: actualiza contexto de continuidad para sesion 2026-06-26
- `a28de00` - feat: corrige FAB movil con portal y estilo invertido (2026-06-26)
- `d61a172` - fix: normaliza relacion favoritos->post para tipado de Supabase (2026-06-24)

## Pendientes recomendados para proxima sesion

### Priority 1: Plan Perfil Extendido (Estructurado en 7 fases)

1. **Fase 1**: Aplicar migracion SQL [docs/sql/20260002_profiles_extended.sql](docs/sql/20260002_profiles_extended.sql) en Supabase.
   - Validar que agrega columnas nuevas y legacy con IF NOT EXISTS.
   - Confirmar backfill y sincronizacion temporal sin errores.
   
2. **Fase 2**: Crear modulo [src/lib/san-juan-departments.ts](src/lib/san-juan-departments.ts) con 19 departamentos.
   
3. **Fase 3**: Refactorizar [src/lib/user-profile.ts](src/lib/user-profile.ts) para soportar esquema extendido.
   - Tipos: UserProfileRow, ProfileInput, ProfileSnapshot.
   - Normalizacion y payload dual (nuevo + legacy temporal).
   
4. **Fase 4**: Refactor [src/app/configuracion/page.tsx](src/app/configuracion/page.tsx).
   - Nueva seccion "Informacion personal" con orden exacto de campos.
   - Panel unificado "Acceso y contraseña" con email inmutable + cambio de contraseña.
   - Excluir recovery_email de esta vista.
   
5. **Fase 5**: Prefill localidad en [src/app/create-post/page.tsx](src/app/create-post/page.tsx).
   
6. **Fase 6**: Fallback localidad en [src/app/my-posts/[id]/edit/page.tsx](src/app/my-posts/[id]/edit/page.tsx).
   
7. **Fase 7**: Verificacion tecnica y funcional (errores, validacion manual, E2E).

### Priority 2: Validaciones y mejoras generales

- Probar navbar mobile en navegador movil real para confirmar comportamiento del menu 3 puntos.
- Validar que "Publicar" sin sesion (desktop y FAB) redirige correctamente a login y luego a create-post.
- Ejecutar `npm run build` tras completar plan perfil extendido.
- Evaluar si la pagina `/login` muestra link claro a registro (ya que se elimino boton Registro del desktop).

### Archivos / Referencias utiles

- Navbar unificado: [src/components/navbar.tsx](src/components/navbar.tsx)
- Migracion perfil extendido: [docs/sql/20260002_profiles_extended.sql](docs/sql/20260002_profiles_extended.sql)
- Helper post-images: [src/lib/post-images.ts](src/lib/post-images.ts)
- Documentacion historica: ver commits en main desde `d61a172` en adelante.
