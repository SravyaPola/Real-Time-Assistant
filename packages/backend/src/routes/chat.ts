import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { answerWithContext } from '../rag/retriever.js';

export default async function chatRoutes(app: FastifyInstance) {
  app.options('/ask', async () => ({ ok: true })); // helps some CORS setups

  app.post('/ask', async (req, reply) => {
    const body = z.object({ query: z.string().min(1) }).parse(req.body);
    const { answer, citations } = await answerWithContext(body.query);
    return reply.send({ answer, citations });
  });
}
