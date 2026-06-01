# DESIGN SYSTEM
Marketplace P2P mobile-first para San Juan, Argentina (con proyección regional)

Versión: 1.0  
Fecha: Mayo 2026  
Estado: Documento rector de marca, UX/UI y sistema visual

---

## Contexto y criterio de diseño
Este documento define el estándar visual y de experiencia para un marketplace P2P orientado a conversión real (publicar, descubrir, contactar), con foco en usuarios no técnicos, uso intensivo desde móvil y expansión por etapas hacia más ciudades y países.

Se construye con base en:
- patrones observados en líderes de marketplace (MercadoLibre, Facebook Marketplace, Wallapop, Airbnb, OLX, Pinterest)
- sistemas de diseño y guías de producto de referencia (Material 3, Apple HIG, Android Design, Atlassian Design)
- arquitectura de componentes y tokens moderna (Tailwind, Radix, Headless UI, shadcn/ui)
- tendencias de producto 2025/2026: simplicidad operativa, confianza visible, velocidad perceptual, y diseño preparado para AI sin perder claridad

---

# 1. BRAND STRATEGY

## 1.1 Personalidad de marca
La marca debe sentirse:
- cercana
- práctica
- confiable
- ágil
- transparente
- local con ambición regional

Arquetipo recomendado: **Guía de barrio + Operador eficiente**.  
No es una marca “fría corporativa”, ni tampoco informal caótica.

## 1.2 Tono visual
- limpio y directo
- poco ornamento
- alto contraste de información
- énfasis en utilidad sobre “efecto wow”
- lenguaje visual de startup madura

## 1.3 Percepción buscada
Cuando una persona abre la app/web debe pensar:
- “Entiendo esto en 3 segundos”
- “Acá no me voy a perder”
- “Puedo vender rápido”
- “Puedo comprar con confianza”

## 1.4 Emociones que debe transmitir
- control
- claridad
- tranquilidad
- oportunidad
- cercanía

## 1.5 Posicionamiento
**El marketplace local más simple para convertir interés en contacto real.**

Promesa central:
- descubrimiento rápido
- publicación sin fricción
- contacto directo (WhatsApp / chat futuro)

## 1.6 Naming superador (escalable regional)
Opciones evaluadas para marca producto:

### A) Circula
Ventajas:
- comunica economía circular
- corto y memorable
- funciona en español neutro
- apto para narrativa de sostenibilidad

Riesgos:
- puede requerir tagline para explicar “marketplace”

### B) Cerca
Ventajas:
- hiper simple
- foco en proximidad y comunidad
- muy usable en campañas locales

Riesgos:
- nombre genérico, potencial complejidad legal de marca

### C) VendeYa
Ventajas:
- orientado a acción
- alto impacto de conversión
- fácil recordación

Riesgos:
- menos elegante premium, más táctico comercial

### D) Nexo
Ventajas:
- comunica conexión entre personas
- escalable a nuevos verticales
- sonido moderno

Riesgos:
- requiere identidad visual fuerte para diferenciarse

### E) Plaza
Ventajas:
- metáfora clara de mercado local
- culturalmente familiar en LATAM
- flexible para estrategia regional

Riesgos:
- necesita apellido o descriptor en algunas geografías

### Recomendación final de naming (orden)
1. Circula
2. Nexo
3. Plaza

Tagline sugerido:
- “Publicá hoy. Vendé cerca.”
- “Lo que buscás, más cerca.”
- “Tu mercado local en minutos.”

---

# 2. VISUAL IDENTITY

## 2.1 Dirección visual
Estética: **minimalista cálida + confianza financiera + velocidad de uso**.

No usar:
- gradientes estridentes permanentes
- exceso de color por categoría
- saturación de badges/promos

## 2.2 Paleta de color

### Primarios
- Primary 50: #ECF8F7
- Primary 100: #D2F0ED
- Primary 300: #77D4CB
- Primary 500: #14B8A6
- Primary 600: #0D9488
- Primary 700: #0F766E
- Primary 900: #134E4A

Uso:
- CTAs principales
- foco activo
- estados positivos de flujo (éxito operativo)

### Secundarios (neutros de interfaz)
- Slate 25: #FCFCFD
- Slate 50: #F8FAFC
- Slate 100: #F1F5F9
- Slate 200: #E2E8F0
- Slate 400: #94A3B8
- Slate 600: #475569
- Slate 700: #334155
- Slate 900: #0F172A

