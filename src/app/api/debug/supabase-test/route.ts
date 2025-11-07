import { NextResponse } from 'next/server';
import { supabase } from '@/libs/supabaseClient';

export async function GET() {
  try {
    // Test if Supabase client is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Try a simple query to test connection
    const { data, error } = await supabase.from('leads').select('id').limit(1);
    
    return NextResponse.json({
      configured: {
        url: supabaseUrl,
        hasAnonKey,
      },
      connectionTest: {
        success: !error,
        error: error?.message,
      },
    });
  } catch (e: any) {
    return NextResponse.json({
      error: e.message,
    }, { status: 500 });
  }
}

