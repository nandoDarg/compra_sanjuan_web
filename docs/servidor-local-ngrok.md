# Servidor local y túnel ngrok — tratohechoSJ

Última actualización: 2026-06-12.

---

## 1. Servidor local Next.js

### Arrancar en modo desarrollo

```powershell
# Siempre navegar al directorio del proyecto antes de cualquier comando npm
cd "C:\Users\Lenovo\Documents\05-PROGRAMACION\COMPRAVENTA_SANJUAN\compra_sanjuan_web"
npm run dev
```

> **Error frecuente:** Si ves `Could not read package.json` o el path dice `C:\WINDOWS\system32`,
> la terminal no está en el directorio del proyecto. Ejecutá el `cd` de arriba primero.

Levanta Next.js en `http://0.0.0.0:3000` (accesible desde la red local).
Incluye hot reload, source maps y modo de depuración activo.

### Arrancar en modo producción local

```powershell
npm run build
npm run start
```

Útil para reproducir bugs que sólo aparecen en build optimizado.

### Ver logs en tiempo real (ya incluido en `npm run dev`)

Cualquier `console.log` del servidor aparece en la terminal que corre `npm run dev`.

### Detener el servidor

```
Ctrl + C
```

---

## 2. Red local y dispositivos físicos

El flag `-H 0.0.0.0` en `npm run dev` ya está configurado en `package.json`, por lo que el servidor es accesible desde cualquier dispositivo en la misma red WiFi:

```
http://<IP-LAN-de-tu-PC>:3000
```

Para ver tu IP:

```powershell
ipconfig
# buscar "Dirección IPv4" bajo el adaptador WiFi o Ethernet
```

Ejemplo: `http://192.168.1.50:3000`

---

## 3. Túnel ngrok — modo básico

### Prerequisito: instalar ngrok

```powershell
# Opción A: winget (Windows 10/11)
winget install ngrok.ngrok

# Opción B: Chocolatey
choco install ngrok

# Opción C: descarga manual
# https://download.ngrok.com/windows/amd64
# Extraer ngrok.exe y agregar al PATH
```

### Configurar authtoken (una sola vez)

```powershell
ngrok config add-authtoken <TU_AUTHTOKEN>
# El token se guarda en: %USERPROFILE%\AppData\Local\ngrok\ngrok.yml
```

Obtener el authtoken en: https://dashboard.ngrok.com/get-started/your-authtoken

### Abrir túnel rápido sobre el servidor local

```powershell
# Con URL aleatoria (cambia cada vez que reinicias)
ngrok http 3000

# Con dominio estático propio (plan gratuito incluye 1 dominio fijo)
ngrok http 3000 --url https://tu-dominio.ngrok-free.app
```

La URL pública aparece en la salida:

```
Forwarding  https://abcd1234.ngrok-free.app -> http://localhost:3000
```

### Inspección del tráfico (Web Inspector)

```
http://127.0.0.1:4040
```

Muestra todas las requests y responses en tiempo real.
Permite replay de requests individuales sin recargar el cliente.

### Detener el túnel

```
Ctrl + C   (en la terminal donde corre ngrok)
```

---

## 4. Agente ngrok — modo avanzado (decisión de uso para este proyecto)

### ¿Qué es el agente ngrok?

El agente ngrok es el programa de línea de comandos que gestiona los túneles.
Tiene tres modalidades de uso relevantes para TratoHechoSJ:

| Modalidad | Comando clave | Descripción |
|-----------|--------------|-------------|
| Ad-hoc (manual) | `ngrok http 3000` | Túnel mientras dura la sesión de terminal |
| Servicio del SO | `ngrok service install` | Arranca automáticamente con Windows, sobrevive cierres de terminal |
| Múltiples endpoints | `ngrok start --all` | Levanta todos los túneles definidos en `ngrok.yml` |

### Instalar como servicio de Windows (arranque automático)

Útil si necesitás que el túnel esté disponible sin abrir la terminal.

```powershell
# 1. Tener un ngrok.yml configurado, por ejemplo:
#    C:\Users\<usuario>\AppData\Local\ngrok\ngrok.yml

# 2. Instalar el servicio (requiere terminal con privilegios de admin)
ngrok service install --config "C:\Users\<usuario>\AppData\Local\ngrok\ngrok.yml"

# 3. Gestionar el servicio
ngrok service start
ngrok service stop
ngrok service restart
ngrok service uninstall
```

Los logs van al Visor de Eventos de Windows.

### Variables de entorno soportadas por el agente

