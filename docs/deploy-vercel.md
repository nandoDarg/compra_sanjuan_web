# Deploy MVP en Vercel (Supabase)

Este checklist deja el marketplace online y estable sin agregar features nuevas.

## Estado de referencia (Junio 2026)

- Produccion estable: `https://comprasanjuanwebvercel.vercel.app`
- Repositorio oficial conectado en Vercel: `nandoDarg/tratohechoSJ`
- No usar repos espejo para deploy.

## 1) Crear proyecto en Vercel

1. Entra a Vercel Dashboard.
2. Click en **Add New... > Project**.
3. Importa **solo** este repositorio: `nandoDarg/tratohechoSJ`.
4. Framework detectado: **Next.js**.
5. Root directory: deja el directorio actual del proyecto.

## 2) Variables de entorno (obligatorias)

Agrega estas variables en **Project Settings > Environment Variables** para:
- Production
- Preview
- Development

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zllxrmugjrfqclteftaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_UVXrQT84AIQfOF2Hnu3lhw_7rK6BKm-
NEXT_PUBLIC_POSTHOG_KEY=<tu-posthog-project-api-key>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Notas:
- No incluyas `/rest/v1` en `NEXT_PUBLIC_SUPABASE_URL`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` es clave publica para cliente web.

## 3) Build production (ya verificado)

Build local exitoso:
- `next build` compila OK
- Rutas app router detectadas: `/`, `/post/[id]`, `/create-post`, `/login`, `/register`, `/my-posts`, `/my-posts/[id]/edit`

## 4) Deploy

1. Click en **Deploy**.
2. Espera a que finalice el build.
3. Copia la URL publica de Vercel (ejemplo: `https://tu-proyecto.vercel.app`).

## 5) Validacion en produccion

### Auth (login/register)

1. Abre `https://tu-proyecto.vercel.app/register`.
2. Crea usuario de prueba.
3. Abre `https://tu-proyecto.vercel.app/login`.
4. Inicia sesion.
5. Verifica que aparezca navbar autenticada y acceso a publicar.

### Upload de imagenes y posts

1. Abre `https://tu-proyecto.vercel.app/create-post`.
2. Completa formulario y sube varias imagenes.
3. Publica.
4. Verifica que:
   - la publicacion aparece en `/`
   - la galeria de imagenes carga correctamente
   - filtros y busqueda siguen funcionando

### Validacion especifica de vehiculos

1. Publica en categoria `Autos`, `Camionetas`, `Motos`, `Camiones` o `Utilitarios`.
2. Completa ficha tecnica vehicular.
3. Verifica en `/post/[id]` que la ficha se renderice correctamente.

### Validacion de analytics

1. Realiza login y crea una publicacion.
2. Abre un detalle y presiona WhatsApp/Compartir.
3. Verifica eventos en PostHog.

## 6) Requisitos Supabase para que funcione en produccion

Confirma en Supabase:

1. Tabla `posts` creada con RLS.
2. Tabla `post_images` creada con RLS.
3. Tabla `vehicle_details` creada con RLS.
4. Bucket `post-images` existe y es publico.
5. Politicas de Storage y politicas de tablas aplicadas (ver `docs/database.md`).

## 7) Troubleshooting rapido

### Error de auth o requests fallidos
- Revisar que ambas env vars esten cargadas en Production.
- Hacer **Redeploy** luego de cambiar variables.

### Error subiendo imagen
- Verificar bucket `post-images` y politicas `insert/select`.
- Confirmar que el usuario este autenticado.

### Build falla en Vercel
- Revisar logs del deploy en Vercel.
- Confirmar que la version de Next en `package.json` siga en `16.2.6`.

## 8) Post-deploy recomendado

1. Agregar dominio custom (si aplica).
2. Activar Vercel Analytics (opcional).
3. Guardar URL de produccion en `docs/roadmap.md`.

## 9) Higiene de setup (obligatorio)

1. Mantener una unica fuente de despliegue: `nandoDarg/tratohechoSJ`.
2. No usar repos espejo para Vercel (evita desfasajes de rutas como `/my-posts`).
3. Si hubo relink de repositorio en Vercel, disparar un deploy nuevo para validar la version correcta.
