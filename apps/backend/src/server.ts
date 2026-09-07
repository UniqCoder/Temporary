import fastifyCors from '@fastify/cors';
import Fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { memoryRoutes } from './routes/memories.js';
import { sweepExpiredMemories } from './domain/expiry.js';
import { CORS_ORIGIN, PORT } from './config.js';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'warn',
    },
  });

  await app.register(fastifyCors, {
    origin: CORS_ORIGIN,
  });

  app.get('/api/health', async () => ({ ok: true, time: new Date().toISOString() }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(memoryRoutes, { prefix: '/api/memories' });

  return app;
}

async function start() {
  const app = await buildServer();

  // Lightweight periodic expiration sweep (source of truth stays in the DB).
  const sweep = setInterval(() => {
    void sweepExpiredMemories().catch(() => undefined);
  }, 30_000);
  sweep.unref?.();

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Only auto-start when run directly (not when imported by tests).
if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  void start();
}
