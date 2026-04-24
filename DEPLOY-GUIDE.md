# 🚀 GUÍA DE DEPLOY VISUAL — Marketplace Turístico

> **Para Juanfra**: Esta guía te lleva de **cero a producción** usando solo tu navegador web + terminal básica. No necesitas saber programar.

---

## 📋 REQUISITOS PREVIOS

1. **Cuenta de Cloudflare** (gratis) → https://dash.cloudflare.com/sign-up
2. **Cuenta de Stripe** (modo test primero) → https://stripe.com
3. **Node.js instalado** en tu ordenador → https://nodejs.org (botón verde grande "LTS")
4. **GitHub** (gratis) → https://github.com/signup (para CI/CD automático)

---

## 🗺️ MAPA VISUAL DEL PROCESO

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1 → Crear recursos en Cloudflare Dashboard            │
│  PASO 2 → Subir código a GitHub                             │
│  PASO 3 → Conectar GitHub → Cloudflare (auto-deploy)        │
│  PASO 4 → Configurar Stripe                                   │
│  PASO 5 → Probar que todo funciona                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔷 PASO 1: Crear Recursos en Cloudflare Dashboard

### 1.1 Abre el Dashboard
1. Ve a: **https://dash.cloudflare.com**
2. Haz login con tu cuenta
3. Verás una pantalla con tu dominio (si tienes) o Workers & Pages

### 1.2 Crear D1 Database (Base de Datos)

**URL:** https://dash.cloudflare.com → Workers & Pages → D1

1. En el menú lateral izquierdo, busca **"Workers & Pages"**
2. Dentro, haz click en **"D1"**
3. Verás un botón azul grande: **"Create database"** → Haz click
4. En el campo "Database name", escribe: `marketplace-turistico-db`
5. Haz click en **"Create"**
6. Verás una pantalla de éxito con un **Database ID** (ej: `a1b2c3d4-e5f6-...`)
7. **COPIA ese ID y guárdalo** en un archivo de texto temporal

### 1.3 Crear KV Namespaces (Sesiones + Caché)

**URL:** https://dash.cloudflare.com → Workers & Pages → KV

1. En el menú lateral, haz click en **"KV"**
2. Botón azul **"Create a namespace"**
3. Nombre: `marketplace-sessions` → **Create**
4. Repite: Botón azul **"Create a namespace"**
5. Nombre: `marketplace-cache` → **Create**
6. Verás 2 IDs. **COPIA ambos** y guárdalos

### 1.4 Crear R2 Bucket (Imágenes)

**URL:** https://dash.cloudflare.com → R2

1. En el menú lateral, haz click en **"R2"**
2. Botón azul **"Create bucket"**
3. Bucket name: `marketplace-turistico-assets`
4. Haz click en **"Create bucket"**
5. Ve a la pestaña **"Settings"** del bucket
6. En "Public access", haz click en **"Allow"**
6. **COPIA el Public URL** que aparece (ej: `https://pub-xxx.r2.dev`)

### 1.5 Crear Queues (Colas de Emails)

**URL:** https://dash.cloudflare.com → Workers & Pages → Queues

1. Menú lateral → **"Queues"**
2. Botón **"Create queue"**
3. Queue name: `email-queue` → **Create**
4. Repite: Queue name: `notification-queue` → **Create**
5. **COPIA los nombres** (ya los tienes)

### 1.6 Crear Vectorize Index (Búsqueda AI)

**URL:** https://dash.cloudflare.com → Workers & Pages → Vectorize

1. Menú lateral → **"Vectorize"**
2. Botón **"Create index"**
3. Index name: `listings-search`
4. Dimensions: `768`
5. Metric: `cosine`
6. **Create**

### 1.7 Crear el Worker (API Backend)

**URL:** https://dash.cloudflare.com → Workers & Pages → Overview → Create