```powershell
$env:NGROK_AUTHTOKEN = "tu_token"   # equivale a ngrok config add-authtoken
$env:NGROK_API_KEY   = "tu_api_key" # para usar la CLI de la API de ngrok
```

### Ejemplo de ngrok.yml con múltiples endpoints

```yaml
version: "3"
authtoken: <TU_AUTHTOKEN>

endpoints:
  - name: next-dev
    url: https://tu-dominio.ngrok-free.app
    upstream:
      url: http://localhost:3000
```

Iniciar todos los endpoints del archivo:

```powershell
ngrok start --all
# o por nombre:
ngrok start next-dev
```

### Comandos de la CLI de la API

```powershell
# Ver endpoints activos
ngrok api endpoints list

# Ver dominios reservados
ngrok api reserved-domains list
```

---

## 5. ¿Es útil el agente ngrok para TratoHechoSJ?

### Evaluación

| Escenario | ¿Útil? | Modo recomendado |
|-----------|--------|-----------------|
| Probar la app en un celular físico real desde la red local | No hace falta ngrok | `npm run dev` + IP LAN |
| Probar Supabase Auth con `emailRedirectTo` (necesita HTTPS) | ✅ Muy útil | `ngrok http 3000` ad-hoc o dominio fijo |
| Probar la PWA / app Android (Capacitor) apuntando a local | ✅ Muy útil | Dominio fijo ngrok-free para evitar cambiar el `capacitor.config.ts` |
| Compartir una preview con alguien externo sin deployar a Vercel | ✅ Cómodo | `ngrok http 3000` + dominio fijo |
| Recibir webhooks entrantes de PostHog, Supabase o servicios externos | ✅ Necesario | `ngrok http 3000` ad-hoc |
| Dejar el túnel siempre activo sin abrir la terminal | Solo si dejás la PC encendida | Servicio de Windows |

### Caso concreto más valioso: Capacitor + build de debug

`capacitor.config.ts` hoy apunta a Vercel en producción.
Para desarrollo local en el emulador Android o dispositivo físico:

```typescript
// capacitor.config.ts temporal para desarrollo
server: {
  url: 'https://tu-dominio.ngrok-free.app',
  cleartext: false,
}
```

Con esto el APK de debug consume el servidor Next.js local en lugar de la versión desplegada,
sin necesidad de subir a Vercel en cada cambio.

### Caso concreto: probar `/auth/callback` con HTTPS

Supabase requiere que `emailRedirectTo` use HTTPS. En local sin ngrok no podés completar
el flujo de verificación de email. Con ngrok:

```
https://tu-dominio.ngrok-free.app/auth/callback?next=/
```

Esta URL puede configurarse en Supabase → Authentication → URL Configuration → Redirect URLs.

### Recomendación final

- **Plan gratuito** cubre todos los casos del proyecto: 1 dominio estático, requests ilimitadas.
- Usar **modo ad-hoc** (`ngrok http 3000`) para sesiones de trabajo normal.
- Usar **dominio fijo** para el caso de Capacitor y `emailRedirectTo`, así la URL no cambia entre sesiones.
- El **modo servicio de Windows** no agrega valor para este proyecto porque el servidor Next.js igual requiere iniciarse manualmente.

---

## 6. Flujo de trabajo diario recomendado

```powershell
# Terminal 1 — servidor Next.js
npm run dev

# Terminal 2 — túnel ngrok (sólo cuando necesitás HTTPS o acceso externo)
ngrok http 3000 --url https://tu-dominio.ngrok-free.app
```

Inspector de tráfico: http://127.0.0.1:4040

---

## 7. Comandos de Capacitor (Android)

```powershell
# Sincronizar build con el proyecto Android
npm run cap:sync

# Abrir Android Studio
npm run cap:open

# Flujo de build + sync en un paso
npm run build && npm run cap:sync
```

Para desarrollo local con Capacitor, cambiar temporalmente `capacitor.config.ts`
para apuntar al dominio ngrok fijo en lugar de la URL de Vercel.

---

## Referencia rápida

| Acción | Comando |
|--------|---------|
| Dev server | `npm run dev` |
| Build prod | `npm run build` |
| Start prod | `npm run start` |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |
| Túnel básico | `ngrok http 3000` |
| Túnel con dominio fijo | `ngrok http 3000 --url https://tu-dominio.ngrok-free.app` |
| Configurar token ngrok | `ngrok config add-authtoken <TOKEN>` |
| Inspección de tráfico | http://127.0.0.1:4040 |
| Instalar como servicio | `ngrok service install --config <ruta-yml>` |
| Gestionar servicio | `ngrok service start / stop / restart / uninstall` |
