# 🌍 Marketplace Turístico

> Marketplace de ofertas turísticas al estilo Mil Anuncios, 100% en Cloudflare.
> Agencias de viajes publican sus paquetes. Turistas descubren, comparan y contactan.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE EDGE                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Next.js 14  │  │   Hono.js    │  │   Workers    │      │
│  │   (Pages)    │  │     API      │  │   (Queues)   │      │
│  │              │  │              │  │              │      │
│  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │      │
│  │  │ Portal │  │  │  │ Auth   │  │  │  │ Email  │  │      │
│  │  │Público │  │  │  │Routes  │  │  │  │Consumer│  │      │
│  │  └────────┘  │  │  └────────┘  │  │  └────────┘  │      │
│  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │      │
│  │  │Dashboard│  │  │  │Listings│  │  │  │Notif.  │  │      │
│  │  │Agencia │  │  │  │Routes  │  │  │  │Consumer│  │      │
│  │  └────────┘  │  │  └────────┘  │  │  └────────┘  │      │
│  │  ┌────────┐  │  │  ┌────────┐  │  └──────────────┘      │
│  │  │Dashboard│  │  │  │Admin   │  │                        │
│  │  │  Admin │  │  │  │Routes  │  │                        │
│  │  └────────┘  │  │  └────────┘  │                        │
│  └──────────────┘  └──────────────┘                        │
│         │                 │                                │
│         └────────┬────────┘                                │
│                  ▼                                         │
│  ┌────────────────────────────────────────────┐           │
│  │              DATA LAYER                     │           │
│  │  ┌────────┐ ┌────────┐ ┌────────┐         │           │
│  │  │   D1   │ │   KV   │ │   R2   │         │           │
│  │  │(SQLite)│ │(Cache) │ │(Images)│         │           │
│  │  └────────┘ └────────┘ └────────┘         │           │
│  │  ┌──────────────────────────────────────┐  │           │
│  │  │        Vectorize (AI Search)        │  │           │
│  │  └──────────────────────────────────────┘  │           │
│  └────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, TypeScript |
| **API** | Cloudflare Workers + Hono.js |
| **Base de datos** | Cloudflare D1 (SQLite) + Drizzle ORM |
| **Caché/Sesiones** | Cloudflare KV |
| **Storage** | Cloudflare R2 |
| **Búsqueda** | Cloudflare AI + Vectorize |
| **Colas** | Cloudflare Queues |
| **Pagos** | Stripe |
| **Auth** | JWT (jose) + refresh tokens en KV |
| **Tests** | Vitest + Miniflare |
| **CI/CD** | GitHub Actions |

---

## 📁 Estructura

```
marketplace-turistico/
├── api/                    # Cloudflare Workers API
│   ├── src/
│   │   ├── db/            # Schema Drizzle
│   │   ├── lib/           # Helpers (db, kv, r2, stripe, queue, vectorize)
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── routes/        # 11 routers REST
│   │   └── index.ts       # Entry point Hono
│   ├── wrangler.toml      # Config Workers
│   └── vitest.config.ts   # Tests
├── web/                    # Next.js — Portal Público
│   ├── app/               # App Router (homepage, listados, ficha, agencia)
│   ├── components/        # UI components
│   └── lib/               # Types, utils, mock data
├── dashboard/              # Next.js — Dashboard Agencia/Admin
│   └── app/dashboard/     # (estructura lista, páginas pendientes)
├── integrations/           # Módulos externos
│   ├── stripe/            # Checkout, webhooks, billing
│   ├── ai-search/         # Vectorize embeddings
│   ├── queues/            # Email consumers
│   ├── r2/                # Upload helpers
│   └── kv/                # Cache + rate limiting
├── infra/                  # DevOps
│   ├── scripts/           # setup.sh, deploy-all.sh, seed.sh
│   ├── github/workflows/  # 5 pipelines CI/CD
│   └── wrangler.toml      # Config maestra
├── schema.sql              # Schema D1 completo
└── README.md               # Este archivo
```

---

## ⚡ Setup

