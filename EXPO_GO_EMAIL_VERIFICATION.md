# Email Verification with Expo Go - Complete Guide

## ✅ YES, You Can Verify Email in Expo Go!

Email verification works in Expo Go, but requires specific configuration.

## Step-by-Step Setup for Expo Go

### Step 1: Get Your Expo Development URL

When you run `npx expo start`, you'll see something like:
```
Metro waiting on exp://172.20.10.6:8081
```

**Copy this URL!** You'll need it for Supabase configuration.

### Step 2: Configure Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication → URL Configuration**

3. **Add these Redirect URLs:**
   ```
   exp://172.20.10.6:8081
   exp://localhost:8081
   http://localhost:8081
   ```
   ⚠️ **Important:** Replace `172.20.10.6:8081` with YOUR actual Expo dev server URL!

4. **Set Site URL to:**
   ```
   exp://172.20.10.6:8081
   ```
   (Use your actual URL)

5. **Click Save**

### Step 3: Test Email Verification

1. **Register a new user** in your app

2. **Check your email** for the verification link

3. **Click the verification link**

4. **What should happen:**
   - Link opens in browser first
   - Browser shows: "Open in Expo Go?" or redirects automatically
   - App opens in Expo Go
   - Console shows: "Email confirmed successfully!"
   - User is automatically logged in ✅

### Step 4: Check Console Logs

You should see:
```
✅ Deep link received: exp://172.20.10.6:8081#access_token=...
✅ Type: signup, Access Token exists: true
✅ Email confirmation detected
✅ Email confirmed successfully!
✅ Auth state changed: SIGNED_IN Session exists
```

## Troubleshooting

### Issue: Link Opens Browser but Doesn't Return to App

**Solution 1: Manually Open in Expo Go**
1. Copy the entire URL from the browser address bar
2. Open Expo Go app
3. Use the URL input at the top
4. Paste the URL
5. App should confirm email

**Solution 2: Use QR Code Method**
1. After clicking email link in browser
2. Look for "Open with Expo Go" button
3. Or scan QR code if shown

**Solution 3: Check Redirect URLs**
- Make sure your Expo dev server URL is in Supabase redirect URLs
- URL must match exactly (including port number)
- Restart Expo after changes: `npx expo start --clear`

### Issue: "Invalid Redirect URL" Error

1. Double-check the URL in Supabase matches your Expo dev URL
2. Make sure there's no typo
3. Restart your Expo server
4. Try again with a new user

### Issue: Email Not Received

1. Check spam/junk folder
2. Wait 2-3 minutes
3. Check Supabase logs: Authentication → Logs
4. Try with a different email address

## Alternative: Skip Email Verification for Testing

If you just want to test the app without email verification:

### Method 1: Manually Confirm User
Run in Supabase SQL Editor:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'your-test-email@example.com';
```

### Method 2: Disable Email Confirmation
1. Go to: Authentication → Providers → Email
2. Toggle OFF "Confirm email"
3. Save
4. New users can login immediately without verification

## Important Notes

### For Development (Expo Go):
- ✅ Works with `exp://` scheme
- ✅ Link opens browser first, then Expo Go
- ✅ URL changes every time you restart Expo or change networks
- ⚠️ Update Supabase redirect URLs if your Expo URL changes

### For Production (Standalone Build):
- ✅ Uses custom scheme: `accesslanka://`
- ✅ Direct deep linking (no browser)
- ✅ More seamless experience
- ✅ Configure before building with EAS

## Current Configuration Status

✅ Code updated to work with Expo Go
✅ Deep link handler configured
✅ Email confirmation logic implemented

⚠️ **You need to:** Configure Supabase redirect URLs with your Expo dev server URL

## Quick Test Checklist

- [ ] Get your Expo dev URL from terminal
- [ ] Add URL to Supabase redirect URLs
- [ ] Save Supabase changes
- [ ] Restart Expo: `npx expo start --clear`
- [ ] Delete existing test user
- [ ] Register new user
- [ ] Check email
- [ ] Click verification link
- [ ] Confirm app opens and logs user in

## What Happens in Expo Go

```
1. User registers → Email sent
2. User clicks link → Opens browser
3. Browser redirects → Expo Go opens
4. Deep link captured → Email confirmed
5. Session created → User logged in ✅
```

## Production vs Expo Go

| Feature | Expo Go | Production Build |
|---------|---------|------------------|
| Deep link scheme | `exp://` | `accesslanka://` |
| Browser redirect | Yes | No (direct) |
| Setup complexity | Medium | Easy |
| User experience | Good | Excellent |

## Next Steps

1. **Configure Supabase** with your Expo URL (5 minutes)
2. **Test verification** with a new user
3. **For production:** Build with EAS and use custom scheme

**Your code is ready! Just update Supabase redirect URLs and test!** 📧✅
