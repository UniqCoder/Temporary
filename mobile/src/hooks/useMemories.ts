import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  cancelMemoryNotifications,
  reconcileMemoryNotifications,
  rescheduleMemoryNotifications,
  scheduleMemoryNotifications,
} from '../lib/notifications';
import type { MemoryDTO } from '@tm/shared';

/**
 * The one owner of server memory state. Screens render it and call the
 * mutators; nothing else talks to the API for memories or re-sorts lists.
 */
export function useMemories() {
  const [memories, setMemories] = useState<MemoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const byExpiry = useCallback(
    (list: MemoryDTO[]) =>
      [...list].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()),
    [],
  );

  const refresh = useCallback(async () => {
    try {
      setLoadError(null);
      const list = await api.listMemories();
      setMemories(list);
      void reconcileMemoryNotifications(list);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load memories');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load, then a light poll as a safety net for expiry crossing.
  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  /**
   * When a visible memory crosses its expiry, schedule one refresh so the
   * card animates out instead of silently disappearing.
   */
  const scheduleExpiryRefresh = useCallback(
    (now: number) => {
      const nextToExpire = memories.reduce<number | null>((min, m) => {
        const t = new Date(m.expiresAt).getTime();
        return t > now && (min === null || t < min) ? t : min;
      }, null);
      if (nextToExpire === null) return () => undefined;
      const delay = Math.min(nextToExpire - now + 1200, 60_000);
      const timer = setTimeout(() => void refresh(), delay);
      return () => clearTimeout(timer);
    },
    [memories, refresh],
  );

  const create = useCallback(
    async (input: { title: string; content: string; source: 'text' | 'voice'; expiresAt: string }) => {
      const created = await api.createMemory(input);
      setMemories((prev) => byExpiry([...prev, created]));
      void scheduleMemoryNotifications(created);
      return created;
    },
    [byExpiry],
  );

  const update = useCallback(
    async (id: string, input: { title?: string; content?: string; expiresAt?: string }) => {
      const updated = await api.updateMemory(id, input);
      setMemories((prev) => byExpiry(prev.map((m) => (m.id === id ? updated : m))));
      void rescheduleMemoryNotifications(updated);
      return updated;
    },
    [byExpiry],
  );

  const extend = useCallback(
    async (id: string, durationMs: number) => {
      const updated = await api.extendMemory(id, durationMs);
      setMemories((prev) => byExpiry(prev.map((m) => (m.id === id ? updated : m))));
      void rescheduleMemoryNotifications(updated);
      return updated;
    },
    [byExpiry],
  );

  const remove = useCallback(async (id: string) => {
    await api.deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
    void cancelMemoryNotifications(id);
  }, []);

  return {
    memories,
    loading,
    loadError,
    reload: refresh,
    create,
    update,
    extend,
    remove,
    scheduleExpiryRefresh,
  };
}

/** Search over title and content — punctuation-loose, no semantics. */
export function filterMemories(memories: MemoryDTO[], query: string): MemoryDTO[] {
  const q = query.trim().toLowerCase();
  if (!q) return memories;
  const loose = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '');
  const nq = loose(q);
  return memories.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      loose(m.title).includes(nq) ||
      loose(m.content).includes(nq),
  );
}
