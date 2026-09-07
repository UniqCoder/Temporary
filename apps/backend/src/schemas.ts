import { z } from 'zod';

export const createMemorySchema = z.object({
  title: z.string().trim().min(1, 'Give it a title').max(120),
  content: z.string().trim().max(2000).default(''),
  source: z.enum(['text', 'voice']).default('text'),
  expiresAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: 'Expiry must be in the future',
  }),
});

export const updateMemorySchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  content: z.string().trim().max(2000).optional(),
  expiresAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: 'Expiry must be in the future',
  }).optional(),
});

export const extendSchema = z.object({
  durationMs: z.number().int().positive().max(1000 * 60 * 60 * 24 * 365),
});

export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
export type ExtendInput = z.infer<typeof extendSchema>;
