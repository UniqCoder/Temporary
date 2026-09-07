function portFromEnv(): number {
  const parsed = Number(process.env.PORT);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3001;
}

export const PORT = portFromEnv();
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
// Optional: only needed to fulfil account deletion (Supabase's admin API).
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.');
}
