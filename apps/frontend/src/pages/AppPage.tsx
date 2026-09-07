import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { ApiUser, MemoryDTO } from '@tm/shared';
import { CaptureArea } from '../components/CaptureArea';
import { MemoryCard } from '../components/MemoryCard';
import { MemoryModal } from '../components/MemoryModal';
import { VoiceReviewSheet } from '../components/VoiceReviewSheet';
import { UserMenu } from '../components/UserMenu';
import { useNow } from '../hooks/useNow';
import { useMemories, filterMemories } from '../hooks/useMemories';

interface AppPageProps {
  user: ApiUser;
  onSignOut: () => void;
  onUserUpdate: (user: ApiUser) => void;
}

export function AppPage({ user, onSignOut, onUserUpdate }: AppPageProps) {
  const {
    memories,
    loading,
    loadError,
    reload,
    create,
    update,
    extend,
    remove,
    scheduleExpiryRefresh,
  } = useMemories();

  const [query, setQuery] = useState('');
  const [openMemory, setOpenMemory] = useState<MemoryDTO | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const now = useNow(1000);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  // Keep the open modal's copy in sync with the owned server state.
  const openLive = useMemo(
    () => memories.find((m) => m.id === openMemory?.id) ?? null,
    [memories, openMemory],
  );

  useEffect(() => scheduleExpiryRefresh(now), [scheduleExpiryRefresh, now]);

  const filtered = useMemo(() => filterMemories(memories, query), [memories, query]);

  const handleCreate = useCallback(
    async (input: { title: string; content: string; source: 'text' | 'voice'; expiresAt: string }) => {
      await create(input);
      showToast('Kept. It will forget itself.');
    },
    [create, showToast],
  );

  const handleExtend = useCallback(
    async (id: string, durationMs: number) => {
      await extend(id, durationMs);
      showToast('Kept a little longer.');
    },
    [extend, showToast],
  );

  const handleSave = useCallback(
    async (id: string, input: { title: string; content: string; expiresAt?: string }) => {
      await update(id, input);
      showToast('Updated.');
    },
    [update, showToast],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await remove(id);
      setOpenMemory((open) => (open?.id === id ? null : open));
      showToast('Forgotten.');
    },
    [remove, showToast],
  );

  const handleVoiceSave = useCallback(
    async (input: { title: string; content: string; expiresAt: string }) => {
      await handleCreate({ ...input, source: 'voice' });
      setVoiceTranscript(null);
    },
    [handleCreate],
  );

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent">
            <span className="h-3 w-3 rounded-full border-[2.5px] border-accent-ink" />
          </span>
          <span className="text-[15px] font-medium tracking-tight text-ink">Temporary.</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search memories"
              className="w-52 rounded-xl border border-white/8 bg-white/[0.03] py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-dim/70 focus:border-white/20 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <UserMenu
            user={user}
            onLogout={() => void handleLogout(onSignOut)}
            onUserUpdate={onUserUpdate}
          />
        </div>
      </header>

      <main className="flex-1 pb-16">
        <div className="mt-6 sm:mt-10">
          <h1 className="text-[26px] font-medium tracking-tight text-ink sm:text-3xl">Your memories</h1>
          <p className="mt-1.5 text-[14px] text-ink-dim">
            Things you need right now. Nothing permanent.
          </p>
        </div>

        <div className="mt-6 sm:mt-8">
          <CaptureArea onCreate={handleCreate} onVoiceTranscript={setVoiceTranscript} />
        </div>

        {/* Mobile search sits under the capture area where thumbs are */}
        <div className="relative mt-4 sm:hidden">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories"
            className="w-full rounded-xl border border-white/8 bg-white/[0.03] py-2.5 pl-9 pr-3 text-[14px] text-ink placeholder:text-ink-dim/70 focus:border-white/20 focus:outline-none"
          />
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[132px] animate-pulse rounded-2xl border border-white/6 bg-white/[0.02]"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          ) : loadError ? (
            <div className="mt-2 rounded-2xl border border-white/8 bg-white/[0.02] p-8 text-center">
              <p className="text-[14px] text-danger">{loadError}</p>
              <button
                onClick={() => void reload()}
                className="mt-3 rounded-lg border border-white/12 px-4 py-2 text-[13px] text-ink transition hover:bg-white/6"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            query ? (
              <p className="py-10 text-center text-[14px] text-ink-dim">
                Nothing matches “{query}”.
              </p>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 text-center"
              >
                <p className="text-lg font-medium text-ink">Nothing to remember.</p>
                <p className="mt-1 text-[14px] text-ink-dim">For now.</p>
              </motion.div>
            )
          ) : (
            <motion.div layout className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    onOpen={setOpenMemory}
                    onEdit={(m) => setOpenMemory(m)}
                    onExtend={(m, ms) => void handleExtend(m.id, ms)}
                    onDelete={(m) => void handleDelete(m.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {openLive && (
          <MemoryModal
            key={openLive.id}
            memory={openLive}
            onClose={() => setOpenMemory(null)}
            onSave={handleSave}
            onExtend={handleExtend}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {voiceTranscript && (
          <VoiceReviewSheet
            transcript={voiceTranscript}
            onClose={() => setVoiceTranscript(null)}
            onSave={handleVoiceSave}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#171715] px-4 py-2 text-[13px] text-ink shadow-xl shadow-black/40"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

async function handleLogout(onSignOut: () => void) {
  try {
    await supabase.auth.signOut();
  } finally {
    onSignOut();
  }
}
