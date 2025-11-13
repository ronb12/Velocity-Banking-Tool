/**
 * Theme Selector Component
 * Handles theme selection dropdown
 */

export class ThemeSelector {
  constructor() {
    this.button = null;
    this.menu = null;
    this.swatch = null;
    this.text = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    this.button = document.getElementById('themeDropdownButton');
    this.menu = document.getElementById('themeDropdownMenu');
    this.swatch = document.getElementById('themeDropdownSwatch');
    this.text = document.getElementById('themeDropdownText');

    if (!this.button || !this.menu || !this.swatch || !this.text) {
      console.warn('[ThemeSelector] Elements not found, retrying...');
      setTimeout(() => this.init(), 100);
      return;
    }

    if (!window.themeManager) {
      console.warn('[ThemeSelector] ThemeManager not available, retrying...');
      setTimeout(() => this.init(), 100);
      return;
    }

    this.populateMenu();
    this.updateButton();
    this.setupEventListeners();
    this.isInitialized = true;
  }

  populateMenu() {
    if (!window.themeManager) return;

    const themes = window.themeManager.getAvailableThemes();
    const currentTheme = window.themeManager.getCurrentTheme();

    this.menu.innerHTML = '';

    themes.forEach(themeId => {
      const info = window.themeManager.getThemeInfo(themeId);
      if (!info) return;

      const color = window.themeManager.getThemeColor(themeId);
      const isActive = themeId === currentTheme;

      const item = document.createElement('div');
      item.className = `theme-dropdown-item ${isActive ? 'active' : ''}`;
      item.setAttribute('data-theme', themeId);
      item.innerHTML = `
        <span class="theme-dropdown-item-swatch" style="background: ${color};"></span>
        <span class="theme-dropdown-item-icon">${info.icon}</span>
        <span class="theme-dropdown-item-name">${info.name}</span>
        ${isActive ? '<span class="theme-dropdown-item-check">✓</span>' : ''}
      `;
      item.onclick = () => this.selectTheme(themeId);
      this.menu.appendChild(item);
    });
  }

  updateButton() {
    if (!window.themeManager || !this.swatch || !this.text) return;

    const current = window.themeManager.getCurrentTheme();
    const info = window.themeManager.getThemeInfo(current);
    const color = window.themeManager.getThemeColor(current);

    if (info && color) {
      this.swatch.style.background = color;
      this.text.textContent = info.name;
    }
  }

  selectTheme(themeId) {
    if (!window.themeManager) return;

    window.themeManager.setTheme(themeId);
    this.updateButton();
    this.populateMenu();
    this.close();

    if (typeof window.showNotification === 'function') {
      const info = window.themeManager.getThemeInfo(themeId);
      window.showNotification(`Theme changed to ${info.name}`, 'success');
    }
  }

  setupEventListeners() {
    // Toggle dropdown
    this.button.onclick = (e) => {
      e.stopPropagation();
      this.toggle();
    };

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.button.contains(e.target) && !this.menu.contains(e.target)) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Listen for theme changes
    window.addEventListener('themechange', () => {
      this.updateButton();
      this.populateMenu();
    });
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.menu.classList.add('show');
    this.button.classList.add('active');
    this.button.setAttribute('aria-expanded', 'true');
  }

  close() {
    this.menu.classList.remove('show');
    this.button.classList.remove('active');
    this.button.setAttribute('aria-expanded', 'false');
  }

  isOpen() {
    return this.menu.classList.contains('show');
  }
}

// Export singleton instance
export const themeSelector = new ThemeSelector();

// Make globally available
window.ThemeSelector = ThemeSelector;
window.themeSelector = themeSelector;
window.initializeThemeSelector = () => themeSelector.init();

