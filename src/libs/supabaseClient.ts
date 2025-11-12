// Legacy export for backward compatibility
// New code should use src/utils/supabase/client.ts instead
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
  }
} else {
  console.error('Missing Supabase environment variables');
}

export const supabase = supabaseInstance;

