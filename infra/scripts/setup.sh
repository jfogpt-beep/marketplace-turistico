#!/usr/bin/env bash
# =============================================================================
# setup.sh — Setup inicial de bindings Cloudflare
# =============================================================================
# Este script crea TODOS los recursos Cloudflare necesarios usando wrangler CLI.
# Ejecutar UNA VEZ al inicio del proyecto o cuando se quiera provisionar un nuevo environment.
#
# USAGE:
#   bash scripts/setup.sh [dev|staging|prod]
#   (default: dev)
#
# REQUISITOS:
#   - wrangler CLI instalado y autenticado: npm i -g wrangler && wrangler login
#   - CLOUDFLARE_ACCOUNT_ID configurado en .env o como variable de entorno
# =============================================================================

set -euo pipefail

ENV=${1:-dev}
ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-$(grep 'account_id' wrangler.toml | head -1 | sed 's/.*= *"\(.*\)".*/\1/')}

echo "⚡ SETUP MARKETPLACE TURÍSTICO — Environment: $ENV"
echo "   Account ID: $ACCOUNT_ID"
echo ""

# ---------------------------------------------------------------------------
# 1. D1 DATABASE
# ---------------------------------------------------------------------------
echo "🏗️  Creando D1 Database..."
wrangler d1 create "marketplace-db-$ENV" || echo "   ℹ️  D1 ya existe, saltando..."

# Obtener el ID de la base creada
DB_ID=$(wrangler d1 list --json | jq -r ".[] | select(.name==\"marketplace-db-$ENV\") | .uuid" 2>/dev/null || echo "")
if [ -n "$DB_ID" ]; then
  echo "   ✅ D1 ID: $DB_ID"
fi

# ---------------------------------------------------------------------------
# 2. KV NAMESPACES
# ---------------------------------------------------------------------------
echo "🏗️  Creando KV Namespaces..."

# Sessions KV
wrangler kv namespace create "SESSIONS-$ENV" 2>/dev/null || echo "   ℹ️  KV SESSIONS ya existe..."

# Cache KV
wrangler kv namespace create "CACHE-$ENV" 2>/dev/null || echo "   ℹ️  KV CACHE ya existe..."

# ---------------------------------------------------------------------------
# 3. R2 BUCKET
# ---------------------------------------------------------------------------
echo "🏗️  Creando R2 Bucket..."
wrangler r2 bucket create "marketplace-images-$ENV" || echo "   ℹ️  R2 Bucket ya existe..."
echo "   ✅ R2 Bucket: marketplace-images-$ENV"

# ---------------------------------------------------------------------------
# 4. QUEUES
# ---------------------------------------------------------------------------
echo "🏗️  Creando Queues..."
wrangler queues create "emails-$ENV" || echo "   ℹ️  Queue emails ya existe..."
wrangler queues create "notifications-$ENV" || echo "   ℹ️  Queue notifications ya existe..."
echo "   ✅ Queues: emails-$ENV, notifications-$ENV"

# ---------------------------------------------------------------------------
# 5. VECTORIZE INDEX
# ---------------------------------------------------------------------------
echo "🏗️  Creando Vectorize Index..."
wrangler vectorize create "listings-semantic-$ENV" \
  --dimensions=768 \
  --metric=cosine \
  --description="Índice semántico para búsqueda de ofertas turísticas" \
  || echo "   ℹ️  Vectorize index ya existe..."
echo "   ✅ Vectorize: listings-semantic-$ENV (768 dims, cosine)"

# ---------------------------------------------------------------------------
# 6. PAGES PROJECTS (Next.js)
# ---------------------------------------------------------------------------
echo "🏗️  Creando Pages Projects..."
# Nota: wrangler pages project create no existe directamente,
# los proyectos se crean automáticamente en el primer deploy
# Pero documentamos los nombres:
echo "   ℹ️  Pages projects se crearán en el primer deploy:"
echo "      - marketplace-web-$ENV (portal público)"
echo "      - marketplace-dashboard-$ENV (panel agencia/admin)"

# ---------------------------------------------------------------------------
# 7. BINDINGS SUMMARY
# ---------------------------------------------------------------------------
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                    📋 RESUMEN DE BINDINGS                      "
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Copia estos IDs a tu wrangler.toml y .env:"
echo ""
echo "# D1"
echo "${ENV^^}_D1_DATABASE_ID=$DB_ID"
echo ""
echo "# KV"
echo "${ENV^^}_KV_SESSIONS_ID=$SESSIONS_KV_ID"
echo "${ENV^^}_KV_CACHE_ID=$CACHE_KV_ID"
echo ""
echo "# R2: marketplace-images-$ENV"
echo ""
echo "# Queues: emails-$ENV, notifications-$ENV"
echo ""
echo "# Vectorize: listings-semantic-$ENV"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Setup completado! Ahora ejecuta:"
echo "   1. bash scripts/seed.sh         → Popular la base de datos"
echo "   2. npm run deploy:all           → Deployar todo"
echo ""
