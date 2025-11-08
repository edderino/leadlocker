# Login System Fix - Complete Breakdown

## 🎯 The Problem

The login page was showing errors:
1. **"No client assigned to this user"** - User exists in `auth.users` but query couldn't find them in `users` table
2. **Empty query results** - Client-side queries returning `[]` even though data existed
3. **RLS blocking queries** - Row-Level Security policies were preventing authenticated users from reading their own records
4. **White page** - Syntax errors causing page to crash

---

## 🔍 Root Causes Discovered

### 1. **Database Schema Mismatch**
- The `users` table had `auth_id` and `client_id` columns, but they weren't properly linked
- User existed in `auth.users` but the `users` table record had:
  - Missing or NULL `auth_id`
  - Missing or NULL `client_id`

### 2. **RLS Policy Issues**
- Phase 5 migrations removed the permissive "allow all" policies
- New RLS policies were created for `leads` and `events` tables
- **BUT**: No policy was created for authenticated users to read from the `users` table
- Client-side queries using the anon key were being blocked by RLS

### 3. **Authentication Flow Problems**
- Login was trying to query `users` table client-side immediately after login
- Session wasn't fully established before querying
- Client-side Supabase client (anon key) couldn't bypass RLS

### 4. **Code Issues**
- Nested try-catch blocks with missing catch handlers
- Using `router.push()` which can cause refresh loops
- ClientGuard also trying to query `users` table client-side (same RLS issue)

---

## 🛠️ Solutions Implemented

### Step 1: Database Verification & Fix

**File Created:** `docs/diagnose_user.sql`
- Checked if user exists in `auth.users`
- Checked if user exists in `users` table
- Verified `auth_id` linking
- Verified `client_id` value

**Result:** User was properly linked (`auth_id` matched, `client_id` was `client_ed`)

### Step 2: RLS Policy Fix

**File Created:** `docs/fix_rls_users_policy_v2.sql`

```sql
-- Drop conflicting policies
DROP POLICY IF EXISTS "Authenticated users can read own user record" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "users_self_select_only" ON users;

-- Create policy for auth_id matching
CREATE POLICY "Users can read own record by auth_id"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_id::uuid = auth.uid());

-- Create policy for email fallback
CREATE POLICY "Users can read own record by email"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = auth.uid() 
        AND auth.users.email = users.email
    )
  );
```

**Issue:** These policies still didn't work reliably due to RLS evaluation timing.

### Step 3: API Route Solution (Final Fix)

**File Created:** `src/app/api/auth/get-user/route.ts`

**Why this works:**
- Uses `supabaseAdmin` (service role key) which **bypasses RLS completely**
- Server-side route, so no client-side RLS restrictions
- Verifies the auth token to ensure security
- Queries `users` table with admin privileges

**Key Code:**
```typescript
// Verify token
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

// Query with admin client (bypasses RLS)
let { data: userRow, error: userError } = await supabaseAdmin
  .from('users')
  .select('client_id, auth_id, email')
  .eq('auth_id', user.id)
  .maybeSingle();

// Fallback to email query if needed
if (userError || !userRow) {
  const { data: userRowsByEmail } = await supabaseAdmin
    .from('users')
    .select('client_id, auth_id, email')
    .eq('email', user.email);
  // ...
}
```

### Step 4: Login Page Update

**File Modified:** `src/app/login/page.tsx`

**Changes:**
1. **Removed client-side user query** - No longer queries `users` table directly
2. **Uses API route** - Calls `/api/auth/get-user` after authentication
3. **Gets access token** - Uses `data.session?.access_token` from login response
4. **Hard redirect** - Uses `window.location.href` instead of `router.push()` to avoid refresh loops
5. **Fixed syntax error** - Removed nested try-catch, added proper error handling
6. **Added loading state** - Prevents double submissions

**Key Code:**
```typescript
// Get access token from login response
const accessToken = data.session?.access_token;

// Call API route (bypasses RLS)
const userResponse = await fetch('/api/auth/get-user', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

// Hard redirect
window.location.href = `/client/${userData.client_id}`;
```

### Step 5: ClientGuard Update

**File Modified:** `src/components/auth/ClientGuard.tsx`

