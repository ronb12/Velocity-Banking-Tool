# How to Get App Store Connect API Key for Fastlane

## 📋 Step-by-Step Guide

### Step 1: Access App Store Connect

1. **Go to App Store Connect:**
   - Visit: https://appstoreconnect.apple.com
   - Sign in with your Apple Developer account

### Step 2: Navigate to API Keys

1. **Click on your name/avatar** (top right corner)
2. **Select "Users and Access"** from the dropdown
3. **Click on "Keys" tab** (in the left sidebar)
4. **Click the "+" button** to create a new key

### Step 3: Create API Key

1. **Enter Key Name:**
   - Name: "Fastlane API Key" (or any name you prefer)
   - Access: Select "App Manager" or "Admin" (depending on your needs)

2. **Click "Generate"**
   - ⚠️ **Important:** Download the `.p8` key file immediately
   - ⚠️ You can only download it once!
   - Save it in a secure location (e.g., `~/Documents/AppStoreConnectKeys/`)

3. **Note the Information:**
   - **Key ID:** (e.g., `ABC123DEF4`)
   - **Issuer ID:** (shown on the Keys page, looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - **Key File:** The `.p8` file you downloaded (e.g., `AuthKey_ABC123DEF4.p8`)

### Step 4: Set Up Environment Variables

**Option A: Temporary (Current Terminal Session)**
```bash
export FASTLANE_APP_STORE_CONNECT_API_KEY_KEY_ID="ABC123DEF4"
export FASTLANE_APP_STORE_CONNECT_API_KEY_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export FASTLANE_APP_STORE_CONNECT_API_KEY_KEY_FILEPATH="$HOME/Documents/AppStoreConnectKeys/AuthKey_ABC123DEF4.p8"
```

**Option B: Permanent (Add to ~/.zshrc or ~/.bash_profile)**
```bash
# Add these lines to your shell profile
export FASTLANE_APP_STORE_CONNECT_API_KEY_KEY_ID="ABC123DEF4"
export FASTLANE_APP_STORE_CONNECT_API_KEY_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export FASTLANE_APP_STORE_CONNECT_API_KEY_KEY_FILEPATH="$HOME/Documents/AppStoreConnectKeys/AuthKey_ABC123DEF4.p8"
```

Then reload your shell:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

### Step 5: Verify Setup

```bash
cd "/Users/ronellbradley/Desktop/Bradley's Finance Hub"
fastlane upload_metadata
```

Fastlane will use the API key to authenticate and upload metadata.

## 🔐 Security Best Practices

1. **Never commit the `.p8` file to git**
   - Add it to `.gitignore`:
     ```bash
     echo "*.p8" >> .gitignore
     echo "AuthKey_*.p8" >> .gitignore
     ```

2. **Store the key securely**
   - Keep it in a secure folder
   - Don't share it publicly
   - Use environment variables, not hardcoded paths

3. **Use environment variables**
   - Never hardcode the key file path in scripts
   - Use environment variables instead

## 📝 Quick Reference

**Direct Link to API Keys:**
https://appstoreconnect.apple.com/access/api

**What You Need:**
- ✅ Key ID (visible in App Store Connect)
- ✅ Issuer ID (visible on Keys page)
- ✅ `.p8` file (download once, save securely)

## 🔄 Alternative: Using Apple ID (Less Secure)

If you prefer not to use API keys:

```bash
export FASTLANE_USER="your-apple-id@example.com"
fastlane upload_metadata
```

You'll be prompted for:
- Apple ID password
- Two-factor authentication code
- App-Specific Password (if needed)

**Note:** API key method is more secure and recommended.

---

**Need Help?** See `fastlane/README.md` for more details.

