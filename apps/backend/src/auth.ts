import type { FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from './supabase.js';
import type { ApiUser } from '@tm/shared';

/** Identity comes from Supabase Auth — every request carries a bearer access token. */

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

export async function requireUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<ApiUser | null> {
  const token = bearerToken(request);
  if (!token) {
    void reply.code(401).send({ error: 'Not authenticated' });
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    void reply.code(401).send({ error: 'Not authenticated' });
    return null;
  }

  const meta = data.user.user_metadata as { name?: string } | null;
  return {
    id: data.user.id,
    email: data.user.email ?? '',
    name: meta?.name || data.user.email || 'You',
  };
}
