import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import * as dotenv from 'dotenv';
dotenv.config();

import docsRoutes from './routes/docs.js';
import chatRoutes from './routes/chat.js';
import sttWs from './ws/stt.js';
import assistWs from './ws/assist.js';

const app = Fastify({ logger: true });

// ✅ register CORS first
await app.register(cors, {
  origin: true,
  methods: ['GET','POST','OPTIONS'],
});

await app.register(websocket);
await app.register(multipart);

app.register(docsRoutes, { prefix: '/docs' });
app.register(chatRoutes, { prefix: '/chat' });

app.get('/ws/stt', { websocket: true }, sttWs);
app.get('/ws/assist', { websocket: true }, assistWs);

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: '0.0.0.0' });
