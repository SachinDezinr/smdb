import { createClient } from '@supabase/supabase-js';

// Using Vite environment variables for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://umkupiqsoblxkrxyaqst.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta3VwaXFzb2JseGtyeHlhcXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjA3MjUsImV4cCI6MjA4ODE5NjcyNX0.bOn-g8h_XgNqctLy0dNC1qFsXVge4nMiunoeoxTBbRg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'smdb' }
  }
});

// Export configuration status for the UI
export const isConfigured = !!supabaseUrl && !!supabaseAnonKey;