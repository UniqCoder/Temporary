import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { requireUser } from '../auth.js';
import { supabaseAdmin } from '../supabase.js';
import { createRateLimiter } from '../domain/rateLimit.js';

const deleteLimiter = createRateLimiter(15 * 60_000, 10);

/**
 * Signup/login/logout/profile edits are handled by the frontend talking to
 * Supabase Auth directly. This backend only verifies the resulting bearer
 * token (see `requireUser`) and performs the one thing the client can never
 * safely do itself: permanently delete an account (needs the service role key).
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return reply;
    return reply.send({ user });
  });

  app.delete('/me', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return reply;

    const limited = deleteLimiter.check(user.id);
    if (limited) return reply.code(429).send({ error: limited });

    if (!supabaseAdmin) {
      return reply.code(501).send({
        error: 'Account deletion is not configured on this server yet.',
      });
    }

    // Our own Postgres has no FK to Supabase's auth.users, so memories are
    // cleaned up explicitly before the identity itself is removed.
    await prisma.memory.deleteMany({ where: { userId: user.id } });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      return reply.code(500).send({ error: 'Could not delete account' });
    }
    return reply.send({ ok: true });
  });
}
