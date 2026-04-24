import { Hono } from "hono";
import { createDb } from "../lib/db";
import { eq, sql } from "drizzle-orm";
import * as schema from "../db/schema";

const app = new Hono();

// GET /search?q=keyword — text search via D1 FTS5 + semantic via Vectorize
app.get("/", async (c) => {
  const query = c.req.query("q");
  const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);

  if (!query || query.length < 2) {
    return c.json({ success: false, error: "Query must be at least 2 characters" }, 400);
  }

  const db = createDb(c.env.DB);

  // 1. Full-text search via D1 FTS5
  const ftsResults = await db.all(sql`
    SELECT l.* FROM listings l
    JOIN listings_fts fts ON l.id = fts.rowid
    WHERE listings_fts MATCH ${query}
    AND l.status = 'published'
    ORDER BY rank
    LIMIT ${limit}
  `);

  // 2. Semantic search via Vectorize (if available)
  let semanticResults: any[] = [];
  try {
    const embedding = await c.env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [query] });
    const vectorResults = await c.env.VECTORIZE_INDEX.query(embedding.data[0], { topK: limit });
    
    // Fetch listings by IDs from vector results
    const ids = vectorResults.matches.map((m: any) => parseInt(m.id));
    if (ids.length > 0) {
      semanticResults = await db
        .select()
        .from(schema.listings)
        .where(sql`${schema.listings.id} IN (${ids.join(",")}) AND ${schema.listings.status} = 'published'`);
    }
  } catch {
    // Vectorize might not be configured, fallback to FTS only
  }

  // Merge and deduplicate (FTS first, semantic as supplement)
  const seen = new Set(ftsResults.map((r: any) => r.id));
  const combined = [...ftsResults];
  for (const sr of semanticResults) {
    if (!seen.has(sr.id)) combined.push(sr);
  }

  return c.json({
    success: true,
    data: combined.slice(0, limit),
    meta: { query, total: combined.length, ftsCount: ftsResults.length, semanticCount: semanticResults.length },
  });
});

export { app as searchRouter };
