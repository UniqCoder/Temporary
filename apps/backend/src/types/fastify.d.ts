import type { ApiUser, MemoryRecord } from '@tm/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: ApiUser;
    memory?: MemoryRecord;
  }
}