Uso:
- estructura, fondos, tipografía, bordes

### Accent (acciones de descubrimiento/comercial)
- Accent Amber 400: #FBBF24
- Accent Amber 500: #F59E0B
- Accent Coral 500: #F97316

Uso:
- elementos de oportunidad
- destacados de precio/promoción
- nunca para texto largo

### Estados
- Success: #16A34A / bg #DCFCE7
- Warning: #D97706 / bg #FEF3C7
- Error: #DC2626 / bg #FEE2E2
- Info: #2563EB / bg #DBEAFE

### Fondos
- App background: #F8FAFC
- Surface base: #FFFFFF
- Surface elevated: #FFFFFF + shadow suave
- Surface subtle: #F1F5F9

## 2.3 Compatibilidad light/dark
Regla de negocio:
- Fase actual: Light-first optimizada para daylight y gama media de celulares.
- Dark mode: soportado por tokens desde día 1, activación gradual.

Dark tokens base:
- bg: #0B1220
- surface: #111827
- surface elevated: #1F2937
- text primary: #F8FAFC
- text secondary: #CBD5E1
- border: #334155
- primary dark mode: #2DD4BF

## 2.4 Tipografía recomendada
Stack principal:
- Inter (web/app)
- fallback: system-ui, -apple-system, Segoe UI, Roboto, sans-serif

Alternativa con más personalidad:
- Sora para headings + Inter para body

## 2.5 Escala tipográfica
- Display L: 40/48, 700
- Display M: 32/40, 700
- H1: 28/36, 700
- H2: 24/32, 700
- H3: 20/28, 600
- Title: 18/26, 600
- Body L: 16/24, 400
- Body M: 15/22, 400
- Body S: 14/20, 400
- Caption: 12/16, 500
- Label CTA: 15/20, 600

Jerarquía:
- máximo 3 niveles visibles simultáneos por pantalla
- números de precio con mayor peso visual que metadata

---

# 3. DESIGN PRINCIPLES

## 3.1 Spacing system (base 4)
Escala:
- 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80

Reglas:
- padding interno de card: 12 o 16
- separación entre cards en feed: 12
- separación entre secciones: 24-32
- evitar valores “random” fuera de escala

## 3.2 Grid system
Mobile-first:
- 4 columnas en móvil con gutters de 12
- 8 columnas en tablet
- 12 columnas en desktop

Ancho de contenido:
- mobile: full width con padding 16
- desktop: max-width 1200 para feed principal

## 3.3 Border radius
- xs: 6
- sm: 8
- md: 12
- lg: 16
- xl: 20
- pill: 999

Uso recomendado:
- inputs/botones: 10-12
- cards: 14-16
- sheets/modals: 20 top corners (mobile sheet)

## 3.4 Shadows
Sombras suaves y pocas capas:
- shadow-sm: 0 1px 2px rgba(15,23,42,0.06)
- shadow-md: 0 4px 12px rgba(15,23,42,0.08)
- shadow-lg: 0 10px 24px rgba(15,23,42,0.10)

Regla:
- usar contraste de superficie primero, sombra después

## 3.5 Hover/focus/active
- Hover: cambio de elevación + leve ajuste de bg
- Active: escala 0.98 en elementos táctiles puntuales
- Focus visible: ring 2px primary 500
- Disabled: opacidad 45-55% + cursor not-allowed

## 3.6 Motion y transiciones
Timing:
- microinteracciones: 120-180ms
- panel/sheet: 220-280ms
- page transition: 220ms máximo

Easing:
- standard: cubic-bezier(0.2, 0.8, 0.2, 1)

Principio:
- animar para orientar, no para decorar

## 3.7 Jerarquía visual
- Prioridad 1: imagen + título + precio
- Prioridad 2: ubicación + fecha + estado
- Prioridad 3: info secundaria (vista, guardado, etc.)

## 3.8 Filosofía de whitespace
- “Respirar para decidir rápido”
- evitar pantallas con densidad visual alta en primera vista
- priorizar escaneo vertical claro

---

# 4. COMPONENT SYSTEM

## 4.1 Navbar
Desktop:
- logo izquierda
- buscador centrado
- acciones y perfil derecha