1. Menú lateral → **"Workers & Pages"** → **"Overview"**
2. Botón grande azul **"Create application"**
3. Selecciona **"Create Worker"**
4. Nombre: `marketplace-turistico-api`
5. Verás código de ejemplo. **Borra TODO** y deja vacío por ahora.
6. Haz click en **"Deploy"**
7. Te dará una URL: `https://marketplace-turistico-api.tu-usuario.workers.dev`
8. **COPIA esa URL**

### 1.8 Conectar Bindings al Worker

1. En tu Worker (`marketplace-turistico-api`), ve a la pestaña **"Settings"**
2. En el menú lateral del Worker, haz click en **"Bindings"**
3. Verás un botón **"Add"**:

**Añade cada binding:**

| Binding Type | Variable Name | Recurso a seleccionar |
|-------------|--------------|----------------------|
| D1 Database | `DB` | `marketplace-turistico-db` |
| KV Namespace | `KV_SESSIONS` | `marketplace-sessions` |
| KV Namespace | `KV_CACHE` | `marketplace-cache` |
| R2 Bucket | `R2_BUCKET` | `marketplace-turistico-assets` |
| Queue | `EMAIL_QUEUE` | `email-queue` |
| Queue | `NOTIFICATION_QUEUE` | `notification-queue` |
| Vectorize | `VECTORIZE_INDEX` | `listings-search` |
| AI (AI Gateway) | `AI` | (selecciona el modelo por defecto) |

Para cada uno:
- Haz click en **"Add"** → Selecciona el tipo → Selecciona el recurso → **Save**

---

## 🔷 PASO 2: Configurar Secrets del Worker

1. En tu Worker, ve a **"Settings"** → **"Variables and Secrets"**
2. Pestaña **"Secrets"** (la que tiene un candado 🔒)
3. Haz click en **"Add"**:

| Secret Name | Valor a poner | ¿Dónde lo consigues? |
|------------|--------------|---------------------|
| `JWT_SECRET` | Escribe 32 caracteres aleatorios | Inventa algo como `m1Cl4v3S3cr3t4MuyL4rg4YFu3rt3!` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Lo conseguiremos en Paso 4 |
| `RESEND_API_KEY` | `re_...` | Resend.com → API Keys |

---

## 🔷 PASO 3: Subir Código a GitHub

### 3.1 Crear Repositorio
1. Ve a: **https://github.com/new**
2. Repository name: `marketplace-turistico`
3. Hazlo **Público** (o Privado si prefieres)
4. **NO añadas README** (ya lo tenemos en el código)
5. Haz click en **"Create repository"**

### 3.2 Subir tu código

En tu ordenador, abre **Terminal** (Mac: Cmd+Espacio, escribe "Terminal". Windows: busca "CMD"):

```bash
# Navega a la carpeta del proyecto
cd /ruta/a/marketplace-turistico

# Inicializa git (si no lo has hecho)
git init

# Añade todo
git add .

# Commit
git commit -m "Initial commit"

# Conecta con GitHub (reemplaza TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/marketplace-turistico.git

# Sube todo
git push -u origin master
```

---

## 🔷 PASO 4: Deploy Automático (Cloudflare Pages)

### 4.1 Conectar GitHub a Cloudflare Pages

1. Ve a: **https://dash.cloudflare.com** → Workers & Pages → **"Create application"**
2. Selecciona **"Pages"** → **"Connect to Git"**
3. Selecciona tu cuenta de GitHub → Autoriza Cloudflare
4. Busca tu repo `marketplace-turistico` → **"Begin setup"**

### 4.2 Configurar Build (Frontend Público)

1. Project name: `marketplace-turistico-web`
2. Build command: `cd web && npm run build`
3. Build output directory: `web/dist`
4. Root directory: `/` (dejar vacío o poner `/`)
5. **Save and Deploy**

### 4.3 Configurar Build (Dashboard)

1. Repite el proceso: **Create application** → Pages → Connect to Git
2. Selecciona el mismo repo
3. Project name: `marketplace-turistico-dashboard`
4. Build command: `cd dashboard && npm run build`
5. Build output directory: `dashboard/dist`
6. **Save and Deploy**

