import { prisma } from '../db.js';
import type { MemoryRecord } from '@tm/shared';

/**
 * Expiration engine. `expiresAt` on the row is the single source of truth;
 * these functions are the only place that decides what "expired" means.
 */

/** Permanently remove memories that just crossed their expiry. */
export async function sweepExpiredMemories(): Promise<number> {
  const result = await prisma.memory.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return result.count;
}

/** True when a memory is still active (not yet forgotten). */
export function isActiveMemory(memory: MemoryRecord, at: Date = new Date()): boolean {
  return memory.expiredAt === null && memory.expiresAt.getTime() > at.getTime();
}
