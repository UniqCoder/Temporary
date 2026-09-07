import type { ApiUser, MemoryDTO } from '@tm/shared';
import { supabase } from './supabaseClient';

export type { ApiUser, MemoryDTO };

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    'Missing EXPO_PUBLIC_API_BASE_URL — set it to the backend URL reachable from your phone (e.g. http://<your-lan-ip>:3001/api), not localhost.',
  );
}

/**
 * Typed fetch wrapper over the backend's JSON API. Identity itself (signup,
 * login, logout, profile edits) goes straight to Supabase from this app —
 * this wrapper is only for memories and account deletion (needs the backend's
 * service-role access, which the app itself never holds).
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
    res = await fetch(API_BASE_URL + path, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check EXPO_PUBLIC_API_BASE_URL and that the backend is running.');
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
