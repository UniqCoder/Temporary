import { createClient, type User } from '@supabase/supabase-js';
import type { ApiUser } from '@tm/shared';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(url, anonKey);

/** Maps a Supabase auth user onto the app's wire-format user shape. */
export function toApiUser(user: User): ApiUser {
  const meta = user.user_metadata as { name?: string } | null;
  return {
    id: user.id,
    email: user.email ?? '',
    name: meta?.name || user.email || 'You',
  };
}