Mobile:
- top app bar compacta
- búsqueda sticky bajo top bar (según contexto)
- bottom nav persistente para core actions

## 4.2 Buttons
Variantes:
- Primary (acción principal)
- Secondary (acción de soporte)
- Ghost (acción secundaria no crítica)
- Danger (acción destructiva)

Tamaños:
- sm 36h
- md 44h
- lg 48h

Regla mobile:
- CTA principal nunca menor a 44px altura

## 4.3 Cards
Card base:
- imagen top ratio 4:3
- cuerpo con título, precio, ubicación
- footer opcional (estado/acciones)

Card de publicación:
- título 2 líneas máx
- precio visible y fuerte
- metadata compacta
- badge discreto (ej: “Nuevo”, “Hoy”)

## 4.4 Filters
- chips horizontales desplazables en mobile
- botón “Filtros” abre bottom sheet
- filtros activos visibles como chips removibles
- botón “Limpiar todo” siempre visible dentro del sheet

## 4.5 Inputs
- label siempre visible
- helper text opcional
- error text debajo con icono
- validación inmediata no intrusiva

## 4.6 Dropdowns
- para desktop, ancho mínimo 220
- para mobile, preferir sheet selector
- cierre automático al seleccionar

## 4.7 Modals y sheets
Regla:
- mobile: usar bottom sheets para selección/configuración
- modal centrado solo para confirmaciones críticas

## 4.8 Skeleton loaders
- cargar layout real, no spinner global
- skeleton de card en feed
- skeleton de detalle en header+bloques

## 4.9 Empty states
Cada empty state debe incluir:
- explicación humana
- acción primaria
- acción secundaria opcional

Ejemplos:
- “Todavía no publicaste nada” + “Publicar ahora”
- “No hay resultados con estos filtros” + “Limpiar filtros”

## 4.10 Chips y badges
Chips:
- filtros activos/inactivos
- selección de categorías

Badges:
- “Nuevo”, “Destacado”, “Con envío”, “Verificado”
- evitar más de 2 badges por card

## 4.11 Tabs
- máximo 4 tabs visibles en mobile
- overflow horizontal si es necesario
- indicador de tab activo claro

## 4.12 Comportamiento responsive
- mobile: prioridad absoluta de flujo vertical
- tablet: doble columna en feed si densidad lo permite
- desktop: sidebar de filtros + grid principal

## 4.13 UX guidelines del sistema
- una acción primaria por pantalla
- evitar decisiones simultáneas en onboarding
- mensajes de error siempre accionables
- estados de carga/pre-error/éxito explícitos

---

# 5. MARKETPLACE UX RULES

## 5.1 Sensación al navegar
Debe sentirse:
- rápido
- cercano
- predecible
- confiable

## 5.2 Maximizar exploración
- búsqueda visible siempre
- filtros por chips simples primero, avanzados después
- related items en detalle
- scroll infinito con hitos visuales (no lista plana infinita sin señal)

## 5.3 Aumentar confianza
- ubicación visible
- fecha de publicación clara
- estado del producto legible
- señales de perfil confiable (futuro: verificación progresiva)
- políticas y seguridad accesibles desde puntos críticos

## 5.4 Aumentar conversión
- precio visible desde feed
- CTA de contacto persistente en detalle
- fricción mínima en publicar
- formularios por bloques simples

## 5.5 Presentar publicaciones
Orden recomendado de información:
1) imagen
2) precio
3) título
4) ubicación
5) fecha/estado

## 5.6 Evitar saturación visual
- no más de 2 colores de énfasis por pantalla
- no más de 2 badges por card
- no usar banners masivos en home en fase temprana

## 5.7 Optimizar mobile
- thumb-friendly actions (zona inferior)
- filtros en sheet
- botones y chips con target mínimo 44x44

---

# 6. HOMEPAGE STRATEGY

## 6.1 Estructura conceptual
1. Header compacto
2. Buscador principal
3. Carrusel corto de categorías clave
4. Filtros rápidos (chips)
5. Feed principal
6. Sección de confianza ligera (seguridad, soporte)

## 6.2 Hero section (en homepage marketplace)
No hero publicitario grande.  
Se recomienda “hero funcional”:
- búsqueda protagonista
- copy corto de valor
- CTA Publicar

Ejemplo de copy:
- “Comprá y vendé en San Juan, sin vueltas.”

