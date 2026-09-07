import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { EXPIRY_CHOICES, formatExpiryClock, parseExpiry, deriveTitleContent, extractExpiryPhrase } from '@tm/shared';

interface VoiceReviewSheetProps {
  transcript: string;
  onClose: () => void;
  onSave: (input: { title: string; content: string; expiresAt: string }) => Promise<void>;
}

export function VoiceReviewSheet({ transcript, onClose, onSave }: VoiceReviewSheetProps) {
  const parsed = useMemo(() => {
    const { cleaned, matched } = extractExpiryPhrase(transcript);
    const expiry = parseExpiry(transcript);
    const { title, content } = deriveTitleContent(cleaned || transcript);
    return { title, content, expiry, matched };
  }, [transcript]);

  const [title, setTitle] = useState(parsed.title || 'Untitled');
  const [content, setContent] = useState(parsed.content);
  const [expiresAt, setExpiresAt] = useState<string>(() =>
    (parsed.expiry ?? new Date(Date.now() + 2 * 3_600_000)).toISOString(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSave({ title: title.trim() || 'Untitled', content, expiresAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#141412] p-6 sm:rounded-2xl"
      >
        <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] text-ink-dim">
          <Mic size={13} />
          VOICE CAPTURED — REVIEW BEFORE SAVING
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[16px] font-medium text-ink focus:border-white/25 focus:outline-none"
            aria-label="Title"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Details (optional)"
            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[14px] text-ink focus:border-white/25 focus:outline-none"
            aria-label="Details"
          />
        </div>

        <div className="mt-4">
          <div className="text-[10px] font-medium tracking-[0.16em] text-ink-dim">FORGETS AT</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {EXPIRY_CHOICES.filter((c) => c.key !== 'custom').map((choice) => {
              const date = choice.compute(new Date());
              const active = new Date(expiresAt).getTime() === date.getTime();
              return (
                <button
                  key={choice.key}
                  type="button"
                  onClick={() => setExpiresAt(date.toISOString())}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    active ? 'bg-accent text-accent-ink' : 'text-ink-dim hover:bg-white/6 hover:text-ink'
                  }`}
                >
                  {choice.label}
                </button>
              );
            })}
            <span className="ml-1 font-mono text-[13px] tabular-nums text-accent">
              {formatExpiryClock(expiresAt)}
            </span>
          </div>
          {parsed.matched && (
            <p className="mt-2 text-[12px] text-ink-dim">
              Understood the time from what you said — adjust if needed.
            </p>
          )}
        </div>

        {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-[13px] text-ink-dim transition hover:bg-white/6 hover:text-ink"
          >
            Discard
          </button>
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-accent-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save memory'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
