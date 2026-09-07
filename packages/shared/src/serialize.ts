import type { MemoryDTO, MemoryRecord } from './types.js';

/** Convert a stored memory row into the public JSON shape. */
export function toMemoryDTO(memory: MemoryRecord): MemoryDTO {
  return {
    id: memory.id,
    title: memory.title,
    content: memory.content,
    source: memory.source,
    expiresAt: memory.expiresAt.toISOString(),
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
  };
}