**Changes:**
1. **Removed client-side user query** - No longer queries `users` table directly
2. **Uses API route** - Calls `/api/auth/get-user` to verify user
3. **Checks client_id match** - Verifies user's `client_id` matches the `orgId` from URL

**Key Code:**
```typescript
// Use API route instead of direct query
const userResponse = await fetch('/api/auth/get-user', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});

const userData = await userResponse.json();

// Verify client_id matches orgId
if (!userData.client_id || userData.client_id !== orgId) {
  router.replace(`/login?redirectedFrom=${encodeURIComponent(pathname)}`);
  return;
}
```

### Step 6: Supabase Client Safety

**File Modified:** `src/libs/supabaseClient.ts`

**Changes:**
- Made initialization safer to prevent crashes if env vars are missing
- Added error handling for missing environment variables

---

## 📋 Final Architecture

### Authentication Flow

1. **User logs in** → `supabase.auth.signInWithPassword()`
2. **Get access token** → From `data.session.access_token`
3. **Call API route** → `GET /api/auth/get-user` with Bearer token
4. **API verifies token** → Uses anon key client to verify
5. **API queries users table** → Uses admin client (bypasses RLS)
6. **Returns client_id** → Login page receives `client_id`
7. **Redirect** → `window.location.href = /client/${client_id}`

### Protection Flow

1. **User accesses** → `/client/client_ed`
2. **ClientGuard runs** → Checks for session
3. **Calls API route** → `GET /api/auth/get-user` with session token
4. **Verifies client_id** → Matches `orgId` from URL
5. **Renders dashboard** → If match, otherwise redirects to login

---

## 🔐 Security Notes

### Why This Is Secure

1. **Token Verification** - API route verifies the JWT token before querying
2. **Service Role Only** - Only the API route uses service role key (server-side only)
3. **Client-Side Never Has Admin Access** - Client-side code only uses anon key
4. **Authorization Check** - ClientGuard verifies `client_id` matches URL `orgId`

### Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` - Public URL (client + server)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key (client + server, for token verification)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server only, for bypassing RLS)

---

## 🗂️ Files Created/Modified

### Created:
- `src/app/api/auth/get-user/route.ts` - API route for user lookup (bypasses RLS)
- `docs/diagnose_user.sql` - Diagnostic queries
- `docs/fix_rls_users_policy_v2.sql` - RLS policy fixes (attempted)
- `docs/fix_client_id.sql` - Client ID fix script
- `docs/sync_user_auth_id.sql` - User sync script

### Modified:
- `src/app/login/page.tsx` - Updated to use API route
- `src/components/auth/ClientGuard.tsx` - Updated to use API route
- `src/libs/supabaseClient.ts` - Made initialization safer

---

## ✅ What Works Now

1. ✅ Login page loads without errors
2. ✅ User can authenticate with email/password
3. ✅ System finds user's `client_id` from database
4. ✅ User is redirected to correct client dashboard (`/client/client_ed`)
5. ✅ ClientGuard protects routes and verifies access
6. ✅ All queries bypass RLS using service role key (server-side)

---

## 🎓 Key Learnings

1. **RLS is strict** - Client-side queries with anon key are subject to RLS policies
2. **Service role bypasses RLS** - Use it server-side for admin operations
3. **API routes are the solution** - When RLS blocks client-side queries, use API routes
4. **Token-based auth** - Verify JWT tokens server-side before granting access
5. **Hard redirects** - Use `window.location.href` when `router.push()` causes issues

---

## 🚀 Next Steps (If Needed)

1. **Add error boundaries** - Better error handling in React components
2. **Add loading states** - Show spinners during auth checks
3. **Session refresh** - Auto-refresh expired tokens
4. **Logout functionality** - Clear session and redirect
5. **Multi-client support** - Allow users with multiple `client_id`s to choose

---

## 📝 Summary

The core issue was **RLS blocking client-side queries**. The solution was to:
1. Create an API route that uses the service role key (bypasses RLS)
2. Update login page to call this API route instead of querying directly
3. Update ClientGuard to use the same API route
4. Fix syntax errors and improve error handling

**Result:** Login system now works reliably, securely, and without RLS blocking issues.