### 1. Requisitos
- Node.js 22+
- Wrangler CLI: `npm i -g wrangler`
- Cuenta Cloudflare

### 2. Clonar y instalar
```bash
git clone <repo>
cd marketplace-turistico
npm install
```

### 3. Crear recursos Cloudflare
```bash
bash infra/scripts/setup.sh prod
```
Esto crea: D1, KV (x2), R2, Queues (x2), Vectorize index.

### 4. Configurar secrets
```bash
cd api
wrangler secret put JWT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put RESEND_API_KEY
```

### 5. Migrar base de datos
```bash
npx drizzle-kit migrate
bash infra/scripts/seed.sh
```

### 6. Desarrollo local
```bash
# API
cd api && npm run dev

# Frontend
cd web && npm run dev
```

---

## 🔌 API Endpoints

### Auth
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh token |
| POST | `/auth/logout` | Logout |

### Listings (Ofertas)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/listings` | Listar con filtros |
| GET | `/listings/:slug` | Detalle de oferta |
| POST | `/listings` | Crear (agencia) |
| PUT | `/listings/:id` | Editar (owner/admin) |
| PATCH | `/listings/:id/status` | Moderar (admin) |
| DELETE | `/listings/:id` | Eliminar |

### Agencias
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/agencies` | Listar |
| GET | `/agencies/:slug` | Perfil público |
| POST | `/agencies/register` | Registrar agencia |

### Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users/me` | Perfil |
| GET | `/users/bookmarks` | Favoritos |
| POST | `/users/bookmarks` | Guardar favorito |

### Mensajes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/messages` | Bandeja |
| GET | `/messages/:listingId/:userId` | Conversación |
| POST | `/messages` | Enviar |

### Reviews
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/reviews?listingId=X` | Valoraciones |
| POST | `/reviews` | Crear |

### Admin
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/stats` | Métricas globales |
| GET | `/admin/listings/pending` | Moderación |
| PATCH | `/admin/listings/:id/moderate` | Aprobar/rechazar |
| PATCH | `/admin/agencies/:id/verify` | Verificar licencia |

### Search
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/search?q=keyword` | Búsqueda FTS + semántica |

### Webhooks
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/webhooks/stripe` | Webhooks Stripe |

---

## 🚀 Deploy

### Automático (CI/CD)
Push a `main` → deploy a producción
Push a `develop` → deploy a staging

### Manual
```bash
bash infra/scripts/deploy-all.sh
```

---

## 🔐 Variables de Entorno

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `JWT_SECRET` | Secreto para firmar tokens (min 32 chars) | ✅ |
| `STRIPE_SECRET_KEY` | API key de Stripe | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Secret para verificar webhooks | ✅ |
| `RESEND_API_KEY` | API key para emails | ⚠️ |
| `CLOUDFLARE_API_TOKEN` | Para CI/CD | ⚠️ |
| `CLOUDFLARE_ACCOUNT_ID` | Para CI/CD | ⚠️ |

---

## 💰 Planes de Monetización

| Plan | Precio | Listings | Destacados | Estadísticas |
|------|--------|----------|------------|--------------|
| **Básico** | 29€/mes | 5 | 0 | ❌ |
| **Profesional** | 79€/mes | 20 | 3 | ✅ |
| **Agencia** | 199€/mes | ∞ | ∞ | ✅ + Premium |

**Extras:**
- Destacado 7 días: 9€
- Destacado 30 días: 29€

---

## 🗺️ Roadmap

- [x] Schema D1 completo con FTS5
- [x] API REST con auth JWT
- [x] Stripe integrado (checkout + webhooks)
- [x] Infraestructura Cloudflare
- [x] CI/CD pipelines
- [x] Portal público (homepage, listados, ficha)
- [ ] Dashboard agencia (publicar, estadísticas, mensajes)
- [ ] Dashboard admin (moderación, métricas)
- [ ] Email templates completos
- [ ] Tests E2E
- [ ] PWA / App móvil

---

## 📄 Licencia

MIT — Libre para usar, modificar y comercializar.

---

_Creado con 🔥 por el Escuadrón TECNOCLAW_ 🫡