---

## 🔷 PASO 5: Configurar Stripe

### 5.1 Obtener API Keys
1. Ve a: **https://dashboard.stripe.com/test/apikeys**
2. Copia **Secret key** (empieza con `sk_test_`)
3. Pégalo en el Secret del Worker (Paso 2)

### 5.2 Crear Productos/Planes en Stripe
1. Stripe Dashboard → **"Products"**
2. **"Add product"**:
   - Name: "Básico"
   - Price: 29€, Recurring, Monthly
3. **"Add product"**:
   - Name: "Profesional"
   - Price: 79€, Recurring, Monthly
4. **"Add product"**:
   - Name: "Agencia"
   - Price: 199€, Recurring, Monthly
5. **"Add product"** (one-time):
   - Name: "Destacado 7 días"
   - Price: 9€, One-time
6. **"Add product"** (one-time):
   - Name: "Destacado 30 días"
   - Price: 29€, One-time

### 5.3 Configurar Webhook
1. Stripe Dashboard → **"Developers"** → **"Webhooks"**
2. **"Add endpoint"**
3. Endpoint URL: `https://marketplace-turistico-api.tu-usuario.workers.dev/webhooks/stripe`
4. Selecciona estos eventos:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. **Add endpoint**
6. Verás **Signing secret** (empieza con `whsec_`)
7. **COPIA y pégalo** en el Secret del Worker (Paso 2)

---

## 🔷 PASO 6: Migrar Base de Datos

### 6.1 Schema SQL

En tu Terminal:

```bash
cd /ruta/a/marketplace-turistico/api

# Instalar wrangler si no lo tienes
npm install -g wrangler

# Login en Cloudflare
npx wrangler login

# Migrar schema a producción
npx wrangler d1 execute marketplace-turistico-db --remote --file=../schema.sql
```

Cuando pregunte "y/n", escribe **y** y dale Enter.

### 6.2 Seed (Datos de prueba)

```bash
npx wrangler d1 execute marketplace-turistico-db --remote --file=../drizzle/migrations/seed.sql
```

---

## 🔷 PASO 7: Deploy del Worker (API)

```bash
cd /ruta/a/marketplace-turistico/api

# Deploy!
npx wrangler deploy
```

Verás algo como:
```
✨ Successfully deployed marketplace-turistico-api
   https://marketplace-turistico-api.tu-usuario.workers.dev
```

---

## ✅ CHECKLIST FINAL

- [ ] D1 Database creada con schema aplicado
- [ ] KV Namespaces creados (sessions + cache)
- [ ] R2 Bucket creado con public access
- [ ] Queues creadas (email + notification)
- [ ] Vectorize index creado
- [ ] Worker deployado con bindings conectados
- [ ] Secrets configurados (JWT, Stripe, Resend)
- [ ] GitHub repo con código subido
- [ ] Cloudflare Pages conectado (web + dashboard)
- [ ] Stripe products creados
- [ ] Stripe webhook configurado con URL del Worker
- [ ] Seed data en la base de datos

---

## 🎉 TU MARKETPLACE ESTÁ VIVO

| URL | Qué verás |
|-----|-----------|
| `https://marketplace-turistico-web.pages.dev` | Tu portal público |
| `https://marketplace-turistico-dashboard.pages.dev` | Dashboard agencia |
| `https://marketplace-turistico-api.tu-usuario.workers.dev` | Tu API |

---

## 🆘 Si algo falla

### "No puedo hacer login en Wrangler"
```bash
npx wrangler login
```
Se abrirá tu navegador. Autoriza y vuelve a la terminal.

### "Error: database not found"
Revisa que el `database_id` en `wrangler.toml` coincida exactamente con el ID del Dashboard.

### "Stripe webhook no funciona"
Verifica que la URL del webhook incluya `/webhooks/stripe` al final.

---

_Guía creada por TECNOCLAW para Juanfra 🫡_
