# Xcode Cloud Setup Guide

## ✅ Configuration Files Added

The following Xcode Cloud configuration files have been added to your project:

1. **`ci_scripts/ci_pre_xcodebuild.sh`** - Pre-build script that runs before Xcode builds
2. **`ci_scripts/ci_post_xcodebuild.sh`** - Post-build script that runs after Xcode builds
3. **`.xcode-version`** - Specifies Xcode 15.0 for builds

## 📋 Next Steps: Configure Xcode Cloud in App Store Connect

To enable Xcode Cloud for your app:

### 1. Open App Store Connect
- Go to: https://appstoreconnect.apple.com
- Sign in with your Apple Developer account

### 2. Navigate to Your App
- Click on "My Apps"
- Select "Bradley's Finance Hub" (or create the app if it doesn't exist)

### 3. Enable Xcode Cloud
- Go to the "TestFlight" tab
- Click on "Xcode Cloud" in the left sidebar
- Click "Get Started" or "Create Workflow"

### 4. Create a Workflow
- **Name:** "Build and Test" (or your preferred name)
- **Repository:** Select your GitHub repository: `ronb12/Bradleys-Financial-Hub`
- **Branch:** `main`
- **Scheme:** `BradleysFinanceHub`
- **Platform:** iOS

### 5. Configure Workflow Steps
- **Build:** Enable (required)
- **Test:** Enable (optional but recommended)
- **Archive:** Enable for App Store builds

### 6. Save and Start
- Click "Save" or "Create"
- Xcode Cloud will start building your app

## 🔧 Workflow Configuration Options

### Build Settings
- **Xcode Version:** 15.0 (specified in `.xcode-version`)
- **Scheme:** BradleysFinanceHub
- **Configuration:** Release (for App Store builds)

### Environment Variables (Optional)
You can add environment variables in App Store Connect:
- `CI_BUILD_NUMBER` - Automatically set
- `CI_WORKFLOW` - Automatically set
- Custom variables as needed

## 📝 Scripts Overview

### Pre-Build Script (`ci_pre_xcodebuild.sh`)
- Verifies project structure
- Prints environment information
- Validates that required files exist

### Post-Build Script (`ci_post_xcodebuild.sh`)
- Verifies build artifacts
- Prints build statistics
- Can be extended for additional validation

## ✅ Verification

After setting up Xcode Cloud in App Store Connect:

1. **First Build:** Xcode Cloud will automatically trigger a build
2. **Check Status:** Monitor builds in App Store Connect → Xcode Cloud
3. **View Logs:** Click on any build to see detailed logs
4. **TestFlight:** Successful builds can be automatically distributed to TestFlight

## 🔗 Resources

- [Xcode Cloud Documentation](https://developer.apple.com/documentation/xcode/xcode-cloud)
- [Xcode Cloud Workflows](https://developer.apple.com/documentation/xcode/xcode-cloud-workflow-reference)
- [App Store Connect](https://appstoreconnect.apple.com)

---

**Note:** Xcode Cloud requires an active Apple Developer Program membership ($99/year).

