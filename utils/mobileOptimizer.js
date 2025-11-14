// Mobile Experience Optimization Utilities
class MobileOptimizer {
  constructor() {
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.isScrolling = false;
    this.swipeThreshold = 50;
    this.tapThreshold = 10;
    this.lastTap = 0;
    this.doubleTapDelay = 300;
  }
  
  // Initialize mobile optimizations
  init() {
    this.setupTouchEvents();
    this.setupSwipeGestures();
    this.setupPullToRefresh();
    this.optimizeViewport();
    this.setupKeyboardHandling();
    this.setupHapticFeedback();
  }
  
  // Setup touch events for better mobile interaction
  setupTouchEvents() {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
    
    // Optimize touch targets
    this.optimizeTouchTargets();
    
    // Add touch feedback
    this.addTouchFeedback();
  }
  
  // Optimize touch targets to be at least 44px
  optimizeTouchTargets() {
    const touchElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    
    touchElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = 44;
      
      if (rect.width < minSize || rect.height < minSize) {
        element.style.minWidth = `${minSize}px`;
        element.style.minHeight = `${minSize}px`;
        element.style.padding = '12px';
      }
    });
  }
  
  // Add visual touch feedback
  addTouchFeedback() {
    const addTouchClass = (element) => {
      element.addEventListener('touchstart', () => {
        element.classList.add('touch-active');
      });
      
      element.addEventListener('touchend', () => {
        setTimeout(() => {
          element.classList.remove('touch-active');
        }, 150);
      });
      
      element.addEventListener('touchcancel', () => {
        element.classList.remove('touch-active');
      });
    };
    
    // Add to all interactive elements
    document.querySelectorAll('button, a, [role="button"]').forEach(addTouchClass);
  }
  
  // Setup swipe gestures for navigation
  setupSwipeGestures() {
    let startX, startY, endX, endY;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // Horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
        if (deltaX > 0) {
          this.handleSwipeRight();
        } else {
          this.handleSwipeLeft();
        }
      }
      
      // Vertical swipe
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > this.swipeThreshold) {
        if (deltaY > 0) {
          this.handleSwipeDown();
        } else {
          this.handleSwipeUp();
        }
      }
    });
  }
  
  // Handle swipe gestures
  handleSwipeRight() {
    // Go back in history
    if (window.history.length > 1) {
      window.history.back();
    }
  }
  
  handleSwipeLeft() {
    // Could be used for next page or close modal
    const modal = document.querySelector('.modal, .profile-modal');
    if (modal && modal.style.display !== 'none') {
      modal.style.display = 'none';
    }
  }
  
  handleSwipeUp() {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  handleSwipeDown() {
    // Could trigger pull to refresh
    this.triggerPullToRefresh();
  }
  
  // Setup pull to refresh
  setupPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let pullElement = null;
    
    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    });
    
    document.addEventListener('touchmove', (e) => {
      if (!isPulling) return;
      
      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 0) {
        e.preventDefault();
        
        if (pullDistance > 100 && !pullElement) {
          this.showPullToRefresh();
        }
        
        if (pullElement) {
          pullElement.style.transform = `translateY(${Math.min(pullDistance * 0.5, 100)}px)`;
        }
      }
    });
    
    document.addEventListener('touchend', () => {
      if (isPulling && currentY - startY > 100) {
        this.triggerRefresh();
      }
      
      if (pullElement) {
        pullElement.style.transform = 'translateY(-100%)';
        setTimeout(() => {
          if (pullElement) {
            pullElement.remove();
            pullElement = null;
          }
        }, 300);
      }
      
      isPulling = false;
    });
  }
  
  // Show pull to refresh indicator
  showPullToRefresh() {
    pullElement = document.createElement('div');
    pullElement.className = 'pull-to-refresh';
    pullElement.innerHTML = `
      <div class="pull-to-refresh-content">
        <div class="spinner"></div>
        <p>Pull to refresh</p>
      </div>
    `;
    
    pullElement.style.cssText = `
      position: fixed;
      top: -100px;
      left: 0;
      right: 0;
      height: 100px;
      background: var(--card);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(pullElement);
  }
  
  // Trigger refresh
  triggerRefresh() {
    // Use safe reload wrapper if available to prevent reload loops
    if (window.safeLocationReload) {
      window.safeLocationReload();
    } else {
      // Check reload guard before reloading
      const reloadHistory = JSON.parse(sessionStorage.getItem('reload-history') || '[]');
      const now = Date.now();
      const recent = reloadHistory.filter(t => (now - t) < 10000);
      
      if (recent.length < 2 && sessionStorage.getItem('reload-blocked') !== 'true') {
        window.location.reload();
      } else {
        console.warn('[Mobile Optimizer] Reload blocked by reload guard');
      }
    }
  }
  
  // Optimize viewport for mobile
  optimizeViewport() {
    // Add viewport meta tag if not present
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(viewport);
    }
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.optimizeTouchTargets();
      }, 100);
    });
  }
  
  // Setup keyboard handling for mobile
  setupKeyboardHandling() {
    // Handle virtual keyboard
    let initialViewportHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      if (heightDifference > 150) {
        // Keyboard is open
        document.body.classList.add('keyboard-open');
        this.scrollToActiveElement();
      } else {
        // Keyboard is closed
        document.body.classList.remove('keyboard-open');
      }
    });
  }
  
  // Scroll to active element when keyboard opens
  scrollToActiveElement() {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.scrollIntoView) {
      setTimeout(() => {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }
  
  // Setup haptic feedback
  setupHapticFeedback() {
    if ('vibrate' in navigator) {
      // Add haptic feedback to buttons
      document.querySelectorAll('button, [role="button"]').forEach(button => {
        button.addEventListener('click', () => {
          navigator.vibrate(10); // Short vibration
        });
      });
    }
  }
  
  // Handle double tap
  setupDoubleTap(element, callback) {
    let lastTap = 0;
    
    element.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < this.doubleTapDelay && tapLength > 0) {
        e.preventDefault();
        callback(e);
      }
      
      lastTap = currentTime;
    });
  }
  
  // Optimize form inputs for mobile
  optimizeFormInputs() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      // Set appropriate input types
      if (input.type === 'text' && input.name.includes('email')) {
        input.type = 'email';
        input.inputMode = 'email';
      } else if (input.name.includes('phone') || input.name.includes('number')) {
        input.type = 'tel';
        input.inputMode = 'numeric';
      } else if (input.name.includes('amount') || input.name.includes('price')) {
        input.type = 'number';
        input.inputMode = 'decimal';
      }
      
      // Add mobile-friendly attributes
      input.setAttribute('autocomplete', 'on');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('spellcheck', 'false');
    });
  }
  
  // Handle app state changes
  setupAppStateHandling() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // App is in background
        this.handleAppBackground();
      } else {
        // App is in foreground
        this.handleAppForeground();
      }
    });
  }
  
  // Handle app going to background
  handleAppBackground() {
    // Pause any animations or timers
    document.body.classList.add('app-background');
  }
  
  // Handle app coming to foreground
  handleAppForeground() {
    // Resume animations or timers
    document.body.classList.remove('app-background');
    
    // Refresh data if needed
    if (window.refreshData) {
      window.refreshData();
    }
  }
  
  // Get device information
  getDeviceInfo() {
    return {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isAndroid: /Android/.test(navigator.userAgent),
      hasTouch: 'ontouchstart' in window,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }
  
  // Initialize all optimizations
  initAll() {
    this.init();
    this.optimizeFormInputs();
    this.setupAppStateHandling();
    
    // Log device info for debugging
    console.log('Device Info:', this.getDeviceInfo());
  }
}

// Create global instance and initialize
window.MobileOptimizer = new MobileOptimizer();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.MobileOptimizer.initAll();
  });
} else {
  window.MobileOptimizer.initAll();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileOptimizer;
}
