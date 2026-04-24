/**
 * Cloudflare AI + Vectorize — Búsqueda semántica de listings
 * Genera embeddings y busca por similitud semántica
 */

const AI_MODEL = "@cf/baai/bge-base-en-v1.5";

export interface VectorizeMatch {
  id: string;
  score: number;
}

/**
 * Genera embedding para un texto usando Cloudflare AI
 */
export async function generateEmbedding(ai: Ai, text: string): Promise<number[]> {
  const result = await ai.run(AI_MODEL, { text: [text] });
  return result.data[0];
}

/**
 * Inserta un listing en el índice Vectorize
 */
export async function indexListing(
  vectorize: VectorizeIndex,
  listingId: number,
  text: string,
  ai: Ai
): Promise<void> {
  const embedding = await generateEmbedding(ai, text);
  await vectorize.upsert([
    {
      id: String(listingId),
      values: embedding,
      metadata: { listingId },
    },
  ]);
}

/**
 * Busca listings por similitud semántica
 */
export async function semanticSearch(
  vectorize: VectorizeIndex,
  ai: Ai,
  query: string,
  topK: number = 10
): Promise<VectorizeMatch[]> {
  const embedding = await generateEmbedding(ai, query);
  const results = await vectorize.query(embedding, { topK });
  return results.matches.map((m: any) => ({
    id: m.id,
    score: m.score,
  }));
}

/**
 * Genera embeddings para todos los listings existentes (batch)
 */
export async function batchIndexListings(
  vectorize: VectorizeIndex,
  ai: Ai,
  listings: Array<{ id: number; title: string; description: string }>
): Promise<{ indexed: number; failed: number }> {
  let indexed = 0;
  let failed = 0;

  for (const listing of listings) {
    try {
      const text = `${listing.title}. ${listing.description}`;
      await indexListing(vectorize, listing.id, text, ai);
      indexed++;
    } catch {
      failed++;
    }
  }

  return { indexed, failed };
}
