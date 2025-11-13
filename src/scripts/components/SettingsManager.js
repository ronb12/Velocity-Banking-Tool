/**
 * Settings Manager Component
 * Handles user settings (dark mode, notifications, auto-save, etc.)
 */

export class SettingsManager {
  constructor() {
    this.settings = {
      darkMode: false,
      notifications: true,
      autoSave: true,
      showTips: true,
    };
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    // Load dark mode setting
    const darkModeToggle = document.getElementById('settingsDarkMode');
    const darkMode = localStorage.getItem('darkMode') === 'true' || localStorage.getItem('theme') === 'dark';
    
    if (darkModeToggle) {
      darkModeToggle.checked = darkMode;
    }

    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Load other settings
    const notificationsToggle = document.getElementById('settingsNotifications');
    const autoSaveToggle = document.getElementById('settingsAutoSave');
    const showTipsToggle = document.getElementById('settingsShowTips');
    
    if (notificationsToggle) {
      notificationsToggle.checked = localStorage.getItem('notificationsEnabled') !== 'false';
    }
    if (autoSaveToggle) {
      autoSaveToggle.checked = localStorage.getItem('autoSaveEnabled') !== 'false';
    }
    if (showTipsToggle) {
      showTipsToggle.checked = localStorage.getItem('showTipsEnabled') !== 'false';
    }

    // Load saved avatar
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      const avatarImg = document.getElementById('profileAvatar');
      if (avatarImg) {
        avatarImg.src = savedAvatar;
      }
    }
    
    this.settings = {
      darkMode,
      notifications: notificationsToggle?.checked ?? true,
      autoSave: autoSaveToggle?.checked ?? true,
      showTips: showTipsToggle?.checked ?? true,
    };
    
    console.log('Settings loaded - Dark mode:', darkMode);
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    const darkModeToggle = document.getElementById('settingsDarkMode');
    if (!darkModeToggle) {
      console.error('Dark mode toggle not found!');
      return;
    }
    
    const isDarkMode = darkModeToggle.checked;
    
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      localStorage.setItem('darkMode', 'false');
    }
    
    this.settings.darkMode = isDarkMode;
    
    if (typeof window.showNotification === 'function') {
      window.showNotification(`Dark mode ${isDarkMode ? 'enabled' : 'disabled'}`, 'success');
    }
  }

  /**
   * Toggle notifications
   */
  toggleNotifications() {
    const notificationsToggle = document.getElementById('settingsNotifications');
    const enabled = notificationsToggle.checked;
    
    localStorage.setItem('notificationsEnabled', enabled.toString());
    this.settings.notifications = enabled;
    
    if (enabled && 'Notification' in window) {
      Notification.requestPermission();
    }
    
    if (typeof window.showNotification === 'function') {
      window.showNotification(`Notifications ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }
  }

  /**
   * Toggle auto-save
   */
  toggleAutoSave() {
    const autoSaveToggle = document.getElementById('settingsAutoSave');
    const enabled = autoSaveToggle.checked;
    
    localStorage.setItem('autoSaveEnabled', enabled.toString());
    this.settings.autoSave = enabled;
    
    if (typeof window.showNotification === 'function') {
      window.showNotification(`Auto-save ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }
  }

  /**
   * Toggle show tips
   */
  toggleShowTips() {
    const showTipsToggle = document.getElementById('settingsShowTips');
    const enabled = showTipsToggle.checked;
    
    localStorage.setItem('showTipsEnabled', enabled.toString());
    this.settings.showTips = enabled;
    
    const tipsSection = document.querySelector('.financial-education');
    if (tipsSection) {
      tipsSection.style.display = enabled ? 'block' : 'none';
    }
    
    if (typeof window.showNotification === 'function') {
      window.showNotification(`Tips ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }
  }

  /**
   * Handle avatar upload
   * @param {Event} event - File input event
   */
  handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarImg = document.getElementById('profileAvatar');
        if (avatarImg) {
          avatarImg.src = e.target.result;
        }
        
        // Save to localStorage
        localStorage.setItem('userAvatar', e.target.result);
        
        // Show success message
        if (typeof window.showNotification === 'function') {
          window.showNotification('Avatar updated successfully!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  }
}

// Export singleton instance
export const settingsManager = new SettingsManager();

// Make globally available
window.SettingsManager = SettingsManager;
window.settingsManager = settingsManager;

// Export functions for backward compatibility
window.toggleDarkModeSetting = () => settingsManager.toggleDarkMode();
window.toggleNotifications = () => settingsManager.toggleNotifications();
window.toggleAutoSave = () => settingsManager.toggleAutoSave();
window.toggleShowTips = () => settingsManager.toggleShowTips();
window.handleAvatarUpload = (event) => settingsManager.handleAvatarUpload(event);

