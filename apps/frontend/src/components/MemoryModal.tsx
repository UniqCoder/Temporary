import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Pencil, Clock3, Trash2, Mic } from 'lucide-react';
import type { MemoryDTO } from '@tm/shared';
import { formatCreated, formatExpiryFull, formatRemaining, toLocalInputValue, EXPIRY_CHOICES } from '@tm/shared';
import { useNow } from '../hooks/useNow';

interface MemoryModalProps {
  memory: MemoryDTO;
  onClose: () => void;
  onSave: (id: string, input: { title: string; content: string; expiresAt?: string }) => Promise<void>;
  onExtend: (id: string, durationMs: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MemoryModal({ memory, onClose, onSave, onExtend, onDelete }: MemoryModalProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(memory.title);
  const [content, setContent] = useState(memory.content);
  const [newExpiry, setNewExpiry] = useState<Date | null>(null);
  const [newExpiryInput, setNewExpiryInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const now = useNow(1000);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const remaining = formatRemaining(memory.expiresAt, now);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141412] p-6 sm:p-7"
      >
        {!editing ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                {memory.source === 'voice' && <Mic size={14} className="text-ink-dim" />}
                <h2 className="text-xl font-medium text-ink">{memory.title}</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-ink-dim transition hover:bg-white/6 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {memory.content && memory.content !== memory.title && (
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-dim">
                {memory.content}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-white/[0.03] p-4">
              <div>
                <div className="text-[10px] font-medium tracking-[0.16em] text-ink-dim">CREATED</div>
                <div className="mt-1 text-[13px] text-ink">{formatCreated(memory.createdAt)}</div>
              </div>
              <div>
                <div className="text-[10px] font-medium tracking-[0.16em] text-ink-dim">FORGETS AT</div>
                <div className="mt-1 text-[13px] text-ink">{formatExpiryFull(memory.expiresAt)}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-medium tracking-[0.16em] text-ink-dim">FORGETS IN</div>
                <div className="mt-1 font-mono text-2xl tabular-nums text-accent">{remaining}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(true);
                    setConfirmDelete(false);
                    setNewExpiry(null);
                    setNewExpiryInput(toLocalInputValue(new Date(memory.expiresAt)));
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-ink-dim transition hover:bg-white/6 hover:text-ink"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => {
                    void onExtend(memory.id, 60 * 60_000);
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-ink-dim transition hover:bg-white/6 hover:text-ink"
                >
                  <Clock3 size={14} /> +1h
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-danger transition hover:bg-white/6"
                >
                  <Trash2 size={14} /> Delete
                </button>
                <AnimatePresence>
                  {confirmDelete && (
                    <motion.div
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-[13px]"
                    >
                      <span className="text-ink-dim">Sure?</span>
                      <button
                        onClick={() => void onDelete(memory.id)}
                        className="rounded-lg bg-danger px-2.5 py-1.5 text-white transition hover:brightness-110"
                      >
                        Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-medium text-ink">Edit memory</h2>
            <div className="mt-4 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[15px] text-ink focus:border-white/25 focus:outline-none"
                placeholder="Title"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[14px] text-ink focus:border-white/25 focus:outline-none"
                placeholder="Details (optional)"
              />
              <div className="flex flex-wrap gap-1.5">
                {EXPIRY_CHOICES.filter((c) => c.key !== 'custom').map((choice) => (
                  <button
                    key={choice.key}
                    type="button"
                    onClick={() => setNewExpiry(choice.compute(new Date()))}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-dim transition hover:bg-white/6 hover:text-ink"
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
              <input
                type="datetime-local"
                value={newExpiryInput}
                onChange={(e) => {
                  setNewExpiryInput(e.target.value);
                  const d = new Date(e.target.value);
                  if (!Number.isNaN(d.getTime())) setNewExpiry(d);
                }}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[14px] text-ink focus:border-white/25 focus:outline-none"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setConfirmDelete(false);
                }}
                className="rounded-lg px-3.5 py-2 text-[13px] text-ink-dim transition hover:bg-white/6 hover:text-ink"
              >
                Cancel
                </button>
              <button
                onClick={() => {
                  void (async () => {
                    await onSave(memory.id, {
                      title: title.trim() || memory.title,
                      content,
                      expiresAt: newExpiry ? newExpiry.toISOString() : undefined,
                    });
                    setEditing(false);
                  })();
                }}
                className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-accent-ink transition hover:brightness-110"
              >
                Save changes
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
