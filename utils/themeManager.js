/**
 * Global Theme Manager
 * Provides theme switching functionality across the entire app
 * Supports: Light, Dark, Fun, and Auto (system preference)
 */

class ThemeManager {
  constructor() {
    this.themes = ['light', 'dark', 'fun', 'auto'];
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
    
    // Default to system preference or light
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'auto';
    }
    
    return 'light';
  }

  saveTheme(theme) {
    localStorage.setItem('app-theme', theme);
  }

  getEffectiveTheme() {
    if (this.currentTheme === 'auto') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
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
      light: '#007bff',
      dark: '#1a1a1a',
      fun: '#ff4b91'
    };
    return colors[theme] || colors.light;
  }

  toggleTheme() {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.applyTheme(this.themes[nextIndex]);
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

