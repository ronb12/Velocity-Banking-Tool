# Clear Service Worker Cache Instructions

If you're still seeing MIME type errors (JavaScript files served as HTML), the service worker may have cached incorrect responses. Follow these steps to clear the cache:

## Option 1: Browser DevTools (Recommended)

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Storage** in the left sidebar
4. Click **Clear site data**
5. Check all boxes:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
   - ✅ Service Workers
   - ✅ Cache storage
6. Click **Clear data**
7. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

## Option 2: Manual Service Worker Unregister

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. Click **Unregister** for any registered service workers
5. Go to **Cache Storage** in the left sidebar
6. Right-click each cache and select **Delete**
7. Hard refresh the page

## Option 3: Browser Console

Paste this in the browser console:

```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('Service workers unregistered');
});

// Clear all caches
caches.keys().then(cacheNames => {
  Promise.all(cacheNames.map(name => caches.delete(name))).then(() => {
    console.log('All caches cleared');
    location.reload();
  });
});
```

## Option 4: Use Cleanup Tool

Navigate to: `https://mobile-debt-tracker.web.app/unregister-service-workers.html`

Click the button to unregister all service workers and clear caches.

---

**After clearing cache:** The service worker will re-register and should now correctly serve JavaScript files with proper MIME types.