## 6.3 Categorías
- top 8 iniciales según demanda local
- ícono + nombre corto
- botón “Ver todas”

## 6.4 Feed
- card uniforme
- intercalar módulos de descubrimiento cada N items
- preservar continuidad visual

## 6.5 CTA principales
- Publicar (primary)
- Contactar por WhatsApp (primary en detalle)
- Guardar (secondary)

## 6.6 Home para crecimiento
- preparada para personalización por ciudad
- slot para recomendaciones futuras
- slot para campañas locales (sin romper limpieza)

---

# 7. MOBILE APP DESIGN RULES

## 7.1 Safe areas
- respetar notch y barras del sistema
- no pegar acciones críticas al borde inferior

## 7.2 Touch targets
- mínimo 44x44
- ideal 48x48 para acciones core

## 7.3 Gestos
- swipe para volver donde el sistema lo soporte
- pull-to-refresh en feed
- scroll con scroll restoration consistente

## 7.4 Bottom navigation
Tabs recomendadas fase 1:
- Inicio
- Buscar
- Publicar
- Mis publicaciones
- Perfil

Regla:
- Publicar siempre visible como acción principal

## 7.5 Interacciones mobile
- filtros en bottom sheet
- confirmaciones destructivas con modal breve
- toasts para feedback rápido

## 7.6 App-like feeling
- cabeceras compactas
- transiciones cortas y fluidas
- skeletons en lugar de pantallas en blanco

---

# 8. TAILWIND DESIGN TOKENS

## 8.1 Tokens de color (recomendados)
```css
:root {
  --brand-50: #ECF8F7;
  --brand-100: #D2F0ED;
  --brand-500: #14B8A6;
  --brand-600: #0D9488;
  --brand-700: #0F766E;
  --brand-900: #134E4A;

  --slate-25: #FCFCFD;
  --slate-50: #F8FAFC;
  --slate-100: #F1F5F9;
  --slate-200: #E2E8F0;
  --slate-400: #94A3B8;
  --slate-600: #475569;
  --slate-900: #0F172A;

  --success: #16A34A;
  --warning: #D97706;
  --error: #DC2626;
  --info: #2563EB;
}
```

## 8.2 Escala de spacing
```txt
0 1 2 3 4 5 6 8 10 12 16 20
=> 0 4 8 12 16 20 24 32 40 48 64 80 px
```

## 8.3 Radios
```txt
rounded-sm = 8px
rounded-md = 12px
rounded-lg = 16px
rounded-xl = 20px
rounded-full = 999px
```

## 8.4 Tipografía (tailwind extension sugerida)
```js
fontSize: {
  'display-lg': ['40px', { lineHeight: '48px', fontWeight: '700' }],
  'display-md': ['32px', { lineHeight: '40px', fontWeight: '700' }],
  'h1': ['28px', { lineHeight: '36px', fontWeight: '700' }],
  'h2': ['24px', { lineHeight: '32px', fontWeight: '700' }],
  'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
  'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
  'body-md': ['15px', { lineHeight: '22px', fontWeight: '400' }],
  'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
  'caption': ['12px', { lineHeight: '16px', fontWeight: '500' }],
}
```

## 8.5 Container system
```txt
mobile: px-4
tablet: px-6
desktop: px-8 + max-w-[1200px] mx-auto
```

## 8.6 Clases recomendadas
- cards: bg-white border border-slate-200 rounded-2xl shadow-sm
- cta primary: bg-brand-600 hover:bg-brand-700 text-white rounded-xl h-11
- inputs: border-slate-300 focus:ring-2 focus:ring-brand-500 rounded-xl h-11
- chips: rounded-full px-3 py-1.5 text-sm border border-slate-300
- sheets: rounded-t-3xl p-4 shadow-lg

---

# 9. COPILOT UI/UX RULES
Reglas explícitas para futuras generaciones de código

## 9.1 Reglas de consistencia
- Nunca usar spacing fuera de la escala definida
- Siempre mobile-first
- No mezclar radios arbitrarios
- No usar más de dos sombras por pantalla

## 9.2 Reglas de jerarquía
- Precio y título siempre por encima de metadata
- CTA principal único y visible
- Máximo 2 badges por card

## 9.3 Reglas de interacción
- Evitar modals innecesarios; preferir sheets en mobile
- Siempre mostrar estados de carga con skeleton
- Feedback inmediato en acciones (toast o estado inline)

