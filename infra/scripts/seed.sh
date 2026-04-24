#!/usr/bin/env bash
# =============================================================================
# seed.sh — Ejecutar seed.sql en D1
# =============================================================================
# Este script ejecuta el archivo de seed data (datos iniciales) en la base D1.
#
# USAGE:
#   bash scripts/seed.sh [dev|staging|prod]
#   (default: dev)
#
# El archivo seed.sql debe estar en: api/drizzle/seed.sql
# =============================================================================

set -euo pipefail

ENV=${1:-dev}
DB_NAME="marketplace-db-$ENV"
SEED_FILE="./api/drizzle/seed.sql"

echo "🌱 SEEDING D1 Database: $DB_NAME"

if [ ! -f "$SEED_FILE" ]; then
  echo "❌ Error: No se encontró $SEED_FILE"
  echo "   Asegúrate de que el archivo seed.sql existe en api/drizzle/seed.sql"
  exit 1
fi

# Ejecutar el seed
echo "   📄 Archivo: $SEED_FILE"
wrangler d1 execute "$DB_NAME" --file="$SEED_FILE" --env "$ENV"

echo ""
echo "✅ Seed completado en $DB_NAME!"
echo "   Datos insertados: categorías, planes de suscripción, admin inicial"
