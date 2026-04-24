import { Ai } from '@cloudflare/workers-types';

export interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export async function generateEmbedding(ai: Ai, text: string): Promise<number[]> {
  const response = await ai.run('@cf/baai/bge-base-en-v1.5', { text: [text] });
  // @ts-ignore - response shape depends on model
  const embedding = response.data[0] as number[];
  return embedding;
}

export async function upsertListingVector(
  vectorize: VectorizeIndex,
  id: string,
  embedding: number[],
  metadata: Record<string, string | number | boolean>
): Promise<void> {
  await vectorize.upsert([
    {
      id,
      values: embedding,
      metadata,
    },
  ]);
}

export async function querySimilarListings(
  vectorize: VectorizeIndex,
  embedding: number[],
  topK = 10,
  filter?: Record<string, string | number | boolean | string[]>
): Promise<VectorizeMatch[]> {
  const results = await vectorize.query(embedding, topK, filter);
  return results.matches.map((match) => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata as Record<string, unknown> | undefined,
  }));
}

export async function deleteListingVector(vectorize: VectorizeIndex, id: string): Promise<void> {
  await vectorize.deleteByIds([id]);
}
