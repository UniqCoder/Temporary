import { useNow } from '../hooks/useNow';
import { formatRemaining } from '@tm/shared';

interface TimeAgoProps {
  expiresAt: string;
  className?: string;
  prefix?: string;
}

/** Remaining-time label. Presentation only — the DB timestamp is authoritative. */
export function TimeAgo({ expiresAt, className = '', prefix = 'FORGETS IN' }: TimeAgoProps) {
  const now = useNow(1000);
  const remaining = formatRemaining(expiresAt, now);
  const ms = new Date(expiresAt).getTime() - now;

  const urgent = ms < 5 * 60_000;
  const soon = ms < 30 * 60_000 && !urgent;

  return (
    <div className={className}>
      <div className="text-[10px] font-medium tracking-[0.18em] text-ink-dim">{prefix}</div>
      <div
        className={`mt-1 font-mono text-lg tabular-nums transition-colors duration-700 ${
          urgent ? 'text-danger' : soon ? 'text-accent' : 'text-ink'
        } ${remaining === 'Forgotten' ? 'opacity-40' : ''}`}
      >
        {remaining}
      </div>
    </div>
  );
}
