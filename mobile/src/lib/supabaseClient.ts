import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type User } from '@supabase/supabase-js';
import type { ApiUser } from '@tm/shared';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Maps a Supabase auth user onto the app's wire-format user shape. */
export function toApiUser(user: User): ApiUser {
  const meta = user.user_metadata as { name?: string } | null;
  return {
    id: user.id,
    email: user.email ?? '',
    name: meta?.name || user.email || 'You',
  };
}
