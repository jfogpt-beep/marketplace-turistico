#!/usr/bin/env bash
# =============================================================================
# deploy-all.sh — Deploy de TODOS los servicios
# =============================================================================
# Este script deploya la API, el frontend web y el dashboard en secuencia.
# Cada deploy espera a que el anterior termine correctamente.
#
# USAGE:
#   bash scripts/deploy-all.sh [dev|staging|prod]
#   (default: dev)
# =============================================================================

set -euo pipefail

ENV=${1:-dev}
START_TIME=$(date +%s)

echo "🚀 DEPLOY ALL — Environment: $ENV"
echo "   Inicio: $(date)"
echo ""

# ---------------------------------------------------------------------------
# 1. API (Cloudflare Worker)
# ---------------------------------------------------------------------------
echo "═══════════════════════════════════════════════════════════════"
echo "1️⃣  Deploy API Worker"
echo "═══════════════════════════════════════════════════════════════"
cd api
wrangler deploy --env "$ENV"
cd ..
echo "   ✅ API deployado"
echo ""

# ---------------------------------------------------------------------------
# 2. Frontend Web (Cloudflare Pages)
# ---------------------------------------------------------------------------
echo "═══════════════════════════════════════════════════════════════"
echo "2️⃣  Deploy Web (Portal Público)"
echo "═══════════════════════════════════════════════════════════════"
cd web
npm run build
wrangler pages deploy .next --env "$ENV" --project-name="marketplace-web-$ENV"
cd ..
echo "   ✅ Web deployado"
echo ""

# ---------------------------------------------------------------------------
# 3. Dashboard (Cloudflare Pages)
# ---------------------------------------------------------------------------
echo "═══════════════════════════════════════════════════════════════"
echo "3️⃣  Deploy Dashboard (Panel Agencia/Admin)"
echo "═══════════════════════════════════════════════════════════════"
cd dashboard
npm run build
wrangler pages deploy .next --env "$ENV" --project-name="marketplace-dashboard-$ENV"
cd ..
echo "   ✅ Dashboard deployado"
echo ""

# ---------------------------------------------------------------------------
# 4. Migraciones de Base de Datos (si hay pendientes)
# ---------------------------------------------------------------------------
echo "═══════════════════════════════════════════════════════════════"
echo "4️⃣  Aplicar migraciones D1 pendientes"
echo "═══════════════════════════════════════════════════════════════"
cd api
wrangler d1 migrations apply "marketplace-db-$ENV" --env "$ENV"
cd ..
echo "   ✅ Migraciones aplicadas"
echo ""

# ---------------------------------------------------------------------------
# Resumen
# ---------------------------------------------------------------------------
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "═══════════════════════════════════════════════════════════════"
echo "                    ✅ DEPLOY COMPLETADO                       "
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "   Environment: $ENV"
echo "   Duración: ${DURATION}s"
echo ""
echo "   🌐 URLs:"
if [ "$ENV" = "prod" ]; then
  echo "      API:        https://api.marketplace-turistico.workers.dev"
  echo "      Web:        https://marketplace-turistico.pages.dev"
  echo "      Dashboard:  https://marketplace-turistico.pages.dev/dashboard"
else
  echo "      API:        https://marketplace-api-$ENV.workers.dev"
  echo "      Web:        https://marketplace-web-$ENV.pages.dev"
  echo "      Dashboard:  https://marketplace-dashboard-$ENV.pages.dev"
fi
echo ""
echo "═══════════════════════════════════════════════════════════════"
