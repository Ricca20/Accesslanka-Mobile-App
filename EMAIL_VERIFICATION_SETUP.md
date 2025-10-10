# Email Verification Deep Link Setup Guide

## Step 1: Update Supabase Dashboard Settings

Go to your Supabase Dashboard and configure the redirect URLs:

### 1. Navigate to Authentication Settings
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **Authentication** in the sidebar
4. Click on **URL Configuration**

### 2. Add Redirect URLs
Add these URLs to the **Redirect URLs** section:

**For Expo Go (Development):**
```
exp://172.20.10.6:8081
exp://localhost:8081
http://localhost:8081
https://auth.expo.io/@your-expo-username/accesslanka
```
(Replace `172.20.10.6:8081` with your actual Expo dev server URL shown in the terminal)
(Replace `your-expo-username` with your Expo account username)

**For Production (Standalone Builds):**
```
accesslanka://confirm-email
accesslanka://reset-password
accesslanka://login
```

### 3. Configure Site URL
Set the **Site URL** to:
```
accesslanka://
```

### 4. Save Changes
Click **Save** to apply the changes.

## Step 2: Update Email Templates (Optional)

To customize the email confirmation link:

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Find the confirmation link in the template
4. The link should use: `{{ .ConfirmationURL }}`
5. Make sure it's pointing to your redirect URL

## Step 3: Test the Flow

1. Delete the existing test user from Supabase
2. Wait 1 minute
3. Register a new user in your app
4. Check your email for the verification link
5. Click the link
6. The app should open and automatically confirm your email
7. You should be logged in automatically

## Troubleshooting

### Link Opens Browser Instead of App
- Make sure the redirect URLs are configured correctly in Supabase
- Restart your app after making changes
- Clear Expo cache: `npx expo start --clear`

### "Invalid Redirect URL" Error
- Add your redirect URL to the allowed list in Supabase Dashboard
- Make sure there are no typos in the URL scheme

### Link Does Nothing
- Check the console logs for errors
- Make sure deep linking is configured in app.config.js
- Verify the URL scheme matches: `accesslanka://`

### Email Not Received
- Check spam folder
- Wait 2-3 minutes
- Check Supabase logs for email delivery status

## Development Mode

For development/testing, you can:

1. **Disable email confirmation:**
   - Go to Authentication → Providers → Email
   - Turn OFF "Confirm email"
   - Save

2. **Manually confirm users:**
   ```sql
   UPDATE auth.users 
   SET email_confirmed_at = NOW() 
   WHERE email = 'your-test-email@example.com';
   ```

## Code Changes Made

✅ Updated `database.js` - Added email redirect URL
✅ Updated `App.js` - Added email confirmation handler
✅ Updated deep linking configuration

## Next Steps

After completing the Supabase configuration:
1. Restart your Expo development server
2. Test the complete flow from registration to email confirmation
3. Verify the user can login after email confirmation
