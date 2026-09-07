import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full place-items-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <a href="/" className="mb-10 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent">
            <span className="h-3 w-3 rounded-full border-[2.5px] border-accent-ink" />
          </span>
          <span className="text-[15px] font-medium tracking-tight text-ink">Temporary.</span>
        </a>
        {children}
      </motion.div>
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-lg border border-danger/25 bg-danger/8 px-3.5 py-2.5 text-[13px] text-danger"
    >
      {message}
    </motion.p>
  );
}

export const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-dim/60 focus:border-white/25 focus:outline-none transition-colors';

export const primaryButtonClass =
  'w-full rounded-xl bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink transition hover:brightness-110 disabled:opacity-40';
