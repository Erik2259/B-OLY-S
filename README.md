# 🍦 Boly's — Menú Digital

Menú digital para **Boly's**, negocio de bolis artesanales en Tulancingo, Hidalgo.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS v4** + Framer Motion
- **Supabase** (PostgreSQL + Storage + Auth)

## Funcionalidades

### Menú Público (`/`)
- Grid de productos con filtros por categoría (Agua, Leche, Gourmet)
- Animaciones fluidas con Framer Motion
- Botón de "Pedir" que abre WhatsApp con mensaje pre-armado
- 100% Mobile-First, ultrarrápido

### Panel Admin (`/admin`)
- CRUD completo de sabores
- Subida de imágenes a Supabase Storage
- Toggle de disponibilidad
- Protegido por autenticación

## Setup

### 1. Clonar e instalar

```bash
git clone https://github.com/TU_USUARIO/B-OLY-S.git
cd B-OLY-S
npm install
```

### 2. Variables de entorno

Crea `.env.local` basado en `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://drlyuljeuctzydpomvpm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_WHATSAPP_NUMBER=52XXXXXXXXXX
```

### 3. Crear usuario admin en Supabase

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Authentication → Users → Add User
3. Ingresa email y contraseña para tu mamá

### 4. Correr en desarrollo

```bash
npm run dev
```

## Deploy en Vercel

1. Conecta tu repo de GitHub en [vercel.com](https://vercel.com)
2. Agrega las variables de entorno del `.env.local`
3. Deploy automático en cada push

## Estructura

```
src/
├── app/
│   ├── page.tsx          # Menú público
│   ├── layout.tsx        # Layout raíz
│   ├── globals.css       # Estilos + Tailwind
│   ├── admin/page.tsx    # Panel CRUD
│   └── login/page.tsx    # Login admin
├── components/
│   ├── Header.tsx        # Header con logo
│   ├── CategoryFilter.tsx # Filtros de categoría
│   └── ProductCard.tsx   # Tarjeta de producto
├── lib/
│   └── supabase.ts       # Cliente Supabase
└── types/
    └── index.ts          # TypeScript types
```

---

Hecho con ❤️ en Tulancingo, Hidalgo 🇲🇽
