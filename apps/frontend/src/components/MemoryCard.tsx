import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Mic, Pencil, Clock3, Trash2 } from 'lucide-react';
import type { MemoryDTO } from '@tm/shared';
import { TimeAgo } from './TimeAgo';

interface MemoryCardProps {
  memory: MemoryDTO;
  onOpen: (memory: MemoryDTO) => void;
  onEdit: (memory: MemoryDTO) => void;
  onExtend: (memory: MemoryDTO, durationMs: number) => void;
  onDelete: (memory: MemoryDTO) => void;
}

export function MemoryCard({ memory, onOpen, onEdit, onExtend, onDelete }: MemoryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, filter: 'blur(2px)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      whileHover={{ y: -2 }}
      onClick={() => onOpen(memory)}
      className="group relative cursor-pointer rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition-colors hover:border-white/16 hover:bg-white/[0.05]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {memory.source === 'voice' && (
            <span title="Captured by voice" className="text-ink-dim">
              <Mic size={13} />
            </span>
          )}
          <h3 className="text-[15px] font-medium leading-snug text-ink">{memory.title}</h3>
        </div>

        <div ref={menuRef} className="relative -mr-1 -mt-1">
          <button
            aria-label="Memory actions"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="rounded-lg p-1.5 text-ink-dim opacity-0 transition hover:bg-white/8 hover:text-ink focus:opacity-100 group-hover:opacity-100"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#171715] py-1 shadow-xl shadow-black/40"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(memory);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-ink hover:bg-white/6"
              >
                <Pencil size={13} className="text-ink-dim" /> Edit
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onExtend(memory, 60 * 60_000);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-ink hover:bg-white/6"
              >
                <Clock3 size={13} className="text-ink-dim" /> Extend +1 hour
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(memory);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-danger hover:bg-white/6"
              >
                <Trash2 size={13} /> Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {memory.content && memory.content !== memory.title && (
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-dim">
          {memory.content}
        </p>
      )}

      <div className="mt-4">
        <TimeAgo expiresAt={memory.expiresAt} />
      </div>
    </motion.article>
  );
}
