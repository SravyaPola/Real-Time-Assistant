import OpenAI from 'openai';
import { query } from '../db/client.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Make sure this matches your DB dim (1536): you’re using 3-small
const EMB_MODEL = 'text-embedding-3-small';

export type Hit = {
  id: string;
  content: string;
  document_id: string;
  chunk_index: number;
  distance: number;
};

function keywords(q: string) {
  return Array.from(new Set(
    q.toLowerCase()
     .replace(/[^a-z0-9\s]/g, ' ')
     .split(/\s+/)
     .filter(w => w.length >= 4 && !['with','this','that','from','into','your','about','which','there','their'].includes(w))
  ));
}

export async function retrieve(userQuery: string, k = 8): Promise<Hit[]> {
  const emb = await openai.embeddings.create({ model: EMB_MODEL, input: userQuery });
  const v = emb.data[0].embedding;
  const vecLiteral = `[${v.join(',')}]`;

  // 1) Vector similarity with distance
  const { rows } = await query<Hit>(`
    SELECT c.id, c.content, c.document_id, c.chunk_index,
           (e.embedding <=> $1::vector) AS distance
    FROM embeddings e
    JOIN chunks c ON c.id = e.chunk_id
    ORDER BY distance
    LIMIT ${k}
  `, [vecLiteral]);

  // If we got decent hits (e.g., top distance <= 0.5) return them
  if (rows.length > 0 && rows[0].distance <= 0.50) {
    return rows;
  }

  // 2) Fallback: simple keyword filter (ILIKE) if vector results look weak
  const terms = keywords(userQuery);
  if (terms.length) {
    const ilikes = terms.map((_, i) => `LOWER(c.content) ILIKE $${i + 2}`).join(' OR ');
    const params = [vecLiteral, ...terms.map(t => `%${t}%`)];
    const { rows: kwRows } = await query<Hit>(`
      SELECT c.id, c.content, c.document_id, c.chunk_index,
             (e.embedding <=> $1::vector) AS distance
      FROM embeddings e
      JOIN chunks c ON c.id = e.chunk_id
      WHERE ${ilikes}
      ORDER BY distance
      LIMIT ${k}
    `, params);
    if (kwRows.length) return kwRows;
  }

  return rows; // may be empty; caller will handle
}

export async function answerWithContext(question: string) {
  const hits = await retrieve(question, 8);

  // Build a compact context
  const context = hits.map(
    h => `# chunk ${h.chunk_index} (d=${h.distance.toFixed(3)})\n${h.content}`
  ).join('\n\n---\n\n');

  if (hits.length === 0) {
    return { answer: "I couldn't find anything relevant in your documents.", citations: [] as Hit[] };
  }

  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: "Answer ONLY from the provided context. If it's not in the context, say you don't know." },
      { role: 'user', content: `CONTEXT:\n${context}\n\nQUESTION: ${question}` }
    ]
  });

  const answer = chat.choices[0]?.message?.content ?? '(no answer)';
  return { answer, citations: hits };
}
