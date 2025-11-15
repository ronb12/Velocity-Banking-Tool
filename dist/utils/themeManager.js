/**
 * Global Theme Manager
 * Provides theme switching functionality across the entire app
 * Supports: Light, Dark, Fun, and Auto (system preference)
 */

class ThemeManager {
  constructor() {
    // 8 color themes: blue (default), pink, and 5 more
    this.themes = ['blue', 'pink', 'green', 'purple', 'orange', 'teal', 'red', 'auto'];
    this.currentTheme = this.loadTheme();
    this.init();
  }

  init() {
    // Apply saved theme or detect system preference
    this.applyTheme(this.currentTheme);
    
    // Listen for system theme changes (for auto mode)
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.currentTheme === 'auto') {
          this.applyTheme('auto');
        }
      });
    }

    // Make it globally available
    window.themeManager = this;
  }

  loadTheme() {
    // Try to load from localStorage
    const saved = localStorage.getItem('app-theme');
    if (saved && this.themes.includes(saved)) {
      return saved;
    }
    
    // Default to blue theme
    return 'blue';
  }

  saveTheme(theme) {
    localStorage.setItem('app-theme', theme);
  }

  getEffectiveTheme() {
    if (this.currentTheme === 'auto') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'blue-dark'
        : 'blue';
    }
    return this.currentTheme;
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    this.saveTheme(theme);
    
    const effectiveTheme = this.getEffectiveTheme();
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.body.setAttribute('data-theme', effectiveTheme);
    
    // Update theme-color meta tag for mobile browsers
    const themeColor = this.getThemeColor(effectiveTheme);
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = themeColor;

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme: effectiveTheme, selectedTheme: theme }
    }));

    // Track analytics
    if (window.analytics) {
      window.analytics.trackEvent('theme_changed', {
        theme: effectiveTheme,
        selectedTheme: theme,
        isAuto: theme === 'auto'
      });
    }
  }

  getThemeColor(theme) {
    const colors = {
      blue: '#007bff',
      pink: '#ff4b91',
      green: '#28a745',
      purple: '#6f42c1',
      orange: '#fd7e14',
      teal: '#20c997',
      red: '#dc3545',
      'blue-dark': '#1a1a1a'
    };
    return colors[theme] || colors.blue;
  }
  
  getThemeInfo(theme) {
    const themeInfo = {
      blue: { name: 'Blue', icon: '🔵', color: '#007bff' },
      pink: { name: 'Pink', icon: '🌸', color: '#ff4b91' },
      green: { name: 'Green', icon: '🟢', color: '#28a745' },
      purple: { name: 'Purple', icon: '🟣', color: '#6f42c1' },
      orange: { name: 'Orange', icon: '🟠', color: '#fd7e14' },
      teal: { name: 'Teal', icon: '🔷', color: '#20c997' },
      red: { name: 'Red', icon: '🔴', color: '#dc3545' },
      auto: { name: 'Auto', icon: '🔄', color: '#6c757d' }
    };
    return themeInfo[theme] || themeInfo.blue;
  }

  toggleTheme() {
    // Cycle through themes (skip auto for quick toggle)
    const quickThemes = this.themes.filter(t => t !== 'auto');
    const currentIndex = quickThemes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % quickThemes.length;
    this.applyTheme(quickThemes[nextIndex]);
  }

  setTheme(theme) {
    if (this.themes.includes(theme)) {
      this.applyTheme(theme);
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return [...this.themes];
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
  });
} else {
  new ThemeManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}

