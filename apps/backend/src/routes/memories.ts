import type { FastifyInstance } from 'fastify';
import { createMemorySchema, updateMemorySchema, extendSchema } from '../schemas.js';
import { prisma } from '../db.js';
import { requireUser } from '../auth.js';
import { toMemoryDTO } from '@tm/shared';
import { sweepExpiredMemories } from '../domain/expiry.js';

export async function memoryRoutes(app: FastifyInstance): Promise<void> {
  /** All memory routes require an authenticated, DB-verified user. */
  app.addHook('onRequest', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return reply;
    request.user = user;
  });

  // List active memories. Excluded: anything the sweep has stamped (or that
  // crossed expiry between sweeps).
  app.get('/', async (request, reply) => {
    const user = request.user!;
    await sweepExpiredMemories();
    const memories = await prisma.memory.findMany({
      where: { userId: user.id, expiredAt: null },
      orderBy: { expiresAt: 'asc' },
    });
    return reply.send({ memories: memories.map(toMemoryDTO) });
  });

  app.post('/', async (request, reply) => {
    const user = request.user!;
    const parsed = createMemorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    const memory = await prisma.memory.create({
      data: {
        userId: user.id,
        title: parsed.data.title,
        content: parsed.data.content,
        source: parsed.data.source,
        expiresAt: parsed.data.expiresAt,
      },
    });
    return reply.code(201).send({ memory: toMemoryDTO(memory) });
  });

  // Shared ownership guard for every :id route.
  app.register(async function ownedRoutes(owned) {
    owned.addHook('onRequest', async (request, reply) => {
      const id = (request.params as { id?: string }).id;
      if (!id) return;
      const memory = await prisma.memory.findUnique({ where: { id } });
      if (!memory || memory.userId !== request.user!.id) {
        return reply.code(404).send({ error: 'Memory not found' });
      }
      request.memory = memory;
    });

    owned.get('/:id', async (request, reply) => {
      await sweepExpiredMemories();
      return reply.send({ memory: toMemoryDTO(request.memory!) });
    });

    owned.patch('/:id', async (request, reply) => {
      const parsed = updateMemorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
      }
      const memory = await prisma.memory.update({
        where: { id: request.memory!.id },
        data: parsed.data,
      });
      return reply.send({ memory: toMemoryDTO(memory) });
    });

    owned.delete('/:id', async (request, reply) => {
      await prisma.memory.delete({ where: { id: request.memory!.id } });
      return reply.send({ ok: true });
    });

    owned.post('/:id/extend', async (request, reply) => {
      const parsed = extendSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid duration' });
      }
      // Extend from whichever is later: now, or the current expiry.
      const base = Math.max(Date.now(), request.memory!.expiresAt.getTime());
      const memory = await prisma.memory.update({
        where: { id: request.memory!.id },
        data: { expiresAt: new Date(base + parsed.data.durationMs) },
      });
      return reply.send({ memory: toMemoryDTO(memory) });
    });
  });
}
