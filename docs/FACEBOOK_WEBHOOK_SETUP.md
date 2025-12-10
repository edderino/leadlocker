# Facebook Lead Ads Webhook Setup

## ✅ Route Status

The Facebook webhook route is ready at:
- `/app/api/inbound/facebook/route.ts` ✅

## Environment Variables Required in Vercel

Go to: **Vercel → Project → Settings → Environment Variables**

Add these three variables:

| Key | Value | Status |
|-----|-------|--------|
| `FACEBOOK_WEBHOOK_TOKEN` | (leave empty for now) | ⏳ Pending Meta unlock |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | (leave empty for now) | ⏳ Pending Meta unlock |
| `SMS_DISPATCH_WEBHOOK` | `https://leadlocker.app/api/sms/dispatch` | ✅ Ready |

## Next Steps

1. ✅ Route created at `/app/api/inbound/facebook/route.ts`
2. ✅ SMS dispatch endpoint created at `/app/api/sms/dispatch/route.ts`
3. ⏳ Wait for Meta to unlock your account
4. ⏳ Set `FACEBOOK_WEBHOOK_TOKEN` in Vercel (use the token you configure in Facebook)
5. ⏳ Set `FACEBOOK_PAGE_ACCESS_TOKEN` in Vercel (long-lived Page Access Token)
6. ✅ Deploy to Vercel
7. ✅ Verify webhook in Facebook Lead Ads settings

## How It Works

1. Facebook sends webhook to `/api/inbound/facebook`
2. Route verifies webhook (GET) or processes lead (POST)
3. Fetches lead details from Facebook Graph API
4. Saves lead to Supabase `leads` table
5. Calls `/api/sms/dispatch` to send SMS notification
6. SMS dispatch endpoint sends alert via Twilio
