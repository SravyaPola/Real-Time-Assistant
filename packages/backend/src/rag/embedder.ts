import OpenAI from 'openai';
import { query } from '../db/client.js';
import { fileTypeFromBuffer } from 'file-type';

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),  // <-- fix: use Uint8Array
    disableWorker: true,
    useWorkerFetch: false,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;

  let text = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ');
    text += (text ? '\n\n' : '') + pageText;
  }
  return text.trim();
}



const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function chunkText(text: string, chunkSize = 1200, overlap = 200) {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    let slice = text.slice(i, end);
    const lastSpace = slice.lastIndexOf(' ');
    if (end < text.length && lastSpace > 0) slice = slice.slice(0, lastSpace);
    chunks.push(slice.trim());
    i += Math.max(1, slice.length - overlap);
  }
  return chunks.filter(Boolean);
}

async function ensureSchema() {
  const fs = await import('node:fs');
  const url = new URL('../db/schema.sql', import.meta.url);
  const sql = fs.readFileSync(url, 'utf8');
  await query(sql);
}

async function extractText(buffer: Buffer, filename?: string, mimeHint?: string): Promise<{ text: string; mime?: string }> {
  let detectedMime = mimeHint;
  try {
    const ft = await fileTypeFromBuffer(buffer);
    if (ft?.mime) detectedMime = ft.mime;
  } catch {}
  const lower = (filename || '').toLowerCase();

  const isPdf = (detectedMime && detectedMime.includes('pdf')) || lower.endsWith('.pdf');
  if (isPdf) {
    const text = await extractPdfText(buffer);
    return { text, mime: 'application/pdf' };
  }

  // Treat markdown & text as utf8
  return { text: buffer.toString('utf8'), mime: detectedMime || 'text/plain' };
}

export async function saveAndIndex({ filename, mime, buffer }: { filename: string; mime?: string; buffer: Buffer; }) {
  await ensureSchema();

  const { text, mime: parsedMime } = await extractText(buffer, filename, mime);
  if (!text || !text.trim()) {
    return { documentId: null, chunks: 0, warning: 'No extractable text' };
  }
  const chunks = chunkText(text);

  const docRes = await query<{ id: string }>('INSERT INTO documents (filename, mime) VALUES ($1, $2) RETURNING id', [filename, parsedMime]);
  const documentId = docRes.rows[0].id;

 const embed = await openai.embeddings.create({
  model: 'text-embedding-3-small', // 1536 dims
  input: chunks
});

  for (let i = 0; i < chunks.length; i++) {
    const { rows } = await query<{ id: string }>(
      'INSERT INTO chunks (document_id, chunk_index, content) VALUES ($1, $2, $3) RETURNING id',
      [documentId, i, chunks[i]]
    );
    const chunkId = rows[0].id;
    const vector = embed.data[i].embedding;
    const vecLiteral = `[${vector.join(',')}]`;
await query(
  'INSERT INTO embeddings (chunk_id, embedding) VALUES ($1, $2::vector)',
  [chunkId, vecLiteral]
);
    
  }

  return { documentId, chunks: chunks.length };
}
