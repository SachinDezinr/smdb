import { createClient } from '@supabase/supabase-js';

// These variables are injected when you connect Supabase via the UI button
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback to prevent crash during initialization if variables are missing
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn("CineTrack: Supabase credentials missing. Please connect Supabase using the button above the chat.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export { isConfigured };