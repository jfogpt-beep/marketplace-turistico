#!/usr/bin/env bash
# =============================================================================
# create-vectorize-index.sh — Crear índice Vectorize para búsqueda semántica
# =============================================================================
# Este script crea un índice Vectorize con las dimensiones y métrica correctas.
# El índice se usa para embeddings de descripciones de listings turísticos.
#
# USAGE:
#   bash scripts/create-vectorize-index.sh [dev|staging|prod]
#   (default: dev)
#
# NOTAS:
#   - Dimensiones: 768 (modelo @cf/baai/bge-base-en-v1.5 de Workers AI)
#   - Métrica: cosine (mejor para semántica de texto)
#   - El índice se pobla automáticamente al crear/actualizar listings
# =============================================================================

set -euo pipefail

ENV=${1:-dev}
INDEX_NAME="listings-semantic-$ENV"
DIMENSIONS=768
METRIC="cosine"

echo "🔍 CREAR VECTORIZE INDEX"
echo "   Nombre: $INDEX_NAME"
echo "   Dimensiones: $DIMENSIONS"
echo "   Métrica: $METRIC"
echo ""

# Crear el índice
wrangler vectorize create "$INDEX_NAME" \
  --dimensions="$DIMENSIONS" \
  --metric="$METRIC" \
  --description="Índice semántico para búsqueda de ofertas turísticas por similitud de descripción. Embeddings generados con @cf/baai/bge-base-en-v1.5 via Workers AI."

echo ""
echo "✅ Índice '$INDEX_NAME' creado exitosamente!"
echo ""
echo "   Para verificar:"
echo "   wrangler vectorize info $INDEX_NAME"
echo ""
echo "   Para insertar vectores manualmente (debug):"
echo "   wrangler vectorize insert $INDEX_NAME --values='[...]' --id='listing-123'"
echo ""
echo "   El índice se pobla automáticamente al:"
echo "   - Crear un nuevo listing (trigger en Worker)"
echo "   - Actualizar la descripción de un listing"
echo "   - Ejecutar el comando de reindexación: npm run vectorize:reindex"
echo ""
