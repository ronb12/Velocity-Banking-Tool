# Step-by-Step: Getting App Store Connect API Key

## 🔍 Quick Navigation Guide

### Option 1: Step-by-Step Navigation (Recommended)

1. **Sign in to App Store Connect:**
   - Go to: https://appstoreconnect.apple.com
   - Sign in with your Apple ID that has an Apple Developer account

2. **Find Your Profile:**
   - Look at the **top right corner** of the page
   - You should see your **profile icon** (circle with initials) or your **name**
   - Click on it

3. **Open Users and Access:**
   - A dropdown menu will appear
   - Click on **"Users and Access"** (or "Account" → "Users and Access")

4. **Go to Keys Tab:**
   - You'll see a left sidebar with options like:
     - Users
     - **Keys** ← Click this one!
     - Integrations
   - Click on **"Keys"**

5. **Create New Key:**
   - Click the **"+" button** (top right) or **"Generate API Key"** button
   - Follow the prompts

### Option 2: Direct URLs (If Navigation Doesn't Work)

Try these URLs in order:

1. **Main Users and Access Page:**
   ```
   https://appstoreconnect.apple.com/access/users
   ```
   Then click "Keys" in the left sidebar

2. **Direct Keys Page:**
   ```
   https://appstoreconnect.apple.com/access/api
   ```

3. **Account Settings:**
   ```
   https://appstoreconnect.apple.com/access/account
   ```
   Then navigate to Keys

### Option 3: Search Function

1. Sign in to App Store Connect
2. Use the **search bar** at the top
3. Type: **"API Keys"** or **"Keys"**
4. Select the relevant result

## ⚠️ Common Issues & Solutions

### Issue: "Page Not Found" Error

**Possible Causes:**
1. **Wrong Account Role:** API Keys are only available to:
   - Account Holder (full access)
   - Admin role
   - If you have "App Manager" or "Developer" role, ask an Admin to create the key

2. **Not Signed In:** Make sure you're fully signed in to App Store Connect

3. **Browser Issues:**
   - Clear browser cache
   - Try a different browser (Chrome, Safari, Firefox)
   - Try incognito/private mode

4. **Wrong Link:** The direct link might have changed - use manual navigation instead

### Issue: Can't Find "Users and Access" Option

**Solutions:**
1. **Check Your Role:**
   - Only Account Holders and Admins can access API Keys
   - Contact your team's Account Holder if needed

2. **Different Account:**
   - You might be signed in with a personal Apple ID
   - Make sure you're using the Apple ID associated with your Developer Program

3. **Developer Portal vs App Store Connect:**
   - API Keys are in **App Store Connect** (not developer.apple.com)
   - Make sure you're on appstoreconnect.apple.com

### Issue: "Keys" Tab Not Visible

**If you don't see the Keys tab:**
1. Your account might not have the required permissions
2. The Developer Program might not be active
3. Contact Apple Developer Support if you're the Account Holder

## 🔑 What You Need to Create the Key

1. **Key Name:** (e.g., "Fastlane API Key" or "CI/CD Key")
2. **Access Level:** 
   - Select "Admin" for full access
   - Or "App Manager" for app-specific access

## 📝 After Creating the Key

You'll get:
1. **Key ID:** A 10-character string (e.g., `ABC123DEF4`)
2. **Issuer ID:** A UUID format string (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. **.p8 File:** Download immediately (you can only download once!)

## 🆘 Still Having Issues?

1. **Contact Apple Developer Support:**
   - https://developer.apple.com/contact/
   - They can help with account access issues

2. **Check Apple's Documentation:**
   - https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api

3. **Alternative: Use Apple ID Instead:**
   - If you can't access API Keys, you can use your Apple ID
   - Set: `export FASTLANE_USER="your-apple-id@example.com"`
   - Fastlane will prompt for password and 2FA

---

**Last Updated:** November 2024
**If these steps don't work, Apple may have changed their interface - check Apple's latest documentation**

