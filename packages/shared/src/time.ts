/** Expiry quick choices + small date/formatting helpers. Presentation only. */

export interface ExpiryChoice {
  key: string;
  label: string;
  compute: (now: Date) => Date;
}

export const EXPIRY_CHOICES: ExpiryChoice[] = [
  { key: '30m', label: '30 min', compute: (n) => new Date(n.getTime() + 30 * 60_000) },
  { key: '2h', label: '2 hours', compute: (n) => new Date(n.getTime() + 2 * 3_600_000) },
  {
    key: 'tonight',
    label: 'Tonight',
    compute: (n) => {
      const d = new Date(n);
      d.setHours(23, 0, 0, 0);
      if (d.getTime() <= n.getTime() + 60_000) d.setDate(d.getDate() + 1);
      return d;
    },
  },
  { key: 'tomorrow', label: 'Tomorrow', compute: (n) => new Date(n.getTime() + 24 * 3_600_000) },
  { key: '3d', label: '3 days', compute: (n) => new Date(n.getTime() + 3 * 86_400_000) },
  { key: '1w', label: '1 week', compute: (n) => new Date(n.getTime() + 7 * 86_400_000) },
  { key: 'custom', label: 'Custom', compute: (n) => new Date(n.getTime() + 60 * 60_000) },
];

/** Human remaining time: "28 min", "2h 18m", "0d 22h", "1w 2d". No seconds. */
export function formatRemaining(expiresAt: string | Date, now: number): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return 'Forgotten';

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'moments';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 20) {
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 6) {
    const rem = hours % 24;
    return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
  }
  const weeks = Math.floor(days / 7);
  return weeks > 0 ? `${weeks}w ${days % 7}d` : `${days} days`;
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatExpiryClock(expiresAt: string | Date): string {
  return timeFmt.format(new Date(expiresAt));
}

export function formatExpiryFull(expiresAt: string | Date): string {
  return dateTimeFmt.format(new Date(expiresAt));
}

export function formatCreated(createdAt: string | Date): string {
  const d = new Date(createdAt);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (sameDay) return `Created today at ${timeFmt.format(d)}`;
  if (isYesterday) return `Created yesterday at ${timeFmt.format(d)}`;
  return `Created ${dateTimeFmt.format(d)}`;
}

export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
