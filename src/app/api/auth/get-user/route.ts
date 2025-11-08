import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/get-user
 * Get user's client_id from auth token
 * Headers: Authorization: Bearer <access_token>
 */
export async function GET(request: NextRequest) {
  try {
    // Get the access token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the token and get user info
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    console.log('[GetUser] Looking for user with auth_id:', user.id);
    console.log('[GetUser] User email:', user.email);

    // Query by auth_id first (using admin client to bypass RLS)
    let { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('client_id, auth_id, email')
      .eq('auth_id', user.id)
      .maybeSingle();

    // If that fails, try by email
    if (userError || !userRow) {
      console.log('[GetUser] Query by auth_id failed, trying email:', user.email);
      const { data: userRowsByEmail, error: emailError } = await supabaseAdmin
        .from('users')
        .select('client_id, auth_id, email')
        .eq('email', user.email);

      if (!emailError && userRowsByEmail && userRowsByEmail.length > 0) {
        userRow = userRowsByEmail[0];
        console.log('[GetUser] Found user by email:', userRow);
        userError = null;
      } else {
        console.error('[GetUser] Query error:', userError || emailError);
        console.error('[GetUser] User rows found:', userRowsByEmail);
        return NextResponse.json(
          { error: 'User not found in users table' },
          { status: 404 }
        );
      }
    }

    if (!userRow?.client_id) {
      console.error('[GetUser] User found but no client_id:', userRow);
      return NextResponse.json(
        { error: 'No client assigned to this user' },
        { status: 400 }
      );
    }

    console.log('[GetUser] Found user with client_id:', userRow.client_id);

    return NextResponse.json({
      client_id: userRow.client_id,
      email: userRow.email,
    });
  } catch (error: any) {
    console.error('[GetUser] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


