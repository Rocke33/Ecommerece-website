import { createClient } from '@supabase/supabase-js';

// Retrieve your credentials safely from the environment configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Current App Supabase URL:', supabaseUrl);

// Throw an early error if the keys are missing to save you from blank page bugs
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables! Please check your .env file.');
}

// Initialize and export the single database connection client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);