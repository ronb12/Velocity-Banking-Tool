# Fastlane Configuration for App Store Connect

This Fastlane configuration allows you to upload metadata to App Store Connect via command line.

## 🚀 Quick Start

### Option 1: Using App Store Connect API Key (Recommended)

1. **Create an App Store Connect API Key:**
   - Go to: https://appstoreconnect.apple.com/access/api
   - Click "Keys" → "+" to create a new key
   - Download the `.p8` key file
   - Note the Key ID and Issuer ID

2. **Set Environment Variables:**
   ```bash
   export FASTLANE_APP_STORE_CONNECT_API_KEY_KEY_ID="your-key-id"
   export FASTLANE_APP_STORE_CONNECT_API_KEY_ISSUER_ID="your-issuer-id"
   export FASTLANE_APP_STORE_CONNECT_API_KEY_KEY_FILEPATH="/path/to/AuthKey_XXXXX.p8"
   ```

3. **Upload Metadata:**
   ```bash
   fastlane upload_metadata
   ```

### Option 2: Using Apple ID (Less Secure)

1. **Set your Apple ID:**
   ```bash
   export FASTLANE_USER="your-apple-id@example.com"
   ```

2. **Upload Metadata:**
   ```bash
   fastlane upload_metadata
   ```
   - You'll be prompted for your Apple ID password
   - You may need to set up an App-Specific Password

## 📋 Available Commands

### Upload Metadata Only
```bash
fastlane upload_metadata
```
Uploads all metadata (description, keywords, etc.) without uploading a new build.

### Upload App + Metadata
```bash
fastlane upload_app
```
Builds, archives, and uploads the app along with metadata.

### Submit for Review
```bash
fastlane submit_for_review
```
Submits the app for App Store review (after metadata and build are uploaded).

### Download Existing Metadata
```bash
fastlane download_metadata
```
Downloads current metadata from App Store Connect to local files.

## ⚙️ Configuration

All metadata is configured in `Deliverfile`. Edit that file to update:
- App name
- Description
- Keywords
- Release notes
- URLs
- Pricing
- Categories

## 📸 Screenshots

Screenshots need to be placed in:
```
fastlane/screenshots/en-US/
  - iPhone_6.7_inch/
  - iPhone_6.5_inch/
  - iPhone_5.5_inch/
  - iPad_Pro_12.9_inch/
```

Or use `fastlane snapshot` to automatically generate screenshots.

## 🔐 Security Notes

- **API Key Method (Recommended):** More secure, doesn't require password
- **Apple ID Method:** Requires App-Specific Password, less secure
- Never commit API keys or passwords to git

## 📝 Next Steps

1. Set up authentication (API key or Apple ID)
2. Run `fastlane upload_metadata` to upload all metadata
3. Add screenshots to the screenshots directory
4. Run `fastlane upload_app` to upload build and metadata
5. Run `fastlane submit_for_review` when ready

---

**Note:** The first time you run fastlane, it will guide you through setup.

