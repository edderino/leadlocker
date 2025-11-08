# Debug Login Flow

## Check Browser Console

After trying to login, open the browser console (F12) and look for these logs:

1. `[Login] Fetching user client_id via API`
2. `[Login] User ID: ...`
3. `[Login] User email: ...`
4. `[Login] Found user with client_id: ...`
5. `[Login] Redirecting to: ...`

Also look for:
- `[ClientGuard] ...` logs
- Any red error messages

## What to check

If you see:
- `[Login] Found user with client_id: demo-org` followed by `[Login] Redirecting to: /client/demo-org` → Login is working
- Then `[ClientGuard] Access denied...` → ClientGuard is blocking it (client_id mismatch or RLS issue)
- No logs at all → API route isn't being called (network issue)
- `Failed to fetch` → API route crashed or server isn't running

## Current Setup

- User: `demo@leadlocker.app`
- Expected `client_id`: `demo-org`
- Redirect target: `/client/demo-org`

## Quick Fix

If ClientGuard is blocking, check the console for:
```
[ClientGuard] Access denied - client_id mismatch: {userClientId: '...', expectedOrgId: '...'}
```

If the values don't match, run this SQL:
```sql
UPDATE users SET client_id = 'demo-org' WHERE email = 'demo@leadlocker.app';
```


