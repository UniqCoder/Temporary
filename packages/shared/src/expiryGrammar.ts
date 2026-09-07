/**
 * Deterministic natural-language expiry grammar — the single copy of this
 * product policy, consumed by backend validation and frontend preview alike.
 * Returns a future Date, or null when nothing is understood.
 */

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

type Rule = { re: RegExp; compute: (now: Date, m: RegExpMatchArray) => Date | null };

const RULES: Rule[] = [
  // "until 10 PM", "till 22:30", "at 9am"
  {
    re: /\b(?:un ?til|till?|at)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
    compute: (now, m) => nextClockTime(now, Number(m[1]), Number(m[2] ?? 0), m[3]!.toLowerCase()),
  },
  {
    re: /\b(?:un ?til|till?|at)\s+(\d{1,2}):(\d{2})\b/i,
    compute: (now, m) => nextClockTime(now, Number(m[1]), Number(m[2]!), '24h'),
  },
  { re: /\btonight\b/i, compute: (now) => endOfTodayish(now, 23) },
  { re: /\btomorrow\s+(morning|afternoon|evening|night)\b/i, compute: (now, m) => endOfTomorrowish(now, m[1]!) },
  { re: /\b(?:tomorrow|tmr|tmrw)\b/i, compute: (now) => addDays(now, 1) },
  { re: /\bnext week\b/i, compute: (now) => addDays(now, 7) },
  {
    re: /\b(?:in|for)\s+(\d+)\s*(min(?:ute)?s?|h(?:ou)?rs?|days?|weeks?)\b/i,
    compute: (now, m) => relativeTime(now, Number(m[1]), m[2]!),
  },
  {
    re: /\b(?:un ?til|till?|by|on|next)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i,
    compute: (now, m) => nextWeekday(now, (WEEKDAYS as readonly string[]).indexOf(m[1]!.toLowerCase())),
  },
  { re: /\bthis weekend\b/i, compute: (now) => nextWeekday(now, 6) },
  { re: /\bend of (?:the )?week\b/i, compute: (now) => nextWeekday(now, 0) },
];

export function parseExpiry(text: string): Date | null {
  const now = new Date();
  for (const rule of RULES) {
    const m = text.match(rule.re);
    if (m) {
      const date = rule.compute(now, m);
      if (date && date.getTime() > now.getTime()) return date;
    }
  }
  return null;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Next given weekday, with a one-day lookahead so it never fires immediately. */
function nextWeekday(now: Date, weekday: number): Date {
  const d = addDays(now, 1);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  return d;
}

function relativeTime(now: Date, amount: number, unit: string): Date {
  if (/^min/i.test(unit)) return new Date(now.getTime() + amount * 60_000);
  if (/^h/i.test(unit)) return new Date(now.getTime() + amount * 3_600_000);
  if (/^day/i.test(unit)) return addDays(now, amount);
  return addDays(now, amount * 7);
}

/** "10 PM" style time today; if already past (or within a minute), roll to tomorrow. */
function nextClockTime(now: Date, hourRaw: number, minute: number, meridiem: string): Date {
  let hour = hourRaw % 24;
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;

  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= now.getTime() + 60_000) d.setDate(d.getDate() + 1);
  return d;
}

function endOfTodayish(now: Date, hour: number): Date {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= now.getTime() + 60_000) d.setDate(d.getDate() + 1);
  return d;
}

function endOfTomorrowish(now: Date, part: string): Date {
  const d = addDays(now, 1);
  const hour = part === 'morning' ? 9 : part === 'afternoon' ? 13 : 20;
  d.setHours(hour, 0, 0, 0);
  return d;
}
