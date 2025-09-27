import type { FastifyRequest } from 'fastify';
import { nextBestActionsFor } from '../rag/events.js';

export default async function assistWs(connection: any, req: FastifyRequest) {
  connection.socket.on('message', async (msg: Buffer) => {
    try {
      const { text } = JSON.parse(msg.toString());
      const events = await nextBestActionsFor(text ?? '');
      connection.socket.send(JSON.stringify({ type: 'events', events }));
    } catch (e) {
      connection.socket.send(JSON.stringify({ type: 'error', message: 'bad payload' }));
    }
  });
}
