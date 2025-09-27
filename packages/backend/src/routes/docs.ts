import { FastifyPluginAsync } from 'fastify';
import { saveAndIndex } from '../rag/embedder.js';

const routes: FastifyPluginAsync = async (app) => {
  app.post('/upload', async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: 'No file uploaded' });

    const buf = await data.toBuffer();
    const result = await saveAndIndex({ filename: data.filename, mime: data.mimetype, buffer: buf });
    return { ok: true, ...result };
  });
};

export default routes;
