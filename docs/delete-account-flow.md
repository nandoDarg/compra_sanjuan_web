# Flujo de eliminacion de cuenta

Ultima actualizacion: 2026-06-12.

## Objetivo

Permitir que un usuario autenticado elimine permanentemente su propia cuenta desde `Perfil / Configuracion`, con confirmacion explicita, limpieza de datos relacionados y borrado del usuario en Supabase Auth.

## Estrategia elegida

Se implemento **borrado definitivo** y no soft delete.

Motivo:

- La arquitectura actual ya elimina publicaciones de forma fisica desde `Mis publicaciones`.
- `posts` ya tiene `on delete cascade` hacia `post_images` y `vehicle_details`.
- El flujo de cuenta requiere tambien limpieza de Storage y de `auth.users`, por lo que mantener publicaciones soft-deleted dejaria residuos funcionales y operativos.

## Tablas y recursos afectados

- `public.profiles`
- `public.posts`
- `public.post_images` por cascada desde `posts`
- `public.vehicle_details` por cascada desde `posts`
- `storage.objects` del bucket `post-images`
- `auth.users`

## Tablas revisadas en el repo

- Se revisaron referencias a `user_id` y tablas usadas en `src/` y `docs/sql/`.
- No se encontraron tablas activas de `favorites` en el estado actual del repositorio.
- Si en Supabase existe una tabla adicional con `user_id` no versionada en este repo, debe incorporarse al RPC y a la API antes de considerar cerrado el alcance.

## Politicas RLS involucradas

### Lectura previa al borrado

- `posts_select_public`: permite leer publicaciones; el backend filtra por `user_id = auth.uid()` mediante sesion activa.
- `post_images_select_public`: permite leer imagenes de galeria; el backend las restringe a `post_id` propios.
- `profiles_select_public`: se usa en la UI para mostrar nombre visible en Configuracion.

### Borrado transaccional

- `delete_my_account_data()` se ejecuta con `security definer`, pero falla si `auth.uid()` es `null`.
- La funcion solo borra datos del usuario autenticado en la sesion que invoca el RPC.
- Se otorga `grant execute` solo a `authenticated`.

### Storage y Auth

- La limpieza de `storage.objects` se hace con `SUPABASE_SERVICE_ROLE_KEY` para evitar depender de RLS de objetos despues del borrado.
- La eliminacion de `auth.users` usa `supabase.auth.admin.deleteUser(user.id)` desde backend seguro.

## Orden de eliminacion

1. La UI exige que el usuario escriba `ELIMINAR`.
2. La UI muestra confirmacion adicional con `window.confirm`.
3. La API valida sesion activa con cookies de Supabase.
4. La API consulta publicaciones e imagenes propias para reunir rutas de Storage.
5. La API elimina primero los archivos del bucket `post-images`.
6. La API invoca `public.delete_my_account_data()` para borrar en una transaccion:
   - `posts`
   - cascada automatica sobre `post_images`
   - cascada automatica sobre `vehicle_details`
   - `profiles`
7. La API elimina el usuario de `auth.users`.
8. El cliente limpia `localStorage`, cierra sesion y redirige a login con mensaje de exito.

## Riesgos identificados

- `Storage` y `Auth` no participan en la misma transaccion que PostgreSQL.
- Se priorizo eliminar Storage antes de la transaccion SQL para evitar archivos huerfanos.
- Si Storage se limpia pero luego falla el RPC SQL, la cuenta sigue existiendo pero algunas imagenes ya no estaran disponibles. El usuario puede reintentar el flujo.
- Si el RPC SQL termina bien pero falla `auth.admin.deleteUser`, los datos de negocio ya no existen pero la cuenta de acceso sigue viva. La API devuelve error explicito para reintento o resolucion administrativa.
- El flujo depende de `SUPABASE_SERVICE_ROLE_KEY` configurada en el entorno del servidor.

## Archivos involucrados

- `src/app/settings/page.tsx`
- `src/app/api/account/delete/route.ts`
- `src/components/navbar.tsx`
- `src/app/login/page.tsx`
- `docs/sql/20260612_delete_my_account.sql`

## Pruebas realizadas

### Validacion local de archivos

- Verificacion de errores en `src/app/api/account/delete/route.ts`: sin errores.
- Verificacion de errores en `src/app/login/page.tsx`: sin errores.

### Validacion requerida del proyecto

- `npm run build`
- `npx tsc --noEmit`

Registrar abajo el resultado real de cada corrida en el entorno antes de desplegar.

## Checklist manual sugerido

- Crear usuario nuevo y acceder a `Configuracion`.
- Verificar que el boton `Eliminar mi cuenta` esta deshabilitado hasta escribir `ELIMINAR`.
- Confirmar que cancelar el `window.confirm` no modifica datos.
- Confirmar que un usuario con publicaciones elimina:
  - perfil visible
  - publicaciones en feed y detalle
  - filas de `post_images`
  - filas de `vehicle_details`
  - imagenes del bucket `post-images`
  - usuario en `auth.users`
- Confirmar que tras borrar la cuenta el navegador redirige a login y muestra `Cuenta eliminada correctamente.`.
- Verificar que una sesion vencida recibe `401` y no dispara borrado.
- Forzar error de entorno sin `SUPABASE_SERVICE_ROLE_KEY` y verificar mensaje controlado.
- Si existen tablas adicionales fuera del repo con `user_id`, validar manualmente que no quedaron registros colgantes.