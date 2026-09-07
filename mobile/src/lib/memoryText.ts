/**
 * Mobile capture has no separate "name it" step — whatever the user writes
 * IS the memory. `content` always holds the full text (nothing is ever
 * lost); `title` is a length-capped mirror only kept because the backend
 * schema requires a non-empty, <=120-char title field.
 */
const TITLE_MAX = 120;

export function toMemoryFields(raw: string): { title: string; content: string } {
  const trimmed = raw.trim();
  const title = trimmed.length > TITLE_MAX ? `${trimmed.slice(0, TITLE_MAX - 1)}…` : trimmed;
  return { title, content: trimmed };
}
