# Capacitor Setup Guide

This guide explains how to use Capacitor to build native iOS and Android apps from your web application.

## Overview

Capacitor is a cross-platform app runtime that allows you to build iOS, Android, and Progressive Web Apps with a single codebase. Your existing web app runs inside a native container with access to native device features.

## Installation

The Capacitor dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Available Plugins

The following Capacitor plugins are configured:

- **@capacitor/app** - App lifecycle and state management
- **@capacitor/haptics** - Haptic feedback (vibrations)
- **@capacitor/keyboard** - Keyboard control and events
- **@capacitor/status-bar** - Status bar styling
- **@capacitor/preferences** - Native key-value storage
- **@capacitor/network** - Network status monitoring
- **@capacitor/storage** - File-based storage
- **@capacitor/splash-screen** - Splash screen control

## Usage in Your Code

### Importing Capacitor Utilities

The Capacitor utility is automatically initialized when your app loads. You can use it in your JavaScript:

```javascript
import { 
  hapticFeedback, 
  isCapacitorApp, 
  getAppInfo,
  getNetworkStatus,
  setPreference,
  getPreference 
} from '/utils/capacitor.js';

// Check if running in native app
if (isCapacitorApp()) {
  console.log('Running in Capacitor app');
}

// Haptic feedback
await hapticFeedback('medium'); // 'light', 'medium', 'heavy', 'selection', 'notification'

// Get app info
const appInfo = await getAppInfo();
console.log('App version:', appInfo.version);

// Network status
const networkStatus = await getNetworkStatus();
console.log('Connected:', networkStatus.connected);

// Store preferences (uses native storage in app, localStorage in browser)
await setPreference('user-settings', { theme: 'dark' });
const settings = await getPreference('user-settings');
```

### App Lifecycle Events

Listen for app lifecycle events:

```javascript
// App comes to foreground
window.addEventListener('app-foreground', () => {
  console.log('App is now active');
  // Refresh data, resume timers, etc.
});

// App goes to background
window.addEventListener('app-background', () => {
  console.log('App is now in background');
  // Save state, pause operations, etc.
});

// Deep link handling
window.addEventListener('app-url-open', (event) => {
  console.log('App opened with URL:', event.detail.url);
  // Handle deep links
});

// Keyboard events
window.addEventListener('keyboard-show', (event) => {
  console.log('Keyboard height:', event.detail.keyboardHeight);
});

window.addEventListener('keyboard-hide', () => {
  console.log('Keyboard hidden');
});
```

## Development Workflow

### iOS Development

1. **Build your web app:**
   ```bash
   npm run build
   ```

2. **Sync with iOS project:**
   ```bash
   npm run cap:sync
   # or
   npm run cap:ios  # Builds, syncs, and opens Xcode
   ```

3. **Open in Xcode:**
   ```bash
   npm run cap:open:ios
   ```

4. **Run in Xcode:**
   - Select your device or simulator
   - Click the Run button (▶️)

### Android Development

1. **Add Android platform (first time only):**
   ```bash
   npm run cap:add:android
   ```

2. **Build and sync:**
   ```bash
   npm run build
   npm run cap:sync
   # or
   npm run cap:android  # Builds, syncs, and opens Android Studio
   ```

3. **Open in Android Studio:**
   ```bash
   npm run cap:open:android
   ```

## NPM Scripts

- `npm run cap:sync` - Sync web code to native projects
- `npm run cap:copy` - Copy web assets only
- `npm run cap:open:ios` - Open iOS project in Xcode
- `npm run cap:open:android` - Open Android project in Android Studio
- `npm run cap:ios` - Build, sync, and open iOS
- `npm run cap:android` - Build, sync, and open Android
- `npm run cap:add:ios` - Add iOS platform
- `npm run cap:add:android` - Add Android platform
- `npm run cap:update` - Build and sync all platforms

## Configuration

The main configuration is in `capacitor.config.json`. Key settings:

- **appId**: Your app's bundle identifier (e.g., `com.bradleysfinancehub.app`)
- **appName**: Display name of your app
- **webDir**: Directory containing built web assets (`dist`)
- **server**: Development server settings
- **plugins**: Plugin-specific configurations

## Building for Production

### iOS

1. Build your web app:
   ```bash
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npm run cap:sync ios
   ```

3. Open in Xcode:
   ```bash
   npm run cap:open:ios
   ```

4. In Xcode:
   - Select "Any iOS Device" or your connected device
   - Product → Archive
   - Follow the App Store Connect workflow

### Android

1. Build your web app:
   ```bash
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npm run cap:sync android
   ```

3. Open in Android Studio:
   ```bash
   npm run cap:open:android
   ```

4. In Android Studio:
   - Build → Generate Signed Bundle / APK
   - Follow the Play Store workflow

## Live Reload (Development)

For faster development, you can use live reload:

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. In `capacitor.config.json`, set:
   ```json
   "server": {
     "url": "http://localhost:3000",
     "cleartext": true
   }
   ```

3. Sync and run:
   ```bash
   npm run cap:sync
   npm run cap:open:ios  # or cap:open:android
   ```

Your app will load from the dev server and reload automatically when you make changes.

## Troubleshooting

### iOS Issues

- **Build errors**: Run `cd ios/App && pod install` then rebuild
- **Missing plugins**: Run `npm run cap:sync` to ensure plugins are synced
- **Xcode cache**: Product → Clean Build Folder (⇧⌘K)

### Android Issues

- **Gradle sync errors**: In Android Studio, File → Sync Project with Gradle Files
- **Missing plugins**: Run `npm run cap:sync` to ensure plugins are synced
- **Build errors**: Clean and rebuild (Build → Clean Project)

### General Issues

- **Changes not appearing**: Always run `npm run build` before `npm run cap:sync`
- **Plugin not working**: Check that the plugin is installed: `npm list @capacitor/plugin-name`
- **Native code changes**: After modifying native code, rebuild the app in Xcode/Android Studio

## Best Practices

1. **Always build before syncing**: Run `npm run build` before `npm run cap:sync`
2. **Test on real devices**: Simulators/emulators don't support all native features
3. **Use feature detection**: Check `isCapacitorApp()` before using native features
4. **Handle errors gracefully**: Native plugins may not be available in browser
5. **Keep plugins updated**: Regularly update Capacitor and plugins for bug fixes

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [iOS Development Guide](https://capacitorjs.com/docs/ios)
- [Android Development Guide](https://capacitorjs.com/docs/android)