## 9.4 Reglas de accesibilidad
- Contraste AA mínimo
- Targets táctiles de 44x44 o más
- Focus visible siempre
- No depender solo del color para comunicar estado

## 9.5 Reglas visuales startup
- Mantener estética limpia y alta legibilidad
- Evitar saturación visual
- Evitar microanimaciones decorativas sin función
- Priorizar velocidad perceptual

## 9.6 Reglas de producto para marketplace
- No ocultar ubicación y fecha
- No ocultar precio en feed
- Contactar vendedor debe requerir pocos pasos
- Publicar debe sentirse posible en menos de 2 minutos

---

# 10. DESIGN REFERENCES
Referencias reales y por qué aplican

## 10.1 Marketplaces
- MercadoLibre: https://www.mercadolibre.com.ar/
  - aporta patrones de categorías, confianza, medios de pago y señalización de seguridad
- Facebook Marketplace: https://www.facebook.com/marketplace/
  - referencia de descubrimiento local y navegación centrada en inventario
- Wallapop: https://www.wallapop.com/ y https://about.wallapop.com/en/
  - fuerte posicionamiento en segunda mano, cercanía y comunidad
- Airbnb: https://www.airbnb.com/
  - excelencia en arquitectura de búsqueda y densidad visual controlada
- OLX: https://olx.com.ar/
  - referencia regional histórica de clasificados de alto volumen
- Pinterest: https://ar.pinterest.com/
  - inspiración para discovery visual, exploración y taxonomías por interés

## 10.2 Design systems y fundamentos
- Material 3: https://m3.material.io/
  - tokens, componentes adaptativos, motion y expresividad usable
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
  - jerarquía, consistencia y calidad de interacción
- Android Design: https://developer.android.com/design
  - layouts adaptativos, calidad técnica y diseño para gran escala
- Atlassian Design: https://atlassian.design/
  - diseño de sistema a nivel producto empresarial con tokens claros

## 10.3 Librerías y arquitectura UI
- Tailwind Colors/Tokens: https://tailwindcss.com/docs/customizing-colors
  - estrategia práctica para tokens y dark mode
- Headless UI: https://headlessui.com/
  - componentes accesibles sin imponer estilo
- Radix Themes: https://www.radix-ui.com/themes
  - base de componentes accesibles y consistentes
- shadcn/ui: https://ui.shadcn.com/
  - patrón moderno de “build your own design system”
- Refactoring UI: https://www.refactoringui.com/
  - tácticas concretas de jerarquía, spacing, color y claridad visual

---

# 11. FUTURE EVOLUTION

## 11.1 Camino a app Android/iOS
Fase 1:
- consolidar design tokens compartidos web/app
- validar navegación bottom-first
- endurecer reglas de safe area y gestos

Fase 2:
- patrones nativos por plataforma sin romper identidad
- librería de componentes versionada

Fase 3:
- modo oscuro completo
- componentes avanzados de confianza (verificación, reputación)

## 11.2 Expansión regional
El sistema debe soportar:
- variación por ciudad/país (copys, moneda, categorías)
- localización y formatos regionales
- campañas locales sin fragmentar marca

## 11.3 Funcionalidades premium futuras
Diseño preparado para:
- publicaciones destacadas
- suscripciones de vendedor
- analytics para vendedores
- reputación y credenciales de confianza

## 11.4 Construcción de marca fuerte
Acciones recomendadas:
- consistencia extrema en iconografía y tono visual
- sistema de ilustraciones propio en fase 2
- lenguaje fotográfico local auténtico
- guideline de comunicación (microcopy) alineada a la marca

---

## Criterios de aceptación para diseño en este producto
Un release visual se considera aprobado si:
- se entiende en menos de 5 segundos en mobile
- no rompe los tokens del sistema
- mejora o mantiene conversión en flujo clave
- cumple accesibilidad base
- sostiene coherencia con personalidad de marca

---

## Resumen ejecutivo
Este design system define una base realista y ejecutable para un marketplace startup serio:
- marca clara y escalable
- sistema visual consistente
- componentes listos para producción
- reglas UX orientadas a conversión y confianza
- base técnica alineada con Tailwind y arquitectura moderna

Es una guía viva: cualquier nueva pantalla debe nacer desde estas reglas, no desde decisiones aisladas.
