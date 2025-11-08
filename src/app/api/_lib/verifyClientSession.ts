import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/libs/supabaseAdmin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or anon key is not configured');
}

type VerifySuccess = {
  ok: true;
  clientId: string;
};

type VerifyFailure = {
  ok: false;
  status: number;
  error: string;
};

export async function verifyClientSession(token: string): Promise<VerifySuccess | VerifyFailure> {
  if (!token) {
    return { ok: false, status: 401, error: 'Missing session token' };
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token);

  if (authError || !user) {
    return { ok: false, status: 401, error: 'Invalid token' };
  }

  let { data: userRow, error: userError } = await supabaseAdmin
    .from('users')
    .select('client_id, auth_id, email')
    .eq('auth_id', user.id)
    .maybeSingle();

  if ((!userRow || userError) && user.email) {
    const { data: rowsByEmail, error: emailError } = await supabaseAdmin
      .from('users')
      .select('client_id, auth_id, email')
      .eq('email', user.email);

    if (!emailError && rowsByEmail && rowsByEmail.length > 0) {
      userRow = rowsByEmail[0];
      userError = null;
    }
  }

  if (userError || !userRow) {
    return { ok: false, status: 403, error: 'User not found in users table' };
  }

  if (!userRow.client_id) {
    return { ok: false, status: 403, error: 'No client assigned to this user' };
  }

  return { ok: true, clientId: userRow.client_id };
}

