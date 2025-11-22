import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For development with placeholder credentials, create a mock client
const mockSupabaseClient = {
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Mock client - no database connected' } }) }) }),
    update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Mock client - no database connected' } }) }) }) }),
    delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Mock client - no database connected' } }) }),
    order: () => Promise.resolve({ data: [], error: null })
  })
};

let supabase: SupabaseClient;
if (supabaseUrl && supabaseAnonKey) {
  console.log('Using real Supabase client');
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Using mock Supabase client - missing credentials');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase = mockSupabaseClient as any;
}

export { supabase };

export interface SuperAdmin {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}
