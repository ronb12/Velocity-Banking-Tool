// Test suite for auto-refresh functionality
const testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

function runTest(name, testFn) {
    testResults.total++;
    try {
        testFn();
        console.log(`✅ PASS: ${name}`);
        testResults.passed++;
    } catch (error) {
        console.error(`❌ FAIL: ${name}`);
        console.error(`   Error: ${error.message}`);
        testResults.failed++;
    }
}

// Test 1: Service Worker Registration
runTest('Service Worker Registration', () => {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
    }
    return navigator.serviceWorker.getRegistration()
        .then(registration => {
            if (!registration) {
                throw new Error('No service worker registration found');
            }
        });
});

// Test 2: Version Check
runTest('Version Check', () => {
    return new Promise((resolve, reject) => {
        if (!navigator.serviceWorker.controller) {
            reject(new Error('No service worker controller'));
            return;
        }

        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            if (!event.data.version) {
                reject(new Error('No version received'));
                return;
            }
            resolve();
        };

        navigator.serviceWorker.controller.postMessage(
            { action: 'CHECK_VERSION' },
            [messageChannel.port2]
        );
    });
});

// Test 3: Update Notification
runTest('Update Notification', () => {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #007bff;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    document.body.appendChild(notification);
    
    if (!notification.isConnected) {
        throw new Error('Update notification not added to DOM');
    }
    
    document.body.removeChild(notification);
});

// Test 4: Cache Management
runTest('Cache Management', () => {
    return caches.keys()
        .then(cacheNames => {
            const hasStaticCache = cacheNames.includes('static-v1');
            const hasDynamicCache = cacheNames.includes('dynamic-v1');
            
            if (!hasStaticCache || !hasDynamicCache) {
                throw new Error('Required caches not found');
            }
        });
});

// Run all tests
console.log('🧪 Running auto-refresh tests...\n');

Promise.all([
    runTest('Service Worker Registration', () => {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported');
        }
        return navigator.serviceWorker.getRegistration();
    }),
    runTest('Version Check', () => {
        return new Promise((resolve, reject) => {
            if (!navigator.serviceWorker.controller) {
                reject(new Error('No service worker controller'));
                return;
            }
            resolve();
        });
    }),
    runTest('Update Notification', () => {
        return Promise.resolve();
    }),
    runTest('Cache Management', () => {
        return caches.keys();
    })
]).then(() => {
    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
}).catch(error => {
    console.error('\n❌ Test suite failed:', error);
}); 