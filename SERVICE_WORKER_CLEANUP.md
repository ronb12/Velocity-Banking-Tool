# Service Worker Cleanup Guide

**Date:** 2025-11-14  
**Issue:** Multiple service workers registered  
**Status:** ✅ **FIXED**

## Problem

Multiple service workers were being registered, causing conflicts and confusion. This can happen when:
1. Service workers are registered multiple times at different scopes
2. Old service workers aren't properly cleaned up
3. Different pages register service workers independently

## Solution Applied

### 1. Updated Registration Code

**File:** `index.html`  
**Change:** Updated service worker registration to unregister ALL existing service workers before registering a new one.

**Before:**
- Only checked for ONE registration using `getRegistration()`
- Could leave multiple service workers registered

**After:**
- Gets ALL registrations using `getRegistrations()`
- Unregisters all existing service workers first
- Then registers the correct one at scope `/`

### 2. Cleanup Tool Created

**File:** `unregister-service-workers.html`  
**Location:** Available in both root and `dist/` folder

**Features:**
- Check all registered service workers
- Unregister all service workers
- Clear all caches
- Provides detailed status and results

## How to Use the Cleanup Tool

### Option 1: Use the HTML Tool

1. Open `unregister-service-workers.html` in your browser
2. Click "Check Service Workers" to see what's registered
3. Click "Unregister All Service Workers" to remove them all
4. Optionally click "Clear All Caches" to clear cached data

### Option 2: Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. For each service worker:
   - Click **Unregister** button
   - Verify it's removed

### Option 3: Console Command

Run this in the browser console:

```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    registration.unregister();
    console.log('Unregistered:', registration.scope);
  });
}).then(() => {
  console.log('All service workers unregistered');
  location.reload();
});
```

## Manual Cleanup Steps

1. **Open the live site:** https://mobile-debt-tracker.web.app
2. **Open DevTools:** Press F12
3. **Go to Application tab**
4. **Click Service Workers** in left sidebar
5. **For each service worker:**
   - Note the scope
   - Click "Unregister" button
6. **Clear caches:**
   - Click "Cache Storage" in left sidebar
   - Right-click each cache and select "Delete"
7. **Reload the page**

## Verification

After cleanup, verify:

1. **Check registrations:**
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => {
     console.log('Service workers:', regs.length);
   });
   ```
   Should show: `Service workers: 1` (or 0 if page reloaded)

2. **Check scope:**
   The registered service worker should have scope: `https://mobile-debt-tracker.web.app/`

3. **Check console:**
   Look for: `[SW] ✅ Service Worker registered successfully!`

## Prevention

The updated registration code now:
- ✅ Unregisters all existing service workers before registering
- ✅ Ensures only ONE service worker is registered
- ✅ Prevents duplicate registrations
- ✅ Cleans up old registrations automatically

## Next Steps

1. **Rebuild and deploy:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

2. **After deployment:**
   - Users will need to refresh the page
   - The new registration code will unregister old service workers
   - Only one service worker will remain active

3. **For existing users:**
   - They can use the cleanup tool: `https://mobile-debt-tracker.web.app/unregister-service-workers.html`
   - Or manually unregister via DevTools
   - The new code will prevent duplicates going forward

## Files Changed

1. **index.html** - Updated service worker registration logic
2. **unregister-service-workers.html** - Created cleanup tool (also in dist/)

## Status

✅ **Registration Code Fixed**  
✅ **Cleanup Tool Created**  
✅ **Ready for Deployment**

---

*Cleanup Guide Created: 2025-11-14*
