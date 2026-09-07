/** Capture-text heuristics: turning raw input into a title/content pair. */

export function deriveTitleContent(raw: string): { title: string; content: string } {
  const text = raw.trim();
  if (!text) return { title: '', content: '' };

  // Split off the first sentence/line; everything after it becomes detail text.
  const split = text.match(/^([\s\S]*?[.!?\n])([\s\S]*)$/);
  const firstSentence = split ? split[1]!.trim() : text;
  const rest = split ? split[2]!.trim() : '';

  // Strip common capture prefixes for a cleaner title.
  const stripped = firstSentence
    .replace(/^(remember|note|don'?t forget)\s+(that\s+|to\s+)?/i, '')
    .trim();

  // "Parked at B3-27" / "I parked in B3-27" → title "Parking — B3-27"
  const parking = stripped.match(/^(?:i\s+)?(?:parked|parking)\s+(?:at|in|on)\s+(.+)$/i);

  const title = (parking ? `Parking — ${parking[1]}` : stripped || firstSentence || text).slice(0, 80);

  // Only the text beyond the first sentence counts as "content" — a single
  // short line becomes just a title, not a title with itself repeated below.
  return { title: title || 'Untitled', content: rest };
}

/** Pull the expiry phrase out of a transcript like "... until 10 PM". */
export function extractExpiryPhrase(text: string): { cleaned: string; matched: boolean } {
  const re =
    /\b(?:un ?til|till?|by|for\s+\d+\s*(?:min(?:ute)?s?|h(?:ou)?rs?|days?|weeks?)|tonight|tomorrow(?:\s+\w+)?|next week|this weekend|end of (?:the )?week|next\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday))\b[\s,]*(?:.*)?$/i;
  const m = text.match(re);
  if (!m || m.index === undefined) return { cleaned: text, matched: false };
  return { cleaned: text.slice(0, m.index).trim(), matched: true };
}
