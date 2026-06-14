## Plan: Confirmacion de email

Implementar la confirmacion de email para usuarios nuevos usando Supabase como fuente de verdad, con un callback dedicado para completar la verificacion, un mensaje claro de registro pendiente, y ajustes en login/reenvio para que el flujo sea comprensible y recuperable sin friccion.

**Steps**
1. Definir el flujo de verificacion y el destino final de los enlaces de Supabase, tomando como base el comportamiento actual de `src/app/register/page.tsx` y `src/app/login/page.tsx`.
2. Crear una ruta de callback de auth para procesar el `code` de Supabase y terminar la sesion verificada antes de redirigir al usuario. *Depende de 1*
3. Actualizar el registro para que el alta siempre deje claro que la cuenta queda pendiente de confirmacion por email y apunte el correo de verificacion al callback nuevo. *Depende de 1 y 2*
4. Actualizar login para que el reenvio de confirmacion use el mismo callback y para mostrar estados de error/pendiente mas precisos cuando el email no este confirmado. *Depende de 1 y 2*
5. Ajustar la capa de rutas publicas y proteccion de acceso para incluir el flujo de confirmacion como parte de auth publica, evitando redirecciones involuntarias al login. *Depende de 2*
6. Revisar y, si hace falta, ampliar el mapeo de errores de auth para distinguir mejor confirmacion pendiente, token invalido o enlace expirado. *En paralelo con 3 y 4*
7. Validar el flujo end-to-end: registro nuevo, llegada del email, click del enlace, aterrizaje en callback, login habilitado solo tras confirmar, y reenvio de confirmacion. *Depende de 2 a 5*
8. Actualizar el contexto de continuidad y, si corresponde, la documentacion de despliegue o onboarding para dejar registrado el nuevo flujo. *Depende de 7*

**Relevant files**
- `src/app/register/page.tsx` - alta de usuario, mensaje post-signup y redirect del email.
- `src/app/login/page.tsx` - inicio de sesion, reenvio de confirmacion y mensajes de error.
- `src/app/auth/callback/route.ts` - nueva ruta recomendada para intercambiar el `code` de Supabase y cerrar el flujo de verificacion.
- `src/components/app-shell.tsx` - lista de rutas publicas y guard de redireccion.
- `src/components/navbar.tsx` - si se quiere tratar la ruta de auth como parte del conjunto publico.
- `src/lib/auth-errors.ts` - mensajes de error amigables para confirmacion pendiente o enlace invalido.
- `src/components/auth-provider.tsx` - lectura de sesion tras el callback y sincronizacion de estado de usuario.
- `docs/deploy-vercel.md` - si hace falta documentar variables o redirect URLs de Supabase.

**Verification**
1. Registrar un usuario nuevo y confirmar que el alta no permite acceso inmediato si Supabase exige verificacion.
2. Abrir el enlace de confirmacion del correo y verificar que la ruta callback completa la sesion y redirige al destino esperado.
3. Intentar iniciar sesion antes de confirmar y comprobar que el mensaje indica que falta confirmar el email.
4. Probar el reenvio de confirmacion desde login y confirmar que el email nuevo llega con el redirect correcto.
5. Validar que `/login`, `/register` y la ruta nueva de callback no queden bloqueadas por los guards de auth.
6. Ejecutar validacion tecnica final con `get_errors` en los archivos tocados y una prueba manual en `localhost`.

**Decisions**
- Recomendacion principal: usar `src/app/auth/callback/route.ts` como punto unico de retorno de Supabase, en vez de redirigir directamente a `/login`.
- No agregar una columna nueva en base de datos para confirmacion de email; usar el estado nativo de Supabase (`email_confirmed_at` / sesion autentica) como fuente de verdad.
- Mantener la experiencia de registro con un mensaje inmediato de "cuenta creada, revisa tu email" y no forzar login hasta que el usuario confirme.
- Considerar el flujo de confirmacion como publico, pero no autentificado, para que el callback pueda resolver la sesion sin pelear con los guards.

**Further Considerations**
1. Conviene que el correo de Supabase apunte a `auth/callback` con un redirect final configurable, o prefieres mantener el retorno a `/login` y resolver desde alli?
2. Si quieres, el siguiente paso puede incluir una pagina intermedia de "Email enviado" para hacer mas explicito el estado pendiente.
3. La validacion final deberia hacerse tambien con un usuario real de Supabase, porque en local el comportamiento de entrega de emails depende de la configuracion SMTP.
