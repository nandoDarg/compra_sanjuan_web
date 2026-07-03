# BRAND GUIDELINES - tratohechoSJ

Updated: 2026-05-29

## 1. Brand intent

tratohechoSJ must feel:
- local but professional
- modern but warm
- minimal but clear
- startup-grade trust for everyday buying and selling

Visual direction references:
- Airbnb: trust + spacing clarity
- Wallapop: marketplace practicality
- Facebook Marketplace: fast scanning
- Linear: visual precision and hierarchy
- Notion: calm legibility
- Stripe: polished gradients and confidence cues

## 2. Color system

Core palette:
- `--brand-primary`: `#0B7A75`
- `--brand-primary-strong`: `#075E5A`
- `--brand-secondary`: `#1D3147`
- `--brand-accent`: `#FF7A1A`
- `--brand-accent-soft`: `#FFF0E6`

Neutrals:
- `--background`: `#F4F1EA`
- `--background-elevated`: `#FFFFFF`
- `--background-muted`: `#ECE6DB`
- `--foreground`: `#102033`
- `--foreground-muted`: `#4F6275`
- `--line`: `#D9D4C8`
- `--line-strong`: `#B7B0A1`

Feedback:
- `--success`: `#18794E`
- `--danger`: `#B3261E`

Contrast rules:
- Primary text always over light surfaces.
- Accent color reserved for conversion or visual cue points.
- Never use accent as long text color.

## 3. Typography

Fonts:
- Body/UI: Plus Jakarta Sans
- Headlines/brand: Space Grotesk
- Code/mono: Geist Mono

Scale (responsive clamp in globals.css):
- H1: brand hero and key pages
- H2: sections and panel titles
- H3: card and module headers
- Body: regular 14-16px visual rhythm
- Small/meta: 11-12px uppercase labels

Hierarchy rules:
- Title > Price > Description > Metadata
- Price uses display emphasis for quick scan.
- Metadata must stay muted (`--foreground-muted`).

## 4. Logo system

Primary assets:
- `public/logo-navbar.svg` (source of truth; the icon-only mark and every favicon/touch-icon are generated from it via `scripts/generate-icons.ts`)
- `public/icon.svg` (generated compact mark)
- `public/favicon.ico`, `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/apple-touch-icon.png` (generated)

Usage:
- Navbar desktop: `logo-navbar.svg` (full wordmark lockup).
- Navbar mobile / compact use (buttons, badges, empty states, image placeholders): `icon.svg`.
- Browser tabs: `favicon.ico` + `favicon-16x16.png` / `favicon-32x32.png`.
- Apple touch icon: `apple-touch-icon.png`.

Any other logo/icon file in `public/` is not wired into the app; do not reintroduce assets there without also wiring them into the code that would render them.

Do not:
- stretch logos
- recolor logo outside token palette
- place logo over low-contrast backgrounds

## 5. Component language

Global component classes:
- panel: `.thsj-panel`
- card: `.thsj-card`
- buttons: `.thsj-btn`, `.thsj-btn-primary`, `.thsj-btn-secondary`, `.thsj-btn-ghost`, `.thsj-btn-danger`
- input/select/textarea: `.thsj-input`
- chips: `.thsj-chip`

Component rules:
- Radius: soft and modern (`--radius-md` to `--radius-xl`).
- Shadows: subtle by default, stronger on hover.
- Hover: slight lift (`translateY`) only, no heavy motion.
- Inputs: high clarity on focus with visible focus ring.

## 6. Spacing and layout

Spacing principles:
- keep major sections separated by 24px+ on desktop
- mobile-first compact spacing with readable breathing room
- avoid dense blocks without visual separators

Grid behavior:
- cards flow 1/2/3/4 columns responsive
- controls stack naturally on small screens

## 7. Navigation and trust cues

Navigation must:
- keep identity always visible
- keep primary actions obvious (Publicar, Registro)
- use consistent visual states for logged vs logged-out users

Trust cues:
- strong contrast in headings
- clean borders and predictable spacing
- clear CTA hierarchy (primary > secondary > ghost)

## 8. Android visual guidelines

Splash:
- file: `android/app/src/main/res/drawable/splash_brand.xml`
- centered mark: `android/app/src/main/res/drawable/logo_splash.xml`
- clean background with no visual noise

Adaptive app icon:
- foreground: `android/app/src/main/res/drawable/ic_launcher_foreground.xml`
- background color: `#F4F1EA`
- modern minimal mark with high recognizability

## 9. Tone and UX/UI principles

Tone:
- direct, clear, local
- no decorative complexity
- no visual clutter

UX/UI principles:
- scanability first
- action clarity second
- decorative polish third
- always prioritize legibility and trust

## 10. Performance and implementation constraints

Must keep:
- Tailwind
- current architecture and routes
- mobile-first responsive behavior
- lightweight rendering

Must avoid:
- heavy animation libraries
- oversized image assets
- deep nesting and style duplication
- unnecessary UI complexity
