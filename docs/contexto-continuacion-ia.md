# Contexto de continuidad IA

Ultima actualizacion: 2026-06-27
Proyecto: compra_sanjuan_web (tratohechoSJ)

## Resumen de sesiones recientes

### Sesion 2026-06-27: Fix de hidratacion en Navbar + ajuste visual pendiente del FAB

- **Hydration fix en portal del FAB**:
  - Se detecto mismatch SSR/cliente en el render del boton flotante por condicion basada en entorno.
  - En `src/components/navbar.tsx` se reemplazo gating del portal por estado de montaje:
    - `const [mounted, setMounted] = useState(false)`
    - `useEffect(() => { setMounted(true) }, [])`
    - condicion del portal: `mounted && ... ? createPortal(...) : null`
  - Objetivo cumplido: durante SSR y primer render cliente no se renderiza el portal; aparece despues del mount.

- **Nuevo requerimiento UX pendiente (no implementado aun en esta sesion)**:
  - El FAB movil debe quedar con **circulo relleno naranja** dentro de la paleta del sitio.
  - Opacidad solicitada: **50%** para destacarse sobre publicaciones.
  - Mantener posicion, rutas y logica actual de autenticacion.

### Sesion 2026-06-24 a 2026-06-26: FAB Movil + Correcciones de Tipado

- **FAB Movil (Floating Action Button)**:
  - Implementado en esquina inferior izquierda de dispositivos moviles.
  - Renderizado via React Portal a document.body para evitar ser atrapado por filters/blur del navbar.
  - Estilo invertido: circulo transparente (bg-white/10) + signo mas coloreado con color de marca (stroke-[#0b7a75]).
  - Navegacion auth-aware: usuario logueado va a `/create-post`, invitado va a `/login?next=%2Fcreate-post`.
  - Oculto en rutas de auth y en `/create-post`.
  - Desde 2026-06-27, patron de portal actualizado para SSR: gating por `mounted` para evitar hydration mismatch.
  
- **Correcciones de Tipado**:
  - Favoritos page: normalizacion de relacion `post` de Supabase que puede venir como objeto o array.
  - Implementado helper `pickFavoritePost` en [src/lib/post-images.ts](src/lib/post-images.ts) para garantizar objeto consistente.
  - Build `npm run build` validado exitosamente post-fix.

- **Commits en main**:
  - `d61a172` - fix: normaliza relacion favoritos->post para tipado de Supabase
  - `a28de00` - feat: corrige FAB movil con portal y estilo invertido

### Sesion previa (2026-06-11): Categorias jerarquicas + Busqueda semantica

- Se agrego recuperacion de contraseña con nueva ruta `/reset-password`.
- Se implemento taxonomia jerarquica (categoria principal + subcategoria) con compatibilidad hacia atras.
- Se agrego migracion SQL para `posts.subcategory` y mapeo de categorias legacy.
- Se mejoro busqueda con normalizacion + fuzzy matching (Levenshtein <= 2) + expansion semantica por sinonimos.

## Cambios funcionales clave

### 1) FAB Movil (Floating Action Button)

- Ubicado en esquina inferior izquierda (bottom-5, left-4) del viewport.
- Portal a document.body renderizado desde [src/components/navbar.tsx](src/components/navbar.tsx) para evitar trapping por blur/filter del nav.
- Estilo invertido: background nearly transparent (white/10), border sutil (white/20), signo mas coloreado stroke-[#0b7a75].
- Hidratacion SSR corregida con render condicional por estado `mounted` antes de ejecutar createPortal.
- Comportamiento: usuario autenticado va a create-post; invitado va a login con query next=/create-post.
- Excluido en rutas auth y en create-post; solo visible en mobile (md:hidden).
- Pendiente inmediato: cambiar relleno del circulo a naranja al 50% de opacidad manteniendo el resto del comportamiento.

### 2) Favoritos - Tipado de Supabase

- Relacion `post` normalizada con helper `pickFavoritePost` en [src/lib/post-images.ts](src/lib/post-images.ts).
- Resuelve mismatch donde Supabase puede retornar relacion como objeto o array.
- TypeScript validado y build exitoso.

### 3) Plan Perfil Extendido (Pendiente implementacion)

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

### 4) Vehiculos

- Create/edit guardan ficha tecnica en `vehicle_details`.
- Detalle renderiza ficha tecnica cuando existe.
- Si falta la tabla `vehicle_details`, ahora se muestra error explicito para ejecutar migracion.

### 5) Categorias jerarquicas

- Arbol local en `src/lib/hierarchical-categories.ts`.
- Formularios guardan `category` y `subcategory`.
- Feed/sidebar filtran por categoria principal y subcategoria.
- Feed/detalle muestran ruta `Categoria > Subcategoria`.
- Compatibilidad activa para entornos sin `subcategory`.

### 6) Busqueda semantica/fuzzy

- Mapa extensible en `src/lib/search/synonym-map.ts`.
- Helper en `src/lib/search/expand-query.ts`.
- Pipeline:
  - normalizar texto
  - remover stop-words
  - fuzzy a termino canonico
  - expandir sinonimos
- Query Supabase construida con OR multi-termino antes de enviar.

## SQL/migraciones relevantes

- `docs/sql/20260604_profiles_display_name.sql` (ya aplicada)
- `docs/sql/20260605_posts_condition.sql` (ya aplicada)
- `docs/sql/20260609_posts_subcategory.sql` (ya aplicada)
- `docs/sql/20260002_profiles_extended.sql` (PENDIENTE: agregar campos nuevos y legacy, backfill, sincronizacion)

## Commits publicados hasta 2026-06-26

- `d61a172` - fix: normaliza relacion favoritos->post para tipado de Supabase (2026-06-24)
- `a28de00` - feat: corrige FAB movil con portal y estilo invertido (2026-06-26)
- `f42ab2d` - Fix clear filters with single navigation + docs update (sesion anterior)
- `356bb5d` - Add hierarchical categories and compatibility fallbacks (sesion anterior)
- `7dec0cc` - Search fuzzy + semantic expansion (sesion anterior)
- `b4ff561` - Toggle collapse for expanded category filters (sesion anterior)

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

- Probar FAB en navegador movil real para confirmar posicion y oclusiones.
- Validar que FAB sin sesion redirige a login con query next correctamente.
- Aplicar ajuste visual solicitado: fondo naranja al 50% en el FAB movil (sin tocar logica/rutas).
- Ejecutar `npm run build` tras completar plan perfil extendido.
- Revisar memoria de sesion en /memories/session/ para lecciones aprendidas.

### Archivos / Referencias utiles

- Plan detallado en [/memories/session/plan.md](memorias de sesion - plan del perfil extendido).
- Memoria del repo: [/memories/repo/compra_sanjuan_web.md](notas tecnicas sobre patrones y decisiones).
- Documentacion historica: ver commits `d61a172` (favoritos), `a28de00` (FAB) en main.
