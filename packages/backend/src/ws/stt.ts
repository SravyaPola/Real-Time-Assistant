import type { FastifyRequest } from 'fastify';
import OpenAI from 'openai';
import { tmpdir } from 'node:os';
import { createWriteStream, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function sttWs(connection: any, req: FastifyRequest) {
  let buffers: Buffer[] = [];
  let lastLength = 0;
  let closed = false;

  async function transcribe(total: Buffer) {
    const filePath = join(tmpdir(), `chunk-${randomUUID()}.webm`);
    await new Promise<void>((res, rej) => {
      const ws = createWriteStream(filePath);
      ws.on('finish', res);
      ws.on('error', rej);
      ws.end(total);
    });

    try {
      const resp = await client.audio.transcriptions.create({
        file: await OpenAI.toFile(Buffer.from(await readFile(filePath)), 'audio.webm'),
        model: 'whisper-1',
        // translate: true, // ← uncomment to always translate to English
      });
      const text = (resp as any).text ?? '';
      if (text) connection.socket.send(JSON.stringify({ type: 'final', text }));
    } catch {
      connection.socket.send(JSON.stringify({ type: 'error', message: 'transcription failed' }));
    } finally {
      try { unlinkSync(filePath); } catch {}
    }
  }

  const tick = async () => {
    if (closed) return;
    const total = Buffer.concat(buffers);
    if (total.length > lastLength) {
      await transcribe(total);
      lastLength = total.length;
    }
    setTimeout(tick, 3000);
  };

  setTimeout(tick, 1500);

  connection.socket.on('message', (buf: Buffer) => {
    buffers.push(buf);
    // 🔕 removed: sending any "listening ..." partial/progress messages
  });

  connection.socket.on('close', () => { closed = true; });
}
