# Immediate Service Worker Cleanup

## Quick Fix - Run This in Browser Console

Open your browser console (F12) and run this code:

```javascript
// Unregister all service workers immediately
(async function() {
  console.log('Starting service worker cleanup...');
  
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Workers not supported');
    return;
  }
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`Found ${registrations.length} service worker(s)`);
    
    if (registrations.length === 0) {
      console.log('✅ No service workers found');
      return;
    }
    
    // Unregister all
    const results = await Promise.all(
      registrations.map(async (reg, index) => {
        const scope = reg.scope;
        const unregistered = await reg.unregister();
        console.log(`${unregistered ? '✅' : '⚠️'} Service Worker #${index + 1}: ${scope}`);
        return unregistered;
      })
    );
    
    const successCount = results.filter(r => r).length;
    console.log(`\n✅ Unregistered ${successCount} out of ${registrations.length} service worker(s)`);
    
    // Clear all caches
    const cacheNames = await caches.keys();
    console.log(`\nFound ${cacheNames.length} cache(s)`);
    
    await Promise.all(
      cacheNames.map(async (name) => {
        await caches.delete(name);
        console.log(`✅ Deleted cache: ${name}`);
      })
    );
    
    console.log('\n🔄 Reloading page in 2 seconds...');
    setTimeout(() => location.reload(), 2000);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

## Alternative: Use the Cleanup Tool

1. Go to: https://mobile-debt-tracker.web.app/unregister-service-workers.html
2. Click "Check Service Workers" to see what's registered
3. Click "Unregister All Service Workers" to remove them all
4. Optionally click "Clear All Caches" to clear cached data

## Manual Steps

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. For each service worker, click **Unregister**
5. Go to **Cache Storage** in left sidebar
6. Right-click each cache → **Delete**
7. Reload the page

---

*After cleanup, the updated code will prevent duplicate registrations.*
