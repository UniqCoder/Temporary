import type { ApiUser, MemoryDTO } from '@tm/shared';
import { supabase } from './supabaseClient';

export type { ApiUser, MemoryDTO };

/**
 * Typed fetch wrapper over the backend's JSON API. Identity itself (signup,
 * login, logout, profile edits) goes straight to Supabase from the frontend —
 * this wrapper is only for memories and the one thing Supabase's anon key
 * can't do client-side: deleting an account.
 */

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let res: Response;
  try {
    res = await fetch('/api' + path, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }

  const body = (await res.json().catch(() => null)) as
    | ({ error?: string } & Record<string, unknown>)
    | null;

  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export const api = {
  deleteAccount: () => request<{ ok: true }>('/auth/me', { method: 'DELETE' }),

  listMemories: () => request<{ memories: MemoryDTO[] }>('/memories').then((r) => r.memories),

  createMemory: (input: {
    title: string;
    content: string;
    source: 'text' | 'voice';
    expiresAt: string;
  }) => request<{ memory: MemoryDTO }>('/memories', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.memory),

  updateMemory: (id: string, input: { title?: string; content?: string; expiresAt?: string }) =>
    request<{ memory: MemoryDTO }>(`/memories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }).then((r) => r.memory),

  deleteMemory: (id: string) => request<{ ok: true }>(`/memories/${id}`, { method: 'DELETE' }),

  extendMemory: (id: string, durationMs: number) =>
    request<{ memory: MemoryDTO }>(`/memories/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify({ durationMs }),
    }).then((r) => r.memory),
};
