import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface NamePromptProps {
  suggested: string;
  onCancel: () => void;
  onConfirm: (name: string) => void;
  busy?: boolean;
  error?: string | null;
}

/** Small confirmation step after capture: name the memory before it's saved. */
export function NamePrompt({ suggested, onCancel, onConfirm, busy, error }: NamePromptProps) {
  const [name, setName] = useState(suggested);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const confirm = () => onConfirm(name.trim() || suggested || 'Untitled');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#141412] p-5"
      >
        <label htmlFor="memory-name" className="mb-1.5 block text-[13px] text-ink-dim">
          What should we call it?
        </label>
        <input
          id="memory-name"
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              confirm();
            }
            if (e.key === 'Escape') onCancel();
          }}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[15px] text-ink focus:border-white/25 focus:outline-none"
          placeholder="Give it a name"
        />
        {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-[13px] text-ink-dim transition hover:bg-white/6 hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-accent-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
