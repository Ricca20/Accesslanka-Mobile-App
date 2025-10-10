# Email Verification - Syncing Verified Status

## The Problem

You have **two separate** verification statuses:

1. **`auth.users.email_confirmed_at`** - Managed by Supabase Auth (timestamp)
2. **`public.users.verified`** - Your app's profile table (boolean)

When a user confirms their email:
- ✅ `auth.users.email_confirmed_at` gets set
- ❌ `public.users.verified` stays FALSE

## The Solution

Create a database trigger to automatically sync these two fields.

## Step 1: Run This SQL Migration

Go to **Supabase Dashboard → SQL Editor** and run:

\`\`\`sql
-- Function to sync email verification status from auth.users to public.users
CREATE OR REPLACE FUNCTION sync_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the verified column in public.users when email_confirmed_at is set
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at <> NEW.email_confirmed_at) THEN
    UPDATE public.users
    SET verified = TRUE
    WHERE id = NEW.id;
    
    RAISE LOG 'Email verified for user: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;

CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION sync_email_verification();

-- Update any existing confirmed users
UPDATE public.users u
SET verified = TRUE
FROM auth.users au
WHERE u.id = au.id
  AND au.email_confirmed_at IS NOT NULL
  AND u.verified = FALSE;
\`\`\`

## Step 2: Verify It Worked

Run this query to check:

\`\`\`sql
SELECT 
  au.email,
  au.email_confirmed_at IS NOT NULL as auth_confirmed,
  u.verified as profile_verified
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE au.email = 'company.rajapakshafoods@gmail.com';
\`\`\`

You should see:
- `auth_confirmed`: true
- `profile_verified`: true

## Step 3: Test the Complete Flow

1. **Delete your test user** from Supabase
2. **Restart your app:** \`npx expo start --clear\`
3. **Register a new user**
4. **Check email and click verification link**
5. **Check the console logs** - you should see:
   \`\`\`
   ✅ Email confirmation detected - confirming email...
   ✅ Email confirmed successfully!
   Session user: your-email@example.com
   User email_confirmed_at: 2025-10-10T...
   \`\`\`
6. **Check the database:**
   - `auth.users.email_confirmed_at` should have a timestamp
   - `public.users.verified` should be TRUE ✅

## What This Trigger Does

\`\`\`
User clicks verification link
         ↓
Supabase Auth confirms email
         ↓
auth.users.email_confirmed_at = NOW()
         ↓
🔥 TRIGGER FIRES
         ↓
public.users.verified = TRUE
         ↓
User profile marked as verified ✅
\`\`\`

## Alternative: Manually Fix Existing Users

If you have users who already confirmed their email but `verified` is still FALSE:

\`\`\`sql
UPDATE public.users u
SET verified = TRUE
FROM auth.users au
WHERE u.id = au.id
  AND au.email_confirmed_at IS NOT NULL
  AND u.verified = FALSE;
\`\`\`

## Troubleshooting

### Verified Still Shows FALSE After Email Confirmation

**Check 1: Was email actually confirmed?**
\`\`\`sql
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email = 'your-email@example.com';
\`\`\`

If `email_confirmed_at` is NULL, the email wasn't confirmed. Check the app logs.

**Check 2: Does the trigger exist?**
\`\`\`sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_email_confirmed';
\`\`\`

If no results, run the migration again.

**Check 3: Check trigger logs**
Look in Supabase logs for the trigger execution.

### Deep Link Not Working

See the improved logging in App.js. The console should show:
\`\`\`
=== Deep link received ===
Full URL: exp://...
✅ Email confirmation detected - confirming email...
✅ Email confirmed successfully!
\`\`\`

If you don't see this, the deep link isn't being captured.

## Files Created

- ✅ \`sync-email-verification-trigger.sql\` - Database trigger
- ✅ Updated \`App.js\` - Better logging for deep links

## Next Steps

1. **Run the SQL migration** in Supabase
2. **Restart your app**
3. **Test with a new user registration**
4. **Verify the \`verified\` column updates to TRUE**
