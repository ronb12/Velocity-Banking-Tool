// Performance Optimization Utilities
class PerformanceUtils {
  constructor() {
    this.cache = new Map();
    this.debounceTimers = new Map();
    this.observers = new Map();
  }
  
  // Debounce function calls
  debounce(func, wait, key = 'default') {
    return (...args) => {
      clearTimeout(this.debounceTimers.get(key));
      const timer = setTimeout(() => func.apply(this, args), wait);
      this.debounceTimers.set(key, timer);
    };
  }
  
  // Throttle function calls
  throttle(func, limit, key = 'default') {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  // Memoize expensive calculations
  memoize(func, keyGenerator = (...args) => JSON.stringify(args)) {
    return (...args) => {
      const key = keyGenerator(...args);
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }
      const result = func.apply(this, args);
      this.cache.set(key, result);
      return result;
    };
  }
  
  // Lazy load images
  lazyLoadImages() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
  
  // Preload critical resources
  preloadResource(href, as = 'script', crossorigin = false) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
  
  // Prefetch resources for next page
  prefetchResource(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
  
  // Optimize DOM queries
  querySelector(selector, context = document) {
    const cacheKey = `query_${selector}_${context === document ? 'doc' : 'ctx'}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    const element = context.querySelector(selector);
    this.cache.set(cacheKey, element);
    return element;
  }
  
  // Batch DOM updates
  batchDOMUpdates(updates) {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }
  
  // Optimize scroll events
  optimizeScroll(callback, options = {}) {
    const { throttle = 16, passive = true } = options;
    const throttledCallback = this.throttle(callback, throttle);
    
    window.addEventListener('scroll', throttledCallback, { passive });
    
    return () => {
      window.removeEventListener('scroll', throttledCallback);
    };
  }
  
  // Optimize resize events
  optimizeResize(callback, options = {}) {
    const { throttle = 100, passive = true } = options;
    const throttledCallback = this.throttle(callback, throttle);
    
    window.addEventListener('resize', throttledCallback, { passive });
    
    return () => {
      window.removeEventListener('resize', throttledCallback);
    };
  }
  
  // Virtual scrolling for large lists
  createVirtualScroller(container, itemHeight, renderItem, totalItems) {
    const visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
    let scrollTop = 0;
    
    const updateVisibleItems = () => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleItems, totalItems);
      
      container.innerHTML = '';
      
      for (let i = startIndex; i < endIndex; i++) {
        const item = renderItem(i);
        item.style.position = 'absolute';
        item.style.top = `${i * itemHeight}px`;
        item.style.height = `${itemHeight}px`;
        container.appendChild(item);
      }
    };
    
    container.addEventListener('scroll', this.throttle(() => {
      scrollTop = container.scrollTop;
      updateVisibleItems();
    }, 16));
    
    updateVisibleItems();
  }
  
  // Performance monitoring
  measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  }
  
  // Memory usage monitoring
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  }
  
  // Clean up resources
  cleanup() {
    this.cache.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Create global instance
window.PerformanceUtils = new PerformanceUtils();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceUtils;
}
